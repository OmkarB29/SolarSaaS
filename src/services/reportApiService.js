const getApiError = async (response) => {
  try {
    const body = await response.json();
    return body.message || 'Report request failed.';
  } catch {
    return 'Report request failed.';
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
    throw new Error('Sign in with your backend account before managing reports.');
  }

  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const reportApiService = {
  async saveReport(report) {
    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(report),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }

    return response.json();
  },

  async getReports() {
    const response = await fetch('/api/reports', {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }

    return response.json();
  },

  async getReportById(id) {
    const response = await fetch(`/api/reports/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }

    return response.json();
  },

  async deleteReport(id) {
    const response = await fetch(`/api/reports/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }
  },
};