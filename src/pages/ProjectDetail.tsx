
import { useState } from "react";
import { useParams } from "react-router-dom";
import { ProjectSidebar } from "@/components/ProjectSidebar";
import { BasicInfo } from "@/components/BasicInfo";
import { PlanOverview } from "@/components/PlanOverview";
import { RealTimeMonitoring } from "@/components/RealTimeMonitoring";
import { OrderManagement } from "@/components/OrderManagement";

export default function ProjectDetail() {
  const { id } = useParams();
  const [activeView, setActiveView] = useState("basic-info");

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

  return (
    <div className="h-full flex overflow-hidden p-4">
      {/* 白色内容卡片包含整个内容区域 */}
      <div className="flex-1 bg-card rounded-xl flex overflow-hidden shadow-sm">
        {/* 项目内部侧边栏 */}
        <div className="h-full overflow-hidden">
          <ProjectSidebar activeView={activeView} onViewChange={setActiveView} />
        </div>
        
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
