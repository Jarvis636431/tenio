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

type ProjectTabKey =
  | "chart"
  | "uploads"
  | "docs"
  | "scheduleList"
  | "gantt"
  | "network"
  | "rotation";

interface ProjectTabBarProps {
  activeTab: ProjectTabKey;
  onChange: (tab: ProjectTabKey) => void;
  onExport?: () => void;
  onRegenerate?: () => void;
}

const TABS: Array<{
  key: ProjectTabKey;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { key: "chart", label: "工期-成本分析", icon: BarChart3 },
  { key: "uploads", label: "上传文件", icon: CloudUpload },
  { key: "docs", label: "施工组织设计", icon: FileText },
  { key: "scheduleList", label: "进度计划列表", icon: List },
  { key: "gantt", label: "甘特图", icon: LayoutGrid },
  { key: "network", label: "网络图", icon: GitBranch },
  { key: "rotation", label: "人员轮转", icon: RotateCw },
];

export function ProjectTabBar({ activeTab, onChange, onExport, onRegenerate }: ProjectTabBarProps) {
  return (
    <div className="shrink-0 border-b border-cyan-400/15 bg-[rgba(2,12,27,0.5)]">
      <div className="flex items-center gap-0 px-5">
        <div className="flex min-w-0 flex-1 items-center overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onChange(tab.key)}
                className={`group relative shrink-0 border-b-2 px-4 py-3 text-sm transition ${
                  isActive
                    ? "border-cyan-400 text-cyan-400"
                    : "border-transparent text-slate-400 hover:border-cyan-400/30 hover:text-cyan-100"
                }`}
              >
                <span className="flex items-center gap-2 font-medium">
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onRegenerate}
            className="flex items-center gap-1.5 rounded-sm border border-cyan-400/18 bg-transparent px-3 py-1.5 text-xs font-medium text-apm-muted transition-all hover:border-cyan-400 hover:text-cyan-400 hover:bg-cyan-400/10"
          >
            <RotateCw className="h-3 w-3" />
            重新生成
          </button>
          <button
            type="button"
            onClick={onExport}
            className="flex items-center gap-1.5 rounded-sm border border-cyan-400 bg-cyan-400 px-3 py-1.5 text-xs font-medium text-[#020c1b] transition hover:opacity-85"
          >
            导出全部
          </button>
        </div>
      </div>
    </div>
  );
}
