// tests/helpers/mockGeolocation.ts

// --- GeolocationCoordinates ---
function createCoords(lat: number, lng: number): GeolocationCoordinates {
  return {
    accuracy: 10,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
    latitude: lat,
    longitude: lng,
    toJSON() {
      return {};
    },
  };
}

// --- GeolocationPosition ---
function createPosition(lat: number, lng: number): GeolocationPosition {
  return {
    coords: createCoords(lat, lng),
    timestamp: Date.now(),
    toJSON() {
      return {};
    },
  };
}

// --- GeolocationPositionError ---
function createPositionError(
  code: number,
  message: string
): GeolocationPositionError {
  return {
    code,
    message,
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  };
}

// --- Base Geolocation Object ---
function createMock(overrides: Partial<Geolocation>): Geolocation {
  return {
    getCurrentPosition() {},
    watchPosition() {
      return 0;
    },
    clearWatch() {},
    ...overrides,
  } as Geolocation;
}

// --- Public Helpers ---
export function mockGeoSuccess(lat = 10, lng = 20) {
  Object.defineProperty(global.navigator, "geolocation", {
    value: createMock({
      getCurrentPosition(success) {
        success(createPosition(lat, lng));
      },
    }),
    configurable: true,
  });
}

export function mockGeoFailure() {
  Object.defineProperty(global.navigator, "geolocation", {
    value: createMock({
      getCurrentPosition(_success, error) {
        if (error) {
          error(createPositionError(1, "User denied geolocation"));
        }
      },
    }),
    configurable: true,
  });
}
