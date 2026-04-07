import { useLocation, useNavigate } from "react-router-dom";
import { Building2, ChartLine, ListTodo, Network, Users } from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentProject = useProjectStore((state) => state.currentProject);
  const projects = useProjectStore((state) => state.projects);

  const handleProjectNavigate = () => {
    if (currentProject?.id) {
      navigate(`/project/${currentProject.id}`);
      return;
    }
    navigate("/", { replace: true });
  };

  const isProjectQuickLinkActive = Boolean(
    currentProject?.id && location.pathname === `/project/${currentProject.id}`,
  );

  const navItems = [
    {
      label: "项目总览",
      icon: Building2,
      active: isProjectQuickLinkActive,
      action: handleProjectNavigate,
    },
    { label: "进度计划", icon: ListTodo },
    { label: "网络分析", icon: Network },
    { label: "资源配置", icon: Users },
  ];

  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-cyan-500/15 bg-[rgba(2,12,27,0.58)] px-3 py-4 backdrop-blur-xl">
      <div className="rounded-none border border-cyan-400/20 bg-[rgba(4,18,37,0.86)] p-4">
        <div className="mt-2 text-base font-semibold text-white">
          {currentProject?.name ?? "未选择项目"}
        </div>
        <div className="mt-1 text-xs text-slate-400">当前已加载 {projects.length} 个项目</div>
        <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
          <span>工作区状态</span>
          <span className="rounded-none border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 font-semibold text-emerald-300">
            运行中
          </span>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={item.action}
              className={`flex items-center gap-3 rounded-none border px-3 py-2.5 text-left text-sm transition ${
                item.active
                  ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                  : "border-transparent bg-transparent text-slate-400 hover:border-cyan-400/15 hover:bg-cyan-400/5 hover:text-slate-100"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-auto rounded-none border border-cyan-400/15 bg-[rgba(4,18,37,0.72)] p-4">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-cyan-300">
          <ChartLine className="h-4 w-4" />
          项目状态
        </div>
        <div className="mt-3 h-1.5 bg-white/5">
          <div className="h-full w-[78%] bg-gradient-to-r from-cyan-400 to-blue-500" />
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
          <span>计划执行度</span>
          <span className="font-semibold text-cyan-200">78%</span>
        </div>
      </div>
    </aside>
  );
}
