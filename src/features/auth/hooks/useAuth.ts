import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import {
  getCurrentUser,
  loginWithPassword,
  loginWithSms,
  sendLoginSms,
  setupProfile,
} from "../services/auth-api";
import type { PasswordLoginPayload, SetupProfilePayload, SmsLoginPayload } from "../types";

const authQueryKeys = {
  me: ["auth", "me"] as const,
};

/**
 * 协调登录、验证码、当前用户和退出登录状态。
 *
 * @returns Auth 状态和动作
 */
export function useAuth() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const expiresAt = useAuthStore((state) => state.expiresAt);
  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  const setUser = useAuthStore((state) => state.setUser);
  const applyProfile = useAuthStore((state) => state.applyProfile);
  const clearSession = useAuthStore((state) => state.logout);

  const meQuery = useQuery({
    queryKey: authQueryKeys.me,
    queryFn: getCurrentUser,
    enabled: Boolean(accessToken),
    refetchOnWindowFocus: false,
  });

  const smsMutation = useMutation({
    mutationFn: sendLoginSms,
  });

  const smsLoginMutation = useMutation({
    mutationFn: (payload: SmsLoginPayload) => loginWithSms(payload),
    onSuccess: (session) => {
      setSession(session);
      queryClient.setQueryData(authQueryKeys.me, session.user);
    },
  });

  const passwordLoginMutation = useMutation({
    mutationFn: (payload: PasswordLoginPayload) => loginWithPassword(payload),
    onSuccess: (session) => {
      setSession(session);
      queryClient.setQueryData(authQueryKeys.me, session.user);
    },
  });

  const setupProfileMutation = useMutation({
    mutationFn: (payload: SetupProfilePayload) => setupProfile(payload),
    onSuccess: (profile) => {
      applyProfile(profile);
      const current = useAuthStore.getState().user;
      if (current) {
        setUser(current);
        queryClient.setQueryData(authQueryKeys.me, current);
      }
    },
  });

  const logout = () => {
    clearSession();
    queryClient.removeQueries({ queryKey: authQueryKeys.me });
  };

  return {
    accessToken,
    refreshToken,
    expiresAt,
    user: meQuery.data ?? user,
    isAuthenticated: Boolean(accessToken),
    isLoadingUser: meQuery.isLoading,
    sendSms: smsMutation.mutateAsync,
    loginWithSms: smsLoginMutation.mutateAsync,
    loginWithPassword: passwordLoginMutation.mutateAsync,
    setupProfile: setupProfileMutation.mutateAsync,
    logout,
    isSendingSms: smsMutation.isPending,
    isLoggingIn: smsLoginMutation.isPending || passwordLoginMutation.isPending,
    isSettingProfile: setupProfileMutation.isPending,
  };
}
