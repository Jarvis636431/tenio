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
import { CommunicationCollaboration } from "./components/communication/CommunicationCollaboration";
import { FundingMaterials } from "./components/funding/FundingMaterials";
import { QualityInspection } from "./components/quality/QualityInspection";
import { DailyLog } from "./components/quality/DailyLog";
import { KnowledgeQA } from "./components/quality/KnowledgeQA";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">加载中...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">加载中...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={
        user ? <Navigate to="/" replace /> : <Login />
      } />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <Index />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/project-management" element={
        <ProtectedRoute>
          <Layout>
            <ProjectManagement />
          </Layout>
        </ProtectedRoute>
      } />
      <Route 
        path="/project/:id" 
        element={
          <ProtectedRoute>
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
        <Route path="plan" element={<PlanAndOrders />} />
        <Route path="plan/overview" element={<PlanAndOrders />} />
        <Route path="plan/gantt" element={<PlanAndOrders />} />
        
        {/* 实时监测 */}
        <Route path="monitoring" element={<RealTimeMonitoring />} />
        <Route path="monitoring/labor" element={<RealTimeMonitoring />} />
        <Route path="monitoring/cost" element={<RealTimeMonitoring />} />
        
        {/* 工匠管理 */}
        <Route path="craftsman" element={<CraftsmanManagement />} />
        
        {/* 沟通协作 */}
        <Route path="communication" element={<CommunicationCollaboration />} />
        
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
