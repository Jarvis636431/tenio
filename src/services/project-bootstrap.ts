import { createJiuanProject, selectSolution } from "@/services/schedulepro-service";
import type { Project } from "@/types/domain/project";

export const DEFAULT_SOLUTION_ID = 0;
export const AUTO_CREATE_PROJECT_SESSION_KEY = "auto-create-project-after-login";

function createRandomProjectName() {
  return `项目_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export function markAutoCreateProjectAfterLogin() {
  sessionStorage.setItem(AUTO_CREATE_PROJECT_SESSION_KEY, "1");
}

export function consumeAutoCreateProjectAfterLoginFlag() {
  const shouldAutoCreate = sessionStorage.getItem(AUTO_CREATE_PROJECT_SESSION_KEY) === "1";
  if (shouldAutoCreate) {
    sessionStorage.removeItem(AUTO_CREATE_PROJECT_SESSION_KEY);
  }
  return shouldAutoCreate;
}

export async function createProjectWithDefaultSolution(token: string): Promise<Project> {
  const response = await createJiuanProject({ project_name: createRandomProjectName() }, token);
  await selectSolution(response.project_id, { solution_id: DEFAULT_SOLUTION_ID }, token);

  return {
    id: response.project_id,
    name: response.project_name,
    status: response.status,
  };
}
