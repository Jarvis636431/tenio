import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

type AuthState = {
  user: unknown;
  isLoading: boolean;
};

export function ProtectedRoute({
  children,
  auth,
}: {
  children: ReactNode;
  auth: AuthState;
}) {
  const { user, isLoading } = auth;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">加载中...</div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
