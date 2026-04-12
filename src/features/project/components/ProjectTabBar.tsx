import type { ComponentType } from "react";
import { Boxes, CloudUpload, FileText, GitBranch, LayoutGrid, RotateCw, Users } from "lucide-react";

type ProjectTabKey =
  | "uploads"
  | "organization"
  | "schedule"
  | "overview"
  | "network"
  | "rotation"
  | "resources";

interface ProjectTabBarProps {
  activeTab: ProjectTabKey;
  onChange: (tab: ProjectTabKey) => void;
}

const TABS: Array<{
  key: ProjectTabKey;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { key: "uploads", label: "上传文件", icon: CloudUpload },
  { key: "organization", label: "施工组织", icon: FileText },
  { key: "schedule", label: "进度计划", icon: Boxes },
  { key: "overview", label: "工序总览", icon: LayoutGrid },
  { key: "network", label: "网络图", icon: GitBranch },
  { key: "rotation", label: "人员轮转", icon: RotateCw },
  { key: "resources", label: "资源配置", icon: Users },
];

export function ProjectTabBar({ activeTab, onChange }: ProjectTabBarProps) {
  return (
    <div className="apm-topline shrink-0 border border-apm bg-apm-card shadow-apm-panel">
      <div className="flex items-center gap-4 px-4">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onChange(tab.key)}
                className={`group relative shrink-0 border-b-2 px-2 py-3 text-sm transition ${
                  activeTab === tab.key
                    ? "border-cyan-300 text-slate-50"
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

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <span className="rounded-sm border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
            Workspace
          </span>
          <span className="text-xs text-slate-500">A.PM 项目工作台</span>
        </div>
      </div>
    </div>
  );
}
