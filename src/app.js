import { DEFAULT_LOCATION, PRESET_LOCATIONS } from './constants.js';
import { getExactTime } from './exactaclock.js';
import { createLocator } from './geolocation.js';
import { createMap } from './map.js';
import {
  $,
  fillCoordinateInputs,
  parseCoordinates,
  renderClock,
  renderPosition,
  renderPresets,
  renderStatus
} from './view.js';

const TICK_MS = 250;
// Movement smaller than this is GPS jitter, not travel (~110 m).
const MOVEMENT_THRESHOLD_DEGREES = 0.001;

// `source` is one of: locating, live, manual, error.
const state = { location: DEFAULT_LOCATION, source: 'locating', notice: '' };

const hasMoved = ({ lat, lng }) =>
  Math.abs(lat - state.location.lat) > MOVEMENT_THRESHOLD_DEGREES ||
  Math.abs(lng - state.location.lng) > MOVEMENT_THRESHOLD_DEGREES;

let map = null;

const setStatus = (source, notice = '') => {
  Object.assign(state, { source, notice });
  renderStatus(state);
  map?.setLive(source === 'live');
};

const setLocation = (location, options) => {
  state.location = location;
  map?.setLocation(location, options);
  fillCoordinateInputs(location);
  const result = getExactTime(location);
  renderPosition(result);
  renderClock(result);
};

const locator = createLocator({
  onPosition: coordinates => {
    const firstFix = state.source !== 'live';
    if (firstFix || hasMoved(coordinates)) {
      setLocation(coordinates, { recenter: true });
    }
    if (firstFix) setStatus('live');
  },
  // The clock keeps running wherever the pin already is; the notice says why
  // and how to move on.
  onError: reason => {
    const next =
      state.location === DEFAULT_LOCATION
        ? 'Showing Greenwich for now — pick any spot on the map instead.'
        : 'Pick any spot on the map instead.';
    setStatus('error', `${reason} ${next}`);
  }
});

const locate = () => {
  setStatus('locating');
  locator.start();
};

// Any hands-on choice of place stops GPS tracking — no mode switch needed.
const pick = (coordinates, options) => {
  locator.stop();
  setStatus('manual');
  setLocation(coordinates, options);
  $('mapHint').hidden = true;
};

const submitCoordinates = event => {
  event.preventDefault();
  const { coordinates, error, field } = parseCoordinates(
    $('latInput').value,
    $('lngInput').value
  );
  $('coordsError').textContent = error ?? '';
  if (error) {
    $(field).focus();
    return;
  }
  pick(coordinates, { recenter: true });
};

const init = () => {
  map = createMap($('map'), { center: state.location, onPick: pick });
  if (!map) $('mapPanel').dataset.offline = '';

  renderPresets(PRESET_LOCATIONS, ({ lat, lng }) =>
    pick({ lat, lng }, { recenter: true })
  );
  $('locateBtn').addEventListener('click', locate);
  $('retryBtn').addEventListener('click', locate);
  $('coordsForm').addEventListener('submit', submitCoordinates);

  setLocation(state.location);
  setInterval(() => renderClock(getExactTime(state.location)), TICK_MS);
  locate();
};

init();
