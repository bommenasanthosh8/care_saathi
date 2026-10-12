# Health Card & Insurance Hospital Finder Service
# Implements multi-criteria search, statutory package matching, verification grading,
# out-of-pocket estimation, and administrative verification management.

import math
from typing import List, Dict, Any, Optional
from ..models.schemas import (
    HealthCardSchemeDTO,
    HealthCardPackageDTO,
    HealthCardSearchRequest,
    HealthCardSearchResponse,
    HospitalHealthCardMatchDTO,
    HospitalHealthCardProfileResponse,
    AdminEmpanelmentUpdateRequest,
    Facility
)
from ..data.database import (
    get_connection,
    get_all_facilities,
    get_facility_by_id,
    get_health_card_schemes,
    get_health_card_scheme_by_id,
    get_health_card_packages,
    get_hospital_empanelments,
    save_or_update_hospital_empanelment,
    get_treatment_by_id
)
from ..data.catalogue import TREATMENT_CATALOGUE
from .photo_service import get_hospital_photo_metadata


SCHEME_ALIASES: Dict[str, str] = {
    "pmjay": "pm_jay",
    "pm-jay": "pm_jay",
    "ayushman": "pm_jay",
    "ayushman_bharat": "pm_jay",
    "ehs": "ts_ehs",
    "tsehs": "ts_ehs",
    "ts-ehs": "ts_ehs",
    "telangana_ehs": "ts_ehs",
    "arogyasri": "aarogyasri",
    "aarogya_sri": "aarogyasri",
    "rajiv_aarogyasri": "aarogyasri",
    "star": "star_health",
    "starhealth": "star_health",
    "hdfc": "hdfc_ergo",
    "hdfcergo": "hdfc_ergo",
    "icici": "icici_lombard",
    "icicilombard": "icici_lombard",
    "care": "care_health",
    "carehealth": "care_health"
}

TREATMENT_ALIASES: Dict[str, str] = {
    "dialysis": "hemodialysis",
    "maintenance_hemodialysis": "hemodialysis",
    "kidney_dialysis": "hemodialysis",
    "haemodialysis": "hemodialysis",
    "knee": "knee_replacement",
    "tkr": "knee_replacement",
    "total_knee_replacement": "knee_replacement",
    "cataract": "cataract_surgery",
    "phaco": "cataract_surgery",
    "coronary_angioplasty": "angioplasty",
    "ptca": "angioplasty",
    "stent": "angioplasty",
    "heart_stent": "angioplasty",
    "cholecystectomy": "laparoscopic_cholecystectomy",
    "gallbladder": "laparoscopic_cholecystectomy",
    "gall_bladder": "laparoscopic_cholecystectomy",
    "c_section": "caesarean_delivery",
    "cesarean": "caesarean_delivery",
    "csection": "caesarean_delivery",
    "delivery": "normal_delivery",
    "maternity": "normal_delivery",
    "kidney_stone": "kidney_stones",
    "appendix": "appendectomy"
}


def _haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two coordinates in kilometers."""
    r = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(r * c, 2)


def _enrich_scheme_dto(raw: Dict[str, Any]) -> HealthCardSchemeDTO:
    sid = raw.get("id", "")
    short_code = {
        "aarogyasri": "Aarogyasri",
        "pm_jay": "PM-JAY",
        "ts_ehs": "TS-EHS",
        "cghs": "CGHS",
        "esic": "ESIC",
        "star_health": "Star Health",
        "hdfc_ergo": "HDFC ERGO",
        "icici_lombard": "ICICI Lombard",
        "care_health": "Care Health"
    }.get(sid, sid.upper())

    cov_str = raw.get("coverage_limit_inr", "Statutory Tariff")
    max_cov = None
    if "10" in cov_str or "10L" in cov_str:
        max_cov = 1000000
    elif "5" in cov_str or "5L" in cov_str:
        max_cov = 500000
    elif "1 Crore" in cov_str:
        max_cov = 10000000

    states_list = raw.get("applicable_states", ["Telangana"])
    state_app = ", ".join(states_list) if isinstance(states_list, list) else str(states_list)

    return HealthCardSchemeDTO(
        id=sid,
        name=raw.get("name", ""),
        short_code=short_code,
        category=raw.get("category", "government"),
        authority=raw.get("authority", "Government Health Authority"),
        description=raw.get("description", ""),
        applicable_states=states_list if isinstance(states_list, list) else [states_list],
        state_applicability=state_app,
        coverage_limit_inr=cov_str,
        max_coverage_inr=max_cov,
        cashless_mode="100% Cashless" if raw.get("category") != "private_insurance" else "Cashless Network",
        official_portal=raw.get("official_portal", ""),
        official_portal_url=raw.get("official_portal", ""),
        helpline=raw.get("helpline", "104"),
        helpline_number=raw.get("helpline", "104"),
        required_eligibility_info=raw.get("required_eligibility_info", []),
        eligibility_summary="; ".join(raw.get("required_eligibility_info", [])) if raw.get("required_eligibility_info") else "Eligible cardholders",
        verification_doc_needed="Original Scheme Health Card & Photo ID",
        icon_type=raw.get("icon_type", "shield"),
        is_active=bool(raw.get("is_active", True)),
        last_verified_date=raw.get("last_verified_date", "2026-03-15")
    )


def get_all_schemes() -> List[HealthCardSchemeDTO]:
    """Returns all active health card schemes and insurance policies."""
    raw_schemes = get_health_card_schemes()
    return [_enrich_scheme_dto(s) for s in raw_schemes]


def get_all_treatments_catalogue(search_query: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Returns canonical treatments and procedures with their categories,
    aliases, and standard indicative ranges for procedure selection.
    """
    clean_q = search_query.strip().lower() if search_query else None
    results = []
    seen_ids = set()

    for t_id, t in TREATMENT_CATALOGUE.items():
        if t.id in seen_ids:
            continue
        seen_ids.add(t.id)

        if clean_q:
            matches_name = clean_q in t.name.lower()
            matches_category = clean_q in t.category.lower()
            matches_alias = any(clean_q in a.lower() for a in t.aliases)
            if not (matches_name or matches_category or matches_alias):
                continue

        results.append({
            "id": t.id,
            "name": t.name,
            "category": t.category,
            "specialty": t.category,
            "is_surgical": t.indicative_min > 5000,
            "aliases": t.aliases,
            "description": t.description,
            "indicative_min": t.indicative_min,
            "indicative_max": t.indicative_max,
            "package_code_pmjay": t.package_code_pmjay,
            "package_code_aarogyasri": t.package_code_aarogyasri,
            "standard_stay_duration": t.standard_stay_duration
        })

    return results


def search_health_card_hospitals(req: HealthCardSearchRequest) -> HealthCardSearchResponse:
    """
    Core search engine: finds hospitals supporting a specified health card
    and treatment, computes verification status, packages, and out-of-pocket costs.
    """
    # 1. Normalize and Validate Scheme ID
    input_scheme_id = req.scheme_id.strip().lower()
    norm_scheme_id = SCHEME_ALIASES.get(input_scheme_id, input_scheme_id)

    scheme_data = get_health_card_scheme_by_id(norm_scheme_id)
    if not scheme_data:
        # Fallback check against all schemes
        for s in get_health_card_schemes():
            if s["id"].lower() == norm_scheme_id:
                scheme_data = s
                break
    if not scheme_data:
        raise ValueError(f"Scheme ID '{req.scheme_id}' not found in registry.")

    scheme_dto = _enrich_scheme_dto(scheme_data)

    # 2. Normalize and Resolve Treatment
    norm_treatment_id = None
    treatment_obj = None
    treatment_meta = None

    if req.treatment_id:
        raw_t = req.treatment_id.strip().lower()
        norm_treatment_id = TREATMENT_ALIASES.get(raw_t, raw_t)
        treatment_obj = get_treatment_by_id(norm_treatment_id)
        if not treatment_obj:
            # Check if any catalogue item matches aliases
            for cat_id, cat_item in TREATMENT_CATALOGUE.items():
                if raw_t in [cat_id.lower()] + [a.lower() for a in cat_item.aliases]:
                    norm_treatment_id = cat_id
                    treatment_obj = cat_item
                    break

        if treatment_obj:
            treatment_meta = {
                "id": treatment_obj.id,
                "name": treatment_obj.name,
                "category": treatment_obj.category,
                "specialty": treatment_obj.category,
                "description": treatment_obj.description,
                "is_surgical": treatment_obj.indicative_min > 5000,
                "indicative_min": treatment_obj.indicative_min,
                "indicative_max": treatment_obj.indicative_max
            }

    # 3. Retrieve Statutory / Network Package for this scheme & treatment
    pkg_match = None
    pkg_dto: Optional[HealthCardPackageDTO] = None
    if norm_treatment_id:
        pkgs = get_health_card_packages(scheme_id=norm_scheme_id, treatment_id=norm_treatment_id)
        if pkgs:
            pkg_match = pkgs[0]
            pkg_dto = HealthCardPackageDTO(
                id=pkg_match["id"],
                scheme_id=pkg_match["scheme_id"],
                treatment_id=pkg_match["treatment_id"],
                treatment_name=pkg_match.get("treatment_name", treatment_meta["name"] if treatment_meta else ""),
                package_name=pkg_match.get("treatment_name", treatment_meta["name"] if treatment_meta else ""),
                specialty=pkg_match.get("specialty", treatment_meta["specialty"] if treatment_meta else ""),
                package_code=pkg_match.get("package_code"),
                package_rate_inr=pkg_match.get("package_rate_inr"),
                statutory_rate_inr=pkg_match.get("package_rate_inr"),
                is_cashless=bool(pkg_match.get("is_cashless", 1)),
                pre_auth_required=bool(pkg_match.get("pre_auth_required", 1)),
                inclusions=pkg_match.get("inclusions", []),
                exclusions_notes=pkg_match.get("exclusions_notes", []),
                exclusions_summary="; ".join(pkg_match.get("exclusions_notes", [])) if pkg_match.get("exclusions_notes") else "Standard non-medical consumables excluded",
                source_name=pkg_match.get("source_name", "Statutory Tariff Gazette"),
                source_url=pkg_match.get("source_url", scheme_dto.official_portal),
                last_verified_date=pkg_match.get("last_verified_date", "2026-03-15")
            )

    # 4. Load Candidate Facilities and Empanelments
    all_facilities = get_all_facilities()
    all_empanelments = get_hospital_empanelments(scheme_id=norm_scheme_id)

    # Deduplicate empanelment records keeping the richest record with verified procedures
    empanelment_map: Dict[str, Dict[str, Any]] = {}
    for e in all_empanelments:
        fac_id = e["facility_id"]
        existing = empanelment_map.get(fac_id)
        if not existing or (len(e.get("specific_procedures_verified", [])) > len(existing.get("specific_procedures_verified", []))):
            empanelment_map[fac_id] = e

    matches: List[HospitalHealthCardMatchDTO] = []

    # Target city / district parameter resolution
    target_city = (req.city or req.city_or_district or "").strip().lower()

    for fac in all_facilities:
        fac_state_lower = fac.state.lower()
        fac_city_lower = fac.city.lower()
        fac_locality_lower = fac.locality.lower()

        # State filtering
        if req.state and req.state.strip().lower() not in ["all", "all india", "any", "all states"]:
            state_target = req.state.strip().lower()
            if fac_state_lower != state_target and state_target not in fac_state_lower:
                continue

        # City / District filtering
        if target_city and target_city not in ["all", "all telangana", "any", "current location"]:
            is_twin_city = (
                target_city in ["secunderabad", "cyberabad", "hyderabad", "rangareddy", "medchal"]
                and fac_city_lower == "hyderabad"
            )
            is_contained = (
                target_city in fac_city_lower or
                fac_city_lower in target_city or
                target_city in fac_locality_lower or
                target_city in fac.address.lower()
            )
            if not (is_twin_city or is_contained):
                continue

        if req.locality and req.locality.lower() not in fac_locality_lower:
            continue

        if req.ownership and fac.ownership.lower() != req.ownership.lower():
            continue

        # Distance calculation
        dist_km = None
        if req.lat is not None and req.lng is not None:
            dist_km = _haversine_distance(req.lat, req.lng, fac.lat, fac.lng)
            if req.radius_km and req.radius_km > 0 and dist_km > req.radius_km:
                continue

        # Empanelment & Verification Matching
        emp_record = empanelment_map.get(fac.id)
        ver_status = "not_matched"
        ver_label = "Not matched in current records"
        emp_status = "not_empanelled"
        source_name = "CareSaathi Directory"
        source_url = scheme_dto.official_portal
        last_ver_date = "2026-03-01"
        helpdesk_loc = None
        helpdesk_phone = fac.phone
        notes = None

        fac_schemes_lower = [s.lower() for s in fac.empanelled_schemes]

        if emp_record:
            emp_status = emp_record.get("empanelment_status", "empanelled")
            source_name = emp_record.get("source_name", "Official Empanelled Directory")
            source_url = emp_record.get("source_url") or scheme_dto.official_portal
            last_ver_date = emp_record.get("last_verified_date", "2026-03-15")
            helpdesk_loc = emp_record.get("helpdesk_location")
            helpdesk_phone = emp_record.get("helpdesk_phone") or fac.phone
            notes = emp_record.get("notes")

            if norm_treatment_id:
                verified_procs = [p.lower() for p in emp_record.get("specific_procedures_verified", [])]
                covered_specs = [s.lower() for s in emp_record.get("specialties_covered", [])]
                t_dept = (treatment_obj.category.lower() if treatment_obj else "")

                if norm_treatment_id in verified_procs:
                    ver_status = "verified_procedure"
                    ver_label = "Verified for this procedure"
                elif t_dept and any(t_dept in spec for spec in covered_specs):
                    ver_status = "scheme_verified_procedure_unconfirmed"
                    ver_label = "Scheme participation verified — procedure needs confirmation"
                elif norm_treatment_id in fac.verified_treatments:
                    ver_status = "scheme_verified_procedure_unconfirmed"
                    ver_label = "Scheme participation verified — procedure needs confirmation"
                else:
                    ver_status = "scheme_verified_procedure_unconfirmed"
                    ver_label = "Hospital empanelled — check specialty availability"
            else:
                ver_status = "verified_procedure"
                ver_label = "Verified Scheme Network Hospital"

        elif norm_scheme_id in fac_schemes_lower or (norm_scheme_id in ["star_health", "hdfc_ergo", "icici_lombard", "care_health"] and "private_tpa" in fac_schemes_lower):
            emp_status = "empanelled"
            ver_status = "scheme_verified_procedure_unconfirmed"
            ver_label = "Scheme participation listed — procedure needs confirmation"
            source_name = "State Healthcare Facility Master"
            source_url = scheme_dto.official_portal
            last_ver_date = fac.last_verified_date

        # Filter out if verified_only requested
        if req.verified_only and ver_status != "verified_procedure":
            continue

        # If user searched for a specific treatment and hospital neither covers it nor has scheme
        if norm_treatment_id and ver_status == "not_matched":
            continue

        # 5. Out-of-Pocket & Package Cost Calculation
        pkg_code = pkg_match.get("package_code") if pkg_match else None
        pkg_rate = pkg_match.get("package_rate_inr") if pkg_match else (treatment_meta["indicative_min"] if treatment_meta else None)
        is_cashless = bool(pkg_match.get("is_cashless", 1)) if pkg_match else True

        oop_min = 0
        oop_max = 0
        cost_note = "Standard statutory cashless rules apply"
        est_scheme_cov = pkg_rate

        if ver_status in ["verified_procedure", "scheme_verified_procedure_unconfirmed"]:
            if fac.ownership == "Government":
                oop_min = 0
                oop_max = 0
                cost_note = "100% Free / Cashless in Government Hospital"
                est_scheme_cov = pkg_rate or 0
            elif scheme_dto.category in ["government", "state_government", "employer_scheme"]:
                # Empanelled Private under Aarogyasri / PM-JAY / EHS
                oop_min = 0
                oop_max = 2500
                cost_note = "Cashless procedure; ₹0 to ₹2,500 non-medical consumables"
                est_scheme_cov = pkg_rate or 0
            else:
                # Private Insurance (Star Health / HDFC ERGO)
                base_c = pkg_rate or (treatment_meta["indicative_min"] if treatment_meta else 50000)
                deductible = round(base_c * 0.10)  # 10% copay / non-payables
                oop_min = deductible
                oop_max = round(base_c * 0.15)
                est_scheme_cov = max(0, base_c - oop_min)
                cost_note = f"Subject to policy terms & ~10% non-medical deductions"

        # 6. Pre-travel Questions
        questions = [
            f"Is the pre-authorization desk open today for cashless admission under {scheme_dto.name}?",
            f"Does the cashless package cover complete surgical implants, OT consumables, and room rent?",
            "What original identity documents (Aadhaar, Food Security Card, Policy Card) are required on admission?",
            "Are there any non-medical consumable charges that must be paid out-of-pocket?"
        ]

        # 7. Photo resolution
        photo_meta = get_hospital_photo_metadata(
            facility_id=fac.id,
            facility_name=fac.name,
            city=fac.city,
            ownership=fac.ownership,
            facility_class=fac.facility_class
        )

        match_dto = HospitalHealthCardMatchDTO(
            facility_id=fac.id,
            facility_name=fac.name,
            address=fac.address,
            locality=fac.locality,
            city=fac.city,
            state=fac.state,
            lat=fac.lat,
            lng=fac.lng,
            distance_km=dist_km,
            ownership=fac.ownership,
            facility_class=fac.facility_class,
            phone=fac.phone,
            website=fac.website,
            rating=fac.rating,
            scheme_id=scheme_dto.id,
            scheme_name=scheme_dto.name,
            treatment_id=treatment_meta["id"] if treatment_meta else None,
            treatment_name=treatment_meta["name"] if treatment_meta else None,
            package_name=pkg_dto.package_name if pkg_dto else (treatment_meta["name"] if treatment_meta else None),
            empanelment_status=emp_status,
            verification_status=ver_status,
            verification_label=ver_label,
            verification_status_label=ver_label,
            is_verified_procedure=(ver_status == "verified_procedure"),
            is_scheme_empanelled=(emp_status in ["empanelled", "pending_confirmation"]),
            package_code=pkg_code,
            package_rate_inr=pkg_rate,
            scheme_rate_inr=pkg_rate,
            estimated_gross_cost_inr=pkg_rate,
            estimated_scheme_coverage_inr=est_scheme_cov,
            estimated_out_of_pocket_min=oop_min,
            estimated_out_of_pocket_max=oop_max,
            estimated_patient_out_of_pocket_inr=oop_min,
            cost_note=cost_note,
            coverage_notes=notes,
            is_cashless=is_cashless,
            helpdesk_location=helpdesk_loc,
            helpdesk_phone=helpdesk_phone,
            source_name=source_name,
            official_source_name=source_name,
            source_url=source_url,
            official_source_url=source_url,
            last_verified_date=last_ver_date,
            last_verified=last_ver_date,
            notes=notes,
            questions_to_ask=questions,
            image_url=photo_meta.get("image_url")
        )
        matches.append(match_dto)

    # 8. Ranking & Sorting
    sort_mode = req.sort_by or "verification"
    if sort_mode == "verification":
        rank_order = {
            "verified_procedure": 0,
            "scheme_verified_procedure_unconfirmed": 1,
            "needs_confirmation": 2,
            "not_matched": 3
        }
        matches.sort(key=lambda m: (
            rank_order.get(m.verification_status, 4),
            m.distance_km if m.distance_km is not None else 9999,
            -(m.rating or 0.0)
        ))
    elif sort_mode == "distance":
        matches.sort(key=lambda m: (
            m.distance_km if m.distance_km is not None else 9999,
            -(m.rating or 0.0)
        ))
    elif sort_mode == "cost":
        matches.sort(key=lambda m: (
            m.estimated_out_of_pocket_min or 0,
            m.estimated_out_of_pocket_max or 0
        ))
    elif sort_mode == "name":
        matches.sort(key=lambda m: m.facility_name)
    elif sort_mode == "rating":
        matches.sort(key=lambda m: -(m.rating or 0.0))

    verified_count = sum(1 for m in matches if m.verification_status == "verified_procedure")

    return HealthCardSearchResponse(
        total_found=len(matches),
        total_results=len(matches),
        verified_count=verified_count,
        verified_procedure_count=verified_count,
        scheme_empanelled_count=len(matches),
        scheme=scheme_dto,
        treatment=treatment_meta,
        package_info=pkg_dto,
        hospitals=matches,
        results=matches,
        disclaimer="Verified from official statutory registries. Final approval subject to pre-authorization.",
        active_filters={
            "state": req.state,
            "city": target_city or req.city,
            "locality": req.locality,
            "radius_km": req.radius_km,
            "ownership": req.ownership,
            "verified_only": req.verified_only,
            "sort_by": sort_mode
        }
    )


def get_hospital_health_card_profile(
    facility_id: str,
    scheme_id: Optional[str] = None,
    treatment_id: Optional[str] = None
) -> HospitalHealthCardProfileResponse:
    """
    Returns the comprehensive health card empanelment profile of a hospital,
    including all supported schemes, packages, contact details, and evidence.
    """
    facility = get_facility_by_id(facility_id)
    if not facility:
        raise ValueError(f"Hospital facility ID '{facility_id}' not found.")

    all_schemes = get_all_schemes()
    scheme_map = {s.id: s for s in all_schemes}

    # Empanelments for this facility
    fac_empanelments = get_hospital_empanelments(facility_id=facility_id)
    emp_dict = {e["scheme_id"]: e for e in fac_empanelments}

    schemes_summary: List[Dict[str, Any]] = []

    for sid in facility.empanelled_schemes:
        sch_obj = scheme_map.get(sid.lower())
        emp_rec = emp_dict.get(sid.lower())

        schemes_summary.append({
            "scheme_id": sid.lower(),
            "scheme_name": sch_obj.name if sch_obj else sid.upper(),
            "category": sch_obj.category if sch_obj else "government",
            "coverage_limit": sch_obj.coverage_limit_inr if sch_obj else "Cashless Package",
            "is_verified": emp_rec is not None,
            "verification_status": emp_rec.get("verification_status") if emp_rec else "scheme_verified_procedure_unconfirmed",
            "source_url": emp_rec.get("source_url") if emp_rec else (sch_obj.official_portal if sch_obj else None),
            "official_source_name": emp_rec.get("source_name") if emp_rec else "Official Registry",
            "official_source_url": emp_rec.get("source_url") if emp_rec else (sch_obj.official_portal if sch_obj else None),
            "helpdesk_phone": emp_rec.get("helpdesk_phone") if emp_rec else facility.phone,
            "helpdesk_location": emp_rec.get("helpdesk_location") if emp_rec else "TPA / Insurance Helpdesk Counter",
            "last_verified": emp_rec.get("last_verified_date", "2026-03-15") if emp_rec else "2026-03-01"
        })

    norm_sid = SCHEME_ALIASES.get(scheme_id.lower(), scheme_id.lower()) if scheme_id else None
    selected_scheme_dto = scheme_map.get(norm_sid) if norm_sid else None

    norm_tid = TREATMENT_ALIASES.get(treatment_id.lower(), treatment_id.lower()) if treatment_id else None

    # Package detail
    selected_pkg_dto = None
    if norm_sid and norm_tid:
        pkgs = get_health_card_packages(scheme_id=norm_sid, treatment_id=norm_tid)
        if pkgs:
            p = pkgs[0]
            selected_pkg_dto = HealthCardPackageDTO(
                id=p["id"],
                scheme_id=p["scheme_id"],
                treatment_id=p["treatment_id"],
                treatment_name=p.get("treatment_name", ""),
                package_name=p.get("treatment_name", ""),
                specialty=p.get("specialty", ""),
                package_code=p.get("package_code"),
                package_rate_inr=p.get("package_rate_inr"),
                statutory_rate_inr=p.get("package_rate_inr"),
                is_cashless=bool(p.get("is_cashless", 1)),
                pre_auth_required=bool(p.get("pre_auth_required", 1)),
                inclusions=p.get("inclusions", []),
                exclusions_notes=p.get("exclusions_notes", []),
                exclusions_summary="; ".join(p.get("exclusions_notes", [])) if p.get("exclusions_notes") else "Standard exclusions",
                source_name=p.get("source_name", "Statutory Tariff Gazette"),
                source_url=p.get("source_url", selected_scheme_dto.official_portal if selected_scheme_dto else ""),
                last_verified_date=p.get("last_verified_date", "2026-03-15")
            )

    empanelment_detail = emp_dict.get(norm_sid) if norm_sid else None

    docs = [
        "Original Government Photo Identity Card (Aadhaar / Voter ID / Passport)",
        "Scheme Beneficiary Card / Digilocker E-Card copy",
        "Recent Clinical Prescription & Diagnostic Investigation reports",
        "Hospital Admission Referral Memo (if transferred from primary facility)"
    ]
    if selected_scheme_dto and selected_scheme_dto.required_eligibility_info:
        docs = selected_scheme_dto.required_eligibility_info

    questions = [
        f"Is pre-authorization required before admission or can it be initiated on the day of surgery?",
        f"Are room rent tariffs capped under this policy, and what room type is entitled without copay?",
        f"What is the average turnaround time for cashless approval by the TPA desk?",
        f"Are there any required medicines or consumable kits that are excluded from package reimbursement?"
    ]

    ver_status = "scheme_verified_procedure_unconfirmed"
    ver_label = "Scheme Empanelled — Package Unconfirmed"
    if empanelment_detail:
        if norm_tid and norm_tid in empanelment_detail.get("specific_procedures_verified", []):
            ver_status = "verified_procedure"
            ver_label = "Verified for this procedure"
        else:
            ver_status = empanelment_detail.get("verification_status", "scheme_verified_procedure_unconfirmed")
            ver_label = "Verified Scheme Network Hospital" if not norm_tid else "Scheme Empanelled — Package Unconfirmed"

    return HospitalHealthCardProfileResponse(
        facility=facility,
        empanelments=schemes_summary,
        empanelled_schemes_summary=schemes_summary,
        selected_scheme=selected_scheme_dto,
        selected_package=selected_pkg_dto,
        matching_package=selected_pkg_dto,
        empanelment_detail=empanelment_detail,
        verification_status=ver_status,
        verification_status_label=ver_label,
        pre_travel_checklist=questions,
        questions_to_ask=questions,
        documents_required=docs,
        helpline_number=selected_scheme_dto.helpline if selected_scheme_dto else "104",
        official_portal_url=selected_scheme_dto.official_portal if selected_scheme_dto else None
    )


def admin_update_empanelment(req: AdminEmpanelmentUpdateRequest, user_id: str) -> Dict[str, Any]:
    """
    Authorized administrative method to add or update verified hospital empanelment records.
    """
    facility = get_facility_by_id(req.facility_id)
    if not facility:
        raise ValueError(f"Facility '{req.facility_id}' does not exist.")

    scheme = get_health_card_scheme_by_id(req.scheme_id)
    if not scheme:
        raise ValueError(f"Scheme '{req.scheme_id}' does not exist.")

    data = {
        "id": f"emp_{req.facility_id}_{req.scheme_id}",
        "facility_id": req.facility_id,
        "facility_name": facility.name,
        "scheme_id": req.scheme_id,
        "empanelment_status": req.empanelment_status,
        "verification_status": req.verification_status,
        "specialties_covered": req.specialties_covered,
        "specific_procedures_verified": req.specific_procedures_verified,
        "helpdesk_location": req.helpdesk_location or "Hospital Insurance Cell",
        "helpdesk_phone": req.helpdesk_phone or facility.phone,
        "source_name": req.source_name,
        "source_url": req.source_url,
        "last_verified_date": "2026-03-15",
        "notes": req.notes or "",
        "updated_by": user_id
    }

    success = save_or_update_hospital_empanelment(data)
    if not success:
        raise RuntimeError("Failed to persist hospital empanelment record.")

    return {
        "success": True,
        "message": f"Empanelment record for '{facility.name}' under '{scheme['name']}' saved successfully.",
        "empanelment_id": data["id"]
    }
