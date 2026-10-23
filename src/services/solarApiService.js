import { apiUrl } from './apiConfig';

const getApiError = async (response) => {
  try {
    const body = await response.json();
    return body.message || 'Solar potential request failed.';
  } catch {
    return 'Solar potential request failed.';
  }
};

const getStoredAuth = () => {
  try {
    return (
      JSON.parse(localStorage.getItem('solarscope.auth')) ||
      JSON.parse(sessionStorage.getItem('solarscope.session'))
    );
  } catch {
    return null;
  }
};

const getAuthHeaders = () => {
  const token = getStoredAuth()?.token;

  if (!token) {
    throw new Error('Sign in with your backend account before accessing solar potential data.');
  }

  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const solarApiService = {
  /**
   * Technical rooftop assessment from PVGIS API & Open-Meteo Weather API
   */
  async getSolarPotential(latitude, longitude, roofArea = 0, address = '') {
    const query = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
    });
    if (roofArea && roofArea > 0) {
      query.append('roofArea', String(roofArea));
    }
    if (address) {
      query.append('address', address);
    }

    const response = await fetch(apiUrl(`/api/solar/potential?${query.toString()}`), {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }

    return response.json();
  },

  /**
   * Save assessment to PostgreSQL
   */
  async saveSolarPotential(payload) {
    const response = await fetch(apiUrl('/api/solar/potential'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }

    return response.json();
  },

  /**
   * User's saved solar potential assessments
   */
  async getSolarHistory() {
    const response = await fetch(apiUrl('/api/solar/history'), {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }

    return response.json();
  },

  /**
   * Get single assessment by ID
   */
  async getSolarPotentialById(id) {
    const response = await fetch(apiUrl(`/api/solar/${id}`), {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }

    return response.json();
  },

  /**
   * Delete an assessment
   */
  async deleteSolarPotential(id) {
    const response = await fetch(apiUrl(`/api/solar/${id}`), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }
  },
};
