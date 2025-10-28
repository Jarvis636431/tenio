import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProject } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { getProjectDetail, ScheduleRow } from "@/services/project-service";

export interface ProjectScheduleItem {
  id: number;
  task: string;
  specialty: string;
  component: string;
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

const toString = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, "");
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const selectFirstString = (row: ScheduleRow, keys: string[]): string => {
  for (const key of keys) {
    const candidate = row[key];
    if (candidate !== undefined && candidate !== null) {
      const value = toString(candidate);
      if (value) return value;
    }
  }
  return "";
};

const selectFirstNumber = (row: ScheduleRow, keys: string[]): number => {
  for (const key of keys) {
    const candidate = row[key];
    const value = toNumber(candidate);
    if (value !== 0) return value;
  }
  return 0;
};

const normalizeSchedule = (schedule: ScheduleRow[]): ProjectScheduleItem[] => {
  return schedule.map((row, index) => {
    const taskName =
      selectFirstString(row, [
        "施工工序",
        "任务",
        "工序名称",
        "工序",
        "作业内容",
      ]) || `任务${index + 1}`;

    const startTime = selectFirstString(row, [
      "开始时间",
      "计划开始时间",
      "开工时间",
      "start_time",
    ]);

    const endTime = selectFirstString(row, [
      "结束时间",
      "计划结束时间",
      "完工时间",
      "end_time",
    ]);

    const constructionMethod = selectFirstString(row, [
      "施工方式",
      "施工方法",
      "施工手段",
    ]);

    const jobType = selectFirstString(row, [
      "施工工种",
      "工种",
      "岗位",
    ]);

    const workerCount = selectFirstNumber(row, [
      "施工人数",
      "人数",
      "工人人数",
    ]);

    const duration = selectFirstString(row, [
      "持续时长",
      "持续时间",
      "工期",
    ]);

    const actualWorkDays = selectFirstNumber(row, [
      "实际工作天数",
      "工期",
      "持续天数",
    ]);

    const materialCost = selectFirstNumber(row, [
      "材料费用",
      "材料价格",
      "材料成本",
    ]);

    const laborCost = selectFirstNumber(row, [
      "劳动力成本",
      "人工成本",
      "劳务费",
    ]);

    const totalCost = selectFirstNumber(row, [
      "总成本",
      "费用合计",
      "成本",
      "造价",
    ]);

    const floor = selectFirstNumber(row, ["层数", "楼层", "floor"]);

    return {
      id: index + 1,
      task: taskName,
      specialty: selectFirstString(row, ["所属专业", "专业", "专业类别"]),
      component: selectFirstString(row, ["构件", "部位", "构件名称"]),
      workerCount,
      jobType,
      totalCost,
      startTime,
      endTime,
      constructionSituation: selectFirstString(row, ["施工情况", "场景说明"]),
      prerequisiteProcess: selectFirstString(row, ["前置工序", "前序工序"]),
      quantity: selectFirstNumber(row, ["工程量", "数量"]),
      quantityUnit: selectFirstString(row, ["工程量单位", "单位"]),
      overtime: selectFirstString(row, ["是否加班", "加班情况"]),
      duration,
      actualWorkDays,
      constructionMethod,
      directDependency: selectFirstString(row, ["直接依赖任务", "依赖任务"]),
      remarks: selectFirstString(row, ["备注", "补充说明"]),
      selectedConstructionMethod:
        selectFirstString(row, ["选定施工方式"]) || constructionMethod,
      materialCost,
      laborCost,
      floor,
      extra: row,
    };
  });
};

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
    return normalizeSchedule(query.data.schedule);
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
