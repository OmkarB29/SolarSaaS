const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export const geocodingService = {
  async searchLocation(query) {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      throw new Error('Enter a city, address, or building name.');
    }

    const params = new URLSearchParams({
      q: trimmedQuery,
      format: 'jsonv2',
      addressdetails: '1',
      limit: '1',
    });

    const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Location service is unavailable. Try again in a moment.');
    }

    const results = await response.json();
    const location = results[0];

    if (!location) {
      throw new Error('No location found. Try a more specific address.');
    }

    return {
      label: location.display_name,
      position: [Number(location.lat), Number(location.lon)],
      bounds: location.boundingbox?.map(Number) || null,
    };
  },
};
