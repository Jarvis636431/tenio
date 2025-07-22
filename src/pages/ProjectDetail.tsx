import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { BasicInfo } from "@/components/BasicInfo";
import { PlanOverview } from "@/components/PlanOverview";
import { RealTimeMonitoring } from "@/components/RealTimeMonitoring";
import { OrderManagement } from "@/components/OrderManagement";
import { CraftsmanManagement } from "@/components/CraftsmanManagement";
import { CommunicationCollaboration } from "@/components/CommunicationCollaboration";

export default function ProjectDetail() {
  const {
    id
  } = useParams();
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

  const renderContent = () => {
    const commonProps = {
      showExpandButton: false,
      onExpandSidebar: () => {}
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
      case "communication-collaboration":
        return <CommunicationCollaboration {...commonProps} />;
      default:
        return <BasicInfo {...commonProps} />;
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 主内容区域 - 白色卡片容器 */}
      <div className="flex-1 overflow-hidden p-6 px-[8px] py-[8px]">
        <div className="h-full bg-white rounded-lg overflow-hidden">
          <div className="h-full overflow-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
