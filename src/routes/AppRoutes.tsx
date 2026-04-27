import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { APP_DEFAULT_TITLE } from "@/config";
import { PublicOnlyRoute, RequireAuth } from "./guards";

// Lazy loaded pages / layouts
const NotFound = lazy(() => import("@/pages/NotFound"));
const LoginPage = lazy(() => import("@/pages/Login"));
const ProjectsPage = lazy(() => import("@/pages/Projects"));
const UploadPage = lazy(() => import("@/features/upload/pages/UploadPage"));
const AppLayout = lazy(() =>
  import("@/components/layout/AppLayout").then((m) => ({ default: m.AppLayout })),
);
const Overview = lazy(() =>
  import("@/features/project/pages/Overview").then((m) => ({ default: m.Overview })),
);
const TITLE_RULES: Array<{ prefix: string; title: string }> = [
  { prefix: "/login", title: "A.PM 智管 · 登录" },
  { prefix: "/projects", title: "A.PM 智管 · 项目控制台" },
  { prefix: "/upload", title: "A.PM 智管 · 新建项目" },
  { prefix: "/project/", title: "A.PM 智管 · 项目工作台" },
];

export function AppRoutes() {
  const location = useLocation();

  useEffect(() => {
    const { pathname } = location;
    const matched = TITLE_RULES.find((rule) => pathname.startsWith(rule.prefix));
    document.title = matched?.title ?? APP_DEFAULT_TITLE;
  }, [location]);

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">加载中...</div>}>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <RequireAuth>
              <ProjectsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/upload"
          element={
            <RequireAuth>
              <UploadPage />
            </RequireAuth>
          }
        />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Navigate to="/projects" replace />
            </RequireAuth>
          }
        />
        <Route
          path="/project/:id"
          element={
            <RequireAuth>
              <AppLayout>
                <Overview />
              </AppLayout>
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
