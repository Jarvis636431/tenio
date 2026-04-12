import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  Building2,
  CirclePlus,
  Clock3,
  FolderKanban,
  HardHat,
  Loader2,
  PlayCircle,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createJiuanProject, selectSolution, useProject, type Project } from "@/features/project";

const DEFAULT_SOLUTION_ID = 0;

type ProjectFilter = "all" | "active" | "completed" | "pending";

const FILTER_LABELS: Record<ProjectFilter, string> = {
  all: "全部项目",
  active: "进行中",
  completed: "已完成",
  pending: "待启动",
};

function normalizeStatus(status?: string): ProjectFilter {
  const value = status?.trim().toLowerCase() ?? "";
  if (
    value.includes("完成") ||
    value.includes("done") ||
    value.includes("completed") ||
    value.includes("success")
  ) {
    return "completed";
  }
  if (
    value.includes("待") ||
    value.includes("pending") ||
    value.includes("draft") ||
    value.includes("new")
  ) {
    return "pending";
  }
  return "active";
}

function getStatusLabel(status: ProjectFilter) {
  return FILTER_LABELS[status];
}

function getStatusClass(status: ProjectFilter) {
  if (status === "completed") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-200";
  }
  if (status === "pending") {
    return "border-amber-400/20 bg-amber-500/10 text-amber-200";
  }
  return "border-cyan-400/20 bg-cyan-500/10 text-cyan-200";
}

function formatDate(dateString?: string) {
  if (!dateString) {
    return "未记录";
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getProjectAccent(index: number) {
  const accents = [
    "text-cyan-200 border-cyan-400/20 bg-cyan-500/10",
    "text-emerald-200 border-emerald-400/20 bg-emerald-500/10",
    "text-violet-200 border-violet-400/20 bg-violet-500/10",
    "text-amber-200 border-amber-400/20 bg-amber-500/10",
    "text-rose-200 border-rose-400/20 bg-rose-500/10",
  ];
  return accents[index % accents.length];
}

function deriveProjectMetrics(project: Project, index: number) {
  const status = normalizeStatus(project.status);
  const progress = status === "completed" ? 100 : status === "pending" ? 0 : 28 + (index % 5) * 14;
  const documents = status === "pending" ? 0 : 4 + (index % 3);
  const cycleDays = 60 + index * 18;

  return {
    status,
    progress,
    documents,
    cycleDays,
  };
}

function ProjectsPage() {
  const navigate = useNavigate();
  const { projects, setCurrentProject, addProject, isLoading } = useProject();
  const [activeFilter, setActiveFilter] = useState<ProjectFilter>("all");
  const [query, setQuery] = useState("");
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const normalized = normalizeStatus(project.status);
      const matchesFilter = activeFilter === "all" || normalized === activeFilter;
      const keyword = query.trim().toLowerCase();
      const matchesQuery =
        keyword.length === 0 ||
        project.name.toLowerCase().includes(keyword) ||
        (project.description ?? "").toLowerCase().includes(keyword);

      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, projects, query]);

  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter(
      (project) => normalizeStatus(project.status) === "active",
    ).length;
    const completed = projects.filter(
      (project) => normalizeStatus(project.status) === "completed",
    ).length;
    const generatedDocs = projects.reduce((count, project, index) => {
      return count + deriveProjectMetrics(project, index).documents;
    }, 0);

    return { total, active, completed, generatedDocs };
  }, [projects]);

  const openProject = (project: Project) => {
    setCurrentProject(project);
    navigate(`/project/${project.id}`);
  };

  const handleCreateProject = async () => {
    setIsCreatingProject(true);
    try {
      const response = await createJiuanProject({
        project_name: `项目_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      });
      await selectSolution(response.project_id, { solution_id: DEFAULT_SOLUTION_ID });
      const nextProject: Project = {
        id: response.project_id,
        name: response.project_name,
        status: "active",
      };
      addProject(nextProject);
      setCurrentProject(nextProject);
      navigate("/upload");
    } finally {
      setIsCreatingProject(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-apm-grid">
      <div className="bg-apm-ambient absolute inset-0" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-[8%] top-[4%] h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-[10%] top-[28%] h-[28rem] w-[28rem] rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="relative z-10">
        <header className="sticky top-0 z-20 border-b border-cyan-400/12 bg-[rgba(2,12,27,0.92)] backdrop-blur-xl">
          <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-2 text-cyan-100">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="font-display text-sm font-semibold tracking-[-0.02em] text-white">
                A.<span className="text-cyan-300">PM</span> 智管
              </div>
            </div>
            <div className="h-5 w-px bg-cyan-400/12" />
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-apm-muted">
              项目控制台
            </p>
            <div className="flex-1" />
            <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-apm-muted transition-colors hover:text-white">
              <Bell className="h-3.5 w-3.5" />
              通知
            </button>
            <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-apm-muted transition-colors hover:text-white">
              <Settings className="h-3.5 w-3.5" />
              设置
            </button>
            <button
              onClick={() => navigate("/login")}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-apm-muted transition-colors hover:text-white"
            >
              退出
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-6 py-8">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/10 bg-cyan-400/8 px-3 py-1 text-xs uppercase tracking-[0.22em] text-cyan-100">
                <Sparkles className="h-3.5 w-3.5" />
                Project Workspace
              </p>
              <h1 className="font-display text-3xl text-white">欢迎进入项目控制台</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-apm-muted">
                集中查看项目状态、AI 生成进度和资料准备情况，从这里进入项目工作台或创建新项目。
              </p>
            </div>

            <Button
              onClick={() => void handleCreateProject()}
              disabled={isCreatingProject}
              className="h-12 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 px-5 font-semibold text-slate-950 hover:from-cyan-300 hover:to-sky-400"
            >
              {isCreatingProject ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  创建项目中...
                </>
              ) : (
                <>
                  <CirclePlus className="mr-2 h-4 w-4" />
                  新建项目
                </>
              )}
            </Button>
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                icon: FolderKanban,
                label: "项目总数",
                value: stats.total,
                tone: "text-cyan-200 border-cyan-400/20 bg-cyan-500/10",
              },
              {
                icon: PlayCircle,
                label: "进行中",
                value: stats.active,
                tone: "text-emerald-200 border-emerald-400/20 bg-emerald-500/10",
              },
              {
                icon: Sparkles,
                label: "AI 已生成文档",
                value: stats.generatedDocs,
                tone: "text-amber-200 border-amber-400/20 bg-amber-500/10",
              },
              {
                icon: Clock3,
                label: "已完成项目",
                value: stats.completed,
                tone: "text-violet-200 border-violet-400/20 bg-violet-500/10",
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="apm-topline rounded-[22px] border border-white/8 bg-apm-panel p-5 shadow-apm-panel"
                >
                  <div className={cn("mb-3 inline-flex rounded-xl border p-3", stat.tone)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="font-display text-3xl text-white">{stat.value}</div>
                  <div className="mt-1 text-sm text-apm-muted">{stat.label}</div>
                </div>
              );
            })}
          </div>

          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(FILTER_LABELS) as ProjectFilter[]).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm transition-colors",
                    activeFilter === filter
                      ? "border-cyan-300 bg-cyan-400/10 text-cyan-100"
                      : "border-white/10 bg-white/5 text-apm-muted hover:text-white",
                  )}
                >
                  {FILTER_LABELS[filter]}
                </button>
              ))}
            </div>

            <div className="relative xl:ml-auto xl:w-[280px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-apm-dim" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索项目名称..."
                className="h-11 w-full rounded-xl border border-cyan-400/15 bg-cyan-400/5 pl-11 pr-4 text-sm text-white placeholder:text-apm-dim focus:border-cyan-300 focus:bg-cyan-400/8 focus:outline-none"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-[24px] border border-white/8 bg-apm-panel px-6 py-16 text-center text-sm text-apm-muted shadow-apm-panel">
              正在加载项目列表...
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="rounded-[24px] border border-white/8 bg-apm-panel px-6 py-16 text-center shadow-apm-panel">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/10 bg-cyan-400/8 text-cyan-100">
                <FolderKanban className="h-6 w-6" />
              </div>
              <h2 className="font-display text-xl text-white">当前没有匹配的项目</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-apm-muted">
                你可以先创建一个新项目，上传基础设计资料后进入 AI 工作台继续生成施工组织设计方案。
              </p>
              <Button
                onClick={() => void handleCreateProject()}
                disabled={isCreatingProject}
                className="mt-6 h-11 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 hover:from-cyan-300 hover:to-sky-400"
              >
                {isCreatingProject ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    创建项目中...
                  </>
                ) : (
                  <>
                    <CirclePlus className="mr-2 h-4 w-4" />
                    创建新项目
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredProjects.map((project, index) => {
                const metrics = deriveProjectMetrics(project, index);

                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => openProject(project)}
                    className="text-left"
                  >
                    <article className="group rounded-[24px] border border-white/8 bg-apm-panel shadow-apm-panel transition-all duration-200 hover:border-cyan-300/30 hover:bg-cyan-400/4 hover:shadow-apm-glow">
                      <div className="flex items-start gap-4 border-b border-white/6 px-5 py-5">
                        <div
                          className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-2xl border",
                            getProjectAccent(index),
                          )}
                        >
                          <HardHat className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="line-clamp-2 text-base font-semibold leading-6 text-white">
                            {project.name}
                          </h2>
                          <p className="mt-1 text-xs leading-5 text-apm-muted">
                            {project.description?.trim() || `项目编号 ${project.id}`}
                          </p>
                        </div>
                      </div>

                      <div className="px-5 py-4">
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.18em] text-apm-dim">
                              状态
                            </p>
                            <p className="mt-2 text-sm font-medium text-white">
                              {getStatusLabel(metrics.status)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.18em] text-apm-dim">
                              文档数
                            </p>
                            <p className="mt-2 text-sm font-medium text-white">
                              {metrics.documents} 份
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.18em] text-apm-dim">
                              周期
                            </p>
                            <p className="mt-2 text-sm font-medium text-white">
                              {metrics.cycleDays} 天
                            </p>
                          </div>
                        </div>

                        <div className="mt-5">
                          <div className="mb-2 flex items-center justify-between text-xs text-apm-muted">
                            <span>项目进度</span>
                            <span className="font-medium text-cyan-100">
                              {metrics.status === "pending" ? "待启动" : `${metrics.progress}%`}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/6">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                metrics.status === "completed"
                                  ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                                  : metrics.status === "pending"
                                    ? "bg-white/10"
                                    : "bg-gradient-to-r from-cyan-400 to-sky-500",
                              )}
                              style={{ width: `${metrics.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 border-t border-white/6 px-5 py-3">
                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-[11px] font-medium",
                            getStatusClass(metrics.status),
                          )}
                        >
                          {getStatusLabel(metrics.status)}
                        </span>
                        <span className="text-xs text-apm-dim">
                          创建于 {formatDate(project.createdAt)}
                        </span>
                        <span className="ml-auto inline-flex items-center gap-1 text-xs text-cyan-200">
                          进入工作台
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </article>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => void handleCreateProject()}
                className="group flex min-h-[280px] flex-col items-center justify-center rounded-[24px] border border-dashed border-white/12 bg-apm-panel px-6 py-10 text-center shadow-apm-panel transition-all duration-200 hover:border-cyan-300/30 hover:bg-cyan-400/4"
                disabled={isCreatingProject}
              >
                <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/8 p-4 text-cyan-100 transition-transform duration-200 group-hover:scale-105">
                  {isCreatingProject ? (
                    <Loader2 className="h-7 w-7 animate-spin" />
                  ) : (
                    <CirclePlus className="h-7 w-7" />
                  )}
                </div>
                <h2 className="mt-4 font-display text-xl text-white">创建新项目</h2>
                <p className="mt-2 max-w-xs text-sm leading-6 text-apm-muted">
                  上传基础设计资料，生成新的施工组织设计工作台。
                </p>
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default ProjectsPage;
