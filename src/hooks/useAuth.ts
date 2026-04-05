import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";

let authInitialized = false;

/**
 * 兼容原有 AuthContext 的 hook
 * 提供相同的 API，但使用 Zustand 作为底层实现
 */
export function useAuth() {
  const { user, token, isLoading, login, register, logout, initializeAuth } = useAuthStore();

  // 初始化认证状态（仅在首次加载时）
  useEffect(() => {
    if (authInitialized) {
      return;
    }
    authInitialized = true;
    void initializeAuth();
  }, [initializeAuth]);

  return {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
  };
}
