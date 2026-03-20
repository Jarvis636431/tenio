import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { APP_DEFAULT_TITLE } from "@/config";

// Lazy loaded pages
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Login = lazy(() => import("@/pages/Login"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Overview = lazy(() =>
  import("@/pages/project/Overview").then((module) => ({
    default: module.Overview,
  })),
);

const TITLE_RULES: Array<{ prefix: string; title: string }> = [
  { prefix: "/login", title: "登录" },
];

export function AppRoutes() {
  const auth = useAuth();
  const { user, isLoading } = auth;
  const location = useLocation();

  useEffect(() => {
    const { pathname } = location;
    const matched = TITLE_RULES.find((rule) =>
      pathname.startsWith(rule.prefix),
    );
    document.title = matched?.title ?? APP_DEFAULT_TITLE;
  }, [location]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">加载中...</div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          加载中...
        </div>
      }
    >
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute auth={auth}>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/project/:id"
          element={
            <ProtectedRoute auth={auth}>
              <AppLayout>
                <Overview />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
