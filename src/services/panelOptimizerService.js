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
    throw new Error('Sign in to access AI Panel Placement Optimizer.');
  }
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

const getApiError = async (response) => {
  try {
    const body = await response.json();
    return body.message || 'Panel optimization request failed.';
  } catch {
    return 'Panel optimization request failed.';
  }
};

export const panelOptimizerService = {
  /**
   * Generate 3 optimized panel layouts (Maximum Capacity, Balanced, High Efficiency)
   */
  async optimizeLayouts(requestData) {
    const response = await fetch(apiUrl('/api/panel-optimizer/optimize'), {
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
   * Save selected optimized layout and synchronize with analysis
   */
  async saveLayout(layoutData) {
    const response = await fetch(apiUrl('/api/panel-optimizer/save'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(layoutData),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }

    return response.json();
  },

  /**
   * Fetch the latest saved panel layout for active user
   */
  async getLatestLayout() {
    const response = await fetch(apiUrl('/api/panel-optimizer/latest'), {
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
   * Fetch layout history for active user
   */
  async getHistory() {
    const response = await fetch(apiUrl('/api/panel-optimizer/history'), {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }

    return response.json();
  },

  /**
   * Fetch layout by ID
   */
  async getById(id) {
    const response = await fetch(apiUrl(`/api/panel-optimizer/${id}`), {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }

    return response.json();
  },

  /**
   * Delete saved layout by ID
   */
  async deleteLayout(id) {
    const response = await fetch(apiUrl(`/api/panel-optimizer/${id}`), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }

    return true;
  },
};
