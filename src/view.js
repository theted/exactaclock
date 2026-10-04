import {
  formatClock,
  formatCoordinates,
  formatDate,
  formatDistance,
  formatDuration,
  formatLongitude,
  formatOffset,
  formatPlace,
  formatSolarNoon
} from './format.js';

export const $ = id => document.getElementById(id);

// Writes only when the text actually changes, so the 4 Hz tick is cheap.
const setText = (id, text) => {
  const element = $(id);
  if (element.textContent !== text) element.textContent = text;
};

const STATUS_LABELS = {
  locating: 'Locating…',
  live: 'Live location',
  manual: 'Pinned on map',
  error: 'Location off'
};

/* ── Pure helpers (tested) ──────────────────────────────────────────── */

// Where the marker sits on the zone strip, and the filled span between it and
// the central meridian, as percentages of the strip's width.
export const stripGeometry = ratio => {
  const position = 50 + 50 * Math.max(-1, Math.min(1, ratio));
  return {
    position,
    fillStart: Math.min(50, position),
    fillSize: Math.abs(position - 50)
  };
};

// The sun-versus-clock story, in words.
export const describeDifference = ({
  adjustmentMinutes,
  timezone,
  closestTimezones: [{ distanceKm }]
}) => {
  const zone = timezone.name;
  const meridian = `${formatLongitude(timezone.center)} meridian`;
  const agree = `where the sun and ${zone} clocks agree exactly.`;

  if (Math.round(Math.abs(adjustmentMinutes) * 60) === 0) {
    return {
      amount: 'In step',
      direction: `with ${zone} clocks`,
      detail: `You’re right on the ${meridian}, ${agree}`
    };
  }

  const ahead = adjustmentMinutes > 0;
  return {
    amount: formatDuration(adjustmentMinutes),
    direction: `${ahead ? 'ahead of' : 'behind'} ${zone} clocks`,
    detail: `You’re ${formatDistance(distanceKm)} ${ahead ? 'east' : 'west'} of the ${meridian}, ${agree}`
  };
};

const inRange = (value, limit) =>
  Number.isFinite(value) && Math.abs(value) <= limit;

// Validates a typed coordinate pair, naming the first field that is off.
export const parseCoordinates = (latText, lngText) => {
  const lat = Number.parseFloat(latText);
  const lng = Number.parseFloat(lngText);
  if (!inRange(lat, 90)) {
    return { error: 'Latitude must be between -90 and 90.', field: 'latInput' };
  }
  if (!inRange(lng, 180)) {
    return {
      error: 'Longitude must be between -180 and 180.',
      field: 'lngInput'
    };
  }
  return { coordinates: { lat, lng } };
};

/* ── Rendering ──────────────────────────────────────────────────────── */

// Everything that moves with the second hand.
export const renderClock = ({ now, exactTime, standardTime }) => {
  const solar = formatClock(exactTime);
  setText('solarHm', solar.slice(0, 5));
  setText('solarSec', solar.slice(5));
  setText('solarDate', formatDate(exactTime));
  setText('zoneTime', formatClock(standardTime));
  setText('utcTime', formatClock(now));
  const title = `${solar.slice(0, 5)} solar time · Exactaclock`;
  if (document.title !== title) document.title = title;
};

// Everything that only changes when the location does.
export const renderPosition = result => {
  const { timezone, coordinates, nearestCity, adjustmentRatio } = result;
  const { amount, direction, detail } = describeDifference(result);

  setText('placeName', formatPlace(nearestCity));
  setText('zoneName', timezone.name);

  setText('diffAmount', amount);
  setText('diffDirection', direction);
  setText('diffDetail', detail);

  const { position, fillStart, fillSize } = stripGeometry(adjustmentRatio);
  const strip = $('strip').style;
  strip.setProperty('--position', `${position}%`);
  strip.setProperty('--fill-start', `${fillStart}%`);
  strip.setProperty('--fill-size', `${fillSize}%`);
  setText('stripWest', formatLongitude(timezone.west));
  setText('stripCenter', formatLongitude(timezone.center));
  setText('stripEast', formatLongitude(timezone.east));

  setText('zoneFull', `${timezone.name} · ${timezone.fullName}`);
  setText('solarNoon', formatSolarNoon(result.adjustmentMinutes));
  setText(
    'solarOffset',
    formatOffset(result.solarOffsetMinutes, { seconds: true })
  );
  setText('coordinates', formatCoordinates(coordinates));
};

export const renderStatus = ({ source, notice }) => {
  $('status').dataset.state = source;
  setText('statusText', STATUS_LABELS[source]);
  $('notice').hidden = !notice;
  setText('noticeText', notice);
  $('locateBtn').setAttribute(
    'aria-pressed',
    String(source === 'live' || source === 'locating')
  );
  // Dim the readouts while they still show a placeholder location.
  document.body.toggleAttribute('data-pending', source === 'locating');
};

export const renderPresets = (presets, onSelect) => {
  const buttons = presets.map(preset => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip';
    button.textContent = preset.label;
    button.addEventListener('click', () => onSelect(preset));
    return button;
  });
  $('presets').append(...buttons);
};

// Mirrors the pin into the form, unless someone is typing in it.
export const fillCoordinateInputs = ({ lat, lng }) => {
  if ($('coordsForm').contains(document.activeElement)) return;
  $('latInput').value = lat.toFixed(4);
  $('lngInput').value = lng.toFixed(4);
};
