import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import BasicInfo from "@/components/BasicInfo";
import { RealTimeMonitoring } from "@/components/RealTimeMonitoring";
import { CraftsmanManagement } from "@/components/CraftsmanManagement";
import { CommunicationCollaboration } from "@/components/CommunicationCollaboration";
import { PlanAndOrders } from "@/components/PlanAndOrders";
import { ProjectHomepage } from "@/components/ProjectHomepage";
import { useProject } from "@/contexts/ProjectContext";
import { PageHeader } from "@/components/PageHeader";
import { useProjectSchedule } from "@/hooks/useProjectSchedule";
import type { ProjectInfoRow } from "@/services/project-service";
import { FundingMaterials } from "@/components/FundingMaterials";

export default function ProjectDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [activeView, setActiveView] = useState("homepage");
  const { projects } = useProject();
  const [basicInfoActions, setBasicInfoActions] =
    useState<React.ReactNode>(null);
  const { projectInfo } = useProjectSchedule();

  const totalDurationLabel = useMemo(() => {
    if (!projectInfo || projectInfo.length === 0) {
      return "";
    }

    const totalDurationRow = projectInfo.find((row: ProjectInfoRow) => {
      const label = row["项目信息"] ?? row["项目统计"];
      return typeof label === "string" && label.includes("总工期");
    });

    if (!totalDurationRow) {
      return "";
    }

    const valueKey = Object.keys(totalDurationRow).find((key) => {
      if (
        key === "项目信息" ||
        key === "项目统计" ||
        key.toLowerCase().includes("index")
      ) {
        return false;
      }
      const value = totalDurationRow[key];
      return (
        value !== undefined && value !== null && String(value).trim() !== ""
      );
    });

    if (!valueKey) {
      return "";
    }

    const value = totalDurationRow[valueKey];
    const result = typeof value === "string" ? value : String(value ?? "");
    return result.trim();
  }, [projectInfo]);

  const planViews = useMemo(
    () =>
      new Set([
        "plan-and-orders",
        "task-overview",
        "gantt-chart",
        "plan-overview",
        "order-management",
      ]),
    []
  );

  useEffect(() => {
    const viewParam = searchParams.get("view");
    if (viewParam) {
      setActiveView(viewParam);
    } else {
      setActiveView("homepage");
    }
  }, [searchParams]);

  const getViewTitle = () => {
    const tab = searchParams.get("tab");

    switch (activeView) {
      case "homepage":
        return "项目主页";
      case "basic-info":
        return "基础信息";
      case "plan-and-orders":
        // 如果有tab参数，显示具体的tab标题
        if (tab === "task-overview") {
          return "任务总览";
        } else if (tab === "gantt-chart") {
          return "施工工序甘特图";
        }
        return "施工总览";
      case "plan-overview":
      case "order-management":
        return "施工总览";
      case "real-time-monitoring":
        // 根据tab参数显示具体标题
        if (tab === "labor") {
          return "施工人数";
        } else if (tab === "cost") {
          return "人工成本";
        }
        return "实时监测";
      case "labor":
        return "施工人数";
      case "cost":
        return "人工成本";
      case "craftsman-management":
        return "工匠管理";
      case "communication-collaboration":
        return "沟通协作";
      case "funding-materials":
        return "资金物料";
      default:
        return "项目主页";
    }
  };

  const renderContent = () => {
    const commonProps = {
      showExpandButton: false,
      onExpandSidebar: () => {},
    };

    // 获取当前项目信息
    const currentProject = projects.find((p) => p.id === id);

    switch (activeView) {
      case "homepage":
        return (
          <ProjectHomepage
            projectId={id || ""}
            projectName={currentProject?.name || "未知项目"}
          />
        );
      case "basic-info":
        return (
          <BasicInfo {...commonProps} onActionsChange={setBasicInfoActions} />
        );
      case "plan-and-orders":
      case "task-overview":
      case "gantt-chart":
      case "plan-overview":
      case "order-management":
        return <PlanAndOrders {...commonProps} />;
      case "real-time-monitoring":
      case "labor":
      case "cost":
        return <RealTimeMonitoring {...commonProps} />;
      case "craftsman-management":
        return <CraftsmanManagement {...commonProps} />;
      case "communication-collaboration":
        return <CommunicationCollaboration {...commonProps} />;
      case "funding-materials":
        return <FundingMaterials {...commonProps} />;
      default:
        return (
          <ProjectHomepage
            projectId={id || ""}
            projectName={currentProject?.name || "未知项目"}
          />
        );
    }
  };

  // 项目主页使用特殊布局 - 显示项目名称作为标题
  if (activeView === "homepage") {
    const currentProject = projects.find((p) => p.id === id);
    return (
      <div className="h-full flex flex-col overflow-hidden bg-white">
        <div className="px-6">
          <PageHeader
            title={currentProject?.name || "项目主页"}
            titleExtra={totalDurationLabel ? `总工期：${totalDurationLabel}` : undefined}
          />
        </div>
        {/* 主内容区域 - 直接显示，无标题区域 */}
        <div className="flex-1 overflow-hidden px-6 pb-6">
          <div className="h-full overflow-auto">{renderContent()}</div>
        </div>
      </div>
    );
  }

  // 基础信息、施工总览和实时监测页面使用特殊布局 - 无白色卡片包装
  if (
    activeView === "basic-info" ||
    activeView === "plan-and-orders" ||
    activeView === "task-overview" ||
    activeView === "gantt-chart" ||
    activeView === "real-time-monitoring" ||
    activeView === "labor" ||
    activeView === "cost"
  ) {
    return (
      <div className="h-full flex flex-col overflow-hidden bg-white">
        <div className="px-6 pt-6">
          <PageHeader
            title={getViewTitle()}
            actions={activeView === "basic-info" ? basicInfoActions : undefined}
            titleExtra={
              planViews.has(activeView) && totalDurationLabel
                ? `总工期：${totalDurationLabel}`
                : undefined
            }
          />
        </div>

        {/* 主内容区域 - 直接显示，无白色卡片包装 */}
        <div className="flex-1 overflow-hidden px-6 pb-6">
          <div className="h-full overflow-auto">{renderContent()}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      <div className="px-6 pt-6">
        <PageHeader title={getViewTitle()} />
      </div>

      {/* 主内容区域 - 白色卡片容器 */}
      <div className="flex-1 overflow-hidden px-6 pb-6">
        <div className="h-full bg-white rounded-lg overflow-hidden">
          <div className="h-full overflow-auto">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}
