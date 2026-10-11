import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Navigation, 
  Search, 
  Check, 
  ChevronDown, 
  Building2, 
  Compass, 
  AlertCircle,
  X
} from 'lucide-react';
import { useSearch, LocationPayload } from '../context/SearchContext';
import { 
  STATES_AND_UTS, 
  LOC_PRESETS, 
  LocationPreset, 
  searchIndiaLocations,
  IndianState
} from '../data/indiaGeography';
import { api } from '../services/api';

interface PanIndiaLocationPickerProps {
  onLocationSelect?: (loc: LocationPreset) => void;
  compact?: boolean;
  showPresets?: boolean;
  className?: string;
}

export const PanIndiaLocationPicker: React.FC<PanIndiaLocationPickerProps> = ({
  onLocationSelect,
  compact = false,
  showPresets = true,
  className = ''
}) => {
  const { searchState, setLocation } = useSearch();

  // Search input & autocomplete state
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationPreset[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced cascading state
  const [selectedStateCode, setSelectedStateCode] = useState<string>(() => {
    const matched = STATES_AND_UTS.find((s: IndianState) => s.name.toLowerCase() === (searchState.state || '').toLowerCase());
    return matched ? matched.code : 'TS';
  });
  const [selectedCityName, setSelectedCityName] = useState<string>(searchState.city || 'Hyderabad');
  const [manualLocality, setManualLocality] = useState<string>(searchState.locality || '');
  const [manualPin, setManualPin] = useState<string>(searchState.pinCode || '');

  // GPS state
  const [gpsStatus, setGpsStatus] = useState<{
    loading: boolean;
    message: string | null;
    isError: boolean;
  }>({
    loading: false,
    message: null,
    isError: false
  });

  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update suggestions when query changes
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const localMatches = searchIndiaLocations(query);
    if (localMatches.length > 0) {
      setSuggestions(localMatches);
    } else {
      // Fallback to backend search
      api.searchLocations(query)
        .then(res => {
          if (res && res.length > 0) {
            setSuggestions(res.map(r => ({
              label: r.label,
              city: r.city,
              district: r.district,
              state: r.state,
              tier: r.tier,
              lat: r.lat,
              lng: r.lng,
              pinCode: r.pinCode
            })));
          } else {
            setSuggestions([]);
          }
        })
        .catch(() => setSuggestions([]));
    }
  }, [query]);

  // Handle preset selection
  const handleSelectLocation = (loc: LocationPreset) => {
    const payload: LocationPayload = {
      city: loc.city,
      state: loc.state,
      district: loc.district,
      locality: loc.district && loc.district !== loc.city ? loc.district : '',
      pinCode: loc.pinCode || '',
      lat: loc.lat,
      lng: loc.lng
    };

    setLocation(payload);
    setSelectedCityName(loc.city);
    setManualPin(loc.pinCode || '');
    const st = STATES_AND_UTS.find((s: IndianState) => s.name.toLowerCase() === loc.state.toLowerCase());
    if (st) setSelectedStateCode(st.code);

    setQuery('');
    setIsOpen(false);
    setGpsStatus({ loading: false, message: `📍 Selected: ${loc.label}`, isError: false });

    if (onLocationSelect) {
      onLocationSelect(loc);
    }
  };

  // Browser Geolocation
  const handleUseGps = () => {
    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (typeof window !== 'undefined' && !window.isSecureContext && !isLocalhost) {
      setGpsStatus({
        loading: false,
        message: "⚠️ GPS requires a secure HTTPS connection or localhost. Please select your state or city manually.",
        isError: true
      });
      return;
    }

    if (!navigator.geolocation) {
      setGpsStatus({
        loading: false,
        message: "Geolocation is not supported by your browser. Please select your state/city manually.",
        isError: true
      });
      return;
    }

    setGpsStatus({
      loading: true,
      message: "Requesting device GPS permission...",
      isError: false
    });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const roundedAcc = Math.round(accuracy);
        try {
          const resolved = await api.resolveLocation({ lat: latitude, lng: longitude });
          const localityPart = resolved.locality || resolved.district || '';
          const pinPart = resolved.pin_code ? ` - ${resolved.pin_code}` : '';
          const tierTag = resolved.tier_label || resolved.tier || '';
          const tierSuffix = tierTag ? ` (${tierTag})` : '';

          const displayLabel = resolved.locality && resolved.locality !== resolved.city
            ? `${resolved.locality}, ${resolved.city}, ${resolved.state}${pinPart}${tierSuffix}`
            : `${resolved.city}, ${resolved.state}${pinPart}${tierSuffix}`;

          const payload: LocationPayload = {
            city: resolved.city,
            state: resolved.state,
            district: resolved.district,
            locality: localityPart,
            pinCode: resolved.pin_code || '',
            lat: latitude, // Preserve browser's actual GPS latitude
            lng: longitude, // Preserve browser's actual GPS longitude
            isLiveGps: true,
            gpsAccuracy: roundedAcc
          };
          setLocation(payload);
          setSelectedCityName(resolved.city);
          const st = STATES_AND_UTS.find((s: IndianState) => s.name.toLowerCase() === resolved.state.toLowerCase());
          if (st) setSelectedStateCode(st.code);

          setGpsStatus({
            loading: false,
            message: `📍 Live GPS detected (±${roundedAcc}m): ${displayLabel}`,
            isError: false
          });

          if (onLocationSelect) {
            onLocationSelect({
              label: displayLabel,
              city: resolved.city,
              district: resolved.district,
              locality: resolved.locality,
              pinCode: resolved.pin_code || undefined,
              state: resolved.state,
              tier: resolved.tier,
              lat: latitude,
              lng: longitude
            });
          }
        } catch {
          // Truthful fallback preserving exact browser GPS without inventing an address
          setLocation({
            city: 'Near your GPS location',
            state: '',
            lat: latitude,
            lng: longitude,
            isLiveGps: true,
            gpsAccuracy: roundedAcc
          });
          setGpsStatus({
            loading: false,
            message: `📍 Live GPS captured (±${roundedAcc}m): ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            isError: false
          });
        }
      },
      (err) => {
        let msg = "Location permission denied. You can select your state/city or enter PIN code manually.";
        if (err.code === 2) msg = "Device location unavailable. Please choose your location manually.";
        if (err.code === 3) msg = "GPS request timed out. Please retry or choose your location manually.";
        setGpsStatus({
          loading: false,
          message: msg,
          isError: true
        });
      },
      { timeout: 15000, enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  // State selection change
  const currentState = STATES_AND_UTS.find((s: IndianState) => s.code === selectedStateCode) || STATES_AND_UTS[0];

  const handleApplyCascading = () => {
    const locPreset: LocationPreset = {
      label: `${selectedCityName}, ${currentState.name}`,
      city: selectedCityName,
      district: manualLocality || selectedCityName,
      state: currentState.name,
      tier: 'Tier 2',
      lat: currentState.lat,
      lng: currentState.lng,
      pinCode: manualPin
    };
    handleSelectLocation(locPreset);
    setShowAdvanced(false);
  };

  return (
    <div className={`pan-india-picker ${className}`} ref={wrapperRef} style={{ width: '100%' }}>
      {/* Current Location Badge Display */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        backgroundColor: '#E7F3EF',
        border: '1px solid #CBD5E1',
        borderRadius: '8px',
        marginBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={18} color="#2C8C83" />
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, letterSpacing: '0.04em' }}>
              Active Care Location
            </span>
            <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#12304A' }}>
              {searchState.city}{searchState.state ? `, ${searchState.state}` : ''}
              {searchState.pinCode ? ` (PIN: ${searchState.pinCode})` : ''}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleUseGps}
          disabled={gpsStatus.loading}
          className="btn btn-secondary btn-sm"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            padding: '6px 12px',
            borderColor: '#2C8C83',
            color: '#12304A',
            backgroundColor: '#FFFFFF',
            cursor: 'pointer'
          }}
          title="Use browser GPS location"
        >
          <Navigation size={13} color="#2C8C83" />
          <span>{gpsStatus.loading ? 'Detecting...' : 'Use My GPS'}</span>
        </button>
      </div>

      {/* GPS Notice / Error Banner */}
      {gpsStatus.message && (
        <div style={{
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '0.8rem',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: gpsStatus.isError ? '#FEF2F2' : '#F0FDF4',
          color: gpsStatus.isError ? '#991B1B' : '#166534',
          border: `1px solid ${gpsStatus.isError ? '#FECACA' : '#BBF7D0'}`
        }}>
          {gpsStatus.isError ? <AlertCircle size={14} /> : <Check size={14} />}
          <span>{gpsStatus.message}</span>
        </div>
      )}

      {/* Autocomplete Input */}
      <div style={{ position: 'relative', marginBottom: '10px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          border: '1px solid #CBD5E1',
          borderRadius: '8px',
          padding: '0 12px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
        }}>
          <Search size={16} color="#64748B" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search any Indian State, City, District, Village or 6-digit PIN..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              padding: '10px 10px',
              fontSize: '0.9rem',
              color: '#12304A',
              backgroundColor: 'transparent'
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setIsOpen(false); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
            >
              <X size={15} color="#94A3B8" />
            </button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {isOpen && suggestions.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 100,
            backgroundColor: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            marginTop: '4px',
            boxShadow: '0 8px 24px rgba(18, 48, 74, 0.12)',
            maxHeight: '260px',
            overflowY: 'auto'
          }}>
            {suggestions.map((loc, idx) => (
              <div
                key={`${loc.city}-${loc.state}-${idx}`}
                onClick={() => handleSelectLocation(loc)}
                style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid #F1F5F9',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAF9')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={15} color="#2C8C83" />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#12304A' }}>
                      {loc.city}, {loc.state}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {loc.district && loc.district !== loc.city ? `District: ${loc.district} • ` : ''}
                      {loc.pinCode ? `PIN: ${loc.pinCode} • ` : ''}
                      {loc.tier}
                    </div>
                  </div>
                </div>
                <span className="badge badge-teal" style={{ fontSize: '0.7rem' }}>Select</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Location Presets */}
      {showPresets && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, marginBottom: '6px' }}>
            Quick Indian Locations:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {LOC_PRESETS.map((preset: LocationPreset) => {
              const isSelected = searchState.city.toLowerCase() === preset.city.toLowerCase() &&
                searchState.state.toLowerCase() === preset.state.toLowerCase();
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleSelectLocation(preset)}
                  style={{
                    backgroundColor: isSelected ? '#2C8C83' : '#FFFFFF',
                    color: isSelected ? '#FFFFFF' : '#12304A',
                    border: `1px solid ${isSelected ? '#2C8C83' : '#CBD5E1'}`,
                    borderRadius: '16px',
                    padding: '4px 10px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Advanced State & City Selector Toggle */}
      {!compact && (
        <div style={{ marginTop: '8px' }}>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              background: 'none',
              border: 'none',
              color: '#2C8C83',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: 0
            }}
          >
            <span>{showAdvanced ? 'Hide State/District Dropdowns' : 'Browse All 28 States & 8 UTs (Cascading Dropdown)'}</span>
            <ChevronDown size={14} style={{ transform: showAdvanced ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
          </button>

          {showAdvanced && (
            <div style={{
              marginTop: '10px',
              padding: '14px',
              backgroundColor: '#F8FAF9',
              borderRadius: '8px',
              border: '1px solid #E2E8F0'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                {/* State Dropdown */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#12304A', marginBottom: '4px' }}>
                    STATE / UNION TERRITORY:
                  </label>
                  <select
                    value={selectedStateCode}
                    onChange={(e) => {
                      const newCode = e.target.value;
                      setSelectedStateCode(newCode);
                      const st = STATES_AND_UTS.find((s: IndianState) => s.code === newCode);
                      if (st && st.majorCities.length > 0) {
                        setSelectedCityName(st.majorCities[0]);
                      }
                    }}
                    style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                  >
                    {STATES_AND_UTS.map((st: IndianState) => (
                      <option key={st.code} value={st.code}>
                        {st.name} ({st.type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* City Dropdown */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#12304A', marginBottom: '4px' }}>
                    MAJOR CITY / DISTRICT:
                  </label>
                  <select
                    value={selectedCityName}
                    onChange={(e) => setSelectedCityName(e.target.value)}
                    style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                  >
                    {currentState.majorCities.map((c: string) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Optional Locality / Town / Village */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#12304A', marginBottom: '4px' }}>
                    TOWN / VILLAGE / LOCALITY:
                  </label>
                  <input
                    type="text"
                    value={manualLocality}
                    onChange={(e) => setManualLocality(e.target.value)}
                    placeholder="e.g. Ralegan Siddhi, Dewa..."
                    style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                  />
                </div>

                {/* Optional PIN Code */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#12304A', marginBottom: '4px' }}>
                    PIN CODE (OPTIONAL):
                  </label>
                  <input
                    type="text"
                    value={manualPin}
                    onChange={(e) => setManualPin(e.target.value)}
                    placeholder="e.g. 225001, 414306..."
                    maxLength={6}
                    style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleApplyCascading}
                  className="btn btn-primary btn-sm"
                  style={{ padding: '6px 16px', fontSize: '0.82rem' }}
                >
                  Apply Location
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
