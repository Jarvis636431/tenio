export interface PrecreateProjectPayload {
  name: string;
  description?: string;
  user_id?: string;
}

export interface Project {
  id: string;
  name: string;
  hasBasicInfo?: boolean;
  // 可编辑基础信息字段
  city?: string;
  buildingType?: string;
  structureType?: string;
  bidAmount?: number;
  controlPrice?: number;
  buildingHeight?: number;
  buildingFloors?: number;
  buildingArea?: number;
  status?: string;
  createdAt?: string;
  description?: string;
}

export interface PrecreateProjectResponse {
  project_id: string;
  status: string;
}

export interface UploadDocsResponse {
  uploaded_files: string[];
  parse_ids: string[];
}

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

export interface ProjectInfoRow {
  [key: string]: unknown;
}

export interface ProjectDetailResponse {
  filename: string;
  schedule: ScheduleRow[];
  project_info: ProjectInfoRow[];
  process_guid_mapping?: Record<string, Array<number | string>>;
}

export interface ProcessGuidMappingResponse {
  project_id: string;
  process_guid_mapping: Record<string, Array<number | string>>;
}

export interface ShutdownEventTime {
  day: number;
  hour: number;
}

export interface ShutdownEventConfig {
  name: string;
  start_time: ShutdownEventTime;
  end_time: ShutdownEventTime;
  reason?: string; // 兼容不同定义
  a_level_tasks?: string[];
  b_level_tasks?: string[];
  [key: string]: unknown;
}

export interface ConstructionMethodConfig {
  task_name: string;
  method_index: number;
  [key: string]: unknown;
}

export interface CompressStrategyConfig {
  target_days: number;
  add_carpenter_first: boolean;
  [key: string]: unknown;
}

export interface ProjectConfig {
  construction_methods: ConstructionMethodConfig[];
  overtime_tasks: string[];
  shutdown_events: ShutdownEventConfig[];
  work_start_hour: number;
  work_end_hour: number;
  backgrounds: string[];
  compress: CompressStrategyConfig;
  [key: string]: unknown;
}

export interface ProjectConfigResponse {
  project_id?: string;
  name?: string;
  description?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  config?: ProjectConfig; // 某些接口可能直接返回 config 对象或包含 config 属性
  shutdown_events?: ShutdownEventConfig[]; // 兼容旧接口
  [key: string]: unknown;
}

export interface ProcessInfoData {
  [key: string]: unknown;
  施工工序?: string;
  持续时间?: string;
  开始时间?: string;
  结束时间?: string;
  施工人数?: number;
  施工工种?: string;
  人工成本?: number;
  拆单名称?: string;
}

export interface OrderInfoData {
  工单内容?: string;
  详细信息?: string[] | string; // 兼容 string[] 和 string
  节点大样图?: string[] | string;
  设计交底?: string;
  安全交底?: string;
  技术验收标准?: string;
  构件?: Array<number | string>;
  视频?: string;
  [key: string]: any;
}

export interface ProcessInfoResponse {
  process_id: string;
  process_info?: ProcessInfoData;
  order_info: OrderInfoData | null;
}

export interface TimeSeriesData<T extends number | string = number> {
  name: string;
  date?: T[];
  data: number[];
  [key: string]: unknown;
}

export type CrewData = TimeSeriesData<number>;
export type BudgetData = TimeSeriesData<number>;

export interface ProjectListItem {
  project_id: string;
  project_name: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

export type ProjectListResponse = ProjectListItem[];

export interface AddProcessPayload {
  project_id: string;
  construction_process: string;
  duration: number;
  construction_method?: string;
  workers_count?: number;
  work_type?: string;
  predecessor_processes?: string;
  successor_processes?: string;
  description?: string;
}

export interface AddProcessResponse {
  status: string;
  message: string;
  file_url?: string;
  filename?: string;
  version_num?: number;
  final_days?: number;
}

export interface UploadDocsPayload {
  project_id: string;
  files: File[];
  file_type: "ifc" | "excel" | "workvolume" | string;
}
