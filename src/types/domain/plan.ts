import type { ScheduleRow } from "./schedule";

export type TimelineScale = "day" | "hour" | "week" | "month";

export interface PlanTask {
  id: string;
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
  duration: string;
  actualWorkDays: number;
  constructionMethod: string;
  selectedConstructionMethod: string;
  materialCost: number;
  laborCost: number;
  extra?: ScheduleRow;

  // 兼容性别名 (GanttChart 组件使用)
  worker?: string; // 映射到 jobType
  count?: number; // 映射到 workerCount
  startDate?: string; // 映射到 startTime
  endDate?: string; // 映射到 endTime

  // 扩展字段
  specialty?: string;
  component?: string;
  criticalPath?: boolean;
  seqNo?: number;
}
