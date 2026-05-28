import type { GenerationStepDefinition } from "./generation.types.js";

export const GENERATION_STEPS: GenerationStepDefinition[] = [
  { stepCode: "parse_files", stepName: "解析上传文件", stepOrder: 1 },
  { stepCode: "extract_project_info", stepName: "提取项目计划", stepOrder: 2 },
  { stepCode: "generate_schedule", stepName: "生成进度计划", stepOrder: 3 },
  { stepCode: "generate_document", stepName: "生成施工方案", stepOrder: 4 },
  { stepCode: "generate_time_cost", stepName: "生成工期成本分析", stepOrder: 5 },
  { stepCode: "generate_crew_plan", stepName: "生成人员轮转计划", stepOrder: 6 },
  { stepCode: "sync_artifacts", stepName: "同步工作台成果", stepOrder: 7 },
];
