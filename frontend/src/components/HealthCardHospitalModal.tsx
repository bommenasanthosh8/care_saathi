import React, { useEffect, useState } from 'react';
import { 
  X, 
  MapPin, 
  Phone, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  FileCheck, 
  HelpCircle, 
  Compass, 
  Info,
  CreditCard,
  Building2,
  ListChecks,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { 
  HospitalHealthCardMatchDTO, 
  HealthCardSchemeDTO, 
  HealthCardPackageDTO,
  HospitalHealthCardProfileResponse,
  careSaathiApi 
} from '../services/api';

interface HealthCardHospitalModalProps {
  match: HospitalHealthCardMatchDTO | null;
  scheme: HealthCardSchemeDTO | null;
  packageInfo?: HealthCardPackageDTO | null;
  onClose: () => void;
  onBookAppointment?: (facilityId: string) => void;
}

export const HealthCardHospitalModal: React.FC<HealthCardHospitalModalProps> = ({
  match,
  scheme,
  packageInfo,
  onClose,
  onBookAppointment
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<HospitalHealthCardProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!match) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    careSaathiApi.getHospitalHealthCardProfile(
      match.facility_id, 
      scheme?.id, 
      packageInfo?.treatment_id
    )
      .then((data: HospitalHealthCardProfileResponse) => {
        if (isMounted) {
          setProfile(data);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setError(err.message || 'Unable to load complete hospital verification profile.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [match, scheme, packageInfo]);

  if (!match) return null;

  const isVerified = match.verification_status === 'verified_procedure';
  const isSchemeOnly = match.verification_status === 'scheme_verified_procedure_unconfirmed';

  const badgeConfig = {
    verified_procedure: {
      color: '#0D7B60',
      bgColor: '#E6F4EA',
      borderColor: '#A8DAB5',
      icon: ShieldCheck,
      title: 'Verified For This Procedure',
      desc: 'Empanelled under the scheme and verified to offer the statutory treatment package.'
    },
    scheme_verified_procedure_unconfirmed: {
      color: '#B76E00',
      bgColor: '#FEF7E0',
      borderColor: '#FCE8B2',
      icon: Clock,
      title: 'Scheme Empanelled — Package Unconfirmed',
      desc: 'Hospital is verified as scheme-empanelled. Procedure package authorization requires hospital pre-check.'
    },
    needs_confirmation: {
      color: '#7C4A03',
      bgColor: '#FFF3E0',
      borderColor: '#FFE0B2',
      icon: HelpCircle,
      title: 'Information Needs Confirmation',
      desc: 'Record requires re-verification with hospital scheme desk.'
    },
    not_matched: {
      color: '#5F6368',
      bgColor: '#F1F3F4',
      borderColor: '#DADCE0',
      icon: AlertCircle,
      title: 'Not Empanelled in Verified Records',
      desc: 'No official empanelment found for this card.'
    }
  }[match.verification_status] || {
    color: '#5F6368',
    bgColor: '#F1F3F4',
    borderColor: '#DADCE0',
    icon: Info,
    title: match.verification_status_label,
    desc: 'Status not specified.'
  };

  const StatusIcon = badgeConfig.icon;

  const formatRupees = (val?: number) => {
    if (val === undefined || val === null) return '—';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const directionsUrl = match.lat && match.lng 
    ? `https://www.google.com/maps/dir/?api=1&destination=${match.lat},${match.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(match.facility_name + ' ' + match.city)}`;

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(18, 48, 74, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div 
        className="modal-content health-card-modal-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '780px',
          width: '100%',
          maxHeight: '92vh',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 38px 3px rgba(0,0,0,0.14), 0 9px 46px 8px rgba(0,0,0,0.12)'
        }}
      >
        <style>{`
          @media (max-width: 767px) {
            .health-card-modal-panel {
              position: fixed !important;
              bottom: 0 !important;
              left: 0 !important;
              right: 0 !important;
              max-height: 94vh !important;
              border-radius: 20px 20px 0 0 !important;
              margin: 0 !important;
            }
          }
        `}</style>

        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#F9FAFB'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: badgeConfig.color,
                backgroundColor: badgeConfig.bgColor,
                border: `1px solid ${badgeConfig.borderColor}`
              }}
            >
              <StatusIcon size={14} />
              {badgeConfig.title}
            </span>
            <span 
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 500,
                backgroundColor: '#EEF2F6',
                color: '#1E3A8A'
              }}
            >
              {match.ownership} Facility
            </span>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close modal"
            style={{ 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer', 
              color: '#6B7280', 
              padding: '4px',
              borderRadius: '6px'
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          
          {/* Hospital Basic Header */}
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#111827', margin: '0 0 6px 0', lineHeight: 1.3 }}>
              {match.facility_name}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px', color: '#4B5563', fontSize: '0.88rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={15} color="#0D7B60" />
                {match.locality ? `${match.locality}, ` : ''}{match.city}, {match.state}
              </span>
              {match.distance_km !== undefined && match.distance_km !== null && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: '#1E3A8A' }}>
                  <Compass size={15} />
                  {match.distance_km.toFixed(1)} km away
                </span>
              )}
              {match.phone && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={15} color="#4B5563" />
                  {match.phone}
                </span>
              )}
            </div>
          </div>

          {/* Scheme & Treatment Context Callout */}
          <div style={{
            backgroundColor: '#F0F9FF',
            border: '1px solid #BAE6FD',
            borderRadius: '10px',
            padding: '14px 18px',
            marginBottom: '22px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <CreditCard size={22} color="#0284C7" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: '0.9rem' }}>
              <div style={{ fontWeight: 600, color: '#0369A1', marginBottom: '2px' }}>
                {scheme?.name} ({scheme?.short_code})
              </div>
              <div style={{ color: '#334155', lineHeight: 1.4 }}>
                Target Treatment: <strong style={{ color: '#0F172A' }}>{packageInfo?.package_name || match.package_name || 'Selected Treatment'}</strong>
                {packageInfo?.package_code && (
                  <span style={{ marginLeft: '8px', fontSize: '0.8rem', background: '#E0F2FE', padding: '2px 6px', borderRadius: '4px', color: '#0369A1' }}>
                    Code: {packageInfo.package_code}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Cost & Coverage Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1F2937', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCheck size={18} color="#0D7B60" />
              Coverage & Estimated Financials
            </h3>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '12px',
              marginBottom: '12px'
            }}>
              {/* Statutory Package Rate */}
              <div style={{ padding: '14px', borderRadius: '10px', border: '1px solid #E5E7EB', backgroundColor: '#FAFAFA' }}>
                <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>Statutory Package Rate</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#111827', marginTop: '4px' }}>
                  {formatRupees(match.scheme_rate_inr || packageInfo?.statutory_rate_inr)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px' }}>
                  Standard rate fixed by scheme authority
                </div>
              </div>

              {/* Estimated Covered Amount */}
              <div style={{ padding: '14px', borderRadius: '10px', border: '1px solid #A8DAB5', backgroundColor: '#F0FDF4' }}>
                <div style={{ fontSize: '0.75rem', color: '#0D7B60', textTransform: 'uppercase', fontWeight: 600 }}>Covered By Scheme</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0D7B60', marginTop: '4px' }}>
                  {formatRupees(match.estimated_scheme_coverage_inr)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#0D7B60', marginTop: '4px' }}>
                  Subject to pre-authorization approval
                </div>
              </div>

              {/* Estimated Out-Of-Pocket */}
              <div style={{ padding: '14px', borderRadius: '10px', border: '1px solid #FCD34D', backgroundColor: '#FFFBEB' }}>
                <div style={{ fontSize: '0.75rem', color: '#B45309', textTransform: 'uppercase', fontWeight: 600 }}>Est. Out-of-Pocket Expense</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#B45309', marginTop: '4px' }}>
                  {match.estimated_patient_out_of_pocket_inr === 0 ? '₹0 (Zero Out-of-Pocket)' : formatRupees(match.estimated_patient_out_of_pocket_inr)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#92400E', marginTop: '4px' }}>
                  {match.cost_note || 'Excludes non-medical consumables'}
                </div>
              </div>
            </div>

            {/* Inclusions / Exclusions Note */}
            {packageInfo?.exclusions_summary && (
              <div style={{ fontSize: '0.82rem', color: '#64748B', backgroundColor: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', marginTop: '8px' }}>
                <strong>Exclusions & Limits:</strong> {packageInfo.exclusions_summary}
              </div>
            )}
          </div>

          {/* Evidence and Verification Record */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1F2937', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="#0284C7" />
              Empanelment Evidence & Verification Source
            </h3>

            <div style={{ border: '1px solid #E5E7EB', borderRadius: '10px', padding: '16px', backgroundColor: '#FFFFFF' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', fontSize: '0.88rem' }}>
                <div>
                  <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>OFFICIAL VERIFICATION SOURCE</div>
                  <div style={{ fontWeight: 600, color: '#111827', marginTop: '2px' }}>
                    {match.official_source_name || 'Official State Scheme Registry'}
                  </div>
                </div>

                <div>
                  <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>LAST AUDITED & VERIFIED</div>
                  <div style={{ fontWeight: 500, color: '#111827', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} color="#6B7280" />
                    {match.last_verified || 'Recent quarterly update'}
                  </div>
                </div>

                <div>
                  <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>SCHEME HELPDESK / MITRA CONTACT</div>
                  <div style={{ fontWeight: 600, color: '#0D7B60', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={14} />
                    {match.helpdesk_phone || scheme?.helpline_number || 'Aarogya Mithra Desk Available'}
                  </div>
                </div>

                <div>
                  <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>OFFICIAL SCHEME PORTAL</div>
                  <div style={{ marginTop: '2px' }}>
                    {match.official_source_url ? (
                      <a 
                        href={match.official_source_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#0284C7', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        Visit Official Registry <ExternalLink size={13} />
                      </a>
                    ) : (
                      <span style={{ color: '#6B7280' }}>Registry verified via statutory list</span>
                    )}
                  </div>
                </div>
              </div>

              {match.coverage_notes && (
                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #F3F4F6', fontSize: '0.83rem', color: '#4B5563', lineHeight: 1.5 }}>
                  <Info size={14} color="#0284C7" style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                  {match.coverage_notes}
                </div>
              )}
            </div>
          </div>

          {/* Pre-travel Checklist / Questions for the Hospital */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1F2937', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ListChecks size={18} color="#D97706" />
              Mandatory Patient Checklist Before Travelling
            </h3>

            <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: '10px', padding: '16px' }}>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#92400E', fontSize: '0.86rem', lineHeight: 1.6 }}>
                {(profile?.pre_travel_checklist || [
                  `Carry your original ${scheme?.short_code || 'Health'} Card and Aadhaar Card.`,
                  'Ask for the Aarogya Mithra / Scheme Helpdesk upon arrival at the hospital.',
                  `Confirm if a referral letter from a PHC/CHC or specialist is required for ${packageInfo?.package_name || 'this surgery'}.`,
                  'Check if pre-authorization is required before admission.',
                  'Clarify non-payable items (surgical gloves, special hygiene kits, private room differentials).'
                ]).map((item, idx) => (
                  <li key={idx} style={{ marginBottom: '6px' }}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Important Regulatory Disclaimer */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '12px 16px',
            backgroundColor: '#F8FAFC',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            fontSize: '0.78rem',
            color: '#64748B',
            lineHeight: 1.45
          }}>
            <ShieldAlert size={16} color="#64748B" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Statutory Notice:</strong> CareSaathi AI provides verified empanelment and package data from official government registries. This does not constitute an insurance pre-authorization guarantee. Final cashless approval is determined solely by the treating hospital, scheme authorities, and valid patient eligibility at the time of admission.
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          backgroundColor: '#F9FAFB'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {match.phone && (
              <a
                href={`tel:${match.phone.replace(/[^0-9]/g, '')}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D1D5DB',
                  color: '#1F2937',
                  textDecoration: 'none',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  transition: 'background 0.15s ease'
                }}
              >
                <Phone size={16} color="#0D7B60" />
                Call Hospital ({match.phone})
              </a>
            )}

            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D1D5DB',
                color: '#1F2937',
                textDecoration: 'none',
                fontSize: '0.88rem',
                fontWeight: 600
              }}
            >
              <Compass size={16} color="#0284C7" />
              Get Directions
            </a>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {onBookAppointment && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onBookAppointment(match.facility_id);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  backgroundColor: '#0D7B60',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Book Consultation
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
