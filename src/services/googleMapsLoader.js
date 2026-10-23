import { Loader } from '@googlemaps/js-api-loader';

let loaderPromise = null;
let cachedApiKey = null;

/**
 * Asynchronously loads the Google Maps JavaScript SDK using @googlemaps/js-api-loader.
 * Ensures singleton loading and caches the promise.
 *
 * @param {Object} options
 * @param {string} options.apiKey
 * @param {string} [options.mapId]
 * @returns {Promise<typeof google.maps>}
 */
export const loadGoogleMapsSdk = async ({ apiKey, mapId } = {}) => {
  const resolvedKey = apiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  if (!resolvedKey) {
    throw new Error(
      'Missing Google Maps API Key. Please configure VITE_GOOGLE_MAPS_API_KEY in your .env file.'
    );
  }

  if (window.google?.maps?.Map) {
    return window.google.maps;
  }

  if (!loaderPromise || cachedApiKey !== resolvedKey) {
    cachedApiKey = resolvedKey;
    const loader = new Loader({
      apiKey: resolvedKey,
      version: 'weekly',
      libraries: ['maps', 'marker', 'geometry', 'drawing'],
      ...(mapId ? { mapIds: [mapId] } : {}),
    });

    loaderPromise = loader.load().then(async () => {
      // Ensure all necessary modern libraries are imported and available
      if (window.google?.maps?.importLibrary) {
        await Promise.allSettled([
          window.google.maps.importLibrary('maps'),
          window.google.maps.importLibrary('marker'),
          window.google.maps.importLibrary('drawing'),
          window.google.maps.importLibrary('geometry'),
        ]);
      }
      return window.google.maps;
    });
  }

  return loaderPromise;
};
