import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "@/api/client";

type User = {
  id: string;
  email: string;
  role: string;
  organizationId: string;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  signup: (email: string, password: string, organizationId: string) => Promise<User | null>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      // Check if tokens exist before attempting
      const hasToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (!hasToken) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      // Node API exposes current user at /users/me (per OpenAPI), not /auth/profile
      const res = await api.get("/users/me");
      setUser(res.data?.data ?? null);
    } catch (err) {
      // If fetch fails, clear user and tokens
      setUser(null);
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [fetchProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    const { access_token, refresh_token, user: profile } = res.data?.data ?? {};
    if (access_token) localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
    if (refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
    const normalizedProfile = profile ?? null;
    setUser(normalizedProfile);
    return normalizedProfile;
  }, []);

  const signup = useCallback(async (email: string, password: string, organizationId: string) => {
    const res = await api.post("/auth/signup/public", { email, password, organizationId });
    const { access_token, refresh_token, user: profile } = res.data?.data ?? {};
    if (access_token) localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
    if (refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
    const normalizedProfile = profile ?? null;
    setUser(normalizedProfile);
    return normalizedProfile;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, signup, logout }),
    [user, loading, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
