import {
  CITIES,
  DEGREES_PER_HOUR,
  MAX_ADJUSTMENT_MINUTES,
  MINUTES_PER_DEGREE,
  TIMEZONES
} from './constants.js';

const MS_PER_MINUTE = 60 * 1000;

// Great-circle distance in kilometres (Haversine). Uses both latitude and
// longitude, so it is what "nearest city" is measured with.
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Fold any longitude into [-180, 180]. In-range values are returned untouched
// so the modulo cannot introduce float drift, and so ±180 keeps the sign the
// caller gave it — the two sides of the date line are different zones.
export const normalizeLongitude = lng => {
  if (Object.is(lng, -0)) return 0;
  if (lng >= -180 && lng <= 180) return lng;
  const wrapped = ((((lng + 180) % 360) + 360) % 360) - 180;
  return Object.is(wrapped, -0) ? 0 : wrapped;
};

export const normalizeCoordinates = ({ lat, lng }) => ({
  lat: Math.min(90, Math.max(-90, lat)),
  lng: normalizeLongitude(lng)
});

// The nominal zone a coordinate sits in. Purely a function of longitude:
// every 15° west or east of Greenwich is one hour of solar time.
export const getTimezone = coordinates => {
  const { lng } = normalizeCoordinates(coordinates);
  const offset = Math.round(lng / DEGREES_PER_HOUR);
  // lng = 180 rounds to +12, which is the correct half-zone.
  return TIMEZONES.find(zone => zone.offset === offset) ?? TIMEZONES[12];
};

// The two zones bracketing a coordinate: the one it sits in, and the
// neighbour it is drifting towards. `distanceKm` is measured to each zone's
// central meridian along the coordinate's own parallel.
export const getClosestTimezones = coordinates => {
  const { lat, lng } = normalizeCoordinates(coordinates);
  const current = getTimezone({ lat, lng });
  const towardsEast = lng >= current.center;
  const neighbourOffset = current.offset + (towardsEast ? 1 : -1);
  const neighbour =
    TIMEZONES.find(zone => zone.offset === neighbourOffset) ?? current;

  const describe = zone => ({
    timezone: zone,
    distanceKm: calculateDistance(lat, lng, lat, zone.center),
    distanceDegrees: Math.abs(lng - zone.center)
  });

  return [describe(current), describe(neighbour)];
};

// Mean solar time offset from UTC, in minutes. 4 minutes per degree east.
export const getSolarOffsetMinutes = coordinates =>
  normalizeCoordinates(coordinates).lng * MINUTES_PER_DEGREE;

// How far the sun-accurate time runs ahead of (+) or behind (-) the nominal
// zone's clock. Zero on the central meridian, ±30 min at the zone edges.
export const getAdjustmentMinutes = coordinates => {
  const zone = getTimezone(coordinates);
  return getSolarOffsetMinutes(coordinates) - zone.offset * 60;
};

export const getNearestCity = coordinates => {
  const { lat, lng } = normalizeCoordinates(coordinates);
  return CITIES.reduce(
    (best, city) => {
      const distanceKm = calculateDistance(lat, lng, city.lat, city.lng);
      return distanceKm < best.distanceKm ? { ...city, distanceKm } : best;
    },
    { distanceKm: Infinity }
  );
};

// A Date whose *UTC* fields read as the given wall-clock time. Formatting it
// with `timeZone: 'UTC'` therefore prints that wall clock verbatim, without
// the browser's own timezone leaking in.
const shiftUtc = (instant, minutes) =>
  new Date(instant.getTime() + minutes * MS_PER_MINUTE);

/**
 * Corrected time for a GPS coordinate.
 *
 * @param {{lat: number, lng: number}} coordinates
 * @param {Date} [now] the true instant, injectable for tests
 * @returns {object} times (read via UTC getters) plus the correction applied
 */
export const getExactTime = (coordinates, now = new Date()) => {
  const location = normalizeCoordinates(coordinates);
  const timezone = getTimezone(location);
  const solarOffsetMinutes = getSolarOffsetMinutes(location);
  const adjustmentMinutes = solarOffsetMinutes - timezone.offset * 60;
  const adjustmentMilliseconds = Math.round(adjustmentMinutes * MS_PER_MINUTE);

  return {
    now,
    // Sun-accurate local time at this exact longitude.
    exactTime: shiftUtc(now, solarOffsetMinutes),
    // What a normal clock on the wall would say in this zone.
    standardTime: shiftUtc(now, timezone.offset * 60),
    timezone,
    currentTimezone: timezone.name,
    timezoneFull: timezone.fullName,
    solarOffsetMinutes,
    adjustmentMinutes,
    adjustmentSeconds: adjustmentMinutes * 60,
    adjustmentSecondsTotal: Math.round(adjustmentMinutes * 60),
    adjustmentMilliseconds,
    // -1 at the western edge of the zone, 0 on the meridian, +1 at the east.
    adjustmentRatio: adjustmentMinutes / MAX_ADJUSTMENT_MINUTES,
    closestTimezones: getClosestTimezones(location),
    nearestCity: getNearestCity(location),
    coordinates: location
  };
};

// Keep the browser global for non-module consumers (e.g. the console).
if (typeof window !== 'undefined') {
  window.ExactaClock = {
    calculateDistance,
    getAdjustmentMinutes,
    getClosestTimezones,
    getExactTime,
    getNearestCity,
    getSolarOffsetMinutes,
    getTimezone
  };
}
