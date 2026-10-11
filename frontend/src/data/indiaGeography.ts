// Master Pan-India Geographic Registry
// All 28 States and 8 Union Territories + Major Districts and Cities

export interface IndianState {
  code: string;
  name: string;
  type: 'State' | 'UT';
  capital: string;
  majorCities: string[];
  lat: number;
  lng: number;
}

export interface LocationSuggestion {
  label: string;
  city: string;
  district: string;
  locality?: string;
  state: string;
  tier: string;
  lat: number;
  lng: number;
  pinCode?: string;
}

export const ALL_INDIAN_STATES: IndianState[] = [
  // 28 States
  { code: 'AP', name: 'Andhra Pradesh', type: 'State', capital: 'Amaravati', majorCities: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Kurnool', 'Kakinada', 'Nellore', 'Rajahmundry'], lat: 15.9129, lng: 79.7400 },
  { code: 'AR', name: 'Arunachal Pradesh', type: 'State', capital: 'Itanagar', majorCities: ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Ziro'], lat: 28.2180, lng: 94.7278 },
  { code: 'AS', name: 'Assam', type: 'State', capital: 'Dispur', majorCities: ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tezpur'], lat: 26.2006, lng: 92.9376 },
  { code: 'BR', name: 'Bihar', type: 'State', capital: 'Patna', majorCities: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif'], lat: 25.0961, lng: 85.3131 },
  { code: 'CG', name: 'Chhattisgarh', type: 'State', capital: 'Raipur', majorCities: ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon'], lat: 21.2787, lng: 81.8661 },
  { code: 'GA', name: 'Goa', type: 'State', capital: 'Panaji', majorCities: ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'], lat: 15.2993, lng: 74.1240 },
  { code: 'GJ', name: 'Gujarat', type: 'State', capital: 'Gandhinagar', majorCities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh'], lat: 22.2587, lng: 71.1924 },
  { code: 'HR', name: 'Haryana', type: 'State', capital: 'Chandigarh', majorCities: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Karnal', 'Hisar', 'Rohtak', 'Sonipat'], lat: 29.0588, lng: 76.0856 },
  { code: 'HP', name: 'Himachal Pradesh', type: 'State', capital: 'Shimla', majorCities: ['Shimla', 'Dharamshala', 'Mandi', 'Solan', 'Kullu', 'Bilaspur'], lat: 31.1048, lng: 77.1734 },
  { code: 'JH', name: 'Jharkhand', type: 'State', capital: 'Ranchi', majorCities: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh'], lat: 23.6102, lng: 85.2799 },
  { code: 'KA', name: 'Karnataka', type: 'State', capital: 'Bengaluru', majorCities: ['Bengaluru', 'Mysuru', 'Hubballi-Dharwad', 'Mangaluru', 'Belagavi', 'Kalaburagi', 'Davanagere', 'Ballari'], lat: 12.9716, lng: 77.5946 },
  { code: 'KL', name: 'Kerala', type: 'State', capital: 'Thiruvananthapuram', majorCities: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Kollam', 'Thrissur', 'Kannur', 'Alappuzha', 'Palakkad'], lat: 10.8505, lng: 76.2711 },
  { code: 'MP', name: 'Madhya Pradesh', type: 'State', capital: 'Bhopal', majorCities: ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna'], lat: 22.9734, lng: 78.6569 },
  { code: 'MH', name: 'Maharashtra', type: 'State', capital: 'Mumbai', majorCities: ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Chhatrapati Sambhajinagar', 'Solapur', 'Kolhapur', 'Ahmednagar', 'Ralegan Siddhi'], lat: 18.9220, lng: 72.8346 },
  { code: 'MN', name: 'Manipur', type: 'State', capital: 'Imphal', majorCities: ['Imphal', 'Churachandpur', 'Thoubal', 'Bishnupur'], lat: 24.6637, lng: 93.9063 },
  { code: 'ML', name: 'Meghalaya', type: 'State', capital: 'Shillong', majorCities: ['Shillong', 'Tura', 'Jowai', 'Nongpoh'], lat: 25.4670, lng: 91.3662 },
  { code: 'MZ', name: 'Mizoram', type: 'State', capital: 'Aizawl', majorCities: ['Aizawl', 'Lunglei', 'Champhai', 'Serchhip'], lat: 23.1645, lng: 92.9376 },
  { code: 'NL', name: 'Nagaland', type: 'State', capital: 'Kohima', majorCities: ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang'], lat: 26.1584, lng: 94.5624 },
  { code: 'OD', name: 'Odisha', type: 'State', capital: 'Bhubaneswar', majorCities: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore'], lat: 20.9517, lng: 85.0985 },
  { code: 'PB', name: 'Punjab', type: 'State', capital: 'Chandigarh', majorCities: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Hoshiarpur'], lat: 31.1471, lng: 75.3412 },
  { code: 'RJ', name: 'Rajasthan', type: 'State', capital: 'Jaipur', majorCities: ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar'], lat: 26.9124, lng: 75.7873 },
  { code: 'SK', name: 'Sikkim', type: 'State', capital: 'Gangtok', majorCities: ['Gangtok', 'Namchi', 'Geyzing', 'Mangan'], lat: 27.5330, lng: 88.5122 },
  { code: 'TN', name: 'Tamil Nadu', type: 'State', capital: 'Chennai', majorCities: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode', 'Vellore'], lat: 13.0827, lng: 80.2707 },
  { code: 'TS', name: 'Telangana', type: 'State', capital: 'Hyderabad', majorCities: ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar', 'Ramagundam', 'Mahbubnagar', 'Secunderabad'], lat: 17.3850, lng: 78.4867 },
  { code: 'TR', name: 'Tripura', type: 'State', capital: 'Agartala', majorCities: ['Agartala', 'Dharmanagar', 'Udaipur', 'Kailashahar'], lat: 23.9408, lng: 91.9882 },
  { code: 'UP', name: 'Uttar Pradesh', type: 'State', capital: 'Lucknow', majorCities: ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Prayagraj', 'Bareilly', 'Aligarh', 'Barabanki', 'Moradabad', 'Gorakhpur'], lat: 26.8467, lng: 80.9462 },
  { code: 'UK', name: 'Uttarakhand', type: 'State', capital: 'Dehradun', majorCities: ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh', 'Nainital'], lat: 30.0668, lng: 79.0193 },
  { code: 'WB', name: 'West Bengal', type: 'State', capital: 'Kolkata', majorCities: ['Kolkata', 'Howrah', 'Asansol', 'Siliguri', 'Durgapur', 'Bardhaman', 'Malda', 'Kharagpur'], lat: 22.5726, lng: 88.3639 },
  // 8 Union Territories
  { code: 'AN', name: 'Andaman and Nicobar Islands', type: 'UT', capital: 'Port Blair', majorCities: ['Port Blair'], lat: 11.6234, lng: 92.7265 },
  { code: 'CH', name: 'Chandigarh', type: 'UT', capital: 'Chandigarh', majorCities: ['Chandigarh'], lat: 30.7333, lng: 76.7794 },
  { code: 'DH', name: 'Dadra and Nagar Haveli and Daman and Diu', type: 'UT', capital: 'Daman', majorCities: ['Daman', 'Diu', 'Silvassa'], lat: 20.3974, lng: 72.8328 },
  { code: 'DL', name: 'Delhi', type: 'UT', capital: 'New Delhi', majorCities: ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Dwarka', 'Rohini', 'Saket'], lat: 28.6139, lng: 77.2090 },
  { code: 'JK', name: 'Jammu and Kashmir', type: 'UT', capital: 'Srinagar', majorCities: ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Udhampur'], lat: 33.7782, lng: 76.5762 },
  { code: 'LA', name: 'Ladakh', type: 'UT', capital: 'Leh', majorCities: ['Leh', 'Kargil'], lat: 34.1526, lng: 77.5771 },
  { code: 'LD', name: 'Lakshadweep', type: 'UT', capital: 'Kavaratti', majorCities: ['Kavaratti', 'Agatti', 'Andrott'], lat: 10.5667, lng: 72.6417 },
  { code: 'PY', name: 'Puducherry', type: 'UT', capital: 'Puducherry', majorCities: ['Puducherry', 'Karaikal', 'Yanam', 'Mahe'], lat: 11.9416, lng: 79.8083 }
];

// Highlighted Pre-configured Locations for Immediate 1-Click Discovery
export const POPULAR_LOCATIONS: LocationSuggestion[] = [
  {
    label: 'Hyderabad, Telangana',
    city: 'Hyderabad',
    district: 'Hyderabad',
    state: 'Telangana',
    tier: 'Tier 1',
    lat: 17.3850,
    lng: 78.4867,
    pinCode: '500001'
  },
  {
    label: 'Mumbai, Maharashtra',
    city: 'Mumbai',
    district: 'Mumbai City',
    state: 'Maharashtra',
    tier: 'Tier 1',
    lat: 18.9220,
    lng: 72.8346,
    pinCode: '400001'
  },
  {
    label: 'Bengaluru, Karnataka',
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    tier: 'Tier 1',
    lat: 12.9716,
    lng: 77.5946,
    pinCode: '560001'
  },
  {
    label: 'New Delhi (National Capital)',
    city: 'New Delhi',
    district: 'New Delhi',
    state: 'Delhi',
    tier: 'Tier 1',
    lat: 28.6139,
    lng: 77.2090,
    pinCode: '110001'
  },
  {
    label: 'Barabanki, Uttar Pradesh (Rural / District)',
    city: 'Barabanki',
    district: 'Barabanki',
    state: 'Uttar Pradesh',
    tier: 'Tier 3 / Rural',
    lat: 26.9274,
    lng: 81.1850,
    pinCode: '225001'
  },
  {
    label: 'Ahmednagar / Ralegan Siddhi, MH (Rural)',
    city: 'Ahmednagar',
    district: 'Ahmednagar',
    state: 'Maharashtra',
    tier: 'Tier 3 / Rural',
    lat: 18.9189,
    lng: 74.4094,
    pinCode: '414306'
  }
];

// Client-side quick location search across all Indian states and cities
export function searchIndianLocations(query: string): LocationSuggestion[] {
  if (!query || query.trim().length === 0) return POPULAR_LOCATIONS;
  const q = query.trim().toLowerCase();

  // If 6-digit pin code
  if (/^\d{1,6}$/.test(q)) {
    if (q.startsWith('500') || q.startsWith('501')) {
      return [{ label: `Hyderabad, Telangana (PIN: ${q})`, city: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', tier: 'Tier 1', lat: 17.3850, lng: 78.4867, pinCode: q }];
    }
    if (q.startsWith('400')) {
      return [{ label: `Mumbai, Maharashtra (PIN: ${q})`, city: 'Mumbai', district: 'Mumbai City', state: 'Maharashtra', tier: 'Tier 1', lat: 18.9220, lng: 72.8346, pinCode: q }];
    }
    if (q.startsWith('560')) {
      return [{ label: `Bengaluru, Karnataka (PIN: ${q})`, city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', tier: 'Tier 1', lat: 12.9716, lng: 77.5946, pinCode: q }];
    }
    if (q.startsWith('110')) {
      return [{ label: `New Delhi (PIN: ${q})`, city: 'New Delhi', district: 'New Delhi', state: 'Delhi', tier: 'Tier 1', lat: 28.6139, lng: 77.2090, pinCode: q }];
    }
    if (q.startsWith('225')) {
      return [{ label: `Barabanki, Uttar Pradesh (PIN: ${q})`, city: 'Barabanki', district: 'Barabanki', state: 'Uttar Pradesh', tier: 'Tier 3 / Rural', lat: 26.9274, lng: 81.1850, pinCode: q }];
    }
    if (q.startsWith('414')) {
      return [{ label: `Ralegan Siddhi / Ahmednagar, MH (PIN: ${q})`, city: 'Ralegan Siddhi', district: 'Ahmednagar', state: 'Maharashtra', tier: 'Tier 3 / Rural', lat: 18.9189, lng: 74.4094, pinCode: q }];
    }
  }

  const results: LocationSuggestion[] = [];

  // Match in Popular
  for (const pop of POPULAR_LOCATIONS) {
    if (pop.label.toLowerCase().includes(q) || pop.city.toLowerCase().includes(q) || pop.state.toLowerCase().includes(q)) {
      results.push(pop);
    }
  }

  // Match in all states and their major cities
  for (const st of ALL_INDIAN_STATES) {
    if (st.name.toLowerCase().includes(q)) {
      results.push({
        label: `${st.name} (Capital: ${st.capital})`,
        city: st.capital,
        district: st.capital,
        state: st.name,
        tier: 'Tier 2',
        lat: st.lat,
        lng: st.lng
      });
    }

    for (const city of st.majorCities) {
      if (city.toLowerCase().includes(q)) {
        const isTier1 = ['mumbai', 'delhi', 'new delhi', 'bengaluru', 'hyderabad', 'chennai', 'kolkata'].includes(city.toLowerCase());
        const isRural = ['barabanki', 'ralegan siddhi'].includes(city.toLowerCase());
        const tier = isTier1 ? 'Tier 1' : (isRural ? 'Tier 3 / Rural' : 'Tier 2');
        const label = `${city}, ${st.name}`;
        if (!results.some(r => r.city.toLowerCase() === city.toLowerCase())) {
          results.push({
            label,
            city,
            district: city,
            state: st.name,
            tier,
            lat: st.lat,
            lng: st.lng
          });
        }
      }
    }
  }

  return results.slice(0, 10);
}

// Aliases for convenient importing
export const STATES_AND_UTS = ALL_INDIAN_STATES;
export const LOC_PRESETS = POPULAR_LOCATIONS;
export type LocationPreset = LocationSuggestion;
export const searchIndiaLocations = searchIndianLocations;
