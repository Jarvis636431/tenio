
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
    <div className="h-full flex">
      {/* 项目内部侧边栏 */}
      <ProjectSidebar activeView={activeView} onViewChange={setActiveView} />
      
      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col">
        {/* 页面头部 */}
        <div className="border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">办公楼建设项目</h1>
              <p className="text-muted-foreground">施工进度管理与监控</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                编辑项目
              </Button>
              <Button>
                <Activity className="mr-2 h-4 w-4" />
                实时监控
              </Button>
            </div>
          </div>
        </div>

        {/* 动态内容区域 */}
        <div className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
