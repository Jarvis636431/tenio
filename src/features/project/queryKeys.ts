export const projectQueryKeys = {
  list: ["projects"] as const,
  coreGraph: (projectId: string) => ["project", "core-graph", projectId] as const,
  costCurve: (projectId: string) => ["overview", "cost-curve", projectId] as const,
  headcountCurve: (projectId: string) => ["overview", "headcount-curve", projectId] as const,
};
