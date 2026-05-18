export type AgentReadIntentType =
  | "get_project_context"
  | "list_project_files"
  | "get_document_artifact"
  | "get_graph_artifact"
  | "get_time_cost_artifact"
  | "get_crew_plan_artifact"
  | "get_latest_artifacts";

export type AgentWriteIntentType =
  | "update_project_name"
  | "activate_project"
  | "delete_project_file"
  | "archive_project";

export type AgentIntentType = AgentReadIntentType | AgentWriteIntentType;

interface AgentIntentBase {
  intentType: AgentIntentType;
  rawText: string;
}

export interface GetProjectContextIntent extends AgentIntentBase {
  intentType: "get_project_context";
}

export interface ListProjectFilesIntent extends AgentIntentBase {
  intentType: "list_project_files";
}

export interface GetDocumentArtifactIntent extends AgentIntentBase {
  intentType: "get_document_artifact";
}

export interface GetGraphArtifactIntent extends AgentIntentBase {
  intentType: "get_graph_artifact";
}

export interface GetTimeCostArtifactIntent extends AgentIntentBase {
  intentType: "get_time_cost_artifact";
}

export interface GetCrewPlanArtifactIntent extends AgentIntentBase {
  intentType: "get_crew_plan_artifact";
}

export interface GetLatestArtifactsIntent extends AgentIntentBase {
  intentType: "get_latest_artifacts";
}

export interface UpdateProjectNameIntent extends AgentIntentBase {
  intentType: "update_project_name";
  projectName: string;
}

export interface ActivateProjectIntent extends AgentIntentBase {
  intentType: "activate_project";
}

export interface DeleteProjectFileIntent extends AgentIntentBase {
  intentType: "delete_project_file";
  fileName: string;
}

export interface ArchiveProjectIntent extends AgentIntentBase {
  intentType: "archive_project";
}

export type AgentIntent =
  | GetProjectContextIntent
  | ListProjectFilesIntent
  | GetDocumentArtifactIntent
  | GetGraphArtifactIntent
  | GetTimeCostArtifactIntent
  | GetCrewPlanArtifactIntent
  | GetLatestArtifactsIntent
  | UpdateProjectNameIntent
  | ActivateProjectIntent
  | DeleteProjectFileIntent
  | ArchiveProjectIntent;
