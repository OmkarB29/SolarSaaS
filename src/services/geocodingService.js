const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

const parseCoordinateQuery = (query) => {
  const match = query.match(/^\s*(-?\d+(?:\.\d+)?)\s*(?:,|\s)\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);

  if (Number.isNaN(lat) || Number.isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return null;
  }

  return [lat, lng];
};

export const geocodingService = {
  async searchLocation(query) {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      throw new Error('Enter a city, address, or building name.');
    }

    const coordinatePosition = parseCoordinateQuery(trimmedQuery);
    if (coordinatePosition) {
      return {
        label: `${coordinatePosition[0].toFixed(6)}, ${coordinatePosition[1].toFixed(6)}`,
        position: coordinatePosition,
        bounds: null,
      };
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
