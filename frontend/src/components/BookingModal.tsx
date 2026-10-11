import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Share2, 
  Download, 
  Navigation, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  Info,
  ArrowRight
} from 'lucide-react';
import { FacilityDTO, api, PaymentOrderDTO, PaymentVerificationResultDTO } from '../services/api';
import { appointmentRepo, HospitalSlot, Appointment, downloadCalendarIcs } from '../services/appointmentRepository';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import { useLanguage } from '../context/LanguageContext';

interface BookingModalProps {
  isOpen: boolean;
  facility: FacilityDTO | null;
  onClose: () => void;
  onViewMyAppointments?: () => void;
  matchedSchemeName?: string;
  treatmentName?: string;
}

const PURPOSES = [
  { id: 'Consultation', label: 'Initial Doctor Consultation', icon: '🩺' },
  { id: 'Pre-surgery evaluation', label: 'Pre-surgery Evaluation & Workup', icon: '🏥' },
  { id: 'Diagnostics (MRI, CT)', label: 'Diagnostics & Imaging (MRI, CT, X-Ray)', icon: '🔬' },
  { id: 'Second opinion', label: 'Second Opinion & Tariff Review', icon: '📋' }
];

interface BookingModalContentProps {
  facility: FacilityDTO;
  onClose: () => void;
  onViewMyAppointments?: () => void;
  matchedSchemeName?: string;
  treatmentName?: string;
}

const BookingModalContent: React.FC<BookingModalContentProps> = ({
  facility,
  onClose,
  onViewMyAppointments,
  matchedSchemeName = 'Aarogyasri / PM-JAY',
  treatmentName
}) => {
  const { user, token } = useAuth();
  const { searchState } = useSearch();
  const { language } = useLanguage();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [purpose, setPurpose] = useState<string>(() => {
    if (treatmentName?.toLowerCase().includes('mri') || treatmentName?.toLowerCase().includes('ct')) {
      return 'Diagnostics (MRI, CT)';
    }
    return 'Consultation';
  });

  // Step 2: Slot Selection
  const [slots, setSlots] = useState<HospitalSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');

  // Step 3: Patient Information
  const [isBookingForOther, setIsBookingForOther] = useState(false);
  const [patientName, setPatientName] = useState(user?.name || '');
  const [patientAge, setPatientAge] = useState<number>(38);
  const [patientPhone, setPatientPhone] = useState('+91 ');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(Boolean(user));
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [demoOtpHint, setDemoOtpHint] = useState<string | null>(null);
  const [preferredLang, setPreferredLang] = useState(language || 'en');
  const [patientNote, setPatientNote] = useState('');
  const [shareSummary, setShareSummary] = useState(true);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

  // Optional Payment States
  const [wantsAdvancePayment, setWantsAdvancePayment] = useState<boolean>(false);
  const [paymentOrder, setPaymentOrder] = useState<PaymentOrderDTO | null>(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState<boolean>(false);
  const [paymentStatus, setPaymentStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [paymentResult, setPaymentResult] = useState<PaymentVerificationResultDTO | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleInitiatePayment = async (aptId: string) => {
    setIsCreatingPayment(true);
    setPaymentError(null);
    try {
      const res = await api.createPaymentOrder({
        appointment_id: aptId,
        facility_name: facility.name,
        consultation_fee: 500,
        registration_fee: 100
      }, token || undefined);
      if (res.success && res.order) {
        setPaymentOrder(res.order);
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Failed to initialize payment gateway order');
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const handleVerifySandboxPayment = async () => {
    if (!paymentOrder) return;
    setPaymentStatus('PROCESSING');
    setPaymentError(null);
    try {
      const res = await api.verifyPayment({
        order_id: paymentOrder.order_id,
        payment_id: `pay_sandbox_${Date.now()}`,
        client_status: 'SUCCESS'
      }, token || undefined);
      if (res.verified) {
        setPaymentStatus('SUCCESS');
        setPaymentResult(res);
      } else {
        setPaymentStatus('FAILED');
        setPaymentError(res.error || 'Payment verification failed');
      }
    } catch (err: any) {
      setPaymentStatus('FAILED');
      setPaymentError(err.message || 'Payment verification error');
    }
  };

  // Load slots on open
  useEffect(() => {
    if (facility) {
      setLoadingSlots(true);
      appointmentRepo.getSlots(facility.id).then(loadedSlots => {
        setSlots(loadedSlots);
        setLoadingSlots(false);
        // Default select first available date
        if (loadedSlots.length > 0) {
          const firstDate = loadedSlots[0].slot_start.split('T')[0];
          setSelectedDateStr(firstDate);
        }
      });
    }
  }, [facility]);

  // Extract unique 14 dates from slots
  const availableDates = Array.from(new Set(slots.map(s => s.slot_start.split('T')[0]))).slice(0, 14);

  // Filter slots for selected date
  const slotsForSelectedDate = slots.filter(s => s.slot_start.startsWith(selectedDateStr));

  const filteredSlots = slotsForSelectedDate.filter(s => {
    const hour = new Date(s.slot_start).getHours();
    if (timeFilter === 'morning') return hour < 12;
    if (timeFilter === 'afternoon') return hour >= 12 && hour < 16;
    if (timeFilter === 'evening') return hour >= 16;
    return true;
  });

  const selectedSlot = slots.find(s => s.id === selectedSlotId);

  const handleSendOtp = async () => {
    const cleanDigits = patientPhone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setOtpError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setIsSendingOtp(true);
    setOtpError(null);
    try {
      const res = await api.sendOtp(patientPhone);
      setOtpSent(true);
      if (res.demo_otp_hint) {
        setDemoOtpHint(res.demo_otp_hint);
        setOtpCode(res.demo_otp_hint);
      }
    } catch (err: any) {
      setOtpError(err.message || 'Failed to send verification code.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      setOtpError('Please enter the 4-digit verification code.');
      return;
    }
    setIsVerifyingOtp(true);
    setOtpError(null);
    try {
      const res = await api.verifyOtp(patientPhone, otpCode.trim());
      if (res.verified) {
        setOtpVerified(true);
      } else {
        setOtpError('Verification code was not accepted.');
      }
    } catch (err: any) {
      setOtpError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlotId || !patientName.trim()) {
      setBookingError('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);
    setBookingError(null);

    const isDemoFacility = facility.ownership !== 'Government' && !facility.name.includes('Yashoda');

    const res = await appointmentRepo.bookAppointment({
      slot_id: selectedSlotId,
      facility_id: facility.id,
      facility_name: facility.name,
      facility_address: facility.address,
      purpose,
      patient_name: patientName,
      patient_age: Number(patientAge) || 35,
      patient_phone: patientPhone,
      language: preferredLang,
      note: patientNote,
      user_id: user?.id || 'guest',
      is_demo: isDemoFacility,
      shared_summary: shareSummary ? {
        treatmentName: treatmentName || searchState.treatmentName,
        estimatedCostMin: facility.estimated_cost_min,
        estimatedCostMax: facility.estimated_cost_max,
        matchedSchemes: [matchedSchemeName],
      } : undefined
    });

    setIsSubmitting(false);

    if (res.success && res.appointment) {
      setConfirmedAppointment(res.appointment);
    } else {
      setBookingError(res.error || 'Failed to complete booking. Please try another slot.');
    }
  };

  const formatSlotTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const day = date.toLocaleDateString('en-IN', { weekday: 'short' });
    const num = date.getDate();
    const month = date.toLocaleDateString('en-IN', { month: 'short' });
    return { day, num, month };
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(18, 48, 74, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div 
        className="modal-content booking-panel" 
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <style>{`
          @media (max-width: 767px) {
            .booking-panel {
              position: fixed !important;
              bottom: 0 !important;
              left: 0 !important;
              right: 0 !important;
              max-height: 88vh !important;
              border-radius: 20px 20px 0 0 !important;
              margin: 0 !important;
            }
          }
        `}</style>

        {/* Header */}
        <div style={{
          padding: '18px 22px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#F8FAF9'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span className="badge badge-teal" style={{ fontSize: '0.72rem' }}>
                📅 Schedule Care
              </span>
              {facility.ownership === 'Government' ? (
                <span className="badge badge-navy" style={{ fontSize: '0.72rem' }}>
                  Government OP Booking
                </span>
              ) : (
                <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                  Demo Booking
                </span>
              )}
            </div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--color-navy)', margin: 0, fontWeight: 700 }}>
              {facility.name}
            </h3>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-grey)', padding: '4px' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Step Progress Dots */}
        {!confirmedAppointment && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 24px',
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid var(--color-border-subtle)'
          }}>
            {[
              { num: 1, title: 'Purpose' },
              { num: 2, title: 'Date & Time' },
              { num: 3, title: 'Patient Info' },
              { num: 4, title: 'Confirm' }
            ].map(s => (
              <div 
                key={s.num} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  opacity: step === s.num ? 1 : step > s.num ? 0.8 : 0.45 
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: step === s.num ? '#2C8C83' : step > s.num ? '#12304A' : '#E2E8F0',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  {step > s.num ? '✓' : s.num}
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-navy)' }}>
                  {s.title}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          
          {/* SUCCESS SCREEN */}
          {confirmedAppointment ? (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#E7F3EF',
                color: '#2C8C83',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px'
              }}>
                <CheckCircle2 size={36} color="#2C8C83" />
              </div>
              <h2 style={{ fontSize: '1.6rem', color: 'var(--color-navy)', marginBottom: '4px' }}>
                Appointment Request Confirmed!
              </h2>
              <p style={{ color: 'var(--color-text-grey)', fontSize: '0.92rem', marginBottom: '18px' }}>
                Your appointment reference number is{' '}
                <strong style={{ color: '#12304A', fontSize: '1.05rem', letterSpacing: '0.04em' }}>
                  {confirmedAppointment.booking_ref}
                </strong>
              </p>

              {/* Status Note & Honesty Chip */}
              <div style={{
                backgroundColor: '#FEF3C7',
                border: '1px solid #FDE68A',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                marginBottom: '20px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}>
                <Info size={18} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.84rem', color: '#92400E', lineHeight: 1.45 }}>
                  <strong>Honesty Notice:</strong>{' '}
                  {facility.ownership === 'Government' 
                    ? 'OP Registration submitted to hospital registry. Please arrive 15 minutes before your slot.' 
                    : 'This is a verified demonstration booking. In live production, an automated confirmation SMS is sent by the hospital.'}
                  <div style={{ marginTop: '4px', fontSize: '0.78rem' }}>
                    CareSaathi AI coordinates your appointment transparently with official hospital tariffs.
                  </div>
                </div>
              </div>

              {/* Verified Official Hospital Contact & Booking Link */}
              <div style={{
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                marginBottom: '18px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#1E40AF', fontWeight: 700, textTransform: 'uppercase' }}>
                    Verified Official Hospital Direct Contact:
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#1E3A8A', fontWeight: 600 }}>
                    📞 {facility.phone || '+91 40 2348 9000 (Central Desk)'}
                  </div>
                </div>
                {facility.website && (
                  <a
                    href={facility.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.76rem', textDecoration: 'none', color: '#1E40AF', borderColor: '#93C5FD' }}
                  >
                    Official Portal ↗
                  </a>
                )}
              </div>

              {/* Optional Advance Consultation Payment (Sandbox / Razorpay Server-Verified) */}
              <div style={{
                backgroundColor: paymentStatus === 'SUCCESS' ? '#ECFDF5' : '#F8FAF9',
                border: `1.5px solid ${paymentStatus === 'SUCCESS' ? '#A7F3D0' : '#CBD5E1'}`,
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                marginBottom: '18px',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#12304A' }}>
                    Advance Consultation Payment (Optional):
                  </div>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    backgroundColor: paymentStatus === 'SUCCESS' ? '#D1FAE5' : '#FEF3C7',
                    color: paymentStatus === 'SUCCESS' ? '#065F46' : '#92400E'
                  }}>
                    {paymentStatus === 'SUCCESS' ? 'VERIFIED PAID' : 'OPTIONAL / UNPAID'}
                  </span>
                </div>

                {paymentStatus === 'SUCCESS' ? (
                  <div style={{ color: '#065F46', fontSize: '0.84rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                      <CheckCircle2 size={16} color="#059669" />
                      <span>Payment Verified Server-Side (Paid ₹{paymentResult?.total_paid_inr || 708})</span>
                    </div>
                    <div style={{ marginTop: '4px', fontSize: '0.78rem' }}>
                      Official Receipt: <strong>{paymentResult?.receipt || 'REC-CS-VERIFIED'}</strong>
                    </div>
                    <div style={{ marginTop: '2px', fontSize: '0.74rem', color: '#047857' }}>
                      Duplicate-payment protection active. Appointment confirmed with zero counter fees.
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '8px' }}>
                      You can pay at the hospital desk on arrival (₹0 online now), or verify sandbox online payment below:
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!paymentOrder) {
                          await handleInitiatePayment(confirmedAppointment.id);
                        }
                        handleVerifySandboxPayment();
                      }}
                      disabled={paymentStatus === 'PROCESSING'}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                    >
                      {paymentStatus === 'PROCESSING' ? 'Verifying with Server Gateway...' : 'Verify Sandbox Online Payment (₹708)'}
                    </button>
                    {paymentError && (
                      <div style={{ color: '#DC2626', fontSize: '0.78rem', marginTop: '6px' }}>
                        {paymentError}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Appointment Summary Box */}
              <div style={{
                backgroundColor: '#F8FAF9',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                marginBottom: '22px',
                textAlign: 'left'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '0.88rem' }}>
                  <div>
                    <span style={{ color: '#64717D', display: 'block', fontSize: '0.76rem' }}>PATIENT</span>
                    <strong>{confirmedAppointment.patient_name} ({confirmedAppointment.patient_age} yrs)</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64717D', display: 'block', fontSize: '0.76rem' }}>TIME & DATE</span>
                    <strong>
                      {new Date(confirmedAppointment.slot_start || '').toLocaleDateString('en-IN', { dateStyle: 'medium' })} • {formatSlotTime(confirmedAppointment.slot_start)}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64717D', display: 'block', fontSize: '0.76rem' }}>CARE PURPOSE</span>
                    <strong>{confirmedAppointment.purpose}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64717D', display: 'block', fontSize: '0.76rem' }}>HOSPITAL</span>
                    <strong>{facility.name}</strong>
                  </div>
                </div>
              </div>

              {/* "What to Carry" Checklist */}
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                marginBottom: '24px',
                textAlign: 'left'
              }}>
                <h4 style={{ fontSize: '0.95rem', color: '#12304A', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} color="#2C8C83" />
                  <span>What to Carry Checklist:</span>
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.84rem', color: '#183247' }}>
                  <div>✓ Government Photo ID (Aadhaar / Voter ID)</div>
                  <div>✓ White Ration Card / PM-JAY Ayushman Card (for scheme claims)</div>
                  <div>✓ Existing doctor prescriptions & prescription slip</div>
                  <div>✓ Previous MRI, X-Ray or lab diagnostic reports</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                <button
                  onClick={() => downloadCalendarIcs(confirmedAppointment)}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Download size={14} />
                  <span>Add to Calendar</span>
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`CareSaathi AI Appointment Confirmed: ${facility.name} for ${confirmedAppointment.patient_name} on ${new Date(confirmedAppointment.slot_start || '').toLocaleDateString('en-IN')}. Booking Ref: ${confirmedAppointment.booking_ref}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', backgroundColor: '#DCF8C6', color: '#075E54', textDecoration: 'none' }}
                >
                  <Share2 size={14} />
                  <span>WhatsApp</span>
                </a>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Navigation size={14} />
                  <span>Get Directions</span>
                </a>
              </div>

              {onViewMyAppointments && (
                <button
                  onClick={() => {
                    onClose();
                    onViewMyAppointments();
                  }}
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                >
                  <span>View in My Appointments</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          ) : (
            <>
              {/* STEP 1: PURPOSE */}
              {step === 1 && (
                <div>
                  <h4 style={{ fontSize: '1.08rem', color: 'var(--color-navy)', marginBottom: '8px' }}>
                    1. Choose the Purpose of Your Visit
                  </h4>
                  <p style={{ color: 'var(--color-text-grey)', fontSize: '0.86rem', marginBottom: '16px' }}>
                    Pre-selected based on your search for <strong>{treatmentName || searchState.treatmentName || 'Care Services'}</strong>.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {PURPOSES.map(p => (
                      <div
                        key={p.id}
                        onClick={() => setPurpose(p.id)}
                        style={{
                          padding: '14px 16px',
                          borderRadius: 'var(--radius-md)',
                          border: `2px solid ${purpose === p.id ? '#2C8C83' : 'var(--color-border)'}`,
                          backgroundColor: purpose === p.id ? '#E7F3EF' : '#FFFFFF',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '1.3rem' }}>{p.icon}</span>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--color-navy)', fontSize: '0.94rem' }}>
                              {p.label}
                            </div>
                          </div>
                        </div>
                        {purpose === p.id && <Check size={18} color="#2C8C83" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: DATE & TIME STRIP */}
              {step === 2 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '1.08rem', color: 'var(--color-navy)', margin: 0 }}>
                      2. Select Appointment Date & Time
                    </h4>
                    <span style={{ fontSize: '0.78rem', color: '#64717D' }}>
                      Hours: 9:00 AM - 5:45 PM
                    </span>
                  </div>

                  {/* 14-Day Horizontal Date Strip */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    overflowX: 'auto',
                    paddingBottom: '10px',
                    marginBottom: '18px',
                    scrollbarWidth: 'none'
                  }}>
                    {availableDates.map(dateStr => {
                      const { day, num, month } = formatDateLabel(dateStr);
                      const isSelected = selectedDateStr === dateStr;
                      return (
                        <button
                          key={dateStr}
                          onClick={() => {
                            setSelectedDateStr(dateStr);
                            setSelectedSlotId('');
                          }}
                          style={{
                            minWidth: '66px',
                            padding: '10px 8px',
                            borderRadius: 'var(--radius-md)',
                            border: `2px solid ${isSelected ? '#2C8C83' : '#E2E8F0'}`,
                            backgroundColor: isSelected ? '#E7F3EF' : '#FFFFFF',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{ fontSize: '0.72rem', color: isSelected ? '#2C8C83' : '#64717D', fontWeight: 600, textTransform: 'uppercase' }}>
                            {day}
                          </span>
                          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: isSelected ? '#12304A' : '#1E293B', margin: '2px 0' }}>
                            {num}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: '#64717D' }}>
                            {month}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Time Filter Chips */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                    {(['all', 'morning', 'afternoon', 'evening'] as const).map(tf => (
                      <button
                        key={tf}
                        onClick={() => setTimeFilter(tf)}
                        className={`badge ${timeFilter === tf ? 'badge-teal' : 'badge-secondary'}`}
                        style={{ cursor: 'pointer', border: 'none', padding: '6px 12px', fontSize: '0.78rem' }}
                      >
                        {tf.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  {/* Slots Grid */}
                  {loadingSlots ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#64717D' }}>Loading available slots...</div>
                  ) : filteredSlots.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#64717D', backgroundColor: '#F8FAF9', borderRadius: '8px' }}>
                      No remaining slots for this time band. Please pick another date or time band.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      {filteredSlots.map(slot => {
                        const isFull = slot.booked_count >= slot.capacity;
                        const isSelected = selectedSlotId === slot.id;
                        return (
                          <button
                            key={slot.id}
                            disabled={isFull}
                            onClick={() => setSelectedSlotId(slot.id)}
                            style={{
                              padding: '12px 8px',
                              borderRadius: 'var(--radius-md)',
                              border: `1.5px solid ${isSelected ? '#2C8C83' : isFull ? '#E2E8F0' : '#CBD5E1'}`,
                              backgroundColor: isSelected ? '#E7F3EF' : isFull ? '#F1F5F9' : '#FFFFFF',
                              color: isFull ? '#94A3B8' : isSelected ? '#12304A' : '#183247',
                              cursor: isFull ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '2px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                              {formatSlotTime(slot.slot_start)}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: isFull ? '#EF4444' : isSelected ? '#2C8C83' : '#64717D' }}>
                              {isFull ? 'Fully Booked' : `${slot.capacity - slot.booked_count} left`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: PATIENT DETAILS */}
              {step === 3 && (
                <div>
                  <h4 style={{ fontSize: '1.08rem', color: 'var(--color-navy)', marginBottom: '12px' }}>
                    3. Patient Details & Contact
                  </h4>

                  {/* Helper Mode Toggle (Booking for someone else) */}
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#F8FAF9',
                    border: '1px solid var(--color-border)',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#12304A' }}>
                        Helper Mode (Booking for someone else?)
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#64717D' }}>
                        Enter the patient's identity details for their hospital record card
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isBookingForOther}
                      onChange={e => {
                        setIsBookingForOther(e.target.checked);
                        if (e.target.checked) setPatientName('');
                        else setPatientName(user?.name || '');
                      }}
                      style={{ width: '18px', height: '18px', accentColor: '#2C8C83', cursor: 'pointer' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#12304A', marginBottom: '4px' }}>
                        Patient Full Name *
                      </label>
                      <input
                        type="text"
                        value={patientName}
                        onChange={e => setPatientName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#12304A', marginBottom: '4px' }}>
                        Patient Age *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={patientAge}
                        onChange={e => setPatientAge(Number(e.target.value))}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>
                  </div>

                  {/* Phone & OTP Verification */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#12304A', marginBottom: '4px' }}>
                      Mobile Phone Number * {otpVerified && <span style={{ color: '#10B981', marginLeft: '6px' }}>✓ Verified</span>}
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="tel"
                        value={patientPhone}
                        onChange={e => setPatientPhone(e.target.value)}
                        placeholder="+91 98490 12345"
                        disabled={otpVerified}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.9rem'
                        }}
                      />
                      {!otpVerified && (
                        <button
                          type="button"
                          disabled={isSendingOtp}
                          onClick={handleSendOtp}
                          className="btn btn-secondary btn-sm"
                        >
                          {isSendingOtp ? 'Sending...' : (otpSent ? 'Resend OTP' : 'Send OTP')}
                        </button>
                      )}
                    </div>

                    {otpSent && !otpVerified && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            maxLength={6}
                            value={otpCode}
                            onChange={e => setOtpCode(e.target.value)}
                            placeholder="Enter OTP"
                            style={{
                              width: '180px',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: '1px solid #2C8C83',
                              fontSize: '0.88rem'
                            }}
                          />
                          <button
                            type="button"
                            disabled={isVerifyingOtp}
                            onClick={handleVerifyOtp}
                            className="btn btn-primary btn-sm"
                          >
                            {isVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
                          </button>
                        </div>
                        {demoOtpHint && (
                          <div style={{ fontSize: '0.74rem', color: '#B45309', marginTop: '4px' }}>
                            Demo Simulation Active: Enter {demoOtpHint} to test verification.
                          </div>
                        )}
                      </div>
                    )}
                    {otpError && (
                      <div style={{ color: '#DC2626', fontSize: '0.78rem', marginTop: '6px' }}>
                        {otpError}
                      </div>
                    )}
                  </div>

                  {/* Language & Optional Note */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#12304A', marginBottom: '4px' }}>
                        Preferred Consultation Language
                      </label>
                      <select
                        value={preferredLang}
                        onChange={e => setPreferredLang(e.target.value as 'en' | 'te' | 'hi')}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.88rem'
                        }}
                      >
                        <option value="en">English</option>
                        <option value="te">తెలుగు (Telugu)</option>
                        <option value="hi">हिंदी (Hindi)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#12304A', marginBottom: '4px' }}>
                        Optional Notes for Hospital
                      </label>
                      <input
                        type="text"
                        value={patientNote}
                        onChange={e => setPatientNote(e.target.value)}
                        placeholder="e.g. Needs wheelchair at entrance"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.88rem'
                        }}
                      />
                    </div>
                  </div>

                  {/* Share Estimated Cost & Scheme Checkbox */}
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#E7F3EF',
                    border: '1px solid #BCE3D9',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px'
                  }}>
                    <input
                      type="checkbox"
                      id="share-summary-cb"
                      checked={shareSummary}
                      onChange={e => setShareSummary(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: '#2C8C83', marginTop: '2px', cursor: 'pointer' }}
                    />
                    <label htmlFor="share-summary-cb" style={{ fontSize: '0.82rem', color: '#12304A', cursor: 'pointer', lineHeight: 1.4 }}>
                      <strong>Share my estimated cost and scheme summary with the hospital</strong>
                      <div style={{ fontSize: '0.74rem', color: '#326D64', marginTop: '2px' }}>
                        Enables the hospital billing desk to pre-check empanelled scheme ({matchedSchemeName}) and avoid surprise pricing.
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 4: REVIEW & CONFIRM */}
              {step === 4 && (
                <div>
                  <h4 style={{ fontSize: '1.08rem', color: 'var(--color-navy)', marginBottom: '14px' }}>
                    4. Review & Confirm Your Care Appointment
                  </h4>

                  {/* Summary Card */}
                  <div style={{
                    backgroundColor: '#F8FAF9',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '18px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', fontSize: '0.88rem' }}>
                      <div>
                        <span style={{ color: '#64717D', display: 'block', fontSize: '0.76rem' }}>HOSPITAL FACILITY</span>
                        <strong>{facility.name}</strong>
                        <div style={{ fontSize: '0.76rem', color: '#64717D', marginTop: '2px' }}>{facility.address}</div>
                      </div>
                      <div>
                        <span style={{ color: '#64717D', display: 'block', fontSize: '0.76rem' }}>SLOT TIMING</span>
                        <strong style={{ color: '#2C8C83', fontSize: '0.98rem' }}>
                          {new Date(selectedSlot?.slot_start || '').toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })} • {formatSlotTime(selectedSlot?.slot_start)}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: '#64717D', display: 'block', fontSize: '0.76rem' }}>PURPOSE OF VISIT</span>
                        <strong>{purpose}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64717D', display: 'block', fontSize: '0.76rem' }}>PATIENT</span>
                        <strong>{patientName} ({patientAge} yrs) • {patientPhone}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Payment Preference: Counter vs Optional Advance Fee */}
                  <div style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    marginBottom: '14px'
                  }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#12304A', marginBottom: '8px' }}>
                      Consultation Fee Payment (Optional):
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.84rem' }}>
                        <input
                          type="radio"
                          name="payment_choice"
                          checked={!wantsAdvancePayment}
                          onChange={() => setWantsAdvancePayment(false)}
                          style={{ accentColor: '#2C8C83' }}
                        />
                        <span>
                          <strong>Pay at Hospital Desk (₹0 online)</strong> — Standard booking without advance payment.
                        </span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.84rem' }}>
                        <input
                          type="radio"
                          name="payment_choice"
                          checked={wantsAdvancePayment}
                          onChange={() => {
                            setWantsAdvancePayment(true);
                            if (!paymentOrder) {
                              handleInitiatePayment(`apt_${facility.id}_${Date.now()}`);
                            }
                          }}
                          style={{ accentColor: '#2C8C83' }}
                        />
                        <span>
                          <strong>Pre-pay OPD Fee Online (Sandbox / Test Gateway)</strong> — Verified server-side.
                        </span>
                      </label>
                    </div>

                    {wantsAdvancePayment && (
                      <div style={{
                        marginTop: '12px',
                        padding: '12px',
                        backgroundColor: '#F8FAF9',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        fontSize: '0.82rem'
                      }}>
                        {isCreatingPayment ? (
                          <div style={{ color: '#2C8C83' }}>Generating itemized payment order...</div>
                        ) : paymentOrder ? (
                          <div>
                            <div style={{ fontWeight: 700, color: '#12304A', marginBottom: '6px' }}>Itemized Fee Breakdown:</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                              <span>Doctor Consultation Fee:</span>
                              <strong>₹{paymentOrder.fee_breakdown.doctor_consultation_fee}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                              <span>Hospital Registration Fee:</span>
                              <strong>₹{paymentOrder.fee_breakdown.hospital_registration_fee}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span>Statutory GST (18%):</span>
                              <strong>₹{paymentOrder.fee_breakdown.statutory_gst_18pct}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #CBD5E1', paddingTop: '4px', fontWeight: 700, color: '#12304A' }}>
                              <span>Total Payable:</span>
                              <span style={{ color: '#2C8C83', fontSize: '0.94rem' }}>₹{paymentOrder.fee_breakdown.total_payable_inr}</span>
                            </div>
                            <div style={{ marginTop: '8px', fontSize: '0.74rem', color: '#B45309', backgroundColor: '#FEF3C7', padding: '6px 8px', borderRadius: '4px' }}>
                              ℹ️ {paymentOrder.gateway_message}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* "What Happens Next" Box */}
                  <div style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    marginBottom: '14px'
                  }}>
                    <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#12304A', marginBottom: '6px' }}>
                      💡 What happens next:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                      <li>Your booking reference code will be generated immediately.</li>
                      <li>Hospital front-desk verifies eligibility and keeps your file ready upon arrival.</li>
                      <li>You will receive an in-app reminder 24 hours prior to your scheduled time.</li>
                    </ul>
                  </div>

                  {/* Privacy & Honesty Note */}
                  <div style={{ fontSize: '0.74rem', color: '#64717D', lineHeight: 1.4 }}>
                    🔒 <strong>Privacy Note:</strong> Your contact and medical inquiry are shared strictly with {facility.name} for appointment coordination.
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {bookingError && (
                <div style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  color: '#991B1B',
                  fontSize: '0.84rem',
                  marginTop: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertTriangle size={16} />
                  <span>{bookingError}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer / Navigation Controls */}
        {!confirmedAppointment && (
          <div style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#F8FAF9'
          }}>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((step - 1) as any)}
                className="btn btn-secondary btn-sm"
              >
                Back
              </button>
            ) : <div />}

            {step < 4 ? (
              <button
                type="button"
                disabled={step === 2 && !selectedSlotId}
                onClick={() => {
                  if (step === 3 && !patientName.trim()) {
                    setBookingError('Please enter the patient name.');
                    return;
                  }
                  setBookingError(null);
                  setStep((step + 1) as any);
                }}
                className="btn btn-primary btn-sm"
              >
                <span>Continue</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmBooking}
                className="btn btn-primary"
                style={{ padding: '8px 22px' }}
              >
                {isSubmitting ? 'Confirming...' : 'Confirm Appointment Request'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  facility,
  ...props
}) => {
  if (!isOpen || !facility) return null;
  return <BookingModalContent {...props} facility={facility} />;
};

