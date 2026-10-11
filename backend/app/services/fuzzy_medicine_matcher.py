import re
import difflib
from typing import List, Dict, Any, Optional, Tuple
from ..data.medicine_data import MEDICINE_DATABASE, get_medicine_by_id

COMMON_ABBREVIATIONS = {
    "pcm": "paracetamol",
    "panto": "pantoprazole",
    "amox": "amoxicillin",
    "azithro": "azithromycin",
    "cipro": "ciprofloxacin",
    "para": "paracetamol",
    "metfor": "metformin",
    "telo": "telmisartan",
    "ator": "atorvastatin",
    "moxi": "moxifloxacin",
    "ceftri": "ceftriaxone",
}

def clean_medicine_token(text: Optional[str]) -> str:
    """
    Normalizes a medicine string for fuzzy matching:
    - Lowercase & strip
    - Substitutes common OCR letter confusions (0/o, 1/l, rn/m, vv/w)
    - Strips form words (tab, tablet, cap, capsule, syp, inj, etc.)
    - Strips strength units and dosage numbers (650, 40, mg, mcg, etc.)
    - Expands clinical abbreviations
    """
    if not text:
        return ""
    
    t = text.lower().strip()
    
    # 1. Expand known shorthand
    tokens = t.split()
    expanded_tokens = [COMMON_ABBREVIATIONS.get(tok.strip(".,;:"), tok) for tok in tokens]
    t = " ".join(expanded_tokens)
    
    # 2. Strip dosage forms
    t = re.sub(r'\b(tab|tablets?|caps?|capsules?|syps?|syrups?|inj|injections?|drops?|ointments?|creams?|suspensions?|gels?|solutions?|iv|im|po)\b', ' ', t)
    
    # 3. Strip strength units and numbers (e.g. 81mg, 81 mg, 650mg, 40 mg, 500 mcg, 0.5%)
    t = re.sub(r'\b\d+(\.\d+)?\s*(mg|gm|mcg|ml|g|iu|%|tablets?|tabs?)\b', ' ', t)
    t = re.sub(r'\b\d+\b', ' ', t)
    
    # 4. Fix common OCR confusions on alphabetical medicine tokens
    t = t.replace("rn", "m").replace("vv", "w")
    
    # 5. Remove punctuation
    t = re.sub(r'[^a-z\s]', ' ', t)
    
    return " ".join(t.split())

def calculate_similarity(s1: str, s2: str) -> float:
    """Calculates Levenshtein-based similarity ratio between 0.0 and 1.0."""
    if not s1 or not s2:
        return 0.0
    if s1 == s2:
        return 1.0
    
    # Substring / prefix boost
    if s1 in s2 or s2 in s1:
        len_ratio = min(len(s1), len(s2)) / max(len(s1), len(s2))
        return max(0.78, len_ratio)
    
    return difflib.SequenceMatcher(None, s1, s2).ratio()

def match_extracted_medicine(
    extracted_item: Dict[str, Any],
    threshold: float = 0.35  # max distance 0.35 <=> min similarity 0.65
) -> Dict[str, Any]:
    """
    Matches an extracted medicine against MEDICINE_DATABASE.
    Returns the enriched medicine object with:
    - Top match and up to 2 alternatives
    - Match scores (0.0 to 1.0)
    - Calculated cost for branded MRP & Jan Aushadhi
    """
    raw_name = extracted_item.get("name_as_written") or extracted_item.get("name") or ""
    brand_name = extracted_item.get("brand_name") or raw_name
    generic_name = extracted_item.get("generic_name") or ""
    strength = extracted_item.get("strength") or ""
    form = extracted_item.get("form") or "Tablet"
    confidence = float(extracted_item.get("confidence") or 0.8)
    quantity = int(extracted_item.get("quantity") or 10)

    clean_raw = clean_medicine_token(raw_name)
    clean_brand = clean_medicine_token(brand_name)
    clean_generic = clean_medicine_token(generic_name)

    # Guard against pure digits, list indices (e.g. '2'), or empty tokens
    raw_str = (raw_name or "").strip()
    brand_str = (brand_name or "").strip()
    if (raw_str.isdigit() or brand_str.isdigit() or (not clean_raw and not clean_brand and not clean_generic)):
        return {
            "name_as_written": raw_name or "Medication",
            "brand_name": raw_name or "Unverified Item",
            "generic_name": None,
            "strength": strength or "Standard dose",
            "form": form or "Tablet",
            "dosage_pattern": extracted_item.get("dosage_pattern"),
            "duration_days": extracted_item.get("duration_days"),
            "quantity": quantity,
            "confidence": 0.20,
            "matched_medicine_id": None,
            "matched_brand_name": None,
            "matched_generic_name": None,
            "match_score": 0.0,
            "is_verified": False,
            "cost_branded": None,
            "cost_jan_aushadhi": None,
            "generic_alternative": None,
            "source": "Unverified in statutory database",
            "alternatives": []
        }

    candidates: List[Tuple[float, Dict[str, Any], str]] = []

    for med in MEDICINE_DATABASE:
        db_brand_clean = clean_medicine_token(med["brand_name"])
        db_generic_clean = clean_medicine_token(med["generic_name"])

        # Check against clean_brand, clean_raw, and clean_generic
        score_brand = max(
            calculate_similarity(clean_brand, db_brand_clean),
            calculate_similarity(clean_raw, db_brand_clean)
        )
        score_generic = max(
            calculate_similarity(clean_generic, db_generic_clean),
            calculate_similarity(clean_raw, db_generic_clean)
        )

        best_score = max(score_brand, score_generic)
        matched_by = "brand" if score_brand >= score_generic else "generic"

        # Additional boost if strength digits match
        if strength and med.get("strength"):
            digits_ext = re.findall(r'\d+', strength)
            digits_db = re.findall(r'\d+', med["strength"])
            if digits_ext and digits_db and digits_ext[0] == digits_db[0]:
                best_score = min(1.0, best_score + 0.08)

        # Threshold check: distance < threshold <=> similarity >= (1.0 - threshold)
        min_sim = 1.0 - threshold
        if best_score >= min_sim:
            candidates.append((best_score, med, matched_by))

    # Sort descending by match score
    candidates.sort(key=lambda x: x[0], reverse=True)

    top_match = candidates[0] if candidates else None
    top_score = top_match[0] if top_match else 0.0
    top_med = top_match[1] if top_match else None

    # Strict verification threshold: >= 0.70 similarity
    is_verified = (top_med is not None) and (top_score >= 0.70)

    # Gather up to 2 alternatives
    alternatives = []
    if len(candidates) > 1:
        for score, alt_med, _ in candidates[1:3]:
            alternatives.append({
                "medicine_id": alt_med["id"],
                "brand_name": alt_med["brand_name"],
                "generic_name": alt_med["generic_name"],
                "strength": alt_med["strength"],
                "formulation": alt_med["formulation"],
                "mrp_branded": alt_med["mrp_branded"],
                "jan_aushadhi_per_unit": alt_med["jan_aushadhi_per_unit"],
                "match_score": round(score, 2),
                "generic_alternative": alt_med["generic_alternative"]
            })

    # Calculate pricing only if verified
    cost_branded = None
    cost_jan_aushadhi = None
    if top_med and is_verified:
        if top_med.get("mrp_branded") and top_med.get("pack_size"):
            cost_branded = round((top_med["mrp_branded"] / top_med["pack_size"]) * quantity, 2)
        else:
            cost_branded = round(top_med.get("nppa_ceiling_per_unit", 0.0) * quantity, 2)
        cost_jan_aushadhi = round(top_med.get("jan_aushadhi_per_unit", 0.0) * quantity, 2)

    return {
        "name_as_written": raw_name or (top_med["brand_name"] if top_med else "Medication"),
        "brand_name": (top_med["brand_name"] if (top_med and is_verified) else brand_name),
        "generic_name": (top_med["generic_name"] if (top_med and is_verified) else (generic_name or None)),
        "strength": strength or (top_med["strength"] if (top_med and is_verified) else "Standard dose"),
        "form": (top_med["formulation"] if (top_med and is_verified) else (form or "Tablet")),
        "dosage_pattern": extracted_item.get("dosage_pattern"),
        "duration_days": extracted_item.get("duration_days"),
        "quantity": quantity,
        "confidence": round(top_score if is_verified else min(confidence, 0.50), 2),
        # Matched details
        "matched_medicine_id": top_med["id"] if (top_med and is_verified) else None,
        "matched_brand_name": top_med["brand_name"] if (top_med and is_verified) else None,
        "matched_generic_name": top_med["generic_name"] if (top_med and is_verified) else None,
        "match_score": round(top_score, 2),
        "is_verified": is_verified,
        "cost_branded": cost_branded,
        "cost_jan_aushadhi": cost_jan_aushadhi,
        "generic_alternative": top_med["generic_alternative"] if (top_med and is_verified) else None,
        "source": top_med["source"] if (top_med and is_verified) else "Unverified in statutory database",
        "alternatives": alternatives
    }
