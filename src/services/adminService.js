const API_BASE_URL = 'http://localhost:8081/api/admin';

const getStoredToken = () => {
  try {
    const storageKeys = ['solarscope.auth', 'solarscope.session'];
    for (const key of storageKeys) {
      const value = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (!value) continue;
      const parsed = JSON.parse(value);
      if (parsed?.token) return parsed.token;
    }
  } catch {
    // ignore invalid stored auth payloads
  }
  return null;
};

const adminRequest = async (url) => {
  const token = getStoredToken();
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Unauthorized: Admin access required');
    }
    throw new Error(`Request failed: ${response.statusText}`);
  }

  return response.status === 204 ? null : response.json();
};

export const getAdminDashboard = async () => adminRequest(`${API_BASE_URL}/dashboard`);

export const getAdminUsers = async () => adminRequest(`${API_BASE_URL}/users`);

export const getAdminUserDetail = async (userId) => adminRequest(`${API_BASE_URL}/users/${userId}`);

export const getAdminUserAnalyses = async (userId) => adminRequest(`${API_BASE_URL}/users/${userId}/analyses`);

export const getAdminUserReports = async (userId) => adminRequest(`${API_BASE_URL}/users/${userId}/reports`);

export const getAdminAnalyses = async (params = {}) => {
  const search = new URLSearchParams({
    page: String(params.page ?? 0),
    size: String(params.size ?? 20),
  }).toString();
  return adminRequest(`${API_BASE_URL}/analyses?${search}`);
};

export const getAdminReports = async (params = {}) => {
  const search = new URLSearchParams({
    page: String(params.page ?? 0),
    size: String(params.size ?? 20),
  }).toString();
  return adminRequest(`${API_BASE_URL}/reports?${search}`);
};

export const getAdminAnalytics = async () => adminRequest(`${API_BASE_URL}/analytics`);
