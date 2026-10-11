from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# --- Treatment Schema ---
class Treatment(BaseModel):
    id: str
    name: str
    category: str
    aliases: List[str] = []
    description: str
    indicative_min: int
    indicative_max: int
    package_code_pmjay: Optional[str] = None
    package_code_aarogyasri: Optional[str] = None
    standard_stay_duration: str = "1-3 days"
    common_diagnostics_required: List[str] = []

# --- Facility Schema ---
class Facility(BaseModel):
    id: str
    name: str
    address: str
    locality: str
    city: str
    state: str
    pin_code: str
    lat: float
    lng: float
    ownership: str  # Government, Private, Charitable/Trust
    facility_class: str = "Standard"  # Standard, Premium
    recommendation_reason: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    rating: Optional[float] = None
    verified_treatments: List[str] = []
    empanelled_schemes: List[str] = []
    room_types: Dict[str, int] = {}
    last_verified_date: str = "2026-03-01"
    distance_km: Optional[float] = None
    pricing_status: Optional[str] = None
    estimated_cost_min: Optional[int] = None
    estimated_cost_max: Optional[int] = None
    price_confidence: Optional[str] = None
    image_url: Optional[str] = None
    image_source: Optional[str] = None
    image_attribution: Optional[str] = None
    image_license: Optional[str] = None
    initials: Optional[str] = None
    website_url: Optional[str] = None
    source_urls: List[str] = []
    verified_at: Optional[str] = None
    verification_status: str = "verified"  # "verified", "partial", "unverified"
    departments: List[str] = []
    schemes_detail: List[Dict[str, Any]] = []
    tariff_detail: Optional[Dict[str, Any]] = None
    specialty_match: Optional[bool] = None
    why_this_hospital: Optional[str] = None
    rank_score: Optional[float] = None

# --- Cost Breakdown Schema ---
class CostBreakdown(BaseModel):
    consultation_and_registration: int = 0
    diagnostics_and_lab: int = 0
    room_and_nursing: int = 0
    surgeon_ot_anesthesia: int = 0
    medicines_and_consumables: int = 0
    implant_or_prosthesis: int = 0
    rehabilitation_physiotherapy: int = 0
    tax_and_admin: int = 0

# --- Cost Component Detail (Itemized with public references & NPPA caps) ---
class CostComponentItem(BaseModel):
    component_name: str
    min_cost: int
    max_cost: int
    source_name: str
    source_url: str
    effective_date: str
    is_verified: bool
    status_label: str  # "Official Published Rate", "Public Reference Rate", "Illustrative"
    description: str

class OutOfPocketStep(BaseModel):
    name: str
    amount_min: int
    amount_max: int
    type: str  # "baseline", "deduction", "addition", "final"
    note: str

class OutOfPocketWaterfall(BaseModel):
    total_cost_min: int
    total_cost_max: int
    scheme_coverage_min: int
    scheme_coverage_max: int
    scheme_name: str
    patient_share_min: int
    patient_share_max: int
    verification_status: str  # "Official Verification Required by Hospital Aarogyamitra / TPA"
    steps: List[OutOfPocketStep]

class ChecklistData(BaseModel):
    questions_to_ask: List[str]
    documents_to_carry: List[str]

class TierComparisonItem(BaseModel):
    tier_name: str  # Government Hospitals, Private Hospitals, Premium Super-Specialty Hospitals
    category_key: str = "government"  # government, private, premium, charitable
    min_price: int
    max_price: int
    price_type: str = "Reference Estimate"  # Official Published Tariff, Observed Price, Reference Estimate
    source_name: str = "PM-JAY / CGHS & State Gazette Schedules"
    source_url: str = "https://pmjay.gov.in"
    last_updated: str = "March 2026"
    confidence_level: str = "High"  # High, Medium, Low
    confidence_explanation: str = "Statutory tariff rates or multi-hospital billing benchmarks."
    ward_amenity: str
    scheme_support: str
    waiting_time: str
    key_advantage: str
    exemplar_facility: str
    cost_breakdown: CostBreakdown = Field(default_factory=CostBreakdown)
    extra_expenses: List[str] = []
    exclusions: List[str] = []

class CostObservation(BaseModel):
    id: str
    treatment_id: str
    facility_id: Optional[str] = None
    facility_name: Optional[str] = None
    city: str
    min_price: int
    max_price: int
    currency: str = "INR"
    price_type: str  # Official Published Price, Reference-Based Estimate, Illustrative Demo Estimate
    confidence: str  # High, Medium, Low
    confidence_explanation: str
    breakdown: CostBreakdown
    source_name: str
    source_url: Optional[str] = None
    last_updated: str
    key_assumptions: List[str] = []
    exclusions: List[str] = []

# --- Scheme Schema ---
class Scheme(BaseModel):
    id: str
    name: str
    full_name: str
    authority: str
    coverage_limit_inr: str
    eligibility_summary: str
    eligible_categories: List[str] = []
    states: List[str] = []
    official_portal: str
    helpline: str
    required_documents: List[str] = []
    is_active: bool = True
    last_verified_date: str = "2026-03-15"
    official_portal_url: Optional[str] = None
    apply_url: Optional[str] = None
    eligibility_check_url: Optional[str] = None
    portal_source: Optional[str] = None
    portal_verified_at: Optional[str] = "2026-03-15"
    income_ceiling_lakhs: Optional[float] = None
    coverage_ceiling_inr: Optional[int] = None
    is_cashless: bool = True
    rule_sources: List[str] = []
    can_combine_with: List[str] = []

# --- Request / Response Models ---
class CostEstimateRequest(BaseModel):
    treatment: str
    city: str = "Hyderabad"
    locality: Optional[str] = None
    hospital_name: Optional[str] = None
    budget_limit: Optional[int] = None
    room_category_preference: Optional[str] = "General / Semi-Private"
    ownership_preference: Optional[str] = None
    annual_income: Optional[float] = 2.5
    ration_card_type: Optional[str] = "White Card"

class CostEstimateResponse(BaseModel):
    query_treatment: str
    canonical_treatment: Optional[Treatment] = None
    workflow: str  # Hospital-based or Location-based
    selected_facility: Optional[Facility] = None
    overall_min: int
    overall_max: int
    currency: str = "INR"
    price_type: str
    confidence: str
    confidence_explanation: str
    cost_breakdown: CostBreakdown
    detailed_components: List[CostComponentItem] = []
    waterfall: Optional[OutOfPocketWaterfall] = None
    checklists: ChecklistData
    tier_comparisons: List[TierComparisonItem] = []
    comparable_facilities: List[Facility] = []
    applicable_schemes: List[Dict[str, Any]] = []
    assumptions_and_exclusions: List[str] = []
    disclaimer: str
    data_freshness_date: str

class NLPParseRequest(BaseModel):
    text: str
    current_location: Optional[str] = None
    selected_language: Optional[str] = None  # te, hi, en, auto

class NLPParseResponse(BaseModel):
    raw_query: str
    detected_intent: str
    extracted_treatment: Optional[str] = None
    matched_treatment_id: Optional[str] = None
    extracted_location: Optional[str] = None
    extracted_budget: Optional[int] = None
    extracted_hospital_preference: Optional[str] = None
    detected_symptoms: List[str] = []
    is_symptom_not_diagnosis: bool = False
    emergency_detected: bool = False
    emergency_interrupt_required: bool = False
    triage_guidance: Optional[str] = None
    clarification_question: Optional[str] = None
    suggested_action: str
    # Advanced Multi-lingual Structured NLP fields (Prompt Section 2)
    detected_language: str = "en"  # te, hi, en, te-en
    condition: Optional[str] = None
    procedure: Optional[str] = None
    diagnostic_test: Optional[str] = None
    medicine_entities: List[str] = []
    facility_preference: Optional[str] = None
    budget: Optional[int] = None
    missing_fields: List[str] = []
    ambiguities: List[str] = []
    confidence_by_field: Dict[str, float] = {}
    requires_user_confirmation: bool = False
    canonical_translation: Optional[str] = None

class PrescriptionOCRRequest(BaseModel):
    image_base64: Optional[str] = None
    filename: Optional[str] = None
    raw_text: Optional[str] = None

class PrescriptionOCRResponse(BaseModel):
    extracted_raw_text: str
    confidence_score: float
    detected_treatments: List[str] = []
    detected_diagnostics: List[str] = []
    detected_medicines: List[str] = []
    requires_user_confirmation: bool = True
    notice: str
    suggested_search_query: Optional[str] = None
    # Advanced OCR fields (Prompt Section 3 & 4)
    detected_language: str = "en"
    detected_medicines_detailed: List[Dict[str, Any]] = []
    uncertain_regions: List[str] = []
    is_handwritten: bool = False
    visibly_extracted_lines: List[str] = []
    # New structured multimodal OCR & matching fields
    medicines: List[Dict[str, Any]] = []
    doctor_name: Optional[str] = None
    date: Optional[str] = None
    unreadable_parts: List[str] = []
    source: Optional[str] = "gemini_vision"
    canonical_treatment_id: Optional[str] = None
    canonical_treatment_name: Optional[str] = None
    available_treatment_matches: List[Dict[str, str]] = []

class SpeechTranscribeRequest(BaseModel):
    audio_base64: Optional[str] = None
    transcript_hint: Optional[str] = None
    language: str = "en-IN"  # en-IN (default), te-IN, hi-IN, auto
    sample_rate: int = 16000
    format: str = "webm"  # webm, wav, mp3, ogg

class SpeechTranscribeResponse(BaseModel):
    transcript: str
    detected_language: str
    confidence: Optional[float] = None
    confidence_label: str  # High, Moderate, Review Required
    is_code_switched: bool = False
    original_script: str
    provider: str
    is_fallback: bool = False
    status: str  # success, no_speech, unclear, error
    message: Optional[str] = None

class SchemeMatchRequest(BaseModel):
    treatment_id: Optional[str] = None
    treatment_name: Optional[str] = None
    state: str = "Telangana"
    annual_income: Optional[float] = None
    ration_card_type: Optional[str] = None
    is_formal_sector_employed: Optional[bool] = None
    is_central_govt_employee: Optional[bool] = None
    selected_facility_id: Optional[str] = None

class SchemeMatchResult(BaseModel):
    scheme: Scheme
    match_status: str
    status_color: str
    matching_reasons: List[str]
    caution_notes: List[str]
    package_reimbursement_estimate: Optional[str] = None
    empanelment_status: Optional[str] = None
    official_verification_url: str
    helpline: str
    group: str = "likely_eligible"  # "likely_eligible", "needs_more_info", "does_not_match"
    missing_criteria: List[str] = []
    coverage_assessment: Optional[str] = None  # "Fully covered", "Partly covered", "Not covered", etc.
    estimated_out_of_pocket: Optional[str] = None
    can_combine_note: Optional[str] = None
    why_matches: List[str] = []
    state_match: bool = True

class FacilityCompareRequest(BaseModel):
    facility_ids: List[str]
    treatment_id: str

# --- Canonical Healthcare Problem-Solving Request ---
class CanonicalHealthcareRequest(BaseModel):
    raw_input: str
    input_source: str = "text"  # "text", "voice", "ocr", "combined"
    detected_language: str = "en"
    primary_intent: str = "general_query"
    symptoms: List[str] = []
    treatment_id: Optional[str] = None
    treatment_name: Optional[str] = None
    medicine_query: Optional[str] = None
    extracted_medicines: List[Dict[str, Any]] = []
    location_city: Optional[str] = None
    location_locality: Optional[str] = None
    ownership_preference: Optional[str] = None  # "Government", "Private", "All"
    budget_limit: Optional[int] = None
    scheme_name: Optional[str] = None
    ration_card_type: Optional[str] = None
    user_actual_question: str
    requested_outcome: str = "general_advice"
    extracted_facts: Dict[str, Any] = {}
    confidence_score: float = 1.0
    missing_required_fields: List[str] = []
    clarification_prompt: Optional[str] = None
    is_emergency: bool = False
    data_limitations: List[str] = []
    conversation_context: List[Dict[str, str]] = []

# Guided Chat Request / Response (Voice-First Conversational Assistant)
class GuidedChatRequest(BaseModel):
    message: str
    input_source: Optional[str] = "text"  # "text", "voice", "ocr", "combined"
    treatment_id: Optional[str] = None
    city: Optional[str] = "Hyderabad"
    history: List[Dict[str, str]] = []
    prescription_text: Optional[str] = None
    prescription_filename: Optional[str] = None
    language: Optional[str] = "auto"

class GuidedChatResponse(BaseModel):
    reply: str
    reply_language: str = "en"
    emergency_detected: bool = False
    suggested_chips: List[str] = []
    canonical_intent: Optional[str] = None
    extracted_data: Optional[Dict[str, Any]] = None
    structured_estimate: Optional[CostEstimateResponse] = None
    hospitals_card: Optional[List[Dict[str, Any]]] = None
    prescription_card: Optional[Dict[str, Any]] = None
    medicine_price_card: Optional[Dict[str, Any]] = None
    audio_tts_text: Optional[str] = None
    is_clarification: bool = False
    clarification_options: List[str] = []
    action_plan: Optional[Dict[str, Any]] = None

class PatientActionPlanRequest(BaseModel):
    user_concern: str
    treatment_id: Optional[str] = None
    city: Optional[str] = "Hyderabad"
    ownership_preference: Optional[str] = None
    language: Optional[str] = "en"
    user_budget: Optional[int] = None
    medicines: Optional[List[Dict[str, Any]]] = None

class PatientActionPlanResponse(BaseModel):
    title: str
    user_stated_concern: str
    confirmed_details: Dict[str, Any]
    cost_estimate_summary: Dict[str, Any]
    estimate_limitations: List[str]
    verified_hospitals: List[Dict[str, Any]]
    official_lookup_routes: List[Dict[str, str]]
    applicable_schemes: List[Dict[str, Any]]
    questions_to_ask_hospital: List[str]
    documents_to_carry: List[str]
    next_step_checklist: List[Dict[str, Any]]
    printable_text: str

class SpeechSynthesizeRequest(BaseModel):
    text: str
    language: str = "en-IN"
    gender: str = "female"

class SpeechSynthesizeResponse(BaseModel):
    audio_base64: Optional[str] = None
    language: str
    status: str
    notice: str

# Trust Dashboard Data
class TrustDashboardData(BaseModel):
    official_count: int
    reference_count: int
    illustrative_count: int
    total_facilities: int
    total_treatments: int
    data_freshness_records: List[Dict[str, str]]
    city_coverage: Dict[str, int]
    audit_completeness_pct: int
    last_audit_date: str

class MetadataResponse(BaseModel):
    app_name: str
    version: str
    total_facilities: int
    total_treatments: int
    supported_schemes: int
    demo_mode: bool
    data_sources: List[Dict[str, str]]
    trust_metrics: Optional[TrustDashboardData] = None

# --- Phase 3 Auth Schemas ---
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    language: str = "en"

class LoginRequest(BaseModel):
    email: str
    password: str

class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    language: str = "en"

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile

class SaveComparisonRequest(BaseModel):
    facility_ids: List[str]
    treatment_name: str

class SavedComparisonItem(BaseModel):
    id: str
    facility_ids: List[str]
    treatment_name: str
    created_at: str

# --- Health Card & Insurance Hospital Finder Schemas ---
class HealthCardSchemeDTO(BaseModel):
    id: str
    name: str
    short_code: Optional[str] = None
    category: str  # government, state_government, private_insurance, employer_scheme
    authority: str = "Government of India / State Health Authority"
    description: str
    applicable_states: List[str] = []
    state_applicability: Optional[str] = None
    coverage_limit_inr: str = "Statutory Package Tariff"
    max_coverage_inr: Optional[int] = None
    cashless_mode: Optional[str] = "100% Cashless"
    official_portal: str = ""
    official_portal_url: Optional[str] = None
    helpline: str = "104"
    helpline_number: Optional[str] = None
    required_eligibility_info: List[str] = []
    eligibility_summary: Optional[str] = None
    verification_doc_needed: Optional[str] = None
    icon_type: str = "shield"
    is_active: bool = True
    last_verified_date: str = "2026-03-15"

class HealthCardPackageDTO(BaseModel):
    id: str
    scheme_id: str
    treatment_id: str
    treatment_name: str
    package_name: Optional[str] = None
    specialty: str
    package_code: Optional[str] = None
    package_rate_inr: Optional[int] = None
    statutory_rate_inr: Optional[int] = None
    is_cashless: bool = True
    pre_auth_required: bool = True
    covered_days: Optional[int] = None
    includes_implants: Optional[bool] = None
    inclusions: List[str] = []
    exclusions_notes: List[str] = []
    exclusions_summary: Optional[str] = None
    source_name: str = "Official Gazette"
    source_url: str = ""
    last_verified_date: str = "2026-03-15"

class HealthCardSearchRequest(BaseModel):
    scheme_id: str = Field(..., description="ID of the health card or insurance scheme")
    treatment_id: Optional[str] = Field(None, description="ID of requested treatment or surgery")
    state: Optional[str] = Field("Telangana", description="Selected state")
    city: Optional[str] = Field(None, description="Selected city or district")
    city_or_district: Optional[str] = Field(None, description="Alias for city")
    locality: Optional[str] = Field(None, description="Selected locality")
    lat: Optional[float] = Field(None, description="User latitude for distance calculation")
    lng: Optional[float] = Field(None, description="User longitude for distance calculation")
    radius_km: Optional[float] = Field(50.0, description="Search radius in kilometers")
    verified_only: Optional[bool] = Field(False, description="Filter only to procedure-verified hospitals")
    ownership: Optional[str] = Field(None, description="Filter by Government, Private, or Charitable/Trust")
    sort_by: Optional[str] = Field("verification", description="Sort by verification, distance, cost, or rating")

class HospitalHealthCardMatchDTO(BaseModel):
    facility_id: str
    facility_name: str
    address: str
    locality: str
    city: str
    state: str
    lat: float
    lng: float
    distance_km: Optional[float] = None
    ownership: str
    facility_class: str = "Standard"
    phone: Optional[str] = None
    website: Optional[str] = None
    rating: Optional[float] = None
    scheme_id: str
    scheme_name: str
    treatment_id: Optional[str] = None
    treatment_name: Optional[str] = None
    package_name: Optional[str] = None
    empanelment_status: str = "empanelled"
    verification_status: str = "verified_procedure"
    verification_label: str = "Verified for this procedure"
    verification_status_label: Optional[str] = None
    is_verified_procedure: bool = False
    is_scheme_empanelled: bool = True
    package_code: Optional[str] = None
    package_rate_inr: Optional[int] = None
    scheme_rate_inr: Optional[int] = None
    estimated_gross_cost_inr: Optional[int] = None
    estimated_scheme_coverage_inr: Optional[int] = None
    estimated_out_of_pocket_min: Optional[int] = 0
    estimated_out_of_pocket_max: Optional[int] = 0
    estimated_patient_out_of_pocket_inr: Optional[int] = 0
    cost_note: Optional[str] = None
    coverage_notes: Optional[str] = None
    is_cashless: bool = True
    helpdesk_location: Optional[str] = None
    helpdesk_phone: Optional[str] = None
    source_name: str = "Official Directory"
    official_source_name: Optional[str] = None
    source_url: str = ""
    official_source_url: Optional[str] = None
    last_verified_date: str = "2026-03-15"
    last_verified: Optional[str] = None
    notes: Optional[str] = None
    questions_to_ask: List[str] = []
    image_url: Optional[str] = None

class HealthCardSearchResponse(BaseModel):
    total_found: int
    total_results: Optional[int] = None
    verified_count: int
    verified_procedure_count: Optional[int] = None
    scheme_empanelled_count: Optional[int] = None
    scheme: HealthCardSchemeDTO
    treatment: Optional[Dict[str, Any]] = None
    package_info: Optional[HealthCardPackageDTO] = None
    hospitals: List[HospitalHealthCardMatchDTO] = []
    results: List[HospitalHealthCardMatchDTO] = []
    disclaimer: str = "Verified from official statutory registries. Final approval subject to pre-authorization."
    active_filters: Dict[str, Any] = {}

class HospitalHealthCardProfileResponse(BaseModel):
    facility: Facility
    empanelments: List[Dict[str, Any]] = []
    empanelled_schemes_summary: List[Dict[str, Any]] = []
    selected_scheme: Optional[HealthCardSchemeDTO] = None
    selected_package: Optional[HealthCardPackageDTO] = None
    matching_package: Optional[HealthCardPackageDTO] = None
    empanelment_detail: Optional[Dict[str, Any]] = None
    verification_status: str = "verified_procedure"
    verification_status_label: str = "Verified for this procedure"
    pre_travel_checklist: List[str] = []
    questions_to_ask: List[str] = []
    documents_required: List[str] = []
    helpline_number: Optional[str] = None
    official_portal_url: Optional[str] = None

class AdminEmpanelmentUpdateRequest(BaseModel):
    facility_id: str
    scheme_id: str
    empanelment_status: str = "empanelled"
    verification_status: str = "verified_procedure"
    specialties_covered: List[str] = []
    specific_procedures_verified: List[str] = []
    helpdesk_location: Optional[str] = None
    helpdesk_phone: Optional[str] = None
    source_name: str = "Official Directory"
    official_source_name: Optional[str] = None
    source_url: str = ""
    official_source_url: Optional[str] = None
    notes: Optional[str] = None

class DataQualityReportResponse(BaseModel):
    database_path: str
    database_size_bytes: int
    total_facilities: int
    facilities_with_gps: int
    facilities_missing_contact: int
    total_treatments: int
    diagnostics_count: int
    surgical_count: int
    total_schemes: int
    total_packages: int
    packages_with_statutory_codes: int
    total_empanelments: int
    empanelments_verified_procedure: int
    empanelments_needs_confirmation: int
    total_cost_observations: int
    official_published_tariffs_count: int
    reference_estimates_count: int
    stale_records_count: int
    audit_timestamp: str
    data_provenance: List[Dict[str, str]]
    anomalies_detected: List[str]
