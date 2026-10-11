import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useSearch } from '../context/SearchContext';
import { 
  Search, 
  Mic, 
  Upload, 
  MapPin, 
  ArrowRight, 
  ArrowLeft,
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  DollarSign, 
  Building2,
  RefreshCw,
  Info,
  Printer,
  Navigation,
  Check,
  HelpCircle,
  FileText,
  Sliders,
  Layers,
  Phone,
  Calendar,
  MessageSquare,
  Share2
} from 'lucide-react';
import { api, CostEstimateDTO, FacilityDTO, SchemeMatchDTO, NLPParseDTO } from '../services/api';
import { HospitalCard } from '../components/HospitalCard';
import { SchemeCard } from '../components/SchemeCard';
import { CostBreakdownModal } from '../components/CostBreakdownModal';
import { HospitalDetailModal } from '../components/HospitalDetailModal';
import { OutOfPocketWaterfallChart } from '../components/OutOfPocketWaterfallChart';
import { ItemizedComponentsTable } from '../components/ItemizedComponentsTable';
import { ChecklistsCard } from '../components/ChecklistsCard';
import { TierComparisonView } from '../components/TierComparisonView';
import { EmergencyInterruptModal } from '../components/EmergencyInterruptModal';
import { PrintSummaryModal } from '../components/PrintSummaryModal';
import { CostBreakdownDonut } from '../components/CostBreakdownDonut';
import { ShareModal } from '../components/ShareModal';
import { BookingModal } from '../components/BookingModal';
import { PanIndiaLocationPicker } from '../components/PanIndiaLocationPicker';
import { ConditionPreview } from '../components/ConditionPreview';
import { motion } from 'framer-motion';

interface DashboardPageProps {
  onOpenVoice: () => void;
  onOpenRx: () => void;
  onNavigateTab: (tab: string) => void;
  onTriggerEmergency: (message: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenVoice,
  onOpenRx,
  onNavigateTab,
  onTriggerEmergency
}) => {
  const { t } = useLanguage();
  const { 
    searchState, 
    setSearchQuery, 
    setTreatment, 
    setLocation, 
    addToComparison, 
    removeFromComparison,
    addRecentSearch 
  } = useSearch();

  // 5-Step Connected Healthcare Journey
  const [currentStep, setCurrentStep] = useState<number>(() => {
    // If a treatment is already loaded, start at Step 3 (Cost Estimation), else Step 1
    return searchState.treatmentName ? 1 : 1;
  });

  // Step 1: Disease & Treatment State
  const [inputQuery, setInputQuery] = useState(searchState.query || searchState.treatmentName || "Total Knee Replacement");
  const [selectedTreatmentId, setSelectedTreatmentId] = useState(searchState.treatmentId || "knee_replacement");
  const [selectedTreatmentName, setSelectedTreatmentName] = useState(searchState.treatmentName || "Total Knee Replacement (TKR)");
  const [ambiguityClarification, setAmbiguityClarification] = useState<{
    prompt: string;
    options: Array<{ id: string; name: string }>;
  } | null>(null);

  // Step 2: Location Selection State (Pan-India)
  const [selectedCity, setSelectedCity] = useState(searchState.city || "Hyderabad");
  const [selectedState, setSelectedState] = useState(searchState.state || "Telangana");
  const [selectedLocality, setSelectedLocality] = useState(searchState.locality || "");
  const [selectedPinCode, setSelectedPinCode] = useState(searchState.pinCode || "");
  const [gpsStatus, setGpsStatus] = useState<{ loading: boolean; message: string | null; error: boolean }>({
    loading: false,
    message: null,
    error: false
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    searchState.lat && searchState.lng ? { lat: searchState.lat, lng: searchState.lng } : null
  );

  useEffect(() => {
    if (searchState.city) setSelectedCity(searchState.city);
    if (searchState.state) setSelectedState(searchState.state);
    if (searchState.locality) setSelectedLocality(searchState.locality);
    if (searchState.pinCode) setSelectedPinCode(searchState.pinCode);
    if (searchState.lat && searchState.lng) setCoords({ lat: searchState.lat, lng: searchState.lng });
  }, [searchState.city, searchState.state, searchState.locality, searchState.pinCode, searchState.lat, searchState.lng]);

  // Step 3: Treatment Cost Estimation State
  const [costResult, setCostResult] = useState<CostEstimateDTO | null>(null);
  const [analysisTab, setAnalysisTab] = useState<'tiers' | 'donut' | 'waterfall' | 'components' | 'checklists'>('tiers');

  // Step 4: Hospital Recommendations State
  const [facilities, setFacilities] = useState<FacilityDTO[]>([]);
  const [hospitalCategoryFilter, setHospitalCategoryFilter] = useState<string>("All");
  const [hospitalSortBy, setHospitalSortBy] = useState<string>("nearest");
  const [treatmentAvailableOnly, setTreatmentAvailableOnly] = useState<boolean>(false);
  const [schemeSupportFilter, setSchemeSupportFilter] = useState<string>("All");

  // Step 5: Government Schemes & Insurance State
  const [schemes, setSchemes] = useState<SchemeMatchDTO[]>([]);
  const [annualIncome, setAnnualIncome] = useState<number>(2.5); // in Lakhs
  const [rationCardType, setRationCardType] = useState<string>("White Card");
  const [employmentSector, setEmploymentSector] = useState<string>("Informal / Self-Employed");

  // General Loading & Error State
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [nlpResult, setNlpResult] = useState<NLPParseDTO | null>(null);

  // Modals
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [emergencyGuidance, setEmergencyGuidance] = useState("");
  const [selectedFacilityForModal, setSelectedFacilityForModal] = useState<FacilityDTO | null>(null);
  const [bookingFacility, setBookingFacility] = useState<FacilityDTO | null>(null);

  // Common procedures requested in specification
  const COMMON_PROCEDURES = [
    { id: 'cataract_surgery', name: 'Cataract Eye Surgery', category: 'Ophthalmology' },
    { id: 'knee_replacement', name: 'Total Knee Replacement (TKR)', category: 'Orthopedics' },
    { id: 'diabetes_care', name: 'Diabetes Care & HbA1c Management', category: 'General Medicine / Endocrinology' },
    { id: 'kidney_stones', name: 'Laser Lithotripsy (Kidney Stones)', category: 'Urology' },
    { id: 'mri_brain', name: 'MRI Scan (Brain / Spine)', category: 'Radiology & Diagnostics' },
    { id: 'blood_tests', name: 'Comprehensive Blood Test Panel', category: 'Pathology & Diagnostics' },
    { id: 'normal_delivery', name: 'Normal Delivery & Maternity Care', category: 'Obstetrics' },
    { id: 'c_section', name: 'Caesarean Section (C-Section)', category: 'Obstetrics & Gynecology' },
    { id: 'cardiac_angioplasty', name: 'Coronary Angioplasty (PTCA)', category: 'Cardiology' },
    { id: 'laparoscopic_cholecystectomy', name: 'Gallbladder Removal (Laparoscopic)', category: 'General Surgery' }
  ];

  // Ambiguity rules for symptoms
  const checkAmbiguity = (text: string) => {
    const q = text.toLowerCase();
    if (q.includes('knee') && !q.includes('replacement')) {
      return {
        prompt: 'You searched for knee pain. CareSaathi does not diagnose conditions. Did you want to explore any of these specific treatments or tests?',
        options: [
          { id: 'knee_replacement', name: 'Total Knee Replacement (TKR)' },
          { id: 'mri_brain', name: 'Knee MRI / Radiology Scan' },
          { id: 'diabetes_care', name: 'Orthopedic OPD Consultation' }
        ]
      };
    }
    if (q.includes('eye') || q.includes('vision') || q.includes('blur')) {
      return {
        prompt: 'You mentioned eye or vision concerns. Which procedure or evaluation are you exploring?',
        options: [
          { id: 'cataract_surgery', name: 'Cataract Eye Surgery' },
          { id: 'blood_tests', name: 'Diabetic Retinopathy Blood Screen' }
        ]
      };
    }
    if (q.includes('stone') || q.includes('urine') || q.includes('flank')) {
      return {
        prompt: 'You mentioned stone or urinary symptoms. Which clinical procedure are you looking to estimate?',
        options: [
          { id: 'kidney_stones', name: 'Laser Lithotripsy (Kidney Stones)' },
          { id: 'blood_tests', name: 'Renal Function & Urinalysis Panel' }
        ]
      };
    }
    if (q.includes('fever') || q.includes('weak') || q.includes('sugar')) {
      return {
        prompt: 'Fever and fatigue are symptoms requiring physician evaluation. Would you like to check costs for diagnostic tests?',
        options: [
          { id: 'blood_tests', name: 'Comprehensive Blood Test Panel (CBC, Widal, LFT)' },
          { id: 'diabetes_care', name: 'Diabetes Care & HbA1c Management' }
        ]
      };
    }
    return null;
  };

  // Request sequence ref to prevent out-of-order response overwrites
  const requestSeqRef = React.useRef(0);

  const loadDataForJourney = React.useCallback(async (
    tId: string, 
    tName: string, 
    cityName: string, 
    localityName: string
  ) => {
    const currentSeq = ++requestSeqRef.current;
    setIsLoading(true);
    setSearchError(null);

    try {
      // 1. NLP Parse & Emergency Check
      const nlp = await api.parseNLP(tName, localityName || cityName);
      if (currentSeq !== requestSeqRef.current) return;
      if (nlp) {
        setNlpResult(nlp);
        if (nlp.emergency_detected) {
          const msg = nlp.triage_guidance || "Emergency medical condition identified. Please call 108 immediately.";
          setEmergencyGuidance(msg);
          setIsEmergencyModalOpen(true);
          onTriggerEmergency(msg);
        }
      }

      // 2. Cost Estimation across All Categories
      try {
        const cost = await api.estimateCost({
          treatment: tName,
          city: cityName,
          locality: localityName,
          annual_income: annualIncome,
          ration_card_type: rationCardType
        });
        if (currentSeq !== requestSeqRef.current) return;
        setCostResult(cost);
      } catch (costErr: any) {
        console.warn("Cost estimation unavailable for treatment:", tName, costErr);
        if (currentSeq === requestSeqRef.current) {
          setCostResult(null);
        }
      }

      // 3. Hospital Recommendations
      const facs = await api.getFacilities({
        city: cityName,
        locality: localityName || undefined,
        treatment_id: tId,
        sort: hospitalSortBy,
        ownership: hospitalCategoryFilter !== 'All' ? hospitalCategoryFilter : undefined,
        scheme: schemeSupportFilter !== 'All' ? schemeSupportFilter : undefined,
        treatment_available_only: treatmentAvailableOnly,
        lat: coords?.lat,
        lng: coords?.lng
      });
      if (currentSeq !== requestSeqRef.current) return;
      setFacilities(facs);

      // 4. Government Schemes & Insurance
      const matched = await api.matchSchemes({
        treatment_id: tId,
        treatment_name: tName,
        state: selectedState || searchState.state || "Telangana",
        annual_income: annualIncome,
        ration_card_type: rationCardType
      });
      if (currentSeq !== requestSeqRef.current) return;
      setSchemes(matched);

    } catch (err: any) {
      if (currentSeq !== requestSeqRef.current) return;
      console.error("Care journey load failed", err);
      setSearchError(
        err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError')
          ? '⚠️ Cannot connect to the backend server. Please make sure the Python backend is running on port 8000.'
          : (err?.message || 'Failed to load journey data. Please try again.')
      );
    } finally {
      if (currentSeq === requestSeqRef.current) {
        setIsLoading(false);
      }
    }
  }, [
    annualIncome,
    rationCardType,
    hospitalSortBy,
    hospitalCategoryFilter,
    schemeSupportFilter,
    treatmentAvailableOnly,
    coords?.lat,
    coords?.lng,
    selectedState,
    searchState.state,
    onTriggerEmergency
  ]);

  // Reactive data loading effect on searchState change
  useEffect(() => {
    if (searchState.treatmentName) {
      loadDataForJourney(
        searchState.treatmentId, 
        searchState.treatmentName, 
        searchState.city, 
        searchState.locality
      );
    }
  }, [
    searchState.treatmentId, 
    searchState.treatmentName, 
    searchState.city, 
    searchState.locality,
    loadDataForJourney
  ]);

  // Step 1: Handle Selection
  const handleSelectProcedure = (proc: { id: string; name: string }) => {
    setSelectedTreatmentId(proc.id);
    setSelectedTreatmentName(proc.name);
    setInputQuery(proc.name);
    setAmbiguityClarification(null);
    setTreatment(proc.id, proc.name);
    setSearchQuery(proc.name);
    addRecentSearch(proc.name);
  };

  const handleQueryChange = (val: string) => {
    setInputQuery(val);
    const amb = checkAmbiguity(val);
    setAmbiguityClarification(amb);

    // Auto-detect matching condition from search input
    const normalized = val.trim().toLowerCase();
    if (normalized.length >= 2) {
      const matched = COMMON_PROCEDURES.find(proc => 
        proc.name.toLowerCase().includes(normalized) ||
        proc.id.toLowerCase().includes(normalized) ||
        proc.category.toLowerCase().includes(normalized)
      );
      if (matched) {
        setSelectedTreatmentId(matched.id);
        setSelectedTreatmentName(matched.name);
      }
    }
  };

  const handleStep1Continue = () => {
    if (!selectedTreatmentName.trim()) {
      alert("Please select or enter a treatment, condition, or test.");
      return;
    }
    // Update search context
    setTreatment(selectedTreatmentId, selectedTreatmentName);
    setSearchQuery(inputQuery);
    setCurrentStep(2);
  };

  // Step 2: Use My Location GPS
  const handleRequestGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatus({
        loading: false,
        message: "Geolocation is not supported by your browser. Please enter your locality or PIN code manually.",
        error: true
      });
      return;
    }

    setGpsStatus({ loading: true, message: "Requesting browser location permission...", error: false });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        setGpsStatus({
          loading: false,
          message: `📍 GPS detected: (${latitude.toFixed(3)}, ${longitude.toFixed(3)}) within ${selectedCity}. Showing nearest facilities.`,
          error: false
        });
      },
      (err) => {
        let msg = "Location permission denied. Please enter your locality or PIN code manually.";
        if (err.code === 2) msg = "Location unavailable. Please enter your locality or PIN code manually.";
        if (err.code === 3) msg = "Location request timed out. Please enter your locality or PIN code manually.";
        setGpsStatus({ loading: false, message: msg, error: true });
      },
      { timeout: 9000, enableHighAccuracy: true }
    );
  };

  const handleStep2Continue = async () => {
    setLocation({
      city: selectedCity,
      state: selectedState,
      locality: selectedLocality,
      pinCode: selectedPinCode,
      lat: coords?.lat,
      lng: coords?.lng
    });
    setCurrentStep(3);
    await loadDataForJourney(selectedTreatmentId, selectedTreatmentName, selectedCity, selectedLocality);
  };

  // Refresh facilities when filters change in Step 4
  const handleApplyHospitalFilters = async () => {
    setIsLoading(true);
    try {
      const facs = await api.getFacilities({
        city: selectedCity,
        locality: selectedLocality || undefined,
        pin: selectedPinCode || undefined,
        treatment_id: selectedTreatmentId,
        sort: hospitalSortBy,
        ownership: hospitalCategoryFilter !== 'All' ? hospitalCategoryFilter : undefined,
        scheme: schemeSupportFilter !== 'All' ? schemeSupportFilter : undefined,
        treatment_available_only: treatmentAvailableOnly,
        lat: coords?.lat,
        lng: coords?.lng
      });
      setFacilities(facs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-evaluate schemes in Step 5
  const handleReevaluateSchemes = async () => {
    setIsLoading(true);
    try {
      const matched = await api.matchSchemes({
        treatment_id: selectedTreatmentId,
        treatment_name: selectedTreatmentName,
        state: selectedState || searchState.state || "Telangana",
        annual_income: annualIncome,
        ration_card_type: rationCardType
      });
      setSchemes(matched);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const JOURNEY_STEPS = [
    { num: 1, title: "Condition / Test", subtitle: "Disease or Treatment Input" },
    { num: 2, title: "Location & GPS", subtitle: "City, Locality or PIN" },
    { num: 3, title: "Cost Estimation", subtitle: "Govt vs Pvt vs Premium" },
    { num: 4, title: "Find Hospitals", subtitle: "Verified Capabilities" },
    { num: 5, title: "Schemes & Support", subtitle: "PM-JAY & Aarogyasri" },
  ];

  return (
    <div className="section" style={{ paddingTop: '24px', paddingBottom: '60px' }}>
      <div className="container">

        {/* 1. HEALTHCARE JOURNEY PROGRESS STEPPER */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid var(--color-border)',
          padding: '20px 24px',
          marginBottom: '28px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-teal">
                <Sparkles size={14} />
                <span>Connected Healthcare Journey</span>
              </span>
              <span style={{ fontSize: '0.84rem', color: 'var(--color-text-grey)' }}>
                Step {currentStep} of 5: {JOURNEY_STEPS[currentStep - 1].title}
              </span>
            </div>

            {/* Context Summary pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--color-navy)' }}>
              <strong>{selectedTreatmentName}</strong>
              <span style={{ color: '#94A3B8' }}>•</span>
              <span>{selectedLocality ? `${selectedLocality}, ${selectedCity}` : selectedCity}</span>
              {currentStep > 2 && (
                <button
                  onClick={() => setCurrentStep(1)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-teal)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    textDecoration: 'underline',
                    padding: 0
                  }}
                >
                  Edit
                </button>
              )}
            </div>
          </div>

          {/* Stepper Rail */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            {JOURNEY_STEPS.map((s) => {
              const isPassed = currentStep > s.num;
              const isCurrent = currentStep === s.num;
              return (
                <div 
                  key={s.num} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px',
                    cursor: isPassed ? 'pointer' : 'default',
                    opacity: isCurrent || isPassed ? 1 : 0.6
                  }}
                  onClick={() => {
                    if (isPassed) setCurrentStep(s.num);
                  }}
                  title={isPassed ? `Click to return to Step ${s.num}` : undefined}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: isCurrent ? 'var(--color-teal)' : isPassed ? 'var(--color-mint)' : '#F1F5F9',
                    color: isCurrent ? '#FFFFFF' : isPassed ? 'var(--color-teal-dark)' : '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    border: isCurrent ? '2px solid var(--color-teal)' : isPassed ? '1px solid var(--color-teal)' : '1px solid #CBD5E1',
                    flexShrink: 0,
                    transition: 'all 0.2s ease'
                  }}>
                    {isPassed ? <Check size={18} strokeWidth={3} /> : s.num}
                  </div>

                  <div style={{ display: 'none', minWidth: '100px' }} className="step-label-container">
                    <style>{`
                      @media (min-width: 860px) {
                        .step-label-container { display: block !important; }
                      }
                    `}</style>
                    <div style={{ fontSize: '0.84rem', fontWeight: isCurrent ? 800 : 600, color: isCurrent ? 'var(--color-navy)' : '#64748B' }}>
                      {s.title}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                      {s.subtitle}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Search Error */}
        {searchError && (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <AlertTriangle size={20} color="#DC2626" />
            <div style={{ fontSize: '0.88rem', color: '#991B1B' }}>{searchError}</div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: DISEASE OR TREATMENT INPUT */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="card" style={{ padding: '32px 28px' }}>
            <div style={{ marginBottom: '22px' }}>
              <div className="badge badge-teal" style={{ marginBottom: '8px' }}>
                Step 1 of 5
              </div>
              <h2 style={{ fontSize: '1.75rem', color: 'var(--color-navy)', margin: '0 0 6px' }}>
                Enter Disease, Medical Condition, or Treatment
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-grey)', margin: 0 }}>
                Type naturally, speak via microphone, upload prescription, or pick a supported procedure below.
              </p>
            </div>

            {/* Input Box with Voice & Rx OCR triggers */}
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '44px', paddingRight: '90px', height: '52px', fontSize: '1.05rem' }}
                placeholder="e.g. Cataract surgery, Knee Replacement, Diabetes, Kidney Stones, MRI..."
                value={inputQuery}
                onChange={e => handleQueryChange(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleStep1Continue();
                  }
                }}
              />
              <Search
                size={20}
                color="var(--color-text-grey)"
                style={{ position: 'absolute', left: '16px', top: '16px' }}
              />
              <div style={{ position: 'absolute', right: '10px', top: '9px', display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={onOpenVoice}
                  style={{
                    backgroundColor: 'var(--color-mint)',
                    border: 'none',
                    borderRadius: '6px',
                    width: '34px',
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-teal)',
                    cursor: 'pointer'
                  }}
                  title="Voice Search"
                >
                  <Mic size={17} />
                </button>
                <button
                  type="button"
                  onClick={onOpenRx}
                  style={{
                    backgroundColor: 'var(--color-light-blue)',
                    border: 'none',
                    borderRadius: '6px',
                    width: '34px',
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-navy)',
                    cursor: 'pointer'
                  }}
                  title="Upload Prescription OCR"
                >
                  <Upload size={17} />
                </button>
              </div>
            </div>

            {/* Ambiguity Clarification Callout (Rule: Ask clarification when ambiguous, never assume diagnosis) */}
            {ambiguityClarification && (
              <div style={{
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E40AF', fontWeight: 700, fontSize: '0.92rem', marginBottom: '6px' }}>
                  <HelpCircle size={18} />
                  <span>Clarification Needed</span>
                </div>
                <p style={{ fontSize: '0.88rem', color: '#1E3A8A', margin: '0 0 12px' }}>
                  {ambiguityClarification.prompt}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {ambiguityClarification.options.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectProcedure(opt)}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #3B82F6',
                        color: '#1D4ED8',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {opt.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Common Conditions & Procedures Requested in Spec */}
            <div style={{ marginBottom: '26px' }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '10px' }}>
                Common Conditions & Diagnostic Procedures:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                {COMMON_PROCEDURES.map(proc => {
                  const isSelected = selectedTreatmentId === proc.id;
                  return (
                    <motion.button
                      key={proc.id}
                      type="button"
                      onClick={() => handleSelectProcedure(proc)}
                      animate={{
                        scale: isSelected ? 1.02 : 1,
                        boxShadow: isSelected 
                          ? '0 0 0 2px var(--color-teal), 0 6px 18px rgba(67, 143, 132, 0.22)' 
                          : '0 1px 3px rgba(24, 50, 71, 0.04)'
                      }}
                      whileHover={{ scale: isSelected ? 1.02 : 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      transition={{ duration: 0.18 }}
                      style={{
                        textAlign: 'left',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        backgroundColor: isSelected ? 'var(--color-mint)' : '#F8FAFC',
                        border: isSelected ? '2px solid var(--color-teal)' : '1px solid var(--color-border)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: isSelected ? 'var(--color-teal-dark)' : 'var(--color-navy)' }}>
                        {proc.name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '2px' }}>
                        {proc.category}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Animated Educational Procedure Preview Box */}
            <ConditionPreview 
              selectedConditionId={selectedTreatmentId} 
              selectedConditionName={selectedTreatmentName} 
            />

            {/* Non-Diagnostic Clinical Safety Notice */}
            <div style={{
              backgroundColor: '#FAFAF7',
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '26px',
              fontSize: '0.82rem',
              color: '#64717D'
            }}>
              <ShieldCheck size={18} color="var(--color-teal)" style={{ flexShrink: 0 }} />
              <span>
                <strong>Non-Diagnostic Notice:</strong> CareSaathi AI provides statutory cost discovery and hospital transparency. We never provide medical diagnoses or replace clinical consultations.
              </span>
            </div>

            {/* Navigation Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleStep1Continue}
                className="btn btn-primary"
                style={{ padding: '12px 28px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <span>Continue to Location Selection</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: LOCATION SELECTION */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="card" style={{ padding: '32px 28px' }}>
            <div style={{ marginBottom: '22px' }}>
              <div className="badge badge-teal" style={{ marginBottom: '8px' }}>
                Step 2 of 5
              </div>
              <h2 style={{ fontSize: '1.75rem', color: 'var(--color-navy)', margin: '0 0 6px' }}>
                Select Your City, Locality, or PIN Code
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-grey)', margin: 0 }}>
                We use real geocoding and facility databases to find hospitals and local healthcare tariffs.
              </p>
            </div>

            {/* Summary of Step 1 Selection */}
            <div style={{
              backgroundColor: 'var(--color-mint)',
              border: '1px solid rgba(44, 140, 131, 0.3)',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-teal-dark)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Procedure Selected
                </span>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-navy)' }}>
                  {selectedTreatmentName}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="btn btn-secondary btn-sm"
              >
                Change Procedure
              </button>
            </div>

            {/* Pan-India Location Picker */}
            <div style={{ marginBottom: '28px' }}>
              <PanIndiaLocationPicker
                onLocationSelect={(loc) => {
                  setSelectedCity(loc.city);
                  setSelectedState(loc.state);
                  setSelectedLocality(loc.district && loc.district !== loc.city ? loc.district : '');
                  setSelectedPinCode(loc.pinCode || '');
                  setCoords({ lat: loc.lat, lng: loc.lng });
                }}
              />
            </div>

            {/* Back & Continue Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowLeft size={16} />
                <span>Back to Disease / Treatment</span>
              </button>

              <button
                type="button"
                onClick={handleStep2Continue}
                className="btn btn-primary"
                style={{ padding: '12px 28px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Fetching Pricing Intelligence...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Cost Estimation</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: TREATMENT COST ESTIMATION */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Step Header */}
            <div className="card" style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <div className="badge badge-teal" style={{ marginBottom: '6px' }}>
                    Step 3 of 5: Statutory & Benchmark Tariffs
                  </div>
                  <h2 style={{ fontSize: '1.8rem', color: 'var(--color-navy)', margin: '0 0 4px' }}>
                    Treatment Cost Estimates for {selectedTreatmentName}
                  </h2>
                  <div style={{ fontSize: '0.88rem', color: 'var(--color-text-grey)' }}>
                    Location: <strong>{selectedLocality ? `${selectedLocality}, ${selectedCity}` : selectedCity}</strong> • Evidence-Based Multi-Tier Comparison
                  </div>
                </div>

                {costResult && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-grey)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Indicative Overall Range
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--color-navy)' }}>
                      ₹{costResult.overall_min.toLocaleString('en-IN')} — ₹{costResult.overall_max.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-teal-dark)' }}>
                      {costResult.price_type}
                    </div>
                  </div>
                )}
              </div>

              {/* Confidence & Evidence Source Note */}
              {costResult && (
                <div style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  border: '1px solid #E2E8F0',
                  marginTop: '16px',
                  fontSize: '0.84rem',
                  color: 'var(--color-navy)'
                }}>
                  <strong>Statutory Evidence:</strong> {costResult.confidence_explanation}
                </div>
              )}
            </div>

            {/* Render Tier Comparison View (Government vs Private vs Premium vs Charitable) */}
            {costResult && costResult.tier_comparisons && (
              <TierComparisonView
                tierComparisons={costResult.tier_comparisons}
                treatmentName={selectedTreatmentName}
              />
            )}

            {/* In-Depth Financial Analysis Tabs */}
            {costResult && (
              <div className="card" style={{ padding: '24px 28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--color-navy)', margin: 0 }}>
                    In-Depth Financial & Regulatory Intelligence
                  </h3>

                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
                    {[
                      { id: 'tiers', label: 'Tiers Summary' },
                      { id: 'donut', label: 'Itemized Donut' },
                      { id: 'waterfall', label: 'Waterfall Calculator' },
                      { id: 'components', label: 'NPPA / Price Caps' },
                      { id: 'checklists', label: 'Admission Checklists' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setAnalysisTab(tab.id as any)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: analysisTab === tab.id ? 'var(--color-teal)' : '#F1F5F9',
                          color: analysisTab === tab.id ? '#FFFFFF' : 'var(--color-navy)',
                          fontWeight: 600,
                          fontSize: '0.82rem',
                          cursor: 'pointer'
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {analysisTab === 'donut' && costResult.cost_breakdown && (
                  <CostBreakdownDonut
                    breakdown={costResult.cost_breakdown}
                    minPrice={costResult.overall_min}
                    maxPrice={costResult.overall_max}
                    treatmentName={selectedTreatmentName}
                  />
                )}

                {analysisTab === 'waterfall' && costResult.waterfall && (
                  <OutOfPocketWaterfallChart
                    waterfall={costResult.waterfall}
                    treatmentName={selectedTreatmentName}
                  />
                )}

                {analysisTab === 'components' && costResult.detailed_components && (
                  <ItemizedComponentsTable
                    components={costResult.detailed_components}
                    treatmentName={selectedTreatmentName}
                  />
                )}

                {analysisTab === 'checklists' && costResult.checklists && (
                  <ChecklistsCard
                    checklists={costResult.checklists}
                    treatmentName={selectedTreatmentName}
                  />
                )}

                {/* Additional Action Buttons */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setIsBreakdownOpen(true)}
                    className="btn btn-secondary btn-sm"
                  >
                    <DollarSign size={14} color="var(--color-teal)" />
                    <span>View Itemized Component Modal</span>
                  </button>
                  <button
                    onClick={() => setIsShareOpen(true)}
                    className="btn btn-secondary btn-sm"
                    style={{ color: '#075E54', borderColor: '#86EFAC' }}
                  >
                    <MessageSquare size={14} color="#25D366" />
                    <span>Share via WhatsApp</span>
                  </button>
                  <button
                    onClick={() => setIsPrintOpen(true)}
                    className="btn btn-secondary btn-sm"
                  >
                    <Printer size={14} />
                    <span>Print 1-Page Patient Summary</span>
                  </button>
                </div>
              </div>
            )}

            {/* Back & Continue Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowLeft size={16} />
                <span>Back to Location</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="btn btn-primary"
                style={{ padding: '12px 28px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <span>Continue to Hospital Recommendations</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: HOSPITAL RECOMMENDATIONS */}
        {/* ========================================================================= */}
        {currentStep === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Step Header & Filters */}
            <div className="card" style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
                <div>
                  <div className="badge badge-teal" style={{ marginBottom: '6px' }}>
                    Step 4 of 5: Hospital Recommendations
                  </div>
                  <h2 style={{ fontSize: '1.8rem', color: 'var(--color-navy)', margin: '0 0 4px' }}>
                    Recommended Hospitals for {selectedTreatmentName}
                  </h2>
                  <div style={{ fontSize: '0.88rem', color: 'var(--color-text-grey)' }}>
                    Showing verified facilities in <strong>{selectedCity}</strong> with genuine building photos and empanelled tariffs.
                  </div>
                </div>

                {/* Compare Bar Callout */}
                <div style={{
                  backgroundColor: 'var(--color-mint)',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '0.84rem',
                  color: 'var(--color-navy)'
                }}>
                  Selected for comparison: <strong>{searchState.comparisonList.length} of 3</strong>
                  {searchState.comparisonList.length > 0 && (
                    <button
                      onClick={() => onNavigateTab('comparison')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-teal)',
                        fontWeight: 700,
                        marginLeft: '8px',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      View Table →
                    </button>
                  )}
                </div>
              </div>

              {/* Filters Bar: Ownership, Sorting, Treatment Available */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid var(--color-border)' }}>
                {/* Category Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-navy)' }}>Category:</span>
                  <select
                    className="form-select"
                    style={{ padding: '4px 8px', fontSize: '0.82rem', width: 'auto' }}
                    value={hospitalCategoryFilter}
                    onChange={e => {
                      setHospitalCategoryFilter(e.target.value);
                      setTimeout(handleApplyHospitalFilters, 50);
                    }}
                  >
                    <option value="All">All Categories</option>
                    <option value="Government">Government Hospitals</option>
                    <option value="Private">Private Hospitals</option>
                    <option value="Premium">⭐ Premium Super-Specialty</option>
                    <option value="Charitable/Trust">Charitable / Trust</option>
                  </select>
                </div>

                {/* Sort By */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-navy)' }}>Sort:</span>
                  <select
                    className="form-select"
                    style={{ padding: '4px 8px', fontSize: '0.82rem', width: 'auto' }}
                    value={hospitalSortBy}
                    onChange={e => {
                      setHospitalSortBy(e.target.value);
                      setTimeout(handleApplyHospitalFilters, 50);
                    }}
                  >
                    <option value="nearest">Nearest Distance</option>
                    <option value="lowest_cost">Lowest Estimated Cost</option>
                    <option value="rating">Highest Rating</option>
                  </select>
                </div>

                {/* Scheme Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-navy)' }}>Scheme:</span>
                  <select
                    className="form-select"
                    style={{ padding: '4px 8px', fontSize: '0.82rem', width: 'auto' }}
                    value={schemeSupportFilter}
                    onChange={e => {
                      setSchemeSupportFilter(e.target.value);
                      setTimeout(handleApplyHospitalFilters, 50);
                    }}
                  >
                    <option value="All">All Facilities</option>
                    <option value="pm_jay">Ayushman Bharat PM-JAY Empanelled</option>
                    <option value="aarogyasri">Telangana Aarogyasri Empanelled</option>
                    <option value="mjpjay">Maharashtra MJPJAY Empanelled</option>
                    <option value="cghs">Central Govt CGHS Empanelled</option>
                    <option value="esic">ESIC Empanelled</option>
                  </select>
                </div>

                {/* Treatment Available Toggle */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-navy)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={treatmentAvailableOnly}
                    onChange={e => {
                      setTreatmentAvailableOnly(e.target.checked);
                      setTimeout(handleApplyHospitalFilters, 50);
                    }}
                  />
                  <span>Verified Department Available Only</span>
                </label>
              </div>
            </div>

            {/* Hospital Cards Grid */}
            <div className="grid-3">
              {facilities.map(fac => (
                <HospitalCard
                  key={fac.id}
                  facility={fac}
                  activeTreatmentId={selectedTreatmentId}
                  onViewDetails={f => setSelectedFacilityForModal(f)}
                  onBookAppointment={f => setBookingFacility(f)}
                />
              ))}
            </div>

            {facilities.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                <Building2 size={36} color="#94A3B8" style={{ marginBottom: '8px' }} />
                <h4 style={{ color: 'var(--color-navy)', margin: '0 0 6px' }}>No facilities match the active filter</h4>
                <p style={{ color: '#64748B', fontSize: '0.86rem', margin: 0 }}>
                  Try setting category to "All Categories" or clearing the scheme filter.
                </p>
              </div>
            )}

            {/* Back & Continue Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowLeft size={16} />
                <span>Back to Cost Estimation</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="btn btn-primary"
                style={{ padding: '12px 28px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <span>Continue to Financial Schemes & Insurance</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: GOVERNMENT SCHEMES & INSURANCE */}
        {/* ========================================================================= */}
        {currentStep === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Step Header */}
            <div className="card" style={{ padding: '24px 28px' }}>
              <div className="badge badge-teal" style={{ marginBottom: '6px' }}>
                Step 5 of 5: Financial Support & Public Schemes
              </div>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--color-navy)', margin: '0 0 4px' }}>
                Government Scheme & Insurance Eligibility
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-grey)', margin: 0 }}>
                Screening for PM-JAY, Telangana Aarogyasri, and CGHS. Transparent evaluation based on authoritative guidelines.
              </p>

              {/* Interactive Eligibility Screening Form */}
              <div style={{
                marginTop: '20px',
                padding: '18px 20px',
                backgroundColor: '#F8FAFC',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                alignItems: 'flex-end'
              }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>
                    Annual Family Income (₹ Lakhs):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-input"
                    value={annualIncome}
                    onChange={e => setAnnualIncome(Number(e.target.value))}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>
                    Food Security / Ration Card:
                  </label>
                  <select
                    className="form-select"
                    value={rationCardType}
                    onChange={e => setRationCardType(e.target.value)}
                  >
                    <option value="White Card">White Card (BPL Food Security)</option>
                    <option value="Pink Card">Pink Card (Above Poverty Line)</option>
                    <option value="None">None / Private Insurance</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>
                    Employment Sector:
                  </label>
                  <select
                    className="form-select"
                    value={employmentSector}
                    onChange={e => setEmploymentSector(e.target.value)}
                  >
                    <option value="Informal / Self-Employed">Informal / Self-Employed</option>
                    <option value="Central Government">Central Government (CGHS)</option>
                    <option value="Formal Private Sector">Formal Private Sector (ESIC / Corporate)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleReevaluateSchemes}
                  className="btn btn-secondary"
                  style={{ height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <RefreshCw size={15} />
                  <span>Update Assessment</span>
                </button>
              </div>
            </div>

            {/* Scheme Cards Grid */}
            <div className="grid-3">
              {schemes.map((match, idx) => (
                <SchemeCard key={idx} match={match} />
              ))}
            </div>

            {/* Statutory Disclaimer Rule: Never guarantee eligibility */}
            <div style={{
              backgroundColor: '#FEF3C7',
              border: '1px solid #F59E0B',
              borderRadius: '10px',
              padding: '14px 18px',
              fontSize: '0.82rem',
              color: '#92400E',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0 }} />
              <div>
                <strong>Statutory Notice:</strong> All scheme eligibility outcomes are indicative based on public rules (Telangana Aarogyasri Trust &amp; NHA PM-JAY). Hospital admission pre-authorization is conducted on-site by Aarogya Mithra / Ayushman Mitra officials. Final approval rests with the respective government authority.
              </div>
            </div>

            {/* Final Navigation & Decision Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowLeft size={16} />
                <span>Back to Hospitals</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('comparison')}
                className="btn btn-primary"
                style={{ padding: '14px 32px', fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <span>Proceed to Final Decision &amp; Comparison</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODALS */}
        {/* ========================================================================= */}
        {costResult && (
          <CostBreakdownModal
            isOpen={isBreakdownOpen}
            onClose={() => setIsBreakdownOpen(false)}
            breakdown={costResult.cost_breakdown}
            treatmentName={selectedTreatmentName}
            minPrice={costResult.overall_min}
            maxPrice={costResult.overall_max}
            priceType={costResult.price_type}
            facilityName={costResult.selected_facility?.name}
          />
        )}

        {selectedFacilityForModal && (
          <HospitalDetailModal
            facility={selectedFacilityForModal}
            onClose={() => setSelectedFacilityForModal(null)}
            onEstimateHere={fac => {
              setSelectedLocality(fac.locality);
              setCurrentStep(3);
              loadDataForJourney(selectedTreatmentId, selectedTreatmentName, fac.city, fac.locality);
            }}
            onBookAppointment={fac => {
              setSelectedFacilityForModal(null);
              setBookingFacility(fac);
            }}
          />
        )}

        {/* Emergency Interrupt Modal */}
        <EmergencyInterruptModal
          isOpen={isEmergencyModalOpen}
          message={emergencyGuidance}
          onDismiss={() => setIsEmergencyModalOpen(false)}
          onProceedAnyway={() => setIsEmergencyModalOpen(false)}
        />

        {/* Printable One-Page Patient Summary Modal */}
        {costResult && (
          <PrintSummaryModal
            isOpen={isPrintOpen}
            onClose={() => setIsPrintOpen(false)}
            costEstimate={costResult}
            facilityName={costResult.selected_facility?.name}
            city={selectedCity}
            state={selectedState}
          />
        )}

        {/* Privacy-Preserving WhatsApp Share Modal */}
        {costResult && (
          <ShareModal
            isOpen={isShareOpen}
            onClose={() => setIsShareOpen(false)}
            treatmentName={selectedTreatmentName}
            minPrice={costResult.overall_min}
            maxPrice={costResult.overall_max}
            facilityName={costResult.selected_facility?.name}
            city={selectedCity}
            state={selectedState}
            priceType={costResult.price_type}
          />
        )}

        {/* Booking Appointment Modal */}
        {bookingFacility && (
          <BookingModal
            isOpen={Boolean(bookingFacility)}
            facility={bookingFacility}
            onClose={() => setBookingFacility(null)}
            treatmentName={selectedTreatmentName}
            matchedSchemeName="Aarogyasri / PM-JAY"
            onViewMyAppointments={() => onNavigateTab('profile')}
          />
        )}

      </div>
    </div>
  );
};
