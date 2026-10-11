import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useSearch } from '../context/SearchContext';
import { 
  DollarSign, 
  Building2, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  HelpCircle, 
  Layers, 
  RefreshCw, 
  ArrowRight,
  ShieldAlert,
  Sliders,
  Bed,
  Printer,
  Share2,
  MessageSquare,
  FileText,
  ShieldCheck,
  ExternalLink,
  Compass,
  PhoneCall
} from 'lucide-react';
import { api, CostEstimateDTO, TreatmentDTO, FacilityDTO } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import './CostEstimatorPage.css';
import { AnimatedRupeeCounter } from '../components/AnimatedRupeeCounter';
import { FloatingRupeeBackground } from '../components/FloatingRupeeBackground';
import { CostBreakdownModal } from '../components/CostBreakdownModal';
import { OutOfPocketWaterfallChart } from '../components/OutOfPocketWaterfallChart';
import { ItemizedComponentsTable } from '../components/ItemizedComponentsTable';
import { ChecklistsCard } from '../components/ChecklistsCard';
import { TierComparisonView } from '../components/TierComparisonView';
import { PrintSummaryModal } from '../components/PrintSummaryModal';
import { CostBreakdownDonut } from '../components/CostBreakdownDonut';
import { ShareModal } from '../components/ShareModal';
import { PanIndiaLocationPicker } from '../components/PanIndiaLocationPicker';
import { HealthcareCostRiskAlert } from '../components/HealthcareCostRiskAlert';
import { MedicineCostEstimator } from '../components/MedicineCostEstimator';
import { CombinedExpenseSummary } from '../components/CombinedExpenseSummary';
import { PatientSavingsPlan } from '../components/PatientSavingsPlan';
import { MedicineCourseEstimateDTO } from '../services/api';

export const CostEstimatorPage: React.FC = () => {
  const { t } = useLanguage();
  const { searchState, setTreatment, setLocation } = useSearch();

  // Mode: 'location' or 'hospital'
  const [workflowMode, setWorkflowMode] = useState<'location' | 'hospital'>('location');
  const [treatmentsList, setTreatmentsList] = useState<TreatmentDTO[]>([]);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string>(searchState.treatmentId || 'knee_replacement');
  const [city, setCity] = useState<string>(searchState.city || 'Hyderabad');
  const [stateName, setStateName] = useState<string>(searchState.state || 'Telangana');
  const [locality, setLocality] = useState<string>(searchState.locality || '');

  useEffect(() => {
    if (searchState.city) setCity(searchState.city);
    if (searchState.state) setStateName(searchState.state);
    if (searchState.locality) setLocality(searchState.locality);
  }, [searchState.city, searchState.state, searchState.locality]);
  const [hospitalName, setHospitalName] = useState<string>(searchState.hospitalName || 'NIMS');
  const [ownershipPref, setOwnershipPref] = useState<string>('All');
  const [roomCategory, setRoomCategory] = useState<string>('Twin Sharing / Semi-Private');
  const [budgetLimit, setBudgetLimit] = useState<number>(0);

  // Medicine Cost Estimator State
  const [medicineCostMin, setMedicineCostMin] = useState<number>(0);
  const [medicineCostMax, setMedicineCostMax] = useState<number>(0);
  const [medicineData, setMedicineData] = useState<MedicineCourseEstimateDTO | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [estimateResult, setEstimateResult] = useState<CostEstimateDTO | null>(null);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState<boolean>(false);
  const [isPrintOpen, setIsPrintOpen] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);

  useEffect(() => {
    // Load catalogue
    api.getTreatments().then(data => {
      setTreatmentsList(data);
    }).catch(console.error);

    // Initial estimate
    runEstimate();
  }, [workflowMode]);

  const runEstimate = async () => {
    setIsLoading(true);
    setEstimateError(null);
    try {
      const selectedT = treatmentsList.find(t => t.id === selectedTreatmentId);
      const treatmentName = selectedT ? selectedT.name : "Total Knee Replacement (TKR)";

      const res = await api.estimateCost({
        treatment: treatmentName,
        city: city,
        locality: locality || undefined,
        hospital_name: workflowMode === 'hospital' ? hospitalName : undefined,
        ownership_preference: ownershipPref !== 'All' ? ownershipPref : undefined,
        room_category_preference: roomCategory,
        budget_limit: budgetLimit > 0 ? budgetLimit : undefined
      });

      setEstimateResult(res);
      setTreatment(selectedTreatmentId, treatmentName);
    } catch (err: any) {
      console.error("Cost estimate failed", err);
      setEstimateError(err?.message || "Cost estimation unavailable for this procedure. Please choose a treatment from our verified catalogue.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTreatmentChange = (tId: string) => {
    setSelectedTreatmentId(tId);
  };

  const goToTab = (tabId: string) => {
    const sidebar = document.getElementById('care-saathi-sidebar');
    if (sidebar) {
      const buttons = sidebar.querySelectorAll('button.nav-item-btn');
      const indexMap: Record<string, number> = {
        landing: 0,
        dashboard: 1,
        estimate: 2,
        hospitals: 3,
        schemes: 4,
        methodology: 5
      };
      const idx = indexMap[tabId];
      if (idx !== undefined && buttons[idx]) {
        (buttons[idx] as HTMLButtonElement).click();
        return;
      }
    }
    window.history.pushState(null, '', `/${tabId}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const openChat = () => {
    const btn = document.querySelector('button[title*="CareSaathi WhatsApp-style Assistant"]') as HTMLButtonElement;
    if (btn) {
      btn.click();
    }
  };

  const scrollToForm = () => {
    const el = document.getElementById('treatment-select-control');
    if (el) {
      el.focus();
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="section cost-estimator-page-root" style={{ paddingTop: '24px', paddingBottom: '120px' }}>
      <div className="cost-estimator-results-container">
        {/* Page Title with Floating Rupee Particles */}
        <motion.div 
          className="cost-estimator-hero-banner"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <FloatingRupeeBackground count={6} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="badge badge-teal" style={{ marginBottom: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#D6A64F', fontWeight: 800 }}>₹</span>
              <span>Evidence-Based Healthcare Pricing Engine</span>
            </div>
            <h1 style={{ fontSize: '2.2rem', color: 'var(--color-navy)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
              Healthcare Cost Estimator
            </h1>
            <p style={{ color: 'var(--color-text-grey)', fontSize: '1.02rem', maxWidth: '780px', margin: 0, lineHeight: 1.5 }}>
              Transparent indicative price ranges calculated from published hospital tariffs, CGHS gazettes, and private reference schedules in Indian cities.
            </p>
          </div>
        </motion.div>

        {/* Workflow Switcher Tabs with Micro-Animations */}
        <div style={{
          display: 'flex',
          gap: '8px',
          backgroundColor: 'var(--color-white)',
          padding: '6px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          width: 'fit-content',
          marginBottom: '8px',
          boxShadow: '0 2px 8px rgba(23, 107, 91, 0.04)'
        }}>
          <motion.button
            onClick={() => setWorkflowMode('location')}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            className={`cost-estimator-workflow-tab ${workflowMode === 'location' ? 'active' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: workflowMode === 'location' ? 'var(--color-teal)' : 'transparent',
              color: workflowMode === 'location' ? 'white' : 'var(--color-navy)',
              fontWeight: 600,
              fontSize: '0.92rem',
              cursor: 'pointer'
            }}
          >
            <MapPin size={16} />
            <span>Workflow B: Location-Based Estimation</span>
          </motion.button>
          <motion.button
            onClick={() => setWorkflowMode('hospital')}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            className={`cost-estimator-workflow-tab ${workflowMode === 'hospital' ? 'active' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: workflowMode === 'hospital' ? 'var(--color-teal)' : 'transparent',
              color: workflowMode === 'hospital' ? 'white' : 'var(--color-navy)',
              fontWeight: 600,
              fontSize: '0.92rem',
              cursor: 'pointer'
            }}
          >
            <Building2 size={16} />
            <span>Workflow A: Hospital-Specific Tariff</span>
          </motion.button>
        </div>

        {/* Error Banner */}
        {estimateError && !isLoading && (
          <div style={{
            padding: '16px 20px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '12px',
            color: '#991B1B',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={20} color="#DC2626" />
              <div>
                <strong style={{ display: 'block', fontSize: '0.9rem' }}>Cost Estimation Notice</strong>
                <span style={{ fontSize: '0.84rem' }}>{estimateError}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={runEstimate}
              className="btn btn-secondary btn-sm"
              style={{ borderColor: '#F87171', color: '#991B1B', fontWeight: 600 }}
            >
              <RefreshCw size={13} style={{ marginRight: '6px' }} />
              Retry Estimation
            </button>
          </div>
        )}

        {/* "Your Estimate" Full-Width Summary Card */}
        {estimateResult && (
          <div className="cost-estimator-summary-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(226, 232, 240, 0.8)', paddingBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-teal, #329B89)' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-teal-dark, #176B5B)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Your Estimate
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-text-grey, #64748B)', fontWeight: 500 }}>
                  Active Query
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span className="badge badge-teal" style={{ fontSize: '0.74rem', padding: '3px 8px' }}>
                  {estimateResult.workflow || 'Location-Based'}
                </span>
                <span className="badge badge-navy" style={{ fontSize: '0.74rem', padding: '3px 8px' }}>
                  {estimateResult.confidence || 'High'} Confidence
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h4 style={{ fontSize: '1.25rem', color: 'var(--color-navy, #12304A)', margin: '0 0 6px 0', lineHeight: 1.3, fontWeight: 700 }}>
                  {estimateResult.canonical_treatment?.name || estimateResult.query_treatment || "Total Knee Replacement (TKR)"}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.86rem', color: 'var(--color-text-grey, #64748B)', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="var(--color-teal, #329B89)" />
                    <span>{city}{stateName ? `, ${stateName}` : ''}{locality ? ` (${locality})` : ''}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 size={14} color="var(--color-teal, #329B89)" />
                    <span>
                      {workflowMode === 'hospital'
                        ? `Hospital: ${hospitalName}`
                        : `${ownershipPref !== 'All' ? ownershipPref : 'Govt & Private Tiers'} • ${roomCategory}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={scrollToForm}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(50, 155, 137, 0.08)',
                    border: '1.5px solid var(--color-teal, #329B89)',
                    color: 'var(--color-teal-dark, #176B5B)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  <Sliders size={14} />
                  <span>Edit Inputs</span>
                </button>
                <button
                  type="button"
                  onClick={() => goToTab('hospitals')}
                  className="cost-estimator-quick-nav-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#F0F9F8',
                    border: '1px solid #CCECE6',
                    color: '#176B5B',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  <Building2 size={14} />
                  <span>Find Hospitals</span>
                </button>
                <button
                  type="button"
                  onClick={() => goToTab('schemes')}
                  className="cost-estimator-quick-nav-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    color: '#1E293B',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  <FileText size={14} />
                  <span>Financial Support</span>
                </button>
                <button
                  type="button"
                  onClick={openChat}
                  className="cost-estimator-quick-nav-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#E8F5EF',
                    border: '1px solid #A7F3D0',
                    color: '#065F46',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  <MessageSquare size={14} color="#059669" />
                  <span>Ask CareSaathi</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid #E2E8F0', paddingTop: '10px', fontSize: '0.74rem', color: 'var(--color-text-grey, #64748B)' }}>
              <span>Benchmarks computed from published statutory CGHS/state schedules and empanelled hospital reference tariffs.</span>
              <span>Estimates are informational and not a quotation. Always confirm tariffs directly with empanelled hospital desks.</span>
            </div>
          </div>
        )}

        {/* Controls Form Card */}
        <div id="cost-estimator-controls-form" className="card cost-estimator-card-elevation">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '16px', color: 'var(--color-navy)' }}>
                {workflowMode === 'location' ? "Select Procedure & Location Parameters" : "Select Procedure & Hospital Name"}
              </h3>

              {/* Treatment Selector */}
              <div className="form-group">
                <label className="form-label">Treatment or Diagnostic Procedure:</label>
                <select
                  id="treatment-select-control"
                  className="form-select cost-estimator-select"
                  value={selectedTreatmentId}
                  onChange={e => handleTreatmentChange(e.target.value)}
                >
                  {treatmentsList.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Workflow A: Hospital Name Input */}
              {workflowMode === 'hospital' && (
                <div className="form-group">
                  <label className="form-label">Hospital Name:</label>
                  <input
                    type="text"
                    className="form-input cost-estimator-input"
                    placeholder="e.g. NIMS, Apollo Health City, Gandhi Hospital, Yashoda..."
                    value={hospitalName}
                    onChange={e => setHospitalName(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-grey)' }}>Quick select:</span>
                    {['NIMS', 'Apollo Health City', 'Gandhi Hospital', 'Yashoda Hospitals', 'LVPEI'].map(h => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setHospitalName(h)}
                        className="cost-estimator-quick-chip"
                        style={{
                          background: 'var(--color-light-blue)',
                          border: '1px solid transparent',
                          borderRadius: 'var(--radius-sm)',
                          padding: '2px 8px',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Location Selection (Pan-India) */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Location (Pan-India):</label>
                <PanIndiaLocationPicker
                  compact={true}
                  showPresets={true}
                  onLocationSelect={(loc) => {
                    setCity(loc.city);
                    setStateName(loc.state);
                    setLocality(loc.district && loc.district !== loc.city ? loc.district : '');
                    setTimeout(runEstimate, 100);
                  }}
                />
              </div>

              {/* Ownership Preference (Location Workflow) */}
              {workflowMode === 'location' && (
                <div className="form-group">
                  <label className="form-label">Healthcare Facility Ownership:</label>
                  <select className="form-select cost-estimator-select" value={ownershipPref} onChange={e => setOwnershipPref(e.target.value)}>
                    <option value="All">All Categories (Govt, Charitable & Private)</option>
                    <option value="Government">Government Hospitals (Free / Subsidized)</option>
                    <option value="Charitable/Trust">Charitable / Trust Hospitals (Non-profit)</option>
                    <option value="Private">Private Multi-Specialty</option>
                  </select>
                </div>
              )}

              {/* Ward / Room Category Preference */}
              <div className="form-group">
                <label className="form-label">Room / Ward Category:</label>
                <select className="form-select cost-estimator-select" value={roomCategory} onChange={e => setRoomCategory(e.target.value)}>
                  <option value="General Ward">General Ward (Standard Economy)</option>
                  <option value="Twin Sharing / Semi-Private">Twin Sharing / Semi-Private (2 Beds)</option>
                  <option value="Single Deluxe Room">Single Deluxe Private Room</option>
                </select>
              </div>

              {/* Submit Button with Animated Micro-interactions */}
              <motion.button
                onClick={runEstimate}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                className="btn btn-primary cost-estimator-calc-btn"
                style={{ width: '100%', marginTop: '8px' }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Computing Transparent Estimate...</span>
                  </>
                ) : (
                  <>
                    <DollarSign size={18} />
                    <span>Calculate Indicative Estimate</span>
                  </>
                )}
              </motion.button>
            </div>

            {estimateResult ? (
              <>
                {/* 1. Healthcare Cost Risk Alert Component */}
                <HealthcareCostRiskAlert
                  minTreatmentCost={estimateResult.overall_min}
                  maxTreatmentCost={estimateResult.overall_max}
                  estimatedMedicineCost={medicineCostMin || (estimateResult.cost_breakdown?.medicines_and_consumables)}
                  estimatedDiagnosticCost={estimateResult.cost_breakdown?.diagnostics_and_lab}
                  potentialAdditionalExpenses={5000}
                  userBudget={budgetLimit}
                  confidence={estimateResult.confidence}
                  priceType={estimateResult.price_type}
                  treatmentName={estimateResult.canonical_treatment?.name || estimateResult.query_treatment}
                  onBudgetChange={(b) => setBudgetLimit(b)}
                />

                {/* 2. Main Estimate Result Card */}
                <div className="card cost-estimator-card-elevation" style={{
                  background: 'var(--color-white)',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-md)'
                }}>
                  {/* Result Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span className="badge badge-teal">{estimateResult.workflow}</span>
                        <span className="badge badge-navy">{estimateResult.confidence} Confidence</span>
                      </div>
                      <h3 style={{ fontSize: '1.4rem', color: 'var(--color-navy)' }}>
                        {estimateResult.canonical_treatment?.name || estimateResult.query_treatment}
                      </h3>
                      {estimateResult.selected_facility && (
                        <p style={{ fontSize: '0.88rem', color: 'var(--color-teal-dark)', fontWeight: 600 }}>
                          Facility: {estimateResult.selected_facility.name} ({estimateResult.selected_facility.ownership})
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Main Estimated Range Box with Faint Rupee Watermark (No clipping) */}
                  <div className="cost-estimator-range-box" style={{ marginBottom: '18px', position: 'relative', overflow: 'hidden' }}>
                    {/* Faint ₹ watermark placed fully inside top-right corner, opacity ~0.08, not overlapping text */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '16px',
                        fontSize: '4.8rem',
                        fontWeight: 800,
                        color: 'var(--color-navy, #12304A)',
                        opacity: 0.08,
                        lineHeight: 1,
                        pointerEvents: 'none',
                        userSelect: 'none',
                        zIndex: 0
                      }}
                      aria-hidden="true"
                    >
                      ₹
                    </div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-grey)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Estimated Indicative Cost (INR)</span>
                        <span style={{ color: '#D6A64F', fontSize: '0.9rem' }}>✦</span>
                      </div>

                      {/* Tidy cost display without awkward wrap */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          flexWrap: 'wrap',
                          gap: '12px 18px',
                          marginTop: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-grey, #64748B)', fontWeight: 700 }}>
                            Minimum
                          </span>
                          <span style={{ fontSize: 'clamp(1.5rem, 2.4vw, 2.25rem)', fontWeight: 800, color: 'var(--color-navy)', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                            <AnimatedRupeeCounter 
                              value={estimateResult.overall_min} 
                              freeSubsidizedText="₹0 (Free / Subsidized)"
                            />
                          </span>
                        </div>

                        <span style={{ fontSize: '1.2rem', color: 'var(--color-text-grey, #94A3B8)', fontWeight: 400, alignSelf: 'center', paddingBottom: '4px' }}>
                          to
                        </span>

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-grey, #64748B)', fontWeight: 700 }}>
                            Maximum
                          </span>
                          <span style={{ fontSize: 'clamp(1.5rem, 2.4vw, 2.25rem)', fontWeight: 800, color: 'var(--color-navy)', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                            <AnimatedRupeeCounter 
                              value={estimateResult.overall_max} 
                            />
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--color-teal-dark)', fontWeight: 600, marginTop: '8px' }}>
                        <CheckCircle2 size={16} />
                        <span>Price Type: {estimateResult.price_type}</span>
                      </div>
                    </div>
                  </div>

                  {/* Evidence & Confidence Reason */}
                  <div style={{
                    backgroundColor: 'var(--color-light-blue)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    border: '1px solid #d2e4f3',
                    marginBottom: '18px',
                    fontSize: '0.85rem'
                  }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-navy)', marginBottom: '4px' }}>
                      Methodology & Evidence Source:
                    </div>
                    <p style={{ color: 'var(--color-navy)', margin: 0 }}>
                      {estimateResult.confidence_explanation}
                    </p>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-grey)', marginTop: '6px' }}>
                      Data audit freshness: {estimateResult.data_freshness_date}
                    </div>
                  </div>

                  {/* Assumptions and Exclusions Checklist */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '8px' }}>
                      Standard Inclusions & Key Assumptions:
                    </div>
                    <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {estimateResult.assumptions_and_exclusions.slice(0, 4).map((item, idx) => (
                        <li key={idx} style={{ fontSize: '0.82rem', color: 'var(--color-navy)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <span style={{ color: 'var(--color-teal)', fontWeight: 'bold' }}>✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actions: Breakdown, Share & Print Summary */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setIsBreakdownOpen(true)}
                        className="btn btn-secondary btn-sm"
                      >
                        <DollarSign size={15} color="var(--color-teal)" />
                        <span>Inspect Components</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setIsShareOpen(true)}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#075E54', borderColor: '#86EFAC' }}
                      >
                        <MessageSquare size={15} color="#25D366" />
                        <span>Share via WhatsApp</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setIsPrintOpen(true)}
                        className="btn btn-primary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Printer size={15} />
                        <span>Print / Save PDF</span>
                      </motion.button>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-grey)' }}>
                      Currency: INR (₹)
                    </div>
                  </div>
                </div>

                {/* Mandatory Honest Disclaimer Callout */}
                <div style={{
                  backgroundColor: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  <Info size={20} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '0.82rem', color: '#92400E', lineHeight: 1.5 }}>
                    <strong>Illustrative demo estimate — not a verified hospital quotation.</strong>
                    <br />
                    Individual medical bills depend on surgeon discretion, exact implant model selected, days in ICU/ventilator care, and patient clinical stability. Always obtain a binding formal estimate at the hospital billing desk before admission.
                  </div>
                </div>

                {/* 3. Interactive Cost Breakdown Donut Chart */}
                {estimateResult.cost_breakdown && (
                  <CostBreakdownDonut
                    breakdown={estimateResult.cost_breakdown}
                    minPrice={estimateResult.overall_min}
                    maxPrice={estimateResult.overall_max}
                    treatmentName={estimateResult.canonical_treatment?.name || estimateResult.query_treatment}
                  />
                )}

                {/* 4. Out-of-Pocket Waterfall Bridge */}
                {estimateResult.waterfall && (
                  <OutOfPocketWaterfallChart
                    waterfall={estimateResult.waterfall}
                    treatmentName={estimateResult.canonical_treatment?.name || estimateResult.query_treatment}
                  />
                )}

                {/* 5. Statutory Itemized Reference Table */}
                {estimateResult.detailed_components && estimateResult.detailed_components.length > 0 && (
                  <ItemizedComponentsTable
                    components={estimateResult.detailed_components}
                    treatmentName={estimateResult.canonical_treatment?.name || estimateResult.query_treatment}
                  />
                )}

                {/* 6. Government vs Trust vs Private Tier Comparison */}
                {estimateResult.tier_comparisons && estimateResult.tier_comparisons.length > 0 && (
                  <TierComparisonView
                    tierComparisons={estimateResult.tier_comparisons}
                    treatmentName={estimateResult.canonical_treatment?.name || estimateResult.query_treatment}
                  />
                )}

                {/* 6.1 Applicable Health Schemes & Statutory Benefit Packages (Phase 4 & 6) */}
                <div className="card cost-estimator-card-elevation" style={{
                  background: 'var(--color-white)',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-md)',
                  marginTop: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldCheck size={20} color="var(--color-teal)" />
                      <h4 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-navy)' }}>
                        Applicable Health Schemes & Statutory Packages
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => goToTab('schemes')}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <span>Explore Health Card Finder</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--color-text-grey)', marginBottom: '16px', lineHeight: 1.5 }}>
                    Statutory packages matched for <strong>{estimateResult.canonical_treatment?.name || estimateResult.query_treatment}</strong> under National and State health protection policies.
                  </p>

                  {estimateResult.applicable_schemes && estimateResult.applicable_schemes.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                      {estimateResult.applicable_schemes.map((sch, idx) => (
                        <div
                          key={sch.id || idx}
                          style={{
                            border: '1px solid #E2E8F0',
                            borderRadius: 'var(--radius-md, 10px)',
                            padding: '14px',
                            backgroundColor: '#F8FAFC',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '8px'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px', marginBottom: '6px' }}>
                              <strong style={{ color: 'var(--color-navy)', fontSize: '0.95rem' }}>{sch.name}</strong>
                              <span className="badge badge-teal" style={{ fontSize: '0.72rem' }}>{sch.status || 'Verified Package'}</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-grey)', marginBottom: '6px' }}>
                              Authority: {sch.authority}
                            </div>
                            {sch.package_code && (
                              <div style={{ display: 'inline-block', backgroundColor: '#E0F2FE', color: '#0369A1', padding: '3px 7px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600, marginBottom: '6px' }}>
                                Statutory Code: {sch.package_code}
                              </div>
                            )}
                            <div style={{ fontSize: '0.82rem', color: '#166534', fontWeight: 600, marginBottom: '4px' }}>
                              Cashless Limit: {sch.coverage_limit}
                            </div>
                            {sch.notes && (
                              <p style={{ fontSize: '0.76rem', color: 'var(--color-text-grey)', margin: 0, lineHeight: 1.4 }}>
                                {sch.notes}
                              </p>
                            )}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B', borderTop: '1px solid #E2E8F0', paddingTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Info size={12} />
                            <span>Pre-authorization via hospital Aarogyamitra desk required</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#F1F5F9', fontSize: '0.82rem', color: '#475569' }}>
                      No direct statutory package code mapped for this procedure. Private insurance TPAs or hospital-specific concessions may still apply.
                    </div>
                  )}
                </div>

                {/* 6.2 Suitable Nearby Facility Comparison Panel (Phase 6 & 7) */}
                {estimateResult.comparable_facilities && estimateResult.comparable_facilities.length > 0 && (
                  <div className="card cost-estimator-card-elevation" style={{
                    background: 'var(--color-white)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-md)',
                    marginTop: '20px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Compass size={20} color="var(--color-teal)" />
                        <h4 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-navy)' }}>
                          Nearby Facilities Offering This Procedure
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => goToTab('hospitals')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <span>View All on Map</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {estimateResult.comparable_facilities.map((fac) => {
                        const minC = fac.estimated_cost_min || (fac.tariff_detail?.min_cost) || estimateResult.overall_min;
                        const maxC = fac.estimated_cost_max || (fac.tariff_detail?.max_cost) || estimateResult.overall_max;
                        const dist = fac.road_distance_km !== undefined ? fac.road_distance_km : fac.distance_km;

                        return (
                          <div
                            key={fac.id}
                            style={{
                              border: '1px solid #E2E8F0',
                              borderRadius: 'var(--radius-md, 10px)',
                              padding: '14px 16px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              flexWrap: 'wrap',
                              gap: '12px',
                              backgroundColor: '#FFFFFF',
                              transition: 'box-shadow 0.2s ease'
                            }}
                          >
                            <div style={{ flex: '1 1 300px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                                <strong style={{ fontSize: '1.02rem', color: 'var(--color-navy)' }}>{fac.name}</strong>
                                <span className={`badge ${fac.ownership === 'Government' ? 'badge-teal' : fac.ownership === 'Charitable' ? 'badge-blue' : 'badge-navy'}`} style={{ fontSize: '0.72rem' }}>
                                  {fac.ownership}
                                </span>
                                {fac.verification_status && (
                                  <span className="badge" style={{ backgroundColor: '#DCFCE7', color: '#166534', fontSize: '0.7rem' }}>
                                    ✓ Verified Facility
                                  </span>
                                )}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.78rem', color: 'var(--color-text-grey)', marginBottom: '8px', flexWrap: 'wrap' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <MapPin size={13} />
                                  {fac.locality ? `${fac.locality}, ` : ''}{fac.city} {dist !== undefined && dist > 0 ? `(${dist.toFixed(1)} km away)` : ''}
                                </span>
                                {fac.phone && fac.phone !== 'None' && (
                                  <a href={`tel:${fac.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-teal-dark)', textDecoration: 'none' }}>
                                    <PhoneCall size={13} />
                                    <span>{fac.phone}</span>
                                  </a>
                                )}
                              </div>

                              {/* Transparent Explainable Recommendation (Phase 7) */}
                              <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '6px', padding: '6px 10px', fontSize: '0.76rem', color: '#15803D', lineHeight: 1.4 }}>
                                <strong>Why recommended:</strong> {fac.why_this_hospital || fac.recommendation_reason || `Offers specialized care for ${estimateResult.canonical_treatment?.name || estimateResult.query_treatment} in ${fac.locality || fac.city}.`}
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', minWidth: '160px' }}>
                              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-grey)', textTransform: 'uppercase', fontWeight: 600 }}>
                                Estimated Range
                              </span>
                              <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-navy)', whiteSpace: 'nowrap' }}>
                                {minC === 0 ? '₹0 (Free / Govt)' : `₹${minC.toLocaleString('en-IN')}`} - ₹{maxC.toLocaleString('en-IN')}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-grey)', marginTop: '2px' }}>
                                {fac.tariff_detail?.type ? `Tariff: ${fac.tariff_detail.type}` : 'Empanelled benchmark'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 7. Medicine Cost Estimator (NPPA Pharma Sahi Daam & Jan Aushadhi) */}
                <MedicineCostEstimator
                  onTotalMedicineCostChange={(min, max, data) => {
                    setMedicineCostMin(min);
                    setMedicineCostMax(max);
                    setMedicineData(data);
                  }}
                />

                {/* 8. Combined Expense Summary (Grand Total Overview) */}
                <CombinedExpenseSummary
                  treatmentName={estimateResult.canonical_treatment?.name || estimateResult.query_treatment}
                  hospitalCostMin={estimateResult.overall_min}
                  hospitalCostMax={estimateResult.overall_max}
                  diagnosticCost={estimateResult.cost_breakdown?.diagnostics_and_lab}
                  medicineCostMin={medicineCostMin}
                  medicineCostMax={medicineCostMax}
                  costBreakdown={estimateResult.cost_breakdown}
                  confidence={estimateResult.confidence}
                  matchedSchemeName="PM-JAY (Ayushman Bharat) / Aarogyasri Trust"
                />

                {/* 9. Billing & Admission Checklists */}
                {estimateResult.checklists && (
                  <ChecklistsCard
                    checklists={estimateResult.checklists}
                    treatmentName={estimateResult.canonical_treatment?.name || estimateResult.query_treatment}
                  />
                )}

                {/* 10. Patient Savings Plan (Printable Budget & Checklist) */}
                <PatientSavingsPlan
                  treatmentName={estimateResult.canonical_treatment?.name || estimateResult.query_treatment}
                  treatmentBudgetMin={estimateResult.overall_min}
                  treatmentBudgetMax={estimateResult.overall_max}
                  medicineBudgetMin={medicineCostMin}
                  medicineBudgetMax={medicineCostMax}
                  userBudget={budgetLimit}
                  city={city}
                />
              </>
            ) : (
              <div className="card" style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-grey)' }}>
                {isLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <RefreshCw size={28} className="animate-spin" color="var(--color-teal)" />
                    <p style={{ margin: 0, fontWeight: 600 }}>Computing Transparent Estimate...</p>
                  </div>
                ) : (
                  <p style={{ margin: 0 }}>Select your procedure and location on the left to calculate an estimate.</p>
                )}
              </div>
            )}
          </div>

        {/* Modal for Breakdown */}
        {estimateResult && (
          <CostBreakdownModal
            isOpen={isBreakdownOpen}
            onClose={() => setIsBreakdownOpen(false)}
            breakdown={estimateResult.cost_breakdown}
            treatmentName={estimateResult.canonical_treatment?.name || estimateResult.query_treatment}
            minPrice={estimateResult.overall_min}
            maxPrice={estimateResult.overall_max}
            priceType={estimateResult.price_type}
            facilityName={estimateResult.selected_facility?.name}
          />
        )}

        {/* Modal for Printable One-Page Summary */}
        {estimateResult && (
          <PrintSummaryModal
            isOpen={isPrintOpen}
            onClose={() => setIsPrintOpen(false)}
            costEstimate={estimateResult}
            facilityName={estimateResult.selected_facility?.name}
            city={city}
            state={stateName}
          />
        )}

        {/* Modal for WhatsApp Sharing */}
        {estimateResult && (
          <ShareModal
            isOpen={isShareOpen}
            onClose={() => setIsShareOpen(false)}
            treatmentName={estimateResult.canonical_treatment?.name || estimateResult.query_treatment}
            minPrice={estimateResult.overall_min}
            maxPrice={estimateResult.overall_max}
            facilityName={estimateResult.selected_facility?.name}
            city={city}
            state={stateName}
            priceType={estimateResult.price_type}
          />
        )}
      </div>
  );
};
