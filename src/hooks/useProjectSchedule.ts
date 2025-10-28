
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProject } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { getProjectDetail, ScheduleRow } from "@/services/project-service";

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

  const scheduleItems = useMemo(() => {
    if (!query.data?.schedule) return [];
    return query.data.schedule.map(mapScheduleRow);
  }, [query.data]);

  return {
    scheduleItems,
    projectInfo: query.data?.project_info ?? [],
    filename: query.data?.filename ?? "",
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error as Error | null,
    refetch: query.refetch,
    raw: query.data,
  };
}
