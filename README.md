# Exactaclock 🕐

Timezones round the sun off to the nearest hour. **Exactaclock doesn't.** It reads the
true solar time at your exact longitude, so the clock drifts up to 30 minutes away from
the one on your wall as you move across a timezone.

Stand on your zone's central meridian and Exactaclock agrees with your phone exactly.
Walk to the edge of the zone and it is half an hour apart.

## How it works

Solar time is a straight function of longitude:

| Quantity                    | Value                 |
| --------------------------- | --------------------- |
| One full rotation           | 360° in 24 h          |
| One hour of sun             | 15° of longitude      |
| One minute of sun           | 0.25° of longitude    |
| **One degree of longitude** | **4 minutes of time** |

So for a coordinate at longitude λ:

```
solar offset from UTC = λ × 4 minutes
nominal zone offset   = round(λ / 15) hours
correction            = solar offset − nominal zone offset      (always within ±30 min)
```

The correction is **0 on a zone's central meridian** and grows linearly to **±30 minutes
at the zone edges**, where it flips sign as you cross into the next zone. That is the
whole model — it is continuous, symmetric, and has no special cases.

Latitude deliberately does not enter the time calculation: two points on the same
meridian see the sun cross it at the same moment, whether they are in Oslo or Cape Town.
Latitude _is_ used for the "nearest city" readout, via the Haversine formula.

> **Note:** these are _nautical_ timezones — clean 15° bands. Real political timezones
> have jagged borders, half-hour offsets and daylight saving. Exactaclock is a model of
> solar time, not a replacement for a tz database.

## Features ✨

- **☀️ Solar time, front and centre**: sun-accurate to the second at your exact longitude
- **⚖️ Sun vs. clock**: a plain-language verdict ("12 min 16 s ahead of UTC+1 clocks")
  plus a ruler of your zone that shows where you stand between its edges and its meridian
- **🗺️ Zone overlay**: every 15° band drawn on the map, your own zone shaded and its
  central meridian highlighted
- **📍 Live GPS tracking**: the clock follows you as you move
- **👆 No modes**: tap the map, drag the pin, pick a city or type coordinates to explore;
  "My location" takes you back
- **🕛 Solar noon**: when the sun actually peaks, read off your zone clock
- **🌗 Light and dark themes**: follow your system preference, map included
- **♿ Accessible**: semantic landmarks, labelled controls, keyboard focus, reduced-motion support
- **🔒 Private**: everything is computed in the browser, with no accounts and no cookies. Page
  loads are counted as daily totals, and no IP addresses are stored
- **🧪 Tested**: the app and the test suite import the same modules

## Quick start 🚀

The app is plain ES modules with no build step, but it **must be served over HTTP**
(`file://` blocks module imports, and GPS needs a secure context).

```bash
npm install
npm start          # http://localhost:3003, opens your browser
```

Or with Docker:

```bash
docker compose up  # http://localhost:3003
```

GPS requires HTTPS on anything other than `localhost`. For local HTTPS:

```bash
brew install mkcert && mkcert -install && mkcert localhost
npx http-server . -p 3003 -S -C localhost.pem -K localhost-key.pem
```

If you decline the location prompt the app still works. It falls back to the Royal
Observatory in Greenwich, and you can pick any spot on the map instead.

## Development

```bash
npm run check          # lint + format check + tests, all at once

npm test               # tests in watch mode
npm run test:run       # tests once
npm run test:coverage  # tests with coverage

npm run lint           # eslint
npm run lint:fix       # eslint, fixing what it can
npm run format         # prettier
```

`test.html` (served alongside the app) is a visual reference page: it renders the same
functions across a set of cities and a sweep across UTC+0, so you can eyeball the
correction curve. The assertions live in `src/exactaclock.test.js`.

## Project structure 📁

```
exactaclock/
├── index.html            # The app
├── test.html             # Visual calculation reference
├── eslint.config.js      # Flat ESLint config
├── vitest.config.js
└── src/
    ├── app.js            # Controller: state and wiring
    ├── view.js           # DOM rendering, plus the copy and strip geometry
    ├── map.js            # Leaflet map, zone overlay and pin
    ├── geolocation.js    # watchPosition wrapper that always reaches a verdict
    ├── constants.js      # Timezone bands, cities, presets
    ├── exactaclock.js    # Core solar-time maths (no DOM)
    ├── format.js         # Display formatting
    ├── styles/
    │   ├── base.css      # Design tokens, base elements, page layout
    │   ├── components.css
    │   └── map.css       # Map panel, overlay, Leaflet restyling
    └── *.test.js         # One test file per module
```

`exactaclock.js`, `format.js` and `geolocation.js` are DOM-free, and `view.js` keeps its
pure helpers separate from its rendering, so the tests import exactly what the browser runs.

## API reference 🔧

```js
import { getExactTime } from './src/exactaclock.js';

const result = getExactTime({ lat: 59.3293, lng: 18.0686 }); // Stockholm
```

```js
{
  now:              Date,   // the true instant
  exactTime:        Date,   // solar time — read via UTC getters
  standardTime:     Date,   // what a normal clock in this zone reads
  timezone:         { name: 'UTC+1', fullName: 'Central European Time',
                      offset: 1, center: 15, west: 7.5, east: 22.5 },
  solarOffsetMinutes:   72.27,   // λ × 4
  adjustmentMinutes:    12.27,   // how far solar time leads the zone clock
  adjustmentSeconds:   736.5,
  adjustmentRatio:       0.409,  // -1 … +1 across the zone
  closestTimezones: [ { timezone, distanceKm, distanceDegrees }, … ],
  nearestCity:      { name: 'Stockholm', country: 'Sweden', distanceKm: 0 },
  coordinates:      { lat: 59.3293, lng: 18.0686 }
}
```

> `exactTime` and `standardTime` are wall-clock instants pre-shifted into UTC. Format them
> with `timeZone: 'UTC'` (or the `formatClock` helper in `src/format.js`) so the viewer's
> own timezone doesn't get applied on top.

| Function                                    | Purpose                                          |
| ------------------------------------------- | ------------------------------------------------ |
| `getExactTime(coords, now?)`                | Everything above; `now` is injectable for tests  |
| `getTimezone(coords)`                       | The nominal 15° zone for a coordinate            |
| `getAdjustmentMinutes(coords)`              | Just the correction, in minutes                  |
| `getSolarOffsetMinutes(coords)`             | Solar offset from UTC, in minutes                |
| `getClosestTimezones(coords)`               | Current zone plus the neighbour it leans towards |
| `getNearestCity(coords)`                    | Closest city by great-circle distance            |
| `calculateDistance(lat1, lng1, lat2, lng2)` | Haversine distance in km                         |
| `normalizeLongitude(lng)`                   | Folds a longitude into [-180, 180]               |

## Browser support

Modern evergreen browsers — the app uses ES modules, `oklch()` colours and
`backdrop-filter`. Geolocation requires a secure context (HTTPS or `localhost`).

## Deployment (S3 + GitHub Actions) 🚢

Pushes to `main` sync the static site to S3 via `.github/workflows/deploy.yml`.

Required secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET`,
and optionally `CLOUDFRONT_DISTRIBUTION_ID` to invalidate the cache.

Because the app is served as ES modules, `src/` must be deployed alongside `index.html` —
the workflow only excludes development files.

## License

MIT
