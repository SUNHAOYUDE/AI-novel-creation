import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getMe, login, register } from "@/features/auth/api";
import type { AuthResult, AuthUser } from "@/shared/types";

const STORAGE_KEY = "auth_token";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isBootstrapping: boolean;
  loginWithPassword: (payload: { email: string; password: string }) => Promise<AuthResult>;
  registerWithPassword: (payload: { email: string; password: string }) => Promise<AuthResult>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const applyAuthResult = useCallback((result: AuthResult) => {
    localStorage.setItem(STORAGE_KEY, result.token);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const loginWithPassword = useCallback(async (payload: { email: string; password: string }) => {
    const result = await login(payload);
    applyAuthResult(result);
    return result;
  }, [applyAuthResult]);

  const registerWithPassword = useCallback(async (payload: { email: string; password: string }) => {
    const result = await register(payload);
    applyAuthResult(result);
    return result;
  }, [applyAuthResult]);

  useEffect(() => {
    async function bootstrap() {
      setIsBootstrapping(true);
      if (!token) {
        setUser(null);
        setIsBootstrapping(false);
        return;
      }

      try {
        const me = await getMe();
        setUser(me);
        if (!me) {
          logout();
        }
      }
      catch {
        logout();
      }
      finally {
        setIsBootstrapping(false);
      }
    }

    void bootstrap();
  }, [logout, token]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    isBootstrapping,
    loginWithPassword,
    registerWithPassword,
    logout
  }), [isBootstrapping, loginWithPassword, logout, registerWithPassword, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("AuthProvider is missing");
  }
  return ctx;
}

