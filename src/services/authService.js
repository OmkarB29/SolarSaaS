import { apiUrl } from './apiConfig';

const AUTH_KEY = 'solarscope.auth';
const SESSION_KEY = 'solarscope.session';

export const decodeJwtPayload = (token) => {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(normalized));
  } catch {
    return null;
  }
};

export const isJwtExpired = (token) => {
  if (!token) return true;
  const decoded = decodeJwtPayload(token);
  if (!decoded || !decoded.exp) return false;
  // Expired if current time >= exp in milliseconds (with 15s safety buffer)
  return Date.now() >= (decoded.exp * 1000 - 15000);
};

const decodeJwtRole = (token) => {
  const decoded = decodeJwtPayload(token);
  return decoded?.role || 'ROLE_USER';
};

export const notifyUnauthorized = () => {
  try {
    window.dispatchEvent(new CustomEvent('solarscope:auth:unauthorized'));
  } catch {
    // Ignore in non-browser env
  }
};

const requestJson = async (url, options) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    if (response.status === 401) {
      notifyUnauthorized();
    }
    let message = 'Authentication request failed.';
    try {
      const body = await response.json();
      if (Array.isArray(body.fieldErrors) && body.fieldErrors.length > 0) {
        message = body.fieldErrors.map((error) => `${error.field}: ${error.message}`).join(', ');
      } else {
        message = body.message || message;
      }
    } catch {
      // Keep the default message for non-JSON responses.
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
};

const readJson = (storage, key, fallback) => {
  try {
    const value = storage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (storage, key, value) => {
  storage.setItem(key, JSON.stringify(value));
};

export const authService = {
  getStoredAuth() {
    const storedAuth = readJson(localStorage, AUTH_KEY, null) || readJson(sessionStorage, SESSION_KEY, null);

    if (storedAuth) {
      if (!storedAuth.token || isJwtExpired(storedAuth.token)) {
        console.warn('[authService] Stored JWT token has expired or is invalid. Clearing expired session.');
        this.logout();
        return null;
      }
    }

    return storedAuth;
  },

  async login({ email, password, remember }) {
    const loginResponse = await requestJson(apiUrl('/api/auth/login'), {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!loginResponse.token) {
      throw new Error('Login did not return an authentication token.');
    }

    const authPayload = {
      user: {
        fullName: email.split('@')[0],
        email,
        role: decodeJwtRole(loginResponse.token),
      },
      token: loginResponse.token,
      type: loginResponse.type || 'Bearer',
      authenticatedAt: new Date().toISOString(),
    };

    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(AUTH_KEY);
    writeJson(remember ? localStorage : sessionStorage, remember ? AUTH_KEY : SESSION_KEY, authPayload);

    return authPayload;
  },

  async loginDemoUser() {
    return await this.login({
      email: 'user@solarsaas.com',
      password: 'User@12345',
      remember: true,
    });
  },

  async signup({ fullName, email, password }) {
    await requestJson(apiUrl('/api/auth/register'), {
      method: 'POST',
      body: JSON.stringify({ name: fullName, email, password }),
    });
    const loginResponse = await requestJson(apiUrl('/api/auth/login'), {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!loginResponse.token) {
      throw new Error('Signup did not return an authentication token.');
    }

    const authPayload = {
      user: {
        fullName,
        email,
        role: decodeJwtRole(loginResponse.token),
      },
      token: loginResponse.token,
      type: loginResponse.type || 'Bearer',
      authenticatedAt: new Date().toISOString(),
    };

    writeJson(localStorage, AUTH_KEY, authPayload);
    sessionStorage.removeItem(SESSION_KEY);

    return authPayload;
  },

  logout() {
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  },
};
