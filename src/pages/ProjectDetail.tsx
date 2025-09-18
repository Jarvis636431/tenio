import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { BasicInfo } from "@/components/BasicInfo";
import { PlanOverview } from "@/components/PlanOverview";
import { RealTimeMonitoring } from "@/components/RealTimeMonitoring";
import { OrderManagement } from "@/components/OrderManagement";
import { CraftsmanManagement } from "@/components/CraftsmanManagement";
import { CommunicationCollaboration } from "@/components/CommunicationCollaboration";
import { PlanAndOrders } from "@/components/PlanAndOrders";

export default function ProjectDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [activeView, setActiveView] = useState("basic-info");

  useEffect(() => {
    const viewParam = searchParams.get("view");
    if (viewParam) {
      setActiveView(viewParam);
    } else {
      setActiveView("basic-info");
    }
  }, [searchParams]);

  const getViewTitle = () => {
    switch (activeView) {
      case "basic-info":
        return "基础信息";
    case "plan-and-orders":
    case "plan-overview":
    case "order-management":
      return "施工总览";
      case "real-time-monitoring":
        return "实时监测";
      case "order-management":
        return "订单管理";
      case "craftsman-management":
        return "工匠管理";
      case "communication-collaboration":
        return "沟通协作";
      default:
        return "基础信息";
    }
  };

  const getViewDescription = () => {
    switch (activeView) {
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
        return "查看和编辑项目的基本信息";
    }
  };

  const renderContent = () => {
    const commonProps = {
      showExpandButton: false,
      onExpandSidebar: () => {}
    };

    switch (activeView) {
      case "basic-info":
        return <BasicInfo {...commonProps} />;
      case "plan-and-orders":
      case "plan-overview":
      case "order-management":
        return <PlanAndOrders {...commonProps} />;
      case "real-time-monitoring":
        return <RealTimeMonitoring {...commonProps} />;
      case "craftsman-management":
        return <CraftsmanManagement {...commonProps} />;
      case "communication-collaboration":
        return <CommunicationCollaboration {...commonProps} />;
      default:
        return <BasicInfo {...commonProps} />;
    }
  };

  // 基础信息和施工总览页面使用特殊布局 - 无白色卡片包装
  if (activeView === "basic-info" || activeView === "plan-and-orders") {
    return (
      <div className="h-full flex flex-col overflow-hidden bg-white">
        {/* 标题区域 */}
        <div className="p-6 px-[8px] py-[8px] pb-0">
          <div className="space-y-2 mb-6">
            <h1 className="tracking-tight font-medium text-xl">{getViewTitle()}</h1>
            <p className="text-muted-foreground font-light text-base">
              {getViewDescription()}
            </p>
          </div>
        </div>

        {/* 主内容区域 - 直接显示，无白色卡片包装 */}
        <div className="flex-1 overflow-hidden p-6 px-[8px] py-0">
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
            <h1 className="tracking-tight font-medium text-xl">{getViewTitle()}</h1>
            <p className="text-muted-foreground font-light text-base">
              {getViewDescription()}
            </p>
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
          <p className="text-muted-foreground font-light text-base">
            {getViewDescription()}
          </p>
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