import { apiUrl } from './apiConfig';

const getApiError = async (response) => {
  try {
    const body = await response.json();
    return body.message || 'Proposal request failed.';
  } catch {
    return 'Proposal request failed.';
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
    throw new Error('Sign in with your backend account before managing proposals.');
  }

  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const proposalApiService = {
  async getProposals() {
    const response = await fetch(apiUrl('/api/proposals'), {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }

    return response.json();
  },

  async getProposalById(id) {
    const response = await fetch(apiUrl(`/api/proposals/${id}`), {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }

    return response.json();
  },

  async createProposal(proposal) {
    const response = await fetch(apiUrl('/api/proposals'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(proposal),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }

    return response.json();
  },

  async createProposalFromAnalysis(analysisId, name) {
    const query = name ? `?name=${encodeURIComponent(name)}` : '';
    const response = await fetch(apiUrl(`/api/proposals/from-analysis/${analysisId}${query}`), {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }

    return response.json();
  },

  async updateProposalStatus(id, status) {
    const response = await fetch(apiUrl(`/api/proposals/${id}/status`), {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }

    return response.json();
  },

  async deleteProposal(id) {
    const response = await fetch(apiUrl(`/api/proposals/${id}`), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }
  },

  async getUserDashboardSummary() {
    const response = await fetch(apiUrl('/api/user/dashboard-summary'), {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }

    return response.json();
  },
};
