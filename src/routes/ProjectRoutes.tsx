import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";

const Overview = lazy(() =>
  import("@/pages/project/Overview").then((module) => ({
    default: module.Overview,
  })),
);
const PlanPage = lazy(() =>
  import("@/pages/project/plan/PlanPage").then((module) => ({
    default: module.PlanPage,
  })),
);
const Resources = lazy(() =>
  import("@/pages/project/Resources").then((module) => ({
    default: module.Resources,
  })),
);

export function ProjectRoutes() {
  return (
    <>
      <Route index element={<Overview />} />
      <Route path="plan" element={<Navigate to="overview" replace />} />
      <Route path="plan/:tab" element={<PlanPage />} />
      <Route path="funding" element={<Resources />} />
    </>
  );
}
