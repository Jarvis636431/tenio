import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  getCurrentUser,
  login as loginRequest,
  register as registerRequest,
} from "@/services/user-service";

interface User {
  id: string;
  username: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;

  // Actions
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,

      login: async (username: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await loginRequest({ username, password });
          const accessToken = response.access_token;

          let profile: User;
          try {
            const remoteProfile = await getCurrentUser(accessToken);
            profile = {
              id: remoteProfile.user_id,
              username: remoteProfile.username,
              role: remoteProfile.role,
            };
          } catch (error) {
            console.error("Failed to fetch user profile after login:", error);
            profile = {
              id: "unknown",
              username,
            };
          }

          set({
            user: profile,
            token: accessToken,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (username: string, password: string) => {
        set({ isLoading: true });
        try {
          await registerRequest({ username, password });
          // 注册成功后自动登录
          await get().login(username, password);
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isLoading: false,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      initializeAuth: async () => {
        const { token } = get();

        if (!token) {
          set({ isLoading: false });
          return;
        }

        try {
          const profile = await getCurrentUser(token);
          const normalizedUser: User = {
            id: profile.user_id,
            username: profile.username,
            role: profile.role,
          };

          set({
            user: normalizedUser,
            isLoading: false,
          });
        } catch (error) {
          console.error("Failed to fetch current user profile:", error);
          // Token 无效，清除状态
          set({
            user: null,
            token: null,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    },
  ),
);
