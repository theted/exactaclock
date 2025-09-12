// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Get timezone for given coordinates
const getTimezone = coordinates => {
  const { lng } = coordinates;

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
const getClosestTimezones = coordinates => {
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
const getExactTime = coordinates => {
  const currentTimezone = getTimezone(coordinates);
  const closestTimezones = getClosestTimezones(coordinates);

  // Calculate how close we are to the boundary between two timezones
  const [closest, secondClosest] = closestTimezones;

  // If we're in the exact center of a timezone, no correction needed
  if (closest.timezone === currentTimezone && closest.distance < 100) {
    return {
      exactTime: new Date(),
      currentTimezone: currentTimezone.name,
      timezoneFull: currentTimezone.fullName,
      adjustment: 0,
      adjustmentMinutes: 0,
      adjustmentSeconds: 0,
      adjustmentSecondsTotal: 0,
      adjustmentMilliseconds: 0,
      coordinates
    };
  }

  // Calculate interpolation factor based on distance to boundaries
  const totalDistance = closest.distance + secondClosest.distance;
  const interpolationFactor =
    totalDistance > 0 ? closest.distance / totalDistance : 0;

  // Calculate offset adjustment (maximum 30 minutes in either direction)
  const maxAdjustment = 30 * 60 * 1000; // 30 minutes in milliseconds
  const adjustment = (interpolationFactor - 0.5) * maxAdjustment;

  // Get current UTC time and apply adjustment
  const now = new Date();
  const exactTime = new Date(now.getTime() + adjustment);

  // Calculate adjustment in different units with high precision
  const adjustmentMilliseconds = Math.round(adjustment);
  const adjustmentSeconds = Math.round((adjustment / 1000) * 100) / 100; // 2 decimal places
  const adjustmentMinutes = Math.round((adjustment / (60 * 1000)) * 100) / 100; // 2 decimal places
  const adjustmentSecondsTotal = Math.round(adjustment / 1000); // whole seconds for display

  return {
    exactTime,
    currentTimezone: currentTimezone.name,
    timezoneFull: currentTimezone.fullName,
    adjustment: adjustmentMinutes, // backwards compatibility
    adjustmentMinutes,
    adjustmentSeconds,
    adjustmentSecondsTotal,
    adjustmentMilliseconds,
    coordinates
  };
};

// Export functions for use in HTML
window.ExactaClock = {
  getExactTime,
  getTimezone,
  getClosestTimezones
};
