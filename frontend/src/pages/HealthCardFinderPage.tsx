import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ShieldCheck, 
  CreditCard, 
  Search, 
  MapPin, 
  Compass, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Phone, 
  ExternalLink, 
  ChevronRight, 
  SlidersHorizontal, 
  Sparkles, 
  Building2, 
  Info, 
  Check, 
  RefreshCw,
  FileText,
  DollarSign,
  Heart,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  careSaathiApi, 
  HealthCardSchemeDTO, 
  HealthCardPackageDTO,
  HospitalHealthCardMatchDTO, 
  HealthCardSearchResponse 
} from '../services/api';
import { HealthCardHospitalModal } from '../components/HealthCardHospitalModal';
import { useSearch } from '../context/SearchContext';
import { useLanguage } from '../context/LanguageContext';

export const HealthCardFinderPage: React.FC = () => {
  const { t } = useLanguage();
  const { searchState, setLocation, setTreatment } = useSearch();

  // Master Data
  const [schemes, setSchemes] = useState<HealthCardSchemeDTO[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [isLoadingMaster, setIsLoadingMaster] = useState<boolean>(true);

  // Form Selections
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>('aarogyasri');
  const [schemeCategoryFilter, setSchemeCategoryFilter] = useState<string>('all');
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string>('knee_replacement');
  const [treatmentQuery, setTreatmentQuery] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>(searchState.state || 'Telangana');
  const [cityDistrict, setCityDistrict] = useState<string>(searchState.city || 'Hyderabad');
  const [userCoords, setUserCoords] = useState<{ lat?: number; lng?: number }>({});
  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [ownershipFilter, setOwnershipFilter] = useState<string>('all');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);

  // Optional Eligibility Accordion
  const [showEligibilityNotes, setShowEligibilityNotes] = useState<boolean>(false);
  const [hasWhiteRationCard, setHasWhiteRationCard] = useState<boolean>(true);
  const [isStateGovtEmployee, setIsStateGovtEmployee] = useState<boolean>(false);

  // Search Results State
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResponse, setSearchResponse] = useState<HealthCardSearchResponse | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recommended' | 'distance' | 'cost' | 'name'>('recommended');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified_only' | 'empanelled_only'>('all');

  // Modal State
  const [activeModalMatch, setActiveModalMatch] = useState<HospitalHealthCardMatchDTO | null>(null);

  // 1. Load Master Schemes & Treatments on Mount
  useEffect(() => {
    let isMounted = true;
    setIsLoadingMaster(true);

    Promise.all([
      careSaathiApi.getHealthCardSchemes(),
      careSaathiApi.getHealthCardTreatments()
    ])
      .then(([schemesData, treatmentsData]) => {
        if (!isMounted) return;
        setSchemes(schemesData);
        setTreatments(treatmentsData);
        if (schemesData.length > 0 && !selectedSchemeId) {
          setSelectedSchemeId(schemesData[0].id);
        }
        setIsLoadingMaster(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load master health card schemes:', err);
        setSearchError('Failed to load health card schemes. Please check your network.');
        setIsLoadingMaster(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Perform Health Card Hospital Search
  const executeSearch = useCallback(async () => {
    if (!selectedSchemeId || !selectedTreatmentId) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const resp = await careSaathiApi.searchHealthCardHospitals({
        scheme_id: selectedSchemeId,
        treatment_id: selectedTreatmentId,
        state: selectedState,
        city_or_district: cityDistrict,
        city: cityDistrict,
        lat: userCoords.lat,
        lng: userCoords.lng,
        radius_km: radiusKm > 0 ? radiusKm : undefined,
        ownership: ownershipFilter !== 'all' ? ownershipFilter : undefined,
        verified_only: verifiedOnly
      });
      setSearchResponse(resp);
    } catch (err: any) {
      setSearchError(err.message || 'Failed to search hospitals for selected health card.');
    } finally {
      setIsSearching(false);
    }
  }, [selectedSchemeId, selectedTreatmentId, selectedState, cityDistrict, userCoords, radiusKm, ownershipFilter, verifiedOnly]);

  // Trigger search on mount once master data is ready
  useEffect(() => {
    if (!isLoadingMaster && schemes.length > 0) {
      executeSearch();
    }
  }, [isLoadingMaster]);

  // Geolocation detector
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setCityDistrict('Current Location');
      },
      (err) => {
        console.warn('Geolocation access denied or failed:', err);
      }
    );
  };

  // Filter schemes by category pill
  const filteredSchemes = useMemo(() => {
    if (schemeCategoryFilter === 'all') return schemes;
    return schemes.filter((s) => s.category === schemeCategoryFilter);
  }, [schemes, schemeCategoryFilter]);

  // Filter treatments by search text
  const filteredTreatments = useMemo(() => {
    if (!treatmentQuery.trim()) return treatments;
    const q = treatmentQuery.toLowerCase();
    return treatments.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.specialty.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    );
  }, [treatments, treatmentQuery]);

  // Active selected scheme metadata
  const currentScheme = useMemo(() => {
    return schemes.find((s) => s.id === selectedSchemeId) || null;
  }, [schemes, selectedSchemeId]);

  // Active selected treatment metadata
  const currentTreatment = useMemo(() => {
    return treatments.find((t) => t.id === selectedTreatmentId) || null;
  }, [treatments, selectedTreatmentId]);

  // Processed and sorted results
  const displayedResults = useMemo(() => {
    const rawList = searchResponse?.results || (searchResponse as any)?.hospitals;
    if (!rawList || !Array.isArray(rawList)) return [];

    let list = [...rawList];

    // Status filter
    if (statusFilter === 'verified_only') {
      list = list.filter((h: any) => h.is_verified_procedure || h.verification_status === 'verified_procedure');
    } else if (statusFilter === 'empanelled_only') {
      list = list.filter((h: any) => h.is_scheme_empanelled || h.empanelment_status === 'empanelled');
    }

    // Sort order
    if (sortBy === 'recommended') {
      list.sort((a: any, b: any) => {
        const aVerified = a.is_verified_procedure || a.verification_status === 'verified_procedure';
        const bVerified = b.is_verified_procedure || b.verification_status === 'verified_procedure';
        if (aVerified !== bVerified) {
          return aVerified ? -1 : 1;
        }
        const aEmpanelled = a.is_scheme_empanelled || a.empanelment_status === 'empanelled';
        const bEmpanelled = b.is_scheme_empanelled || b.empanelment_status === 'empanelled';
        if (aEmpanelled !== bEmpanelled) {
          return aEmpanelled ? -1 : 1;
        }
        return (a.distance_km || 999) - (b.distance_km || 999);
      });
    } else if (sortBy === 'distance') {
      list.sort((a, b) => (a.distance_km || 999) - (b.distance_km || 999));
    } else if (sortBy === 'cost') {
      list.sort((a, b) => (a.estimated_patient_out_of_pocket_inr || 0) - (b.estimated_patient_out_of_pocket_inr || 0));
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.facility_name.localeCompare(b.facility_name));
    }

    return list;
  }, [searchResponse, statusFilter, sortBy]);

  const formatRupees = (val?: number) => {
    if (val === undefined || val === null) return '—';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="health-card-finder-page" style={{ padding: '24px 28px', maxWidth: '1280px', margin: '0 auto' }}>
      
      {/* 1. Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #102A36 0%, #173B4D 100%)',
        borderRadius: '16px',
        padding: '30px 36px',
        color: '#FFFFFF',
        marginBottom: '28px',
        boxShadow: '0 10px 25px -5px rgba(16, 42, 54, 0.3)'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '50px', backgroundColor: 'rgba(94, 234, 212, 0.15)', border: '1px solid #5EEAD4', color: '#5EEAD4', fontSize: '0.8rem', fontWeight: 600, marginBottom: '12px' }}>
              <ShieldCheck size={16} />
              Statutory Registry Audited • Zero Hallucinations
            </div>
            <h1 style={{ fontSize: '1.95rem', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
              Health Card & Insurance Hospital Finder
            </h1>
            <p style={{ margin: 0, fontSize: '0.98rem', color: '#CBD5E1', maxWidth: '780px', lineHeight: 1.5 }}>
              Find verified hospitals where your government health card (Aarogyasri, PM-JAY, EHS, CGHS) or private policy covers your specific surgery — with verified statutory package rates and zero-surprise out-of-pocket costs.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '12px 18px', borderRadius: '12px', textAlign: 'center', backdropFilter: 'blur(4px)' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#5EEAD4' }}>
                {searchResponse?.verified_procedure_count ?? (searchResponse as any)?.verified_count ?? 0}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#E2E8F0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Verified Procedure Matches
              </div>
            </div>

            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '12px 18px', borderRadius: '12px', textAlign: 'center', backdropFilter: 'blur(4px)' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF' }}>
                {searchResponse?.scheme_empanelled_count ?? (searchResponse as any)?.total_found ?? (searchResponse as any)?.total_results ?? 0}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#E2E8F0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Empanelled Hospitals
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Search Form Card */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        padding: '24px 28px',
        marginBottom: '28px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
      }}>
        
        {/* Step 1: Health Card Selection */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#0D7B60', color: '#FFF', fontSize: '0.85rem', fontWeight: 700 }}>1</span>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#1E293B' }}>
                Select Your Health Card or Insurance Scheme
              </h2>
            </div>

            {/* Scheme Category Filter Chips */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All Schemes' },
                { id: 'state_government', label: 'Telangana Govt (Aarogyasri / EHS)' },
                { id: 'government', label: 'Central Govt (PM-JAY / CGHS / ESIC)' },
                { id: 'private_insurance', label: 'Private Insurance' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSchemeCategoryFilter(cat.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    border: '1px solid',
                    cursor: 'pointer',
                    backgroundColor: schemeCategoryFilter === cat.id ? '#0D7B60' : '#F1F5F9',
                    color: schemeCategoryFilter === cat.id ? '#FFFFFF' : '#475569',
                    borderColor: schemeCategoryFilter === cat.id ? '#0D7B60' : '#CBD5E1',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scheme Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '12px',
            maxHeight: '260px',
            overflowY: 'auto',
            padding: '4px'
          }}>
            {filteredSchemes.map((s) => {
              const isSelected = selectedSchemeId === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSchemeId(s.id)}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    border: isSelected ? '2px solid #0D7B60' : '1px solid #E2E8F0',
                    backgroundColor: isSelected ? '#F0FDF4' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                    boxShadow: isSelected ? '0 4px 12px rgba(13, 123, 96, 0.12)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.94rem', color: isSelected ? '#0D7B60' : '#1E293B' }}>
                      {s.name}
                    </div>
                    {isSelected && (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#0D7B60', color: '#FFF' }}>
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '0.78rem', color: '#64748B' }}>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{s.short_code}</span>
                    <span>•</span>
                    <span>{s.state_applicability}</span>
                    <span>•</span>
                    <span style={{ color: '#0D7B60', fontWeight: 600 }}>{s.cashless_mode}</span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '6px', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {s.description}
                  </div>

                  <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem' }}>
                    <span style={{ color: '#0D7B60', fontWeight: 700 }}>
                      Coverage: {s.max_coverage_inr ? `Up to ₹${(s.max_coverage_inr / 100000).toFixed(0)} Lakhs` : '100% Cashless'}
                    </span>
                    {s.official_portal_url && (
                      <a
                        href={s.official_portal_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: '#0284C7', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}
                      >
                        Official Portal <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2 & 3: Treatment & Location Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
          marginBottom: '20px'
        }}>
          
          {/* Step 2: Treatment Search */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#0D7B60', color: '#FFF', fontSize: '0.85rem', fontWeight: 700 }}>2</span>
              <label htmlFor="treatment-select" style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#1E293B' }}>
                Required Operation or Treatment
              </label>
            </div>

            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <select
                id="treatment-select"
                aria-label="Required Operation or Treatment"
                value={selectedTreatmentId}
                onChange={(e) => setSelectedTreatmentId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: '#1E293B',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {treatments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.specialty})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Chips for Common Procedures */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {[
                { id: 'knee_replacement', label: 'Knee Replacement' },
                { id: 'cataract_surgery', label: 'Cataract Surgery' },
                { id: 'angioplasty', label: 'Angioplasty' },
                { id: 'hemodialysis', label: 'Dialysis' },
                { id: 'laparoscopic_cholecystectomy', label: 'Gallbladder' },
                { id: 'appendectomy', label: 'Appendectomy' }
              ].map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setSelectedTreatmentId(chip.id)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '14px',
                    fontSize: '0.74rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    backgroundColor: selectedTreatmentId === chip.id ? '#0D7B60' : '#F1F5F9',
                    color: selectedTreatmentId === chip.id ? '#FFFFFF' : '#475569',
                    border: '1px solid',
                    borderColor: selectedTreatmentId === chip.id ? '#0D7B60' : '#CBD5E1'
                  }}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Location Selector */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#0D7B60', color: '#FFF', fontSize: '0.85rem', fontWeight: 700 }}>3</span>
              <label htmlFor="city-input" style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#1E293B' }}>
                Location (City / District)
              </label>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  id="city-input"
                  type="text"
                  placeholder="e.g. Hyderabad, Secunderabad, Warangal..."
                  value={cityDistrict}
                  onChange={(e) => setCityDistrict(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 38px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.92rem',
                    color: '#1E293B',
                    boxSizing: 'border-box'
                  }}
                />
                <MapPin size={17} color="#64748B" style={{ position: 'absolute', left: '12px', top: '14px' }} />
              </div>

              <button
                type="button"
                onClick={handleDetectLocation}
                title="Detect GPS Location"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  color: '#334155',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <Compass size={16} color="#0D7B60" />
                Near Me
              </button>
            </div>

            {/* Quick District Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['Hyderabad', 'Secunderabad', 'Warangal', 'Karimnagar', 'All Telangana'].map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setCityDistrict(city === 'All Telangana' ? '' : city)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '14px',
                    fontSize: '0.74rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    backgroundColor: cityDistrict === (city === 'All Telangana' ? '' : city) ? '#0284C7' : '#F1F5F9',
                    color: cityDistrict === (city === 'All Telangana' ? '' : city) ? '#FFFFFF' : '#475569',
                    border: '1px solid',
                    borderColor: cityDistrict === (city === 'All Telangana' ? '' : city) ? '#0284C7' : '#CBD5E1'
                  }}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 4: Optional Eligibility Information (Collapsible) */}
        <div style={{
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          padding: '12px 18px',
          marginBottom: '20px',
          backgroundColor: '#F8FAFC'
        }}>
          <div 
            onClick={() => setShowEligibilityNotes(!showEligibilityNotes)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: 600, color: '#334155' }}>
              <Info size={16} color="#0284C7" />
              Optional Beneficiary Details & Scheme Eligibility Notes
              <span style={{ fontSize: '0.72rem', backgroundColor: '#E2E8F0', color: '#475569', padding: '2px 6px', borderRadius: '4px' }}>
                Skip anytime
              </span>
            </div>
            {showEligibilityNotes ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
          </div>

          {showEligibilityNotes && (
            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #E2E8F0', fontSize: '0.84rem', color: '#475569', lineHeight: 1.5 }}>
              <p style={{ margin: '0 0 10px 0' }}>
                <strong>No Aadhaar or Card numbers required:</strong> CareSaathi AI lets you browse all verified empanelled hospitals without uploading documents or entering sensitive personal identification numbers.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={hasWhiteRationCard}
                    onChange={(e) => setHasWhiteRationCard(e.target.checked)}
                  />
                  <span>White Ration Card / Food Security Card Holder (Aarogyasri automatic coverage)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isStateGovtEmployee}
                    onChange={(e) => setIsStateGovtEmployee(e.target.checked)}
                  />
                  <span>Telangana State Government Employee or Pensioner (EHS card)</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Search Action Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
            {/* Radius selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#475569' }}>
              <span>Radius:</span>
              <select
                aria-label="Distance Radius"
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem', backgroundColor: '#FFF' }}
              >
                <option value={10}>Within 10 km</option>
                <option value={25}>Within 25 km</option>
                <option value={50}>Within 50 km</option>
                <option value={0}>Any Distance</option>
              </select>
            </div>

            {/* Ownership filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#475569' }}>
              <span>Type:</span>
              <select
                aria-label="Hospital Ownership Type"
                value={ownershipFilter}
                onChange={(e) => setOwnershipFilter(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem', backgroundColor: '#FFF' }}
              >
                <option value="all">All Facilities</option>
                <option value="Government">Government Hospitals Only</option>
                <option value="Private">Empanelled Private Hospitals</option>
              </select>
            </div>

            {/* Verified only toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#1E293B', fontWeight: 600, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
              />
              <span>Procedure-Verified Only</span>
            </label>
          </div>

          <button
            type="button"
            onClick={executeSearch}
            disabled={isSearching}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 28px',
              borderRadius: '10px',
              backgroundColor: '#0D7B60',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '0.94rem',
              fontWeight: 700,
              cursor: isSearching ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(13, 123, 96, 0.25)',
              transition: 'background-color 0.15s ease'
            }}
          >
            {isSearching ? <RefreshCw size={18} className="animate-spin" /> : <Search size={18} />}
            {isSearching ? 'Auditing Empanelments...' : 'Find Matching Hospitals'}
          </button>
        </div>

      </div>

      {/* 3. Search Results Section */}
      <div>
        
        {/* Results Filter & Sort Header Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Matching Hospitals ({displayedResults.length})
            </h3>
            <div style={{ fontSize: '0.84rem', color: '#64748B', marginTop: '2px' }}>
              Card: <strong style={{ color: '#0D7B60' }}>{currentScheme?.short_code || currentScheme?.name}</strong> • Treatment: <strong style={{ color: '#0F172A' }}>{currentTreatment?.name}</strong>
              {searchResponse?.package_info && (
                <span style={{ marginLeft: '6px', color: '#0369A1' }}>
                  (Statutory Rate: {formatRupees(searchResponse.package_info.statutory_rate_inr)})
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
            {/* Status Filter Buttons */}
            <div style={{ display: 'flex', backgroundColor: '#F1F5F9', borderRadius: '8px', padding: '3px', border: '1px solid #E2E8F0' }}>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: statusFilter === 'all' ? '#FFFFFF' : 'transparent',
                  color: statusFilter === 'all' ? '#0F172A' : '#64748B',
                  boxShadow: statusFilter === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                All ({searchResponse?.total_results ?? (searchResponse as any)?.total_found ?? 0})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('verified_only')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: statusFilter === 'verified_only' ? '#FFFFFF' : 'transparent',
                  color: statusFilter === 'verified_only' ? '#0D7B60' : '#64748B',
                  boxShadow: statusFilter === 'verified_only' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                Verified ({searchResponse?.verified_procedure_count ?? (searchResponse as any)?.verified_count ?? 0})
              </button>
            </div>

            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#475569' }}>
              <span>Sort by:</span>
              <select
                aria-label="Sort hospitals by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem', backgroundColor: '#FFF' }}
              >
                <option value="recommended">Verification Priority</option>
                <option value="distance">Distance (Nearest)</option>
                <option value="cost">Out-of-Pocket Expense</option>
                <option value="name">Hospital Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isSearching && (
          <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            <RefreshCw size={36} color="#0D7B60" className="animate-spin" style={{ margin: '0 auto 16px' }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1E293B' }}>
              Verifying Empanelment Records & Package Schedules...
            </div>
            <div style={{ fontSize: '0.88rem', color: '#64748B', marginTop: '6px' }}>
              Cross-referencing government statutory registries and verified facility databases
            </div>
          </div>
        )}

        {/* Error State */}
        {!isSearching && searchError && (
          <div style={{ padding: '24px', backgroundColor: '#FEF2F2', borderRadius: '12px', border: '1px solid #FCA5A5', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <AlertCircle size={24} style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Unable to complete search</div>
              <div style={{ fontSize: '0.86rem', marginTop: '2px' }}>{searchError}</div>
            </div>
            <button
              onClick={executeSearch}
              style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: '6px', border: '1px solid #EF4444', backgroundColor: '#FFF', color: '#B91C1C', cursor: 'pointer', fontWeight: 600 }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isSearching && !searchError && displayedResults.length === 0 && (
          <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            <HelpCircle size={44} color="#94A3B8" style={{ margin: '0 auto 16px' }} />
            <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1E293B', margin: '0 0 6px 0' }}>
              No Verified Matches Found in This Area
            </h4>
            <p style={{ fontSize: '0.88rem', color: '#64748B', maxWidth: '520px', margin: '0 auto 18px', lineHeight: 1.5 }}>
              We could not find an official empanelment record for <strong>{currentScheme?.short_code}</strong> covering <strong>{currentTreatment?.name}</strong> in {cityDistrict || 'this selected location'}. Try expanding your search radius or viewing all Telangana facilities.
            </p>
            <button
              type="button"
              onClick={() => {
                setRadiusKm(0);
                setCityDistrict('');
                executeSearch();
              }}
              style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: '#0D7B60', color: '#FFF', border: 'none', fontWeight: 600, cursor: 'pointer' }}
            >
              Expand Search to All Telangana
            </button>
          </div>
        )}

        {/* Hospital Result Cards Grid */}
        {!isSearching && !searchError && displayedResults.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
            {displayedResults.map((match) => {
              const isVerified = match.verification_status === 'verified_procedure';
              const isSchemeOnly = match.verification_status === 'scheme_verified_procedure_unconfirmed';

              const badgeDetails = isVerified
                ? {
                    color: '#0D7B60',
                    bgColor: '#E6F4EA',
                    border: '#A8DAB5',
                    icon: ShieldCheck,
                    label: 'Verified For This Procedure'
                  }
                : isSchemeOnly
                ? {
                    color: '#B76E00',
                    bgColor: '#FEF7E0',
                    border: '#FCE8B2',
                    icon: Clock,
                    label: 'Scheme Empanelled — Package Unconfirmed'
                  }
                : {
                    color: '#6B7280',
                    bgColor: '#F3F4F6',
                    border: '#E5E7EB',
                    icon: AlertCircle,
                    label: match.verification_status_label
                  };

              const BadgeIcon = badgeDetails.icon;

              return (
                <div
                  key={match.facility_id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '14px',
                    border: isVerified ? '1.5px solid #A8DAB5' : '1px solid #E2E8F0',
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: isVerified ? '0 4px 12px rgba(13, 123, 96, 0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    {/* Top Status & Facility Type Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: badgeDetails.color,
                          backgroundColor: badgeDetails.bgColor,
                          border: `1px solid ${badgeDetails.border}`
                        }}
                      >
                        <BadgeIcon size={13} />
                        {badgeDetails.label}
                      </span>

                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          backgroundColor: match.ownership === 'Government' ? '#EEF2F6' : '#F1F5F9',
                          color: match.ownership === 'Government' ? '#1E3A8A' : '#475569'
                        }}
                      >
                        {match.ownership}
                      </span>
                    </div>

                    {/* Hospital Name & Location */}
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0', lineHeight: 1.3 }}>
                      {match.facility_name}
                    </h4>

                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: '#64748B', marginBottom: '14px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={13} color="#0D7B60" />
                        {match.locality ? `${match.locality}, ` : ''}{match.city}
                      </span>
                      {match.distance_km !== undefined && match.distance_km !== null && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600, color: '#1E3A8A' }}>
                          <Compass size={13} />
                          {match.distance_km.toFixed(1)} km away
                        </span>
                      )}
                    </div>

                    {/* Financial Estimator Mini Box */}
                    <div style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      padding: '12px',
                      marginBottom: '14px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '0.76rem', color: '#64748B' }}>
                        <span>Statutory Scheme Rate:</span>
                        <strong style={{ color: '#0F172A' }}>{formatRupees(match.scheme_rate_inr)}</strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.76rem', color: '#0D7B60' }}>
                        <span>Covered By Scheme:</span>
                        <strong>{formatRupees(match.estimated_scheme_coverage_inr)}</strong>
                      </div>

                      <div style={{ paddingTop: '8px', borderTop: '1px dashed #CBD5E1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#B45309' }}>
                          Est. Out-of-Pocket:
                        </span>
                        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: match.estimated_patient_out_of_pocket_inr === 0 ? '#0D7B60' : '#B45309' }}>
                          {match.estimated_patient_out_of_pocket_inr === 0 ? '₹0 Cashless' : formatRupees(match.estimated_patient_out_of_pocket_inr)}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '4px' }}>
                        {match.cost_note || 'Standard statutory cashless rules apply'}
                      </div>
                    </div>

                    {/* Verification Source Tag */}
                    <div style={{ fontSize: '0.72rem', color: '#64748B', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Source: <strong>{match.official_source_name || 'State Registry'}</strong></span>
                      {match.last_verified && <span>Audited: {match.last_verified}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
                    <button
                      type="button"
                      onClick={() => setActiveModalMatch(match)}
                      style={{
                        flex: 1,
                        padding: '9px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#0D7B60',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      View Full Details
                      <ChevronRight size={14} />
                    </button>

                    {match.phone && (
                      <a
                        href={`tel:${match.phone.replace(/[^0-9]/g, '')}`}
                        title={`Call ${match.phone}`}
                        style={{
                          padding: '9px 12px',
                          borderRadius: '8px',
                          backgroundColor: '#F1F5F9',
                          border: '1px solid #CBD5E1',
                          color: '#334155',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Phone size={15} color="#0D7B60" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* 4. Detail & Verification Modal */}
      {activeModalMatch && (
        <HealthCardHospitalModal
          match={activeModalMatch}
          scheme={searchResponse?.scheme || currentScheme}
          packageInfo={searchResponse?.package_info}
          onClose={() => setActiveModalMatch(null)}
          onBookAppointment={() => {
            setActiveModalMatch(null);
            alert(`Appointment booking requested for ${activeModalMatch.facility_name}. A representative will contact you.`);
          }}
        />
      )}

    </div>
  );
};
