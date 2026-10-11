"""
Regression Test Suite for Health Card & Insurance Hospital Finder
Tests:
1. Listing of supported schemes and insurers
2. Treatment search with synonyms
3. Hospital discovery with exact health card and procedure matching
4. Distinct verification statuses (verified_procedure vs scheme_verified_procedure_unconfirmed)
5. Out-of-pocket expense calculations (cashless package vs patient share)
6. Geographic location and radius filtering
7. Hospital detail profile with package rate and questions to ask
8. Administrative update endpoint authorization (HTTP 401 / 200)
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.data.database import init_db
from backend.app.services.health_card_service import (
    get_all_schemes,
    get_all_treatments_catalogue,
    search_health_card_hospitals,
    get_hospital_health_card_profile
)
from backend.app.models.schemas import HealthCardSearchRequest


class TestHealthCardFinderSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.client = TestClient(app)

    def test_schemes_listing(self):
        """Verifies all supported schemes and private insurers are returned with required fields."""
        res = self.client.get("/api/health-cards/schemes")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreaterEqual(len(data), 5)

        scheme_ids = [s["id"] for s in data]
        self.assertIn("aarogyasri", scheme_ids)
        self.assertIn("pm_jay", scheme_ids)
        self.assertIn("ts_ehs", scheme_ids)
        self.assertIn("star_health", scheme_ids)

        for s in data:
            self.assertTrue(s["name"])
            self.assertTrue(s["authority"])
            self.assertTrue(s["official_portal"].startswith("https://") or s["official_portal"].startswith("http://"))
            self.assertTrue(s["helpline"])
            self.assertIsInstance(s["required_eligibility_info"], list)

    def test_treatments_search_and_synonyms(self):
        """Verifies treatment catalogue search handles procedure names and synonyms."""
        # Search by generic name
        r1 = self.client.get("/api/health-cards/treatments?q=knee")
        self.assertEqual(r1.status_code, 200)
        data1 = r1.json()
        self.assertTrue(any(t["id"] == "knee_replacement" for t in data1))

        # Search by specialty category
        r2 = self.client.get("/api/health-cards/treatments?q=ophthalmology")
        self.assertEqual(r2.status_code, 200)
        data2 = r2.json()
        self.assertTrue(any(t["id"] == "cataract_surgery" for t in data2))

    def test_hospital_discovery_verified_procedure(self):
        """Verifies hospitals with confirmed procedure empanelment receive 'verified_procedure' status."""
        req = {
            "scheme_id": "aarogyasri",
            "treatment_id": "knee_replacement",
            "state": "Telangana"
        }
        res = self.client.post("/api/health-cards/search", json=req)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        self.assertGreater(data["total_found"], 0)
        self.assertGreater(data["verified_count"], 0)

        # Nizam's Institute of Medical Sciences (NIMS) must be verified for TKR under Aarogyasri
        nims_matches = [h for h in data["hospitals"] if h["facility_id"] == "fac_nims_hyd"]
        self.assertEqual(len(nims_matches), 1)
        nims = nims_matches[0]
        self.assertEqual(nims["verification_status"], "verified_procedure")
        self.assertEqual(nims["verification_label"], "Verified for this procedure")
        self.assertEqual(nims["package_code"], "S4.1.1")
        self.assertEqual(nims["package_rate_inr"], 135000)
        self.assertEqual(nims["estimated_out_of_pocket_min"], 0)
        self.assertEqual(nims["estimated_out_of_pocket_max"], 0)

    def test_hospital_discovery_unconfirmed_procedure(self):
        """Verifies hospitals empanelled in scheme without specific procedure verification get unconfirmed status."""
        # Yashoda Somajiguda is empanelled under Aarogyasri for cardiac/nephro, but TKR is unconfirmed
        req = {
            "scheme_id": "aarogyasri",
            "treatment_id": "knee_replacement",
            "state": "Telangana"
        }
        res = self.client.post("/api/health-cards/search", json=req)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        yashoda_matches = [h for h in data["hospitals"] if h["facility_id"] == "fac_yashoda_somajiguda"]
        if yashoda_matches:
            yashoda = yashoda_matches[0]
            self.assertEqual(yashoda["verification_status"], "scheme_verified_procedure_unconfirmed")
            self.assertIn("procedure needs confirmation", yashoda["verification_label"].lower())

    def test_invalid_scheme_returns_404(self):
        """Verifies searching with a non-existent scheme_id returns HTTP 404."""
        req = {
            "scheme_id": "invalid_scheme_xyz",
            "treatment_id": "knee_replacement"
        }
        res = self.client.post("/api/health-cards/search", json=req)
        self.assertEqual(res.status_code, 404)

    def test_ownership_filtering(self):
        """Verifies filtering by ownership restricts results to requested hospital category."""
        req = {
            "scheme_id": "aarogyasri",
            "treatment_id": "knee_replacement",
            "ownership": "Government"
        }
        res = self.client.post("/api/health-cards/search", json=req)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        for h in data["hospitals"]:
            self.assertEqual(h["ownership"], "Government")

    def test_out_of_pocket_private_insurance(self):
        """Verifies private insurance calculates non-medical co-pay and deductions properly."""
        req = {
            "scheme_id": "star_health",
            "treatment_id": "knee_replacement"
        }
        res = self.client.post("/api/health-cards/search", json=req)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        apollo_matches = [h for h in data["hospitals"] if h["facility_id"] == "fac_apollo_jubilee"]
        self.assertEqual(len(apollo_matches), 1)
        apollo = apollo_matches[0]
        self.assertEqual(apollo["verification_status"], "verified_procedure")
        # Private insurance has out-of-pocket range > 0
        self.assertGreater(apollo["estimated_out_of_pocket_min"], 0)
        self.assertGreater(apollo["estimated_out_of_pocket_max"], apollo["estimated_out_of_pocket_min"])

    def test_hospital_profile_endpoint(self):
        """Verifies /api/health-cards/hospital/{facility_id} returns comprehensive profile."""
        res = self.client.get("/api/health-cards/hospital/fac_nims_hyd?scheme_id=aarogyasri&treatment_id=knee_replacement")
        self.assertEqual(res.status_code, 200)
        data = res.json()

        self.assertEqual(data["facility"]["id"], "fac_nims_hyd")
        self.assertIsNotNone(data["selected_scheme"])
        self.assertEqual(data["selected_scheme"]["id"], "aarogyasri")
        self.assertIsNotNone(data["selected_package"])
        self.assertEqual(data["selected_package"]["package_code"], "S4.1.1")
        self.assertGreater(len(data["questions_to_ask"]), 0)
        self.assertGreater(len(data["documents_required"]), 0)

    def test_admin_update_authorization(self):
        """Verifies administrative empanelment update requires valid JWT token."""
        payload = {
            "facility_id": "fac_nims_hyd",
            "scheme_id": "aarogyasri",
            "source_url": "https://aarogyasri.telangana.gov.in"
        }

        # 1. Unauthenticated request must be blocked with HTTP 401
        res_unauth = self.client.post("/api/health-cards/admin/empanelment", json=payload)
        self.assertEqual(res_unauth.status_code, 401)

        # 2. Authenticated admin request must succeed with HTTP 200
        login_res = self.client.post("/api/auth/demo-login")
        token = login_res.json()["access_token"]

        res_auth = self.client.post(
            "/api/health-cards/admin/empanelment",
            json=payload,
            headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(res_auth.status_code, 200)
        self.assertTrue(res_auth.json()["success"])


    def test_search_pmjay_knee_replacement_hyderabad(self):
        """Verifies PM-JAY + knee replacement + Hyderabad returns hospitals with verified and unconfirmed statuses."""
        req = {
            "scheme_id": "pm_jay",
            "treatment_id": "knee_replacement",
            "city_or_district": "Hyderabad"
        }
        res = self.client.post("/api/health-cards/search", json=req)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreater(data["total_results"], 0)
        self.assertGreater(data["verified_procedure_count"], 0)
        # Check dual contract fields
        self.assertEqual(data["total_found"], data["total_results"])
        self.assertEqual(data["verified_count"], data["verified_procedure_count"])
        self.assertEqual(len(data["results"]), len(data["hospitals"]))

    def test_search_aarogyasri_cataract_surgery_hyderabad(self):
        """Verifies Aarogyasri + cataract surgery + Hyderabad returns hospitals including Sarojini Devi Eye Hospital."""
        req = {
            "scheme_id": "aarogyasri",
            "treatment_id": "cataract_surgery",
            "city_or_district": "Hyderabad"
        }
        res = self.client.post("/api/health-cards/search", json=req)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreaterEqual(data["total_results"], 40)
        self.assertGreater(data["verified_procedure_count"], 0)
        # Verify Sarojini Devi Eye Hospital is present and verified
        sd_matches = [h for h in data["results"] if h["facility_id"] == "fac_sd_eye_mehdipatnam_hyd"]
        self.assertEqual(len(sd_matches), 1)
        self.assertEqual(sd_matches[0]["verification_status"], "verified_procedure")

    def test_search_pmjay_dialysis_telangana_alias(self):
        """Verifies PM-JAY + 'dialysis' (alias for hemodialysis) + Telangana resolves and returns matches."""
        req = {
            "scheme_id": "pm_jay",
            "treatment_id": "dialysis",
            "state": "Telangana"
        }
        res = self.client.post("/api/health-cards/search", json=req)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreater(data["total_results"], 0)
        self.assertEqual(data["treatment"]["id"], "hemodialysis")

    def test_search_without_location_restriction(self):
        """Verifies search without location restriction returns empanelled hospitals statewide/nationwide."""
        req = {
            "scheme_id": "aarogyasri",
            "treatment_id": "knee_replacement"
        }
        res = self.client.post("/api/health-cards/search", json=req)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreaterEqual(data["total_results"], 40)
        self.assertGreater(data["verified_procedure_count"], 0)

    def test_search_missing_package_graceful_handling(self):
        """Verifies that treatments without specific statutory package still return scheme-empanelled hospitals."""
        req = {
            "scheme_id": "aarogyasri",
            "treatment_id": "appendectomy",
            "city_or_district": "Hyderabad"
        }
        res = self.client.post("/api/health-cards/search", json=req)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        # Should return empanelled hospitals even if procedure-specific package isn't statutory
        self.assertGreater(data["total_results"], 0)
        self.assertIsNone(data.get("package_info"))
        unconfirmed = [h for h in data["results"] if h["verification_status"] == "scheme_verified_procedure_unconfirmed"]
        self.assertGreater(len(unconfirmed), 0)

    def test_secunderabad_locality_matching(self):
        """Verifies searching for 'Secunderabad' matches Greater Hyderabad facilities."""
        req = {
            "scheme_id": "aarogyasri",
            "treatment_id": "knee_replacement",
            "city_or_district": "Secunderabad"
        }
        res = self.client.post("/api/health-cards/search", json=req)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreater(data["total_results"], 0)


if __name__ == "__main__":
    unittest.main()
