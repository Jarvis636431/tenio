import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import type { AuthSession, AuthUser, SetupProfileResponse } from "@/features/auth";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
  user: AuthUser | null;
  setSession: (session: AuthSession) => void;
  setUser: (user: AuthUser) => void;
  applyProfile: (profile: SetupProfileResponse) => void;
  logout: () => void;
}

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

function getAuthStorage(): StateStorage {
  if (typeof window === "undefined") {
    return noopStorage;
  }

  try {
    return window.localStorage;
  } catch {
    return noopStorage;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      user: null,
      setSession: (session) => {
        set({
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          expiresAt: session.expires_at,
          user: session.user,
        });
      },
      setUser: (user) => {
        set({ user });
      },
      applyProfile: (profile) => {
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                user_id: profile.user_id,
                username: profile.username,
                display_name: profile.username,
                account: profile.account,
                is_profile_completed: profile.is_profile_completed,
              }
            : null,
        }));
      },
      logout: () => {
        set({
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
          user: null,
        });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(getAuthStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
        user: state.user,
      }),
    },
  ),
);
