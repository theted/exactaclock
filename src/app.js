import {
  DEFAULT_LOCATION,
  MAX_ADJUSTMENT_MINUTES,
  PRESET_LOCATIONS,
  ZONE_BOUNDARIES
} from './constants.js';
import { getExactTime } from './exactaclock.js';
import {
  formatAdjustment,
  formatClock,
  formatCoordinates,
  formatDate,
  formatDistance,
  formatOffset
} from './format.js';

const $ = id => document.getElementById(id);

// Movement smaller than this is GPS jitter, not travel (~110 m).
const MOVEMENT_THRESHOLD_DEGREES = 0.001;
const TICK_MS = 250;
const LOCATION_TIMEOUT_MS = 10000;

const DIAL = { cx: 50, cy: 50, radius: 40, sweepDegrees: 120 };

// Point on the gauge for a signed ratio in [-1, 1], measured from 12 o'clock.
const dialPoint = ratio => {
  const angle = (ratio * DIAL.sweepDegrees * Math.PI) / 180;
  return {
    x: DIAL.cx + DIAL.radius * Math.sin(angle),
    y: DIAL.cy - DIAL.radius * Math.cos(angle)
  };
};

const dialArcPath = ratio => {
  const clamped = Math.max(-1, Math.min(1, ratio));
  if (Math.abs(clamped) < 0.005) return '';
  const start = dialPoint(0);
  const end = dialPoint(clamped);
  const sweepFlag = clamped > 0 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${DIAL.radius} ${DIAL.radius} 0 0 ${sweepFlag} ${end.x} ${end.y}`;
};

class ExactaClockApp {
  constructor() {
    this.location = DEFAULT_LOCATION;
    this.hasFix = false;
    this.isManualMode = false;
    this.showMeridians = true;
    this.watchId = null;
    this.tickId = null;
    this.requestTimeoutId = null;
    this.lastRendered = null;
    this.map = null;
    this.marker = null;
    this.meridianLayer = null;
    this.zoneBand = null;
  }

  init = () => {
    this.renderPresets();
    this.bindEvents();
    this.initMap();
    this.startClock();
    this.requestLocation();
  };

  bindEvents = () => {
    $('locationBtn').addEventListener('click', this.requestLocation);
    $('skipLocationBtn').addEventListener('click', () => {
      clearTimeout(this.requestTimeoutId);
      this.hidePermissionPrompt();
      this.switchToManualMode();
      this.setStatus(
        'Exploring manually. Drag the pin or click anywhere on the map.'
      );
    });
    $('gpsMode').addEventListener('click', this.switchToGpsMode);
    $('manualMode').addEventListener('click', this.switchToManualMode);
    $('applyCoords').addEventListener('click', this.applyTypedCoordinates);
    $('toggleMeridians').addEventListener('click', this.toggleMeridians);

    // Enter in either coordinate box applies the pair.
    ['latInput', 'lngInput'].forEach(id => {
      $(id).addEventListener('keydown', event => {
        if (event.key === 'Enter') this.applyTypedCoordinates();
      });
    });

    window.addEventListener('beforeunload', this.stopTracking);
  };

  renderPresets = () => {
    const container = $('presets');
    PRESET_LOCATIONS.forEach(({ label, lat, lng }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'button button--ghost';
      button.textContent = label;
      button.addEventListener('click', () => {
        this.switchToManualMode();
        this.setLocation({ lat, lng }, { recenter: true });
      });
      container.append(button);
    });
  };

  /* ── Location ─────────────────────────────────────────────────────── */

  requestLocation = () => {
    if (!navigator.geolocation) {
      this.setStatus(
        'This browser has no geolocation support — pick a spot on the map instead.',
        'error'
      );
      this.switchToManualMode();
      return;
    }

    this.setStatus('Requesting your location…');

    // Some browsers never invoke either callback when the permission prompt is
    // suppressed, ignoring the `timeout` option entirely. Without this
    // watchdog the app would sit on "Requesting…" forever with no way out.
    clearTimeout(this.requestTimeoutId);
    this.requestTimeoutId = setTimeout(
      () =>
        this.fallBackToManual('Your location is taking too long to arrive.'),
      LOCATION_TIMEOUT_MS + 2000
    );

    navigator.geolocation.getCurrentPosition(
      position => {
        clearTimeout(this.requestTimeoutId);
        this.hidePermissionPrompt();
        this.hasFix = true;
        this.isManualMode = false;
        this.syncModeButtons();
        this.setLocation(toCoordinates(position), { recenter: true });
        this.setStatus('Live GPS fix. The clock follows you as you move.');
        this.startTracking();
      },
      this.onLocationError,
      {
        enableHighAccuracy: true,
        timeout: LOCATION_TIMEOUT_MS,
        maximumAge: 0
      }
    );
  };

  onLocationError = error => {
    const reasons = {
      [error.PERMISSION_DENIED]: 'Location access was denied.',
      [error.POSITION_UNAVAILABLE]: 'Your location is currently unavailable.',
      [error.TIMEOUT]: 'The location request timed out.'
    };
    this.fallBackToManual(
      reasons[error.code] ?? 'Your location could not be read.'
    );
  };

  // Always leaves the app usable: the clock keeps running on the fallback
  // location and the user can pick anywhere on the map.
  fallBackToManual = reason => {
    clearTimeout(this.requestTimeoutId);
    this.setStatus(
      `${reason} Showing the Royal Observatory in Greenwich — pick anywhere on the map, or try again.`,
      'error'
    );
    this.showPermissionPrompt();
    this.switchToManualMode();
  };

  startTracking = () => {
    if (this.watchId !== null || !navigator.geolocation) return;
    this.watchId = navigator.geolocation.watchPosition(
      position => {
        const next = toCoordinates(position);
        if (this.isManualMode || !this.hasMoved(next)) return;
        this.hasFix = true;
        this.setLocation(next, { recenter: true });
      },
      error => {
        if (error.code === error.PERMISSION_DENIED) {
          this.stopTracking();
          this.onLocationError(error);
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  };

  stopTracking = () => {
    if (this.watchId === null) return;
    navigator.geolocation.clearWatch(this.watchId);
    this.watchId = null;
  };

  hasMoved = ({ lat, lng }) =>
    Math.abs(lat - this.location.lat) > MOVEMENT_THRESHOLD_DEGREES ||
    Math.abs(lng - this.location.lng) > MOVEMENT_THRESHOLD_DEGREES;

  setLocation = (coordinates, { recenter = false } = {}) => {
    this.location = coordinates;
    this.syncMarker(recenter);
    this.syncCoordinateInputs();
    this.render();
  };

  /* ── Modes ────────────────────────────────────────────────────────── */

  switchToGpsMode = () => {
    this.isManualMode = false;
    this.syncModeButtons();
    this.marker?.dragging.disable();
    this.requestLocation();
  };

  switchToManualMode = () => {
    clearTimeout(this.requestTimeoutId);
    this.isManualMode = true;
    this.syncModeButtons();
    this.marker?.dragging.enable();
    this.stopTracking();
    this.syncCoordinateInputs();
  };

  syncModeButtons = () => {
    const manual = this.isManualMode;
    $('gpsMode').setAttribute('aria-pressed', String(!manual));
    $('manualMode').setAttribute('aria-pressed', String(manual));
    $('manualControls').hidden = !manual;
    $('mapHint').textContent = manual
      ? 'Drag the pin, click the map, or type coordinates to compare locations.'
      : 'Tracking your location automatically.';
  };

  syncCoordinateInputs = () => {
    $('latInput').value = this.location.lat.toFixed(4);
    $('lngInput').value = this.location.lng.toFixed(4);
  };

  applyTypedCoordinates = () => {
    const lat = Number.parseFloat($('latInput').value);
    const lng = Number.parseFloat($('lngInput').value);
    const error = $('coordsError');

    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      error.textContent = 'Latitude must be between -90 and 90.';
      $('latInput').focus();
      return;
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      error.textContent = 'Longitude must be between -180 and 180.';
      $('lngInput').focus();
      return;
    }

    error.textContent = '';
    this.setLocation({ lat, lng }, { recenter: true });
  };

  /* ── Map ──────────────────────────────────────────────────────────── */

  initMap = () => {
    if (this.map) return;
    if (!window.L) {
      $('mapHint').textContent =
        'The map library could not be loaded — the clock below still works.';
      return;
    }

    this.map = L.map('map', { worldCopyJump: true }).setView(
      [this.location.lat, this.location.lng],
      5
    );

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    this.meridianLayer = L.layerGroup().addTo(this.map);
    this.drawMeridians();

    this.marker = L.marker([this.location.lat, this.location.lng], {
      draggable: true,
      keyboard: true,
      title: 'Selected location'
    }).addTo(this.map);
    this.marker.dragging.disable();

    this.marker.on('dragend', event => {
      if (!this.isManualMode) return;
      const { lat, lng } = event.target.getLatLng();
      this.setLocation({ lat, lng });
    });

    this.map.on('click', event => {
      if (!this.isManualMode) return;
      const { lat, lng } = event.latlng;
      this.setLocation({ lat, lng }, { recenter: false });
    });
  };

  syncMarker = recenter => {
    if (!this.marker) return;
    const position = [this.location.lat, this.location.lng];
    this.marker.setLatLng(position);
    if (recenter) this.map.setView(position, this.map.getZoom());
    this.drawZoneBand();
  };

  drawMeridians = () => {
    if (!this.meridianLayer) return;
    this.meridianLayer.clearLayers();
    this.zoneBand = null;
    if (!this.showMeridians) return;

    ZONE_BOUNDARIES.forEach(lng => {
      L.polyline(
        [
          [-85, lng],
          [85, lng]
        ],
        {
          color: '#38bdc8',
          weight: 1,
          opacity: 0.45,
          dashArray: '4 6',
          interactive: false
        }
      ).addTo(this.meridianLayer);
    });

    this.drawZoneBand();
  };

  // Shades the nominal zone the pin sits in and marks its central meridian —
  // the line where solar time and clock time agree exactly.
  drawZoneBand = () => {
    if (!this.meridianLayer || !this.showMeridians) return;
    if (this.zoneBand) this.meridianLayer.removeLayer(this.zoneBand);

    const { timezone } = getExactTime(this.location);
    this.zoneBand = L.layerGroup([
      L.rectangle(
        [
          [-85, timezone.west],
          [85, timezone.east]
        ],
        {
          color: '#38bdc8',
          weight: 0,
          fillOpacity: 0.08,
          interactive: false
        }
      ),
      L.polyline(
        [
          [-85, timezone.center],
          [85, timezone.center]
        ],
        { color: '#38bdc8', weight: 2, opacity: 0.8, interactive: false }
      )
    ]).addTo(this.meridianLayer);
  };

  toggleMeridians = () => {
    this.showMeridians = !this.showMeridians;
    $('toggleMeridians').setAttribute(
      'aria-pressed',
      String(this.showMeridians)
    );
    this.zoneBand = null;
    this.drawMeridians();
  };

  /* ── Clock ────────────────────────────────────────────────────────── */

  startClock = () => {
    this.render();
    this.tickId = setInterval(this.render, TICK_MS);
  };

  render = () => {
    const result = getExactTime(this.location);
    const exact = formatClock(result.exactTime);

    // Re-paint the whole panel only when the visible second actually changes.
    const signature = `${exact}|${result.coordinates.lat}|${result.coordinates.lng}`;
    if (signature === this.lastRendered) return;
    this.lastRendered = signature;

    $('clock').hidden = false;
    $('dial').hidden = false;
    $('facts').hidden = false;

    $('exactTime').textContent = exact;
    $('exactDate').textContent = formatDate(result.exactTime);

    const city = result.nearestCity;
    $('nearestCity').textContent =
      `${formatDistance(city.distanceKm)} from ${city.name}`;

    const { adjustmentMinutes, adjustmentRatio } = result;
    const direction =
      Math.abs(adjustmentMinutes) < 0.5 / 60
        ? 'level'
        : adjustmentMinutes > 0
          ? 'ahead'
          : 'behind';

    $('dial').dataset.direction = direction;
    $('dialArc').setAttribute('d', dialArcPath(adjustmentRatio));
    $('dialReadout').textContent = formatAdjustment(adjustmentMinutes);
    $('dialLabel').textContent =
      direction === 'level'
        ? `On the ${result.timezone.name} central meridian — clock time is already solar time.`
        : `${direction === 'ahead' ? 'Ahead of' : 'Behind'} ${result.timezone.name}, out of a possible ${MAX_ADJUSTMENT_MINUTES} min.`;

    $('standardTime').textContent = formatClock(result.standardTime);
    $('utcTime').textContent = formatClock(result.now);
    $('timezone').textContent = result.timezone.name;
    $('timezoneFull').textContent = result.timezone.fullName;
    $('solarOffset').textContent = formatOffset(result.solarOffsetMinutes);
    $('coordinates').textContent = formatCoordinates(result.coordinates);
  };

  /* ── Status ───────────────────────────────────────────────────────── */

  setStatus = (message, tone = 'info') => {
    const status = $('status');
    status.hidden = false;
    status.dataset.tone = tone;
    $('statusMessage').textContent = message;
  };

  showPermissionPrompt = () => {
    $('permissionPrompt').hidden = false;
  };

  hidePermissionPrompt = () => {
    $('permissionPrompt').hidden = true;
  };
}

const toCoordinates = position => ({
  lat: position.coords.latitude,
  lng: position.coords.longitude
});

const app = new ExactaClockApp();
app.init();

export default app;
