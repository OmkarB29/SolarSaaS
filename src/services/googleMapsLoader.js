import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

let isConfigured = false;
let loadPromise = null;

/**
 * Resets the cached load promise (useful on retry).
 */
export const resetGoogleMapsLoader = () => {
  loadPromise = null;
};

/**
 * Asynchronously loads the Google Maps JavaScript SDK using the official functional API
 * (setOptions & importLibrary) from @googlemaps/js-api-loader v2+.
 *
 * @param {Object} [options]
 * @param {string} [options.apiKey]
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

  // If already loaded and available on window
  if (window.google?.maps?.Map) {
    return window.google.maps;
  }

  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        if (!isConfigured) {
          setOptions({
            key: resolvedKey,
            v: 'weekly',
            ...(mapId ? { mapIds: [mapId] } : {}),
          });
          isConfigured = true;
        }

        // Concurrently load all required libraries using the new functional API
        await Promise.all([
          importLibrary('maps'),
          importLibrary('marker'),
          importLibrary('drawing'),
          importLibrary('geometry'),
        ]);

        return window.google.maps;
      } catch (err) {
        // Reset cached promise so subsequent attempts can retry
        loadPromise = null;
        throw err;
      }
    })();
  }

  return loadPromise;
};

export default loadGoogleMapsSdk;
