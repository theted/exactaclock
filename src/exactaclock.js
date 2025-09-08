// Timezone boundaries data - simplified major timezone boundaries
const TIMEZONES = [
  { name: 'UTC-12', offset: -12, boundaries: [{ lat: -90, lng: -180 }, { lat: 90, lng: -165 }] },
  { name: 'UTC-11', offset: -11, boundaries: [{ lat: -90, lng: -165 }, { lat: 90, lng: -157.5 }] },
  { name: 'UTC-10', offset: -10, boundaries: [{ lat: -90, lng: -157.5 }, { lat: 90, lng: -142.5 }] },
  { name: 'UTC-9', offset: -9, boundaries: [{ lat: -90, lng: -142.5 }, { lat: 90, lng: -127.5 }] },
  { name: 'UTC-8', offset: -8, boundaries: [{ lat: -90, lng: -127.5 }, { lat: 90, lng: -112.5 }] },
  { name: 'UTC-7', offset: -7, boundaries: [{ lat: -90, lng: -112.5 }, { lat: 90, lng: -97.5 }] },
  { name: 'UTC-6', offset: -6, boundaries: [{ lat: -90, lng: -97.5 }, { lat: 90, lng: -82.5 }] },
  { name: 'UTC-5', offset: -5, boundaries: [{ lat: -90, lng: -82.5 }, { lat: 90, lng: -67.5 }] },
  { name: 'UTC-4', offset: -4, boundaries: [{ lat: -90, lng: -67.5 }, { lat: 90, lng: -52.5 }] },
  { name: 'UTC-3', offset: -3, boundaries: [{ lat: -90, lng: -52.5 }, { lat: 90, lng: -37.5 }] },
  { name: 'UTC-2', offset: -2, boundaries: [{ lat: -90, lng: -37.5 }, { lat: 90, lng: -22.5 }] },
  { name: 'UTC-1', offset: -1, boundaries: [{ lat: -90, lng: -22.5 }, { lat: 90, lng: -7.5 }] },
  { name: 'UTC+0', offset: 0, boundaries: [{ lat: -90, lng: -7.5 }, { lat: 90, lng: 7.5 }] },
  { name: 'UTC+1', offset: 1, boundaries: [{ lat: -90, lng: 7.5 }, { lat: 90, lng: 22.5 }] },
  { name: 'UTC+2', offset: 2, boundaries: [{ lat: -90, lng: 22.5 }, { lat: 90, lng: 37.5 }] },
  { name: 'UTC+3', offset: 3, boundaries: [{ lat: -90, lng: 37.5 }, { lat: 90, lng: 52.5 }] },
  { name: 'UTC+4', offset: 4, boundaries: [{ lat: -90, lng: 52.5 }, { lat: 90, lng: 67.5 }] },
  { name: 'UTC+5', offset: 5, boundaries: [{ lat: -90, lng: 67.5 }, { lat: 90, lng: 82.5 }] },
  { name: 'UTC+6', offset: 6, boundaries: [{ lat: -90, lng: 82.5 }, { lat: 90, lng: 97.5 }] },
  { name: 'UTC+7', offset: 7, boundaries: [{ lat: -90, lng: 97.5 }, { lat: 90, lng: 112.5 }] },
  { name: 'UTC+8', offset: 8, boundaries: [{ lat: -90, lng: 112.5 }, { lat: 90, lng: 127.5 }] },
  { name: 'UTC+9', offset: 9, boundaries: [{ lat: -90, lng: 127.5 }, { lat: 90, lng: 142.5 }] },
  { name: 'UTC+10', offset: 10, boundaries: [{ lat: -90, lng: 142.5 }, { lat: 90, lng: 157.5 }] },
  { name: 'UTC+11', offset: 11, boundaries: [{ lat: -90, lng: 157.5 }, { lat: 90, lng: 172.5 }] },
  { name: 'UTC+12', offset: 12, boundaries: [{ lat: -90, lng: 172.5 }, { lat: 90, lng: 180 }] }
];

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Get timezone for given coordinates
const getTimezone = (coordinates) => {
  const { lat, lng } = coordinates;
  
  // Find timezone based on longitude primarily
  for (const timezone of TIMEZONES) {
    const [west, east] = timezone.boundaries;
    if (lng >= west.lng && lng < east.lng) {
      return timezone;
    }
  }
  
  // Handle edge case for 180/-180 longitude boundary
  if (lng >= 172.5 || lng < -172.5) {
    return lng >= 172.5 ? TIMEZONES[TIMEZONES.length - 1] : TIMEZONES[0];
  }
  
  return TIMEZONES[12]; // Default to UTC+0
};

// Get closest timezones to given coordinates
const getClosestTimezones = (coordinates) => {
  const { lat, lng } = coordinates;
  
  // Calculate distances to all timezone boundaries
  const timezoneDistances = TIMEZONES.map(timezone => {
    const [west, east] = timezone.boundaries;
    const centerLng = (west.lng + east.lng) / 2;
    const distance = calculateDistance(lat, lng, lat, centerLng);
    return { timezone, distance };
  });
  
  // Sort by distance and return closest two
  timezoneDistances.sort((a, b) => a.distance - b.distance);
  return [timezoneDistances[0], timezoneDistances[1]];
};

// Main function to get exact time based on coordinates
const getExactTime = (coordinates) => {
  const currentTimezone = getTimezone(coordinates);
  const closestTimezones = getClosestTimezones(coordinates);
  
  const { lat, lng } = coordinates;
  
  // Calculate how close we are to the boundary between two timezones
  const [closest, secondClosest] = closestTimezones;
  
  // If we're in the exact center of a timezone, no correction needed
  if (closest.timezone === currentTimezone && closest.distance < 100) {
    return new Date();
  }
  
  // Calculate interpolation factor based on distance to boundaries
  const totalDistance = closest.distance + secondClosest.distance;
  const interpolationFactor = totalDistance > 0 ? closest.distance / totalDistance : 0;
  
  // Calculate offset adjustment (maximum 30 minutes in either direction)
  const maxAdjustment = 30 * 60 * 1000; // 30 minutes in milliseconds
  const adjustment = (interpolationFactor - 0.5) * maxAdjustment;
  
  // Get current UTC time and apply adjustment
  const now = new Date();
  const exactTime = new Date(now.getTime() + adjustment);
  
  return {
    exactTime,
    currentTimezone: currentTimezone.name,
    adjustment: Math.round(adjustment / (60 * 1000)), // adjustment in minutes
    coordinates
  };
};

// Export functions for use in HTML
window.ExactaClock = {
  getExactTime,
  getTimezone,
  getClosestTimezones
};