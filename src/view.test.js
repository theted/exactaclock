import { describe, expect, test } from 'vitest';

import { getExactTime } from './exactaclock.js';
import { describeDifference, parseCoordinates, stripGeometry } from './view.js';

describe('stripGeometry', () => {
  test('centres the marker on the meridian with nothing filled', () => {
    expect(stripGeometry(0)).toEqual({
      position: 50,
      fillStart: 50,
      fillSize: 0
    });
  });

  test('fills from the meridian towards the marker on either side', () => {
    expect(stripGeometry(0.5)).toEqual({
      position: 75,
      fillStart: 50,
      fillSize: 25
    });
    expect(stripGeometry(-1)).toEqual({
      position: 0,
      fillStart: 0,
      fillSize: 50
    });
  });

  test('clamps ratios beyond the zone edges', () => {
    expect(stripGeometry(1.4).position).toBe(100);
    expect(stripGeometry(-3).position).toBe(0);
  });
});

describe('describeDifference', () => {
  test('east of the meridian the sun runs ahead', () => {
    const result = getExactTime({ lat: 59.3293, lng: 18.0686 });
    expect(describeDifference(result)).toEqual({
      amount: '12 min 16 s',
      direction: 'ahead of UTC+1 clocks',
      detail:
        'You’re 174 km east of the 15° E meridian, where the sun and UTC+1 clocks agree exactly.'
    });
  });

  test('west of the meridian the sun runs behind', () => {
    const { amount, direction, detail } = describeDifference(
      getExactTime({ lat: 0, lng: -3.75 })
    );
    expect(amount).toBe('15 min');
    expect(direction).toBe('behind UTC+0 clocks');
    expect(detail).toMatch(/west of the 0° meridian/);
  });

  test('on the meridian the two agree', () => {
    expect(describeDifference(getExactTime({ lat: 35, lng: 135 }))).toEqual({
      amount: 'In step',
      direction: 'with UTC+9 clocks',
      detail:
        'You’re right on the 135° E meridian, where the sun and UTC+9 clocks agree exactly.'
    });
  });
});

describe('parseCoordinates', () => {
  test('accepts an in-range pair', () => {
    expect(parseCoordinates('59.33', '-18.5')).toEqual({
      coordinates: { lat: 59.33, lng: -18.5 }
    });
  });

  test('names the first field that is out of range or empty', () => {
    expect(parseCoordinates('91', '0')).toMatchObject({ field: 'latInput' });
    expect(parseCoordinates('', '0')).toMatchObject({ field: 'latInput' });
    expect(parseCoordinates('0', '-180.5')).toMatchObject({
      field: 'lngInput',
      error: 'Longitude must be between -180 and 180.'
    });
  });
});
