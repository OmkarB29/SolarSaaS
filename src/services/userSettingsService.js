const getAuthHeaders = () => {
  const authKey = 'solarscope.auth';
  const sessionKey = 'solarscope.session';
  const raw = localStorage.getItem(authKey) || sessionStorage.getItem(sessionKey);
  const token = raw ? JSON.parse(raw)?.token : null;

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const getApiError = async (response) => {
  try {
    const data = await response.json();
    return data.message || data.error || response.statusText;
  } catch {
    return response.statusText;
  }
};

export const userSettingsService = {
  async getSettings() {
    const response = await fetch('/api/user/settings', {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }

    return response.json();
  },

  async updateSettings(payload) {
    const response = await fetch('/api/user/settings', {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }

    return response.json();
  },

  async getEmailHistory() {
    const response = await fetch('/api/email/history', {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }

    return response.json();
  },
};