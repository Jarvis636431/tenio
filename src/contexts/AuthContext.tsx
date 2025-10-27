import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 检查本地存储中是否有登录信息
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed) {
          const normalizedUser: User = {
            id: parsed.id ?? '1',
            username: parsed.username ?? parsed.email ?? 'user',
            name: parsed.name ?? parsed.username ?? parsed.email ?? '用户'
          };
          setUser(normalizedUser);
        }
      } catch {
        // ignore parse errors
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      // 模拟登录验证
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser: User = {
        id: '1',
        username,
        name: username
      };
      
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      // 模拟注册过程
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockUser: User = {
        id: Date.now().toString(),
        username,
        name: username
      };

      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
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
