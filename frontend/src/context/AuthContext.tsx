import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthApi from '../services/authApi';
import { AuthUser } from '../services/authApi';

const TOKEN_KEY = 'randompick.authToken';
const USER_KEY = 'randompick.authUser';

// Minimal pub/sub so services/api.ts (a plain module, outside React) can
// tell the AuthProvider to drop its in-memory session when a request comes
// back 401 — e.g. the token expired. Without this, clearing AsyncStorage
// alone wouldn't update the already-rendered app, which would keep treating
// the user as signed in until next app launch.
type Listener = () => void;
const sessionExpiredListeners = new Set<Listener>();

/** Called by services/api.ts after a 401 response. */
export function notifySessionExpired() {
  sessionExpiredListeners.forEach((listener) => listener());
}

type AuthContextValue = {
  /** True while the stored token is still being loaded on app start. */
  isLoading: boolean;
  token: string | null;
  user: AuthUser | null;
  register: (email: string, password: string) => Promise<{ email: string }>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const listener: Listener = () => {
      setToken(null);
      setUser(null);
    };
    sessionExpiredListeners.add(listener);
    return () => {
      sessionExpiredListeners.delete(listener);
    };
  }, []);

  const persistSession = async (result: AuthApi.AuthResult) => {
    await AsyncStorage.setItem(TOKEN_KEY, result.token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(result.user));
    setToken(result.token);
    setUser(result.user);
  };

  const register = async (email: string, password: string) => {
    const res = await AuthApi.register(email, password);
    return { email: res.email };
  };

  const verifyEmail = async (email: string, code: string) => {
    const res = await AuthApi.verifyEmail(email, code);
    await persistSession(res);
  };

  const resendVerification = async (email: string) => {
    await AuthApi.resendVerification(email);
  };

  const login = async (email: string, password: string) => {
    const res = await AuthApi.login(email, password);
    await persistSession(res);
  };

  const forgotPassword = async (email: string) => {
    await AuthApi.forgotPassword(email);
  };

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    const res = await AuthApi.resetPassword(email, code, newPassword);
    await persistSession(res);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        token,
        user,
        register,
        verifyEmail,
        resendVerification,
        login,
        forgotPassword,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

/** Reads the stored token directly — used by services/api.ts to attach the
 * Authorization header without needing to be inside a React component. */
export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

/** Clears the stored session directly — used by services/api.ts when a
 * request comes back 401 (expired/invalid token), so the next screen render
 * sees no user and falls back to the sign-in flow. */
export async function clearStoredSession(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}
