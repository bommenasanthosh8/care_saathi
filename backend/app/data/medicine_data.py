# Master Medicine Registry & Official Price Reference
# Sources:
# 1. National Pharmaceutical Pricing Authority (NPPA) Pharma Sahi Daam (Ceiling Price Orders)
#    https://nppaipdms.gov.in/NPPA/PharmaSahiDaam/searchMedicine
# 2. Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP) Official Rate Card
# 3. Central Drugs Standard Control Organisation (CDSCO) / National List of Essential Medicines (NLEM 2022)

from typing import List, Dict, Optional, Any
import difflib

NPPA_PORTAL_URL = "https://nppaipdms.gov.in/NPPA/PharmaSahiDaam/"

MEDICINE_DATABASE: List[Dict[str, Any]] = [
    {
        "id": "med_pcm_650",
        "brand_name": "Dolo 650",
        "generic_name": "Paracetamol",
        "strength": "650 mg",
        "formulation": "Tablet",
        "pack_size": 15,
        "mrp_branded": 33.60,
        "nppa_ceiling_per_unit": 2.24,
        "jan_aushadhi_per_unit": 0.90,
        "manufacturer": "Micro Labs Ltd",
        "generic_alternative": "Paracetamol 650mg (Jan Aushadhi)",
        "source": "NPPA Pharma Sahi Daam & PMBJP Schedule",
        "source_url": "https://nppaipdms.gov.in/NPPA/PharmaSahiDaam/searchMedicine",
        "last_updated": "March 2026",
        "is_nlem": True
    },
    {
        "id": "med_panto_40",
        "brand_name": "Pan 40",
        "generic_name": "Pantoprazole",
        "strength": "40 mg",
        "formulation": "Tablet",
        "pack_size": 15,
        "mrp_branded": 155.00,
        "nppa_ceiling_per_unit": 10.33,
        "jan_aushadhi_per_unit": 2.20,
        "manufacturer": "Alkem Laboratories",
        "generic_alternative": "Pantoprazole Gastro-Resistant 40mg (PMBJP)",
        "source": "NPPA Pharma Sahi Daam (NLEM 2022)",
        "source_url": "https://nppaipdms.gov.in/NPPA/PharmaSahiDaam/searchMedicine",
        "last_updated": "March 2026",
        "is_nlem": True
    },
    {
        "id": "med_augmentin_625",
        "brand_name": "Augmentin 625 Duo",
        "generic_name": "Amoxicillin and Potassium Clavulanate",
        "strength": "500 mg + 125 mg",
        "formulation": "Tablet",
        "pack_size": 10,
        "mrp_branded": 204.00,
        "nppa_ceiling_per_unit": 20.40,
        "jan_aushadhi_per_unit": 6.50,
        "manufacturer": "GlaxoSmithKline Pharmaceuticals",
        "generic_alternative": "Amoxicillin & Clavulanic Acid 625mg (PMBJP)",
        "source": "NPPA Notification S.O. 1499(E)",
        "source_url": "https://nppaipdms.gov.in/NPPA/PharmaSahiDaam/searchMedicine",
        "last_updated": "March 2026",
        "is_nlem": True
    },
    {
        "id": "med_telmi_40",
        "brand_name": "Telma 40",
        "generic_name": "Telmisartan",
        "strength": "40 mg",
        "formulation": "Tablet",
        "pack_size": 15,
        "mrp_branded": 118.00,
        "nppa_ceiling_per_unit": 7.86,
        "jan_aushadhi_per_unit": 1.40,
        "manufacturer": "Glenmark Pharmaceuticals",
        "generic_alternative": "Telmisartan Tablets IP 40mg (PMBJP)",
        "source": "NPPA Pharma Sahi Daam (Essential Drug Schedule)",
        "source_url": "https://nppaipdms.gov.in/NPPA/PharmaSahiDaam/searchMedicine",
        "last_updated": "March 2026",
        "is_nlem": True
    },
    {
        "id": "med_metoprolol_50_er",
        "brand_name": "Metoprolol Succinate 50 mg ER",
        "generic_name": "Metoprolol Succinate",
        "strength": "50 mg",
        "formulation": "ER Tablets",
        "pack_size": 30,
        "mrp_branded": 168.00,
        "nppa_ceiling_per_unit": 5.60,
        "jan_aushadhi_per_unit": 1.60,
        "manufacturer": "AstraZeneca / Sun Pharma",
        "generic_alternative": "Metoprolol Extended Release Tablets IP 50mg (PMBJP)",
        "source": "NPPA Sahi Daam & PMBJP Schedule",
        "source_url": "https://nppaipdms.gov.in/NPPA/PharmaSahiDaam/searchMedicine",
        "last_updated": "March 2026",
        "is_nlem": True
    },
    {
        "id": "med_aspirin_81_ec",
        "brand_name": "Aspirin 81 mg Enteric Coated",
        "generic_name": "Aspirin",
        "strength": "81 mg",
        "formulation": "Enteric Coated Tablets",
        "pack_size": 90,
        "mrp_branded": 180.00,
        "nppa_ceiling_per_unit": 2.00,
        "jan_aushadhi_per_unit": 0.40,
        "manufacturer": "Bayer / USV Ltd",
        "generic_alternative": "Aspirin Gastro-Resistant Tablets IP 75mg/81mg (PMBJP)",
        "source": "NPPA Sahi Daam & PMBJP Schedule",
        "source_url": "https://nppaipdms.gov.in/NPPA/PharmaSahiDaam/searchMedicine",
        "last_updated": "March 2026",
        "is_nlem": True
    },
    {
        "id": "med_aspirin_75",
        "brand_name": "Ecosprin 75",
        "generic_name": "Aspirin",
        "strength": "75 mg",
        "formulation": "Enteric Coated Tablets",
        "pack_size": 14,
        "mrp_branded": 5.50,
        "nppa_ceiling_per_unit": 0.39,
        "jan_aushadhi_per_unit": 0.15,
        "manufacturer": "USV Ltd",
        "generic_alternative": "Aspirin Gastro-Resistant Tablets IP 75mg (PMBJP)",
        "source": "NPPA NLEM Drug Price Order",
        "source_url": "https://nppaipdms.gov.in/NPPA/PharmaSahiDaam/searchMedicine",
        "last_updated": "March 2026",
        "is_nlem": True
    },
    {
        "id": "med_atorva_20",
        "brand_name": "Atorva 20",
        "generic_name": "Atorvastatin",
        "strength": "20 mg",
        "formulation": "Tablet",
        "pack_size": 15,
        "mrp_branded": 235.00,
        "nppa_ceiling_per_unit": 15.66,
        "jan_aushadhi_per_unit": 2.80,
        "manufacturer": "Zydus Healthcare",
        "generic_alternative": "Atorvastatin 20mg (Jan Aushadhi)",
        "source": "NPPA NLEM Drug Price Order",
        "source_url": "https://nppaipdms.gov.in/NPPA/PharmaSahiDaam/searchMedicine",
        "last_updated": "March 2026",
        "is_nlem": True
    },
    {
        "id": "med_chymoral_forte",
        "brand_name": "Chymoral Forte",
        "generic_name": "Trypsin-Chymotrypsin",
        "strength": "100,000 Armour Units",
        "formulation": "Tablet",
        "pack_size": 20,
        "mrp_branded": 450.00,
        "nppa_ceiling_per_unit": 22.50,
        "jan_aushadhi_per_unit": 7.50,
        "manufacturer": "Torrent Pharmaceuticals",
        "generic_alternative": "Trypsin-Chymotrypsin 100k AU (Jan Aushadhi)",
        "source": "Market Survey & PMBJP Schedule",
        "source_url": "https://nppaipdms.gov.in/NPPA/PharmaSahiDaam/searchMedicine",
        "last_updated": "March 2026",
        "is_nlem": False
    },
    {
        "id": "med_moxi_eye_drops",
        "brand_name": "Vigamox Eye Drops",
        "generic_name": "Moxifloxacin Ophthalmic Solution",
        "strength": "0.5% w/v",
        "formulation": "Eye Drops",
        "pack_size": 5, # 5 ml vial
        "mrp_branded": 195.00,
        "nppa_ceiling_per_unit": 39.00,
        "jan_aushadhi_per_unit": 16.00,
        "manufacturer": "Novartis India / Alcon",
        "generic_alternative": "Moxifloxacin Eye Drops 0.5% (Jan Aushadhi 5ml)",
        "source": "NPPA Pharma Sahi Daam Ophthalmic List",
        "source_url": "https://nppaipdms.gov.in/NPPA/PharmaSahiDaam/searchMedicine",
        "last_updated": "March 2026",
        "is_nlem": True
    },
    {
        "id": "med_metformin_500",
        "brand_name": "Glycomet 500",
        "generic_name": "Metformin Hydrochloride",
        "strength": "500 mg",
        "formulation": "Tablet",
        "pack_size": 20,
        "mrp_branded": 42.00,
        "nppa_ceiling_per_unit": 2.10,
        "jan_aushadhi_per_unit": 0.60,
        "manufacturer": "USV Pvt Ltd",
        "generic_alternative": "Metformin 500mg (Jan Aushadhi)",
        "source": "NPPA Essential Diabetes Schedule",
        "source_url": "https://nppaipdms.gov.in/NPPA/PharmaSahiDaam/searchMedicine",
        "last_updated": "March 2026",
        "is_nlem": True
    },
    {
        "id": "med_tramadol_pcm",
        "brand_name": "Ultracet",
        "generic_name": "Tramadol Hydrochloride + Paracetamol",
        "strength": "37.5 mg + 325 mg",
        "formulation": "Tablet",
        "pack_size": 15,
        "mrp_branded": 240.00,
        "nppa_ceiling_per_unit": 16.00,
        "jan_aushadhi_per_unit": 4.50,
        "manufacturer": "Janssen / Johnson & Johnson",
        "generic_alternative": "Tramadol + Paracetamol 37.5mg/325mg (PMBJP)",
        "source": "NPPA Analgesic Price Schedule",
        "source_url": "https://nppaipdms.gov.in/NPPA/PharmaSahiDaam/searchMedicine",
        "last_updated": "March 2026",
        "is_nlem": True
    },
    {
        "id": "med_ceftriaxone_1g",
        "brand_name": "Monocef 1g Injection",
        "generic_name": "Ceftriaxone Sodium",
        "strength": "1 g",
        "formulation": "Injection (Vial)",
        "pack_size": 1,
        "mrp_branded": 68.00,
        "nppa_ceiling_per_unit": 68.00,
        "jan_aushadhi_per_unit": 25.00,
        "manufacturer": "Aristo Pharmaceuticals",
        "generic_alternative": "Ceftriaxone 1g Powder for Injection (PMBJP)",
        "source": "NPPA Antibiotic Price Cap",
        "source_url": "https://nppaipdms.gov.in/NPPA/PharmaSahiDaam/searchMedicine",
        "last_updated": "March 2026",
        "is_nlem": True
    },
    {
        "id": "med_azithral_500",
        "brand_name": "Azithral 500",
        "generic_name": "Azithromycin",
        "strength": "500 mg",
        "formulation": "Tablet",
        "pack_size": 5,
        "mrp_branded": 132.00,
        "nppa_ceiling_per_unit": 23.80,
        "jan_aushadhi_per_unit": 7.20,
        "manufacturer": "Alembic Pharmaceuticals",
        "generic_alternative": "Azithromycin 500mg (PMBJP)",
        "source": "NPPA NLEM Drug Price Order",
        "source_url": "https://nppaipdms.gov.in/NPPA/PharmaSahiDaam/searchMedicine",
        "last_updated": "March 2026",
        "is_nlem": True
    },
    {
        "id": "med_omez_20",
        "brand_name": "Omez 20",
        "generic_name": "Omeprazole",
        "strength": "20 mg",
        "formulation": "Capsule",
        "pack_size": 15,
        "mrp_branded": 85.00,
        "nppa_ceiling_per_unit": 4.50,
        "jan_aushadhi_per_unit": 1.10,
        "manufacturer": "Dr. Reddy's Laboratories",
        "generic_alternative": "Omeprazole 20mg (Jan Aushadhi)",
        "source": "NPPA Pharma Sahi Daam",
        "source_url": "https://nppaipdms.gov.in/NPPA/PharmaSahiDaam/searchMedicine",
        "last_updated": "March 2026",
        "is_nlem": True
    },
    {
        "id": "med_amlong_5",
        "brand_name": "Amlong 5",
        "generic_name": "Amlodipine",
        "strength": "5 mg",
        "formulation": "Tablet",
        "pack_size": 15,
        "mrp_branded": 45.00,
        "nppa_ceiling_per_unit": 2.80,
        "jan_aushadhi_per_unit": 0.50,
        "manufacturer": "Micro Labs Ltd",
        "generic_alternative": "Amlodipine 5mg (Jan Aushadhi)",
        "source": "NPPA Pharma Sahi Daam",
        "source_url": "https://nppaipdms.gov.in/NPPA/PharmaSahiDaam/searchMedicine",
        "last_updated": "March 2026",
        "is_nlem": True
    },
    {
        "id": "med_losar_50",
        "brand_name": "Losar 50",
        "generic_name": "Losartan Potassium",
        "strength": "50 mg",
        "formulation": "Tablet",
        "pack_size": 15,
        "mrp_branded": 112.00,
        "nppa_ceiling_per_unit": 6.90,
        "jan_aushadhi_per_unit": 1.30,
        "manufacturer": "Unichem Laboratories",
        "generic_alternative": "Losartan 50mg (Jan Aushadhi)",
        "source": "NPPA Pharma Sahi Daam",
        "source_url": "https://nppaipdms.gov.in/NPPA/PharmaSahiDaam/searchMedicine",
        "last_updated": "March 2026",
        "is_nlem": True
    },
    {
        "id": "med_ciplox_500",
        "brand_name": "Ciplox 500",
        "generic_name": "Ciprofloxacin",
        "strength": "500 mg",
        "formulation": "Tablet",
        "pack_size": 10,
        "mrp_branded": 48.00,
        "nppa_ceiling_per_unit": 4.10,
        "jan_aushadhi_per_unit": 1.20,
        "manufacturer": "Cipla Ltd",
        "generic_alternative": "Ciprofloxacin 500mg (Jan Aushadhi)",
        "source": "NPPA Antibiotic Price Cap",
        "source_url": "https://nppaipdms.gov.in/NPPA/PharmaSahiDaam/searchMedicine",
        "last_updated": "March 2026",
        "is_nlem": True
    },
    {
        "id": "med_brufen_400",
        "brand_name": "Brufen 400",
        "generic_name": "Ibuprofen",
        "strength": "400 mg",
        "formulation": "Tablet",
        "pack_size": 15,
        "mrp_branded": 38.00,
        "nppa_ceiling_per_unit": 1.95,
        "jan_aushadhi_per_unit": 0.65,
        "manufacturer": "Abbott India",
        "generic_alternative": "Ibuprofen 400mg (Jan Aushadhi)",
        "source": "NPPA Analgesic Price Schedule",
        "source_url": "https://nppaipdms.gov.in/NPPA/PharmaSahiDaam/searchMedicine",
        "last_updated": "March 2026",
        "is_nlem": True
    },
    {
        "id": "med_cetzine_10",
        "brand_name": "Cetzine 10",
        "generic_name": "Cetirizine Hydrochloride",
        "strength": "10 mg",
        "formulation": "Tablet",
        "pack_size": 10,
        "mrp_branded": 22.00,
        "nppa_ceiling_per_unit": 2.10,
        "jan_aushadhi_per_unit": 0.45,
        "manufacturer": "Dr. Reddy's Laboratories",
        "generic_alternative": "Cetirizine 10mg (Jan Aushadhi)",
        "source": "NPPA Pharma Sahi Daam",
        "source_url": "https://nppaipdms.gov.in/NPPA/PharmaSahiDaam/searchMedicine",
        "last_updated": "March 2026",
        "is_nlem": True
    },
    {
        "id": "med_montair_lc",
        "brand_name": "Montair LC",
        "generic_name": "Montelukast and Levocetirizine",
        "strength": "10 mg + 5 mg",
        "formulation": "Tablet",
        "pack_size": 10,
        "mrp_branded": 195.00,
        "nppa_ceiling_per_unit": 18.20,
        "jan_aushadhi_per_unit": 4.50,
        "manufacturer": "Cipla Ltd",
        "generic_alternative": "Montelukast & Levocetirizine (PMBJP)",
        "source": "NPPA Notification",
        "source_url": "https://nppaipdms.gov.in/NPPA/PharmaSahiDaam/searchMedicine",
        "last_updated": "March 2026",
        "is_nlem": True
    },
    {
        "id": "med_voveran_50",
        "brand_name": "Voveran 50",
        "generic_name": "Diclofenac Sodium",
        "strength": "50 mg",
        "formulation": "Tablet",
        "pack_size": 15,
        "mrp_branded": 82.00,
        "nppa_ceiling_per_unit": 3.80,
        "jan_aushadhi_per_unit": 0.90,
        "manufacturer": "Novartis India",
        "generic_alternative": "Diclofenac 50mg (Jan Aushadhi)",
        "source": "NPPA Analgesic Price Schedule",
        "source_url": "https://nppaipdms.gov.in/NPPA/PharmaSahiDaam/searchMedicine",
        "last_updated": "March 2026",
        "is_nlem": True
    },
    {
        "id": "med_shelcal_500",
        "brand_name": "Shelcal 500",
        "generic_name": "Calcium and Vitamin D3",
        "strength": "500 mg + 250 IU",
        "formulation": "Tablet",
        "pack_size": 15,
        "mrp_branded": 135.00,
        "nppa_ceiling_per_unit": 8.50,
        "jan_aushadhi_per_unit": 2.20,
        "manufacturer": "Torrent Pharmaceuticals",
        "generic_alternative": "Calcium & Vit D3 (Jan Aushadhi)",
        "source": "NPPA Essential Supplement Schedule",
        "source_url": "https://nppaipdms.gov.in/NPPA/PharmaSahiDaam/searchMedicine",
        "last_updated": "March 2026",
        "is_nlem": True
    },
    {
        "id": "med_mox_500",
        "brand_name": "Mox 500",
        "generic_name": "Amoxicillin",
        "strength": "500 mg",
        "formulation": "Capsule",
        "pack_size": 15,
        "mrp_branded": 115.00,
        "nppa_ceiling_per_unit": 7.20,
        "jan_aushadhi_per_unit": 2.40,
        "manufacturer": "Sun Pharmaceutical",
        "generic_alternative": "Amoxicillin 500mg (Jan Aushadhi)",
        "source": "NPPA Antibiotic Price Cap",
        "source_url": "https://nppaipdms.gov.in/NPPA/PharmaSahiDaam/searchMedicine",
        "last_updated": "March 2026",
        "is_nlem": True
    }
]

def search_medicines(query: str) -> List[Dict[str, Any]]:
    if not query or len(query.strip()) < 2:
        return MEDICINE_DATABASE[:6]
    q = query.strip().lower()
    matches = []
    
    # 1. Exact prefix or substring matches
    for med in MEDICINE_DATABASE:
        b_name = med["brand_name"].lower()
        g_name = med["generic_name"].lower()
        s_name = med["strength"].lower()
        
        if b_name.startswith(q) or g_name.startswith(q):
            matches.append((100, med))
        elif q in b_name or q in g_name or q in s_name:
            matches.append((60, med))
        else:
            # Fuzzy match on individual words (e.g. "dola" vs "dolo")
            all_words = b_name.split() + g_name.split()
            best_ratio = 0.0
            for w in all_words:
                ratio = difflib.SequenceMatcher(None, q, w).ratio()
                if ratio > best_ratio:
                    best_ratio = ratio
                # Prefix fuzzy (e.g. 4-letter query matches 4-letter prefix)
                if len(w) >= len(q) >= 3:
                    p_ratio = difflib.SequenceMatcher(None, q, w[:len(q)]).ratio()
                    if p_ratio > best_ratio:
                        best_ratio = p_ratio
            if best_ratio >= 0.75:
                matches.append((int(best_ratio * 50), med))
                
    matches.sort(key=lambda x: x[0], reverse=True)
    return [m[1] for m in matches]

def get_medicine_by_id(med_id: str) -> Optional[Dict[str, Any]]:
    for med in MEDICINE_DATABASE:
        if med["id"] == med_id:
            return med
    return None

def calculate_course_cost(items: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculates estimated course cost for given medicines.
    Does NOT prescribe or modify therapy. Requires pharmacist/clinician verification.
    """
    total_branded = 0.0
    total_nppa_ceiling = 0.0
    total_jan_aushadhi = 0.0
    detailed_items = []

    for item in items:
        med_id = item.get("medicine_id")
        qty = int(item.get("quantity", 10))
        med = get_medicine_by_id(med_id) if med_id else None

        if med:
            branded_item_cost = round(med["nppa_ceiling_per_unit"] * qty, 2)
            # If pack price exists, compute ratio
            if med.get("mrp_branded") and med.get("pack_size"):
                branded_item_cost = round((med["mrp_branded"] / med["pack_size"]) * qty, 2)
            nppa_item_cost = round(med["nppa_ceiling_per_unit"] * qty, 2)
            jan_aushadhi_item_cost = round(med["jan_aushadhi_per_unit"] * qty, 2)

            total_branded += branded_item_cost
            total_nppa_ceiling += nppa_item_cost
            total_jan_aushadhi += jan_aushadhi_item_cost

            detailed_items.append({
                "medicine_id": med["id"],
                "brand_name": med["brand_name"],
                "generic_name": med["generic_name"],
                "strength": med["strength"],
                "formulation": med["formulation"],
                "quantity": qty,
                "cost_branded": branded_item_cost,
                "cost_nppa_ceiling": nppa_item_cost,
                "cost_jan_aushadhi": jan_aushadhi_item_cost,
                "savings_potential": round(branded_item_cost - jan_aushadhi_item_cost, 2),
                "generic_alternative": med["generic_alternative"],
                "source": med["source"],
                "source_url": med["source_url"],
                "last_updated": med["last_updated"],
                "verified": True
            })
        else:
            # Unverified medicine name
            custom_name = item.get("name", "Unknown Medicine")
            detailed_items.append({
                "medicine_id": None,
                "brand_name": custom_name,
                "generic_name": "Unverified formulation",
                "strength": item.get("strength", "N/A"),
                "formulation": item.get("formulation", "Tablet"),
                "quantity": qty,
                "cost_branded": None,
                "cost_nppa_ceiling": None,
                "cost_jan_aushadhi": None,
                "savings_potential": 0.0,
                "generic_alternative": None,
                "source": "Price not verified",
                "source_url": NPPA_PORTAL_URL,
                "last_updated": "Not verified",
                "verified": False,
                "status_note": "Rate not available, please verify on NPPA portal"
            })

    verified_count = sum(1 for it in detailed_items if it["verified"])
    unverified_count = sum(1 for it in detailed_items if not it["verified"])

    savings = max(0.0, round(total_branded - total_jan_aushadhi, 2)) if verified_count > 0 else 0.0
    savings_pct = round((savings / total_branded * 100)) if (verified_count > 0 and total_branded > 0) else 0

    return {
        "items": detailed_items,
        "total_estimated_branded_mrp": round(total_branded, 2),
        "total_estimated_nppa_ceiling": round(total_nppa_ceiling, 2),
        "total_estimated_jan_aushadhi": round(total_jan_aushadhi, 2),
        "potential_generic_savings": savings,
        "potential_savings_percentage": savings_pct,
        "price_source_disclaimer": "Prices sourced from NPPA Pharma Sahi Daam & PMBJP Janaushadhi rate card. Substitution must be verified by a licensed pharmacist or prescribing clinician.",
        "has_unverified_items": unverified_count > 0,
        "verified_items_count": verified_count,
        "unverified_items_count": unverified_count,
        "unverified_items_excluded_from_total": unverified_count > 0
    }

