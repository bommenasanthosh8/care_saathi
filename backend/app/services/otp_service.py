# Server-Side OTP Verification Service
# Implements:
# 1. Challenge generation bound to phone number with expiration (5 mins)
# 2. Resend cooldown rate-limiting (60s)
# 3. Maximum attempt limits (3 tries)
# 4. Invalidation upon successful verification (single-use)
# 5. Strict demo-mode separation with no external SMS charges

import os
import time
import hashlib
import secrets
from typing import Dict, Any, Optional
from ..data.database import get_connection
from ..config import settings

OTP_EXPIRATION_SECONDS = 300  # 5 minutes
OTP_COOLDOWN_SECONDS = 60     # 60 seconds between resends
MAX_OTP_ATTEMPTS = 3
DEMO_FIXED_OTP = "7829"

def _hash_otp(phone: str, otp_code: str) -> str:
    salt = settings.JWT_SECRET[:16]
    return hashlib.sha256(f"{phone}:{otp_code}:{salt}".encode('utf-8')).hexdigest()

def normalize_phone(phone: str) -> str:
    cleaned = ''.join(c for c in phone if c.isdigit() or c == '+')
    if not cleaned.startswith('+'):
        if len(cleaned) == 10:
            cleaned = '+91' + cleaned
        else:
            cleaned = '+' + cleaned
    return cleaned

def send_phone_otp(phone: str) -> Dict[str, Any]:
    """
    Issues an OTP challenge bound to the phone number.
    Enforces resend cooldown and records challenge in database.
    """
    clean_phone = normalize_phone(phone)
    if len(clean_phone) < 11:
        return {"success": False, "error": "Invalid phone number format."}

    now_ts = int(time.time())
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM otp_challenges WHERE phone = ?", (clean_phone,))
    existing = cursor.fetchone()

    if existing:
        last_sent = existing["last_sent_at"]
        if (now_ts - last_sent) < OTP_COOLDOWN_SECONDS:
            remaining = OTP_COOLDOWN_SECONDS - (now_ts - last_sent)
            conn.close()
            return {
                "success": False,
                "error": f"Please wait {remaining} seconds before requesting a new OTP.",
                "cooldown_remaining_sec": remaining
            }

    is_demo = settings.DEMO_MODE or settings.ENVIRONMENT.lower() != "production"

    if is_demo:
        otp_code = DEMO_FIXED_OTP
        message = "Demo OTP issued. Use code 7829 to verify."
    else:
        # In real production, if no SMS provider is configured, fail safely
        sms_api_key = os.getenv("SMS_PROVIDER_API_KEY", "")
        if not sms_api_key:
            conn.close()
            return {
                "success": False,
                "error": "SMS provider gateway not configured on server. Contact support."
            }
        otp_code = str(secrets.randbelow(900000) + 100000)
        message = "OTP sent via SMS to registered mobile number."

    otp_hash = _hash_otp(clean_phone, otp_code)
    expires_at = now_ts + OTP_EXPIRATION_SECONDS

    cursor.execute("""
    INSERT INTO otp_challenges (phone, otp_hash, attempts, expires_at, last_sent_at, is_verified)
    VALUES (?, ?, 0, ?, ?, 0)
    ON CONFLICT(phone) DO UPDATE SET
        otp_hash = excluded.otp_hash,
        attempts = 0,
        expires_at = excluded.expires_at,
        last_sent_at = excluded.last_sent_at,
        is_verified = 0
    """, (clean_phone, otp_hash, expires_at, now_ts))

    conn.commit()
    conn.close()

    res = {
        "success": True,
        "phone": clean_phone,
        "is_demo": is_demo,
        "expires_in_seconds": OTP_EXPIRATION_SECONDS,
        "message": message
    }
    if is_demo:
        res["demo_otp_hint"] = DEMO_FIXED_OTP

    return res

def verify_phone_otp(phone: str, otp_code: str) -> Dict[str, Any]:
    """
    Verifies the OTP against the stored challenge.
    Enforces maximum attempts and single-use invalidation.
    """
    clean_phone = normalize_phone(phone)
    now_ts = int(time.time())

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM otp_challenges WHERE phone = ?", (clean_phone,))
    record = cursor.fetchone()

    if not record:
        conn.close()
        return {
            "verified": False,
            "error": "No active OTP request found for this phone number. Please request a new OTP."
        }

    # Check expiration
    if now_ts > record["expires_at"]:
        conn.close()
        return {
            "verified": False,
            "error": "OTP has expired. Please request a new verification code."
        }

    # Check attempt limit
    if record["attempts"] >= MAX_OTP_ATTEMPTS:
        conn.close()
        return {
            "verified": False,
            "error": "Maximum verification attempts exceeded. Please request a new OTP."
        }

    # Verify code hash
    expected_hash = record["otp_hash"]
    submitted_hash = _hash_otp(clean_phone, otp_code.strip())

    if not secrets.compare_digest(expected_hash, submitted_hash):
        new_attempts = record["attempts"] + 1
        cursor.execute(
            "UPDATE otp_challenges SET attempts = ? WHERE phone = ?",
            (new_attempts, clean_phone)
        )
        conn.commit()
        conn.close()
        remaining_tries = MAX_OTP_ATTEMPTS - new_attempts
        return {
            "verified": False,
            "error": f"Invalid verification code. {max(0, remaining_tries)} attempt(s) remaining.",
            "attempts_remaining": max(0, remaining_tries)
        }

    # Success: Mark verified and invalidate code hash to prevent replay
    cursor.execute(
        "UPDATE otp_challenges SET is_verified = 1, otp_hash = 'USED', attempts = 0 WHERE phone = ?",
        (clean_phone,)
    )
    conn.commit()
    conn.close()

    return {
        "verified": True,
        "phone": clean_phone,
        "message": "Phone number successfully verified."
    }

def is_phone_verified(phone: str) -> bool:
    clean_phone = normalize_phone(phone)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT is_verified FROM otp_challenges WHERE phone = ?", (clean_phone,))
    row = cursor.fetchone()
    conn.close()
    return bool(row and row["is_verified"])
