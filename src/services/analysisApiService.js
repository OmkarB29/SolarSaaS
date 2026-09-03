const getApiError = async (response) => {
  try {
    const body = await response.json();
    return body.message || 'Analysis request failed.';
  } catch {
    return 'Analysis request failed.';
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
    throw new Error('Sign in with your backend account before saving analysis history.');
  }

  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const analysisApiService = {
  async saveAnalysis(analysis) {
    const response = await fetch('/api/analysis', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(analysis),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }

    return response.json();
  },

  async getAnalyses() {
    const response = await fetch('/api/analysis', {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }

    return response.json();
  },

  async getAnalysisById(id) {
    const response = await fetch(`/api/analysis/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }

    return response.json();
  },

  async getLatestAnalysis() {
    try {
      const response = await fetch('/api/analysis/latest', {
        headers: getAuthHeaders(),
      });

      if (response.status === 204) {
        return null;
      }

      if (!response.ok) {
        throw new Error(await getApiError(response));
      }

      return await response.json();
    } catch {
      try {
        const list = await this.getAnalyses();
        return list && list.length > 0 ? list[0] : null;
      } catch {
        return null;
      }
    }
  },
};
