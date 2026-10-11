# Payment & Billing Service for Optional Appointment Fees
# Implements:
# 1. Server-side payment order creation with fee breakdown and SQLite persistence
# 2. Server-side signature & transaction verification with HMAC-SHA256
# 3. Idempotent booking & duplicate charge prevention
# 4. Strict sandbox/production separation with transparent simulation indicators

import os
import uuid
import time
import hmac
import hashlib
from typing import Dict, Any, Optional
from ..data.database import get_connection
from ..config import settings

def is_razorpay_configured() -> bool:
    key_id = os.getenv("RAZORPAY_KEY_ID", "").strip()
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "").strip()
    return bool(key_id and key_secret)

def create_appointment_payment_order(
    appointment_id: str,
    facility_name: str,
    consultation_fee: int = 500,
    registration_fee: int = 100,
    user_id: Optional[str] = None,
    is_sandbox_test: bool = True
) -> Dict[str, Any]:
    """
    Creates a server-side order with itemized fee breakdown and database persistence.
    Guarantees idempotency: cannot generate multiple unpaid orders for an already paid booking.
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Check if appointment has already been paid for
    cursor.execute(
        "SELECT order_id, status FROM payment_orders WHERE appointment_id = ? AND status IN ('SUCCESS', 'DEMO_VERIFIED')",
        (appointment_id,)
    )
    existing_paid = cursor.fetchone()
    if existing_paid:
        conn.close()
        return {
            "success": False,
            "error": "This appointment has already been paid for and confirmed.",
            "is_duplicate": True,
            "existing_order_id": existing_paid["order_id"]
        }

    # Validate fees (authoritative server-side minimums)
    consultation_fee = max(0, int(consultation_fee))
    registration_fee = max(0, int(registration_fee))
    tax_gst = round((consultation_fee + registration_fee) * 0.18)  # 18% GST on OPD processing
    total_amount_inr = consultation_fee + registration_fee + tax_gst

    # Determine environment and sandbox mode
    is_production = settings.ENVIRONMENT.lower() == "production"
    
    if is_production and not settings.DEMO_MODE:
        if not is_razorpay_configured():
            conn.close()
            return {
                "success": False,
                "error": "Payment gateway credentials not configured in production environment."
            }
        is_sandbox = False
    else:
        is_sandbox = is_sandbox_test or settings.DEMO_MODE or not is_razorpay_configured()

    order_id = f"order_{uuid.uuid4().hex[:14]}"
    created_at = int(time.time())

    cursor.execute("""
    INSERT INTO payment_orders (
        order_id, appointment_id, user_id, facility_name, consultation_fee,
        registration_fee, tax_gst, total_amount_inr, currency, status,
        is_sandbox, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'INR', 'PENDING', ?, ?)
    """, (
        order_id, appointment_id, user_id, facility_name, consultation_fee,
        registration_fee, tax_gst, total_amount_inr, 1 if is_sandbox else 0, created_at
    ))
    conn.commit()
    conn.close()

    order_data = {
        "order_id": order_id,
        "appointment_id": appointment_id,
        "user_id": user_id,
        "facility_name": facility_name,
        "currency": "INR",
        "fee_breakdown": {
            "doctor_consultation_fee": consultation_fee,
            "hospital_registration_fee": registration_fee,
            "statutory_gst_18pct": tax_gst,
            "total_payable_inr": total_amount_inr
        },
        "amount_paise": total_amount_inr * 100,
        "status": "PENDING",
        "is_sandbox": is_sandbox,
        "razorpay_key_id": os.getenv("RAZORPAY_KEY_ID", "") if is_razorpay_configured() else "rzp_test_caresaathi_sandbox",
        "gateway_message": (
            "Production Razorpay gateway active."
            if not is_sandbox and is_razorpay_configured()
            else "Operating in Transparent Simulated Demo Mode. No real charge will occur."
        ),
        "created_at": created_at
    }

    return {
        "success": True,
        "order": order_data
    }

def verify_appointment_payment(
    order_id: str,
    payment_id: str,
    signature: Optional[str] = None,
    client_status: str = "SUCCESS",
    current_user_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Verifies payment server-side against database records.
    Production orders require cryptographic signature verification.
    Sandbox orders are strictly isolated to non-production or demo configurations.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM payment_orders WHERE order_id = ?", (order_id,))
    order_row = cursor.fetchone()

    if not order_row:
        conn.close()
        return {
            "verified": False,
            "status": "FAILED",
            "error": "Payment order not found in server registry."
        }

    order = dict(order_row)

    # Authorization check if user_id is bound
    if order.get("user_id"):
        if not current_user_id or order["user_id"] != current_user_id:
            conn.close()
            return {
                "verified": False,
                "status": "FAILED",
                "error": "Unauthorized: Authentication required to verify this payment order."
            }

    # Check if already processed
    if order["status"] in ["SUCCESS", "DEMO_VERIFIED"]:
        conn.close()
        return {
            "verified": True,
            "status": order["status"],
            "is_sandbox": bool(order["is_sandbox"]),
            "message": "Payment already verified previously.",
            "appointment_id": order["appointment_id"],
            "order_id": order_id,
            "payment_id": order.get("payment_id")
        }

    # If client reported cancellation or failure
    if client_status in ["FAILED", "CANCELLED"]:
        cursor.execute(
            "UPDATE payment_orders SET status = ?, payment_id = ? WHERE order_id = ?",
            (client_status, payment_id, order_id)
        )
        conn.commit()
        conn.close()
        return {
            "verified": False,
            "status": client_status,
            "message": f"Payment transaction marked as {client_status}."
        }

    is_production = settings.ENVIRONMENT.lower() == "production"

    # Production verification branch
    if not order["is_sandbox"]:
        if not is_razorpay_configured():
            conn.close()
            return {
                "verified": False,
                "status": "FAILED",
                "error": "Production payment verification failed: Gateway secret not configured on server."
            }
        
        if not signature:
            cursor.execute("UPDATE payment_orders SET status = 'FAILED' WHERE order_id = ?", (order_id,))
            conn.commit()
            conn.close()
            return {
                "verified": False,
                "status": "FAILED",
                "error": "Missing cryptographic payment signature for production verification."
            }

        # Verify HMAC SHA256 signature
        razorpay_secret = os.getenv("RAZORPAY_KEY_SECRET", "")
        payload = f"{order_id}|{payment_id}"
        expected_sig = hmac.new(
            razorpay_secret.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(expected_sig, signature):
            cursor.execute("UPDATE payment_orders SET status = 'FAILED' WHERE order_id = ?", (order_id,))
            conn.commit()
            conn.close()
            return {
                "verified": False,
                "status": "FAILED",
                "error": "Cryptographic signature mismatch. Transaction untrusted."
            }

        now_ts = int(time.time())
        cursor.execute(
            "UPDATE payment_orders SET status = 'SUCCESS', payment_id = ?, verified_at = ? WHERE order_id = ?",
            (payment_id, now_ts, order_id)
        )
        conn.commit()
        conn.close()

        return {
            "verified": True,
            "status": "SUCCESS",
            "is_sandbox": False,
            "order_id": order_id,
            "payment_id": payment_id,
            "appointment_id": order["appointment_id"],
            "total_paid_inr": order["total_amount_inr"],
            "receipt": f"REC-CS-{order_id[-6:].upper()}",
            "message": "Production payment verified server-side. Appointment confirmed."
        }

    # Sandbox / Demo branch
    if is_production and not settings.DEMO_MODE:
        conn.close()
        return {
            "verified": False,
            "status": "FAILED",
            "error": "Sandbox payment verification rejected in production environment."
        }

    now_ts = int(time.time())
    demo_status = "DEMO_VERIFIED"
    cursor.execute(
        "UPDATE payment_orders SET status = ?, payment_id = ?, verified_at = ? WHERE order_id = ?",
        (demo_status, payment_id, now_ts, order_id)
    )
    conn.commit()
    conn.close()

    return {
        "verified": True,
        "status": demo_status,
        "is_sandbox": True,
        "order_id": order_id,
        "payment_id": payment_id,
        "appointment_id": order["appointment_id"],
        "total_paid_inr": order["total_amount_inr"],
        "receipt": f"DEMO-CS-{order_id[-6:].upper()}",
        "message": "Simulated sandbox payment verified. No monetary transaction occurred."
    }

def get_order_status(order_id: str, current_user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM payment_orders WHERE order_id = ?", (order_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    order = dict(row)
    if order.get("user_id"):
        if not current_user_id or order["user_id"] != current_user_id:
            return None

    return {
        "order_id": order["order_id"],
        "appointment_id": order["appointment_id"],
        "user_id": order.get("user_id"),
        "facility_name": order["facility_name"],
        "total_amount_inr": order["total_amount_inr"],
        "currency": order["currency"],
        "status": order["status"],
        "is_sandbox": bool(order["is_sandbox"]),
        "payment_id": order.get("payment_id"),
        "created_at": order["created_at"],
        "verified_at": order.get("verified_at")
    }
