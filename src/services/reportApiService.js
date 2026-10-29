import { apiUrl } from './apiConfig';

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
    const currentLang = localStorage.getItem('solarscope.language') || 'en';
    const payload = {
      ...report,
      language: report.language || currentLang,
    };

    const response = await fetch(apiUrl('/api/reports'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }

    return response.json();
  },

  async getReports() {
    const response = await fetch(apiUrl('/api/reports'), {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }

    return response.json();
  },

  async getReportById(id) {
    const response = await fetch(apiUrl(`/api/reports/${id}`), {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }

    return response.json();
  },

  async deleteReport(id) {
    const response = await fetch(apiUrl(`/api/reports/${id}`), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }
  },

  async resendEmail(id, language = null) {
    const currentLang = language || localStorage.getItem('solarscope.language') || 'en';
    const url = apiUrl(`/api/reports/${id}/resend-email?lang=${encodeURIComponent(currentLang)}`);
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }

    return response.json();
  },
};
