import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProject } from "@/contexts/ProjectContext";
import { useAuth } from "@/hooks/useAuth";
import { getProjectDetail, getProcessGuidMapping, ScheduleRow } from "@/services/project-service";

export interface ProjectScheduleItem {
  id: number;
  task: string;
  workerCount: number;
  jobType: string;
  totalCost: number;
  startTime: string;
  endTime: string;
  constructionSituation: string;
  prerequisiteProcess: string;
  quantity: number;
  quantityUnit: string;
  overtime: string;
  duration: string;
  actualWorkDays: number;
  constructionMethod: string;
  directDependency: string;
  remarks: string;
  selectedConstructionMethod: string;
  materialCost: number;
  laborCost: number;
  floor: number;
  extra: ScheduleRow;
}

const mapScheduleRow = (row: ScheduleRow, index: number): ProjectScheduleItem => ({
  id: index + 1,
  task: String(row["施工工序"] ?? row["任务"] ?? `任务${index + 1}`),
  workerCount: Number(row["施工人数"] ?? 0),
  jobType: String(row["工种"] ?? ""),
  totalCost: Number(row["总成本"] ?? 0),
  startTime: String(row["开始时间"] ?? ""),
  endTime: String(row["结束时间"] ?? ""),
  constructionSituation: String(row["施工情况"] ?? ""),
  prerequisiteProcess: String(row["前置工序"] ?? ""),
  quantity: Number(row["工程量"] ?? 0),
  quantityUnit: String(row["工程量单位"] ?? ""),
  overtime: String(row["是否加班"] ?? ""),
  duration: String(row["持续时长"] ?? ""),
  actualWorkDays: Number(row["实际工作天数"] ?? 0),
  constructionMethod: String(row["施工方式"] ?? ""),
  directDependency: String(row["直接依赖任务"] ?? ""),
  remarks: String(row["备注"] ?? ""),
  selectedConstructionMethod: String(row["选定施工方式"] ?? ""),
  materialCost: Number(row["材料价格"] ?? 0),
  laborCost: Number(row["劳动力成本"] ?? 0),
  floor: Number(row["层数"] ?? 0),
  extra: row,
});

export function useProjectSchedule() {
  const { currentProject } = useProject();
  const { token } = useAuth();
  const CACHE_PREFIX = "processGuidMappingCache:";
  const CACHE_TTL = 6 * 60 * 60 * 1000;

  const readCache = (projectId: string): { ts: number; data: Record<string, Array<number | string>> } | null => {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + projectId);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.ts !== "number" || typeof parsed.data !== "object") return null;
      if (Date.now() - parsed.ts > CACHE_TTL) return null;
      return parsed as { ts: number; data: Record<string, Array<number | string>> };
    } catch {
      return null;
    }
  };

  const writeCache = (projectId: string, data: Record<string, Array<number | string>>) => {
    try {
      const payload = JSON.stringify({ ts: Date.now(), data });
      localStorage.setItem(CACHE_PREFIX + projectId, payload);
    } catch {}
  };

  const query = useQuery({
    queryKey: ["project-detail", currentProject?.id, token],
    queryFn: async () => {
      if (!currentProject?.id) {
        throw new Error("当前没有选中的项目");
      }
      return getProjectDetail(currentProject.id, token || undefined);
    },
    enabled: Boolean(currentProject?.id && token),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const cached = currentProject?.id ? readCache(currentProject.id) : null;

  const mappingQuery = useQuery({
    queryKey: ["process-guid-mapping", currentProject?.id, token],
    queryFn: async () => {
      if (!currentProject?.id) {
        throw new Error("当前没有选中的项目");
      }
      return getProcessGuidMapping(currentProject.id, token || undefined);
    },
    enabled: Boolean(currentProject?.id && token),
    staleTime: CACHE_TTL,
    gcTime: CACHE_TTL * 2,
    refetchOnWindowFocus: false,
    initialData: cached && currentProject?.id
      ? { project_id: currentProject.id, process_guid_mapping: cached.data }
      : undefined,
    initialDataUpdatedAt: cached?.ts,
    onSuccess: (data) => {
      const pid = currentProject?.id;
      const mapping = data?.process_guid_mapping ?? {};
      if (pid && mapping && typeof mapping === "object") {
        writeCache(pid, mapping as Record<string, Array<number | string>>);
      }
    },
  });

  const forceRefreshMapping = async () => {
    if (currentProject?.id) {
      try { localStorage.removeItem(CACHE_PREFIX + currentProject.id); } catch {}
    }
    return mappingQuery.refetch();
  };

  const scheduleItems = useMemo(() => {
    if (!query.data?.schedule) return [];
    return query.data.schedule.map(mapScheduleRow);
  }, [query.data]);

  return {
    scheduleItems,
    projectInfo: query.data?.project_info ?? [],
    filename: query.data?.filename ?? "",
    processGuidMapping: (mappingQuery.data?.process_guid_mapping ?? {}) as Record<string, Array<number | string>>,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error as Error | null,
    refetch: query.refetch,
    isMappingFetching: mappingQuery.isFetching,
    refetchMapping: mappingQuery.refetch,
    forceRefreshMapping,
    raw: query.data,
  };
}
