import { http, HttpResponse } from "msw";
import {
  createProject,
  getProjectCostCurve,
  getProjectGraph,
  getProjectHeadcountCurve,
  listProjects,
  selectProjectSolution,
} from "./apmMockStore";

export const handlers = [
  http.get("*/api/v1/projects", () => {
    return HttpResponse.json(listProjects());
  }),

  http.post("*/api/v1/projects/jiuan", async ({ request }) => {
    const payload = (await request.json()) as { project_name?: string };
    const response = createProject(payload.project_name?.trim() || "新建项目");
    return HttpResponse.json(response, { status: 201 });
  }),

  http.post("*/api/v1/projects/:projectId/solutions", async ({ params, request }) => {
    const payload = (await request.json()) as { solution_id?: number };
    const solution = selectProjectSolution(String(params.projectId), payload.solution_id ?? 0);
    return HttpResponse.json(solution);
  }),

  http.get("*/api/v1/projects/:projectId/graph", ({ params }) => {
    return HttpResponse.json(getProjectGraph(String(params.projectId)));
  }),

  http.get("*/api/v1/projects/:projectId/cost-curve", ({ params }) => {
    return HttpResponse.json(getProjectCostCurve(String(params.projectId)));
  }),

  http.get("*/api/v1/projects/:projectId/headcount-curve", ({ params }) => {
    return HttpResponse.json(getProjectHeadcountCurve(String(params.projectId)));
  }),
];
