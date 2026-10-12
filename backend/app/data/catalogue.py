from typing import List, Dict, Optional
from ..models.schemas import Treatment

TREATMENT_CATALOGUE: Dict[str, Treatment] = {
    "knee_replacement": Treatment(
        id="knee_replacement",
        name="Total Knee Replacement (TKR)",
        category="Orthopedics",
        aliases=[
            "knee replacement", "knee surgery", "tkr", "knee joint replacement", 
            "arthroplasty", "మోకాలి మార్పిడి శస్త్రచికిత్స", "घुटने का प्रत्यारोपण"
        ],
        description="Surgical procedure to replace the weight-bearing surfaces of the knee joint to relieve pain and disability, typically using metal and ultra-high-density polyethylene implants.",
        indicative_min=135000,
        indicative_max=320000,
        package_code_pmjay="SU03001A",
        package_code_aarogyasri="S4.1.1",
        standard_stay_duration="3-5 days",
        common_diagnostics_required=["Digital X-ray Bilateral Knee", "CBC", "ESR/CRP", "Coagulation profile", "ECG", "Echocardiogram"]
    ),
    "cataract_surgery": Treatment(
        id="cataract_surgery",
        name="Cataract Surgery (Phacoemulsification with Foldable IOL)",
        category="Ophthalmology",
        aliases=[
            "cataract", "cataract surgery", "eye surgery", "phaco", "motiyabind", "lens surgery",
            "కంటి శుక్లం ఆపరేషన్", "मोतियाबिंद सर्जरी"
        ],
        description="Minimally invasive ultrasonic liquefaction and extraction of the opacified natural eye lens with implantation of a foldable monofocal/multifocal intraocular lens.",
        indicative_min=16000,
        indicative_max=65000,
        package_code_pmjay="OP01002B",
        package_code_aarogyasri="O1.2.1",
        standard_stay_duration="Day-care (3-5 hours)",
        common_diagnostics_required=["A-Scan Biometry", "Slit Lamp Exam", "Specular Microscopy", "Random Blood Sugar"]
    ),
    "mri_brain": Treatment(
        id="mri_brain",
        name="MRI Brain (1.5T / 3.0T)",
        category="Diagnostics & Imaging",
        aliases=[
            "mri", "mri brain", "brain scan", "head mri", "magnetic resonance imaging",
            "మెదడు ఎంఆర్ఐ", "मस्तिष्क एमआरआई"
        ],
        description="High-resolution non-invasive magnetic resonance imaging of the cranial structure, brain parenchyma, and cerebrovascular architecture without ionizing radiation.",
        indicative_min=4500,
        indicative_max=11500,
        package_code_pmjay="DG04001",
        package_code_aarogyasri="D1.4.1",
        standard_stay_duration="Outpatient (30-45 mins)",
        common_diagnostics_required=["Serum Creatinine (if contrast indicated)"]
    ),
    "mri_knee": Treatment(
        id="mri_knee",
        name="MRI Knee Joint (Single/Bilateral)",
        category="Diagnostics & Imaging",
        aliases=[
            "mri knee", "knee mri scan", "knee joint scan", "ligament mri",
            "మోకాలి ఎంఆర్ఐ", "घुटने का एमआरआई"
        ],
        description="Detailed cross-sectional MRI imaging of cruciate ligaments (ACL/PCL), menisci, articular cartilage, and collateral knee ligaments.",
        indicative_min=4200,
        indicative_max=9500,
        package_code_pmjay="DG04003",
        package_code_aarogyasri="D1.4.3",
        standard_stay_duration="Outpatient (30-40 mins)",
        common_diagnostics_required=["Pre-scan screening questionnaire"]
    ),
    "mri_spine": Treatment(
        id="mri_spine",
        name="MRI Lumbo-Sacral (LS) Spine",
        category="Diagnostics & Imaging",
        aliases=[
            "mri spine", "spine scan", "back mri", "back pain scan", "ls spine mri",
            "వెన్నెముక ఎంఆర్ఐ", "रीढ़ की हड्डी का एमआरआई"
        ],
        description="Diagnostic magnetic resonance evaluation of lumbar vertebral bodies, intervertebral discs, the spinal canal, and exiting nerve roots.",
        indicative_min=4800,
        indicative_max=12000,
        package_code_pmjay="DG04002",
        package_code_aarogyasri="D1.4.2",
        standard_stay_duration="Outpatient (30-45 mins)",
        common_diagnostics_required=["Pre-scan metal implant screening"]
    ),
    "normal_delivery": Treatment(
        id="normal_delivery",
        name="Normal Vaginal Delivery (Maternity Care)",
        category="Obstetrics & Gynecology",
        aliases=[
            "delivery", "normal delivery", "childbirth", "baby birth", "maternity",
            "సాధారణ ప్రసవం", "सामान्य प्रसव"
        ],
        description="Spontaneous or induced vaginal labor care, including fetal heart monitoring, partogram tracking, episiotomy/repair if required, and immediate newborn care.",
        indicative_min=24000,
        indicative_max=75000,
        package_code_pmjay="OG01001",
        package_code_aarogyasri="M1.1",
        standard_stay_duration="2-3 days",
        common_diagnostics_required=["Obstetric Ultrasound", "Complete Blood Count", "Blood Grouping & Rh", "HIV/HBsAg/VDRL"]
    ),
    "caesarean_delivery": Treatment(
        id="caesarean_delivery",
        name="Caesarean Section Delivery (LSCS)",
        category="Obstetrics & Gynecology",
        aliases=[
            "c section", "c-section", "caesarean", "operation delivery", "cesarean delivery",
            "సిజేరియన్ డెలివరీ", "सिजेरियन डिलीवरी"
        ],
        description="Lower segment caesarean delivery performed under spinal or epidural anesthesia for maternal or fetal indications with pediatric neonatologist resuscitation coverage.",
        indicative_min=45000,
        indicative_max=125000,
        package_code_pmjay="OG01002",
        package_code_aarogyasri="M1.2",
        standard_stay_duration="3-4 days",
        common_diagnostics_required=["Fetal Doppler Ultrasound", "CBC", "Coagulation Screen", "Cross Match Blood"]
    ),
    "angioplasty": Treatment(
        id="angioplasty",
        name="Coronary Angioplasty (PTCA with Drug-Eluting Stent)",
        category="Cardiology",
        aliases=[
            "angioplasty", "heart stent", "stent", "ptca", "cardiac stent",
            "గుండె యాంజియోప్లాస్టీ", "एंजियोप्लास्टी"
        ],
        description="Percutaneous transluminal coronary intervention to restore arterial perfusion in stenosed coronary arteries using bio-compatible drug-eluting stents (DES).",
        indicative_min=125000,
        indicative_max=295000,
        package_code_pmjay="MC02001",
        package_code_aarogyasri="C2.1",
        standard_stay_duration="2-3 days (1 day ICCU)",
        common_diagnostics_required=["Coronary Angiogram (CAG)", "Troponin-T/I", "Echo 2D with Doppler", "Serum Electrolytes & Creatinine"]
    ),
    "laparoscopic_cholecystectomy": Treatment(
        id="laparoscopic_cholecystectomy",
        name="Laparoscopic Gallbladder Removal (Cholecystectomy)",
        category="General & Gastrointestinal Surgery",
        aliases=[
            "gallbladder surgery", "gallbladder stone", "lap chole", "cholecystectomy", "gallstone surgery",
            "పిత్తాశయ శస్త్రచికిత్స", "पित्ताशय की सर्जरी"
        ],
        description="Keyhole laparoscopic removal of the gallbladder diseased with symptomatic cholelithiasis or chronic cholecystitis under general anesthesia.",
        indicative_min=42000,
        indicative_max=110000,
        package_code_pmjay="SU05004",
        package_code_aarogyasri="G3.4",
        standard_stay_duration="2 days",
        common_diagnostics_required=["Ultrasound Whole Abdomen", "Liver Function Tests (LFT)", "PT/INR", "Pre-anesthetic evaluation"]
    ),
    "appendectomy": Treatment(
        id="appendectomy",
        name="Laparoscopic / Open Appendectomy",
        category="General Surgery",
        aliases=[
            "appendix surgery", "appendicitis", "appendix operation", "appendix",
            "అపెండిక్స్ ఆపరేషన్", "अपेंडिक्स ऑपरेशन"
        ],
        description="Emergency or elective surgical excision of an inflamed or infected vermiform appendix to prevent rupture and peritonitis.",
        indicative_min=38000,
        indicative_max=95000,
        package_code_pmjay="SU05001",
        package_code_aarogyasri="G1.1",
        standard_stay_duration="2 days",
        common_diagnostics_required=["USG Abdomen / CECT Abdomen", "Complete Blood Count (Leukocytosis check)", "Serum Electrolytes"]
    ),
    "hemodialysis": Treatment(
        id="hemodialysis",
        name="Maintenance Hemodialysis (Per Session)",
        category="Nephrology",
        aliases=[
            "dialysis", "kidney dialysis", "hemodialysis session", "blood dialysis",
            "డయాలసిస్", "डायलिसिस"
        ],
        description="Extracorporeal blood purification session via high-flux dialyzer membrane for patients with end-stage renal disease (ESRD) or acute kidney injury.",
        indicative_min=1600,
        indicative_max=4500,
        package_code_pmjay="NE01001",
        package_code_aarogyasri="N1.1",
        standard_stay_duration="4 hours per session",
        common_diagnostics_required=["Pre/Post Dialysis Urea & Creatinine", "Serum Potassium", "Hemoglobin"]
    ),
    "hernia_repair": Treatment(
        id="hernia_repair",
        name="Inguinal Hernia Repair (Mesh Hernioplasty)",
        category="General Surgery",
        aliases=[
            "hernia surgery", "hernia operation", "mesh plasty", "inguinal hernia",
            "హెర్నియా ఆపరేషన్", "हर्निया सर्जरी"
        ],
        description="Surgical tension-free repair of abdominal wall defect with synthetic polypropylene mesh placement to prevent intestinal strangulation.",
        indicative_min=35000,
        indicative_max=88000,
        package_code_pmjay="SU05007",
        package_code_aarogyasri="G2.1",
        standard_stay_duration="1-2 days",
        common_diagnostics_required=["Ultrasound Inguinal Region", "Routine blood counts", "Coagulation profile"]
    ),
    "inpatient_fever_management": Treatment(
        id="inpatient_fever_management",
        name="Inpatient Acute Febrile Illness / Dengue Care",
        category="General Medicine",
        aliases=[
            "fever", "dengue treatment", "viral fever admission", "fever for five days", "fever admission",
            "జ్వరం చికిత్స", "बुखार का इलाज"
        ],
        description="Comprehensive inpatient medical management of acute febrile illness, vector-borne infections (Dengue, Malaria, Typhoid) with IV hydration, platelet monitoring, and symptomatic stabilization.",
        indicative_min=12000,
        indicative_max=42000,
        package_code_pmjay="GM01004",
        package_code_aarogyasri="M2.3",
        standard_stay_duration="3-5 days",
        common_diagnostics_required=["CBC with Platelet Count", "Dengue NS1 Antigen & IgM/IgG", "Malarial Smear/Card", "Widal / Blood Culture", "SGOT/SGPT"]
    ),
    "doctor_consultation": Treatment(
        id="doctor_consultation",
        name="Super-Specialist OPD Doctor Consultation",
        category="Outpatient Consultation",
        aliases=[
            "doctor consultation", "opd", "physician visit", "specialist consultation",
            "డాక్టర్ సంప్రదింపులు", "डॉक्टर परामर्श"
        ],
        description="In-clinic initial outpatient assessment by a specialist or super-specialist consultant physician/surgeon including physical examination and management plan.",
        indicative_min=500,
        indicative_max=1600,
        package_code_pmjay=None,
        package_code_aarogyasri=None,
        standard_stay_duration="Outpatient (15-30 mins)",
        common_diagnostics_required=[]
    ),
    "diabetes_care": Treatment(
        id="diabetes_care",
        name="Comprehensive Diabetes Care & Glycemic Evaluation",
        category="Endocrinology & Diabetology",
        aliases=[
            "diabetes", "sugar test", "diabetes care", "hba1c", "blood sugar check", "diabetic screening",
            "మధుమేహం సంరక్షణ", "मधुमेह देखभाल"
        ],
        description="Comprehensive diabetic assessment including fasting & post-prandial blood sugar, HbA1c, urine microalbumin, diabetic foot examination, and specialist dietetics counseling.",
        indicative_min=1800,
        indicative_max=4500,
        package_code_pmjay=None,
        package_code_aarogyasri="M3.1",
        standard_stay_duration="Outpatient (1-2 hours)",
        common_diagnostics_required=["Fasting Blood Glucose", "PPBS", "HbA1c", "Lipid Profile", "Serum Creatinine", "Urine Microalbumin"]
    ),
    "kidney_stones": Treatment(
        id="kidney_stones",
        name="Kidney Stone Laser Removal (URS / PCNL / RIRS)",
        category="Urology",
        aliases=[
            "kidney stone", "renal calculi", "stone surgery", "laser stone removal", "pcnl", "urs", "rirs",
            "మూత్రపిండాల్లో రాళ్ళు", "गुर्दे की पथरी"
        ],
        description="Minimally invasive endoscopic Holmium laser fragmentation and basket extraction of renal or ureteric calculi with DJ ureteral stent placement.",
        indicative_min=45000,
        indicative_max=115000,
        package_code_pmjay="SU07002",
        package_code_aarogyasri="U1.3",
        standard_stay_duration="1-2 days",
        common_diagnostics_required=["NCCT KUB (Non-Contrast CT)", "Serum Creatinine", "Urine Culture & Sensitivity", "Coagulation profile"]
    ),
    "blood_tests": Treatment(
        id="blood_tests",
        name="Comprehensive Diagnostic Blood Profile & Health Screening",
        category="Diagnostics & Pathology",
        aliases=[
            "blood test", "blood tests", "full body checkup", "cbc", "lipid profile", "lft", "kft", "pathology panel",
            "రక్త పరీక్షలు", "रक्त परीक्षण"
        ],
        description="Complete metabolic pathology panel covering Complete Blood Count (CBC), Liver Function Tests (LFT), Kidney Function Tests (KFT), Lipid Profile, and Thyroid Stimulating Hormone (TSH).",
        indicative_min=1200,
        indicative_max=3500,
        package_code_pmjay=None,
        package_code_aarogyasri=None,
        standard_stay_duration="Outpatient (15 mins)",
        common_diagnostics_required=["Fasting specimen collection"]
    )
}

# Aliases and normalization are resolved dynamically via normalize_treatment_query

def normalize_treatment_query(query: str) -> Optional[Treatment]:
    """
    Matches natural language or partial terms against canonical treatment catalogue.
    """
    clean_q = query.lower().strip()
    
    # Exact or alias matching
    for t_id, treat in TREATMENT_CATALOGUE.items():
        if clean_q == t_id or clean_q in treat.name.lower():
            return treat
        for alias in treat.aliases:
            if alias.lower() in clean_q or clean_q in alias.lower():
                return treat
                
    # Keyword token matching
    tokens = set(clean_q.split())
    if "knee" in tokens and ("replacement" in tokens or "surgery" in tokens or "pain" in tokens) or "మోకాలి" in clean_q or "మోకాలు" in clean_q or "घुटने" in clean_q:
        return TREATMENT_CATALOGUE["knee_replacement"]
    if "cataract" in tokens or "eye" in tokens or "motiyabind" in tokens or "కంటిశుక్లం" in clean_q or "కంటి శుక్లం" in clean_q or "మోతియాబింద్" in clean_q or "मोतियाबिंद" in clean_q:
        return TREATMENT_CATALOGUE["cataract_surgery"]
    if "diabetes" in tokens or "sugar" in tokens or "hba1c" in tokens or "మధుమేహం" in clean_q or "షుగర్" in clean_q:
        return TREATMENT_CATALOGUE["diabetes_care"]
    if "stone" in tokens or "calculi" in tokens or "pcnl" in tokens or "urs" in tokens or "మూత్రపిండ" in clean_q or "రాళ్లు" in clean_q or "पथरी" in clean_q:
        return TREATMENT_CATALOGUE["kidney_stones"]
    if ("blood" in tokens and ("test" in tokens or "tests" in tokens or "profile" in tokens or "check" in tokens)) or "రక్త పరీక్ష" in clean_q or "రక్త పరీక్షలు" in clean_q or "खून की जांच" in clean_q:
        return TREATMENT_CATALOGUE["blood_tests"]
    if "mri" in tokens or "ఎంఆర్ఐ" in clean_q or "ఎమ్మార్ఐ" in clean_q or "एमआरआई" in clean_q:
        if "brain" in tokens or "head" in tokens or "మెదడు" in clean_q or "తల" in clean_q or "मस्तिष्क" in clean_q:
            return TREATMENT_CATALOGUE["mri_brain"]
        elif "knee" in tokens or "మోకాలు" in clean_q or "మోకాలి" in clean_q:
            return TREATMENT_CATALOGUE["mri_knee"]
        elif "spine" in tokens or "back" in tokens or "వెన్నెముక" in clean_q or "రీఢ్" in clean_q:
            return TREATMENT_CATALOGUE["mri_spine"]
        return TREATMENT_CATALOGUE["mri_brain"]
    if "delivery" in tokens or "baby" in tokens or "maternity" in tokens or "ప్రసవం" in clean_q or "ప్రసవ" in clean_q:
        if "c-section" in tokens or "cesarean" in tokens or "operation" in tokens or "సిజేరియన్" in clean_q or "సి-సెక్షన్" in clean_q:
            return TREATMENT_CATALOGUE["caesarean_delivery"]
        return TREATMENT_CATALOGUE["normal_delivery"]
    if "stent" in tokens or "angioplasty" in tokens or "heart" in tokens or "గుండె" in clean_q or "స్టెంట్" in clean_q or "యాంజియోప్లాస్టీ" in clean_q:
        return TREATMENT_CATALOGUE["angioplasty"]
    if "gallbladder" in tokens or "gallstone" in tokens or "pitta" in tokens or "పిత్తాశయం" in clean_q or "గాల్ బ్లాడర్" in clean_q:
        return TREATMENT_CATALOGUE["laparoscopic_cholecystectomy"]
    if "appendix" in tokens or "appendicitis" in tokens or "అపెండిక్స్" in clean_q or "అపెండిసైటిస్" in clean_q:
        return TREATMENT_CATALOGUE["appendectomy"]
    if "dialysis" in tokens or "డయాలసిస్" in clean_q:
        return TREATMENT_CATALOGUE["hemodialysis"]
    if "hernia" in tokens or "హెర్నియా" in clean_q:
        return TREATMENT_CATALOGUE["hernia_repair"]
    if "fever" in tokens or "dengue" in tokens or "జ్వరం" in clean_q or "డెంగ్యూ" in clean_q or "बुखार" in clean_q:
        return TREATMENT_CATALOGUE["inpatient_fever_management"]
        
    return None
