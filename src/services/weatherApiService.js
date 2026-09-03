const CACHE_TTL_MS = 15 * 60 * 1000;
const cache = new Map();
const pendingRequests = new Map();

const getCacheKey = (latitude, longitude) => `${Number(latitude).toFixed(3)}:${Number(longitude).toFixed(3)}`;

const getApiError = async (response) => {
  try {
    const body = await response.json();
    return body.message || 'Weather data is currently unavailable.';
  } catch {
    return 'Weather data is currently unavailable.';
  }
};

export const weatherApiService = {
  async getWeather(latitude, longitude) {
    const cacheKey = getCacheKey(latitude, longitude);
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return cached.data;
    }

    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey);
    }

    const request = fetch(`/api/weather?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(await getApiError(response));
        }
        return response.json();
      })
      .then((data) => {
        cache.set(cacheKey, { data, cachedAt: Date.now() });
        return data;
      })
      .finally(() => {
        pendingRequests.delete(cacheKey);
      });

    pendingRequests.set(cacheKey, request);
    return request;
  },
};
