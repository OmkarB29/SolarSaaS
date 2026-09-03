import React, { useMemo, useState } from 'react';
import { authService } from '../services/authService';
import { AuthContext } from './authContextValue';

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => authService.getStoredAuth());

  const value = useMemo(
    () => ({
      user: auth?.user || null,
      isAuthenticated: Boolean(auth?.user && auth?.token),
      async login(credentials) {
        const nextAuth = await authService.login(credentials);
        setAuth(nextAuth);
        return nextAuth;
      },
      async signup(payload) {
        const nextAuth = await authService.signup(payload);
        setAuth(nextAuth);
        return nextAuth;
      },
      logout() {
        authService.logout();
        setAuth(null);
      },
    }),
    [auth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
