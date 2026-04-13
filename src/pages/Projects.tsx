import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Building2,
  Calendar,
  CalendarCheck,
  CirclePlus,
  FileText,
  HardHat,
  PlayCircle,
  Search,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useProject, type Project } from "@/features/project";

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

function getStatusStyle(status: ProjectFilter) {
  if (status === "completed") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-200";
  }
  if (status === "pending") {
    return "border-amber-400/20 bg-amber-500/10 text-amber-200";
  }
  return "border-cyan-400/20 bg-cyan-400/10 text-cyan-200";
}

function getProgressColor(status: ProjectFilter) {
  if (status === "completed") {
    return "from-emerald-400 to-emerald-500";
  }
  if (status === "pending") {
    return "bg-white/10";
  }
  return "from-cyan-400 to-sky-500";
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
  const { projects } = useProject();
  const [activeFilter, setActiveFilter] = useState<ProjectFilter>("all");
  const [query, setQuery] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const normalized = normalizeStatus(project.status);
      const matchesFilter = activeFilter === "all" || normalized === activeFilter;
      const keyword = query.trim().toLowerCase();
      const matchesQuery = keyword.length === 0 || project.name.toLowerCase().includes(keyword);
      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, projects, query]);

  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => normalizeStatus(p.status) === "active").length;
    const generatedDocs = 18; // mock
    const avgTime = 4.2; // mock
    return { total, active, generatedDocs, avgTime };
  }, [projects]);

  const openProject = (project: Project) => {
    navigate(`/project/${project.id}`);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-apm-grid">
      <div className="bg-apm-ambient absolute inset-0" />

      {/* Navbar */}
      <header className="sticky top-0 z-20 border-b border-cyan-400/20 bg-[rgba(2,12,27,0.94)] backdrop-blur-xl">
        <div className="mx-auto flex h-[54px] w-full max-w-[1200px] items-center gap-3 px-6">
          <div className="flex items-center gap-2.5">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663381579886/3dGQrYeue3pTedcrRzk4ny/logo_icon_blue_cc74c57f.png"
              alt="A.PM"
              className="h-6 w-6 object-contain"
            />
            <span className="font-display text-[15px] font-bold tracking-[-0.02em] text-white">
              A.<span className="text-cyan-400">PM</span> 智管
            </span>
          </div>
          <div className="h-[18px] w-px bg-cyan-400/20" />
          <span className="text-xs font-medium text-apm-muted">项目控制台</span>
          <div className="flex-1" />
          <button className="flex items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-3 py-1.5 text-xs text-apm-muted transition-colors hover:border-cyan-400 hover:text-cyan-400">
            <Bell className="h-3.5 w-3.5" />
            通知
            <span className="ml-1 rounded bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
              3
            </span>
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-3 py-1.5 text-xs text-apm-muted transition-colors hover:border-cyan-400 hover:text-cyan-400">
            <Settings className="h-3.5 w-3.5" />
            设置
          </button>
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-sky-500 text-[13px] font-bold text-white">
                张
              </div>
              <div className="flex flex-col items-start">
                <span className="text-xs font-semibold text-white">张伟</span>
                <span className="text-[10px] text-apm-muted">项目总监</span>
              </div>
            </button>
            {showUserDropdown && (
              <div className="absolute right-0 top-full mt-2 min-w-[140px] rounded-lg border border-cyan-400/20 bg-[var(--bg-panel)]">
                <button className="flex w-full items-center gap-2 border-b border-cyan-400/20 px-4 py-2.5 text-xs text-apm-muted hover:text-white">
                  账号设置
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-xs text-red-400 hover:text-red-300"
                >
                  退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 mx-auto w-full max-w-[1200px] px-6 py-8">
        {/* Welcome Bar */}
        <div className="mb-7 flex items-center justify-between">
          <div>
            <h1 className="font-display text-[22px] font-bold text-white">欢迎回来，张伟</h1>
            <p className="mt-1 text-[13px] text-apm-muted">
              您当前管理 <span className="font-semibold text-cyan-400">{stats.total}</span>{" "}
              个建筑项目，其中{" "}
              <span className="font-semibold text-emerald-400">{stats.active}</span> 个进行中
            </p>
          </div>
          <Button
            onClick={() => navigate("/upload")}
            className="h-11 rounded-lg bg-gradient-to-r from-cyan-400 to-sky-500 px-5 font-bold text-slate-950 hover:opacity-90"
          >
            <CirclePlus className="mr-2 h-4 w-4" />
            新建项目
          </Button>
        </div>

        {/* Stats Row */}
        <div className="mb-7 grid grid-cols-4 gap-4">
          <div className="relative border border-cyan-400/20 bg-[rgba(4,18,37,0.85)] p-4">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-cyan-400 to-transparent" />
            <div className="mb-2.5 text-[16px]" style={{ color: "var(--accent)" }}>
              <Building2 className="h-4 w-4" />
            </div>
            <div className="font-display text-[26px] font-bold text-white">{stats.total}</div>
            <div className="mt-0.5 text-[11px] text-apm-muted">项目总数</div>
          </div>
          <div className="relative border border-cyan-400/20 bg-[rgba(4,18,37,0.85)] p-4">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-400 to-transparent" />
            <div className="mb-2.5 text-[16px]" style={{ color: "var(--green)" }}>
              <PlayCircle className="h-4 w-4" />
            </div>
            <div className="font-display text-[26px] font-bold text-white">{stats.active}</div>
            <div className="mt-0.5 text-[11px] text-apm-muted">进行中</div>
          </div>
          <div className="relative border border-cyan-400/20 bg-[rgba(4,18,37,0.85)] p-4">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-amber-400 to-transparent" />
            <div className="mb-2.5 text-[16px]" style={{ color: "var(--amber)" }}>
              <FileText className="h-4 w-4" />
            </div>
            <div className="font-display text-[26px] font-bold text-white">
              {stats.generatedDocs}
            </div>
            <div className="mt-0.5 text-[11px] text-apm-muted">AI 已生成文档</div>
          </div>
          <div className="relative border border-cyan-400/20 bg-[rgba(4,18,37,0.85)] p-4">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet-400 to-transparent" />
            <div className="mb-2.5 text-[16px]" style={{ color: "#a78bfa" }}>
              <Search className="h-4 w-4" />
            </div>
            <div className="font-display text-[26px] font-bold text-white">
              {stats.avgTime}
              <small className="text-[14px]"> min</small>
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
                "rounded-lg border px-3.5 py-1.5 text-[12px] font-medium transition-colors",
                activeFilter === filter
                  ? "border-cyan-400 bg-cyan-400/10 text-cyan-400"
                  : "border-cyan-400/20 bg-transparent text-apm-muted hover:border-cyan-400/35 hover:text-white",
              )}
            >
              {FILTER_LABELS[filter]}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-3">
            <Search className="h-3.5 w-3.5 text-apm-dim" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索项目名称..."
              className="h-7 w-[180px] bg-transparent py-1.5 text-[12px] text-white placeholder:text-apm-dim outline-none"
            />
          </div>
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-3 gap-4">
          {filteredProjects.map((project, index) => {
            const status = normalizeStatus(project.status);
            const accent = getAccentStyle(index);
            const progress =
              status === "completed" ? 100 : status === "pending" ? 0 : 35 + (index % 5) * 14;
            const contractDays = 60 + index * 18;
            const contractAmount = (63.66 + index * 12).toFixed(2);
            const aiDocs = status === "pending" ? 0 : 4 + (index % 3);
            const endDate = "2026-06-07";

            return (
              <article
                key={project.id}
                onClick={() => openProject(project)}
                className="flex cursor-pointer flex-col border border-cyan-400/20 bg-[rgba(4,18,37,0.85)] transition-all hover:border-cyan-400 hover:bg-cyan-400/5"
              >
                {/* Header */}
                <div className="flex items-start gap-3 border-b border-cyan-400/10 px-5 pt-5 pb-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-[18px]"
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
                      {project.name}
                    </h2>
                    <p className="text-[10px] text-apm-muted">{project.description || "—"}</p>
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
                        {contractDays}{" "}
                        <small className="text-[10px] font-normal text-apm-muted">日历天</small>
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-[0.1em] text-apm-dim">
                        发包价
                      </span>
                      <span className="mt-0.5 text-[13px] font-semibold text-white">
                        {contractAmount}{" "}
                        <small className="text-[10px] font-normal text-apm-muted">万元</small>
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-[0.1em] text-apm-dim">
                        AI 文档
                      </span>
                      <span className="mt-0.5 text-[13px] font-semibold text-white">
                        {aiDocs}{" "}
                        <small className="text-[10px] font-normal text-apm-muted">份</small>
                      </span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-3">
                    <div className="mb-1.5 flex items-center justify-between text-[10px] text-apm-muted">
                      <span>项目进度</span>
                      <span className="font-semibold text-cyan-400">
                        {status === "pending" ? "待启动" : `${progress}%`}
                      </span>
                    </div>
                    <div className="h-0.5 bg-white/6">
                      <div
                        className={cn(
                          "h-full",
                          status !== "pending"
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
                      {status === "completed"
                        ? "预计结束"
                        : status === "pending"
                          ? "预计开工"
                          : "预计结束"}
                      ：{endDate}
                    </span>
                    {status === "completed" && (
                      <span className="text-emerald-400">
                        <FileText className="inline h-3 w-3" style={{ marginRight: 2 }} />
                        全部完成
                      </span>
                    )}
                    {status === "active" && (
                      <span className="text-cyan-400">
                        <HardHat className="inline h-3 w-3" style={{ marginRight: 2 }} />
                        AI文档已就绪
                      </span>
                    )}
                    {status === "pending" && (
                      <span className="text-amber-400">
                        <Search className="inline h-3 w-3" style={{ marginRight: 2 }} />
                        待上传资料
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-2 border-t border-cyan-400/10 px-5 py-2.5">
                  <span
                    className={cn(
                      "rounded border px-2 py-0.5 text-[10px] font-semibold",
                      getStatusStyle(status),
                    )}
                  >
                    {FILTER_LABELS[status]}
                  </span>
                  <span className="text-[10px] text-apm-dim">
                    <CalendarCheck className="inline h-3 w-3" style={{ marginRight: 3 }} />
                    开工 {project.createdAt ? formatDate(project.createdAt) : "—"}
                  </span>
                  <span className="ml-auto text-[10px] text-apm-dim">
                    <Calendar className="inline h-3 w-3" style={{ marginRight: 3 }} />
                    剩余 {status === "pending" ? "—" : `${365 - index * 30} 天`}
                  </span>
                </div>
              </article>
            );
          })}

          {/* New Project Card */}
          <div
            onClick={() => navigate("/upload")}
            className="flex min-h-[240px] cursor-pointer flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed border-cyan-400/20 bg-[rgba(4,18,37,0.85)] text-center transition-all hover:border-cyan-400"
          >
            <div className="text-[28px] text-apm-dim">
              <CirclePlus className="h-7 w-7" />
            </div>
            <span className="text-[13px] text-apm-muted">创建新项目</span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProjectsPage;
