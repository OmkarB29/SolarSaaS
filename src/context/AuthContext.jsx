import React, { useMemo, useState } from 'react';
import { authService } from '../services/authService';
import { AuthContext } from './authContextValue';

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => authService.getStoredAuth());

  const value = useMemo(
    () => ({
      user: auth?.user || null,
      isAuthenticated: Boolean(auth?.user),
      login(credentials) {
        const nextAuth = authService.login(credentials);
        setAuth(nextAuth);
        return nextAuth;
      },
      signup(payload) {
        const nextAuth = authService.signup(payload);
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
