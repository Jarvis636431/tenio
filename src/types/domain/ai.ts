export interface AgentInitPayload {
  project_id: string;
  base_date: string;
  solution_id: number;
  access_token: string;
  base_url?: string;
}

export interface AgentInitResponse {
  message?: string;
  [key: string]: unknown;
}
