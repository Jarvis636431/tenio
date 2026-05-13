import type { ComponentType } from "react";
import {
  BarChart3,
  CloudUpload,
  FileText,
  GitBranch,
  LayoutGrid,
  List,
  RotateCw,
} from "lucide-react";

export type ProjectTabKey =
  | "chart"
  | "uploads"
  | "docs"
  | "scheduleList"
  | "gantt"
  | "network"
  | "rotation";

export interface ProjectTabItem {
  key: ProjectTabKey;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export const PROJECT_TABS: ProjectTabItem[] = [
  { key: "chart", label: "工期-成本分析", icon: BarChart3 },
  { key: "uploads", label: "上传文件", icon: CloudUpload },
  { key: "docs", label: "施工组织设计", icon: FileText },
  { key: "scheduleList", label: "进度计划列表", icon: List },
  { key: "gantt", label: "甘特图", icon: LayoutGrid },
  { key: "network", label: "网络图", icon: GitBranch },
  { key: "rotation", label: "人员轮转", icon: RotateCw },
];
