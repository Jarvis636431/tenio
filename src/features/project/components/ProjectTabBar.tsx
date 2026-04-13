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
import { Button } from "@/components/ui/button";

type ProjectTabKey =
  | "timeCost"
  | "uploads"
  | "organization"
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
  { key: "timeCost", label: "工期-成本分析", icon: BarChart3 },
  { key: "uploads", label: "上传文件", icon: CloudUpload },
  { key: "organization", label: "施工组织设计", icon: FileText },
  { key: "scheduleList", label: "进度计划列表", icon: List },
  { key: "gantt", label: "甘特图", icon: LayoutGrid },
  { key: "network", label: "网络图", icon: GitBranch },
  { key: "rotation", label: "人员轮转", icon: RotateCw },
];

export function ProjectTabBar({ activeTab, onChange, onExport, onRegenerate }: ProjectTabBarProps) {
  return (
    <div className="shrink-0 border border-apm bg-apm-card shadow-apm-panel">
      <div className="flex items-center gap-2 px-3 lg:gap-4 lg:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-0 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onChange(tab.key)}
                className={`group relative shrink-0 border-b-2 px-2 py-3 text-xs transition lg:px-3 lg:text-sm ${
                  isActive
                    ? "border-cyan-300 text-slate-50"
                    : "border-transparent text-slate-400 hover:border-cyan-400/30 hover:text-cyan-100"
                }`}
              >
                <span className="flex items-center gap-1.5 font-medium lg:gap-2">
                  <Icon className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 rounded-sm border-cyan-400/20 bg-transparent px-3 text-xs text-cyan-100 transition hover:border-cyan-300/35 hover:bg-cyan-400/10"
            onClick={onRegenerate}
          >
            重新生成
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 rounded-sm border border-cyan-400/20 bg-[linear-gradient(135deg,hsl(var(--apm-accent)),hsl(var(--apm-accent-strong)))] px-3 text-xs font-medium text-[#020c1b] transition hover:opacity-90"
            onClick={onExport}
          >
            导出全部
          </Button>
        </div>
      </div>
    </div>
  );
}
