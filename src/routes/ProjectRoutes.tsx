import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";

const ProjectHomepage = lazy(() =>
  import("@/pages/project/ProjectHomepage").then((module) => ({
    default: module.ProjectHomepage,
  })),
);
const BasicInfo = lazy(() => import("@/pages/project/BasicInfo"));
const PlanAndOrders = lazy(() =>
  import("@/pages/project/PlanAndOrders").then((module) => ({
    default: module.PlanAndOrders,
  })),
);
const RealTimeMonitoring = lazy(() =>
  import("@/pages/project/RealTimeMonitoring").then((module) => ({
    default: module.RealTimeMonitoring,
  })),
);
const CraftsmanManagement = lazy(() =>
  import("@/pages/project/CraftsmanManagement").then((module) => ({
    default: module.CraftsmanManagement,
  })),
);
const FundingMaterials = lazy(() =>
  import("@/pages/project/FundingMaterials").then((module) => ({
    default: module.FundingMaterials,
  })),
);
const QualityInspection = lazy(() =>
  import("@/pages/project/QualityInspection").then((module) => ({
    default: module.QualityInspection,
  })),
);
const DailyLog = lazy(() =>
  import("@/pages/project/DailyLog").then((module) => ({
    default: module.DailyLog,
  })),
);
const KnowledgeQA = lazy(() =>
  import("@/pages/project/KnowledgeQA").then((module) => ({
    default: module.KnowledgeQA,
  })),
);

export function ProjectRoutes() {
  return (
    <>
      <Route index element={<ProjectHomepage />} />
      <Route path="basic-info" element={<BasicInfo />} />
      <Route path="plan" element={<Navigate to="overview" replace />} />
      <Route path="plan/:tab" element={<PlanAndOrders />} />
      <Route path="monitoring" element={<Navigate to="labor" replace />} />
      <Route path="monitoring/:tab" element={<RealTimeMonitoring />} />
      <Route path="craftsman" element={<CraftsmanManagement />} />
      <Route path="funding" element={<FundingMaterials />} />
      <Route path="toolbox/quality" element={<QualityInspection />} />
      <Route path="toolbox/daily-log" element={<DailyLog />} />
      <Route path="toolbox/qa" element={<KnowledgeQA />} />
    </>
  );
}
