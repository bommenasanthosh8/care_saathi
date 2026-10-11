import math
import requests
from typing import List, Optional, Dict, Any
from ..models.schemas import Facility
from ..data.database import get_all_facilities, get_facility_by_id
from ..data.catalogue import TREATMENT_CATALOGUE
from ..config import settings
from .photo_service import get_hospital_photo_metadata

from ..data.india_geography import resolve_location, LOCATION_REGISTRY

def haversine_distance(lat1: Optional[float], lon1: Optional[float], lat2: Optional[float], lon2: Optional[float]) -> Optional[float]:
    """
    Computes great-circle distance between two GPS coordinates in kilometers.
    Returns None if any coordinate is missing, invalid, or out of valid bounds.
    """
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return None
    try:
        f_lat1, f_lon1, f_lat2, f_lon2 = float(lat1), float(lon1), float(lat2), float(lon2)
    except (TypeError, ValueError):
        return None

    if not (-90.0 <= f_lat1 <= 90.0 and -180.0 <= f_lon1 <= 180.0 and
            -90.0 <= f_lat2 <= 90.0 and -180.0 <= f_lon2 <= 180.0):
        return None

    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(f_lat2 - f_lat1)
    dlon = math.radians(f_lon2 - f_lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(f_lat1)) * math.cos(math.radians(f_lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

PROCEDURE_TO_DEPARTMENT: Dict[str, List[str]] = {
    "knee_replacement": ["Orthopedics", "Orthopaedics", "Joint Replacement", "Robotic Joint Replacement", "Arthroscopy"],
    "cataract_surgery": ["Ophthalmology", "Eye Care", "Cornea", "Cataract & Refractive"],
    "mri_brain": ["Radiology & Imaging", "Radiology", "Neurology", "Neuro Surgery", "Diagnostics & Imaging"],
    "mri_knee": ["Radiology & Imaging", "Radiology", "Orthopedics", "Diagnostics & Imaging"],
    "mri_spine": ["Radiology & Imaging", "Radiology", "Spine Surgery", "Orthopedics", "Diagnostics & Imaging"],
    "normal_delivery": ["Obstetrics & Gynecology", "Maternity Care", "Obstetrics", "Gynecology", "Pediatrics & Neonatology"],
    "caesarean_delivery": ["Obstetrics & Gynecology", "Maternity Care", "Obstetrics", "Gynecology", "Pediatrics & Neonatology"],
    "angioplasty": ["Cardiology", "Interventional Cardiology", "Cardiothoracic Surgery", "Cardiac Sciences"],
    "laparoscopic_cholecystectomy": ["General & Gastrointestinal Surgery", "General Surgery", "Gastroenterology", "Surgical Gastroenterology", "Minimally Invasive Surgery"],
    "appendectomy": ["General Surgery", "General & Gastrointestinal Surgery", "Emergency Medicine"],
    "hemodialysis": ["Nephrology", "Dialysis", "Renal Sciences", "Urology"],
    "inpatient_fever_management": ["General Medicine", "Internal Medicine", "Infectious Diseases", "Pediatrics"],
    "doctor_consultation": ["General Medicine", "Internal Medicine", "Outpatient"],
    "diabetes_care": ["Endocrinology", "Diabetology", "Internal Medicine", "General Medicine"],
    "kidney_stones": ["Urology", "Nephrology", "Lithotripsy"],
    "blood_tests": ["Pathology & Lab Medicine", "Diagnostics", "Pathology", "Biochemistry"]
}

def check_specialty_match(fac: Facility, treatment_id: Optional[str]) -> bool:
    if not treatment_id:
        return True
    if treatment_id in fac.verified_treatments:
        return True
    target_depts = [d.lower() for d in PROCEDURE_TO_DEPARTMENT.get(treatment_id, [])]
    fac_depts = [d.lower() for d in getattr(fac, 'departments', [])]
    for td in target_depts:
        for fd in fac_depts:
            if td in fd or fd in td:
                return True
    return False

def compute_rank_score(fac: Facility, treatment_id: Optional[str]) -> float:
    score = 0.0
    # 1. Relevance of specialty (highest weight)
    if fac.specialty_match:
        score += 1000.0
    elif getattr(fac, 'verification_status', 'verified') == 'verified':
        score += 150.0

    # 2. Verified scheme support
    if fac.empanelled_schemes:
        score += min(len(fac.empanelled_schemes) * 50.0, 150.0)

    # 3. Distance / Proximity (closer is better, max 150 points)
    dist = fac.distance_km if fac.distance_km is not None else 30.0
    dist_pts = max(0.0, 150.0 - dist * 4.0)
    score += dist_pts

    # 4. Rating (max 100 points)
    rating = fac.rating if fac.rating is not None else 3.8
    score += (rating / 5.0) * 100.0

    # 5. Cost factor (subsidized/predictable tariff support)
    if fac.ownership == "Government":
        score += 80.0
    elif fac.ownership == "Charitable/Trust":
        score += 60.0
    elif fac.estimated_cost_min is not None and fac.estimated_cost_min < 120000:
        score += 40.0

    return round(score, 1)

def search_facilities(
    user_lat: Optional[float] = None,
    user_lng: Optional[float] = None,
    query_city: Optional[str] = None,
    query_locality: Optional[str] = None,
    pin_code: Optional[str] = None,
    treatment_id: Optional[str] = None,
    ownership_filter: Optional[str] = None,
    scheme_filter: Optional[str] = None,
    radius_km: Optional[float] = None,
    sort_by: str = "nearest",  # best_match, nearest, lowest_cost, rating
    treatment_available_only: bool = False,
    verified_only: bool = False
) -> List[Facility]:
    all_facilities = get_all_facilities()
    results: List[Facility] = []

    # Resolve coordinates dynamically across India without forcing Hyderabad
    loc_info = resolve_location(
        city=query_city,
        district=query_locality,
        pin_code=pin_code,
        user_lat=user_lat,
        user_lng=user_lng
    )

    if user_lat is None or user_lng is None:
        user_lat = loc_info["lat"]
        user_lng = loc_info["lng"]

    treatment_obj = TREATMENT_CATALOGUE.get(treatment_id) if treatment_id else None

    # Determine if city/state matching should filter initial list
    city_filter_term = query_city.strip().lower() if query_city and query_city.strip().lower() not in ["all", "any", ""] else None

    for fac in all_facilities:
        # PIN code filter if explicitly requested
        if pin_code and pin_code.strip() and fac.pin_code != pin_code.strip():
            if city_filter_term and city_filter_term not in fac.city.lower():
                continue

        # City / State / Locality filter if city parameter is provided and no GPS radius is set
        if city_filter_term and radius_km is None:
            matches_city = (city_filter_term in fac.city.lower() or 
                            fac.city.lower() in city_filter_term or
                            (fac.locality and city_filter_term in fac.locality.lower()) or
                            (fac.locality and fac.locality.lower() in city_filter_term) or
                            city_filter_term in fac.state.lower() or
                            (city_filter_term in ["secunderabad", "kukatpally", "gachibowli", "banjara hills", "madhapur", "kondapur", "hitec city", "nizampet", "miyapur", "bachupally"] and fac.city.lower() == "hyderabad"))
            if not matches_city:
                continue

        # Ownership / Classification filter
        if ownership_filter and ownership_filter != "All":
            norm_filter = ownership_filter.lower().strip()
            if norm_filter == "premium":
                if fac.facility_class != "Premium":
                    continue
            elif norm_filter == "government":
                if fac.ownership.lower() != "government":
                    continue
            elif norm_filter == "private":
                if fac.ownership.lower() != "private":
                    continue
            elif norm_filter in ["charitable/trust", "trust", "charitable"]:
                if fac.ownership.lower() not in ["charitable/trust", "trust", "charitable"]:
                    continue

        # Specialty match check
        fac.specialty_match = check_specialty_match(fac, treatment_id)

        # Verified Only filter
        if verified_only:
            if getattr(fac, 'verification_status', 'verified') == 'unverified':
                continue
            if treatment_id and not fac.specialty_match:
                continue

        # Treatment availability filter
        if treatment_available_only and treatment_id and not fac.specialty_match:
            continue

        # Scheme filter
        if scheme_filter and scheme_filter != "All":
            norm_scheme = scheme_filter.lower().strip().replace('-', '_')
            fac_schemes = [s.lower().replace('-', '_') for s in fac.empanelled_schemes]
            if norm_scheme not in fac_schemes:
                continue

        # Calculate Distance
        fac.distance_km = haversine_distance(user_lat, user_lng, fac.lat, fac.lng)

        # Distance radius filter
        if radius_km is not None and radius_km > 0:
            if fac.distance_km is None or fac.distance_km > radius_km:
                continue

        # Estimate cost for this facility if treatment specified
        if treatment_obj:
            if fac.ownership == "Government":
                fac.estimated_cost_min = 0
                fac.estimated_cost_max = int(treatment_obj.indicative_min * 0.15) if treatment_obj.indicative_min > 5000 else 100
                fac.price_confidence = "High"
                fac.pricing_status = "Free (Govt / Aarogyasri)"
            elif fac.ownership == "Charitable/Trust":
                fac.estimated_cost_min = int(treatment_obj.indicative_min * 0.50)
                fac.estimated_cost_max = int(treatment_obj.indicative_max * 0.70)
                fac.price_confidence = "High"
                fac.pricing_status = "Subsidized Trust Rate"
            elif fac.facility_class == "Premium":
                fac.estimated_cost_min = int(treatment_obj.indicative_min * 1.30)
                fac.estimated_cost_max = int(treatment_obj.indicative_max * 1.60)
                fac.price_confidence = "Medium"
                fac.pricing_status = "Premium Quaternary Tariff"
            else:
                fac.estimated_cost_min = int(treatment_obj.indicative_min * 0.90)
                fac.estimated_cost_max = int(treatment_obj.indicative_max * 1.05)
                fac.price_confidence = "Medium"
                fac.pricing_status = "Private Reference Range"

        # Compute Evidence-Based Rank Score
        fac.rank_score = compute_rank_score(fac, treatment_id)

        # Sourced "Why this hospital" explanation built strictly from stored, verified fields
        reason_parts = []
        if treatment_id:
            if fac.specialty_match:
                matching_depts = [d for d in getattr(fac, 'departments', []) if any(td.lower() in d.lower() for td in PROCEDURE_TO_DEPARTMENT.get(treatment_id, []))]
                if matching_depts:
                    reason_parts.append(f"Verified {matching_depts[0]} department.")
                else:
                    reason_parts.append("Verified clinical specialty department.")
            else:
                reason_parts.append("Department not verified on official portal.")

        if fac.empanelled_schemes:
            schemes_str = ", ".join([s.replace('_', '-').upper() for s in fac.empanelled_schemes[:3]])
            reason_parts.append(f"Empanelled with {schemes_str}.")

        if fac.ownership == "Government":
            reason_parts.append("State subsidized care under gazette provisions.")
        elif fac.ownership == "Charitable/Trust":
            reason_parts.append("Subsidized non-profit healthcare trust.")
        elif getattr(fac, 'pricing_status', None):
            reason_parts.append(f"{fac.pricing_status}.")

        if fac.distance_km is not None and fac.distance_km <= 10:
            reason_parts.append(f"Located {fac.distance_km} km away.")

        fac.why_this_hospital = " ".join(reason_parts)
        if not fac.recommendation_reason:
            fac.recommendation_reason = fac.why_this_hospital

        # Authentic Photo Metadata
        photo_meta = get_hospital_photo_metadata(fac.id, fac.name, fac.city, fac.ownership, fac.facility_class)
        fac.image_url = photo_meta.get("image_url")
        fac.image_source = photo_meta.get("source")
        fac.image_attribution = photo_meta.get("attribution")
        fac.image_license = photo_meta.get("license")
        fac.initials = photo_meta.get("initials")

        results.append(fac)

    # Sorting
    if sort_by in ["best_match", "rank"]:
        results.sort(key=lambda x: x.rank_score or 0, reverse=True)
    elif sort_by == "nearest":
        results.sort(key=lambda x: (x.distance_km is None, x.distance_km if x.distance_km is not None else float('inf')))
    elif sort_by == "lowest_cost":
        results.sort(key=lambda x: x.estimated_cost_min if x.estimated_cost_min is not None else 9999999)
    elif sort_by == "rating":
        results.sort(key=lambda x: x.rating if x.rating is not None else 0, reverse=True)

    return results

def get_facility_details(facility_id: str, treatment_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    fac = get_facility_by_id(facility_id)
    if not fac:
        return None

    photo_meta = get_hospital_photo_metadata(fac.id, fac.name, fac.city, fac.ownership, fac.facility_class)
    fac.image_url = photo_meta.get("image_url")
    fac.image_source = photo_meta.get("source")
    fac.image_attribution = photo_meta.get("attribution")
    fac.image_license = photo_meta.get("license")
    fac.initials = photo_meta.get("initials")

    # Check verified treatments & specialty match
    fac.specialty_match = check_specialty_match(fac, treatment_id)
    treatment_verified = bool(fac.specialty_match)
    treatment_obj = None
    if treatment_id:
        treatment_obj = TREATMENT_CATALOGUE.get(treatment_id)

    return {
        "facility": fac,
        "treatment_verified": treatment_verified,
        "treatment_status_text": "Verified Specialty Department Available" if treatment_verified else "Clinical specialty not verified — contact hospital",
        "treatment_details": treatment_obj,
        "directions_url": f"https://www.google.com/maps/dir/?api=1&destination={fac.lat},{fac.lng}",
        "osm_url": f"https://www.openstreetmap.org/?mlat={fac.lat}&mlon={fac.lng}#map=16/{fac.lat}/{fac.lng}"
    }
