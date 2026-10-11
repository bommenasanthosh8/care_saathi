"""
Regression Test Suite for CareSaathi AI Audit Remediation
Validates:
1. Payment service database persistence, HMAC-SHA256 signature verification, idempotency, and sandbox isolation.
2. Server-side OTP challenge generation, rate limiting, cooldown, attempt limits, expiration, and replay prevention.
3. JWT secret enforcement and production startup validation.
4. CORS origin restriction and production wildcard prevention.
5. Truthful OCR failure handling (no filename-based clinical data fabrication).
6. Single registration of /api/action-plan/generate route.
7. Deterministic database path resolution.
"""

import os
import sys
import time
import hmac
import hashlib
import unittest
from unittest.mock import patch

# Ensure root directory is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.config import settings, Settings
from backend.app.data.database import get_connection, init_db
from backend.app.services.payment_service import (
    create_appointment_payment_order,
    verify_appointment_payment,
    get_order_status
)
from backend.app.services.otp_service import (
    send_phone_otp,
    verify_phone_otp,
    is_phone_verified,
    normalize_phone,
    MAX_OTP_ATTEMPTS
)
from backend.app.services.auth_service import (
    create_access_token,
    decode_access_token,
    get_jwt_secret
)
from backend.app.services.ocr_service import process_prescription_ocr
from backend.app.main import app


class TestAuditRemediationSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()

    def setUp(self):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM payment_orders WHERE appointment_id LIKE 'apt_%'")
        cursor.execute("DELETE FROM otp_challenges WHERE phone LIKE '+9198765432%'")
        conn.commit()
        conn.close()

    # --------------------------------------------------------------------------
    # 1. PAYMENT VERIFICATION & SANDBOX ISOLATION
    # --------------------------------------------------------------------------
    def test_payment_order_persisted_to_database(self):
        """Verifies payment orders are stored in SQLite rather than volatile memory."""
        res = create_appointment_payment_order(
            appointment_id="apt_test_db_persist_01",
            facility_name="NIMS Hyderabad",
            consultation_fee=500,
            registration_fee=100
        )
        self.assertTrue(res["success"])
        order_id = res["order"]["order_id"]

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM payment_orders WHERE order_id = ?", (order_id,))
        row = cursor.fetchone()
        conn.close()

        self.assertIsNotNone(row)
        self.assertEqual(row["appointment_id"], "apt_test_db_persist_01")
        self.assertEqual(row["total_amount_inr"], 708)  # (500 + 100) * 1.18 = 708
        self.assertEqual(row["status"], "PENDING")

    def test_payment_production_hmac_signature_verification(self):
        """Verifies HMAC-SHA256 signature verification in production payment flow."""
        fake_secret = "test_razorpay_secret_key_12345"
        with patch.dict(os.environ, {
            "ENVIRONMENT": "production",
            "DEMO_MODE": "false",
            "RAZORPAY_KEY_ID": "rzp_live_test_key",
            "RAZORPAY_KEY_SECRET": fake_secret
        }):
            with patch.object(settings, "ENVIRONMENT", "production"):
                with patch.object(settings, "DEMO_MODE", False):
                    # Create production order
                    res = create_appointment_payment_order(
                        appointment_id="apt_prod_test_01",
                        facility_name="Apollo Hospital",
                        consultation_fee=1000,
                        registration_fee=200,
                        is_sandbox_test=False
                    )
                    self.assertTrue(res["success"])
                    order_id = res["order"]["order_id"]

                    # Attempt verification without signature -> Must Fail
                    fail_res = verify_appointment_payment(
                        order_id=order_id,
                        payment_id="pay_live_001",
                        signature=None
                    )
                    self.assertFalse(fail_res["verified"])
                    self.assertEqual(fail_res["status"], "FAILED")

                    # Attempt verification with invalid signature -> Must Fail
                    bad_sig_res = verify_appointment_payment(
                        order_id=order_id,
                        payment_id="pay_live_001",
                        signature="invalid_signature_hex"
                    )
                    self.assertFalse(bad_sig_res["verified"])

                    # Valid HMAC-SHA256 signature -> Must Succeed
                    payload = f"{order_id}|pay_live_001"
                    valid_sig = hmac.new(
                        fake_secret.encode(),
                        payload.encode(),
                        hashlib.sha256
                    ).hexdigest()

                    success_res = verify_appointment_payment(
                        order_id=order_id,
                        payment_id="pay_live_001",
                        signature=valid_sig
                    )
                    self.assertTrue(success_res["verified"])
                    self.assertEqual(success_res["status"], "SUCCESS")
                    self.assertFalse(success_res["is_sandbox"])

    def test_payment_idempotency_prevents_duplicate_paid_orders(self):
        """Verifies duplicate paid appointments cannot have new payment orders created."""
        res1 = create_appointment_payment_order(
            appointment_id="apt_idempotency_01",
            facility_name="Care Hospital",
            consultation_fee=400,
            registration_fee=50
        )
        self.assertTrue(res1["success"])
        order_id = res1["order"]["order_id"]

        # Verify order in demo mode
        verify_res = verify_appointment_payment(
            order_id=order_id,
            payment_id="pay_demo_idempotent_01"
        )
        self.assertTrue(verify_res["verified"])

        # Attempt to create another order for the same appointment
        res2 = create_appointment_payment_order(
            appointment_id="apt_idempotency_01",
            facility_name="Care Hospital"
        )
        self.assertFalse(res2["success"])
        self.assertTrue(res2["is_duplicate"])

    def test_sandbox_payment_isolated_to_demo_mode(self):
        """Verifies sandbox payment verification is rejected if running in production without demo mode."""
        res = create_appointment_payment_order(
            appointment_id="apt_sandbox_guard_01",
            facility_name="Yashoda Hospital",
            is_sandbox_test=True
        )
        order_id = res["order"]["order_id"]

        with patch.object(settings, "ENVIRONMENT", "production"):
            with patch.object(settings, "DEMO_MODE", False):
                verify_res = verify_appointment_payment(
                    order_id=order_id,
                    payment_id="pay_sandbox_test"
                )
                self.assertFalse(verify_res["verified"])
                self.assertEqual(verify_res["status"], "FAILED")

    def test_payment_order_ownership_authorization(self):
        """Verifies an order bound to user_id cannot be verified or accessed by unauthorized users."""
        res = create_appointment_payment_order(
            appointment_id="apt_auth_guard_01",
            facility_name="Continental Hospital",
            user_id="user_alice_123"
        )
        self.assertTrue(res["success"])
        order_id = res["order"]["order_id"]

        # 1. Unauthenticated verification attempt must fail
        unauth_res = verify_appointment_payment(
            order_id=order_id,
            payment_id="pay_demo_test_01",
            current_user_id=None
        )
        self.assertFalse(unauth_res["verified"])
        self.assertIn("Unauthorized", unauth_res.get("error", ""))

        # 2. Mismatched user verification attempt must fail
        bob_res = verify_appointment_payment(
            order_id=order_id,
            payment_id="pay_demo_test_01",
            current_user_id="user_bob_456"
        )
        self.assertFalse(bob_res["verified"])
        self.assertIn("Unauthorized", bob_res.get("error", ""))

        # 3. Status endpoint must hide details from unauthenticated or mismatched caller
        self.assertIsNone(get_order_status(order_id, current_user_id=None))
        self.assertIsNone(get_order_status(order_id, current_user_id="user_bob_456"))

        # 4. Correct user can inspect and verify
        alice_status = get_order_status(order_id, current_user_id="user_alice_123")
        self.assertIsNotNone(alice_status)
        alice_verify = verify_appointment_payment(
            order_id=order_id,
            payment_id="pay_demo_test_01",
            current_user_id="user_alice_123"
        )
        self.assertTrue(alice_verify["verified"])

    # --------------------------------------------------------------------------
    # 2. SERVER-SIDE OTP VERIFICATION & RATE LIMITING
    # --------------------------------------------------------------------------
    def test_otp_challenge_generation_and_cooldown(self):
        """Verifies OTP generation and resend cooldown enforcement."""
        phone = "+919876543210"
        res1 = send_phone_otp(phone)
        self.assertTrue(res1["success"])
        self.assertIn("expires_in_seconds", res1)

        # Immediate resend within 60 seconds must be blocked by rate limit
        res2 = send_phone_otp(phone)
        self.assertFalse(res2["success"])
        self.assertIn("cooldown_remaining_sec", res2)

    def test_otp_verification_rejects_arbitrary_inputs(self):
        """Verifies invalid or arbitrary 4-character codes are strictly rejected."""
        phone = "+919876543211"
        # Reset any existing challenge for test phone
        conn = get_connection()
        conn.cursor().execute("DELETE FROM otp_challenges WHERE phone = ?", (phone,))
        conn.commit()
        conn.close()

        send_res = send_phone_otp(phone)
        self.assertTrue(send_res["success"])

        # Arbitrary 4-character code like "1234" or "abcd" must fail
        v1 = verify_phone_otp(phone, "1234")
        self.assertFalse(v1["verified"])

        v2 = verify_phone_otp(phone, "abcd")
        self.assertFalse(v2["verified"])

    def test_otp_attempt_limits_and_invalidation(self):
        """Verifies maximum attempts locking and single-use challenge invalidation."""
        phone = "+919876543212"
        conn = get_connection()
        conn.cursor().execute("DELETE FROM otp_challenges WHERE phone = ?", (phone,))
        conn.commit()
        conn.close()

        send_res = send_phone_otp(phone)
        self.assertTrue(send_res["success"])

        # Fail 3 consecutive attempts
        for _ in range(MAX_OTP_ATTEMPTS):
            v_fail = verify_phone_otp(phone, "0000")
            self.assertFalse(v_fail["verified"])

        # 4th attempt should be blocked due to exceeded attempts
        v_blocked = verify_phone_otp(phone, "7829")
        self.assertFalse(v_blocked["verified"])
        self.assertIn("Maximum verification attempts exceeded", v_blocked["error"])

    def test_otp_successful_verification_prevents_replay(self):
        """Verifies successful OTP verification cannot be replayed."""
        phone = "+919876543213"
        conn = get_connection()
        conn.cursor().execute("DELETE FROM otp_challenges WHERE phone = ?", (phone,))
        conn.commit()
        conn.close()

        send_res = send_phone_otp(phone)
        self.assertTrue(send_res["success"])

        # Verify with legitimate demo OTP
        v_ok = verify_phone_otp(phone, "7829")
        self.assertTrue(v_ok["verified"])
        self.assertTrue(is_phone_verified(phone))

        # Second verification with same code must fail (code invalidated)
        v_replay = verify_phone_otp(phone, "7829")
        self.assertFalse(v_replay["verified"])

    def test_otp_production_failsafe_without_gateway(self):
        """Verifies OTP generation safely fails in production if SMS gateway is not configured."""
        phone = "+919876543214"
        conn = get_connection()
        conn.cursor().execute("DELETE FROM otp_challenges WHERE phone = ?", (phone,))
        conn.commit()
        conn.close()

        with patch.object(settings, "ENVIRONMENT", "production"):
            with patch.object(settings, "DEMO_MODE", False):
                with patch.dict(os.environ, {"SMS_PROVIDER_API_KEY": ""}):
                    res = send_phone_otp(phone)
                    self.assertFalse(res["success"])
                    self.assertIn("SMS provider gateway not configured", res.get("error", ""))

    # --------------------------------------------------------------------------
    # 3. JWT SECRET CONFIGURATION & PRODUCTION VALIDATION
    # --------------------------------------------------------------------------
    def test_jwt_production_validation_blocks_insecure_secret(self):
        """Verifies production validation raises an error if JWT_SECRET is weak or unset."""
        test_settings = Settings()
        test_settings.ENVIRONMENT = "production"
        test_settings.JWT_SECRET = "short"

        with self.assertRaises(RuntimeError):
            test_settings.validate_security_settings()

    def test_jwt_token_creation_and_tamper_detection(self):
        """Verifies JWT tokens encode and decode correctly, and reject tampering."""
        token = create_access_token("usr_test_101", "test@caresaathi.in", "Test Patient")
        payload = decode_access_token(token)
        self.assertIsNotNone(payload)
        self.assertEqual(payload["sub"], "usr_test_101")
        self.assertEqual(payload["email"], "test@caresaathi.in")

        # Tampered token
        tampered = token[:-4] + "xxxx"
        self.assertIsNone(decode_access_token(tampered))

    # --------------------------------------------------------------------------
    # 4. CORS CONFIGURATION RESTRICTIONS
    # --------------------------------------------------------------------------
    def test_cors_production_blocks_wildcard_origins(self):
        """Verifies production validation prevents wildcard '*' origins."""
        test_settings = Settings()
        test_settings.ENVIRONMENT = "production"
        test_settings.JWT_SECRET = "a" * 36

        with patch.dict(os.environ, {"CORS_ORIGINS": "*"}):
            with self.assertRaises(RuntimeError):
                test_settings.validate_security_settings()

    # --------------------------------------------------------------------------
    # 5. TRUTHFUL OCR RESPONSES (NO MEDICAL FABRICATION)
    # --------------------------------------------------------------------------
    def test_ocr_does_not_fabricate_from_filename(self):
        """Verifies unreadable uploads with medical keywords in filenames do NOT fabricate diagnoses/drugs."""
        dummy_bytes = b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00" + b"\x00" * 50

        # Upload with filename that previously fabricated knee replacement and dolo
        with patch("backend.app.services.ocr_service.extract_medicines_with_gemini", return_value=None):
            res_knee = process_prescription_ocr(
                file_bytes=dummy_bytes,
                filename="severe_knee_ortho_scan.jpg"
            )
            self.assertEqual(len(res_knee.medicines), 0)
            self.assertIsNone(res_knee.doctor_name)
            self.assertIsNone(res_knee.date)
            self.assertIn("could not decipher", " ".join(res_knee.unreadable_parts).lower())

        # Upload with filename that previously fabricated cataract
        with patch("backend.app.services.ocr_service.extract_medicines_with_gemini", return_value=None):
            res_eye = process_prescription_ocr(
                file_bytes=dummy_bytes,
                filename="cataract_eye_checkup.jpg"
            )
            self.assertEqual(len(res_eye.medicines), 0)
            self.assertIsNone(res_eye.doctor_name)

    # --------------------------------------------------------------------------
    # 6. ROUTE CONSOLIDATION & DATABASE PATH RESOLUTION
    # --------------------------------------------------------------------------
    def test_action_plan_route_registered_only_once(self):
        """Verifies POST /api/action-plan/generate is registered exactly once in FastAPI router."""
        matching_routes = [
            route for route in app.routes
            if getattr(route, "path", None) == "/api/action-plan/generate"
            and "POST" in getattr(route, "methods", set())
        ]
        self.assertEqual(len(matching_routes), 1, "Expected exactly 1 registration of /api/action-plan/generate")

    def test_database_path_resolves_deterministically(self):
        """Verifies DATABASE_PATH resolves to an absolute path anchored to the project root."""
        self.assertTrue(os.path.isabs(settings.DATABASE_PATH))
        self.assertTrue(os.path.exists(settings.DATABASE_PATH))
        self.assertTrue(settings.DATABASE_PATH.endswith("caresaathi.db"))

    # --------------------------------------------------------------------------
    # 7. API ENDPOINT INPUT VALIDATION & AUTHORIZATION
    # --------------------------------------------------------------------------
    def test_otp_api_input_validation(self):
        """Verifies FastAPI validation rejects malformed phone and OTP requests."""
        from fastapi.testclient import TestClient
        client = TestClient(app)

        # 1. Reject invalid short phone number (min_length=10)
        res_short = client.post("/api/auth/otp/send", json={"phone": "123"})
        self.assertEqual(res_short.status_code, 422)

        # 2. Reject short OTP code (min_length=4)
        res_short_otp = client.post("/api/auth/otp/verify", json={"phone": "+919876543210", "otp_code": "1"})
        self.assertEqual(res_short_otp.status_code, 422)

    def test_payment_api_unauthorized_access(self):
        """Verifies payment API endpoints reject unverified / non-existent orders."""
        from fastapi.testclient import TestClient
        client = TestClient(app)

        # Status check for non-existent order must return 404
        res_404 = client.get("/api/payments/status/order_non_existent_9999")
        self.assertEqual(res_404.status_code, 404)


if __name__ == "__main__":
    unittest.main()
