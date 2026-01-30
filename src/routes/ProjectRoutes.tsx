import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";

const Overview = lazy(() =>
  import("@/pages/project/Overview").then((module) => ({
    default: module.Overview,
  })),
);
const BasicInfo = lazy(() => import("@/pages/project/BasicInfo"));
const PlanPage = lazy(() =>
  import("@/pages/project/plan/PlanPage").then((module) => ({
    default: module.PlanPage,
  })),
);
const Monitoring = lazy(() =>
  import("@/pages/project/Monitoring").then((module) => ({
    default: module.Monitoring,
  })),
);
const Craftsmen = lazy(() =>
  import("@/pages/project/Craftsmen").then((module) => ({
    default: module.Craftsmen,
  })),
);
const Resources = lazy(() =>
  import("@/pages/project/Resources").then((module) => ({
    default: module.Resources,
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
      <Route index element={<Overview />} />
      <Route path="basic-info" element={<BasicInfo />} />
      <Route path="plan" element={<Navigate to="overview" replace />} />
      <Route path="plan/:tab" element={<PlanPage />} />
      <Route path="monitoring" element={<Navigate to="labor" replace />} />
      <Route path="monitoring/:tab" element={<Monitoring />} />
      <Route path="craftsman" element={<Craftsmen />} />
      <Route path="funding" element={<Resources />} />
      <Route path="toolbox/quality" element={<QualityInspection />} />
      <Route path="toolbox/daily-log" element={<DailyLog />} />
      <Route path="toolbox/qa" element={<KnowledgeQA />} />
    </>
  );
}
