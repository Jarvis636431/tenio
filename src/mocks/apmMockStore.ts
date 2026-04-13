import type {
  CreateJiuanProjectResponse,
  CoreGraphDependency,
  CoreGraphResponse,
  CoreGraphWorkProcess,
  CostCurveResponse,
  HeadcountCurveResponse,
  SelectSolutionResponse,
} from "@/types/domain/schedulepro";
import type {
  FileCategory,
  FileListParams,
  FileListResponse,
  FileStatsResponse,
  FileUpdatePayload,
} from "@/features/upload";
import type { ProjectListItem, ProjectListResponse } from "@/features/project";
import type { ProjectFile } from "@/features/upload";

interface MockProjectRecord {
  project: ProjectListItem;
  graph: CoreGraphResponse;
  costCurve: CostCurveResponse;
  headcountCurve: HeadcountCurveResponse;
}

const nowIso = () => new Date().toISOString();

function createWorkProcess(
  projectId: string,
  seqNo: number,
  code: string,
  name: string,
  start: string,
  end: string,
  durationDays: number,
  tradeName: string,
  teamSize: number,
  baseCost: { labor: number; material: number; device: number },
  critical = false,
): CoreGraphWorkProcess {
  return {
    id: `${projectId}-wp-${seqNo}`,
    project_id: projectId,
    seq_no: seqNo,
    code,
    name,
    quantity: 1,
    unit: "项",
    duration_days: durationDays,
    team_size: teamSize,
    labor_cost: baseCost.labor,
    material_cost: baseCost.material,
    device_rental_cost: baseCost.device,
    trade: { id: seqNo, name: tradeName, code: tradeName.toUpperCase() },
    selected_method: { id: seqNo, name: "常规施工", code: "NORMAL" },
    execution_state: {
      id: `${projectId}-exec-${seqNo}`,
      work_process_id: `${projectId}-wp-${seqNo}`,
      status: critical ? "关键工序" : "计划中",
      planned_start_datetime: start,
      planned_end_datetime: end,
      progress_percent: critical ? 55 : 35,
      critical_path: critical,
      planned_intervals: [
        {
          id: `${projectId}-interval-${seqNo}`,
          execution_state_id: `${projectId}-exec-${seqNo}`,
          start_datetime: start,
          end_datetime: end,
          seq_no: 1,
        },
      ],
    },
  };
}

function createDependencies(projectId: string, count: number): CoreGraphDependency[] {
  return Array.from({ length: Math.max(0, count - 1) }, (_, index) => ({
    id: `${projectId}-dep-${index + 1}`,
    project_id: projectId,
    from_work_process_id: `${projectId}-wp-${index + 1}`,
    to_work_process_id: `${projectId}-wp-${index + 2}`,
    dependency_type: "FS",
    lag_days: 0,
  }));
}

function createGraph(projectId: string, baseDate: string): CoreGraphResponse {
  const start = new Date(baseDate);
  const day = 24 * 60 * 60 * 1000;
  const points = [
    {
      code: "A",
      name: "施工准备",
      days: 4,
      trade: "管理班组",
      team: 6,
      labor: 8000,
      material: 3000,
      device: 1000,
      critical: true,
    },
    {
      code: "B",
      name: "基础工程",
      days: 8,
      trade: "土建班组",
      team: 14,
      labor: 18000,
      material: 24000,
      device: 6000,
      critical: true,
    },
    {
      code: "C",
      name: "主体结构",
      days: 12,
      trade: "结构班组",
      team: 18,
      labor: 28000,
      material: 52000,
      device: 10000,
      critical: true,
    },
    {
      code: "D",
      name: "机电安装",
      days: 10,
      trade: "机电班组",
      team: 12,
      labor: 22000,
      material: 18000,
      device: 8000,
      critical: false,
    },
    {
      code: "E",
      name: "装饰装修",
      days: 9,
      trade: "装修班组",
      team: 10,
      labor: 20000,
      material: 34000,
      device: 4000,
      critical: false,
    },
    {
      code: "F",
      name: "竣工验收",
      days: 3,
      trade: "综合班组",
      team: 5,
      labor: 6000,
      material: 2000,
      device: 1000,
      critical: true,
    },
  ];

  let offset = 0;
  const workProcesses = points.map((point, index) => {
    const startDate = new Date(start.getTime() + offset * day).toISOString();
    offset += point.days;
    const endDate = new Date(start.getTime() + offset * day).toISOString();
    return createWorkProcess(
      projectId,
      index + 1,
      point.code,
      point.name,
      startDate,
      endDate,
      point.days,
      point.trade,
      point.team,
      { labor: point.labor, material: point.material, device: point.device },
      point.critical,
    );
  });

  return {
    project_id: projectId,
    work_processes: workProcesses,
    dependencies: createDependencies(projectId, workProcesses.length),
    team_assignments: [],
    resource_estimations: [],
    device_resources: [],
    work_process_device_resources: [],
    version: 1,
    updated_at: nowIso(),
  };
}

function createCostCurve(projectId: string, startDate: string): CostCurveResponse {
  const dates = Array.from({ length: 8 }, (_, index) => {
    const date = new Date(new Date(startDate).getTime() + index * 7 * 24 * 60 * 60 * 1000);
    return date.toISOString().slice(0, 10);
  });
  const totalCosts = dates.map((_, index) => 12_000 + index * 18_500);
  return {
    project_id: projectId,
    days: dates.map((_, index) => index + 1),
    dates,
    total_costs: totalCosts,
    material_costs: totalCosts.map((value) => Math.round(value * 0.48)),
    floating_costs: totalCosts.map((value) => Math.round(value * 0.16)),
    generated_at: nowIso(),
  };
}

function createHeadcountCurve(projectId: string, startDate: string): HeadcountCurveResponse {
  const dates = Array.from({ length: 8 }, (_, index) => {
    const date = new Date(new Date(startDate).getTime() + index * 7 * 24 * 60 * 60 * 1000);
    return date.toISOString().slice(0, 10);
  });
  return {
    project_id: projectId,
    days: dates.map((_, index) => index + 1),
    dates,
    headcounts: [6, 12, 18, 24, 22, 16, 11, 6],
    generated_at: nowIso(),
  };
}

function createProjectRecord(project: ProjectListItem, startDate: string): MockProjectRecord {
  return {
    project,
    graph: createGraph(project.project_id, startDate),
    costCurve: createCostCurve(project.project_id, startDate),
    headcountCurve: createHeadcountCurve(project.project_id, startDate),
  };
}

const mockProjects: MockProjectRecord[] = [
  createProjectRecord(
    {
      project_id: "project-001",
      project_name: "孙园镇中洼居党群服务中心办公楼",
      description: "泗洪县 · 建筑工程施工 · 354㎡",
      status: "active",
      created_at: "2026-04-07T09:00:00.000Z",
    },
    "2026-04-08T08:00:00.000Z",
  ),
  createProjectRecord(
    {
      project_id: "project-002",
      project_name: "九安医疗天津生产基地二期",
      description: "天津市 · 工业厂房 · 28,500㎡",
      status: "completed",
      created_at: "2026-03-22T09:00:00.000Z",
    },
    "2026-03-22T08:00:00.000Z",
  ),
  createProjectRecord(
    {
      project_id: "project-003",
      project_name: "绿城·春风明月 3# 住宅楼",
      description: "杭州市 · 住宅工程 · 12,800㎡",
      status: "pending",
      created_at: "2026-04-09T09:00:00.000Z",
    },
    "2026-04-10T08:00:00.000Z",
  ),
];

const mockFiles: ProjectFile[] = [
  {
    id: "file-001",
    projectId: "project-001",
    name: "建筑平面图_v1.pdf",
    originalName: "建筑平面图.pdf",
    size: 2_500_000,
    type: "application/pdf",
    category: "drawing",
    url: "/mock/drawing1.pdf",
    thumbnailUrl: "/mock/drawing1-thumb.jpg",
    description: "主楼建筑平面图",
    uploadedBy: "张三",
    uploadedAt: "2026-04-08T10:30:00.000Z",
    status: "completed",
    version: 1,
    tags: ["建筑", "平面图"],
  },
  {
    id: "file-002",
    projectId: "project-001",
    name: "结构设计说明.docx",
    originalName: "结构设计说明.docx",
    size: 1_200_000,
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    category: "document",
    url: "/mock/doc1.docx",
    description: "结构设计说明文档",
    uploadedBy: "李四",
    uploadedAt: "2026-04-08T14:20:00.000Z",
    status: "completed",
    tags: ["结构", "设计"],
  },
  {
    id: "file-003",
    projectId: "project-001",
    name: "施工现场照片_001.jpg",
    originalName: "IMG_20260410_143052.jpg",
    size: 3_800_000,
    type: "image/jpeg",
    category: "photo",
    url: "/mock/photo1.jpg",
    thumbnailUrl: "/mock/photo1-thumb.jpg",
    description: "基础施工进度照片",
    uploadedBy: "王五",
    uploadedAt: "2026-04-10T14:30:52.000Z",
    status: "completed",
    tags: ["施工", "进度"],
  },
  {
    id: "file-004",
    projectId: "project-001",
    name: "施工合同.pdf",
    originalName: "施工合同.pdf",
    size: 5_600_000,
    type: "application/pdf",
    category: "contract",
    url: "/mock/contract1.pdf",
    description: "主体施工合同",
    uploadedBy: "张三",
    uploadedAt: "2026-04-01T09:00:00.000Z",
    status: "completed",
    tags: ["合同", "重要"],
  },
  {
    id: "file-005",
    projectId: "project-001",
    name: "BIM模型_v2.ifc",
    originalName: "building_model.ifc",
    size: 25_000_000,
    type: "application/x-step",
    category: "bim",
    url: "/mock/model.ifc",
    description: "建筑BIM模型",
    uploadedBy: "李四",
    uploadedAt: "2026-04-11T11:15:00.000Z",
    status: "completed",
    version: 2,
    parentId: "file-005-v1",
    tags: ["BIM", "模型"],
  },
  {
    id: "file-006",
    projectId: "project-002",
    name: "项目竣工资料.pdf",
    originalName: "项目竣工资料.pdf",
    size: 7_200_000,
    type: "application/pdf",
    category: "document",
    url: "/mock/closeout.pdf",
    description: "竣工归档资料",
    uploadedBy: "赵六",
    uploadedAt: "2026-03-20T15:00:00.000Z",
    status: "completed",
    tags: ["竣工", "资料"],
  },
];

function generateProjectId() {
  return `project-${Date.now()}`;
}

function generateFileId() {
  return `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function getProjectRecord(projectId: string) {
  return mockProjects.find((item) => item.project.project_id === projectId);
}

export function listProjects(): ProjectListResponse {
  return mockProjects.map((item) => ({ ...item.project }));
}

export function createProject(projectName: string): CreateJiuanProjectResponse {
  const projectId = generateProjectId();
  const project: ProjectListItem = {
    project_id: projectId,
    project_name: projectName,
    description: "新建项目 · 待补充资料",
    status: "pending",
    created_at: nowIso(),
  };
  const record = createProjectRecord(project, nowIso());
  mockProjects.unshift(record);
  return {
    project_id: projectId,
    project_name: projectName,
    status: "created",
    work_process_count: record.graph.work_processes.length,
    dependency_count: record.graph.dependencies.length,
  };
}

export function selectProjectSolution(
  projectId: string,
  solutionId: number,
): SelectSolutionResponse {
  const record = getProjectRecord(projectId);
  if (!record) {
    throw new Error("项目不存在");
  }
  record.project.status = "active";
  const dates = record.costCurve.dates;
  const start = dates[0] ?? nowIso().slice(0, 10);
  const finish = dates.at(-1) ?? start;
  return {
    project_id: projectId,
    task_id: `solution-${projectId}`,
    solution_id: solutionId,
    total_duration_hours: record.graph.work_processes.reduce(
      (total, item) => total + (item.duration_days ?? 0) * 8,
      0,
    ),
    start_date: start,
    finish_date: finish,
    matched_tasks: record.graph.work_processes.length,
    skipped_tasks: 0,
    holidays: [],
    daily_schedule: Object.fromEntries(
      dates.map((date, index) => [
        date,
        record.graph.work_processes
          .slice(0, Math.min(index + 1, record.graph.work_processes.length))
          .map((item) => item.name || item.code || item.id),
      ]),
    ),
    cost_curve: dates.map((date, index) => ({
      date,
      total_cost: record.costCurve.total_costs[index] ?? 0,
      material_cost: record.costCurve.material_costs?.[index] ?? 0,
      floating_cost: record.costCurve.floating_costs?.[index] ?? 0,
    })),
    headcount_curve: dates.map((date, index) => ({
      date,
      headcount: record.headcountCurve.headcounts[index] ?? 0,
    })),
  };
}

export function getProjectGraph(projectId: string): CoreGraphResponse {
  const record = getProjectRecord(projectId);
  if (!record) {
    throw new Error("项目不存在");
  }
  return structuredClone(record.graph);
}

export function getProjectCostCurve(projectId: string): CostCurveResponse {
  const record = getProjectRecord(projectId);
  if (!record) {
    throw new Error("项目不存在");
  }
  return structuredClone(record.costCurve);
}

export function getProjectHeadcountCurve(projectId: string): HeadcountCurveResponse {
  const record = getProjectRecord(projectId);
  if (!record) {
    throw new Error("项目不存在");
  }
  return structuredClone(record.headcountCurve);
}

export function getMockFileList(params: FileListParams): FileListResponse {
  let list = mockFiles.filter((file) => file.projectId === params.projectId);

  if (params.category) {
    list = list.filter((file) => file.category === params.category);
  }

  if (params.keyword) {
    const keyword = params.keyword.toLowerCase();
    list = list.filter(
      (file) =>
        file.name.toLowerCase().includes(keyword) ||
        file.description?.toLowerCase().includes(keyword) ||
        file.tags?.some((tag) => tag.toLowerCase().includes(keyword)),
    );
  }

  const total = list.length;
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    list: list.slice(start, end).map((item) => ({ ...item })),
    total,
    page,
    pageSize,
  };
}

export function addMockFile(
  projectId: string,
  payload: { file: File; category: FileCategory; description?: string; tags?: string[] },
) {
  const fileId = generateFileId();
  const nextFile: ProjectFile = {
    id: fileId,
    projectId,
    name: payload.file.name,
    originalName: payload.file.name,
    size: payload.file.size,
    type: payload.file.type || "application/octet-stream",
    category: payload.category,
    url: `/mock/${fileId}`,
    description: payload.description,
    uploadedBy: "当前用户",
    uploadedAt: nowIso(),
    status: "completed",
    tags: payload.tags ?? [],
  };
  mockFiles.unshift(nextFile);
  return { ...nextFile };
}

export function deleteMockFile(projectId: string, fileId: string) {
  const index = mockFiles.findIndex((file) => file.projectId === projectId && file.id === fileId);
  if (index >= 0) {
    mockFiles.splice(index, 1);
  }
}

export function updateMockFile(payload: FileUpdatePayload): ProjectFile {
  const file = mockFiles.find((item) => item.id === payload.fileId);
  if (!file) {
    throw new Error("文件不存在");
  }

  file.name = payload.name ?? file.name;
  file.description = payload.description ?? file.description;
  file.category = payload.category ?? file.category;
  file.tags = payload.tags ?? file.tags;

  return { ...file };
}

export function getMockFileStats(projectId: string): FileStatsResponse {
  const files = mockFiles.filter((file) => file.projectId === projectId);
  const categoryMap = new Map<FileCategory, { count: number; totalSize: number }>();

  for (const file of files) {
    const current = categoryMap.get(file.category) ?? { count: 0, totalSize: 0 };
    current.count += 1;
    current.totalSize += file.size;
    categoryMap.set(file.category, current);
  }

  return {
    totalFiles: files.length,
    totalSize: files.reduce((sum, file) => sum + file.size, 0),
    categories: Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      ...data,
    })),
  };
}
