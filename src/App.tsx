import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { ProjectLayout } from "./components/layout/ProjectLayout";
import { useAuth } from "./hooks/useAuth";
import Index from "./pages/Index";
import ProjectManagement from "./pages/ProjectManagement";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// 项目页面组件
import { ProjectHomepage } from "./components/project/ProjectHomepage";
import BasicInfo from "./components/project/BasicInfo";
import { PlanAndOrders } from "./components/plan/PlanAndOrders";
import { RealTimeMonitoring } from "./components/monitoring/RealTimeMonitoring";
import { CraftsmanManagement } from "./components/craftsman/CraftsmanManagement";
import { FundingMaterials } from "./components/funding/FundingMaterials";
import { QualityInspection } from "./components/quality/QualityInspection";
import { DailyLog } from "./components/quality/DailyLog";
import { KnowledgeQA } from "./components/quality/KnowledgeQA";

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
