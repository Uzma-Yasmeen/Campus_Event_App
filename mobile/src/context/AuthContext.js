import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, storage, setUnauthorizedHandler, API_BASE } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storage.load().then((saved) => {
      setSession(saved);
      setLoading(false);
    });

    // Wake the API while the launch screen is up.
    //
    // Free hosting tiers sleep when idle, and the next request pays 30-60
    // seconds to start the service. Asking for /health on launch means that
    // wait usually falls in the moment before anyone has typed anything,
    // rather than on their sign-in. Fire and forget: nothing depends on it.
    fetch(`${API_BASE}/health`).catch(() => {});
  }, []);

  const signOut = useCallback(async () => {
    await storage.clear();
    setSession(null);
  }, []);

  // Let the API layer drop the session when the server rejects the token.
  useEffect(() => {
    setUnauthorizedHandler(() => setSession(null));
  }, []);

  const signIn = useCallback(async (email, password) => {
    const data = await api.login({ email, password });
    await storage.save(data.token, data.user);
    setSession({ token: data.token, user: data.user });
  }, []);

  const signUp = useCallback(async (payload) => {
    const data = await api.register(payload);
    await storage.save(data.token, data.user);
    setSession({ token: data.token, user: data.user });
  }, []);

  const updateUser = useCallback(async (patch) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = { ...prev, user: { ...prev.user, ...patch } };
      storage.save(next.token, next.user);
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session ? session.user : null,
        isOrganizer: !!session && session.user.role === 'organizer',
        loading,
        signIn,
        signUp,
        signOut,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
