// ==============================================================================
// CareSaathi AI - Upgraded Homepage & Hero Centerpiece
// Features: Premium 3D Healthcare Orb centerpiece, live question input bar,
// microphone & prescription triggers, brand color palette & glassmorphism.
// ==============================================================================

import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  ArrowRight, 
  MapPin, 
  ShieldCheck, 
  DollarSign, 
  Clock,
  Compass,
  Zap,
  Activity,
  Info
} from 'lucide-react';
import { CareCoreHero } from '../components/CareCoreHero';

interface LandingPageProps {
  onStartSearch: (query?: string) => void;
  onExploreCost: () => void;
  onExploreHospitals: () => void;
  onExploreSchemes: () => void;
  onExploreHealthCards?: () => void;
  onHowItWorks: () => void;
  onOpenVoice?: () => void;
  onOpenRx?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartSearch,
  onExploreCost,
  onExploreHospitals,
  onExploreSchemes,
  onExploreHealthCards,
  onHowItWorks,
  onOpenVoice,
  onOpenRx
}) => {
  const { t } = useLanguage();

  return (
    <div>      {/* ========================================================================= */}
      {/* NEW 3D "CARE CORE" HERO & REBUILT COST COMPARISON PREVIEW                */}
      {/* ========================================================================= */}
      <CareCoreHero
        onStartSearch={onStartSearch}
        onOpenVoice={onOpenVoice}
        onOpenRx={onOpenRx}
      />

      {/* ========================================================================= */}
      {/* THREE PROMINENT PILLARS OF HEALTHCARE NAVIGATION */}
      {/* ========================================================================= */}
      <section className="section" style={{ backgroundColor: 'var(--color-white)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 48px auto' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '12px', color: 'var(--color-navy)' }}>
              Three Essential Questions Answered in One Place
            </h2>
            <p style={{ color: 'var(--color-text-grey)', fontSize: '1.05rem', lineHeight: 1.6 }}>
              Designed specifically to alleviate healthcare cost anxiety and navigation friction for Indian families.
            </p>
          </div>

          <div className="grid-3">
            {/* Feature 1: Procedure Cost Estimation */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', borderRadius: '18px' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                backgroundColor: 'var(--color-mint)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-teal)',
                marginBottom: '18px'
              }}>
                <DollarSign size={26} />
              </div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: 'var(--color-navy)' }}>
                {t('featCostTitle')}
              </h3>
              <p style={{ color: 'var(--color-text-grey)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '22px', flex: 1 }}>
                {t('featCostDesc')} Understand what surgeon fees, room rent, implants, and diagnostics contribute to total billing across Government, NABH Private, and Premium tiers.
              </p>
              <button
                onClick={onExploreCost}
                className="btn btn-secondary btn-sm"
                style={{ alignSelf: 'flex-start', fontWeight: 700 }}
              >
                <span>Estimate Procedure Cost</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Feature 2: Hospital Discovery */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', borderRadius: '18px' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                backgroundColor: 'var(--color-light-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-navy)',
                marginBottom: '18px'
              }}>
                <MapPin size={26} />
              </div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: 'var(--color-navy)' }}>
                {t('featHospTitle')}
              </h3>
              <p style={{ color: 'var(--color-text-grey)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '22px', flex: 1 }}>
                {t('featHospDesc')} Spatial distance calculation, verified treatment availability, bed tariffs, and empanelment listings across all Indian districts.
              </p>
              <button
                onClick={onExploreHospitals}
                className="btn btn-secondary btn-sm"
                style={{ alignSelf: 'flex-start', fontWeight: 700 }}
              >
                <span>Find Nearby Facilities</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Feature 3: Government Scheme Matching */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', borderRadius: '18px' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                backgroundColor: '#FFF4E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#D97706',
                marginBottom: '18px'
              }}>
                <ShieldCheck size={26} />
              </div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: 'var(--color-navy)' }}>
                {t('featSchemeTitle')}
              </h3>
              <p style={{ color: 'var(--color-text-grey)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '22px', flex: 1 }}>
                {t('featSchemeDesc')} Check whether your ration card, income, or state residence qualifies for PM-JAY and state schemes like Aarogyasri with package ceiling rates.
              </p>
              <button
                onClick={onExploreSchemes}
                className="btn btn-secondary btn-sm"
                style={{ alignSelf: 'flex-start', fontWeight: 700 }}
              >
                <span>Check Scheme Eligibility</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Featured Health Card Hospital Finder Callout Banner */}
          {onExploreHealthCards && (
            <div style={{
              marginTop: '40px',
              padding: '28px 32px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #F0FDF4 0%, #E6F4EA 100%)',
              border: '1.5px solid #A8DAB5',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px'
            }}>
              <div style={{ maxWidth: '720px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '50px', backgroundColor: '#0D7B60', color: '#FFFFFF', fontSize: '0.74rem', fontWeight: 700, marginBottom: '10px' }}>
                  <ShieldCheck size={13} />
                  NEW: HEALTH CARD FINDER
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#102A36', margin: '0 0 6px 0' }}>
                  Have an Aarogyasri, PM-JAY, EHS, or Insurance Card?
                </h3>
                <p style={{ margin: 0, fontSize: '0.94rem', color: '#334155', lineHeight: 1.5 }}>
                  Discover exactly which hospitals in your district accept your specific card for your required surgery, with verified statutory package rates and zero out-of-pocket surprise calculations.
                </p>
              </div>

              <button
                type="button"
                onClick={onExploreHealthCards}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  backgroundColor: '#0D7B60',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '0.94rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(13, 123, 96, 0.25)',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>Find Empanelled Hospitals</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3-STEP EXPLANATION WITH REFINED CARD DEPTH */}
      {/* ========================================================================= */}
      <section style={{
        backgroundColor: 'var(--color-warm-bg)',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
        padding: '64px 0'
      }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 40px auto' }}>
            <h2 style={{ fontSize: '1.9rem', marginBottom: '10px', color: 'var(--color-navy)' }}>
              Simple 3-Step Navigation Flow
            </h2>
            <p style={{ color: 'var(--color-text-grey)', fontSize: '0.95rem' }}>
              No medical jargon required. Accessible via text, voice speech, or prescription upload.
            </p>
          </div>

          <div className="grid-3">
            <div style={{
              backgroundColor: 'var(--color-white)',
              borderRadius: 'var(--radius-lg)',
              padding: '26px',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-mint)',
                color: 'var(--color-teal-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.9rem',
                marginBottom: '14px'
              }}>
                1
              </div>
              <div style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--color-navy)',
                marginBottom: '8px'
              }}>
                {t('step1Title')}
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-grey)', lineHeight: 1.5 }}>
                {t('step1Desc')} Natural language entity parsing extracts symptoms, procedures, and localities automatically.
              </p>
            </div>

            <div style={{
              backgroundColor: 'var(--color-white)',
              borderRadius: 'var(--radius-lg)',
              padding: '26px',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-light-blue)',
                color: 'var(--color-navy)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.9rem',
                marginBottom: '14px'
              }}>
                2
              </div>
              <div style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--color-navy)',
                marginBottom: '8px'
              }}>
                {t('step2Title')}
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-grey)', lineHeight: 1.5 }}>
                {t('step2Desc')} Transparently view government, charitable, and private options with detailed component breakdowns.
              </p>
            </div>

            <div style={{
              backgroundColor: 'var(--color-white)',
              borderRadius: 'var(--radius-lg)',
              padding: '26px',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#FFF4E5',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.9rem',
                marginBottom: '14px'
              }}>
                3
              </div>
              <div style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--color-navy)',
                marginBottom: '8px'
              }}>
                {t('step3Title')}
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-grey)', lineHeight: 1.5 }}>
                {t('step3Desc')} Verify PM-JAY and Aarogyasri package codes and get connected directly to official helplines and directions.
              </p>
            </div>
          </div>

          {/* Transparent Caveat Box */}
          <div style={{
            marginTop: '36px',
            backgroundColor: 'var(--color-light-blue)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 20px',
            border: '1px solid #d2e4f3',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.85rem',
            color: 'var(--color-navy)'
          }}>
            <Info size={20} color="var(--color-teal)" style={{ flexShrink: 0 }} />
            <span>
              <strong>Transparency Note:</strong> All estimated prices are indicative ranges based on published hospital tariffs and reference surveys. Official scheme eligibility requires verification by hospital Aarogyamitras or the National Health Authority portal.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
