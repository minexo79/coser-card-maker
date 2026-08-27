import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import * as auth from '../services/auth';

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => auth.getStoredUser());
  const [loading, setLoading] = useState(() => !!auth.getToken());

  useEffect(() => {
    const token = auth.getToken();
    if (!token) {
      return;
    }
    let cancelled = false;
    auth.getMe()
      .then((me) => {
        if (!cancelled) {
          setUser(me);
          auth.setStoredUser(me);
        }
      })
      .catch(async () => {
        if (cancelled) return;
        // Access token expired, try refresh
        try {
          await auth.refreshAccessToken();
          const me = await auth.getMe();
          if (!cancelled) {
            setUser(me);
            auth.setStoredUser(me);
          }
        } catch {
          if (!cancelled) {
            auth.clearToken();
            setUser(null);
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await auth.login(username, password);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    auth.logout();
    setUser(null);
  }, []);

  const value = {
    user,
    token: auth.getToken(),
    login,
    logout,
    isAuthenticated: !!user,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
