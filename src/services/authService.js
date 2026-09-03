const AUTH_KEY = 'solarscope.auth';
const SESSION_KEY = 'solarscope.session';

const decodeJwtRole = (token) => {
  if (!token) return 'ROLE_USER';

  try {
    const payload = token.split('.')[1];
    if (!payload) return 'ROLE_USER';

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalized));
    return decoded.role || 'ROLE_USER';
  } catch {
    return 'ROLE_USER';
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

    if (storedAuth && !storedAuth.token) {
      this.logout();
      return null;
    }

    return storedAuth;
  },

  async login({ email, password, remember }) {
    const loginResponse = await requestJson('/api/auth/login', {
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

  async signup({ fullName, email, password }) {
    await requestJson('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: fullName, email, password }),
    });
    const loginResponse = await requestJson('/api/auth/login', {
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
