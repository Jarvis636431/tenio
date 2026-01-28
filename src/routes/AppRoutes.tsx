import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppLayout } from "@/components/layout/app/AppLayout";
import { ProjectLayout } from "@/components/layout/project/ProjectLayout";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { ProjectRoutes } from "@/routes/ProjectRoutes";
import { CreateProjectRoutes } from "@/routes/CreateProjectRoutes";
import { APP_DEFAULT_TITLE } from "@/config";

// Lazy loaded pages
const Index = lazy(() => import("@/pages/Index"));
const ProjectManagement = lazy(() => import("@/pages/ProjectManagement"));
const Login = lazy(() => import("@/pages/Login"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const CreateProject = lazy(() => import("@/pages/create/CreatePage"));

const TITLE_RULES: Array<{ prefix: string; title: string }> = [
  { prefix: "/login", title: "登录" },
  { prefix: "/create", title: "创建" },
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
                <Index />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/project-management"
          element={
            <ProtectedRoute auth={auth}>
              <AppLayout>
                <ProjectManagement />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/create"
          element={
            <ProtectedRoute auth={auth}>
              <CreateProject />
            </ProtectedRoute>
          }
        >
          {CreateProjectRoutes()}
        </Route>
        <Route
          path="/project/:id"
          element={
            <ProtectedRoute auth={auth}>
              <AppLayout>
                <ProjectLayout />
              </AppLayout>
            </ProtectedRoute>
          }
        >
          {ProjectRoutes()}
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
