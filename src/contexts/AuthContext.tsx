import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getCurrentUser, login as loginRequest, register as registerRequest, TOKEN_STORAGE_KEY } from '@/services/user-service';

interface User {
  id: string;
  username: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const USER_STORAGE_KEY = 'user';

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const savedUser = localStorage.getItem(USER_STORAGE_KEY);

    const bootstrap = async () => {
      if (savedToken) {
        setToken(savedToken);
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            if (parsed) {
                const normalizedUser: User = {
                  id: parsed.id ?? 'unknown',
                  username: parsed.username ?? '用户',
                  role: parsed.role,
                };
                setUser(normalizedUser);
            }
          } catch {
            // ignore parse errors
          }
        }
        try {
          const profile = await getCurrentUser(savedToken);
          const normalizedUser: User = {
            id: profile.user_id,
            username: profile.username,
            role: profile.role,
          };
          setUser(normalizedUser);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUser));
        } catch (error) {
          console.error('Failed to fetch current user profile:', error);
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          localStorage.removeItem(USER_STORAGE_KEY);
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    bootstrap();
  }, []);

  const authenticate = useCallback(
    async (username: string, password: string, options?: { skipLoading?: boolean }) => {
      if (!options?.skipLoading) {
        setIsLoading(true);
      }
      try {
        const response = await loginRequest({ username, password });
        const accessToken = response.access_token;
        setToken(accessToken);
        localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);

        let profile: User;
        try {
          const remoteProfile = await getCurrentUser(accessToken);
          profile = {
            id: remoteProfile.user_id,
            username: remoteProfile.username,
            role: remoteProfile.role,
          };
        } catch (error) {
          console.error('Failed to fetch user profile after login:', error);
          profile = {
            id: 'unknown',
            username,
          };
        }

        setUser(profile);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
      } finally {
        if (!options?.skipLoading) {
          setIsLoading(false);
        }
      }
    },
    []
  );

  const login = useCallback(
    async (username: string, password: string) => {
      await authenticate(username, password);
    },
    [authenticate]
  );

  const register = useCallback(
    async (username: string, password: string) => {
      setIsLoading(true);
      try {
        await registerRequest({ username, password, role: 'user' });
        await authenticate(username, password, { skipLoading: true });
      } finally {
        setIsLoading(false);
      }
    },
    [authenticate]
  );

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
