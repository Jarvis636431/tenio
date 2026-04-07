import { useProjectStore } from "@/stores/projectStore";
import { useTime } from "@/hooks/useTime";

export function AppTopbar() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const projectCount = useProjectStore((state) => state.projects.length);
  const { dateText, timeText } = useTime();

  return (
    <header className="relative z-20 flex h-14 shrink-0 items-center gap-4 border-b border-cyan-500/15 bg-[rgba(2,12,27,0.94)] px-6 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <img src="/logo.svg" alt="天友" className="h-7 w-7 object-contain" />
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tracking-[-0.02em] text-white">
            A.PM <span className="text-cyan-300">智慧建管</span>
          </span>
          <span className="h-4 w-px bg-cyan-400/20" />
          <span className="text-[11px] font-medium uppercase tracking-[0.24em] text-cyan-200/65">
            Project Workspace
          </span>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-3 text-xs text-slate-300">
        <span className="truncate text-cyan-50">{currentProject?.name ?? "未选择项目"}</span>
        <span className="text-cyan-500/30">|</span>
        <span className="text-slate-400">{dateText}</span>
        <span className="font-semibold text-cyan-300">{timeText}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden rounded-sm border border-cyan-400/20 bg-cyan-400/8 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300 md:inline-flex">
          {projectCount} Projects
        </span>
      </div>
    </header>
  );
}
