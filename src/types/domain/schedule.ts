export interface ScheduleRow {
  背景?: string;
  序号?: number | string;
  施工工序?: string;
  施工方式?: string;
  施工情况?: string;
  施工情况系数?: number[] | string;
  工期?: number | string;
  开始时间?: string;
  结束时间?: string;
  持续时长?: string;
  实际工作天数?: string | number;
  直接依赖任务?: string;
  highlight_ids?: Array<number | string>;
  [key: string]: unknown;
}
