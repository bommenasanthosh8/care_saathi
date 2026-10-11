import os
import sqlite3
from datetime import datetime, timezone
from typing import Dict, Any, List
from ..config import settings
from ..data.database import get_connection, DB_FILE
from ..models.schemas import DataQualityReportResponse

def get_data_quality_report() -> DataQualityReportResponse:
    """
    Performs a comprehensive data quality and provenance audit on the active SQLite database.
    Detects incomplete records, stale entries, coordinate anomalies, and tracks official data sources.
    """
    abs_db_path = os.path.abspath(DB_FILE)
    db_size = os.path.getsize(abs_db_path) if os.path.exists(abs_db_path) else 0

    conn = get_connection()
    cursor = conn.cursor()

    anomalies: List[str] = []

    # 1. Facilities
    cursor.execute("SELECT COUNT(*) FROM facilities")
    total_facilities = cursor.fetchone()[0]

    cursor.execute("""
        SELECT COUNT(*) FROM facilities 
        WHERE lat IS NOT NULL AND lat != 0.0 AND lng IS NOT NULL AND lng != 0.0
    """)
    facilities_with_gps = cursor.fetchone()[0]

    cursor.execute("""
        SELECT COUNT(*) FROM facilities 
        WHERE phone IS NULL OR TRIM(phone) = '' OR phone = 'None'
    """)
    facilities_missing_contact = cursor.fetchone()[0]

    # Check for facilities with invalid coordinates (outside reasonable India bounds: lat 8..37, lng 68..98)
    cursor.execute("""
        SELECT name, lat, lng FROM facilities
        WHERE lat < 8.0 OR lat > 38.0 OR lng < 68.0 OR lng > 98.0
    """)
    coord_anomalies = cursor.fetchall()
    for row in coord_anomalies:
        anomalies.append(f"Facility '{row[0]}' has coordinates ({row[1]}, {row[2]}) outside India bounds.")

    # 2. Treatments
    cursor.execute("SELECT COUNT(*) FROM treatments")
    total_treatments = cursor.fetchone()[0]

    cursor.execute("""
        SELECT COUNT(*) FROM treatments 
        WHERE category LIKE '%Diagnostic%' OR category LIKE '%Imaging%' OR category LIKE '%Pathology%'
    """)
    diagnostics_count = cursor.fetchone()[0]

    cursor.execute("""
        SELECT COUNT(*) FROM treatments 
        WHERE category LIKE '%Surg%' OR category LIKE '%Cardio%' OR category LIKE '%Ortho%' 
           OR category LIKE '%Opht%' OR category LIKE '%Mater%'
    """)
    surgical_count = cursor.fetchone()[0]

    # Check for treatments without indicative pricing
    cursor.execute("""
        SELECT name FROM treatments 
        WHERE indicative_min IS NULL OR indicative_max IS NULL OR indicative_min <= 0
    """)
    unpriced_treatments = cursor.fetchall()
    for row in unpriced_treatments:
        anomalies.append(f"Treatment '{row[0]}' is missing baseline indicative pricing bounds.")

    # 3. Schemes
    cursor.execute("SELECT COUNT(*) FROM schemes")
    total_schemes = cursor.fetchone()[0]

    # 4. Scheme Packages
    try:
        cursor.execute("SELECT COUNT(*) FROM health_card_packages")
        total_packages = cursor.fetchone()[0]

        cursor.execute("""
            SELECT COUNT(*) FROM health_card_packages 
            WHERE package_code IS NOT NULL AND TRIM(package_code) != ''
        """)
        packages_with_statutory_codes = cursor.fetchone()[0]
    except sqlite3.OperationalError:
        total_packages = 0
        packages_with_statutory_codes = 0
        anomalies.append("Table 'health_card_packages' is not present in the current database schema.")

    # 5. Empanelments
    try:
        cursor.execute("SELECT COUNT(*) FROM hospital_scheme_empanelments")
        total_empanelments = cursor.fetchone()[0]

        cursor.execute("""
            SELECT COUNT(*) FROM hospital_scheme_empanelments 
            WHERE verification_status = 'verified_procedure'
        """)
        empanelments_verified_procedure = cursor.fetchone()[0]

        cursor.execute("""
            SELECT COUNT(*) FROM hospital_scheme_empanelments 
            WHERE verification_status != 'verified_procedure'
        """)
        empanelments_needs_confirmation = cursor.fetchone()[0]
    except sqlite3.OperationalError:
        total_empanelments = 0
        empanelments_verified_procedure = 0
        empanelments_needs_confirmation = 0
        anomalies.append("Table 'hospital_scheme_empanelments' is not present in the current database schema.")

    # 6. Cost Observations
    try:
        cursor.execute("SELECT COUNT(*) FROM cost_observations")
        total_cost_observations = cursor.fetchone()[0]

        cursor.execute("""
            SELECT COUNT(*) FROM cost_observations 
            WHERE LOWER(price_type) LIKE '%official%' 
               OR LOWER(source_name) LIKE '%nims%' 
               OR LOWER(source_name) LIKE '%nha%' 
               OR LOWER(source_name) LIKE '%aarogyasri%'
               OR LOWER(source_name) LIKE '%cghs%'
        """)
        official_published_tariffs_count = cursor.fetchone()[0]
        reference_estimates_count = total_cost_observations - official_published_tariffs_count
    except sqlite3.OperationalError:
        total_cost_observations = 0
        official_published_tariffs_count = 0
        reference_estimates_count = 0

    # 7. Stale Records (records older than 2024 or with unverified dates)
    stale_count = 0
    try:
        cursor.execute("""
            SELECT COUNT(*) FROM cost_observations 
            WHERE last_updated < '2024-01-01' OR last_updated IS NULL
        """)
        stale_count += cursor.fetchone()[0]
    except sqlite3.OperationalError:
        pass

    try:
        cursor.execute("""
            SELECT COUNT(*) FROM hospital_scheme_empanelments 
            WHERE last_verified_date < '2024-01-01' OR last_verified_date IS NULL
        """)
        stale_count += cursor.fetchone()[0]
    except sqlite3.OperationalError:
        pass

    conn.close()

    data_provenance = [
        {
            "authority": "National Health Authority (NHA)",
            "document": "Ayushman Bharat PM-JAY Health Benefit Package (HBP 2.2 / HBP 2022)",
            "coverage": "National statutory package codes, cashless tariffs, and inpatient empanelment rules.",
            "status": "Official Government Master"
        },
        {
            "authority": "Aarogyasri Health Care Trust (Government of Telangana)",
            "document": "Telangana State Aarogyasri Scheme Empanelled Hospital Master & Tariff Schedule",
            "coverage": "State health scheme procedure codes, network hospitals in Hyderabad/Rangareddy, Aarogyamitra helpdesks.",
            "status": "Official State Health Authority"
        },
        {
            "authority": "Nizam's Institute of Medical Sciences (NIMS), Hyderabad",
            "document": "NIMS Hospital Official Published Diagnostic & Surgical Tariff Schedule (2026)",
            "coverage": "Autonomous public apex hospital rate card (Blood investigations, MRI, Hemodialysis, Surgeries).",
            "status": "Official Published Hospital Tariff"
        },
        {
            "authority": "National Pharmaceutical Pricing Authority (NPPA)",
            "document": "Statutory Ceiling Price Notifications (Ministry of Chemicals & Fertilizers)",
            "coverage": "Coronary stents ceiling, knee replacement orthopedic implant caps, oncology medicine ceilings.",
            "status": "Statutory Central Regulation"
        },
        {
            "authority": "OpenStreetMap & Open Data Contributor Network",
            "document": "Overpass Healthcare Amenities Registry",
            "coverage": "Geocoded coordinates, address locality mapping, hospital campus perimeter data.",
            "status": "Live Community & Geospatial Ground Truth"
        }
    ]

    return DataQualityReportResponse(
        database_path=abs_db_path,
        database_size_bytes=db_size,
        total_facilities=total_facilities,
        facilities_with_gps=facilities_with_gps,
        facilities_missing_contact=facilities_missing_contact,
        total_treatments=total_treatments,
        diagnostics_count=diagnostics_count,
        surgical_count=surgical_count,
        total_schemes=total_schemes,
        total_packages=total_packages,
        packages_with_statutory_codes=packages_with_statutory_codes,
        total_empanelments=total_empanelments,
        empanelments_verified_procedure=empanelments_verified_procedure,
        empanelments_needs_confirmation=empanelments_needs_confirmation,
        total_cost_observations=total_cost_observations,
        official_published_tariffs_count=official_published_tariffs_count,
        reference_estimates_count=reference_estimates_count,
        stale_records_count=stale_count,
        audit_timestamp=datetime.now(timezone.utc).isoformat(),
        data_provenance=data_provenance,
        anomalies_detected=anomalies
    )
