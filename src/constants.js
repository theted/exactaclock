// Nautical time zones: 15° of longitude per hour, centred on each meridian
// that is a multiple of 15°. UTC-12 and UTC+12 are half-width because the
// antimeridian splits them.
export const DEGREES_PER_HOUR = 15;
export const MINUTES_PER_DEGREE = 4; // 60 min / 15°
export const MAX_ADJUSTMENT_MINUTES = 30; // half a zone

const ZONE_NAMES = {
  '-12': 'International Date Line West',
  '-11': 'Niue Time',
  '-10': 'Hawaii-Aleutian Standard Time',
  '-9': 'Alaska Standard Time',
  '-8': 'Pacific Standard Time',
  '-7': 'Mountain Standard Time',
  '-6': 'Central Standard Time',
  '-5': 'Eastern Standard Time',
  '-4': 'Atlantic Standard Time',
  '-3': 'Argentina Standard Time',
  '-2': 'South Georgia Time',
  '-1': 'Azores Standard Time',
  0: 'Greenwich Mean Time',
  1: 'Central European Time',
  2: 'Eastern European Time',
  3: 'Moscow Standard Time',
  4: 'Gulf Standard Time',
  5: 'Pakistan Standard Time',
  6: 'Bangladesh Standard Time',
  7: 'Indochina Time',
  8: 'China Standard Time',
  9: 'Japan Standard Time',
  10: 'Australian Eastern Standard Time',
  11: 'Solomon Islands Time',
  12: 'New Zealand Standard Time'
};

const clampLongitude = lng => Math.min(180, Math.max(-180, lng));

// Derived rather than hand-written so the boundaries can never drift out of
// sync with the offsets they represent.
const buildTimezone = offset => {
  const center = offset * DEGREES_PER_HOUR;
  return {
    name: `UTC${offset < 0 ? '-' : '+'}${Math.abs(offset)}`,
    fullName: ZONE_NAMES[offset],
    offset,
    center,
    west: clampLongitude(center - DEGREES_PER_HOUR / 2),
    east: clampLongitude(center + DEGREES_PER_HOUR / 2)
  };
};

export const TIMEZONES = Array.from({ length: 25 }, (_, i) =>
  buildTimezone(i - 12)
);

// Every meridian where the nominal zone changes, used to draw the map overlay.
export const ZONE_BOUNDARIES = TIMEZONES.slice(1).map(zone => zone.west);

// A small reference set of major cities, used for "nearest city" readouts.
// Latitude matters here even though it does not affect solar time.
export const CITIES = [
  { name: 'Auckland', country: 'New Zealand', lat: -36.8485, lng: 174.7633 },
  { name: 'Bangkok', country: 'Thailand', lat: 13.7563, lng: 100.5018 },
  { name: 'Beijing', country: 'China', lat: 39.9042, lng: 116.4074 },
  { name: 'Berlin', country: 'Germany', lat: 52.52, lng: 13.405 },
  { name: 'Bogotá', country: 'Colombia', lat: 4.711, lng: -74.0721 },
  { name: 'Buenos Aires', country: 'Argentina', lat: -34.6037, lng: -58.3816 },
  { name: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357 },
  { name: 'Cape Town', country: 'South Africa', lat: -33.9249, lng: 18.4241 },
  { name: 'Chicago', country: 'United States', lat: 41.8781, lng: -87.6298 },
  { name: 'Delhi', country: 'India', lat: 28.6139, lng: 77.209 },
  { name: 'Dhaka', country: 'Bangladesh', lat: 23.8103, lng: 90.4125 },
  { name: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708 },
  { name: 'Helsinki', country: 'Finland', lat: 60.1699, lng: 24.9384 },
  { name: 'Honolulu', country: 'United States', lat: 21.3069, lng: -157.8583 },
  { name: 'Istanbul', country: 'Türkiye', lat: 41.0082, lng: 28.9784 },
  { name: 'Jakarta', country: 'Indonesia', lat: -6.2088, lng: 106.8456 },
  {
    name: 'Johannesburg',
    country: 'South Africa',
    lat: -26.2041,
    lng: 28.0473
  },
  { name: 'Karachi', country: 'Pakistan', lat: 24.8607, lng: 67.0011 },
  { name: 'Kyiv', country: 'Ukraine', lat: 50.4501, lng: 30.5234 },
  { name: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792 },
  { name: 'Lima', country: 'Peru', lat: -12.0464, lng: -77.0428 },
  { name: 'Lisbon', country: 'Portugal', lat: 38.7223, lng: -9.1393 },
  { name: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
  {
    name: 'Los Angeles',
    country: 'United States',
    lat: 34.0522,
    lng: -118.2437
  },
  { name: 'Madrid', country: 'Spain', lat: 40.4168, lng: -3.7038 },
  { name: 'Manila', country: 'Philippines', lat: 14.5995, lng: 120.9842 },
  { name: 'Mexico City', country: 'Mexico', lat: 19.4326, lng: -99.1332 },
  { name: 'Moscow', country: 'Russia', lat: 55.7558, lng: 37.6173 },
  { name: 'Mumbai', country: 'India', lat: 19.076, lng: 72.8777 },
  { name: 'Nairobi', country: 'Kenya', lat: -1.2921, lng: 36.8219 },
  { name: 'New York', country: 'United States', lat: 40.7128, lng: -74.006 },
  { name: 'Oslo', country: 'Norway', lat: 59.9139, lng: 10.7522 },
  { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
  { name: 'Reykjavík', country: 'Iceland', lat: 64.1466, lng: -21.9426 },
  { name: 'Rio de Janeiro', country: 'Brazil', lat: -22.9068, lng: -43.1729 },
  { name: 'Rome', country: 'Italy', lat: 41.9028, lng: 12.4964 },
  {
    name: 'San Francisco',
    country: 'United States',
    lat: 37.7749,
    lng: -122.4194
  },
  { name: 'Santiago', country: 'Chile', lat: -33.4489, lng: -70.6693 },
  { name: 'São Paulo', country: 'Brazil', lat: -23.5505, lng: -46.6333 },
  { name: 'Seoul', country: 'South Korea', lat: 37.5665, lng: 126.978 },
  { name: 'Shanghai', country: 'China', lat: 31.2304, lng: 121.4737 },
  { name: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { name: 'Stockholm', country: 'Sweden', lat: 59.3293, lng: 18.0686 },
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
  { name: 'Tehran', country: 'Iran', lat: 35.6892, lng: 51.389 },
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },
  { name: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832 },
  { name: 'Vancouver', country: 'Canada', lat: 49.2827, lng: -123.1207 },
  { name: 'Vienna', country: 'Austria', lat: 48.2082, lng: 16.3738 },
  { name: 'Warsaw', country: 'Poland', lat: 52.2297, lng: 21.0122 }
];

// Shown as one-tap presets; each one lands in a noticeably different part of
// its timezone so the correction is easy to compare.
export const PRESET_LOCATIONS = [
  { label: 'New York', lat: 40.7128, lng: -74.006 },
  { label: 'London', lat: 51.5074, lng: -0.1278 },
  { label: 'Stockholm', lat: 59.3293, lng: 18.0686 },
  { label: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  { label: 'Sydney', lat: -33.8688, lng: 151.2093 },
  { label: 'Null Island', lat: 0, lng: 0 }
];

export const DEFAULT_LOCATION = { lat: 51.4779, lng: -0.0015 }; // Royal Observatory
