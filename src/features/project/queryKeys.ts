export const projectQueryKeys = {
  list: ["projects"] as const,
  scheduleArtifact: (projectId: string) => ["project", "artifact", "schedule", projectId] as const,
  timeCostArtifact: (projectId: string) => ["project", "artifact", "time-cost", projectId] as const,
};
