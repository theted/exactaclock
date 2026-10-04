// A thin wrapper over `watchPosition` that always reaches a verdict: either a
// stream of fixes, or exactly one error explaining why there won't be any.

const DEFAULT_TIMEOUT_MS = 12000;

const REASONS = {
  1: 'Location access was denied.',
  2: 'Your location is unavailable right now.',
  3: 'Finding your location took too long.'
};

export const describeLocationError = error =>
  REASONS[error?.code] ?? 'Your location could not be read.';

export const toCoordinates = ({ coords }) => ({
  lat: coords.latitude,
  lng: coords.longitude
});

export const createLocator = ({
  onPosition,
  onError,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  geolocation = globalThis.navigator?.geolocation
}) => {
  let watchId = null;
  let watchdog = null;
  let hasFix = false;

  const stop = () => {
    clearTimeout(watchdog);
    if (watchId !== null) geolocation.clearWatch(watchId);
    watchId = null;
  };

  const fail = reason => {
    stop();
    onError(reason);
  };

  const start = () => {
    stop();
    if (!geolocation) {
      fail('This browser can’t share its location.');
      return;
    }

    hasFix = false;
    // Some browsers never call back at all when the permission prompt is
    // suppressed, ignoring `timeout`. Without this the app would wait forever.
    watchdog = setTimeout(
      () => fail(describeLocationError({ code: 3 })),
      timeoutMs + 2000
    );

    watchId = geolocation.watchPosition(
      position => {
        clearTimeout(watchdog);
        hasFix = true;
        onPosition(toCoordinates(position));
      },
      // Once a fix has arrived, a hiccup just means the pin stays put for a
      // moment. Before that, or if access is revoked, it is final.
      error => {
        if (!hasFix || error.code === 1) fail(describeLocationError(error));
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 5000 }
    );
  };

  return { start, stop };
};
