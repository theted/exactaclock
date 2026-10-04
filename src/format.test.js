import { describe, expect, test } from 'vitest';

import {
  formatAdjustment,
  formatClock,
  formatCoordinates,
  formatDistance,
  formatDuration,
  formatLongitude,
  formatOffset,
  formatPlace,
  formatSolarNoon
} from './format.js';

describe('clock and coordinates', () => {
  test('formats clock times from UTC fields', () => {
    expect(formatClock(new Date('2024-01-01T09:05:03Z'))).toBe('09:05:03');
    expect(
      formatClock(new Date('2024-01-01T09:05:03Z'), { seconds: false })
    ).toBe('09:05');
  });

  test('formats coordinates with hemispheres', () => {
    expect(formatCoordinates({ lat: -33.8688, lng: 151.2093 })).toBe(
      '33.8688° S, 151.2093° E'
    );
  });

  test('labels meridians, without a hemisphere on 0° and 180°', () => {
    expect(formatLongitude(15)).toBe('15° E');
    expect(formatLongitude(-7.5)).toBe('7.5° W');
    expect(formatLongitude(0)).toBe('0°');
    expect(formatLongitude(-180)).toBe('180°');
  });
});

describe('offsets', () => {
  test('rounds to the minute by default', () => {
    expect(formatOffset(90)).toBe('+01:30');
    expect(formatOffset(-45)).toBe('-00:45');
    expect(formatOffset(72.9)).toBe('+01:13');
  });

  test('can include seconds', () => {
    expect(formatOffset(72.2744, { seconds: true })).toBe('+01:12:16');
    expect(formatOffset(-0.5, { seconds: true })).toBe('-00:00:30');
  });
});

describe('differences', () => {
  test('formats an unsigned duration', () => {
    expect(formatDuration(12.5)).toBe('12 min 30 s');
    expect(formatDuration(-2)).toBe('2 min');
    expect(formatDuration(0.25)).toBe('15 s');
    expect(formatDuration(0)).toBe('0 s');
  });

  test('describes the adjustment in words', () => {
    expect(formatAdjustment(0)).toBe('Exactly on the central meridian');
    expect(formatAdjustment(12.5)).toBe('12 min 30 s ahead');
    expect(formatAdjustment(-2)).toBe('2 min behind');
    expect(formatAdjustment(0.5)).toBe('30 s ahead');
  });

  test('puts solar noon on the zone clock', () => {
    expect(formatSolarNoon(0)).toBe('12:00:00');
    // East of the meridian the sun peaks before the clock reaches noon.
    expect(formatSolarNoon(12.5)).toBe('11:47:30');
    expect(formatSolarNoon(-30)).toBe('12:30:00');
  });
});

describe('places', () => {
  test('formats distances', () => {
    expect(formatDistance(3.14)).toBe('3.1 km');
    expect(formatDistance(173.6)).toBe('174 km');
  });

  test('names a nearby city outright, and a far one with a distance', () => {
    const city = { name: 'Oslo', country: 'Norway' };
    expect(formatPlace({ ...city, distanceKm: 4 })).toBe('Oslo, Norway');
    expect(formatPlace({ ...city, distanceKm: 120 })).toBe(
      '120 km from Oslo, Norway'
    );
  });
});
