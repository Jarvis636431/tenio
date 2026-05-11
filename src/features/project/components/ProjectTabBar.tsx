import { RotateCw } from "lucide-react";
import { PROJECT_TABS, type ProjectTabKey } from "../projectTabs";

interface ProjectTabBarProps {
  activeTab: ProjectTabKey;
  onChange: (tab: ProjectTabKey) => void;
  onExport?: () => void;
  canExport?: boolean;
  onRegenerate?: () => void;
}

export function ProjectTabBar({
  activeTab,
  onChange,
  onExport,
  canExport = true,
  onRegenerate,
}: ProjectTabBarProps) {
  return (
    <div className="sticky top-0 z-30 shrink-0 border-b border-cyan-400/15 bg-[rgba(2,12,27,0.94)] backdrop-blur-sm">
      <div className="flex items-center gap-0 px-5">
        <div className="flex min-w-0 flex-1 items-center overflow-x-auto">
          {PROJECT_TABS.map((tab) => {
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
            disabled={!onRegenerate}
            title={onRegenerate ? "重新生成项目产物" : "重新生成功能暂未开放"}
            className="flex items-center gap-1.5 border border-white/[0.08] bg-[rgba(4,18,37,0.7)] px-3 py-1.5 text-xs font-medium text-apm-muted transition-all hover:border-cyan-400/40 hover:text-cyan-400 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-white/[0.08] disabled:hover:bg-[rgba(4,18,37,0.7)] disabled:hover:text-apm-muted"
          >
            <RotateCw className="h-3 w-3" />
            重新生成
          </button>
          <button
            type="button"
            onClick={onExport}
            disabled={!onExport || !canExport}
            title={canExport ? "导出施工组织设计 Word 文档" : "暂无施工组织设计文档可导出"}
            className="flex items-center gap-1.5 border border-white/[0.08] bg-cyan-400 px-3 py-1.5 text-xs font-medium text-[#020c1b] transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-45"
          >
            导出全部
          </button>
        </div>
      </div>
    </div>
  );
}
