// Formatting helpers. Everything reads Dates through their UTC fields, because
// `getExactTime` returns wall-clock instants pre-shifted into UTC.

// Closer than this to a city and the readout just names it.
const NEARBY_KM = 25;

const pad = value => String(value).padStart(2, '0');

export const formatClock = (date, { seconds = true } = {}) => {
  const parts = [pad(date.getUTCHours()), pad(date.getUTCMinutes())];
  if (seconds) parts.push(pad(date.getUTCSeconds()));
  return parts.join(':');
};

export const formatDate = date =>
  date.toLocaleDateString(undefined, {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

export const formatCoordinates = ({ lat, lng }) =>
  `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}, ` +
  `${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`;

// Meridian labels: "15° E", "7.5° W", and no hemisphere on 0° or 180°.
export const formatLongitude = lng => {
  const value = Math.round(Math.abs(lng) * 100) / 100;
  if (value === 0 || value === 180) return `${value}°`;
  return `${value}° ${lng > 0 ? 'E' : 'W'}`;
};

// "+01:12", or "+01:12:16" with seconds, rounded to the last unit shown.
export const formatOffset = (minutes, { seconds = false } = {}) => {
  const unit = seconds ? 1 : 60;
  const total = Math.round((Math.abs(minutes) * 60) / unit) * unit;
  const parts = [Math.floor(total / 3600), Math.floor(total / 60) % 60];
  if (seconds) parts.push(total % 60);
  return `${minutes < 0 ? '-' : '+'}${parts.map(pad).join(':')}`;
};

export const formatDistance = km =>
  km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km).toLocaleString()} km`;

export const formatPlace = ({ name, country, distanceKm }) =>
  distanceKm < NEARBY_KM
    ? `${name}, ${country}`
    : `${formatDistance(distanceKm)} from ${name}, ${country}`;

// Unsigned "12 min 30 s" magnitude of a difference in minutes.
export const formatDuration = minutes => {
  const totalSeconds = Math.round(Math.abs(minutes) * 60);
  const wholeMinutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return [
    wholeMinutes > 0 && `${wholeMinutes} min`,
    (seconds > 0 || totalSeconds === 0) && `${seconds} s`
  ]
    .filter(Boolean)
    .join(' ');
};

// "12 min 30 s ahead" style summaries.
export const formatAdjustment = adjustmentMinutes => {
  if (Math.round(Math.abs(adjustmentMinutes) * 60) === 0) {
    return 'Exactly on the central meridian';
  }
  return `${formatDuration(adjustmentMinutes)} ${adjustmentMinutes > 0 ? 'ahead' : 'behind'}`;
};

// When the sun peaks, read off the zone clock: noon minus the correction.
export const formatSolarNoon = adjustmentMinutes =>
  formatClock(new Date(Math.round((12 * 60 - adjustmentMinutes) * 60) * 1000));
