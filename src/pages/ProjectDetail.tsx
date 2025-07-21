
import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { ProjectSidebar } from "@/components/ProjectSidebar";
import { BasicInfo } from "@/components/BasicInfo";
import { PlanOverview } from "@/components/PlanOverview";
import { RealTimeMonitoring } from "@/components/RealTimeMonitoring";
import { OrderManagement } from "@/components/OrderManagement";
import { CraftsmanManagement } from "@/components/CraftsmanManagement";

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
    const commonProps = {
      showExpandButton: isSidebarCollapsed,
      onExpandSidebar: () => setIsSidebarCollapsed(false)
    };

    switch (activeView) {
      case "basic-info":
        return <BasicInfo {...commonProps} />;
      case "plan-overview":
        return <PlanOverview {...commonProps} />;
      case "real-time-monitoring":
        return <RealTimeMonitoring {...commonProps} />;
      case "order-management":
        return <OrderManagement {...commonProps} />;
      case "craftsman-management":
        return <CraftsmanManagement {...commonProps} />;
      default:
        return <BasicInfo {...commonProps} />;
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
          {/* 动态内容区域 */}
          <div className="flex-1 overflow-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
