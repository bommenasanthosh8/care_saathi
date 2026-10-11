import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useSearch } from '../context/SearchContext';
import { 
  MapPin, 
  Search, 
  Navigation, 
  Building2, 
  AlertTriangle, 
  RefreshCw,
  Map as MapIcon,
  List as ListIcon,
  ShieldCheck,
  Calendar,
  X,
  Layers,
  ChevronDown,
  Compass,
  Zap
} from 'lucide-react';
import { api, FacilityDTO, TreatmentDTO } from '../services/api';
import { HospitalCard } from '../components/HospitalCard';
import { HospitalDetailModal } from '../components/HospitalDetailModal';
import { HospitalMapContainer } from '../components/maps/HospitalMapContainer';
import { BookingModal } from '../components/BookingModal';
import { PanIndiaLocationPicker } from '../components/PanIndiaLocationPicker';
import { googleEnrichmentService } from '../services/googleEnrichmentService';
import './HospitalDiscoveryPage.css';

export const HospitalDiscoveryPage: React.FC = () => {
  const { t } = useLanguage();
  const { searchState, setLocation, removeFromComparison, clearComparison } = useSearch();

  const [facilities, setFacilities] = useState<FacilityDTO[]>([]);
  const [totalAvailableCount, setTotalAvailableCount] = useState<number>(0);
  const [treatmentsList, setTreatmentsList] = useState<TreatmentDTO[]>([]);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string>(searchState.treatmentId || 'knee_replacement');
  const [city, setCity] = useState<string>(searchState.city || 'Hyderabad');
  const [stateName, setStateName] = useState<string>(searchState.state || 'Telangana');
  const [locality, setLocality] = useState<string>(searchState.locality || '');
  const [pinCode, setPinCode] = useState<string>(searchState.pinCode || '');
  
  // Geolocation
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(() => {
    if (searchState.lat && searchState.lng) {
      return { lat: searchState.lat, lng: searchState.lng };
    }
    return null;
  });
  const [isLiveGps, setIsLiveGps] = useState<boolean>(Boolean(searchState.isLiveGps));
  const [gpsAccuracy, setGpsAccuracy] = useState<number | undefined>(searchState.gpsAccuracy);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);

  // Filters & Sorting
  const [ownershipFilter, setOwnershipFilter] = useState<string>('All');
  const [schemeFilter, setSchemeFilter] = useState<string>('All');
  const [radiusKm, setRadiusKm] = useState<number>(30);
  const [sortBy, setSortBy] = useState<string>('best_match');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);

  // View modes: 'split' | 'list' | 'map' (saved in sessionStorage)
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('caresaathi_hospital_view_mode');
      if (saved === 'split' || saved === 'list' || saved === 'map') return saved;
    }
    return 'split';
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Interactive Map Sync
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [hoveredFacilityId, setHoveredFacilityId] = useState<string | null>(null);

  // Modals
  const [selectedFacilityForModal, setSelectedFacilityForModal] = useState<FacilityDTO | null>(null);
  const [bookingFacility, setBookingFacility] = useState<FacilityDTO | null>(null);

  const cardListRef = useRef<HTMLDivElement>(null);
  const localityInputRef = useRef<HTMLInputElement>(null);

  // Persist view mode choice
  const handleSetViewMode = (mode: 'split' | 'list' | 'map') => {
    setViewMode(mode);
    try {
      sessionStorage.setItem('caresaathi_hospital_view_mode', mode);
    } catch {}
  };

  // Sync when searchState updates globally
  useEffect(() => {
    if (searchState.city) setCity(searchState.city);
    if (searchState.state) setStateName(searchState.state);
    if (searchState.locality !== undefined) setLocality(searchState.locality);
    if (searchState.pinCode !== undefined) setPinCode(searchState.pinCode);
    if (searchState.lat && searchState.lng) {
      setUserCoords({ lat: searchState.lat, lng: searchState.lng });
    } else {
      setUserCoords(null);
    }
    setIsLiveGps(Boolean(searchState.isLiveGps));
    setGpsAccuracy(searchState.gpsAccuracy);
  }, [searchState.city, searchState.state, searchState.locality, searchState.pinCode, searchState.lat, searchState.lng, searchState.isLiveGps, searchState.gpsAccuracy]);

  useEffect(() => {
    api.getTreatments().then(setTreatmentsList).catch(console.error);
  }, []);

  useEffect(() => {
    fetchFacilities();
  }, [selectedTreatmentId, city, locality, pinCode, ownershipFilter, schemeFilter, sortBy, userCoords, radiusKm, verifiedOnly]);

  const fetchFacilities = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await api.getFacilities({
        lat: userCoords?.lat,
        lng: userCoords?.lng,
        city: city || undefined,
        locality: locality || undefined,
        pin: pinCode || undefined,
        treatment_id: selectedTreatmentId,
        ownership: ownershipFilter,
        scheme: schemeFilter,
        radius: (userCoords && radiusKm !== 999) ? radiusKm : undefined,
        sort: sortBy,
        verified_only: verifiedOnly
      });

      // Enrich top results with exact road distance via Routes API proxy if coordinates available
      let enrichedWithRoad = data;
      if (userCoords) {
        enrichedWithRoad = await googleEnrichmentService.enrichRoadDistances(userCoords, data);
      }

      // Asynchronously enrich top 5 facilities with Google Place details & photos
      const topBatch = enrichedWithRoad.slice(0, 8);
      Promise.all(topBatch.map(f => googleEnrichmentService.matchGooglePlace(f))).then((results) => {
        setFacilities(prev => prev.map(f => {
          const matchIdx = topBatch.findIndex(tb => tb.id === f.id);
          if (matchIdx !== -1 && results[matchIdx]) {
            const enrich = results[matchIdx]!;
            return {
              ...f,
              place_id: enrich.placeId,
              google_photos: enrich.photos,
              google_rating: enrich.rating,
              google_user_rating_count: enrich.userRatingCount,
              google_is_open_now: enrich.isOpenNow
            };
          }
          return f;
        }));
      }).catch(console.warn);

      // If sorting by nearest and road distance is available, re-sort by road distance
      if (sortBy === 'nearest') {
        enrichedWithRoad.sort((a, b) => {
          const distA = a.road_distance_km ?? a.distance_km ?? 999;
          const distB = b.road_distance_km ?? b.distance_km ?? 999;
          return distA - distB;
        });
      }

      setFacilities(enrichedWithRoad);
      if (totalAvailableCount === 0 || totalAvailableCount < enrichedWithRoad.length) {
        setTotalAvailableCount(enrichedWithRoad.length);
      }
      
      // Auto-select first facility for the docked card if none selected
      if (enrichedWithRoad.length > 0 && !selectedFacilityId) {
        setSelectedFacilityId(enrichedWithRoad[0].id);
      }
    } catch (err: any) {
      console.error("Failed to load facilities", err);
      setLoadError("Unable to load hospitals right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const requestDeviceLocation = () => {
    if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setGpsNotice("GPS requires a secure connection (HTTPS or localhost). Please enter your city, district, or PIN code manually.");
      return;
    }
    if (!navigator.geolocation) {
      setGpsNotice("Geolocation is not supported by your browser. Please enter your locality or PIN code manually.");
      return;
    }

    setGpsLoading(true);
    setGpsNotice(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        setIsLiveGps(true);
        setGpsAccuracy(accuracy);
        setLocation({
          city: city,
          state: stateName,
          lat: latitude,
          lng: longitude,
          isLiveGps: true,
          gpsAccuracy: accuracy
        });
        setGpsLoading(false);
        setGpsNotice(`GPS acquired successfully with ±${Math.round(accuracy)}m accuracy.`);
      },
      (err) => {
        setGpsLoading(false);
        setIsLiveGps(false);
        setGpsAccuracy(undefined);
        if (err.code === 1) {
          setGpsNotice("Location permission denied. Please enable location permissions in browser settings or use manual city/PIN search.");
        } else if (err.code === 2) {
          setGpsNotice("GPS position unavailable. Please search manually by city, district, or PIN code.");
        } else if (err.code === 3) {
          setGpsNotice("GPS location request timed out. Please try again or search manually.");
        } else {
          setGpsNotice(`Unable to acquire GPS coordinates (${err.message}). Please use manual search.`);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSelectFacilityFromMap = (fac: FacilityDTO) => {
    setSelectedFacilityId(fac.id);
    const cardEl = document.getElementById(`hospital-card-${fac.id}`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSearchThisArea = (newLat: number, newLng: number) => {
    setUserCoords({ lat: newLat, lng: newLng });
    setIsLiveGps(false);
    setGpsAccuracy(undefined);
  };

  // Currently selected facility for the docked map card
  const selectedFacility = useMemo(() => {
    if (!selectedFacilityId) return facilities[0] || null;
    return facilities.find(f => f.id === selectedFacilityId) || facilities[0] || null;
  }, [selectedFacilityId, facilities]);

  // Selected treatment object
  const activeTreatment = useMemo(() => {
    return treatmentsList.find(t => t.id === selectedTreatmentId);
  }, [treatmentsList, selectedTreatmentId]);

  // User Origin Text (e.g. Live GPS (±15m) or From: Banjara Hills, 500034)
  const originText = useMemo(() => {
    if (isLiveGps) {
      const acc = gpsAccuracy ? ` (±${Math.round(gpsAccuracy)}m)` : '';
      return `Live GPS${acc}${city ? ` in ${city}` : ''}`;
    }
    if (locality && pinCode) return `${locality}, ${pinCode}`;
    if (locality) return `${locality}, ${city}`;
    if (pinCode) return `${city} (${pinCode})`;
    return `${city || 'All India'}`;
  }, [isLiveGps, gpsAccuracy, locality, pinCode, city]);

  return (
    <div className="hospital-discovery-container">
      {/* 1. Page Header */}
      <div className="hospital-discovery-header">
        <div className="hospital-discovery-title-row">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-teal">Verified Healthcare Directory</span>
              <span className="badge badge-navy">
                📍 {radiusKm === 999 ? 'All Distances' : `Within ${radiusKm} km`}
              </span>
              {verifiedOnly && (
                <span className="badge badge-teal">✓ Verified Only Active</span>
              )}
            </div>
            <h1 style={{ fontSize: '2.1rem', color: '#12304A', marginBottom: '4px', fontWeight: 800 }}>
              Find Verified Hospitals & Care
            </h1>
            <p style={{ color: '#64717D', fontSize: '0.94rem', margin: 0 }}>
              Genuine hospital directory with exact road travel times, verified clinical departments, and government scheme empanelment.
            </p>

            {/* Origin indicator banner */}
            <div className="hospital-origin-banner">
              <Compass size={13} color="#0D9488" />
              <span>
                From: <strong>{originText}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  localityInputRef.current?.focus();
                  localityInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
              >
                Change
              </button>
            </div>

            {gpsNotice && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                marginTop: '8px',
                backgroundColor: isLiveGps ? '#F0FDF4' : '#FEF2F2',
                color: isLiveGps ? '#166534' : '#991B1B',
                border: `1px solid ${isLiveGps ? '#BBF7D0' : '#FECACA'}`
              }}>
                <span>{gpsNotice}</span>
                <button
                  type="button"
                  onClick={() => setGpsNotice(null)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'inherit', padding: 0 }}
                  aria-label="Dismiss notice"
                >
                  <X size={13} />
                </button>
              </div>
            )}
          </div>

          {/* View mode toggle (Split vs List only vs Map only) */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'flex', border: '1px solid #CBD5E1', borderRadius: '8px', overflow: 'hidden' }}>
              <button
                onClick={() => handleSetViewMode('split')}
                style={{
                  padding: '7px 13px',
                  border: 'none',
                  backgroundColor: viewMode === 'split' ? '#0D9488' : '#FFFFFF',
                  color: viewMode === 'split' ? 'white' : '#12304A',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 600
                }}
                title="Side-by-side list and interactive map"
              >
                <MapIcon size={14} />
                <span>Split</span>
              </button>
              <button
                onClick={() => handleSetViewMode('list')}
                style={{
                  padding: '7px 13px',
                  border: 'none',
                  backgroundColor: viewMode === 'list' ? '#0D9488' : '#FFFFFF',
                  color: viewMode === 'list' ? 'white' : '#12304A',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 600
                }}
                title="Full-width hospital cards list"
              >
                <ListIcon size={14} />
                <span>List only</span>
              </button>
              <button
                onClick={() => handleSetViewMode('map')}
                style={{
                  padding: '7px 13px',
                  border: 'none',
                  backgroundColor: viewMode === 'map' ? '#0D9488' : '#FFFFFF',
                  color: viewMode === 'map' ? 'white' : '#12304A',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 600
                }}
                title="Full-width interactive map with floating results"
              >
                <Compass size={14} />
                <span>Map only</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Pan-India Location Selector */}
      <div style={{ marginBottom: '16px' }}>
        <PanIndiaLocationPicker
          onLocationSelect={(loc) => {
            setCity(loc.city);
            setStateName(loc.state);
            setLocality(loc.district && loc.district !== loc.city ? loc.district : '');
            setPinCode(loc.pinCode || '');
            setUserCoords({ lat: loc.lat, lng: loc.lng });
          }}
        />
      </div>

      {/* 3. Sticky Filter Bar Above List */}
      <div className="hospital-sticky-filter-bar">
        {/* Top row: Procedure dropdown, Locality, Radius slider, GPS */}
        <div className="filter-row-top">
          <div className="filter-inputs-group">
            {/* Procedure Dropdown */}
            <div style={{ minWidth: '220px', flex: '1.2' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#12304A', marginBottom: '3px' }}>
                PROCEDURE / CONDITION
              </label>
              <select
                value={selectedTreatmentId}
                onChange={e => setSelectedTreatmentId(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.84rem', color: '#12304A', fontWeight: 600, backgroundColor: '#FFFFFF' }}
              >
                {treatmentsList.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Locality Search */}
            <div style={{ minWidth: '180px', flex: '1' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#12304A', marginBottom: '3px' }}>
                LOCALITY OR PIN CODE
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  ref={localityInputRef}
                  type="text"
                  value={locality}
                  onChange={e => {
                    const val = e.target.value;
                    setLocality(val);
                    if (/^\d{6}$/.test(val.trim())) {
                      setPinCode(val.trim());
                    } else {
                      setPinCode('');
                    }
                  }}
                  placeholder="e.g. Banjara Hills, 500034"
                  style={{ width: '100%', padding: '7px 10px 7px 28px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.84rem' }}
                />
                <Search size={13} color="#94A3B8" style={{ position: 'absolute', left: '9px', top: '10px' }} />
              </div>
            </div>

            {/* Distance Slider */}
            <div className="filter-slider-wrap">
              <span style={{ fontWeight: 600, fontSize: '0.76rem' }}>Distance:</span>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={radiusKm === 999 ? 50 : radiusKm}
                onChange={e => setRadiusKm(Number(e.target.value))}
              />
              <span style={{ fontWeight: 700, color: '#0D9488', minWidth: '44px' }}>
                {radiusKm === 999 ? 'All' : `${radiusKm} km`}
              </span>
              <button
                type="button"
                onClick={() => setRadiusKm(radiusKm === 999 ? 30 : 999)}
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: '0.72rem',
                  color: radiusKm === 999 ? '#0D9488' : '#64717D',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {radiusKm === 999 ? 'Limit' : 'No limit'}
              </button>
            </div>
          </div>

          {/* Device GPS button */}
          <button
            onClick={requestDeviceLocation}
            disabled={gpsLoading}
            className={`btn ${isLiveGps ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            style={{ padding: '6px 12px', fontSize: '0.8rem', height: '35px', display: 'flex', alignItems: 'center', gap: '6px' }}
            title={isLiveGps && gpsAccuracy ? `Live GPS active with ±${Math.round(gpsAccuracy)}m accuracy` : 'Acquire exact device GPS coordinates'}
          >
            <Navigation size={13} color={isLiveGps ? '#FFFFFF' : '#0D9488'} />
            <span>
              {gpsLoading ? 'Locating...' : isLiveGps ? `GPS Active (±${gpsAccuracy ? Math.round(gpsAccuracy) + 'm' : 'Live'})` : 'Use GPS'}
            </span>
          </button>
        </div>

        {/* Bottom row: Facility Type Chips, Scheme Chips, Verified Only, Sort, Counter */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            {/* Facility Type Chips */}
            <div className="filter-chip-group">
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64717D' }}>TYPE:</span>
              {['All', 'Government', 'Charitable/Trust', 'Private', 'Premium'].map(type => (
                <button
                  key={type}
                  type="button"
                  className={`filter-chip ${ownershipFilter === type ? (type === 'Government' ? 'active' : type === 'Charitable/Trust' ? 'active-amber' : type === 'Premium' ? 'active-purple' : 'active-blue') : ''}`}
                  onClick={() => setOwnershipFilter(type)}
                >
                  {type === 'Charitable/Trust' ? 'Charitable' : type}
                </button>
              ))}
            </div>

            {/* Scheme Chips */}
            <div className="filter-chip-group">
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64717D' }}>SCHEME:</span>
              {['All', 'pm_jay', 'aarogyasri', 'cghs', 'tpa'].map(scheme => {
                const label = scheme === 'pm_jay' ? 'PM-JAY' : scheme === 'aarogyasri' ? 'Aarogyasri' : scheme.toUpperCase();
                return (
                  <button
                    key={scheme}
                    type="button"
                    className={`filter-chip ${schemeFilter === scheme ? 'active' : ''}`}
                    onClick={() => setSchemeFilter(scheme)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Verified Only Toggle */}
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 600, color: '#12304A', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={e => setVerifiedOnly(e.target.checked)}
                style={{ accentColor: '#0D9488', cursor: 'pointer' }}
              />
              <span>Verified only</span>
            </label>
          </div>

          {/* Right side: Sort and Results Counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.74rem', color: '#64717D', fontWeight: 600 }}>Sort by:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{ border: '1px solid #CBD5E1', borderRadius: '6px', padding: '5px 8px', fontSize: '0.78rem', color: '#12304A', fontWeight: 600, backgroundColor: '#FFFFFF' }}
              >
                <option value="best_match">Best Match (Specialty Relevance)</option>
                <option value="nearest">Nearest Distance (Road / Live Traffic)</option>
                <option value="lowest_cost">Lowest Estimated Cost</option>
                <option value="rating">Highest Verified Rating</option>
              </select>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600, whiteSpace: 'nowrap' }}>
              Showing <strong>{facilities.length}</strong> of {totalAvailableCount || facilities.length} hospitals
            </div>
          </div>
        </div>

        {gpsNotice && (
          <div style={{ marginTop: '8px', color: '#12304A', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#F0FDF4', padding: '5px 10px', borderRadius: '6px' }}>
            <MapPin size={12} color="#0D9488" />
            <span>{gpsNotice}</span>
          </div>
        )}
      </div>

      {/* 4. Map-Only View Mode (Full-width map with floating interactive list) */}
      {viewMode === 'map' ? (
        <div className="map-only-container">
          <HospitalMapContainer
            facilities={facilities}
            userLat={userCoords?.lat}
            userLng={userCoords?.lng}
            radiusKm={radiusKm === 999 ? 30 : radiusKm}
            selectedFacilityId={selectedFacilityId}
            hoveredFacilityId={hoveredFacilityId}
            onSelectFacility={handleSelectFacilityFromMap}
            onHoverFacility={setHoveredFacilityId}
            onBookAppointment={setBookingFacility}
            onViewDetails={setSelectedFacilityForModal}
            onSearchThisArea={handleSearchThisArea}
            height="100%"
          />

          {/* Floating Result Cards Overlay */}
          <div className="map-only-floating-list">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #E2E8F0' }}>
              <span style={{ fontWeight: 800, fontSize: '0.86rem', color: '#12304A' }}>
                Hospitals ({facilities.length})
              </span>
              <button
                onClick={() => handleSetViewMode('split')}
                style={{ background: 'none', border: 'none', color: '#0D9488', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Expand Split View
              </button>
            </div>

            {facilities.map(fac => (
              <div
                key={fac.id}
                onClick={() => handleSelectFacilityFromMap(fac)}
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  border: selectedFacilityId === fac.id ? '2px solid #0D9488' : '1px solid #E2E8F0',
                  backgroundColor: selectedFacilityId === fac.id ? '#F0FDF4' : '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#12304A', lineHeight: 1.25 }}>
                  {fac.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#64717D', marginTop: '4px' }}>
                  <span>{fac.ownership}</span>
                  <span>•</span>
                  <span>
                    {fac.road_distance_km !== undefined ? `🚗 ${fac.road_distance_km} km` : `📍 ${fac.distance_km} km`}
                  </span>
                  {fac.road_duration_mins && (
                    <span style={{ color: '#0D9488', fontWeight: 600 }}>({fac.road_duration_mins} min)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* 5. Split or List-Only Grid (max-width: 1600px, 420px-600px sticky map column) */
        <div className={`hospital-discovery-grid ${viewMode === 'list' ? 'list-only-mode' : ''}`}>
          
          {/* Left Column: Hospital Cards Grid */}
          <div ref={cardListRef} className="hospital-cards-column">
            
            {/* Error State with Retry */}
            {loadError ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '48px 24px', 
                backgroundColor: '#FFFFFF', 
                borderRadius: '16px', 
                border: '1px solid #E2E8F0',
                boxShadow: '0 2px 8px rgba(18, 48, 74, 0.05)'
              }}>
                <AlertTriangle size={36} color="#D97706" style={{ marginBottom: '12px' }} />
                <h3 style={{ fontSize: '1.2rem', color: '#12304A', marginBottom: '8px' }}>
                  {loadError}
                </h3>
                <p style={{ color: '#64717D', fontSize: '0.88rem', marginBottom: '18px' }}>
                  Unable to connect to the hospital directory. Please check your connection and retry.
                </p>
                <button 
                  onClick={fetchFacilities} 
                  className="btn btn-primary btn-sm" 
                  style={{ padding: '8px 22px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#0D9488' }}
                >
                  <RefreshCw size={14} />
                  <span>Retry</span>
                </button>
              </div>
            ) : isLoading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#64717D' }}>
                <RefreshCw size={26} className="spin" style={{ margin: '0 auto 12px', display: 'block', color: '#0D9488' }} />
                <span style={{ fontWeight: 600 }}>Loading verified hospital registry & calculating road routes...</span>
              </div>
            ) : facilities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(18, 48, 74, 0.05)' }}>
                <Building2 size={42} color="#94A3B8" style={{ marginBottom: '12px' }} />
                <h3 style={{ fontSize: '1.25rem', color: '#12304A', marginBottom: '6px' }}>
                  No Facilities Match Your Current Filters
                </h3>
                <p style={{ color: '#64717D', fontSize: '0.88rem', maxWidth: '520px', margin: '0 auto 18px', lineHeight: 1.5 }}>
                  No hospitals matched the selected criteria within {radiusKm === 999 ? 'the city' : `${radiusKm} km`}. Try expanding the search radius or clearing the "Verified only" toggle.
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => { setRadiusKm(999); setVerifiedOnly(false); setOwnershipFilter('All'); setSchemeFilter('All'); }}
                    className="btn btn-primary btn-sm"
                    style={{ padding: '8px 20px', fontWeight: 600, backgroundColor: '#0D9488' }}
                  >
                    Reset All Filters
                  </button>
                  <button 
                    onClick={() => setRadiusKm(50)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '8px 18px', fontWeight: 600 }}
                  >
                    Expand to 50 km Radius
                  </button>
                </div>
              </div>
            ) : (
              <div className="hospital-cards-grid">
                {facilities.map(fac => (
                  <div
                    key={fac.id}
                    onMouseEnter={() => setHoveredFacilityId(fac.id)}
                    onMouseLeave={() => setHoveredFacilityId(null)}
                    onClick={() => setSelectedFacilityId(fac.id)}
                    style={{
                      transform: hoveredFacilityId === fac.id ? 'translateY(-2px)' : 'none',
                      transition: 'transform 0.2s ease',
                      height: '100%'
                    }}
                  >
                    <HospitalCard
                      facility={fac}
                      activeTreatmentId={selectedTreatmentId}
                      userLat={userCoords?.lat}
                      userLng={userCoords?.lng}
                      onViewDetails={setSelectedFacilityForModal}
                      onBookAppointment={setBookingFacility}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Sticky Map Column with Docked "Selected Hospital" Card */}
          {viewMode === 'split' && (
            <div className="hospital-map-column">
              
              {/* Interactive Map (Google Maps if API key configured, otherwise Leaflet fallback with OSM tiles) */}
              <div className="hospital-map-wrapper">
                <HospitalMapContainer
                  facilities={facilities}
                  userLat={userCoords?.lat}
                  userLng={userCoords?.lng}
                  radiusKm={radiusKm === 999 ? 30 : radiusKm}
                  selectedFacilityId={selectedFacilityId}
                  hoveredFacilityId={hoveredFacilityId}
                  onSelectFacility={handleSelectFacilityFromMap}
                  onHoverFacility={setHoveredFacilityId}
                  onBookAppointment={setBookingFacility}
                  onViewDetails={setSelectedFacilityForModal}
                  onSearchThisArea={handleSearchThisArea}
                  height="100%"
                />
              </div>

              {/* Compact "Selected Hospital" Summary Card Docked Below Map */}
              {selectedFacility && (
                <div className="hospital-selected-summary-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    {/* Compact Photo */}
                    <div style={{ width: '64px', height: '48px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#F1F5F9', flexShrink: 0 }}>
                      <img
                        src={selectedFacility.google_photos?.[0]?.url || selectedFacility.image_url || '/images/hospitals/private_hospital_facade.svg'}
                        alt={selectedFacility.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.src = '/images/hospitals/private_hospital_facade.svg';
                        }}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span 
                          style={{
                            backgroundColor: selectedFacility.facility_class === 'Premium' ? '#F5F3FF' : selectedFacility.ownership === 'Government' ? '#E6FFFA' : '#EFF6FF',
                            color: selectedFacility.facility_class === 'Premium' ? '#7C3AED' : selectedFacility.ownership === 'Government' ? '#0D9488' : '#2563EB',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            fontSize: '0.64rem',
                            fontWeight: 700
                          }}
                        >
                          {selectedFacility.facility_class === 'Premium' ? 'Premium' : selectedFacility.ownership}
                        </span>
                        {selectedFacility.rating && (
                          <span style={{ fontSize: '0.72rem', color: '#D97706', fontWeight: 700 }}>
                            ★ {Number(selectedFacility.rating).toFixed(1)}
                          </span>
                        )}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#12304A', lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedFacility.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64717D', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                        {selectedFacility.road_distance_km !== undefined ? (
                          <>
                            <span>🚗 {selectedFacility.road_distance_km} km by road</span>
                            <span>·</span>
                            <span style={{ color: '#0D9488', fontWeight: 700 }}>{selectedFacility.road_duration_mins} min</span>
                          </>
                        ) : (
                          <span>📍 ≈ {selectedFacility.distance_km} km straight-line</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAF9', padding: '6px 10px', borderRadius: '8px', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.64rem', color: '#64717D', fontWeight: 600, textTransform: 'uppercase' }}>
                        Tariff Range
                      </div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#12304A', whiteSpace: 'nowrap' }}>
                        {selectedFacility.tariff_detail?.type === 'not available'
                          ? 'Tariff not published, contact hospital'
                          : selectedFacility.estimated_cost_min === 0
                            ? 'Free / Subsidized Public Care'
                            : selectedFacility.estimated_cost_min
                              ? `₹${selectedFacility.estimated_cost_min.toLocaleString('en-IN')} - ₹${selectedFacility.estimated_cost_max?.toLocaleString('en-IN')}`
                              : 'Contact hospital'}
                      </div>
                    </div>
                    {selectedFacility.empanelled_schemes && selectedFacility.empanelled_schemes.length > 0 && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.64rem', color: '#64717D', fontWeight: 600, textTransform: 'uppercase' }}>
                          Schemes
                        </div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0D9488' }}>
                          {selectedFacility.empanelled_schemes.slice(0, 2).map(s => s === 'aarogyasri' ? 'Aarogyasri' : s === 'pm_jay' ? 'PM-JAY' : s.toUpperCase()).join(', ')}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Docked Action Buttons */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selectedFacility.lat},${selectedFacility.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, padding: '5px 8px', fontSize: '0.74rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', textDecoration: 'none', color: '#12304A' }}
                    >
                      <Navigation size={11} color="#0D9488" />
                      <span>Directions</span>
                    </a>
                    <button
                      onClick={() => setBookingFacility(selectedFacility)}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1.2, padding: '5px 8px', fontSize: '0.74rem', fontWeight: 700, backgroundColor: '#0D9488', color: 'white' }}
                    >
                      <Calendar size={11} />
                      <span>Book Appointment</span>
                    </button>
                    <button
                      onClick={() => setSelectedFacilityForModal(selectedFacility)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '5px 8px', fontSize: '0.74rem' }}
                      title="View details"
                    >
                      Details
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* 6. Compare Tray Docked at Bottom (When Hospitals Added to Comparison) */}
      {searchState.comparisonList && searchState.comparisonList.length > 0 && (
        <div className="hospital-compare-tray">
          <div className="compare-tray-inner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="#0D9488" />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#12304A' }}>
                  Hospital Comparison Tray ({searchState.comparisonList.length} of 4)
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64717D' }}>
                  Compare tariffs, distance, schemes, and verified credentials side-by-side
                </div>
              </div>
            </div>

            <div className="compare-cards-row">
              {searchState.comparisonList.map((fac: any) => (
                <div key={fac.id} className="compare-mini-card">
                  <button
                    onClick={() => removeFromComparison(fac.id)}
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94A3B8',
                      padding: 0
                    }}
                    title="Remove from comparison"
                  >
                    <X size={14} />
                  </button>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#12304A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '14px' }}>
                    {fac.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64717D', marginTop: '2px' }}>
                    {fac.facility_class === 'Premium' ? 'Premium' : fac.ownership} • 📍 {fac.road_distance_km ? `${fac.road_distance_km} km road` : `${fac.distance_km || 'Near'}`}
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0D9488', marginTop: '4px' }}>
                    {fac.estimated_cost_min === 0 ? 'Free' : fac.estimated_cost_min ? `₹${fac.estimated_cost_min.toLocaleString('en-IN')}` : 'Not published'}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={clearComparison}
                className="btn btn-secondary btn-sm"
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              >
                Clear All
              </button>
              <button
                onClick={() => {
                  if (searchState.comparisonList.length > 0) {
                    const first = searchState.comparisonList[0];
                    setSelectedFacilityForModal(first as any);
                  }
                }}
                className="btn btn-primary btn-sm"
                style={{ padding: '6px 14px', fontSize: '0.78rem', fontWeight: 700, backgroundColor: '#0D9488', color: 'white' }}
              >
                View Comparison
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hospital Detail Modal */}
      {selectedFacilityForModal && (
        <HospitalDetailModal
          facility={selectedFacilityForModal}
          onClose={() => setSelectedFacilityForModal(null)}
          onEstimateHere={(fac) => {
            window.location.hash = `#estimate?treatment=${selectedTreatmentId}&hospital=${fac.id}`;
          }}
          onBookAppointment={(fac) => {
            setSelectedFacilityForModal(null);
            setBookingFacility(fac);
          }}
        />
      )}

      {/* Appointment Booking Modal */}
      {bookingFacility && (
        <BookingModal
          isOpen={Boolean(bookingFacility)}
          facility={bookingFacility}
          treatmentName={activeTreatment?.name}
          onClose={() => setBookingFacility(null)}
        />
      )}
    </div>
  );
};
