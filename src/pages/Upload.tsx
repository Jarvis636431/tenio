import { useCallback, useMemo, useState, type ChangeEvent, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  DraftingCompass,
  File,
  FileSpreadsheet,
  FileText,
  Image,
  Loader2,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  createProjectWithDefaultSolution,
  FILE_CATEGORY_LABELS,
  type FileCategory,
  type FileStatus,
  useProject,
  useUploads,
} from "@/features/project";

interface UploadQueueItem {
  id: string;
  file: File;
  category: FileCategory;
  status: FileStatus;
  error?: string;
}

const UPLOAD_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.bmp,.dwg,.dxf,.ifc,.rvt,.zip,.rar";

type UploadZone = {
  category: FileCategory;
  title: string;
  description: string;
  formats: string;
  icon: typeof ShieldCheck;
  required?: boolean;
};

const REQUIRED_ZONE: UploadZone = {
  category: "contract",
  title: "招标文件 / 施工合同",
  description: "上传招标文件或施工合同，AI 将从中提取项目信息。",
  formats: "支持 .doc .docx .pdf 格式，建议优先上传完整版文本。",
  icon: ShieldCheck,
  required: true,
};

const OPTIONAL_ZONES: UploadZone[] = [
  {
    category: "document",
    title: "工程量清单",
    description: "预算书、清单或技术规范书。",
    formats: "支持 .xls .xlsx .pdf 格式。",
    icon: FileSpreadsheet,
  },
  {
    category: "drawing",
    title: "CAD 施工图纸",
    description: "建筑、结构或机电施工图。",
    formats: "支持 .dwg .dxf .pdf 格式。",
    icon: DraftingCompass,
  },
  {
    category: "other",
    title: "其他补充资料",
    description: "地勘报告、设计说明、会议纪要等。",
    formats: "支持多种文档、压缩包与图片格式。",
    icon: FileText,
  },
];

function createQueueItem(file: File, category: FileCategory): UploadQueueItem {
  return {
    id: `file-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    file,
    category,
    status: "pending",
  };
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`;
  }
  return `${size} B`;
}

function UploadPage() {
  const navigate = useNavigate();
  const { currentProject, projects, addProject, setCurrentProject } = useProject();
  const [files, setFiles] = useState<UploadQueueItem[]>([]);
  const [isAllUploading, setIsAllUploading] = useState(false);
  const [dragTarget, setDragTarget] = useState<FileCategory | null>(null);

  const resolvedProjectId = currentProject?.id ?? projects[0]?.id ?? null;
  const { uploadFile, uploadProgress, isUploading } = useUploads({ projectId: resolvedProjectId });

  const progressMap = useMemo(
    () =>
      new Map(
        uploadProgress
          .filter((item) => item.clientId)
          .map((item) => [item.clientId as string, item]),
      ),
    [uploadProgress],
  );

  const appendFiles = useCallback((selectedFiles: File[], category: FileCategory) => {
    if (selectedFiles.length === 0) {
      return;
    }

    setFiles((prev) => [...prev, ...selectedFiles.map((file) => createQueueItem(file, category))]);
  }, []);

  const handleFileSelect = useCallback(
    (category: FileCategory) => (event: ChangeEvent<HTMLInputElement>) => {
      appendFiles(Array.from(event.target.files || []), category);
      event.target.value = "";
    },
    [appendFiles],
  );

  const handleDrop = useCallback(
    (category: FileCategory) => (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      setDragTarget(null);
      appendFiles(Array.from(event.dataTransfer.files), category);
    },
    [appendFiles],
  );

  const handleDragOver = useCallback(
    (category: FileCategory) => (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      if (dragTarget !== category) {
        setDragTarget(category);
      }
    },
    [dragTarget],
  );

  const handleDragLeave = useCallback(
    (category: FileCategory) => () => {
      if (dragTarget === category) {
        setDragTarget(null);
      }
    },
    [dragTarget],
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  }, []);

  const ensureProjectId = useCallback(async () => {
    if (currentProject?.id) {
      return currentProject.id;
    }

    const fallbackProject = projects[0];
    if (fallbackProject) {
      setCurrentProject(fallbackProject);
      return fallbackProject.id;
    }

    const nextProject = await createProjectWithDefaultSolution();
    addProject(nextProject);
    setCurrentProject(nextProject);
    return nextProject.id;
  }, [addProject, currentProject, projects, setCurrentProject]);

  const uploadAll = useCallback(async () => {
    setIsAllUploading(true);

    try {
      const projectId = await ensureProjectId();
      let hasUploadError = false;

      for (const uploadItem of files) {
        if (uploadItem.status !== "pending" && uploadItem.status !== "error") {
          continue;
        }

        setFiles((prev) =>
          prev.map((file) =>
            file.id === uploadItem.id ? { ...file, status: "uploading", error: undefined } : file,
          ),
        );

        try {
          await uploadFile({
            clientId: uploadItem.id,
            projectId,
            file: uploadItem.file,
            category: uploadItem.category,
            description: "",
          });

          setFiles((prev) =>
            prev.map((file) =>
              file.id === uploadItem.id ? { ...file, status: "completed", error: undefined } : file,
            ),
          );
        } catch (error) {
          hasUploadError = true;
          setFiles((prev) =>
            prev.map((file) =>
              file.id === uploadItem.id
                ? {
                    ...file,
                    status: "error",
                    error: error instanceof Error ? error.message : "上传失败",
                  }
                : file,
            ),
          );
        }
      }

      if (!hasUploadError) {
        navigate(`/project/${projectId}`);
      }
    } finally {
      setIsAllUploading(false);
    }
  }, [ensureProjectId, files, navigate, uploadFile]);

  const handleSkip = useCallback(() => {
    navigate(currentProject?.id ? `/project/${currentProject.id}` : "/");
  }, [currentProject, navigate]);

  const completedCount = files.filter((file) => file.status === "completed").length;
  const allCompleted = files.length > 0 && completedCount === files.length;
  const requiredFiles = files.filter((file) => file.category === REQUIRED_ZONE.category);
  const optionalFiles = files.filter((file) => file.category !== REQUIRED_ZONE.category);
  const hasRequiredFiles = requiredFiles.length > 0;
  const filesByCategory = useMemo(() => {
    return files.reduce<Record<FileCategory, UploadQueueItem[]>>(
      (accumulator, item) => {
        accumulator[item.category].push(item);
        return accumulator;
      },
      {
        drawing: [],
        document: [],
        contract: [],
        photo: [],
        bim: [],
        other: [],
      },
    );
  }, [files]);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return Image;
    if (file.type.includes("pdf") || file.type.includes("document")) return FileText;
    return File;
  };

  const renderFileList = (category: FileCategory) => {
    const categoryFiles = filesByCategory[category];
    if (categoryFiles.length === 0) {
      return null;
    }

    return (
      <div className="mt-4 space-y-2">
        {categoryFiles.map((uploadFile) => {
          const FileIcon = getFileIcon(uploadFile.file);
          const progress = progressMap.get(uploadFile.id);

          return (
            <div
              key={uploadFile.id}
              className="rounded-xl border border-white/8 bg-[rgba(2,14,30,0.72)] px-4 py-3 shadow-apm-panel"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg border border-cyan-400/10 bg-cyan-400/8 p-2 text-cyan-200">
                  <FileIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {uploadFile.file.name}
                      </p>
                      <p className="mt-1 text-xs text-apm-dim">
                        {FILE_CATEGORY_LABELS[uploadFile.category]} ·{" "}
                        {formatFileSize(uploadFile.file.size)}
                      </p>
                    </div>
                    {uploadFile.status !== "uploading" && (
                      <button
                        onClick={() => removeFile(uploadFile.id)}
                        className="rounded-md p-1 text-slate-500 transition-colors hover:bg-white/5 hover:text-red-300"
                        aria-label={`移除 ${uploadFile.file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs">
                    {uploadFile.status === "completed" && (
                      <span className="inline-flex items-center gap-1 text-emerald-300">
                        <CheckCircle className="h-3.5 w-3.5" />
                        已上传完成
                      </span>
                    )}
                    {uploadFile.status === "uploading" && (
                      <span className="inline-flex items-center gap-1 text-cyan-300">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        上传中 {Math.round(progress?.percent ?? 0)}%
                      </span>
                    )}
                    {uploadFile.status === "pending" && (
                      <span className="text-slate-400">等待上传</span>
                    )}
                    {uploadFile.status === "error" && (
                      <span className="text-red-300">{uploadFile.error ?? "上传失败，请重试"}</span>
                    )}
                  </div>

                  {uploadFile.status !== "pending" && (
                    <Progress
                      value={uploadFile.status === "completed" ? 100 : (progress?.percent ?? 0)}
                      className="mt-3 h-1.5 bg-white/5 [&>div]:bg-gradient-to-r [&>div]:from-cyan-400 [&>div]:to-sky-500"
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDropZone = (zone: UploadZone, compact = false) => {
    const Icon = zone.icon;
    const zoneFiles = filesByCategory[zone.category];
    const isActive = dragTarget === zone.category;
    const hasCompleted = zoneFiles.some((file) => file.status === "completed");

    return (
      <div key={zone.category}>
        <label
          onDrop={handleDrop(zone.category)}
          onDragOver={handleDragOver(zone.category)}
          onDragLeave={handleDragLeave(zone.category)}
          className={cn(
            "group block cursor-pointer rounded-[20px] border border-dashed px-5 py-7 transition-all duration-200",
            "bg-apm-card backdrop-blur-md",
            compact ? "h-full min-h-[224px]" : "min-h-[256px]",
            isActive || hasCompleted
              ? "border-cyan-300/60 bg-cyan-400/8 shadow-apm-glow"
              : "border-white/10 hover:border-cyan-300/45 hover:bg-cyan-400/6",
          )}
        >
          <input
            type="file"
            multiple
            className="hidden"
            accept={UPLOAD_ACCEPT}
            onChange={handleFileSelect(zone.category)}
          />

          <div className="flex h-full flex-col items-center justify-center text-center">
            <div
              className={cn(
                "mb-4 rounded-2xl border p-4 transition-colors",
                isActive || hasCompleted
                  ? "border-cyan-300/30 bg-cyan-400/12 text-cyan-100"
                  : "border-white/10 bg-white/5 text-cyan-200/80 group-hover:text-cyan-100",
              )}
            >
              <Icon className={cn(compact ? "h-7 w-7" : "h-8 w-8")} />
            </div>
            <div className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-apm-dim">
              {zone.required ? (
                <span className="rounded-full border border-red-400/20 bg-red-500/12 px-2.5 py-1 text-red-200">
                  必传
                </span>
              ) : (
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-slate-300">
                  选传
                </span>
              )}
              <span>{FILE_CATEGORY_LABELS[zone.category]}</span>
            </div>
            <h3 className={cn("font-display text-white", compact ? "text-lg" : "text-xl")}>
              {zone.title}
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-apm-muted">{zone.description}</p>
            <p className="mt-3 text-xs leading-5 text-apm-dim">{zone.formats}</p>
            {zoneFiles.length > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/12 px-3 py-1 text-xs text-emerald-200">
                <CheckCircle className="h-3.5 w-3.5" />
                已选择 {zoneFiles.length} 个文件
              </div>
            )}
          </div>
        </label>
        {renderFileList(zone.category)}
      </div>
    );
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-apm-grid">
      <div className="bg-apm-ambient absolute inset-0" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-[10%] top-[8%] h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-[12%] right-[8%] h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        <div className="mb-8 flex items-center justify-between rounded-2xl border border-white/8 bg-apm-panel px-5 py-3 shadow-apm-panel backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/10 p-2 text-cyan-200">
              <Upload className="h-4 w-4" />
            </div>
            <div>
              <p className="font-display text-lg text-white">A.PM 智管</p>
              <p className="text-xs uppercase tracking-[0.24em] text-apm-dim">Project Intake</p>
            </div>
          </div>
          <Button
            onClick={handleSkip}
            variant="ghost"
            className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-slate-300 hover:bg-white/8 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回工作台
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-[28px] border border-white/8 bg-apm-panel p-6 shadow-apm-panel backdrop-blur-md">
            <div className="apm-topline mb-8 rounded-[22px] border border-white/8 bg-apm-card p-6">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/10 bg-cyan-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-cyan-100">
                <Sparkles className="h-3.5 w-3.5" />
                AI Intake Workflow
              </div>
              <h1 className="font-display text-3xl leading-tight text-white">上传基础设计资料</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-apm-muted">
                上传 <span className="text-cyan-100">招标文件或施工合同</span> 后，AI
                将自动解析并生成施工组织设计方案。
                后续可补充工程量清单、施工图与其他资料，以提高进度计划、资源配置和网络图的生成精度。
              </p>
            </div>

            <section className="mb-8">
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded-full border border-red-400/20 bg-red-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-red-200">
                  必传
                </span>
                <p className="text-sm font-medium text-apm-muted">核心文件</p>
                <div className="h-px flex-1 bg-white/8" />
              </div>
              {renderDropZone(REQUIRED_ZONE)}
            </section>

            <section>
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">
                  选传
                </span>
                <p className="text-sm font-medium text-apm-muted">补充资料，上传后可提升生成精度</p>
                <div className="h-px flex-1 bg-white/8" />
              </div>
              <div className="grid gap-4 xl:grid-cols-3">
                {OPTIONAL_ZONES.map((zone) => renderDropZone(zone, true))}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[24px] border border-white/8 bg-apm-panel p-5 shadow-apm-panel backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-apm-dim">
                Upload Summary
              </p>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl border border-white/8 bg-apm-card p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-apm-dim">核心文件</p>
                  <p className="mt-2 font-display text-3xl text-white">{requiredFiles.length}</p>
                  <p className="mt-1 text-sm text-apm-muted">
                    {hasRequiredFiles ? "已满足基础生成条件" : "尚未上传招标文件或施工合同"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-apm-card p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-apm-dim">补充资料</p>
                  <p className="mt-2 font-display text-3xl text-white">{optionalFiles.length}</p>
                  <p className="mt-1 text-sm text-apm-muted">
                    工程量、图纸和补充文档会提升模型解析精度
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-apm-card p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-apm-dim">已完成上传</p>
                  <p className="mt-2 font-display text-3xl text-white">{completedCount}</p>
                  <p className="mt-1 text-sm text-apm-muted">
                    {files.length > 0
                      ? `共 ${files.length} 个文件进入上传队列`
                      : "等待添加项目资料"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-amber-400/20 bg-[rgba(245,158,11,0.08)] p-5 shadow-apm-panel backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
                上传提示
              </p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-amber-50/80">
                <p>
                  <span className="font-medium text-amber-100">必传：</span>
                  招标文件或施工合同是 AI 生成施工组织设计的基础输入。
                </p>
                <p>
                  <span className="font-medium text-amber-100">选传：</span>
                  工程量清单、施工图纸与其他文档可提升工序拆解、资源计划和进度推演质量。
                </p>
                <p>支持多文件上传。当前上传页只负责资料入库，方案生成仍在下一步工作台内完成。</p>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/8 bg-apm-panel p-5 shadow-apm-panel backdrop-blur-md">
              <div className="space-y-3">
                <Button
                  onClick={() => void uploadAll()}
                  disabled={!hasRequiredFiles || isAllUploading || isUploading || allCompleted}
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 font-medium text-slate-950 shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-sky-400"
                >
                  {isAllUploading || isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      上传资料中...
                    </>
                  ) : allCompleted ? (
                    "资料上传完成"
                  ) : (
                    `开始上传${files.length > 0 ? ` (${files.length})` : ""}`
                  )}
                </Button>
                <Button
                  onClick={handleSkip}
                  variant="ghost"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/8 hover:text-white"
                >
                  稍后上传
                </Button>
              </div>

              {!hasRequiredFiles && (
                <p className="mt-3 text-xs leading-5 text-amber-200/80">
                  请先上传“招标文件 / 施工合同”，再开始上传流程。
                </p>
              )}

              {allCompleted && (
                <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-center">
                  <p className="text-sm text-emerald-200">
                    所有文件上传完成，正在为你进入项目工作台。
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default UploadPage;
