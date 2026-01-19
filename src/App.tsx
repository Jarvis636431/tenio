import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { ProjectLayout } from "./components/layout/ProjectLayout";
import { useAuth } from "./hooks/useAuth";
import { lazy, Suspense } from "react";

// Lazy loaded pages
const Index = lazy(() => import("./pages/Index"));
const ProjectManagement = lazy(() => import("./pages/ProjectManagement"));
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Lazy loaded project components
const ProjectHomepage = lazy(() =>
  import("./components/project/ProjectHomepage").then((module) => ({
    default: module.ProjectHomepage,
  })),
);
const BasicInfo = lazy(() => import("./components/project/BasicInfo"));
const PlanAndOrders = lazy(() =>
  import("./components/plan/PlanAndOrders").then((module) => ({
    default: module.PlanAndOrders,
  })),
);
const RealTimeMonitoring = lazy(() =>
  import("./components/monitoring/RealTimeMonitoring").then((module) => ({
    default: module.RealTimeMonitoring,
  })),
);
const CraftsmanManagement = lazy(() =>
  import("./components/craftsman/CraftsmanManagement").then((module) => ({
    default: module.CraftsmanManagement,
  })),
);
const FundingMaterials = lazy(() =>
  import("./components/funding/FundingMaterials").then((module) => ({
    default: module.FundingMaterials,
  })),
);
const QualityInspection = lazy(() =>
  import("./components/quality/QualityInspection").then((module) => ({
    default: module.QualityInspection,
  })),
);
const DailyLog = lazy(() =>
  import("./components/quality/DailyLog").then((module) => ({
    default: module.DailyLog,
  })),
);
const KnowledgeQA = lazy(() =>
  import("./components/quality/KnowledgeQA").then((module) => ({
    default: module.KnowledgeQA,
  })),
);

const queryClient = new QueryClient();

type AuthState = ReturnType<typeof useAuth>;

function ProtectedRoute({
  children,
  auth,
}: {
  children: React.ReactNode;
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

function AppRoutes({ auth }: { auth: AuthState }) {
  const { user, isLoading } = auth;

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
              <Layout>
                <Index />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/project-management"
          element={
            <ProtectedRoute auth={auth}>
              <Layout>
                <ProjectManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/project/:id"
          element={
            <ProtectedRoute auth={auth}>
              <Layout>
                <ProjectLayout />
              </Layout>
            </ProtectedRoute>
          }
        >
          {/* 项目主页 */}
          <Route index element={<ProjectHomepage />} />

          {/* 基础信息 */}
          <Route path="basic-info" element={<BasicInfo />} />

          {/* 施工总览 */}
          <Route path="plan" element={<Navigate to="overview" replace />} />
          <Route path="plan/:tab" element={<PlanAndOrders />} />

          {/* 实时监测 */}
          <Route path="monitoring" element={<Navigate to="labor" replace />} />
          <Route path="monitoring/:tab" element={<RealTimeMonitoring />} />

          {/* 工匠管理 */}
          <Route path="craftsman" element={<CraftsmanManagement />} />

          {/* 资金物料 */}
          <Route path="funding" element={<FundingMaterials />} />

          {/* 工具箱 */}
          <Route path="toolbox/quality" element={<QualityInspection />} />
          <Route path="toolbox/daily-log" element={<DailyLog />} />
          <Route path="toolbox/qa" element={<KnowledgeQA />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

const App = () => {
  const auth = useAuth();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes auth={auth} />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
