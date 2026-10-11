import unittest
import io
import os
import sys
from unittest.mock import patch, MagicMock
from PIL import Image

# Ensure project root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.services.facility_service import haversine_distance, search_facilities
from backend.app.services.image_preprocessor import validate_prescription_file
from backend.app.services.ocr_service import process_prescription_ocr, parse_clinical_regex_medicines, deduplicate_extracted_items
from backend.app.services.cost_service import estimate_cost
from backend.app.models.schemas import CostEstimateRequest
from backend.app.services.fuzzy_medicine_matcher import match_extracted_medicine
from backend.app.data.medicine_data import calculate_course_cost
from backend.app.data.india_geography import resolve_location, reverse_geocode_coordinates, get_tier_label
from fastapi import HTTPException


class TestGPSAndLocationAccuracy(unittest.TestCase):
    """Regression tests for GPS distance calculation, coordinate ordering, and facility search."""

    def test_haversine_known_distances(self):
        # Hyderabad (Charminar/City Center) to Mumbai (CST) ~ 620 km
        hyd_lat, hyd_lng = 17.3850, 78.4867
        mum_lat, mum_lng = 19.0760, 72.8777
        dist_km = haversine_distance(hyd_lat, hyd_lng, mum_lat, mum_lng)
        self.assertIsNotNone(dist_km)
        self.assertTrue(600 <= dist_km <= 650, f"Expected ~620km, got {dist_km}")

        # Hyderabad (Banjara Hills) to Secunderabad ~ 8 km
        banjara_lat, banjara_lng = 17.4156, 78.4357
        sec_lat, sec_lng = 17.4399, 78.4983
        dist_local = haversine_distance(banjara_lat, banjara_lng, sec_lat, sec_lng)
        self.assertIsNotNone(dist_local)
        self.assertTrue(5.0 <= dist_local <= 12.0, f"Expected 5-12km, got {dist_local}")

    def test_haversine_coordinate_validation(self):
        # Invalid latitude out of [-90, 90]
        self.assertIsNone(haversine_distance(95.0, 78.0, 17.0, 78.0))
        self.assertIsNone(haversine_distance(-95.0, 78.0, 17.0, 78.0))

        # Invalid longitude out of [-180, 180]
        self.assertIsNone(haversine_distance(17.0, 190.0, 17.0, 78.0))
        self.assertIsNone(haversine_distance(17.0, -185.0, 17.0, 78.0))

        # None or non-numeric values
        self.assertIsNone(haversine_distance(None, 78.0, 17.0, 78.0))
        self.assertIsNone(haversine_distance(17.0, None, 17.0, 78.0))
        self.assertIsNone(haversine_distance(17.0, 78.0, None, 78.0))
        self.assertIsNone(haversine_distance("invalid", 78.0, 17.0, 78.0))

    def test_missing_and_invalid_hospital_coordinates(self):
        # Searching facilities with nearest sort and valid lat/lng
        results = search_facilities(
            user_lat=17.4399,
            user_lng=78.4806,
            sort_by="nearest"
        )
        self.assertTrue(len(results) > 0)

        # Distances must be sorted ascending for records that have distances
        valid_distances = [r.distance_km for r in results if r.distance_km is not None]
        self.assertEqual(valid_distances, sorted(valid_distances))

        # Records with None distance must appear at the end, not crash
        none_distances = [r for r in results if r.distance_km is None]
        if none_distances and valid_distances:
            first_none_idx = next(i for i, r in enumerate(results) if r.distance_km is None)
            last_valid_idx = max(i for i, r in enumerate(results) if r.distance_km is not None)
            self.assertGreater(first_none_idx, last_valid_idx)

    def test_radius_filtering_with_gps(self):
        # Center in Hyderabad, radius 15 km
        tight_results = search_facilities(
            user_lat=17.4399,
            user_lng=78.4806,
            radius_km=15.0
        )
        for fac in tight_results:
            self.assertIsNotNone(fac.distance_km)
            self.assertLessEqual(fac.distance_km, 15.0)

        # Wide radius 100 km should return equal or more facilities
        wide_results = search_facilities(
            user_lat=17.4399,
            user_lng=78.4806,
            radius_km=100.0
        )
        self.assertGreaterEqual(len(wide_results), len(tight_results))

    def test_manual_search_without_gps(self):
        # Manual search by city name without GPS coordinates
        results = search_facilities(query_city="Hyderabad")
        self.assertTrue(len(results) > 0)
        for fac in results:
            self.assertEqual(fac.city.lower(), "hyderabad")

    def test_nizampet_gps_resolution_and_tier_label(self):
        """Simulated Nizampet-area GPS coordinates must resolve to Nizampet, valid PIN, and proper tier label without undefined."""
        # Nizampet coordinates
        lat, lng = 17.516046, 78.371379

        # Test reverse_geocode_coordinates with mock Nominatim
        import json
        with patch('urllib.request.urlopen') as mock_urlopen:
            mock_res = MagicMock()
            mock_res.read.return_value = json.dumps({
                "address": {
                    "suburb": "Nizampet",
                    "city": "Hyderabad",
                    "state": "Telangana",
                    "postcode": "500090"
                }
            }).encode("utf-8")
            mock_urlopen.return_value.__enter__.return_value = mock_res

            geo_res = reverse_geocode_coordinates(lat, lng)
            self.assertEqual(geo_res.get("locality"), "Nizampet")
            self.assertEqual(geo_res.get("pin_code"), "500090")
            self.assertEqual(geo_res.get("city"), "Hyderabad")
            self.assertEqual(geo_res.get("state"), "Telangana")

        # Test resolve_location preserving exact user GPS coordinates
        loc = resolve_location(user_lat=lat, user_lng=lng)
        self.assertEqual(loc["lat"], lat, "Latitude must be preserved from browser GPS")
        self.assertEqual(loc["lng"], lng, "Longitude must be preserved from browser GPS")
        self.assertIn(loc["locality"], ["Nizampet", "Miyapur"])
        self.assertNotEqual(loc["pin_code"], "500001", "Must not fallback to hardcoded 500001")
        self.assertIsNotNone(loc["tier_label"])
        self.assertNotIn("undefined", loc["tier_label"].lower())
        self.assertNotIn("null", loc["tier_label"].lower())

    def test_reverse_geocoding_timeout_and_offline_resilience(self):
        """When reverse geocoding times out, coords must be preserved and no fabricated address returned."""
        outskirts_lat, outskirts_lng = 17.6543, 78.1234

        with patch('backend.app.data.india_geography.reverse_geocode_coordinates', side_effect=Exception("Geocoding timeout")):
            loc = resolve_location(user_lat=outskirts_lat, user_lng=outskirts_lng)
            # Actual coordinates MUST be preserved
            self.assertEqual(loc["lat"], outskirts_lat)
            self.assertEqual(loc["lng"], outskirts_lng)
            # Tier label must not be undefined or null
            self.assertIsNotNone(loc.get("tier_label"))
            self.assertNotIn("undefined", str(loc.get("tier_label")).lower())

    def test_switching_gps_to_manual_city_clears_stale_gps(self):
        """Switching from GPS to manual selection must use manual city coordinates and clear GPS locality."""
        # First resolve with GPS
        gps_loc = resolve_location(user_lat=17.5160, user_lng=78.3713)
        self.assertIn(gps_loc["locality"], ["Nizampet", "Miyapur"])

        # Now user selects "Pune" manually (user_lat and user_lng are None)
        manual_loc = resolve_location(city="Pune")
        self.assertEqual(manual_loc["city"], "Pune")
        self.assertEqual(manual_loc["state"], "Maharashtra")
        # Ensure Pune coordinates are used, not stale Nizampet GPS
        self.assertAlmostEqual(manual_loc["lat"], 18.5204, places=2)
        self.assertAlmostEqual(manual_loc["lng"], 73.8567, places=2)
        # Locality should NOT be Nizampet or Miyapur
        self.assertNotIn(manual_loc.get("locality"), ["Nizampet", "Miyapur"])

    def test_prevent_city_centre_fallback_overwriting_gps(self):
        """User GPS coordinates must never be replaced by city center coordinates."""
        custom_lat, custom_lng = 17.5255, 78.3688
        loc = resolve_location(city="Hyderabad", user_lat=custom_lat, user_lng=custom_lng)
        self.assertEqual(loc["lat"], custom_lat)
        self.assertEqual(loc["lng"], custom_lng)
        # Hyderabad centroid is 17.3850, 78.4867; custom GPS must NOT be overwritten by centroid
        self.assertNotEqual(loc["lat"], 17.3850)


class TestPrescriptionOCRAndCostPipeline(unittest.TestCase):
    """Regression tests for file validation, OCR extraction, catalogue matching, and cost estimator."""

    def _create_synthetic_image(self, format="JPEG", size=(200, 200), color=(255, 255, 255)):
        img = Image.new("RGB", size, color=color)
        buf = io.BytesIO()
        img.save(buf, format=format)
        return buf.getvalue()

    def test_file_validation_valid_formats(self):
        # Valid synthetic JPEG
        jpeg_bytes = self._create_synthetic_image(format="JPEG")
        valid, msg = validate_prescription_file("prescription.jpg", "image/jpeg", len(jpeg_bytes), jpeg_bytes)
        self.assertTrue(valid)

        # Valid synthetic PNG
        png_bytes = self._create_synthetic_image(format="PNG")
        valid, msg = validate_prescription_file("prescription.png", "image/png", len(png_bytes), png_bytes)
        self.assertTrue(valid)

        # Valid synthetic WEBP
        webp_bytes = self._create_synthetic_image(format="WEBP")
        valid, msg = validate_prescription_file("rx.webp", "image/webp", len(webp_bytes), webp_bytes)
        self.assertTrue(valid)

    def test_file_validation_unsupported_and_corrupted(self):
        # Unsupported file extension
        valid, msg = validate_prescription_file("malicious.exe", "application/x-msdownload", 1024, b"MZ\x90\x00")
        self.assertFalse(valid)
        self.assertIn("Unsupported file type", msg)

        # File exceeding size limit (> 10MB)
        valid, msg = validate_prescription_file("huge.jpg", "image/jpeg", 11 * 1024 * 1024, b"test")
        self.assertFalse(valid)
        self.assertIn("exceeds maximum limit of 10 MB", msg)

        # Corrupted image bytes (extension says jpg, but bytes are random garbage)
        corrupted_bytes = b"NOT_A_VALID_JPEG_HEADER_CORRUPTED_STREAM"
        valid, msg = validate_prescription_file("corrupt.jpg", "image/jpeg", len(corrupted_bytes), corrupted_bytes)
        self.assertFalse(valid)
        self.assertIn("Corrupted or unreadable image", msg)

    def test_empty_ocr_does_not_fabricate(self):
        # Synthetic blank image with no doctor writing
        blank_bytes = self._create_synthetic_image(format="JPEG")
        ocr_res = process_prescription_ocr(file_bytes=blank_bytes)
        self.assertIsNotNone(ocr_res)
        self.assertLessEqual(ocr_res.confidence_score, 0.5)
        self.assertEqual(len(ocr_res.detected_medicines), 0)

    def test_procedure_matching_canonical_catalogue(self):
        # Test sample with Knee Replacement TKR
        res = process_prescription_ocr(None, filename="prescription_knee_tkr.jpg")
        self.assertIsNotNone(res)
        self.assertEqual(res.canonical_treatment_id, "knee_replacement")
        self.assertIn("Total Knee Replacement", res.canonical_treatment_name)

        # Test sample with Cataract
        res_cataract = process_prescription_ocr(None, filename="cataract_eye_rx.jpg")
        self.assertIsNotNone(res_cataract)
        self.assertEqual(res_cataract.canonical_treatment_id, "cataract_surgery")
        self.assertIn("Cataract", res_cataract.canonical_treatment_name)

        # Test sample with MRI Brain
        res_mri = process_prescription_ocr(None, filename="mri_brain_neuro.jpg")
        self.assertIsNotNone(res_mri)
        self.assertEqual(res_mri.canonical_treatment_id, "mri_brain")

    def test_treatment_to_cost_estimator_success(self):
        # Verify canonical treatment ID mapped from prescription feeds the cost estimator
        req = CostEstimateRequest(
            treatment="knee_replacement",
            city="Hyderabad"
        )
        estimate = estimate_cost(req)
        self.assertIsNotNone(estimate)
        canonical_id = getattr(estimate.canonical_treatment, 'id', None) or estimate.canonical_treatment.get('id')
        self.assertEqual(canonical_id, "knee_replacement")
        self.assertGreaterEqual(estimate.overall_min, 0)
        self.assertGreater(estimate.overall_max, 50000)
        self.assertTrue(len(estimate.tier_comparisons) > 0)
        self.assertTrue(estimate.confidence in ["High", "Medium"])
        self.assertTrue(len(estimate.disclaimer) > 0)

    def test_cost_estimator_rejects_unsupported_treatment(self):
        # Cost estimator must return 404 rather than silently defaulting to knee replacement
        req = CostEstimateRequest(
            treatment="unsupported_exotic_procedure_xyz_999",
            city="Hyderabad"
        )
        with self.assertRaises(HTTPException) as cm:
            estimate_cost(req)
        self.assertEqual(cm.exception.status_code, 404)
        self.assertIn("No supported clinical treatment matches", cm.exception.detail)

    def test_three_medicine_test_prescription_faithful_extraction(self):
        """The three-medicine prescription must produce exactly 3 entries without list numbers or duplicate Dolo."""
        rx_lines = [
            "1. Metoprolol Succinate 50 mg ER Tablets — Take 1 tablet by mouth once daily. Quantity: 30. Refills: 3.",
            "2. Aspirin 81 mg Enteric Coated Tablets — Take 1 tablet by mouth once daily. Quantity: 90. Refills: 5.",
            "3. Atorvastatin 20 mg Tablets — Take 1 tablet by mouth at bedtime. Quantity: 30. Refills: 3."
        ]

        extracted = parse_clinical_regex_medicines(rx_lines)

        # Must be exactly 3 items, NOT 6
        self.assertEqual(len(extracted), 3, f"Expected 3 medicines, got {len(extracted)}: {[m.get('name_as_written') for m in extracted]}")

        names = [m.get("brand_name") or m.get("name_as_written") for m in extracted]
        # Never interpret list numbering as a medicine name
        self.assertNotIn("1", names)
        self.assertNotIn("2", names)
        self.assertNotIn("3", names)
        for name in names:
            self.assertFalse(name.strip().isdigit(), f"Medicine name cannot be pure digits: {name}")

        # Check Metoprolol Succinate
        meto = next((m for m in extracted if "metoprolol" in (m.get("brand_name", "") + " " + m.get("generic_name", "") + " " + m.get("name_as_written", "")).lower()), None)
        self.assertIsNotNone(meto, "Metoprolol Succinate must be extracted")
        self.assertEqual(meto.get("strength"), "50 mg")
        self.assertEqual(meto.get("quantity"), 30)

        # Check Aspirin 81 mg
        asp = next((m for m in extracted if "aspirin" in (m.get("brand_name", "") + " " + m.get("generic_name", "") + " " + m.get("name_as_written", "")).lower()), None)
        self.assertIsNotNone(asp, "Aspirin must be extracted")
        self.assertEqual(asp.get("strength"), "81 mg")
        self.assertEqual(asp.get("quantity"), 90)

        # Check Atorvastatin 20 mg
        ator = next((m for m in extracted if "atorvastatin" in (m.get("brand_name", "") + " " + m.get("generic_name", "") + " " + m.get("name_as_written", "")).lower()), None)
        self.assertIsNotNone(ator, "Atorvastatin must be extracted")
        self.assertEqual(ator.get("strength"), "20 mg")
        self.assertEqual(ator.get("quantity"), 30)

        # Ensure NO unsupported substitution of Dolo 650 or Paracetamol
        for m in extracted:
            combined = (m.get("brand_name", "") + " " + m.get("generic_name", "") + " " + m.get("name_as_written", "")).lower()
            self.assertNotIn("dolo", combined)
            self.assertNotIn("paracetamol", combined)

        # Match medicines against catalogue
        matched_meto = match_extracted_medicine(meto)
        matched_asp = match_extracted_medicine(asp)
        matched_ator = match_extracted_medicine(ator)

        self.assertTrue(matched_meto["is_verified"], "Metoprolol 50 ER should match catalogue")
        self.assertTrue(matched_asp["is_verified"], "Aspirin 81 EC should match catalogue")
        self.assertTrue(matched_ator["is_verified"], "Atorvastatin 20 should match catalogue")

        # Test Course Cost calculation with 3 medicines
        course_items = [
            {"medicine_id": matched_meto["matched_medicine_id"], "quantity": 30},
            {"medicine_id": matched_asp["matched_medicine_id"], "quantity": 90},
            {"medicine_id": matched_ator["matched_medicine_id"], "quantity": 30}
        ]
        cost_res = calculate_course_cost(course_items)
        self.assertEqual(cost_res["verified_items_count"], 3)
        self.assertEqual(cost_res["unverified_items_count"], 0)
        self.assertGreater(cost_res["potential_generic_savings"], 0)
        self.assertFalse(cost_res["has_unverified_items"])

    def test_deduplication_between_ocr_and_gemini_vision(self):
        """Prevent duplicate entries when both OCR and Gemini Vision detect the same medicine."""
        items = [
            {"brand_name": "Aspirin 81 mg", "strength": "81 mg", "form": "Enteric Coated Tablet", "quantity": 90},
            {"brand_name": "Tab Aspirin 81mg", "strength": "81 mg", "form": "Tablet", "quantity": 90},
            {"brand_name": "Atorvastatin 20 mg", "strength": "20 mg", "form": "Tablet", "quantity": 30}
        ]
        deduped = deduplicate_extracted_items(items)
        self.assertEqual(len(deduped), 2, "Duplicate Aspirin entries must be resolved into 1")

    def test_unverified_medicine_pricing_excluded_from_savings(self):
        """Unverified items must not produce false high savings percentage or be priced as verified."""
        items = [{"name": "ExperimentalCompoundXYZ 999mg", "quantity": 10}]
        res = calculate_course_cost(items)
        self.assertTrue(res["has_unverified_items"])
        self.assertEqual(res["verified_items_count"], 0)
        self.assertEqual(res["unverified_items_count"], 1)
        # Savings must be 0, NOT fake 77%
        self.assertEqual(res["potential_generic_savings"], 0.0)
        self.assertEqual(res["potential_savings_percentage"], 0)
        self.assertTrue(res["unverified_items_excluded_from_total"])


if __name__ == '__main__':
    unittest.main()
