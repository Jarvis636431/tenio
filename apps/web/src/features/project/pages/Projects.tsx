import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Building2,
  Calendar,
  CalendarCheck,
  CirclePlus,
  FileText,
  HardHat,
  PlayCircle,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth";
import { AppHeader } from "@/components/layout/AppHeader";
import { useProject, useProjectMetrics } from "../hooks/useProject";
import { ProjectGenerationStatusDialog } from "../components/ProjectGenerationStatusDialog";
import { deleteProject } from "../services/project-api";
import { projectQueryKeys } from "../queryKeys";
import type { ProjectListItem, ProjectStatus } from "../types";

type ProjectFilter = "all" | ProjectStatus;

const FILTER_LABELS: Record<ProjectFilter, string> = {
  all: "全部项目",
  draft: "草稿",
  active: "进行中",
  archived: "已归档",
};

const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "草稿",
  active: "进行中",
  archived: "已归档",
};

function normalizeStatus(status?: ProjectStatus): ProjectStatus {
  if (status === "draft" || status === "archived") return status;
  return "active";
}

function formatDate(dateString?: string) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getStatusStyle(status: ProjectStatus) {
  if (status === "archived") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-200";
  }
  if (status === "draft") {
    return "border-amber-400/20 bg-amber-500/10 text-amber-200";
  }
  return "border-cyan-400/20 bg-cyan-400/10 text-cyan-200";
}

function getProgressColor(status: ProjectStatus) {
  if (status === "archived") {
    return "from-emerald-400 to-emerald-500";
  }
  if (status === "draft") {
    return "bg-white/10";
  }
  return "from-cyan-400 to-sky-500";
}

function getDefaultProgress(status: ProjectStatus) {
  if (status === "archived") return 100;
  if (status === "draft") return 0;
  return 42;
}

function formatDuration(days: number) {
  return `${days}天`;
}

function formatRemainingDays(days: number) {
  return days <= 0 ? "0天" : `${days}天`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "数据加载失败";
}

function getAccentStyle(index: number) {
  const accents = [
    { bg: "rgba(0,212,255,0.1)", border: "rgba(0,212,255,0.25)", color: "var(--accent)" },
    { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)", color: "var(--green)" },
    { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)", color: "var(--amber)" },
    { bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.25)", color: "#a78bfa" },
    { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)", color: "var(--red)" },
  ];
  return accents[index % accents.length];
}

function ProjectsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const auth = useAuth();
  const [activeFilter, setActiveFilter] = useState<ProjectFilter>("all");
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ProjectListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const projectListParams = useMemo(
    () => ({
      status: activeFilter === "all" ? undefined : activeFilter,
      keyword: query.trim() || undefined,
      page: 1,
      page_size: 50,
    }),
    [activeFilter, query],
  );
  const {
    projects,
    isLoading,
    isError: isProjectsError,
    error: projectsError,
  } = useProject(projectListParams);
  const metricsQuery = useProjectMetrics();

  const metrics = metricsQuery.data;
  const displayName = auth.user?.display_name ?? auth.user?.username ?? "未登录用户";

  const openProject = (project: { project_id: string }) => {
    navigate(`/project/${project.project_id}`);
  };

  const closeDeleteDialog = (open: boolean) => {
    if (isDeleting) return;
    if (!open) {
      setDeleteTarget(null);
      setDeleteError(null);
    }
  };

  const confirmDeleteProject = async () => {
    if (!deleteTarget || isDeleting) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteProject(deleteTarget.project_id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: projectQueryKeys.list(projectListParams) }),
        queryClient.invalidateQueries({ queryKey: projectQueryKeys.metrics }),
      ]);
      setDeleteTarget(null);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "项目删除失败，请稍后重试");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-apm-grid">
      <div className="bg-apm-ambient absolute inset-0" />

      {/* Navbar */}
      <AppHeader variant="console" showUser userName={displayName} onLogout={auth.logout} />

      {/* Main */}
      <main className="relative z-10 mx-auto w-full max-w-[1200px] px-6 py-8">
        {/* Welcome Bar */}
        <div className="mb-7 flex items-center justify-between">
          <div>
            <h1 className="font-display text-[22px] font-bold text-white">
              欢迎回来，{displayName}
            </h1>
            <p className="mt-1 text-[13px] text-apm-muted">
              您当前管理{" "}
              <span className="font-semibold text-cyan-400">{metrics?.managed_count ?? 0}</span>{" "}
              个建筑项目，其中{" "}
              <span className="font-semibold text-emerald-400">
                {metrics?.in_progress_count ?? 0}
              </span>{" "}
              个进行中
            </p>
          </div>
          <Button
            onClick={() => navigate("/upload")}
            className="h-11 rounded-none bg-gradient-to-r from-cyan-400 to-sky-500 px-5 font-bold text-slate-950 hover:opacity-90"
          >
            <CirclePlus className="mr-2 h-4 w-4" />
            新建项目
          </Button>
        </div>

        {(metricsQuery.isError || isProjectsError) && (
          <div className="mb-5 border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {metricsQuery.isError
              ? getErrorMessage(metricsQuery.error)
              : getErrorMessage(projectsError)}
          </div>
        )}

        {/* Stats Row */}
        <div className="mb-7 grid grid-cols-4 gap-4">
          <div className="relative border border-cyan-400/20 bg-[rgba(4,18,37,0.85)] p-4">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-cyan-400 to-transparent" />
            <div className="mb-2.5 text-[16px]" style={{ color: "var(--accent)" }}>
              <Building2 className="h-4 w-4" />
            </div>
            <div className="font-display text-[26px] font-bold text-white">
              {metrics?.total_count ?? 0}
            </div>
            <div className="mt-0.5 text-[11px] text-apm-muted">项目总数</div>
          </div>
          <div className="relative border border-cyan-400/20 bg-[rgba(4,18,37,0.85)] p-4">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-400 to-transparent" />
            <div className="mb-2.5 text-[16px]" style={{ color: "var(--green)" }}>
              <PlayCircle className="h-4 w-4" />
            </div>
            <div className="font-display text-[26px] font-bold text-white">
              {metrics?.in_progress_count ?? 0}
            </div>
            <div className="mt-0.5 text-[11px] text-apm-muted">进行中</div>
          </div>
          <div className="relative border border-cyan-400/20 bg-[rgba(4,18,37,0.85)] p-4">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-amber-400 to-transparent" />
            <div className="mb-2.5 text-[16px]" style={{ color: "var(--amber)" }}>
              <FileText className="h-4 w-4" />
            </div>
            <div className="font-display text-[26px] font-bold text-white">
              {metrics?.ready_artifact_count ?? 0}
            </div>
            <div className="mt-0.5 text-[11px] text-apm-muted">AI 成果</div>
          </div>
          <div className="relative border border-cyan-400/20 bg-[rgba(4,18,37,0.85)] p-4">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet-400 to-transparent" />
            <div className="mb-2.5 text-[16px]" style={{ color: "#a78bfa" }}>
              <Search className="h-4 w-4" />
            </div>
            <div className="font-display text-[26px] font-bold text-white">
              {metrics?.average_generation_seconds ?? 0}s
            </div>
            <div className="mt-0.5 text-[11px] text-apm-muted">平均生成耗时</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mb-5 flex items-center gap-2.5">
          {(Object.keys(FILTER_LABELS) as ProjectFilter[]).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "border px-3.5 py-1.5 text-[12px] font-medium transition-colors",
                activeFilter === filter
                  ? "border-cyan-400 bg-cyan-400/10 text-cyan-400"
                  : "border-cyan-400/20 bg-transparent text-apm-muted hover:border-cyan-400/35 hover:text-white",
              )}
            >
              {FILTER_LABELS[filter]}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 border border-cyan-400/20 bg-cyan-400/5 px-3">
            <Search className="h-3.5 w-3.5 text-apm-dim" />
            <input
              type="text"
              aria-label="搜索项目名称"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索项目名称..."
              className="h-7 w-[180px] bg-transparent py-1.5 text-[12px] text-white placeholder:text-apm-dim outline-none"
            />
          </div>
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-3 gap-4">
          {isLoading && (
            <div className="col-span-3 border border-cyan-400/20 bg-[rgba(4,18,37,0.85)] px-5 py-8 text-center text-sm text-apm-muted">
              项目加载中...
            </div>
          )}
          {!isLoading && !isProjectsError && projects.length === 0 && (
            <div className="col-span-3 border border-cyan-400/20 bg-[rgba(4,18,37,0.85)] px-5 py-8 text-center text-sm text-apm-muted">
              暂无项目
            </div>
          )}
          {!isLoading && isProjectsError && (
            <div className="col-span-3 border border-red-400/25 bg-red-500/10 px-5 py-8 text-center text-sm text-red-200">
              {getErrorMessage(projectsError)}
            </div>
          )}
          {projects.map((project, index) => {
            const status = normalizeStatus(project.project_status);
            const statusLabel = project.status_label ?? PROJECT_STATUS_LABELS[status];
            const accent = getAccentStyle(index);
            const progress = project.progress_percent ?? getDefaultProgress(status);
            const plannedStartDate = project.planned_start_date ?? project.created_at;
            const plannedFinishDate = project.planned_finish_date ?? project.updated_at;

            return (
              <article
                key={project.project_id}
                onClick={() => openProject(project)}
                className="group relative flex cursor-pointer flex-col border border-cyan-400/20 bg-[rgba(4,18,37,0.85)] transition-all hover:border-cyan-400 hover:bg-cyan-400/5"
              >
                <button
                  type="button"
                  aria-label={`删除项目 ${project.project_name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setDeleteTarget(project);
                    setDeleteError(null);
                  }}
                  className="absolute right-3 top-3 z-10 inline-flex h-7 w-7 items-center justify-center border border-red-400/25 bg-red-500/10 text-red-300 opacity-0 transition-all hover:border-red-400/70 hover:bg-red-500/20 hover:text-red-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-400/50 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                {/* Header */}
                <div className="flex items-start gap-3 border-b border-cyan-400/10 px-5 pt-5 pb-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center text-[18px]"
                    style={{
                      background: accent.bg,
                      border: `1px solid ${accent.border}`,
                      color: accent.color,
                    }}
                  >
                    <HardHat className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="mb-1 line-clamp-2 text-[14px] font-semibold leading-5 text-white">
                      {project.project_name}
                    </h2>
                    <p className="text-[10px] text-apm-muted">
                      {project.location ?? "未设置地点"} · {project.project_type ?? "项目"}
                    </p>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 px-5 py-4">
                  <div className="mb-3 flex justify-between">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-[0.1em] text-apm-dim">
                        合同工期
                      </span>
                      <span className="mt-0.5 text-[13px] font-semibold text-white">
                        {formatDuration(project.contract_duration_days ?? 0)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-[0.1em] text-apm-dim">
                        发包价
                      </span>
                      <span className="mt-0.5 text-[13px] font-semibold text-white">
                        {project.contract_amount_display ?? "—"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-[0.1em] text-apm-dim">
                        AI 文档
                      </span>
                      <span className="mt-0.5 text-[13px] font-semibold text-white">
                        {project.ready_artifact_count ?? 0}
                      </span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-3">
                    <div className="mb-1.5 flex items-center justify-between text-[10px] text-apm-muted">
                      <span>项目进度</span>
                      <span className="font-semibold text-cyan-400">{progress}%</span>
                    </div>
                    <div className="h-0.5 bg-white/6">
                      <div
                        className={cn(
                          "h-full",
                          status !== "draft"
                            ? `bg-gradient-to-r ${getProgressColor(status)}`
                            : "bg-white/10",
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer info */}
                  <div className="mt-2 flex items-center justify-between text-[9px] text-apm-dim">
                    <span>
                      <Calendar className="inline h-3 w-3" style={{ marginRight: 3 }} />
                      {status === "archived"
                        ? "实际结束"
                        : status === "draft"
                          ? "预计开工"
                          : "预计结束"}
                      ：
                      {status === "draft"
                        ? formatDate(plannedStartDate)
                        : formatDate(plannedFinishDate)}
                    </span>
                    {status === "archived" && (
                      <span className="text-emerald-400">
                        <FileText className="inline h-3 w-3" style={{ marginRight: 2 }} />
                        {statusLabel}
                      </span>
                    )}
                    {status === "active" && (
                      <span className="text-cyan-400">{project.current_phase ?? statusLabel}</span>
                    )}
                    {status === "draft" && (
                      <span className="text-amber-400">
                        <Search className="inline h-3 w-3" style={{ marginRight: 2 }} />
                        {statusLabel}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-2 border-t border-cyan-400/10 px-5 py-2.5">
                  <span
                    className={cn(
                      "border px-2 py-0.5 text-[10px] font-semibold",
                      getStatusStyle(status),
                    )}
                  >
                    {statusLabel}
                  </span>
                  <span className="text-[10px] text-apm-dim">
                    <CalendarCheck className="inline h-3 w-3" style={{ marginRight: 3 }} />
                    开工 {formatDate(plannedStartDate)}
                  </span>
                  <span className="ml-auto text-[10px] text-apm-dim">
                    <Calendar className="inline h-3 w-3" style={{ marginRight: 3 }} />
                    剩余 {formatRemainingDays(project.remaining_days ?? 0)}
                  </span>
                </div>
              </article>
            );
          })}

          {/* New Project Card */}
          <div
            onClick={() => navigate("/upload")}
            className="flex min-h-[240px] cursor-pointer flex-col items-center justify-center gap-2.5 border border-dashed border-cyan-400/20 bg-[rgba(4,18,37,0.85)] text-center transition-all hover:border-cyan-400"
          >
            <div className="text-[28px] text-apm-dim">
              <CirclePlus className="h-7 w-7" />
            </div>
            <span className="text-[13px] text-apm-muted">创建新项目</span>
          </div>
        </div>
      </main>
      <Dialog open={Boolean(deleteTarget)} onOpenChange={closeDeleteDialog}>
        <DialogContent className="max-w-[420px] rounded-none border border-red-400/25 bg-[rgba(4,18,37,0.98)] p-0 text-white shadow-2xl shadow-red-950/30">
          <div className="border-b border-red-400/15 px-6 py-5">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className="flex items-center gap-2 font-display text-xl font-bold">
                <span className="inline-flex h-8 w-8 items-center justify-center border border-red-400/30 bg-red-500/10 text-red-300">
                  <AlertTriangle className="h-4 w-4" />
                </span>
                确认删除项目
              </DialogTitle>
              <DialogDescription className="text-sm leading-6 text-apm-muted">
                删除后将清理该项目的业务数据和相关对话域数据，此操作不可撤销。
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="space-y-4 px-6 py-5">
            <div className="border border-cyan-400/15 bg-cyan-400/5 px-4 py-3">
              <div className="text-xs text-apm-muted">将删除项目</div>
              <div className="mt-1 truncate text-sm font-semibold text-white">
                {deleteTarget?.project_name}
              </div>
            </div>
            {deleteError && (
              <div className="border border-red-400/25 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {deleteError}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 border-t border-red-400/15 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => closeDeleteDialog(false)}
              className="border-cyan-400/25 bg-transparent text-cyan-100 hover:border-cyan-400/60 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              取消
            </Button>
            <Button
              type="button"
              disabled={isDeleting}
              onClick={() => {
                void confirmDeleteProject();
              }}
              className="bg-red-500 text-white hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? "删除中..." : "确认删除"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <ProjectGenerationStatusDialog />
    </div>
  );
}

export default ProjectsPage;
