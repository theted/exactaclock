// Formatting helpers. Everything reads Dates through their UTC fields, because
// `getExactTime` returns wall-clock instants pre-shifted into UTC.

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

export const formatOffset = minutes => {
  const sign = minutes < 0 ? '-' : '+';
  const total = Math.round(Math.abs(minutes));
  return `${sign}${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
};

export const formatDistance = km =>
  km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km).toLocaleString()} km`;

// "12 min 30 s ahead of Central European Time" style summaries.
export const formatAdjustment = adjustmentMinutes => {
  const totalSeconds = Math.round(Math.abs(adjustmentMinutes) * 60);
  if (totalSeconds === 0) return 'Exactly on the central meridian';

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const magnitude = [
    minutes > 0 ? `${minutes} min` : null,
    seconds > 0 ? `${seconds} s` : null
  ]
    .filter(Boolean)
    .join(' ');

  return `${magnitude} ${adjustmentMinutes > 0 ? 'ahead' : 'behind'}`;
};
