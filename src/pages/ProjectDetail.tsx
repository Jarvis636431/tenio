import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import BasicInfo from "@/components/BasicInfo";
import { PlanOverview } from "@/components/PlanOverview";
import { RealTimeMonitoring } from "@/components/RealTimeMonitoring";
import { OrderManagement } from "@/components/OrderManagement";
import { CraftsmanManagement } from "@/components/CraftsmanManagement";
import { CommunicationCollaboration } from "@/components/CommunicationCollaboration";
import { PlanAndOrders } from "@/components/PlanAndOrders";
import { ProjectHomepage } from "@/components/ProjectHomepage";
import { useProject } from "@/contexts/ProjectContext";

// 实时监测的tab配置
const chartConfig = {
  procurement: {
    title: "采购进度"
  },
  labor: {
    title: "劳动力配置"
  },
  funding: {
    title: "资金使用"
  },
  materials: {
    title: "物料供应"
  }
};

export default function ProjectDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [activeView, setActiveView] = useState("homepage");
  const { projects } = useProject();

  useEffect(() => {
    const viewParam = searchParams.get("view");
    if (viewParam) {
      setActiveView(viewParam);
    } else {
      setActiveView("homepage");
    }
  }, [searchParams]);

  const getViewTitle = () => {
    const tab = searchParams.get('tab');
    
    switch (activeView) {
      case "homepage":
        return "项目主页";
      case "basic-info":
        return "基础信息";
      case "plan-and-orders":
        // 如果有tab参数，显示具体的tab标题
        if (tab === 'task-overview') {
          return "任务总览";
        } else if (tab === 'gantt-chart') {
          return "施工工序甘特图";
        }
        return "施工总览";
      case "plan-overview":
      case "order-management":
        return "施工总览";
      case "real-time-monitoring":
        return "";
      case "procurement":
      case "labor":
      case "funding":
      case "materials":
        return getRealTimeMonitoringTitle();
      case "craftsman-management":
        return "工匠管理";
      case "communication-collaboration":
        return "沟通协作";
      default:
        return "项目主页";
    }
  };

  const getViewDescription = () => {
    switch (activeView) {
      case "homepage":
        return "项目整体进展和快速入口";
      case "basic-info":
        return "查看和编辑项目的基本信息";
    case "plan-and-orders":
    case "plan-overview":
    case "order-management":
      return "管理施工进度，追踪工单";
      case "real-time-monitoring":
        return "实时监控项目状态和数据";
      case "order-management":
        return "管理项目相关订单";
      case "craftsman-management":
        return "管理项目工匠团队";
      case "communication-collaboration":
        return "团队沟通与协作";
      default:
        return "项目整体进展和快速入口";
    }
  };

  const getRealTimeMonitoringTitle = () => {
    const tab = searchParams.get('tab');
    if (tab && chartConfig[tab as keyof typeof chartConfig]) {
      return chartConfig[tab as keyof typeof chartConfig].title;
    }
    return "采购进度"; // 默认标题
  };

  const getPlanAndOrdersTitle = () => {
    const tab = searchParams.get('tab');
    if (tab === 'task-overview') {
      return "任务总览";
    } else if (tab === 'gantt-chart') {
      return "施工工序甘特图";
    }
    return "任务总览"; // 默认标题
  };

  const renderContent = () => {
    const commonProps = {
      showExpandButton: false,
      onExpandSidebar: () => {}
    };

    // 获取当前项目信息
    const currentProject = projects.find(p => p.id === id);

    switch (activeView) {
      case "homepage":
        return <ProjectHomepage projectId={id || ""} projectName={currentProject?.name || "未知项目"} />;
      case "basic-info":
        return <BasicInfo {...commonProps} />;
      case "plan-and-orders":
      case "task-overview":
      case "gantt-chart":
      case "plan-overview":
      case "order-management":
        return <PlanAndOrders {...commonProps} />;
      case "real-time-monitoring":
      case "procurement":
      case "labor":
      case "funding":
      case "materials":
        return <RealTimeMonitoring {...commonProps} />;
      case "craftsman-management":
        return <CraftsmanManagement {...commonProps} />;
      case "communication-collaboration":
        return <CommunicationCollaboration {...commonProps} />;
      default:
        return <ProjectHomepage projectId={id || ""} projectName={currentProject?.name || "未知项目"} />;
    }
  };

  // 项目主页使用特殊布局 - 无标题区域
  if (activeView === "homepage") {
    return (
      <div className="h-full flex flex-col overflow-hidden bg-white">
        {/* 主内容区域 - 直接显示，无标题区域 */}
        <div className="flex-1 overflow-hidden p-6 px-[8px] py-6">
          <div className="h-full overflow-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    );
  }

  // 基础信息和施工总览页面使用特殊布局 - 无白色卡片包装
  if (activeView === "basic-info" || activeView === "plan-and-orders" || activeView === "task-overview" || activeView === "gantt-chart") {
    return (
      <div className="h-full flex flex-col overflow-hidden bg-white">
        {/* 基础信息页面隐藏标题 */}
        {activeView !== "basic-info" && (
          <div className="p-6 px-[8px] py-[8px] pb-0">
            <div className="space-y-2 mb-6">
              <h1 className="tracking-tight font-medium text-xl">{getViewTitle()}</h1>
            </div>
          </div>
        )}

        {/* 主内容区域 - 直接显示，无白色卡片包装 */}
        <div className={`flex-1 overflow-hidden ${activeView === "basic-info" ? "p-6" : "p-6 px-[8px] py-0"}`}>
          <div className="h-full overflow-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    );
  }

  // 实时监测页面使用特殊布局
  if (activeView === "real-time-monitoring") {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        {/* 标题区域 */}
        <div className="p-6 px-[8px] py-[8px] pb-0">
          <div className="space-y-2 mb-6">
            <h1 className="tracking-tight font-medium text-xl">{getRealTimeMonitoringTitle()}</h1>
          </div>
        </div>

        {/* 主内容区域 - 实时监测使用自己的布局 */}
        <div className="flex-1 overflow-hidden p-6 px-[8px] py-0">
          <div className="h-full overflow-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      {/* 标题区域 - 移到白色卡片外面 */}
      <div className="p-6 px-[8px] py-[8px] pb-0">
        <div className="space-y-2 mb-6">
          <h1 className="tracking-tight font-medium text-xl">{getViewTitle()}</h1>
        </div>
      </div>

      {/* 主内容区域 - 白色卡片容器 */}
      <div className="flex-1 overflow-hidden p-6 px-[8px] py-0">
        <div className="h-full bg-white rounded-lg overflow-hidden">
          <div className="h-full overflow-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}