const AUTH_KEY = 'solarscope.auth';
const SESSION_KEY = 'solarscope.session';
const USERS_KEY = 'solarscope.users';

const fallbackUser = {
  id: 'demo-user',
  fullName: 'Alice Johnson',
  email: 'alice@solarscope.io',
  role: 'Energy Analyst',
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
    return readJson(localStorage, AUTH_KEY, null) || readJson(sessionStorage, SESSION_KEY, null);
  },

  login({ email, remember }) {
    const users = readJson(localStorage, USERS_KEY, []);
    const existingUser = users.find((user) => user.email.toLowerCase() === email.toLowerCase());
    const user = existingUser || { ...fallbackUser, email };
    const authPayload = { user, authenticatedAt: new Date().toISOString() };

    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(AUTH_KEY);
    writeJson(remember ? localStorage : sessionStorage, remember ? AUTH_KEY : SESSION_KEY, authPayload);

    return authPayload;
  },

  signup({ fullName, email }) {
    const users = readJson(localStorage, USERS_KEY, []);
    const user = {
      id: globalThis.crypto?.randomUUID?.() || `user-${Date.now()}`,
      fullName,
      email,
      role: 'Energy Analyst',
    };

    const nextUsers = [
      ...users.filter((storedUser) => storedUser.email.toLowerCase() !== email.toLowerCase()),
      user,
    ];
    const authPayload = { user, authenticatedAt: new Date().toISOString() };

    writeJson(localStorage, USERS_KEY, nextUsers);
    writeJson(localStorage, AUTH_KEY, authPayload);
    sessionStorage.removeItem(SESSION_KEY);

    return authPayload;
  },

  logout() {
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  },
};
