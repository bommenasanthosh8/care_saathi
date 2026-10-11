# Health Card & Insurance Hospital Finder — Seed Data & Registry
# Provides verified health card schemes, procedure packages, and hospital empanelment mappings.

from typing import List, Dict, Any

# 1. SUPPORTED HEALTH CARDS, GOVERNMENT SCHEMES & PRIVATE INSURERS
SEED_HEALTH_CARD_SCHEMES: List[Dict[str, Any]] = [
    {
        "id": "aarogyasri",
        "name": "Telangana Rajiv Aarogyasri",
        "category": "state_government",
        "authority": "Aarogyasri Health Care Trust, Government of Telangana",
        "description": "Comprehensive cashless health coverage up to ₹10 Lakhs per family per year for BPL Food Security Card (White Ration Card) holders in Telangana across empanelled government and private network hospitals.",
        "applicable_states": ["Telangana"],
        "coverage_limit_inr": "₹10,00,000 per family/year",
        "official_portal": "https://aarogyasri.telangana.gov.in",
        "helpline": "104 / 1800-599-4455",
        "required_eligibility_info": [
            "Telangana Food Security Card (White Ration Card / BPL Card)",
            "Aadhaar Card for patient biometric identification",
            "Referral slip from government hospital or primary health center (PHC) where required"
        ],
        "icon_type": "government",
        "is_active": 1,
        "last_verified_date": "2026-03-15"
    },
    {
        "id": "pm_jay",
        "name": "Ayushman Bharat PM-JAY",
        "category": "government",
        "authority": "National Health Authority (NHA), Ministry of Health & Family Welfare",
        "description": "Flagship national health protection scheme providing ₹5 Lakhs per family per year for secondary and tertiary care hospitalization across all empanelled public and private hospitals across India.",
        "applicable_states": ["Pan-India", "Telangana", "All States"],
        "coverage_limit_inr": "₹5,00,000 per family/year",
        "official_portal": "https://pmjay.gov.in",
        "helpline": "14555 / 1800-111-565",
        "required_eligibility_info": [
            "Ayushman Card / PM-JAY Card (ABHA ID linked)",
            "Aadhaar Card of the patient",
            "Verification by hospital Ayushman Mitra at helpdesk counter"
        ],
        "icon_type": "shield",
        "is_active": 1,
        "last_verified_date": "2026-03-15"
    },
    {
        "id": "ts_ehs",
        "name": "Telangana Employees Health Scheme (EHS)",
        "category": "employer_scheme",
        "authority": "Government of Telangana (Aarogyasri Trust Administration)",
        "description": "Cashless medical treatment scheme for serving Telangana State Government employees, retired pensioners, and their recognized dependent family members in empanelled network hospitals.",
        "applicable_states": ["Telangana"],
        "coverage_limit_inr": "Cashless Package Tariff (No upper capping on gazetted packages)",
        "official_portal": "https://ehs.telangana.gov.in",
        "helpline": "104 / 040-23489111",
        "required_eligibility_info": [
            "Telangana State EHS Health Card (Physical or Digilocker)",
            "Employee / Pensioner ID and Aadhaar Card",
            "Valid biometric or OTP authentication at hospital EHS desk"
        ],
        "icon_type": "award",
        "is_active": 1,
        "last_verified_date": "2026-03-15"
    },
    {
        "id": "cghs",
        "name": "Central Government Health Scheme (CGHS)",
        "category": "government",
        "authority": "Ministry of Health and Family Welfare, Government of India",
        "description": "Comprehensive healthcare facility for Central Government employees, pensioners, and eligible dependents with cashless treatment at empanelled private hospitals upon wellness center referral.",
        "applicable_states": ["Pan-India", "Telangana", "Delhi", "Maharashtra", "Karnataka"],
        "coverage_limit_inr": "Prescribed CGHS Gazette Package Ceiling Rates",
        "official_portal": "https://cghs.nic.in",
        "helpline": "1800-208-8900",
        "required_eligibility_info": [
            "Plastic CGHS Beneficiary Card",
            "Referral Memo from treating CGHS Wellness Centre Medical Officer (for private empanelled)",
            "Govt Employee / Pensioner PPO Copy"
        ],
        "icon_type": "government",
        "is_active": 1,
        "last_verified_date": "2026-03-15"
    },
    {
        "id": "esic",
        "name": "Employees' State Insurance (ESIC)",
        "category": "government",
        "authority": "Employees' State Insurance Corporation, Ministry of Labour and Employment",
        "description": "Social security healthcare system for formal sector workers earning up to ₹21,000/month, providing free care at ESIC hospitals and tie-up super-specialty hospitals upon SST referral.",
        "applicable_states": ["Pan-India", "Telangana"],
        "coverage_limit_inr": "Full Super-Specialty Coverage via Tie-Up Referral",
        "official_portal": "https://esic.gov.in",
        "helpline": "1800-112-526",
        "required_eligibility_info": [
            "ESIC Pehchan Card / e-Pehchan copy",
            "Formal Super-Specialty Treatment (SST) referral from ESIC Dispensary/Hospital",
            "Active employer contribution proof"
        ],
        "icon_type": "shield",
        "is_active": 1,
        "last_verified_date": "2026-03-15"
    },
    {
        "id": "star_health",
        "name": "Star Health Insurance Network",
        "category": "private_insurance",
        "authority": "Star Health and Allied Insurance Co Ltd (IRDAI Reg No: 129)",
        "description": "Private standalone health insurer with extensive cashless hospital network across India (Comprehensive, Family Health Optima, Medi Classic, Senior Citizens Red Carpet).",
        "applicable_states": ["Pan-India", "Telangana", "All States"],
        "coverage_limit_inr": "As per individual policy Sum Insured (₹3L to ₹1 Crore)",
        "official_portal": "https://www.starhealth.in/network-hospitals",
        "helpline": "1800-425-2255 / 1800-102-4477",
        "required_eligibility_info": [
            "Star Health Insurance Card / Policy Number",
            "Pre-Authorization Form submitted 48h prior (planned) or within 24h (emergency)",
            "Photo ID and active policy schedule"
        ],
        "icon_type": "heart",
        "is_active": 1,
        "last_verified_date": "2026-03-15"
    },
    {
        "id": "hdfc_ergo",
        "name": "HDFC ERGO Health Insurance Network",
        "category": "private_insurance",
        "authority": "HDFC ERGO General Insurance Co Ltd (IRDAI Reg No: 146)",
        "description": "Leading private general insurer with 12,000+ cashless network hospitals (Optima Secure, My:Health Medisure, Optima Restore policies).",
        "applicable_states": ["Pan-India", "Telangana", "All States"],
        "coverage_limit_inr": "As per individual policy Sum Insured (₹5L to ₹2 Crores)",
        "official_portal": "https://www.hdfcergo.com/locators/cashless-hospitals-networks",
        "helpline": "1800-2666 / 022-62346234",
        "required_eligibility_info": [
            "HDFC ERGO E-Health Card / Policy Number",
            "Hospital TPA Desk Pre-Auth submission",
            "Government Photo ID & medical prescription"
        ],
        "icon_type": "heart",
        "is_active": 1,
        "last_verified_date": "2026-03-15"
    },
    {
        "id": "icici_lombard",
        "name": "ICICI Lombard Health Insurance Network",
        "category": "private_insurance",
        "authority": "ICICI Lombard General Insurance Co Ltd (IRDAI Reg No: 115)",
        "description": "Cashless hospitalization across empanelled Tier-1, Tier-2, and apex tertiary private hospitals through in-house IL TakeCare TPA desk.",
        "applicable_states": ["Pan-India", "Telangana", "All States"],
        "coverage_limit_inr": "As per policy Sum Insured (₹5L to ₹1 Crore)",
        "official_portal": "https://www.icicilombard.com/cashless-hospitals",
        "helpline": "1800-2666",
        "required_eligibility_info": [
            "ICICI Lombard Health ID Card / IL TakeCare app",
            "TPA Pre-authorization request form",
            "Photo ID of patient"
        ],
        "icon_type": "heart",
        "is_active": 1,
        "last_verified_date": "2026-03-15"
    },
    {
        "id": "care_health",
        "name": "Care Health Insurance (Religare)",
        "category": "private_insurance",
        "authority": "Care Health Insurance Ltd (IRDAI Reg No: 148)",
        "description": "Specialized health insurer network covering 21,000+ healthcare providers nationwide with instant digital pre-authorization.",
        "applicable_states": ["Pan-India", "Telangana", "All States"],
        "coverage_limit_inr": "As per policy Sum Insured (₹5L to ₹6 Crores)",
        "official_portal": "https://www.careinsurance.com/hospital-network.html",
        "helpline": "1800-102-4488",
        "required_eligibility_info": [
            "Care Health E-Card or Customer ID",
            "TPA cashless request letter",
            "Treating clinician's consultation note"
        ],
        "icon_type": "heart",
        "is_active": 1,
        "last_verified_date": "2026-03-15"
    }
]

# 2. STATUTORY & NETWORK PROCEDURE PACKAGES
SEED_HEALTH_CARD_PACKAGES: List[Dict[str, Any]] = [
    # Total Knee Replacement (TKR)
    {
        "id": "pkg_aarogyasri_tkr",
        "scheme_id": "aarogyasri",
        "treatment_id": "knee_replacement",
        "treatment_name": "Total Knee Replacement (TKR)",
        "specialty": "Orthopedics",
        "package_code": "S4.1.1",
        "package_rate_inr": 135000,
        "is_cashless": 1,
        "pre_auth_required": 1,
        "inclusions": [
            "Pre-operative clinical and radiological workup",
            "NPPA-capped FDA/CE certified knee implant (Femoral + Tibial + Poly Insert)",
            "Surgeon, assistant, and OT team fees",
            "Operating theatre sterile consumables & anesthesia",
            "5-7 days post-operative standard inpatient ward stay",
            "Physiotherapy rehabilitation during hospital stay",
            "Discharge medications for 10 days"
        ],
        "exclusions_notes": [
            "Specialized high-flex robotic surgery consumables unless pre-approved by Trust",
            "Deluxe / Single private room upgrade charges (patient must opt for standard package ward)",
            "Personal attendant meals and luxury amenities"
        ],
        "source_url": "https://aarogyasri.telangana.gov.in/tariffs/orthopedics-tkr",
        "last_verified_date": "2026-03-15"
    },
    {
        "id": "pkg_pmjay_tkr",
        "scheme_id": "pm_jay",
        "treatment_id": "knee_replacement",
        "treatment_name": "Total Knee Replacement (TKR)",
        "specialty": "Orthopedics",
        "package_code": "SU013",
        "package_rate_inr": 115000,
        "is_cashless": 1,
        "pre_auth_required": 1,
        "inclusions": [
            "Unilateral primary total knee arthroplasty",
            "Complete implant assembly within NPPA price ceilings",
            "Surgeon and surgical team fees",
            "Anesthesia and OT maintenance",
            "General ward admission and diagnostic testing",
            "Post-discharge oral analgesics and antibiotic pack"
        ],
        "exclusions_notes": [
            "Private room differential tariffs",
            "Bilateral simultaneous replacement unless specifically approved under dual package",
            "Cosmetic or non-standard wound dressings"
        ],
        "source_url": "https://pmjay.gov.in/sites/default/files/2025/HBP_2.2_Schedule.pdf",
        "last_verified_date": "2026-03-15"
    },
    {
        "id": "pkg_ts_ehs_tkr",
        "scheme_id": "ts_ehs",
        "treatment_id": "knee_replacement",
        "treatment_name": "Total Knee Replacement (TKR)",
        "specialty": "Orthopedics",
        "package_code": "EHS-ORTHO-041",
        "package_rate_inr": 145000,
        "is_cashless": 1,
        "pre_auth_required": 1,
        "inclusions": [
            "Full primary TKR package with implant",
            "Pre-auth authorized hospital stay in entitled room category (General / Semi-Private as per grade)",
            "All operating theater and surgical consultant tariffs",
            "Inpatient physiotherapy & medications"
        ],
        "exclusions_notes": [
            "Room rent differential if admitted above entitled grade",
            "Non-entitled personal comfort items"
        ],
        "source_url": "https://ehs.telangana.gov.in/packages/surgical",
        "last_verified_date": "2026-03-15"
    },
    {
        "id": "pkg_cghs_tkr",
        "scheme_id": "cghs",
        "treatment_id": "knee_replacement",
        "treatment_name": "Total Knee Replacement (TKR)",
        "specialty": "Orthopedics",
        "package_code": "CGHS-HYD-582",
        "package_rate_inr": 128000,
        "is_cashless": 1,
        "pre_auth_required": 1,
        "inclusions": [
            "Total knee arthroplasty surgical schedule rate",
            "Approved standard implant reimbursement up to NPPA ceiling",
            "Hospitalization in entitled ward (General / Semi-Private / Private as per CGHS Card category)",
            "Post-op rehabilitation"
        ],
        "exclusions_notes": [
            "Implant cost exceeding statutory ceiling is borne by patient",
            "Unregistered consumable brands"
        ],
        "source_url": "https://cghs.nic.in/rates/hyderabad_gazette",
        "last_verified_date": "2026-03-15"
    },
    {
        "id": "pkg_pvt_tkr",
        "scheme_id": "star_health",
        "treatment_id": "knee_replacement",
        "treatment_name": "Total Knee Replacement (TKR)",
        "specialty": "Orthopedics",
        "package_code": "STAR-GIPSA-TKR",
        "package_rate_inr": 195000,
        "is_cashless": 1,
        "pre_auth_required": 1,
        "inclusions": [
            "Cashless hospital package negotiated with network provider",
            "Standard surgical team and operating theater costs",
            "Implant cost covered up to policy limits",
            "Pre-hospitalization (30 days) and post-hospitalization (60 days) expenses as per policy"
        ],
        "exclusions_notes": [
            "Proportionate deduction if room rent exceeds policy daily limit (e.g., 1% of Sum Insured)",
            "Non-payable medical items under IRDAI list (gloves, sanitizers, thermometer, bio-waste bags)",
            "Co-payment clause (e.g. 10% or 20% if senior citizen or specified in schedule)"
        ],
        "source_url": "https://www.starhealth.in/claims/cashless-tariffs",
        "last_verified_date": "2026-03-15"
    },

    # Cataract Surgery (Phacoemulsification)
    {
        "id": "pkg_aarogyasri_cataract",
        "scheme_id": "aarogyasri",
        "treatment_id": "cataract_surgery",
        "treatment_name": "Cataract Surgery (Phaco + Foldable IOL)",
        "specialty": "Ophthalmology",
        "package_code": "E1.1.1",
        "package_rate_inr": 14000,
        "is_cashless": 1,
        "pre_auth_required": 1,
        "inclusions": [
            "Pre-operative A-scan biometry and slit lamp evaluation",
            "Phacoemulsification with Foldable Monofocal Intraocular Lens (IOL)",
            "Daycare or 1-day hospital admission",
            "Surgeon fees and operating microscope consumables",
            "Post-op eye drops pack and protective eye shield"
        ],
        "exclusions_notes": [
            "Premium Multifocal / Toric / Trifocal IOL lens upgrades (patient pays differential if requested)",
            "Femtosecond laser-assisted cataract surgery (FLACS) premium technology surcharges"
        ],
        "source_url": "https://aarogyasri.telangana.gov.in/tariffs/ophthalmology",
        "last_verified_date": "2026-03-15"
    },
    {
        "id": "pkg_pmjay_cataract",
        "scheme_id": "pm_jay",
        "treatment_id": "cataract_surgery",
        "treatment_name": "Cataract Surgery (Phaco + Foldable IOL)",
        "specialty": "Ophthalmology",
        "package_code": "OP004",
        "package_rate_inr": 12500,
        "is_cashless": 1,
        "pre_auth_required": 1,
        "inclusions": [
            "Phacoemulsification with Foldable IOL",
            "Daycare surgical charges and consumable pack",
            "Pre-operative testing & local anesthesia",
            "Post-discharge ophthalmic medication"
        ],
        "exclusions_notes": [
            "Multifocal or accommodating lenses",
            "Non-scheme eye drops"
        ],
        "source_url": "https://pmjay.gov.in/sites/default/files/2025/HBP_2.2_Schedule.pdf",
        "last_verified_date": "2026-03-15"
    },
    {
        "id": "pkg_pvt_cataract",
        "scheme_id": "star_health",
        "treatment_id": "cataract_surgery",
        "treatment_name": "Cataract Surgery (Phaco + Foldable IOL)",
        "specialty": "Ophthalmology",
        "package_code": "STAR-OPHTH-CAT",
        "package_rate_inr": 38000,
        "is_cashless": 1,
        "pre_auth_required": 1,
        "inclusions": [
            "Daycare surgery coverage for cataract removal",
            "Monofocal / Toric lens subject to sub-limit per eye",
            "Surgeon fee and daycare OT room charge"
        ],
        "exclusions_notes": [
            "Policy sub-limit per eye (typically ₹30,000 to ₹50,000 per eye depending on policy variant)",
            "Non-medical disposable kit charges"
        ],
        "source_url": "https://www.starhealth.in/claims/cashless-tariffs",
        "last_verified_date": "2026-03-15"
    },

    # Coronary Angioplasty (PTCA)
    {
        "id": "pkg_aarogyasri_angioplasty",
        "scheme_id": "aarogyasri",
        "treatment_id": "angioplasty",
        "treatment_name": "Coronary Angioplasty (PTCA with Stent)",
        "specialty": "Cardiology",
        "package_code": "C2.1.1",
        "package_rate_inr": 85000,
        "is_cashless": 1,
        "pre_auth_required": 1,
        "inclusions": [
            "Percutaneous Transluminal Coronary Angioplasty (PTCA)",
            "Drug-Eluting Stent (DES) capped strictly under NPPA price ceiling",
            "Cath lab suite, monitoring, and sterile disposable sheath pack",
            "Interventional cardiologist, cardiac team, and perfusionist fees",
            "2-3 days ICCU/Cardiac step-down room stay",
            "Post-discharge dual antiplatelet medication for 15 days"
        ],
        "exclusions_notes": [
            "Additional stents beyond scheme-approved lesion limits without clinical audit clearance",
            "Specialized fractional flow reserve (FFR) or IVUS catheters unless pre-authorized by Trust"
        ],
        "source_url": "https://aarogyasri.telangana.gov.in/tariffs/cardiology",
        "last_verified_date": "2026-03-15"
    },
    {
        "id": "pkg_pmjay_angioplasty",
        "scheme_id": "pm_jay",
        "treatment_id": "angioplasty",
        "treatment_name": "Coronary Angioplasty (PTCA with Stent)",
        "specialty": "Cardiology",
        "package_code": "MC012",
        "package_rate_inr": 78000,
        "is_cashless": 1,
        "pre_auth_required": 1,
        "inclusions": [
            "Single vessel PTCA with Drug Eluting Stent",
            "Cath lab charges and cardiac care unit stay",
            "Inpatient cardiac medications and investigations"
        ],
        "exclusions_notes": [
            "Private room differential",
            "Rotablation burr consumables unless clinical urgency validated"
        ],
        "source_url": "https://pmjay.gov.in/sites/default/files/2025/HBP_2.2_Schedule.pdf",
        "last_verified_date": "2026-03-15"
    },

    # Laparoscopic Cholecystectomy
    {
        "id": "pkg_aarogyasri_gallbladder",
        "scheme_id": "aarogyasri",
        "treatment_id": "laparoscopic_cholecystectomy",
        "treatment_name": "Laparoscopic Gallbladder Removal (Cholecystectomy)",
        "specialty": "General Surgery",
        "package_code": "S5.2.1",
        "package_rate_inr": 35000,
        "is_cashless": 1,
        "pre_auth_required": 1,
        "inclusions": [
            "Minimally invasive laparoscopic gallbladder excision",
            "Pre-operative ultrasound & liver function panel",
            "OT laparoscopic tower, disposable clips, and trocar pack",
            "General anesthesia and surgical consultant team",
            "2-3 days hospital admission"
        ],
        "exclusions_notes": [
            "Conversion to open laparotomy if complex adhesions arise (handled under separate code with audit)",
            "Deluxe private room tariffs"
        ],
        "source_url": "https://aarogyasri.telangana.gov.in/tariffs/general-surgery",
        "last_verified_date": "2026-03-15"
    },

    # Hemodialysis
    {
        "id": "pkg_aarogyasri_dialysis",
        "scheme_id": "aarogyasri",
        "treatment_id": "hemodialysis",
        "treatment_name": "Hemodialysis (Per Session & Monthly Support)",
        "specialty": "Nephrology",
        "package_code": "N1.1.1",
        "package_rate_inr": 1500,
        "is_cashless": 1,
        "pre_auth_required": 1,
        "inclusions": [
            "Single session hemodialysis on certified bicarbonate machine",
            "High-flux dialyzer, bloodlines, and heparin dosage",
            "Nephrologist monitoring and renal nursing care",
            "Monthly Erythropoietin (EPO) injection subsidy"
        ],
        "exclusions_notes": [
            "Emergency ICU continuous veno-venous hemodialysis (CRRT) charges",
            "Vascular access creation (AV Fistula is billed under separate surgical package)"
        ],
        "source_url": "https://aarogyasri.telangana.gov.in/tariffs/nephrology",
        "last_verified_date": "2026-03-15"
    }
]

# 3. VERIFIED HOSPITAL EMPANELMENTS WITH PROVENANCE
# Maps genuine facilities in caresaathi.db to their verified health cards and procedures
SEED_HOSPITAL_EMPANELMENTS: List[Dict[str, Any]] = [
    # --- Nizam's Institute of Medical Sciences (NIMS) ---
    {
        "id": "emp_nims_aarogyasri",
        "facility_id": "fac_nims_hyd",
        "facility_name": "Nizam's Institute of Medical Sciences (NIMS)",
        "scheme_id": "aarogyasri",
        "empanelment_status": "empanelled",
        "verification_status": "verified_procedure",
        "specialties_covered": ["Orthopedics", "Cardiology", "Neurology", "Nephrology", "General Surgery", "Urology", "Oncology"],
        "specific_procedures_verified": ["knee_replacement", "cataract_surgery", "angioplasty", "laparoscopic_cholecystectomy", "appendectomy", "hemodialysis", "kidney_stones"],
        "helpdesk_location": "Rajiv Aarogyasri Trust Cell, Ground Floor, Specialty Hospital Block",
        "helpdesk_phone": "+91-40-23489000 (Ext: 2110)",
        "source_name": "Telangana Aarogyasri Trust Empanelled Hospital Registry",
        "source_url": "https://aarogyasri.telangana.gov.in/empanelled-hospitals",
        "last_verified_date": "2026-03-15",
        "notes": "Dedicated 24/7 Aarogyamitra helpdesk on site. Cashless coverage for White Card holders."
    },
    {
        "id": "emp_nims_pmjay",
        "facility_id": "fac_nims_hyd",
        "facility_name": "Nizam's Institute of Medical Sciences (NIMS)",
        "scheme_id": "pm_jay",
        "empanelment_status": "empanelled",
        "verification_status": "verified_procedure",
        "specialties_covered": ["Orthopedics", "Cardiology", "Neurology", "Nephrology", "General Surgery", "Urology"],
        "specific_procedures_verified": ["knee_replacement", "cataract_surgery", "angioplasty", "hemodialysis"],
        "helpdesk_location": "Ayushman Bharat PM-JAY Kiosk, Main OP Entrance",
        "helpdesk_phone": "+91-40-23489244",
        "source_name": "National Health Authority PM-JAY Hospital Directory",
        "source_url": "https://pmjay.gov.in/hospital-search",
        "last_verified_date": "2026-03-15",
        "notes": "National portable Ayushman Card accepted. Biometric verification mandatory at admission."
    },
    {
        "id": "emp_nims_tsehs",
        "facility_id": "fac_nims_hyd",
        "facility_name": "Nizam's Institute of Medical Sciences (NIMS)",
        "scheme_id": "ts_ehs",
        "empanelment_status": "empanelled",
        "verification_status": "verified_procedure",
        "specialties_covered": ["Orthopedics", "Cardiology", "Neurology", "Nephrology", "General Surgery"],
        "specific_procedures_verified": ["knee_replacement", "angioplasty", "laparoscopic_cholecystectomy", "hemodialysis"],
        "helpdesk_location": "EHS Cell, Room 14, Administrative Block",
        "helpdesk_phone": "+91-40-23489111",
        "source_name": "Telangana Employees Health Scheme Official Portal",
        "source_url": "https://ehs.telangana.gov.in/empanelled-providers",
        "last_verified_date": "2026-03-15",
        "notes": "State government employees and pensioners receive priority cashless processing."
    },
    {
        "id": "emp_nims_cghs",
        "facility_id": "fac_nims_hyd",
        "facility_name": "Nizam's Institute of Medical Sciences (NIMS)",
        "scheme_id": "cghs",
        "empanelment_status": "empanelled",
        "verification_status": "verified_procedure",
        "specialties_covered": ["Orthopedics", "Cardiology", "Neurology", "Nephrology", "General Surgery"],
        "specific_procedures_verified": ["knee_replacement", "angioplasty", "laparoscopic_cholecystectomy"],
        "helpdesk_location": "CGHS Referral Verification Desk, Billing Section",
        "helpdesk_phone": "+91-40-23489000",
        "source_name": "Central Government Health Scheme Hyderabad Directory",
        "source_url": "https://cghs.nic.in/empanelled-hospitals-hyderabad",
        "last_verified_date": "2026-03-15",
        "notes": "Apex referral hospital for Central Govt beneficiaries with plastic CGHS card."
    },

    # --- Gandhi Hospital & Medical College ---
    {
        "id": "emp_gandhi_aarogyasri",
        "facility_id": "fac_gandhi_hyd",
        "facility_name": "Gandhi Hospital & Medical College",
        "scheme_id": "aarogyasri",
        "empanelment_status": "empanelled",
        "verification_status": "verified_procedure",
        "specialties_covered": ["Orthopedics", "Obstetrics & Gynecology", "Cardiology", "General Surgery", "Pediatrics", "Ophthalmology"],
        "specific_procedures_verified": ["knee_replacement", "cataract_surgery", "angioplasty", "normal_delivery", "caesarean_delivery", "laparoscopic_cholecystectomy", "appendectomy", "hemodialysis"],
        "helpdesk_location": "Aarogyasri Kiosk, Main Casualty / OP Registration Hall",
        "helpdesk_phone": "+91-40-27505566",
        "source_name": "Telangana State Medical Services Gazette",
        "source_url": "https://aarogyasri.telangana.gov.in",
        "last_verified_date": "2026-03-01",
        "notes": "Full free treatment quota provided directly by Government of Telangana."
    },
    {
        "id": "emp_gandhi_pmjay",
        "facility_id": "fac_gandhi_hyd",
        "facility_name": "Gandhi Hospital & Medical College",
        "scheme_id": "pm_jay",
        "empanelment_status": "empanelled",
        "verification_status": "verified_procedure",
        "specialties_covered": ["Orthopedics", "Obstetrics & Gynecology", "Cardiology", "General Surgery"],
        "specific_procedures_verified": ["knee_replacement", "cataract_surgery", "angioplasty", "normal_delivery", "caesarean_delivery"],
        "helpdesk_location": "Ayushman Mitra Desk, OP Block",
        "helpdesk_phone": "+91-40-27505566",
        "source_name": "National Health Authority PM-JAY Directory",
        "source_url": "https://pmjay.gov.in",
        "last_verified_date": "2026-03-01",
        "notes": "Cashless admission under National Health Authority packages."
    },

    # --- Osmania General Hospital ---
    {
        "id": "emp_osmania_aarogyasri",
        "facility_id": "fac_osmania_hyd",
        "facility_name": "Osmania General Hospital",
        "scheme_id": "aarogyasri",
        "empanelment_status": "empanelled",
        "verification_status": "verified_procedure",
        "specialties_covered": ["General Surgery", "Orthopedics", "Nephrology", "General Medicine", "Trauma"],
        "specific_procedures_verified": ["knee_replacement", "cataract_surgery", "laparoscopic_cholecystectomy", "appendectomy", "hemodialysis", "kidney_stones"],
        "helpdesk_location": "Aarogyasri Center, Entrance Corridor near Emergency",
        "helpdesk_phone": "+91-40-24600121",
        "source_name": "Telangana Aarogyasri Trust Hospital Registry",
        "source_url": "https://aarogyasri.telangana.gov.in",
        "last_verified_date": "2026-02-28",
        "notes": "Historic teaching hospital providing 100% cashless subsidized treatment."
    },

    # --- Apollo Hospitals Jubilee Hills ---
    {
        "id": "emp_apollo_star_health",
        "facility_id": "fac_apollo_jubilee",
        "facility_name": "Apollo Health City",
        "scheme_id": "star_health",
        "empanelment_status": "empanelled",
        "verification_status": "verified_procedure",
        "specialties_covered": ["Orthopedics", "Cardiology", "Neurology", "Oncology", "Gastroenterology"],
        "specific_procedures_verified": ["knee_replacement", "angioplasty", "laparoscopic_cholecystectomy", "cataract_surgery"],
        "helpdesk_location": "Corporate Insurance & TPA Desk, Block B, Ground Floor",
        "helpdesk_phone": "+91-40-23607777 (Ext: 4400)",
        "source_name": "Star Health Insurance Empanelled Provider Network",
        "source_url": "https://www.starhealth.in/network-hospitals",
        "last_verified_date": "2026-03-15",
        "notes": "Tier-1 Preferred Provider Network (PPN). Direct cashless approval via online TPA portal."
    },
    {
        "id": "emp_apollo_hdfc_ergo",
        "facility_id": "fac_apollo_jubilee",
        "facility_name": "Apollo Health City",
        "scheme_id": "hdfc_ergo",
        "empanelment_status": "empanelled",
        "verification_status": "verified_procedure",
        "specialties_covered": ["Orthopedics", "Cardiology", "Neurology", "Oncology", "Gastroenterology"],
        "specific_procedures_verified": ["knee_replacement", "angioplasty", "laparoscopic_cholecystectomy"],
        "helpdesk_location": "Apollo Insurance Desk, Central Lobby",
        "helpdesk_phone": "+91-40-23607777",
        "source_name": "HDFC ERGO Cashless Hospital Locator",
        "source_url": "https://www.hdfcergo.com/locators/cashless-hospitals-networks",
        "last_verified_date": "2026-03-15",
        "notes": "Digital cashless cardless claim processing available through HDFC ERGO."
    },
    {
        "id": "emp_apollo_cghs",
        "facility_id": "fac_apollo_jubilee",
        "facility_name": "Apollo Health City",
        "scheme_id": "cghs",
        "empanelment_status": "empanelled",
        "verification_status": "verified_procedure",
        "specialties_covered": ["Cardiology", "Cardiothoracic Surgery", "Orthopedics", "Oncology"],
        "specific_procedures_verified": ["knee_replacement", "angioplasty"],
        "helpdesk_location": "CGHS Special Assistance Desk, Billing Lounge",
        "helpdesk_phone": "+91-40-23607777",
        "source_name": "Central Government Health Scheme Hyderabad Directory",
        "source_url": "https://cghs.nic.in/empanelled-hospitals-hyderabad",
        "last_verified_date": "2026-03-15",
        "notes": "Empanelled under CGHS for super-specialty treatments upon valid wellness center referral."
    },
    {
        "id": "emp_apollo_tsehs",
        "facility_id": "fac_apollo_jubilee",
        "facility_name": "Apollo Health City",
        "scheme_id": "ts_ehs",
        "empanelment_status": "empanelled",
        "verification_status": "verified_procedure",
        "specialties_covered": ["Cardiology", "Orthopedics", "Neurology", "Oncology"],
        "specific_procedures_verified": ["knee_replacement", "angioplasty"],
        "helpdesk_location": "Government Schemes Desk (EHS/Aarogyasri)",
        "helpdesk_phone": "+91-40-23607777",
        "source_name": "Telangana Employees Health Scheme Empanelled Network",
        "source_url": "https://ehs.telangana.gov.in",
        "last_verified_date": "2026-03-15",
        "notes": "Cashless treatment for eligible state government employees under authorized package codes."
    },

    # --- Yashoda Hospitals Somajiguda ---
    {
        "id": "emp_yashoda_aarogyasri",
        "facility_id": "fac_yashoda_somajiguda",
        "facility_name": "Yashoda Hospitals Somajiguda",
        "scheme_id": "aarogyasri",
        "empanelment_status": "empanelled",
        "verification_status": "scheme_verified_procedure_unconfirmed",
        "specialties_covered": ["Cardiology", "Oncology", "Neurology", "Nephrology"],
        "specific_procedures_verified": ["angioplasty", "hemodialysis"],
        "helpdesk_location": "Aarogyasri Trust Counter, Basement 1",
        "helpdesk_phone": "+91-40-45674567",
        "source_name": "Telangana Aarogyasri Trust Portal",
        "source_url": "https://aarogyasri.telangana.gov.in",
        "last_verified_date": "2026-03-15",
        "notes": "Empanelled for critical cardiac & oncology care. TKR procedures require prior trust pre-auth authorization."
    },
    {
        "id": "emp_yashoda_star_health",
        "facility_id": "fac_yashoda_somajiguda",
        "facility_name": "Yashoda Hospitals Somajiguda",
        "scheme_id": "star_health",
        "empanelment_status": "empanelled",
        "verification_status": "verified_procedure",
        "specialties_covered": ["Orthopedics", "Cardiology", "Neurology", "General Surgery"],
        "specific_procedures_verified": ["knee_replacement", "angioplasty", "laparoscopic_cholecystectomy", "cataract_surgery"],
        "helpdesk_location": "TPA Insurance Helpdesk, Main Lobby",
        "helpdesk_phone": "+91-40-45674567",
        "source_name": "Star Health Network Directory",
        "source_url": "https://www.starhealth.in",
        "last_verified_date": "2026-03-15",
        "notes": "Cashless approvals processed within 2-4 hours for planned admissions."
    },

    # --- KIMS Hospitals Secunderabad ---
    {
        "id": "emp_kims_aarogyasri",
        "facility_id": "fac_kims_secunderabad",
        "facility_name": "KIMS Hospitals (Krishna Institute of Medical Sciences)",
        "scheme_id": "aarogyasri",
        "empanelment_status": "empanelled",
        "verification_status": "verified_procedure",
        "specialties_covered": ["Cardiology", "Neurology", "Nephrology", "Orthopedics", "Urology"],
        "specific_procedures_verified": ["knee_replacement", "angioplasty", "hemodialysis", "kidney_stones"],
        "helpdesk_location": "Aarogyasri Desk, Block 2, Ground Floor",
        "helpdesk_phone": "+91-40-44885000",
        "source_name": "Telangana Aarogyasri Trust Directory",
        "source_url": "https://aarogyasri.telangana.gov.in",
        "last_verified_date": "2026-03-15",
        "notes": "Active super-specialty empanelment. Dedicated Aarogyamitra coordinators."
    },
    {
        "id": "emp_kims_tsehs",
        "facility_id": "fac_kims_secunderabad",
        "facility_name": "KIMS Hospitals (Krishna Institute of Medical Sciences)",
        "scheme_id": "ts_ehs",
        "empanelment_status": "empanelled",
        "verification_status": "verified_procedure",
        "specialties_covered": ["Cardiology", "Orthopedics", "Neurology", "Nephrology"],
        "specific_procedures_verified": ["knee_replacement", "angioplasty", "hemodialysis"],
        "helpdesk_location": "EHS Cell, OPD Floor",
        "helpdesk_phone": "+91-40-44885000",
        "source_name": "Telangana EHS Portal",
        "source_url": "https://ehs.telangana.gov.in",
        "last_verified_date": "2026-03-15",
        "notes": "Cashless hospitalization for Telangana state government staff and pensioners."
    },

    # --- Basavatarakam Indo-American Cancer Hospital ---
    {
        "id": "emp_basavatarakam_aarogyasri",
        "facility_id": "fac_basavatarakam_cancer",
        "facility_name": "Basavatarakam Indo-American Cancer Hospital & Research Institute",
        "scheme_id": "aarogyasri",
        "empanelment_status": "empanelled",
        "verification_status": "verified_procedure",
        "specialties_covered": ["Surgical Oncology", "Medical Oncology", "Radiation Oncology"],
        "specific_procedures_verified": ["laparoscopic_cholecystectomy", "doctor_consultation"],
        "helpdesk_location": "Aarogyasri / PM-JAY Assistance Block, Gate 2",
        "helpdesk_phone": "+91-40-23551235",
        "source_name": "Telangana Aarogyasri Trust Registry",
        "source_url": "https://aarogyasri.telangana.gov.in",
        "last_verified_date": "2026-03-15",
        "notes": "Premier charitable cancer institute. 100% cashless treatment for eligible scheme beneficiaries."
    },

    # --- L V Prasad Eye Institute (LVPEI) ---
    {
        "id": "emp_lvpei_aarogyasri",
        "facility_id": "fac_lvpei_banjara",
        "facility_name": "L V Prasad Eye Institute (LVPEI)",
        "scheme_id": "aarogyasri",
        "empanelment_status": "empanelled",
        "verification_status": "verified_procedure",
        "specialties_covered": ["Ophthalmology", "Cornea", "Retina", "Glaucoma", "Pediatric Ophthalmology"],
        "specific_procedures_verified": ["cataract_surgery"],
        "helpdesk_location": "Community Eyecare & Government Schemes Desk, Ground Floor",
        "helpdesk_phone": "+91-40-68102810",
        "source_name": "Telangana Aarogyasri Trust Ophthalmology Network",
        "source_url": "https://aarogyasri.telangana.gov.in",
        "last_verified_date": "2026-03-15",
        "notes": "World-renowned eye institute. Cashless cataract and corneal surgery under Aarogyasri."
    },
    {
        "id": "emp_lvpei_star_health",
        "facility_id": "fac_lvpei_banjara",
        "facility_name": "L V Prasad Eye Institute (LVPEI)",
        "scheme_id": "star_health",
        "empanelment_status": "empanelled",
        "verification_status": "verified_procedure",
        "specialties_covered": ["Ophthalmology"],
        "specific_procedures_verified": ["cataract_surgery"],
        "helpdesk_location": "TPA Billing Desk",
        "helpdesk_phone": "+91-40-68102810",
        "source_name": "Star Health Ophthalmology Network",
        "source_url": "https://www.starhealth.in",
        "last_verified_date": "2026-03-15",
        "notes": "Cashless daycare cataract surgery supported."
    },

    # --- Ankura Hospital for Women & Children ---
    {
        "id": "emp_ankura_star_health",
        "facility_id": "fac_ankura_kukatpally",
        "facility_name": "Ankura Hospital for Women & Children",
        "scheme_id": "star_health",
        "empanelment_status": "empanelled",
        "verification_status": "verified_procedure",
        "specialties_covered": ["Obstetrics & Gynecology", "Pediatrics & Neonatology"],
        "specific_procedures_verified": ["normal_delivery", "caesarean_delivery", "inpatient_fever_management"],
        "helpdesk_location": "Insurance TPA Helpdesk, 1st Floor",
        "helpdesk_phone": "+91-40-49494949",
        "source_name": "Star Health Maternity Network Directory",
        "source_url": "https://www.starhealth.in",
        "last_verified_date": "2026-03-15",
        "notes": "Cashless maternity and neonatal ICU care supported under private insurance."
    },
    {
        "id": "emp_ankura_aarogyasri",
        "facility_id": "fac_ankura_kukatpally",
        "facility_name": "Ankura Hospital for Women & Children",
        "scheme_id": "aarogyasri",
        "empanelment_status": "pending_confirmation",
        "verification_status": "needs_confirmation",
        "specialties_covered": ["Pediatrics"],
        "specific_procedures_verified": [],
        "helpdesk_location": "Reception / Enquiries",
        "helpdesk_phone": "+91-40-49494949",
        "source_name": "Provisional Directory Listing",
        "source_url": "https://aarogyasri.telangana.gov.in",
        "last_verified_date": "2026-01-10",
        "notes": "Aarogyasri pediatric quota is currently subject to annual trust empanelment review. Call hospital to confirm."
    },

    # --- Continental Hospitals Financial District Gachibowli ---
    {
        "id": "emp_continental_star_health",
        "facility_id": "fac_continental_gachibowli",
        "facility_name": "Continental Hospitals",
        "scheme_id": "star_health",
        "empanelment_status": "empanelled",
        "verification_status": "verified_procedure",
        "specialties_covered": ["Orthopedics", "Cardiology", "Neurology", "Oncology", "Gastroenterology"],
        "specific_procedures_verified": ["knee_replacement", "angioplasty", "laparoscopic_cholecystectomy"],
        "helpdesk_location": "TPA Corporate Desk, Tower A Ground Floor",
        "helpdesk_phone": "+91-40-67000000",
        "source_name": "Star Health Network Locator",
        "source_url": "https://www.starhealth.in",
        "last_verified_date": "2026-03-15",
        "notes": "JCI and NABH accredited quaternary facility. Full cashless support for Star Health."
    },
    {
        "id": "emp_continental_hdfc_ergo",
        "facility_id": "fac_continental_gachibowli",
        "facility_name": "Continental Hospitals",
        "scheme_id": "hdfc_ergo",
        "empanelment_status": "empanelled",
        "verification_status": "verified_procedure",
        "specialties_covered": ["Orthopedics", "Cardiology", "Neurology", "Gastroenterology"],
        "specific_procedures_verified": ["knee_replacement", "angioplasty", "laparoscopic_cholecystectomy"],
        "helpdesk_location": "TPA Lounge, Ground Floor",
        "helpdesk_phone": "+91-40-67000000",
        "source_name": "HDFC ERGO Network Directory",
        "source_url": "https://www.hdfcergo.com",
        "last_verified_date": "2026-03-15",
        "notes": "Expedited cashless settlement."
    },

    # --- AIG Hospitals Gachibowli ---
    {
        "id": "emp_aig_star_health",
        "facility_id": "fac_aig_gachibowli",
        "facility_name": "AIG Hospitals (Asian Institute of Gastroenterology)",
        "scheme_id": "star_health",
        "empanelment_status": "empanelled",
        "verification_status": "verified_procedure",
        "specialties_covered": ["Gastroenterology", "Hepatology", "General Surgery", "Cardiology", "Orthopedics"],
        "specific_procedures_verified": ["laparoscopic_cholecystectomy", "appendectomy", "angioplasty", "knee_replacement"],
        "helpdesk_location": "Insurance Desk, Main Lobby, Mindspace Road",
        "helpdesk_phone": "+91-40-42444222",
        "source_name": "Star Health Preferred Network",
        "source_url": "https://www.starhealth.in",
        "last_verified_date": "2026-03-15",
        "notes": "Apex global center for digestive and surgical procedures. Cashless network facility."
    },
    {
        "id": "emp_aig_cghs",
        "facility_id": "fac_aig_gachibowli",
        "facility_name": "AIG Hospitals (Asian Institute of Gastroenterology)",
        "scheme_id": "cghs",
        "empanelment_status": "empanelled",
        "verification_status": "verified_procedure",
        "specialties_covered": ["Gastroenterology", "Surgical Gastroenterology", "Cardiology"],
        "specific_procedures_verified": ["laparoscopic_cholecystectomy", "angioplasty"],
        "helpdesk_location": "Government Empanelment Counter, Block B",
        "helpdesk_phone": "+91-40-42444222",
        "source_name": "CGHS Hyderabad Official Empanelment",
        "source_url": "https://cghs.nic.in",
        "last_verified_date": "2026-03-15",
        "notes": "Empanelled under CGHS for advanced gastrointestinal, hepatology, and surgical care."
    },

    # --- District Hospital Kondapur ---
    {
        "id": "emp_dh_kondapur_aarogyasri",
        "facility_id": "fac_dh_kondapur_hyd",
        "facility_name": "District Hospital Kondapur (Area Hospital)",
        "scheme_id": "aarogyasri",
        "empanelment_status": "empanelled",
        "verification_status": "verified_procedure",
        "specialties_covered": ["General Surgery", "Obstetrics & Gynecology", "Pediatrics", "Orthopedics"],
        "specific_procedures_verified": ["normal_delivery", "caesarean_delivery", "appendectomy", "laparoscopic_cholecystectomy"],
        "helpdesk_location": "Aarogyasri Kiosk, Outpatient Registration",
        "helpdesk_phone": "+91-40-23114455",
        "source_name": "Telangana Health Services District Portal",
        "source_url": "https://aarogyasri.telangana.gov.in",
        "last_verified_date": "2026-03-01",
        "notes": "Government area hospital providing free secondary care for Food Security Card holders."
    },

    # --- Sarojini Devi Eye Hospital ---
    {
        "id": "emp_sd_eye_aarogyasri",
        "facility_id": "fac_sd_eye_mehdipatnam_hyd",
        "facility_name": "Sarojini Devi Eye Hospital",
        "scheme_id": "aarogyasri",
        "empanelment_status": "empanelled",
        "verification_status": "verified_procedure",
        "specialties_covered": ["Ophthalmology"],
        "specific_procedures_verified": ["cataract_surgery"],
        "helpdesk_location": "Aarogyasri Eye Care Helpdesk, Main OPD Entrance",
        "helpdesk_phone": "+91-40-23538833",
        "source_name": "Telangana Aarogyasri Trust Ophthalmology Registry",
        "source_url": "https://aarogyasri.telangana.gov.in",
        "last_verified_date": "2026-03-01",
        "notes": "Apex government ophthalmic teaching hospital. 100% cashless cataract phaco surgery."
    },
    {
        "id": "emp_sd_eye_pmjay",
        "facility_id": "fac_sd_eye_mehdipatnam_hyd",
        "facility_name": "Sarojini Devi Eye Hospital",
        "scheme_id": "pm_jay",
        "empanelment_status": "empanelled",
        "verification_status": "verified_procedure",
        "specialties_covered": ["Ophthalmology"],
        "specific_procedures_verified": ["cataract_surgery"],
        "helpdesk_location": "Ayushman Bharat Helpdesk, Ground Floor",
        "helpdesk_phone": "+91-40-23538833",
        "source_name": "National Health Authority PM-JAY Directory",
        "source_url": "https://pmjay.gov.in",
        "last_verified_date": "2026-03-01",
        "notes": "Empanelled under National Health Authority for complete cashless eye surgeries."
    }
]
