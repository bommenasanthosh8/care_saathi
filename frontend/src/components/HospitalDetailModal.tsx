import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Phone, 
  Globe, 
  ExternalLink, 
  ShieldCheck, 
  CheckCircle2, 
  Bed, 
  Calendar, 
  Layers, 
  Star, 
  Clock, 
  Navigation,
  Accessibility,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { FacilityDTO } from '../services/api';
import { useSearch } from '../context/SearchContext';
import { getDataQualityBadge, googlePlacesService } from '../services/googlePlacesService';

interface HospitalDetailModalProps {
  facility: FacilityDTO | null;
  onClose: () => void;
  onEstimateHere: (facility: FacilityDTO) => void;
  onBookAppointment?: (facility: FacilityDTO) => void;
}

interface HospitalDetailModalContentProps {
  facility: FacilityDTO;
  onClose: () => void;
  onEstimateHere: (facility: FacilityDTO) => void;
  onBookAppointment?: (facility: FacilityDTO) => void;
}

const HospitalDetailModalContent: React.FC<HospitalDetailModalContentProps> = ({
  facility,
  onClose,
  onEstimateHere,
  onBookAppointment
}) => {
  const { searchState, addToComparison, removeFromComparison } = useSearch();
  const [imageError, setImageError] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const isCompared = searchState.comparisonList.some(f => f.id === facility.id);
  const initials = facility.initials || facility.name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
  
  // Google Places Enrichment
  const enrichment = googlePlacesService.getEnrichment(facility.id);
  const dataQuality = getDataQualityBadge(facility);

  // Gallery Photos (up to 5)
  const primaryPhoto = facility.image_url || `/images/hospitals/${facility.id}.jpg`;
  const photosList = enrichment?.photos?.length 
    ? enrichment.photos 
    : [primaryPhoto];

  const currentPhoto = photosList[activePhotoIdx] || primaryPhoto;

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
        className="modal-content detail-panel" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxWidth: '720px', 
          width: '100%',
          maxHeight: '92vh',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
        }}
      >
        <style>{`
          @media (max-width: 767px) {
            .detail-panel {
              position: fixed !important;
              bottom: 0 !important;
              left: 0 !important;
              right: 0 !important;
              max-height: 90vh !important;
              border-radius: 20px 20px 0 0 !important;
              margin: 0 !important;
            }
          }
        `}</style>

        {/* Modal Header */}
        <div style={{
          padding: '16px 22px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#F8FAF9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`badge ${dataQuality.badgeClass}`} style={{ fontSize: '0.72rem' }}>
              {dataQuality.label}
            </span>
            <span className="badge badge-navy" style={{ fontSize: '0.72rem' }}>
              {facility.ownership} Facility
            </span>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-grey)', padding: '4px' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          
          {/* Hero Image Banner with Gallery */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '240px',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '14px',
            backgroundColor: '#12304A'
          }}>
            <img
              src={imageError ? '/images/hospitals/hospital_image_unavailable.svg' : (currentPhoto || `/images/hospitals/${facility.id}.jpg`)}
              alt={facility.name}
              onError={() => setImageError(true)}
              onClick={() => setIsLightboxOpen(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
            />

            {/* Google Attribution & Lightbox trigger */}
            <div style={{
              position: 'absolute',
              bottom: '8px',
              right: '10px',
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              color: '#E2E8F0',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.7rem',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>📷 {facility.image_source || enrichment?.attribution || 'Verified Directory Photo'}</span>
              {photosList.length > 1 && (
                <button
                  onClick={() => setIsLightboxOpen(true)}
                  style={{ background: 'transparent', border: 'none', color: '#38BDF8', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600 }}
                >
                  View All ({photosList.length})
                </button>
              )}
            </div>

            {/* Open now chip */}
            {enrichment?.isOpenNow && (
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                backgroundColor: '#10B981',
                color: 'white',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '0.72rem',
                fontWeight: 700
              }}>
                Open Now
              </div>
            )}
          </div>

          {/* Photo Gallery Thumbnails (Up to 5) */}
          {photosList.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto' }}>
              {photosList.slice(0, 5).map((p, idx) => (
                <img
                  key={idx}
                  src={p}
                  alt={`Facility photo ${idx + 1}`}
                  onClick={() => setActivePhotoIdx(idx)}
                  style={{
                    width: '64px',
                    height: '48px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    border: `2px solid ${activePhotoIdx === idx ? '#2C8C83' : '#E2E8F0'}`
                  }}
                />
              ))}
            </div>
          )}

          {/* Title & Key Stats */}
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.45rem', color: 'var(--color-navy)', marginBottom: '6px', fontWeight: 800 }}>
              {facility.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '0.86rem', color: '#64717D' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={15} color="#2C8C83" />
                <span>{facility.address}</span>
              </div>
              {facility.distance_km && (
                <span className="badge badge-navy" style={{ fontSize: '0.74rem' }}>
                  📍 {facility.distance_km} km away
                </span>
              )}
            </div>
          </div>

          {/* Google Places Rating & Reviews Box */}
          {(enrichment?.rating || facility.rating) && (
            <div style={{
              backgroundColor: '#FEF3C7',
              border: '1px solid #FDE68A',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Star size={18} fill="#D97706" color="#D97706" />
                <span style={{ fontWeight: 800, fontSize: '1rem', color: '#92400E' }}>
                  {enrichment?.rating || facility.rating} / 5.0
                </span>
                {enrichment?.userRatingCount && (
                  <span style={{ fontSize: '0.84rem', color: '#B45309' }}>
                    ({enrichment.userRatingCount.toLocaleString()} Google reviews)
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.72rem', color: '#92400E' }}>
                Google rating (display-only, not a quality guarantee)
              </span>
            </div>
          )}

          {/* Timings & Accessibility */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAF9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: '#12304A', marginBottom: '4px' }}>
                <Clock size={14} color="#2C8C83" />
                <span>WORKING HOURS</span>
              </div>
              <div style={{ fontSize: '0.84rem', color: '#475569' }}>
                {enrichment?.openingHoursText?.[0] || 'OPD: 9:00 AM - 5:00 PM • Emergency: 24/7'}
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAF9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: '#12304A', marginBottom: '4px' }}>
                <Accessibility size={14} color="#2C8C83" />
                <span>ACCESSIBILITY</span>
              </div>
              <div style={{ fontSize: '0.84rem', color: '#475569' }}>
                {enrichment?.accessibility?.wheelchairAccessibleEntrance !== false 
                  ? '✓ Wheelchair accessible entrance & ramp' 
                  : 'Standard facility entrance'}
              </div>
            </div>
          </div>

          {/* Pricing & Tariffs */}
          <div style={{
            backgroundColor: '#E7F3EF',
            border: '1px solid #BCE3D9',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#2C8C83', textTransform: 'uppercase' }}>
              Estimated Procedure Tariff Range
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#12304A', margin: '4px 0' }}>
              {facility.estimated_cost_min === 0 
                ? "₹0 (Free under State Health Security)" 
                : `₹${facility.estimated_cost_min?.toLocaleString('en-IN')} - ₹${facility.estimated_cost_max?.toLocaleString('en-IN')}`}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#326D64' }}>
              {facility.pricing_status || "Standard Reference Tariff • Verified with state health directorate"}
            </div>
          </div>

          {/* Empanelled Schemes */}
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#12304A', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} color="#2C8C83" />
              <span>Empanelled Government & Health Schemes</span>
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {facility.empanelled_schemes.map(s => (
                <span key={s} className="badge badge-teal" style={{ fontSize: '0.78rem' }}>
                  ✓ {s === 'aarogyasri' ? 'Aarogyasri (Telangana)' : s === 'pm_jay' ? 'Ayushman Bharat (PM-JAY)' : s.toUpperCase()}
                </span>
              ))}
            </div>
          </div>

          {/* Contact Details */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.86rem', color: '#475569' }}>
            {facility.phone && (
              <a href={`tel:${facility.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2C8C83', fontWeight: 600 }}>
                <Phone size={14} />
                <span>{facility.phone}</span>
              </a>
            )}
            {facility.website && (
              <a href={facility.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2C8C83', fontWeight: 600 }}>
                <Globe size={14} />
                <span>Visit Official Website</span>
              </a>
            )}
          </div>
        </div>

        {/* Sticky Bottom Action Bar */}
        <div style={{
          padding: '14px 22px',
          borderTop: '1px solid var(--color-border)',
          backgroundColor: '#F8FAF9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px'
        }}>
          {/* Compare Button */}
          <button
            onClick={() => {
              if (isCompared) removeFromComparison(facility.id);
              else addToComparison(facility as any);
            }}
            className="btn btn-secondary btn-sm"
            style={{
              backgroundColor: isCompared ? '#E7F3EF' : '#FFFFFF',
              borderColor: isCompared ? '#2C8C83' : '#E2E8F0',
              color: isCompared ? '#2C8C83' : '#12304A'
            }}
          >
            <Layers size={14} />
            <span>{isCompared ? 'Compared' : '+ Compare'}</span>
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
            >
              <Navigation size={14} />
              <span>Directions</span>
            </a>

            {/* Book Appointment Primary Button */}
            {onBookAppointment && (
              <button
                onClick={() => {
                  onClose();
                  onBookAppointment(facility);
                }}
                className="btn btn-primary"
                style={{ padding: '8px 20px', fontWeight: 700 }}
              >
                <Calendar size={15} />
                <span>Book Appointment</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal for Photo Gallery */}
      {isLightboxOpen && (
        <div 
          className="lightbox-overlay" 
          onClick={() => setIsLightboxOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '900px', width: '100%', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <img 
              src={photosList[activePhotoIdx]} 
              alt="Lightbox hospital view" 
              style={{ maxHeight: '80vh', maxWidth: '100%', borderRadius: '8px', objectFit: 'contain' }}
            />
            <button 
              onClick={() => setIsLightboxOpen(false)}
              style={{ position: 'absolute', top: '-40px', right: 0, background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
            >
              <X size={28} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const HospitalDetailModal: React.FC<HospitalDetailModalProps> = ({
  facility,
  ...props
}) => {
  if (!facility) return null;
  return <HospitalDetailModalContent {...props} facility={facility} />;
};

