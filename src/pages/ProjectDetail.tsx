
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Edit, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectSidebar } from "@/components/ProjectSidebar";
import { PlanOverview } from "@/components/PlanOverview";
import { RealTimeMonitoring } from "@/components/RealTimeMonitoring";

export default function ProjectDetail() {
  const { id } = useParams();
  const [activeView, setActiveView] = useState("plan-overview");

  const renderContent = () => {
    switch (activeView) {
      case "plan-overview":
        return <PlanOverview />;
      case "real-time-monitoring":
        return <RealTimeMonitoring />;
      default:
        return <PlanOverview />;
    }
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* 项目内部侧边栏 */}
      <div className="h-full overflow-hidden">
        <ProjectSidebar activeView={activeView} onViewChange={setActiveView} />
      </div>
      
      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 动态内容区域 */}
        <div className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
