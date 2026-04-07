type ProjectTabKey = "overview" | "schedule" | "network" | "resources";

interface ProjectTabBarProps {
  activeTab: ProjectTabKey;
  onChange: (tab: ProjectTabKey) => void;
}

const TABS: Array<{ key: ProjectTabKey; label: string }> = [
  { key: "overview", label: "总览" },
  { key: "schedule", label: "进度计划" },
  { key: "network", label: "网络分析" },
  { key: "resources", label: "资源配置" },
];

export function ProjectTabBar({ activeTab, onChange }: ProjectTabBarProps) {
  return (
    <div className="shrink-0 border border-cyan-400/15 bg-[rgba(4,18,37,0.72)] px-3">
      <div className="flex items-center gap-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition ${
              activeTab === tab.key
                ? "border-cyan-300 text-cyan-200"
                : "border-transparent text-slate-400 hover:text-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
