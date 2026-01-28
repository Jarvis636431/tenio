import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";

const ProjectHomePage = lazy(() =>
  import("@/pages/project/ProjectHomePage").then((module) => ({
    default: module.ProjectHomePage,
  })),
);
const BasicInfo = lazy(() => import("@/pages/project/BasicInfo"));
const PlanPage = lazy(() =>
  import("@/pages/project/plan/PlanPage").then((module) => ({
    default: module.PlanPage,
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
  import("@/pages/project/toolbox/QualityInspection").then((module) => ({
    default: module.QualityInspection,
  })),
);
const DailyLog = lazy(() =>
  import("@/pages/project/toolbox/DailyLog").then((module) => ({
    default: module.DailyLog,
  })),
);
const KnowledgeQA = lazy(() =>
  import("@/pages/project/toolbox/KnowledgeQA").then((module) => ({
    default: module.KnowledgeQA,
  })),
);

export function ProjectRoutes() {
  return (
    <>
      <Route index element={<ProjectHomePage />} />
      <Route path="basic-info" element={<BasicInfo />} />
      <Route path="plan" element={<Navigate to="overview" replace />} />
      <Route path="plan/:tab" element={<PlanPage />} />
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
