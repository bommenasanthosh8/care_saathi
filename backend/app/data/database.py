import sqlite3
import json
import os
from typing import List, Dict, Optional, Any
from ..config import settings
from .catalogue import TREATMENT_CATALOGUE
from .seed_data import SEED_FACILITIES, SEED_SCHEMES, SEED_COST_OBSERVATIONS
from .health_card_data import (
    SEED_HEALTH_CARD_SCHEMES,
    SEED_HEALTH_CARD_PACKAGES,
    SEED_HOSPITAL_EMPANELMENTS
)
from ..models.schemas import Facility, Treatment, Scheme, CostObservation, CostBreakdown

import logging

logger = logging.getLogger("caresaathi.database")

DB_FILE = settings.DATABASE_PATH

def get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def is_database_available() -> bool:
    """Checks whether the database connection is healthy and responsive."""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM facilities LIMIT 1")
        conn.close()
        return True
    except Exception as e:
        logger.warning(f"Database availability check failed: {e}")
        return False

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Create tables
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS treatments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        aliases TEXT,
        description TEXT,
        indicative_min INTEGER,
        indicative_max INTEGER,
        package_code_pmjay TEXT,
        package_code_aarogyasri TEXT,
        standard_stay_duration TEXT,
        common_diagnostics_required TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS facilities (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        locality TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        pin_code TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        ownership TEXT NOT NULL,
        phone TEXT,
        website TEXT,
        rating REAL,
        verified_treatments TEXT,
        empanelled_schemes TEXT,
        room_types TEXT,
        last_verified_date TEXT,
        pricing_status TEXT,
        price_confidence TEXT,
        facility_class TEXT DEFAULT 'Standard',
        recommendation_reason TEXT,
        source_urls TEXT,
        verified_at TEXT,
        verification_status TEXT DEFAULT 'verified',
        departments TEXT,
        schemes_detail TEXT,
        tariff_detail TEXT
    )
    """)

    # Ensure schema migrations for existing database
    cursor.execute("PRAGMA table_info(facilities)")
    columns = [row[1] for row in cursor.fetchall()]
    if "facility_class" not in columns:
        cursor.execute("ALTER TABLE facilities ADD COLUMN facility_class TEXT DEFAULT 'Standard'")
    if "recommendation_reason" not in columns:
        cursor.execute("ALTER TABLE facilities ADD COLUMN recommendation_reason TEXT")
    if "source_urls" not in columns:
        cursor.execute("ALTER TABLE facilities ADD COLUMN source_urls TEXT")
    if "verified_at" not in columns:
        cursor.execute("ALTER TABLE facilities ADD COLUMN verified_at TEXT")
    if "verification_status" not in columns:
        cursor.execute("ALTER TABLE facilities ADD COLUMN verification_status TEXT DEFAULT 'verified'")
    if "departments" not in columns:
        cursor.execute("ALTER TABLE facilities ADD COLUMN departments TEXT")
    if "schemes_detail" not in columns:
        cursor.execute("ALTER TABLE facilities ADD COLUMN schemes_detail TEXT")
    if "tariff_detail" not in columns:
        cursor.execute("ALTER TABLE facilities ADD COLUMN tariff_detail TEXT")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS schemes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        full_name TEXT NOT NULL,
        authority TEXT NOT NULL,
        coverage_limit_inr TEXT NOT NULL,
        eligibility_summary TEXT NOT NULL,
        eligible_categories TEXT,
        states TEXT,
        official_portal TEXT NOT NULL,
        helpline TEXT NOT NULL,
        required_documents TEXT,
        is_active INTEGER DEFAULT 1,
        last_verified_date TEXT,
        official_portal_url TEXT,
        apply_url TEXT,
        eligibility_check_url TEXT,
        portal_source TEXT,
        portal_verified_at TEXT,
        income_ceiling_lakhs REAL,
        coverage_ceiling_inr INTEGER,
        is_cashless INTEGER DEFAULT 1,
        rule_sources TEXT,
        can_combine_with TEXT
    )
    """)

    cursor.execute("PRAGMA table_info(schemes)")
    scheme_cols = [row[1] for row in cursor.fetchall()]
    for col, col_type in [
        ("official_portal_url", "TEXT"),
        ("apply_url", "TEXT"),
        ("eligibility_check_url", "TEXT"),
        ("portal_source", "TEXT"),
        ("portal_verified_at", "TEXT"),
        ("income_ceiling_lakhs", "REAL"),
        ("coverage_ceiling_inr", "INTEGER"),
        ("is_cashless", "INTEGER DEFAULT 1"),
        ("rule_sources", "TEXT"),
        ("can_combine_with", "TEXT")
    ]:
        if col not in scheme_cols:
            cursor.execute(f"ALTER TABLE schemes ADD COLUMN {col} {col_type}")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cost_observations (
        id TEXT PRIMARY KEY,
        treatment_id TEXT NOT NULL,
        facility_id TEXT,
        facility_name TEXT,
        city TEXT NOT NULL,
        min_price INTEGER NOT NULL,
        max_price INTEGER NOT NULL,
        currency TEXT DEFAULT 'INR',
        price_type TEXT NOT NULL,
        confidence TEXT NOT NULL,
        confidence_explanation TEXT NOT NULL,
        breakdown TEXT NOT NULL,
        source_name TEXT NOT NULL,
        source_url TEXT,
        last_updated TEXT NOT NULL,
        key_assumptions TEXT,
        exclusions TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_preferences (
        user_key TEXT PRIMARY KEY,
        language TEXT DEFAULT 'en',
        preferred_locality TEXT,
        preferred_ownership TEXT,
        saved_facilities TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        hashed_password TEXT NOT NULL,
        name TEXT NOT NULL,
        language TEXT DEFAULT 'en',
        created_at TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS saved_comparisons (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        facility_ids TEXT NOT NULL,
        treatment_name TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS payment_orders (
        order_id TEXT PRIMARY KEY,
        appointment_id TEXT NOT NULL,
        user_id TEXT,
        facility_name TEXT NOT NULL,
        consultation_fee INTEGER NOT NULL,
        registration_fee INTEGER NOT NULL,
        tax_gst INTEGER NOT NULL,
        total_amount_inr INTEGER NOT NULL,
        currency TEXT NOT NULL DEFAULT 'INR',
        status TEXT NOT NULL,
        payment_id TEXT,
        is_sandbox INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        verified_at INTEGER
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS otp_challenges (
        phone TEXT PRIMARY KEY,
        otp_hash TEXT NOT NULL,
        attempts INTEGER DEFAULT 0,
        expires_at INTEGER NOT NULL,
        last_sent_at INTEGER NOT NULL,
        is_verified INTEGER DEFAULT 0
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS health_card_schemes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        authority TEXT NOT NULL,
        description TEXT NOT NULL,
        applicable_states TEXT NOT NULL,
        coverage_limit_inr TEXT NOT NULL,
        official_portal TEXT NOT NULL,
        helpline TEXT NOT NULL,
        required_eligibility_info TEXT NOT NULL,
        icon_type TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        last_verified_date TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS health_card_packages (
        id TEXT PRIMARY KEY,
        scheme_id TEXT NOT NULL,
        treatment_id TEXT NOT NULL,
        treatment_name TEXT NOT NULL,
        specialty TEXT NOT NULL,
        package_code TEXT NOT NULL,
        package_rate_inr INTEGER NOT NULL,
        is_cashless INTEGER DEFAULT 1,
        pre_auth_required INTEGER DEFAULT 1,
        inclusions TEXT NOT NULL,
        exclusions_notes TEXT NOT NULL,
        source_url TEXT NOT NULL,
        last_verified_date TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS hospital_scheme_empanelments (
        id TEXT PRIMARY KEY,
        facility_id TEXT NOT NULL,
        facility_name TEXT NOT NULL,
        scheme_id TEXT NOT NULL,
        empanelment_status TEXT NOT NULL,
        verification_status TEXT NOT NULL,
        specialties_covered TEXT NOT NULL,
        specific_procedures_verified TEXT NOT NULL,
        helpdesk_location TEXT,
        helpdesk_phone TEXT,
        source_name TEXT NOT NULL,
        source_url TEXT NOT NULL,
        last_verified_date TEXT NOT NULL,
        notes TEXT,
        updated_by TEXT DEFAULT 'system'
    )
    """)

    conn.commit()

    # Seed Judge Demo User if not present
    cursor.execute("SELECT id FROM users WHERE email = 'judge.demo@caresaathi.in'")
    if not cursor.fetchone():
        import secrets, hashlib
        demo_salt = secrets.token_hex(16)
        demo_hash = hashlib.pbkdf2_hmac('sha256', b'JudgeDemo2026!', demo_salt.encode('utf-8'), 100000).hex()
        cursor.execute("""
        INSERT INTO users (id, email, hashed_password, name, language, created_at)
        VALUES ('usr_judge_demo', 'judge.demo@caresaathi.in', ?, 'Judge Reviewer', 'en', '2026-03-01T00:00:00Z')
        """, (f"{demo_salt}${demo_hash}",))
        conn.commit()

    # Populate Treatments (Upsert to ensure newly added procedures like diabetes_care, kidney_stones, blood_tests are populated)
    for t in TREATMENT_CATALOGUE.values():
        cursor.execute("""
        INSERT OR REPLACE INTO treatments VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            t.id, t.name, t.category, json.dumps(t.aliases), t.description,
            t.indicative_min, t.indicative_max, t.package_code_pmjay,
            t.package_code_aarogyasri, t.standard_stay_duration,
            json.dumps(t.common_diagnostics_required)
        ))

    # Populate Facilities (Upsert to ensure all genuine facilities are populated)
    for f in SEED_FACILITIES:
        cursor.execute("""
        INSERT OR REPLACE INTO facilities (
            id, name, address, locality, city, state, pin_code,
            lat, lng, ownership, phone, website, rating,
            verified_treatments, empanelled_schemes, room_types,
            last_verified_date, pricing_status, price_confidence,
            facility_class, recommendation_reason,
            source_urls, verified_at, verification_status,
            departments, schemes_detail, tariff_detail
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            f.id, f.name, f.address, f.locality, f.city, f.state, f.pin_code,
            f.lat, f.lng, f.ownership, f.phone, f.website or getattr(f, 'website_url', None), f.rating,
            json.dumps(f.verified_treatments), json.dumps(f.empanelled_schemes),
            json.dumps(f.room_types), f.last_verified_date, f.pricing_status, f.price_confidence,
            getattr(f, 'facility_class', 'Standard'), getattr(f, 'recommendation_reason', None),
            json.dumps(getattr(f, 'source_urls', [])),
            getattr(f, 'verified_at', f.last_verified_date),
            getattr(f, 'verification_status', 'verified'),
            json.dumps(getattr(f, 'departments', [])),
            json.dumps(getattr(f, 'schemes_detail', [])),
            json.dumps(getattr(f, 'tariff_detail', None)) if getattr(f, 'tariff_detail', None) else None
        ))

    # Populate Schemes (Upsert to ensure all pan-India and state schemes are loaded)
    for s in SEED_SCHEMES:
        cursor.execute("""
        INSERT OR REPLACE INTO schemes (
            id, name, full_name, authority, coverage_limit_inr,
            eligibility_summary, eligible_categories, states,
            official_portal, helpline, required_documents, is_active,
            last_verified_date, official_portal_url, apply_url,
            eligibility_check_url, portal_source, portal_verified_at,
            income_ceiling_lakhs, coverage_ceiling_inr, is_cashless,
            rule_sources, can_combine_with
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            s.id, s.name, s.full_name, s.authority, s.coverage_limit_inr,
            s.eligibility_summary, json.dumps(s.eligible_categories),
            json.dumps(s.states), s.official_portal, s.helpline,
            json.dumps(s.required_documents), 1 if s.is_active else 0,
            s.last_verified_date, s.official_portal_url or s.official_portal,
            s.apply_url, s.eligibility_check_url, s.portal_source,
            s.portal_verified_at, s.income_ceiling_lakhs, s.coverage_ceiling_inr,
            1 if s.is_cashless else 0, json.dumps(s.rule_sources),
            json.dumps(s.can_combine_with)
        ))

    # Populate Cost Observations
    cursor.execute("SELECT COUNT(*) FROM cost_observations")
    if cursor.fetchone()[0] == 0:
        for c in SEED_COST_OBSERVATIONS:
            cursor.execute("""
            INSERT INTO cost_observations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                c.id, c.treatment_id, c.facility_id, c.facility_name, c.city,
                c.min_price, c.max_price, c.currency, c.price_type, c.confidence,
                c.confidence_explanation, json.dumps(c.breakdown.model_dump()),
                c.source_name, c.source_url, c.last_updated,
                json.dumps(c.key_assumptions), json.dumps(c.exclusions)
            ))

    # Populate Health Card Schemes
    for sch in SEED_HEALTH_CARD_SCHEMES:
        cursor.execute("""
        INSERT OR REPLACE INTO health_card_schemes (
            id, name, category, authority, description, applicable_states,
            coverage_limit_inr, official_portal, helpline,
            required_eligibility_info, icon_type, is_active, last_verified_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            sch["id"], sch["name"], sch["category"], sch["authority"], sch["description"],
            json.dumps(sch["applicable_states"]), sch["coverage_limit_inr"], sch["official_portal"],
            sch["helpline"], json.dumps(sch["required_eligibility_info"]), sch["icon_type"],
            sch["is_active"], sch["last_verified_date"]
        ))

    # Populate Health Card Packages
    for pkg in SEED_HEALTH_CARD_PACKAGES:
        cursor.execute("""
        INSERT OR REPLACE INTO health_card_packages (
            id, scheme_id, treatment_id, treatment_name, specialty, package_code,
            package_rate_inr, is_cashless, pre_auth_required, inclusions,
            exclusions_notes, source_url, last_verified_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            pkg["id"], pkg["scheme_id"], pkg["treatment_id"], pkg["treatment_name"],
            pkg["specialty"], pkg["package_code"], pkg["package_rate_inr"],
            pkg["is_cashless"], pkg["pre_auth_required"], json.dumps(pkg["inclusions"]),
            json.dumps(pkg["exclusions_notes"]), pkg["source_url"], pkg["last_verified_date"]
        ))

    # Populate Hospital Scheme Empanelments
    for emp in SEED_HOSPITAL_EMPANELMENTS:
        cursor.execute("""
        INSERT OR REPLACE INTO hospital_scheme_empanelments (
            id, facility_id, facility_name, scheme_id, empanelment_status,
            verification_status, specialties_covered, specific_procedures_verified,
            helpdesk_location, helpdesk_phone, source_name, source_url,
            last_verified_date, notes, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            emp["id"], emp["facility_id"], emp["facility_name"], emp["scheme_id"],
            emp["empanelment_status"], emp["verification_status"],
            json.dumps(emp["specialties_covered"]), json.dumps(emp["specific_procedures_verified"]),
            emp.get("helpdesk_location", ""), emp.get("helpdesk_phone", ""),
            emp["source_name"], emp["source_url"], emp["last_verified_date"],
            emp.get("notes", ""), emp.get("updated_by", "system")
        ))

    conn.commit()
    conn.close()

# Database Query Functions
def get_all_treatments() -> List[Treatment]:
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM treatments ORDER BY name ASC")
        rows = cursor.fetchall()
        treatments = []
        for r in rows:
            treatments.append(Treatment(
                id=r["id"],
                name=r["name"],
                category=r["category"],
                aliases=json.loads(r["aliases"] or "[]"),
                description=r["description"],
                indicative_min=r["indicative_min"],
                indicative_max=r["indicative_max"],
                package_code_pmjay=r["package_code_pmjay"],
                package_code_aarogyasri=r["package_code_aarogyasri"],
                standard_stay_duration=r["standard_stay_duration"],
                common_diagnostics_required=json.loads(r["common_diagnostics_required"] or "[]")
            ))
        conn.close()
        return treatments
    except Exception as e:
        logger.warning(f"Database query failed in get_all_treatments: {e}. Falling back to catalogue master.")
        return list(TREATMENT_CATALOGUE.values())

def get_treatment_by_id(treatment_id: str) -> Optional[Treatment]:
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM treatments WHERE id = ?", (treatment_id,))
        r = cursor.fetchone()
        conn.close()
        if not r:
            return TREATMENT_CATALOGUE.get(treatment_id)
        return Treatment(
            id=r["id"],
            name=r["name"],
            category=r["category"],
            aliases=json.loads(r["aliases"] or "[]"),
            description=r["description"],
            indicative_min=r["indicative_min"],
            indicative_max=r["indicative_max"],
            package_code_pmjay=r["package_code_pmjay"],
            package_code_aarogyasri=r["package_code_aarogyasri"],
            standard_stay_duration=r["standard_stay_duration"],
            common_diagnostics_required=json.loads(r["common_diagnostics_required"] or "[]")
        )
    except Exception as e:
        logger.warning(f"Database query failed in get_treatment_by_id({treatment_id}): {e}. Falling back to catalogue.")
        return TREATMENT_CATALOGUE.get(treatment_id)

def get_all_facilities() -> List[Facility]:
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM facilities ORDER BY name ASC")
        rows = cursor.fetchall()
        facilities = []
        for r in rows:
            col_names = r.keys()
            facilities.append(Facility(
                id=r["id"],
                name=r["name"],
                address=r["address"],
                locality=r["locality"],
                city=r["city"],
                state=r["state"],
                pin_code=r["pin_code"],
                lat=r["lat"],
                lng=r["lng"],
                ownership=r["ownership"],
                facility_class=r["facility_class"] if "facility_class" in col_names and r["facility_class"] else "Standard",
                recommendation_reason=r["recommendation_reason"] if "recommendation_reason" in col_names else None,
                phone=r["phone"],
                website=r["website"],
                website_url=r["website"],
                rating=r["rating"],
                verified_treatments=json.loads(r["verified_treatments"] or "[]"),
                empanelled_schemes=json.loads(r["empanelled_schemes"] or "[]"),
                room_types=json.loads(r["room_types"] or "{}"),
                last_verified_date=r["last_verified_date"],
                pricing_status=r["pricing_status"],
                price_confidence=r["price_confidence"],
                source_urls=json.loads(r["source_urls"] or "[]") if "source_urls" in col_names and r["source_urls"] else [],
                verified_at=r["verified_at"] if "verified_at" in col_names and r["verified_at"] else r["last_verified_date"],
                verification_status=r["verification_status"] if "verification_status" in col_names and r["verification_status"] else "verified",
                departments=json.loads(r["departments"] or "[]") if "departments" in col_names and r["departments"] else [],
                schemes_detail=json.loads(r["schemes_detail"] or "[]") if "schemes_detail" in col_names and r["schemes_detail"] else [],
                tariff_detail=json.loads(r["tariff_detail"]) if "tariff_detail" in col_names and r["tariff_detail"] else None
            ))
        conn.close()
        return facilities
    except Exception as e:
        logger.warning(f"Database query failed in get_all_facilities: {e}. Falling back to verified seed facilities.")
        return list(SEED_FACILITIES)

def get_facility_by_id(facility_id: str) -> Optional[Facility]:
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM facilities WHERE id = ?", (facility_id,))
        r = cursor.fetchone()
        conn.close()
        if not r:
            return next((f for f in SEED_FACILITIES if f.id == facility_id), None)
        col_names = r.keys()
        return Facility(
            id=r["id"],
            name=r["name"],
            address=r["address"],
            locality=r["locality"],
            city=r["city"],
            state=r["state"],
            pin_code=r["pin_code"],
            lat=r["lat"],
            lng=r["lng"],
            ownership=r["ownership"],
            facility_class=r["facility_class"] if "facility_class" in col_names and r["facility_class"] else "Standard",
            recommendation_reason=r["recommendation_reason"] if "recommendation_reason" in col_names else None,
            phone=r["phone"],
            website=r["website"],
            website_url=r["website"],
            rating=r["rating"],
            verified_treatments=json.loads(r["verified_treatments"] or "[]"),
            empanelled_schemes=json.loads(r["empanelled_schemes"] or "[]"),
            room_types=json.loads(r["room_types"] or "{}"),
            last_verified_date=r["last_verified_date"],
            pricing_status=r["pricing_status"],
            price_confidence=r["price_confidence"],
            source_urls=json.loads(r["source_urls"] or "[]") if "source_urls" in col_names and r["source_urls"] else [],
            verified_at=r["verified_at"] if "verified_at" in col_names and r["verified_at"] else r["last_verified_date"],
            verification_status=r["verification_status"] if "verification_status" in col_names and r["verification_status"] else "verified",
            departments=json.loads(r["departments"] or "[]") if "departments" in col_names and r["departments"] else [],
            schemes_detail=json.loads(r["schemes_detail"] or "[]") if "schemes_detail" in col_names and r["schemes_detail"] else [],
            tariff_detail=json.loads(r["tariff_detail"]) if "tariff_detail" in col_names and r["tariff_detail"] else None
        )
    except Exception as e:
        logger.warning(f"Database query failed in get_facility_by_id({facility_id}): {e}. Falling back to seed facilities.")
        return next((f for f in SEED_FACILITIES if f.id == facility_id), None)

def get_all_schemes() -> List[Scheme]:
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM schemes WHERE is_active = 1")
        rows = cursor.fetchall()
        schemes = []
        for r in rows:
            keys = r.keys()
            schemes.append(Scheme(
                id=r["id"],
                name=r["name"],
                full_name=r["full_name"],
                authority=r["authority"],
                coverage_limit_inr=r["coverage_limit_inr"],
                eligibility_summary=r["eligibility_summary"],
                eligible_categories=json.loads(r["eligible_categories"] or "[]"),
                states=json.loads(r["states"] or "[]"),
                official_portal=r["official_portal"],
                helpline=r["helpline"],
                required_documents=json.loads(r["required_documents"] or "[]"),
                is_active=bool(r["is_active"]),
                last_verified_date=r["last_verified_date"],
                official_portal_url=r["official_portal_url"] if "official_portal_url" in keys and r["official_portal_url"] else r["official_portal"],
                apply_url=r["apply_url"] if "apply_url" in keys else None,
                eligibility_check_url=r["eligibility_check_url"] if "eligibility_check_url" in keys else None,
                portal_source=r["portal_source"] if "portal_source" in keys and r["portal_source"] else r["authority"],
                portal_verified_at=r["portal_verified_at"] if "portal_verified_at" in keys and r["portal_verified_at"] else r["last_verified_date"],
                income_ceiling_lakhs=r["income_ceiling_lakhs"] if "income_ceiling_lakhs" in keys else None,
                coverage_ceiling_inr=r["coverage_ceiling_inr"] if "coverage_ceiling_inr" in keys else None,
                is_cashless=bool(r["is_cashless"]) if "is_cashless" in keys else True,
                rule_sources=json.loads(r["rule_sources"] or "[]") if "rule_sources" in keys and r["rule_sources"] else [],
                can_combine_with=json.loads(r["can_combine_with"] or "[]") if "can_combine_with" in keys and r["can_combine_with"] else []
            ))
        conn.close()
        return schemes
    except Exception as e:
        logger.warning(f"Database query failed in get_all_schemes: {e}. Falling back to seed schemes.")
        return [s for s in SEED_SCHEMES if s.is_active]

def get_cost_observations(treatment_id: str, facility_id: Optional[str] = None) -> List[CostObservation]:
    try:
        conn = get_connection()
        cursor = conn.cursor()
        if facility_id:
            cursor.execute("SELECT * FROM cost_observations WHERE treatment_id = ? AND facility_id = ?", (treatment_id, facility_id))
        else:
            cursor.execute("SELECT * FROM cost_observations WHERE treatment_id = ?", (treatment_id,))
        rows = cursor.fetchall()
        obs = []
        for r in rows:
            b_dict = json.loads(r["breakdown"])
            obs.append(CostObservation(
                id=r["id"],
                treatment_id=r["treatment_id"],
                facility_id=r["facility_id"],
                facility_name=r["facility_name"],
                city=r["city"],
                min_price=r["min_price"],
                max_price=r["max_price"],
                currency=r["currency"],
                price_type=r["price_type"],
                confidence=r["confidence"],
                confidence_explanation=r["confidence_explanation"],
                breakdown=CostBreakdown(**b_dict),
                source_name=r["source_name"],
                source_url=r["source_url"],
                last_updated=r["last_updated"],
                key_assumptions=json.loads(r["key_assumptions"] or "[]"),
                exclusions=json.loads(r["exclusions"] or "[]")
            ))
        conn.close()
        return obs
    except Exception as e:
        logger.warning(f"Database query failed in get_cost_observations: {e}. Falling back to seed observations.")
        return [c for c in SEED_COST_OBSERVATIONS if c.treatment_id == treatment_id and (not facility_id or c.facility_id == facility_id)]

# Health Card & Insurance Query Functions
def get_health_card_schemes() -> List[Dict[str, Any]]:
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM health_card_schemes WHERE is_active = 1 ORDER BY category ASC, name ASC")
        rows = cursor.fetchall()
        conn.close()
        schemes = []
        for r in rows:
            d = dict(r)
            d["applicable_states"] = json.loads(d.get("applicable_states") or "[]")
            d["required_eligibility_info"] = json.loads(d.get("required_eligibility_info") or "[]")
            schemes.append(d)
        return schemes
    except Exception as e:
        logger.warning(f"Error querying health_card_schemes: {e}")
        return SEED_HEALTH_CARD_SCHEMES

def get_health_card_scheme_by_id(scheme_id: str) -> Optional[Dict[str, Any]]:
    schemes = get_health_card_schemes()
    for s in schemes:
        if s["id"] == scheme_id:
            return s
    return None

def get_health_card_packages(scheme_id: Optional[str] = None, treatment_id: Optional[str] = None) -> List[Dict[str, Any]]:
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = "SELECT * FROM health_card_packages WHERE 1=1"
        params = []
        if scheme_id:
            query += " AND scheme_id = ?"
            params.append(scheme_id)
        if treatment_id:
            query += " AND treatment_id = ?"
            params.append(treatment_id)
        query += " ORDER BY treatment_name ASC"
        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()
        conn.close()
        pkgs = []
        for r in rows:
            d = dict(r)
            d["inclusions"] = json.loads(d.get("inclusions") or "[]")
            d["exclusions_notes"] = json.loads(d.get("exclusions_notes") or "[]")
            pkgs.append(d)
        return pkgs
    except Exception as e:
        logger.warning(f"Error querying health_card_packages: {e}")
        return [
            p for p in SEED_HEALTH_CARD_PACKAGES
            if (not scheme_id or p["scheme_id"] == scheme_id) and (not treatment_id or p["treatment_id"] == treatment_id)
        ]

def get_hospital_empanelments(facility_id: Optional[str] = None, scheme_id: Optional[str] = None) -> List[Dict[str, Any]]:
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = "SELECT * FROM hospital_scheme_empanelments WHERE 1=1"
        params = []
        if facility_id:
            query += " AND facility_id = ?"
            params.append(facility_id)
        if scheme_id:
            query += " AND scheme_id = ?"
            params.append(scheme_id)
        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()
        conn.close()
        emps = []
        for r in rows:
            d = dict(r)
            d["specialties_covered"] = json.loads(d.get("specialties_covered") or "[]")
            d["specific_procedures_verified"] = json.loads(d.get("specific_procedures_verified") or "[]")
            emps.append(d)
        return emps
    except Exception as e:
        logger.warning(f"Error querying hospital_scheme_empanelments: {e}")
        return [
            e for e in SEED_HOSPITAL_EMPANELMENTS
            if (not facility_id or e["facility_id"] == facility_id) and (not scheme_id or e["scheme_id"] == scheme_id)
        ]

def save_or_update_hospital_empanelment(data: Dict[str, Any]) -> bool:
    try:
        conn = get_connection()
        cursor = conn.cursor()
        emp_id = data.get("id") or f"emp_{data['facility_id']}_{data['scheme_id']}"
        cursor.execute("""
        INSERT INTO hospital_scheme_empanelments (
            id, facility_id, facility_name, scheme_id, empanelment_status,
            verification_status, specialties_covered, specific_procedures_verified,
            helpdesk_location, helpdesk_phone, source_name, source_url,
            last_verified_date, notes, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            empanelment_status = excluded.empanelment_status,
            verification_status = excluded.verification_status,
            specialties_covered = excluded.specialties_covered,
            specific_procedures_verified = excluded.specific_procedures_verified,
            helpdesk_location = excluded.helpdesk_location,
            helpdesk_phone = excluded.helpdesk_phone,
            source_name = excluded.source_name,
            source_url = excluded.source_url,
            last_verified_date = excluded.last_verified_date,
            notes = excluded.notes,
            updated_by = excluded.updated_by
        """, (
            emp_id, data["facility_id"], data.get("facility_name", ""),
            data["scheme_id"], data.get("empanelment_status", "empanelled"),
            data.get("verification_status", "verified_procedure"),
            json.dumps(data.get("specialties_covered", [])),
            json.dumps(data.get("specific_procedures_verified", [])),
            data.get("helpdesk_location", ""), data.get("helpdesk_phone", ""),
            data.get("source_name", "Official Directory"),
            data.get("source_url", ""), data.get("last_verified_date", "2026-03-15"),
            data.get("notes", ""), data.get("updated_by", "admin")
        ))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        logger.error(f"Error saving hospital empanelment: {e}")
        return False
