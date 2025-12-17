import { useQuery } from "@tanstack/react-query";
import { useProject } from "@/hooks/useProject";
import { useAuth } from "@/hooks/useAuth";
import { getProjectConfig, ProjectConfigResponse } from "@/services/project-service";

export function useProjectConfig() {
  const { currentProject } = useProject();
  const { token } = useAuth();

  const query = useQuery<ProjectConfigResponse, Error>({
    queryKey: ["project-config", currentProject?.id, token],
    queryFn: async () => {
      if (!currentProject?.id) {
        throw new Error("当前没有选中的项目");
      }
      return getProjectConfig(currentProject.id, token || undefined);
    },
    enabled: Boolean(currentProject?.id && token),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    config: query.data?.config,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ?? null,
    refetch: query.refetch,
    raw: query.data,
  };
}