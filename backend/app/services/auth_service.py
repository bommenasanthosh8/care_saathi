import os
import hashlib
import secrets
import datetime
import jwt
from typing import Optional, Dict, Any, List
from ..data.database import get_connection
from ..config import settings

def get_jwt_secret() -> str:
    return settings.JWT_SECRET

JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 48

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return f"{salt}${hashed.hex()}"

def verify_password(plain_password: str, hashed_str: str) -> bool:
    try:
        salt, hashed = hashed_str.split('$')
        computed = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return secrets.compare_digest(computed.hex(), hashed)
    except Exception:
        return False

def create_access_token(user_id: str, email: str, name: str) -> str:
    now = datetime.datetime.now(datetime.timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        "name": name,
        "iat": now,
        "exp": now + datetime.timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        return payload
    except Exception:
        return None

def register_user(name: str, email: str, password: str, language: str = 'en') -> Dict[str, Any]:
    cleaned_email = email.strip().lower()
    if not cleaned_email or "@" not in cleaned_email:
        raise ValueError("Invalid email format")
    if len(password) < 6:
        raise ValueError("Password must be at least 6 characters")
    if not name.strip():
        raise ValueError("Name is required")

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE email = ?", (cleaned_email,))
    if cursor.fetchone():
        conn.close()
        raise ValueError("An account with this email already exists")

    user_id = f"usr_{secrets.token_hex(8)}"
    hashed_pwd = hash_password(password)
    now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()

    cursor.execute("""
    INSERT INTO users (id, email, hashed_password, name, language, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (user_id, cleaned_email, hashed_pwd, name.strip(), language, now_str))

    conn.commit()
    conn.close()

    token = create_access_token(user_id, cleaned_email, name.strip())
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "name": name.strip(),
            "email": cleaned_email,
            "language": language
        }
    }

def login_user(email: str, password: str) -> Dict[str, Any]:
    cleaned_email = email.strip().lower()
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, email, hashed_password, name, language FROM users WHERE email = ?", (cleaned_email,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise ValueError("Invalid email or password")

    if not verify_password(password, row["hashed_password"]):
        raise ValueError("Invalid email or password")

    token = create_access_token(row["id"], row["email"], row["name"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": row["id"],
            "name": row["name"],
            "email": row["email"],
            "language": row["language"] or 'en'
        }
    }

def get_demo_user() -> Dict[str, Any]:
    """Provides instant authenticated session for hackathon judges"""
    demo_email = "judge.demo@caresaathi.in"
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, email, name, language FROM users WHERE email = ?", (demo_email,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        # Auto-create if not yet seeded
        res = register_user("Judge Reviewer", demo_email, "JudgeDemo2026!", "en")
        return res

    token = create_access_token(row["id"], row["email"], row["name"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": row["id"],
            "name": row["name"],
            "email": row["email"],
            "language": row["language"] or 'en'
        }
    }

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, name, language FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "language": row["language"] or 'en'
    }

def save_comparison(user_id: str, facility_ids: List[str], treatment_name: str) -> Dict[str, Any]:
    import json
    conn = get_connection()
    cursor = conn.cursor()
    comp_id = f"comp_{secrets.token_hex(6)}"
    now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
    cursor.execute("""
    INSERT INTO saved_comparisons (id, user_id, facility_ids, treatment_name, created_at)
    VALUES (?, ?, ?, ?, ?)
    """, (comp_id, user_id, json.dumps(facility_ids), treatment_name, now_str))
    conn.commit()
    conn.close()
    return {
        "id": comp_id,
        "facility_ids": facility_ids,
        "treatment_name": treatment_name,
        "created_at": now_str
    }

def get_saved_comparisons(user_id: str) -> List[Dict[str, Any]]:
    import json
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, facility_ids, treatment_name, created_at 
    FROM saved_comparisons 
    WHERE user_id = ? 
    ORDER BY created_at DESC
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()
    results = []
    for r in rows:
        results.append({
            "id": r["id"],
            "facility_ids": json.loads(r["facility_ids"]) if r["facility_ids"] else [],
            "treatment_name": r["treatment_name"],
            "created_at": r["created_at"]
        })
    return results

def delete_saved_comparison(user_id: str, comp_id: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM saved_comparisons WHERE id = ? AND user_id = ?", (comp_id, user_id))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0
