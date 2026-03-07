import { lazy } from "react";
import { Route } from "react-router-dom";

const Overview = lazy(() =>
  import("@/pages/project/Overview").then((module) => ({
    default: module.Overview,
  })),
);
export function ProjectRoutes() {
  return (
    <>
      <Route index element={<Overview />} />
    </>
  );
}
