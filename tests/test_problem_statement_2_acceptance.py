import unittest
import os
import sys
from fastapi.testclient import TestClient

# Ensure project root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.main import app
from backend.app.services.cost_service import estimate_cost
from backend.app.models.schemas import CostEstimateRequest
from backend.app.data.india_geography import reverse_geocode_coordinates
from backend.app.services.ocr_service import deduplicate_extracted_items
from backend.app.services.data_quality_service import get_data_quality_report
from fastapi import HTTPException

client = TestClient(app)

class TestProblemStatement2Acceptance(unittest.TestCase):
    """
    Acceptance and regression test suite for Problem Statement 2:
    Out-of-Pocket Healthcare Expenditure Prediction and Reduction.
    """

    def test_diagnostic_cost_prediction_mri(self):
        """Verify MRI scan diagnostic procedure provides imaging-specific components without surgical OT."""
        # Test general location search (includes free government option)
        req = CostEstimateRequest(
            treatment="mri brain",
            city="Hyderabad"
        )
        res = estimate_cost(req)
        self.assertIsNotNone(res)
        self.assertEqual(res.canonical_treatment.id, "mri_brain")
        self.assertEqual(res.overall_min, 0)  # Free under Government / Public Health
        self.assertGreater(res.overall_max, 4500)

        # Test private tier estimation
        req_pvt = CostEstimateRequest(
            treatment="mri brain",
            city="Hyderabad",
            ownership_preference="Private"
        )
        res_pvt = estimate_cost(req_pvt)
        self.assertGreater(res_pvt.overall_min, 4000)

        # Check itemized breakdown does NOT charge surgical OT or joint implants
        comp_names = [c.component_name.lower() for c in res.detailed_components]
        self.assertTrue(any("mri" in n or "magnet" in n or "imaging" in n or "scan" in n for n in comp_names))
        self.assertTrue(any("radiologist" in n for n in comp_names))
        self.assertFalse(any("joint prosthesis" in n or "coronary stent" in n for n in comp_names))

        # Check diagnostic checklist is imaging-specific
        q_text = " ".join(res.checklists.questions_to_ask).lower()
        self.assertTrue("contrast" in q_text or "creatinine" in q_text or "pacemaker" in q_text or "implant" in q_text)

    def test_diagnostic_cost_prediction_blood_tests(self):
        """Verify pathology routine blood tests provides lab-specific components."""
        req = CostEstimateRequest(
            treatment="blood test",
            city="Hyderabad"
        )
        res = estimate_cost(req)
        self.assertIsNotNone(res)
        self.assertEqual(res.canonical_treatment.id, "blood_tests")
        comp_names = [c.component_name.lower() for c in res.detailed_components]
        self.assertTrue(any("hematology" in n or "biochemistry" in n or "immunoassay" in n for n in comp_names))
        self.assertTrue(any("pathologist" in n for n in comp_names))
        self.assertTrue(any("phlebotomy" in n or "vacutainers" in n for n in comp_names))

    def test_hemodialysis_cost_prediction(self):
        """Verify Hemodialysis provides dialysis consumables and nurse/tech components."""
        req = CostEstimateRequest(
            treatment="hemodialysis",
            city="Hyderabad"
        )
        res = estimate_cost(req)
        self.assertIsNotNone(res)
        self.assertEqual(res.canonical_treatment.id, "hemodialysis")
        comp_names = [c.component_name.lower() for c in res.detailed_components]
        self.assertTrue(any("dialyzer" in n or "membrane" in n or "bicarbonate" in n for n in comp_names))
        self.assertTrue(any("nurse" in n or "technician" in n for n in comp_names))

    def test_surgical_cost_prediction_knee_replacement(self):
        """Verify Total Knee Replacement includes OT, statutory capped implant, and stay."""
        # General search with Government option
        req = CostEstimateRequest(
            treatment="Total Knee Replacement (TKR)",
            city="Hyderabad"
        )
        res = estimate_cost(req)
        self.assertIsNotNone(res)
        self.assertEqual(res.canonical_treatment.id, "knee_replacement")
        self.assertEqual(res.overall_min, 0)
        self.assertGreaterEqual(res.overall_max, 280000)

        # Private provider tier
        req_pvt = CostEstimateRequest(
            treatment="Total Knee Replacement (TKR)",
            city="Hyderabad",
            ownership_preference="Private"
        )
        res_pvt = estimate_cost(req_pvt)
        self.assertGreaterEqual(res_pvt.overall_min, 110000)

        comp_names = [c.component_name.lower() for c in res.detailed_components]
        self.assertTrue(any("implant" in n or "prosthesis" in n for n in comp_names))
        self.assertTrue(any("operation theatre" in n or "surgeon" in n for n in comp_names))

    def test_unknown_treatment_raises_transparent_error(self):
        """Verify unknown or unsupported procedures raise 404 transparently without fabricating prices."""
        req = CostEstimateRequest(
            treatment="Experimental Gene Therapy XYZ 999",
            city="Hyderabad"
        )
        with self.assertRaises(HTTPException) as ctx:
            estimate_cost(req)
        self.assertEqual(ctx.exception.status_code, 404)
        self.assertIn("no supported clinical treatment matches", ctx.exception.detail.lower())

    def test_nizampet_gps_reverse_geocoding(self):
        """Verify Nizampet GPS coordinates (17.5169, 78.3844) resolve locality without generic fallback."""
        geo = reverse_geocode_coordinates(17.5169, 78.3844)
        self.assertIsNotNone(geo)
        self.assertIn(geo["city"], ["Nizampet", "Hyderabad"])
        self.assertEqual(geo["state"], "Telangana")
        self.assertIn("Nizampet", geo["locality"])
        self.assertEqual(geo["pin_code"], "500090")
        self.assertNotEqual(geo["pin_code"], "500001")

    def test_admin_data_quality_report(self):
        """Verify Admin Data Quality Report inspects canonical DB and reports verified metrics."""
        report = get_data_quality_report()
        self.assertTrue(report.database_path.endswith("caresaathi.db"))
        self.assertGreater(report.database_size_bytes, 100000)
        self.assertEqual(report.total_facilities, 69)
        self.assertEqual(report.facilities_with_gps, 69)
        self.assertEqual(report.total_treatments, 17)
        self.assertGreaterEqual(report.diagnostics_count, 4)
        self.assertGreaterEqual(report.total_packages, 12)
        self.assertGreaterEqual(report.packages_with_statutory_codes, 12)
        self.assertGreaterEqual(report.total_empanelments, 28)
        self.assertGreaterEqual(report.empanelments_verified_procedure, 20)
        self.assertEqual(len(report.anomalies_detected), 0)

        # Test endpoint via HTTP
        resp = client.get("/api/admin/data-quality-report")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["total_facilities"], 69)
        self.assertEqual(data["total_treatments"], 17)
        self.assertIn("data_provenance", data)
        self.assertGreater(len(data["data_provenance"]), 3)

    def test_unauthenticated_empanelment_update_rejected(self):
        """Verify unauthenticated requests cannot modify empanelment records (Security Phase 4 & 10)."""
        payload = {
            "facility_id": "fac_nims_hyd",
            "scheme_id": "aarogyasri",
            "empanelment_status": "empanelled",
            "verification_status": "verified_procedure",
            "specialties_covered": ["Cardiology"],
            "specific_procedures_verified": ["angioplasty"],
            "source_name": "Test Source",
            "source_url": "https://example.com"
        }
        resp = client.post("/api/health-cards/admin/empanelment", json=payload)
        self.assertEqual(resp.status_code, 401)

    def test_medicine_deduplication_and_filtering(self):
        """Verify list numbers like '2' and '1.' are rejected and duplicate entries like 'Dolo 650' are merged."""
        raw_items = [
            {"name": "Dolo 650", "dosage": "650mg", "quantity": 10},
            {"name": "Dolo 650 Tablet", "dosage": "650mg", "quantity": 10},
            {"name": "2", "dosage": "", "quantity": 0},
            {"name": "1.", "dosage": "", "quantity": 0},
            {"name": "Augmentin 625", "dosage": "625mg", "quantity": 6}
        ]
        deduped = deduplicate_extracted_items(raw_items)
        deduped_names = [item["name"] for item in deduped]

        # Ensure numeric artifacts rejected
        self.assertNotIn("2", deduped_names)
        self.assertNotIn("1.", deduped_names)

        # Ensure Dolo 650 merged to single entry
        dolo_count = sum(1 for n in deduped_names if "dolo" in n.lower())
        self.assertEqual(dolo_count, 1)

        # Ensure Augmentin preserved
        self.assertTrue(any("augmentin" in n.lower() for n in deduped_names))

if __name__ == '__main__':
    unittest.main()
