import { apiUrl } from './apiConfig';

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
    throw new Error('Sign in to access AI Solar Advisor recommendations.');
  }
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

const getApiError = async (response) => {
  try {
    const body = await response.json();
    return body.message || 'AI recommendation request failed.';
  } catch {
    return 'AI recommendation request failed.';
  }
};

export const aiRecommendationService = {
  /**
   * Generate natural-language Solar Advisor recommendations
   */
  async generateRecommendation(requestData) {
    const response = await fetch(apiUrl('/api/ai/recommendation/generate'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }

    return response.json();
  },

  /**
   * Fetch the latest recommendation for the active user
   */
  async getLatestRecommendation() {
    const response = await fetch(apiUrl('/api/ai/recommendation/latest'), {
      headers: getAuthHeaders(),
    });

    if (response.status === 204) {
      return null;
    }

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }

    return response.json();
  },

  /**
   * Fetch recommendation history for the user
   */
  async getHistory() {
    const response = await fetch(apiUrl('/api/ai/recommendation/history'), {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }

    return response.json();
  },

  /**
   * Fetch recommendation by ID
   */
  async getById(id) {
    const response = await fetch(apiUrl(`/api/ai/recommendation/${id}`), {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }

    return response.json();
  },
};
