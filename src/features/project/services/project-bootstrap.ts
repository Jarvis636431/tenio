import { createJiuanProject, selectSolution } from "./schedulepro-service";
import type { Project } from "../types";

export const DEFAULT_SOLUTION_ID = 0;

function createRandomProjectName() {
  return `项目_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export async function createProjectWithDefaultSolution(): Promise<Project> {
  const response = await createJiuanProject({ project_name: createRandomProjectName() });
  await selectSolution(response.project_id, { solution_id: DEFAULT_SOLUTION_ID });

  return {
    id: response.project_id,
    name: response.project_name,
    status: response.status,
  };
}
