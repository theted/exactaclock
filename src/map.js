import { ZONE_BOUNDARIES } from './constants.js';
import { getTimezone } from './exactaclock.js';

// Standard OSM tiles; map.css mutes them (and inverts them in dark mode) so
// the zone overlay stays the loudest thing on the map.
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Web Mercator runs out just short of the poles.
const POLE = 85;

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const toLatLng = ({ lat, lng }) => [lat, lng];
const meridianPath = lng => [
  [-POLE, lng],
  [POLE, lng]
];

// Overlay colours live in CSS (see map.css), keyed off these class names, so
// they follow the theme without any JavaScript.
const meridian = (lng, className) =>
  L.polyline(meridianPath(lng), { className, interactive: false });

/**
 * @param {HTMLElement} element
 * @param {{center: {lat: number, lng: number}, onPick: Function}} options
 *   `onPick` receives coordinates whenever the user clicks the map or drops
 *   the pin somewhere new.
 * @returns {{setLocation: Function, setLive: Function} | null} null when the
 *   map library failed to load.
 */
export const createMap = (element, { center, onPick }) => {
  if (!window.L) return null;

  const map = L.map(element, { worldCopyJump: true, zoomControl: false });
  map.setView(toLatLng(center), element.clientWidth < 600 ? 4 : 5);
  map.attributionControl.setPrefix(false);
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  L.tileLayer(TILE_URL, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(map);

  ZONE_BOUNDARIES.forEach(lng => meridian(lng, 'zone-edge').addTo(map));

  // The zone the pin sits in, and its central meridian: the one line where
  // sun time and clock time agree.
  const band = L.rectangle(
    [
      [-POLE, 0],
      [POLE, 0]
    ],
    { className: 'zone-band', interactive: false }
  ).addTo(map);
  const centralMeridian = meridian(0, 'zone-meridian').addTo(map);

  const marker = L.marker(toLatLng(center), {
    draggable: true,
    keyboard: true,
    title: 'Selected location — drag to move',
    icon: L.divIcon({
      className: 'sun-marker',
      html: '<span class="sun-marker__dot"></span>',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    })
  }).addTo(map);

  const pick = latlng => {
    const { lat, lng } = latlng.wrap();
    onPick({ lat, lng });
  };

  marker.on('dragend', () => pick(marker.getLatLng()));
  map.on('click', event => pick(event.latlng));

  const setLocation = (coordinates, { recenter = false } = {}) => {
    marker.setLatLng(toLatLng(coordinates));

    const zone = getTimezone(coordinates);
    band.setBounds([
      [-POLE, zone.west],
      [POLE, zone.east]
    ]);
    centralMeridian.setLatLngs(meridianPath(zone.center));

    if (recenter) {
      map.setView(toLatLng(coordinates), map.getZoom(), {
        animate: !reducedMotion.matches
      });
    }
  };

  const setLive = live =>
    marker.getElement()?.classList.toggle('is-live', live);

  return { setLocation, setLive };
};
