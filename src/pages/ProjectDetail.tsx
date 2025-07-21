
import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectSidebar } from "@/components/ProjectSidebar";
import { BasicInfo } from "@/components/BasicInfo";
import { PlanOverview } from "@/components/PlanOverview";
import { RealTimeMonitoring } from "@/components/RealTimeMonitoring";
import { OrderManagement } from "@/components/OrderManagement";

export default function ProjectDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [activeView, setActiveView] = useState("basic-info");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const viewParam = searchParams.get("view");
    if (viewParam === "plan-overview") {
      setActiveView("plan-overview");
    }
  }, [searchParams]);

  const renderContent = () => {
    switch (activeView) {
      case "basic-info":
        return <BasicInfo />;
      case "plan-overview":
        return <PlanOverview />;
      case "real-time-monitoring":
        return <RealTimeMonitoring />;
      case "order-management":
        return <OrderManagement />;
      default:
        return <BasicInfo />;
    }
  };

  const getContentTitle = () => {
    switch (activeView) {
      case "basic-info":
        return "基础信息";
      case "plan-overview":
        return "计划总览";
      case "real-time-monitoring":
        return "实时监测";
      case "order-management":
        return "订单管理";
      default:
        return "基础信息";
    }
  };

  return (
    <div className="h-full flex overflow-hidden p-4">
      {/* 白色内容卡片包含整个内容区域 */}
      <div className="flex-1 bg-card rounded-xl flex overflow-hidden shadow-sm">
        {/* 项目内部侧边栏 */}
        <ProjectSidebar 
          activeView={activeView} 
          onViewChange={setActiveView}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        
        {/* 主内容区域 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 内容标题区域 - 当侧边栏收起时显示展开按钮 */}
          {isSidebarCollapsed && (
            <div className="px-6 py-4 border-b border-border/50 flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsSidebarCollapsed(false)}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-normal">{getContentTitle()}</h2>
            </div>
          )}
          
          {/* 动态内容区域 */}
          <div className="flex-1 overflow-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
