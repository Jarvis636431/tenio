import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth";

function FullPageLoading() {
  return <div className="flex h-screen items-center justify-center text-apm-muted">加载中...</div>;
}

/**
 * 保护需要登录的业务路由。
 *
 * @param props - 组件属性
 * @param props.children - 登录后允许渲染的页面内容
 * @returns 路由内容或登录重定向
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { isAuthenticated, isLoadingUser, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (isLoadingUser && !user) {
    return <FullPageLoading />;
  }

  return <>{children}</>;
}

/**
 * 处理登录页访问策略。
 *
 * @param props - 组件属性
 * @param props.children - 未登录时渲染的登录页
 * @returns 登录页内容或项目控制台重定向
 */
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoadingUser, user } = useAuth();

  if (isAuthenticated && isLoadingUser && !user) {
    return <FullPageLoading />;
  }

  if (isAuthenticated) {
    return <Navigate to="/projects" replace />;
  }

  return <>{children}</>;
}
