import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { createLocator, describeLocationError } from './geolocation.js';

const PERMISSION_DENIED = 1;
const POSITION_UNAVAILABLE = 2;

// Just enough of navigator.geolocation to drive a watch by hand.
const fakeGeolocation = () => {
  const watchers = new Map();
  let nextId = 1;
  return {
    watchPosition: vi.fn((onSuccess, onError) => {
      watchers.set(nextId, { onSuccess, onError });
      return nextId++;
    }),
    clearWatch: vi.fn(id => watchers.delete(id)),
    emit: (latitude, longitude) =>
      watchers.forEach(({ onSuccess }) =>
        onSuccess({ coords: { latitude, longitude } })
      ),
    fail: code => watchers.forEach(({ onError }) => onError({ code })),
    get watching() {
      return watchers.size;
    }
  };
};

describe('createLocator', () => {
  let geolocation;
  let onPosition;
  let onError;
  let locator;

  beforeEach(() => {
    vi.useFakeTimers();
    geolocation = fakeGeolocation();
    onPosition = vi.fn();
    onError = vi.fn();
    locator = createLocator({
      onPosition,
      onError,
      geolocation,
      timeoutMs: 1000
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('passes each fix on as plain coordinates', () => {
    locator.start();
    geolocation.emit(59.3, 18.1);
    geolocation.emit(59.4, 18.2);
    expect(onPosition).toHaveBeenNthCalledWith(1, { lat: 59.3, lng: 18.1 });
    expect(onPosition).toHaveBeenNthCalledWith(2, { lat: 59.4, lng: 18.2 });
    expect(onError).not.toHaveBeenCalled();
  });

  test('gives up, once, if the first fix fails', () => {
    locator.start();
    geolocation.fail(POSITION_UNAVAILABLE);
    expect(onError).toHaveBeenCalledExactlyOnceWith(
      'Your location is unavailable right now.'
    );
    expect(geolocation.watching).toBe(0);

    vi.runAllTimers();
    expect(onError).toHaveBeenCalledOnce();
  });

  test('rides out hiccups after a fix, but not a revoked permission', () => {
    locator.start();
    geolocation.emit(1, 2);
    geolocation.fail(POSITION_UNAVAILABLE);
    expect(onError).not.toHaveBeenCalled();

    geolocation.fail(PERMISSION_DENIED);
    expect(onError).toHaveBeenCalledExactlyOnceWith(
      'Location access was denied.'
    );
  });

  test('times out when the browser never answers at all', () => {
    locator.start();
    vi.advanceTimersByTime(3000);
    expect(onError).toHaveBeenCalledExactlyOnceWith(
      'Finding your location took too long.'
    );
    expect(geolocation.watching).toBe(0);
  });

  test('stop() ends the watch without reporting an error', () => {
    locator.start();
    locator.stop();
    vi.runAllTimers();
    expect(geolocation.watching).toBe(0);
    expect(onError).not.toHaveBeenCalled();
  });

  test('restarting replaces the previous watch', () => {
    locator.start();
    locator.start();
    expect(geolocation.watching).toBe(1);
  });

  test('reports a browser without geolocation straight away', () => {
    createLocator({ onPosition, onError, geolocation: null }).start();
    expect(onError).toHaveBeenCalledExactlyOnceWith(
      'This browser can’t share its location.'
    );
  });
});

test('describes unknown errors generically', () => {
  expect(describeLocationError({ code: 99 })).toBe(
    'Your location could not be read.'
  );
});
