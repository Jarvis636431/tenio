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
    <div className="shrink-0 border border-cyan-400/15 bg-[rgba(4,18,37,0.82)] px-4">
      <div className="flex items-center gap-2 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`group relative shrink-0 border-b px-1 py-3 text-sm transition ${
              activeTab === tab.key
                ? "border-cyan-300 text-slate-50"
                : "border-transparent text-slate-400 hover:border-cyan-400/30 hover:text-cyan-100"
            }`}
          >
            <span className="block font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
