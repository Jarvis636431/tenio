import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AutoProjectRoute } from "@/routes/AutoProjectRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Overview } from "@/features/project/components/Overview";
import { APP_DEFAULT_TITLE } from "@/config";

// Lazy loaded pages
const NotFound = lazy(() => import("@/pages/NotFound"));
const TITLE_RULES: Array<{ prefix: string; title: string }> = [];

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
        <Route path="/" element={<AutoProjectRoute />} />
        <Route
          path="/project/:id"
          element={
            <AppLayout>
              <Overview />
            </AppLayout>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
