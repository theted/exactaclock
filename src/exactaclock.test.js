import { describe, expect, test } from 'vitest';

import {
  MAX_ADJUSTMENT_MINUTES,
  MINUTES_PER_DEGREE,
  TIMEZONES
} from './constants.js';
import {
  calculateDistance,
  getAdjustmentMinutes,
  getClosestTimezones,
  getExactTime,
  getNearestCity,
  getSolarOffsetMinutes,
  getTimezone,
  normalizeLongitude
} from './exactaclock.js';
import {
  formatAdjustment,
  formatClock,
  formatCoordinates,
  formatOffset
} from './format.js';

const FIXED_NOW = new Date('2024-06-01T12:00:00.000Z');
const minutesOf = date => date.getUTCHours() * 60 + date.getUTCMinutes();

describe('timezone table', () => {
  test('covers -12 through +12 without gaps or overlaps', () => {
    expect(TIMEZONES).toHaveLength(25);
    expect(TIMEZONES[0].west).toBe(-180);
    expect(TIMEZONES.at(-1).east).toBe(180);

    TIMEZONES.slice(1).forEach((zone, index) => {
      expect(zone.west).toBe(TIMEZONES[index].east);
      expect(zone.offset).toBe(TIMEZONES[index].offset + 1);
    });
  });

  test('each zone is centred on its own meridian', () => {
    TIMEZONES.forEach(zone => {
      expect(zone.center).toBe(zone.offset * 15);
      expect(zone.center).toBeGreaterThanOrEqual(zone.west);
      expect(zone.center).toBeLessThanOrEqual(zone.east);
    });
  });

  test('the antimeridian zones are half width', () => {
    expect(TIMEZONES[0]).toMatchObject({
      name: 'UTC-12',
      west: -180,
      east: -172.5
    });
    expect(TIMEZONES.at(-1)).toMatchObject({
      name: 'UTC+12',
      west: 172.5,
      east: 180
    });
  });
});

describe('getTimezone', () => {
  test.each([
    ['New York', -74.006, 'UTC-5'],
    ['London', -0.1278, 'UTC+0'],
    ['Tokyo', 139.6503, 'UTC+9'],
    ['Sydney', 151.2093, 'UTC+10'],
    ['San Francisco', -122.4194, 'UTC-8'],
    ['Paris', 2.3522, 'UTC+0']
  ])('places %s in %s', (_name, lng, expected) => {
    expect(getTimezone({ lat: 0, lng }).name).toBe(expected);
  });

  // Each zone owns the half-open span [west, east), so a coordinate sitting
  // exactly on a boundary belongs to the zone to its east.
  test('assigns boundary longitudes to the eastern zone', () => {
    expect(getTimezone({ lat: 0, lng: 7.49 }).name).toBe('UTC+0');
    expect(getTimezone({ lat: 0, lng: 7.5 }).name).toBe('UTC+1');
    expect(getTimezone({ lat: 0, lng: -7.5 }).name).toBe('UTC+0');
    expect(getTimezone({ lat: 0, lng: -7.51 }).name).toBe('UTC-1');
  });

  test('handles both sides of the antimeridian', () => {
    expect(getTimezone({ lat: 0, lng: 179 }).name).toBe('UTC+12');
    expect(getTimezone({ lat: 0, lng: 180 }).name).toBe('UTC+12');
    expect(getTimezone({ lat: 0, lng: -179 }).name).toBe('UTC-12');
    expect(getTimezone({ lat: 0, lng: -180 }).name).toBe('UTC-12');
  });

  test('wraps longitudes beyond ±180 instead of falling back to UTC+0', () => {
    expect(normalizeLongitude(200)).toBe(-160);
    expect(getTimezone({ lat: 0, lng: 200 }).name).toBe(
      getTimezone({ lat: 0, lng: -160 }).name
    );
  });
});

describe('solar correction', () => {
  test('is zero on a zone central meridian', () => {
    [-120, -75, 0, 15, 135].forEach(lng => {
      expect(getAdjustmentMinutes({ lat: 0, lng })).toBeCloseTo(0, 10);
    });
  });

  // The original implementation had this inverted: it returned ~0 at the
  // boundary and a large negative value at the centre.
  test('reaches the full ±30 minutes at the zone edges', () => {
    expect(getAdjustmentMinutes({ lat: 0, lng: 7.49 })).toBeCloseTo(29.96, 2);
    expect(getAdjustmentMinutes({ lat: 0, lng: -7.5 })).toBeCloseTo(-30, 10);
  });

  test('scales linearly at 4 minutes per degree', () => {
    expect(getAdjustmentMinutes({ lat: 0, lng: 3.75 })).toBeCloseTo(15, 10);
    expect(getSolarOffsetMinutes({ lat: 0, lng: 10 })).toBeCloseTo(
      10 * MINUTES_PER_DEGREE,
      10
    );
  });

  test('never exceeds half a zone anywhere on Earth', () => {
    for (let lng = -180; lng <= 180; lng += 0.25) {
      const adjustment = getAdjustmentMinutes({ lat: 0, lng });
      expect(Math.abs(adjustment)).toBeLessThanOrEqual(
        MAX_ADJUSTMENT_MINUTES + 1e-9
      );
    }
  });

  test('is continuous — no jump discontinuities away from zone edges', () => {
    let previous = getAdjustmentMinutes({ lat: 0, lng: -6 });
    for (let lng = -6; lng <= 6; lng += 0.1) {
      const current = getAdjustmentMinutes({ lat: 0, lng });
      expect(Math.abs(current - previous)).toBeLessThan(1);
      previous = current;
    }
  });

  test('depends only on longitude, not latitude', () => {
    const equator = getAdjustmentMinutes({ lat: 0, lng: 5 });
    [-80, -40, 40, 80].forEach(lat => {
      expect(getAdjustmentMinutes({ lat, lng: 5 })).toBeCloseTo(equator, 10);
    });
  });
});

describe('getExactTime', () => {
  test('returns a fully populated result', () => {
    const result = getExactTime({ lat: 40.7128, lng: -74.006 }, FIXED_NOW);

    expect(result.exactTime).toBeInstanceOf(Date);
    expect(result.standardTime).toBeInstanceOf(Date);
    expect(result.currentTimezone).toBe('UTC-5');
    expect(result.timezoneFull).toBe('Eastern Standard Time');
    expect(result.coordinates).toEqual({ lat: 40.7128, lng: -74.006 });
    expect(result.closestTimezones).toHaveLength(2);
  });

  test('exact time is UTC shifted by the solar offset', () => {
    const result = getExactTime({ lat: 0, lng: 15 }, FIXED_NOW);
    // 15°E = exactly one hour of sun ahead of Greenwich.
    expect(formatClock(result.exactTime)).toBe('13:00:00');
    expect(formatClock(result.standardTime)).toBe('13:00:00');
    expect(formatClock(result.now)).toBe('12:00:00');
  });

  test('exact time leads standard time east of the meridian', () => {
    const result = getExactTime({ lat: 0, lng: 22 }, FIXED_NOW);
    expect(formatClock(result.exactTime)).toBe('13:28:00');
    expect(formatClock(result.standardTime)).toBe('13:00:00');
    expect(result.adjustmentMinutes).toBeCloseTo(28, 10);
  });

  test('exact time trails standard time west of the meridian', () => {
    const result = getExactTime({ lat: 0, lng: 8 }, FIXED_NOW);
    expect(result.adjustmentMinutes).toBeCloseTo(-28, 10);
    expect(minutesOf(result.exactTime)).toBe(
      minutesOf(result.standardTime) - 28
    );
  });

  test('adjustment units agree with each other', () => {
    const result = getExactTime({ lat: 51.5, lng: -3.2 }, FIXED_NOW);
    expect(result.adjustmentSeconds).toBeCloseTo(
      result.adjustmentMinutes * 60,
      6
    );
    expect(result.adjustmentSecondsTotal).toBe(
      Math.round(result.adjustmentSeconds)
    );
    expect(result.adjustmentMilliseconds).toBe(
      Math.round(result.adjustmentMinutes * 60000)
    );
    expect(result.adjustmentRatio).toBeCloseTo(
      result.adjustmentMinutes / MAX_ADJUSTMENT_MINUTES,
      10
    );
  });

  test('does not mutate the instant it is given', () => {
    const now = new Date(FIXED_NOW);
    getExactTime({ lat: 0, lng: 120 }, now);
    expect(now.toISOString()).toBe(FIXED_NOW.toISOString());
  });
});

describe('getClosestTimezones', () => {
  test('returns the current zone first and the neighbour it leans towards', () => {
    const [current, neighbour] = getClosestTimezones({ lat: 0, lng: 5 });
    expect(current.timezone.name).toBe('UTC+0');
    expect(neighbour.timezone.name).toBe('UTC+1');
    expect(current.distanceKm).toBeLessThan(neighbour.distanceKm);
  });

  test('leans west when west of the central meridian', () => {
    const [, neighbour] = getClosestTimezones({ lat: 0, lng: -5 });
    expect(neighbour.timezone.name).toBe('UTC-1');
  });

  test('does not run off the end of the table at the antimeridian', () => {
    const [current, neighbour] = getClosestTimezones({ lat: 0, lng: 179 });
    expect(current.timezone.name).toBe('UTC+12');
    expect(neighbour.timezone).toBeDefined();
  });
});

describe('geography helpers', () => {
  test('New York to London is about 5,570 km', () => {
    const distance = calculateDistance(40.7128, -74.006, 51.5074, -0.1278);
    expect(distance).toBeGreaterThan(5500);
    expect(distance).toBeLessThan(5600);
  });

  test('finds the nearest city using latitude as well as longitude', () => {
    expect(getNearestCity({ lat: 40.7128, lng: -74.006 }).name).toBe(
      'New York'
    );
    expect(getNearestCity({ lat: 59.33, lng: 18.07 }).name).toBe('Stockholm');
    // Same longitude as Stockholm, but far to the south.
    expect(getNearestCity({ lat: -26.2, lng: 28.05 }).name).toBe(
      'Johannesburg'
    );
  });
});

describe('formatting', () => {
  test('formats clock times from UTC fields', () => {
    expect(formatClock(new Date('2024-01-01T09:05:03Z'))).toBe('09:05:03');
    expect(
      formatClock(new Date('2024-01-01T09:05:03Z'), { seconds: false })
    ).toBe('09:05');
  });

  test('formats offsets and coordinates', () => {
    expect(formatOffset(90)).toBe('+01:30');
    expect(formatOffset(-45)).toBe('-00:45');
    expect(formatCoordinates({ lat: -33.8688, lng: 151.2093 })).toBe(
      '33.8688° S, 151.2093° E'
    );
  });

  test('describes the adjustment in words', () => {
    expect(formatAdjustment(0)).toBe('Exactly on the central meridian');
    expect(formatAdjustment(12.5)).toBe('12 min 30 s ahead');
    expect(formatAdjustment(-2)).toBe('2 min behind');
    expect(formatAdjustment(0.5)).toBe('30 s ahead');
  });
});
