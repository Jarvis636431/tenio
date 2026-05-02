import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  CloudUpload,
  DraftingCompass,
  File as FileIcon,
  FileSpreadsheet,
  FileText,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/components/layout/AppHeader";
import {
  getProjectGenerationStatus,
  startProjectGeneration,
  type GenerationStep,
} from "@/features/project";
import { useUploads } from "../hooks/useUploads";
import type { FileCategory, FileStatus } from "../types/uploads";

interface UploadQueueItem {
  id: string;
  file: File;
  category: FileCategory;
  status: FileStatus;
  error?: string;
}

type UploadZone = {
  category: FileCategory;
  title: string;
  description: string;
  formats: string;
  icon: typeof FileText;
  required?: boolean;
};

const MAX_FILES_PER_CATEGORY = 3;

const UPLOAD_EXTENSION_RULES: Partial<Record<FileCategory, string[]>> = {
  contract: [".doc", ".docx", ".pdf"],
  document: [".xls", ".xlsx", ".pdf"],
  drawing: [".dwg", ".pdf"],
  other: [".doc", ".docx", ".pdf"],
};

const UPLOAD_CATEGORY_LABELS: Partial<Record<FileCategory, string>> = {
  contract: "核心文件",
  document: "工程量清单",
  drawing: "CAD 施工图纸",
  other: "其他补充资料",
};

const REQUIRED_ZONE: UploadZone = {
  category: "contract",
  title: "招标文件 / 施工合同",
  description: "上传招标文件或施工合同，AI 将从中提取项目信息。",
  formats: "支持 .doc .docx .pdf，最多 3 个文件",
  icon: FileText,
  required: true,
};

const OPTIONAL_ZONES: UploadZone[] = [
  {
    category: "document",
    title: "工程量清单",
    description: "预算书或清单。",
    formats: "支持 .xls .xlsx .pdf，最多 3 个文件",
    icon: FileSpreadsheet,
  },
  {
    category: "drawing",
    title: "CAD 施工图纸",
    description: "建筑、结构或机电施工图。",
    formats: "支持 .dwg .pdf，最多 3 个文件",
    icon: DraftingCompass,
  },
  {
    category: "other",
    title: "其他补充资料",
    description: "地勘报告、设计说明、会议纪要等。",
    formats: "支持 .doc .docx .pdf，最多 3 个文件",
    icon: FileText,
  },
];

const FALLBACK_GENERATION_STEPS = [
  "文件解析中...",
  "提取项目信息",
  "生成施工组织设计",
  "生成进度计划",
  "生成甘特图 & 网络图",
  "工期-成本分析 & 人员轮转",
];

function createQueueItem(file: File, category: FileCategory): UploadQueueItem {
  return {
    id: `file-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    file,
    category,
    status: "pending",
  };
}

function getFileExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
}

function getAllowedExtensions(category: FileCategory) {
  return UPLOAD_EXTENSION_RULES[category] ?? [];
}

function getUploadAccept(category: FileCategory) {
  return getAllowedExtensions(category).join(",");
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

function isGenerationStepDone(status?: string) {
  const value = status?.toLowerCase() ?? "";
  return value === "succeeded" || value === "completed" || value.includes("完成");
}

function isGenerationStepRunning(status?: string) {
  const value = status?.toLowerCase() ?? "";
  return value === "running" || value === "processing" || value.includes("进行");
}

function createAbortError() {
  const error = new Error("生成轮询已取消");
  error.name = "AbortError";
  return error;
}

function throwIfAborted(signal: AbortSignal) {
  if (signal.aborted) {
    throw createAbortError();
  }
}

function waitForNextPoll(signal: AbortSignal, delayMs: number) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(createAbortError());
      return;
    }

    function handleAbort() {
      window.clearTimeout(timeoutId);
      reject(createAbortError());
    }

    const timeoutId = window.setTimeout(() => {
      signal.removeEventListener("abort", handleAbort);
      resolve();
    }, delayMs);

    signal.addEventListener("abort", handleAbort, { once: true });
  });
}

function UploadPage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<UploadQueueItem[]>([]);
  const [isAllUploading, setIsAllUploading] = useState(false);
  const [dragTarget, setDragTarget] = useState<FileCategory | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([]);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [fileSelectionError, setFileSelectionError] = useState<string | null>(null);
  const [uploadedProjectId, setUploadedProjectId] = useState<string | null>(null);
  const generationAbortRef = useRef<AbortController | null>(null);

  const { uploadFile, uploadProgress } = useUploads({ projectId: null });

  useEffect(() => {
    return () => {
      generationAbortRef.current?.abort();
    };
  }, []);

  const pollGenerationStatus = useCallback(
    async (projectId: string, signal: AbortSignal) => {
      const maxAttempts = 180;
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        throwIfAborted(signal);
        const status = await getProjectGenerationStatus(projectId);
        throwIfAborted(signal);
        setGenerationSteps(status.steps ?? []);

        const normalizedStatus = status.generation_status.toLowerCase();
        if (normalizedStatus === "succeeded" || normalizedStatus === "completed") {
          navigate(`/project/${projectId}`, { replace: true });
          return;
        }

        if (normalizedStatus === "failed") {
          throw new Error(status.error_message ?? "生成失败，请稍后重试");
        }

        await waitForNextPoll(signal, 2000);
      }

      throw new Error("生成超时，请稍后在项目工作台查看结果");
    },
    [navigate],
  );

  const progressMap = useMemo(
    () =>
      new Map(
        uploadProgress
          .filter((item) => item.clientId)
          .map((item) => [item.clientId as string, item]),
      ),
    [uploadProgress],
  );

  const appendFiles = useCallback(
    (selectedFiles: File[], category: FileCategory) => {
      if (selectedFiles.length === 0) {
        return;
      }

      const allowedExtensions = getAllowedExtensions(category);
      const categoryLabel = UPLOAD_CATEGORY_LABELS[category] ?? "该分类";
      let remainingSlots =
        MAX_FILES_PER_CATEGORY - files.filter((file) => file.category === category).length;
      const nextFiles: UploadQueueItem[] = [];
      const errors: string[] = [];

      selectedFiles.forEach((file) => {
        const extension = getFileExtension(file.name);
        if (!allowedExtensions.includes(extension)) {
          errors.push(
            `${file.name} 格式不支持，${categoryLabel}仅支持 ${allowedExtensions.join(" ")}`,
          );
          return;
        }

        if (remainingSlots <= 0) {
          errors.push(`${categoryLabel}最多上传 ${MAX_FILES_PER_CATEGORY} 个文件`);
          return;
        }

        nextFiles.push(createQueueItem(file, category));
        remainingSlots -= 1;
      });

      if (nextFiles.length > 0) {
        setFiles((prev) => [...prev, ...nextFiles]);
      }
      setFileSelectionError(errors.length > 0 ? Array.from(new Set(errors)).join("；") : null);
    },
    [files],
  );

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

  const uploadAll = useCallback(async () => {
    setIsAllUploading(true);

    try {
      let hasUploadError = false;
      let targetProjectId = uploadedProjectId;

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
          const result = await uploadFile({
            clientId: uploadItem.id,
            file: uploadItem.file,
            category: uploadItem.category,
            description: "",
          });
          targetProjectId = targetProjectId ?? result.projectId ?? null;
          if (targetProjectId) {
            setUploadedProjectId(targetProjectId);
          }

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

      if (!hasUploadError && files.length > 0) {
        if (!targetProjectId) {
          throw new Error("缺少项目 ID，无法启动生成");
        }

        setIsGenerating(true);
        setGenerationError(null);
        setGenerationSteps([]);

        generationAbortRef.current?.abort();
        generationAbortRef.current = new AbortController();

        await startProjectGeneration(targetProjectId, { trigger_source: "upload" });
        await pollGenerationStatus(targetProjectId, generationAbortRef.current.signal);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      setGenerationError(error instanceof Error ? error.message : "生成失败，请稍后重试");
    } finally {
      setIsAllUploading(false);
    }
  }, [files, pollGenerationStatus, uploadFile, uploadedProjectId]);

  const handleSkip = useCallback(() => {
    navigate("/projects");
  }, [navigate]);

  const completedCount = files.filter((file) => file.status === "completed").length;
  const allCompleted = files.length > 0 && completedCount === files.length;
  const requiredFiles = files.filter((file) => file.category === REQUIRED_ZONE.category);
  const hasRequiredFiles = requiredFiles.length > 0;
  const displayGenerationSteps =
    generationSteps.length > 0
      ? generationSteps
          .slice()
          .sort((a, b) => a.step_order - b.step_order)
          .map((step) => ({
            key: step.step_code,
            label: step.step_name,
            status: step.step_status,
          }))
      : FALLBACK_GENERATION_STEPS.map((step, index) => ({
          key: `fallback-${index}`,
          label: step,
          status: index === 0 ? "running" : "pending",
        }));
  const filesByCategory = useMemo(() => {
    return files.reduce<Record<FileCategory, UploadQueueItem[]>>(
      (accumulator, item) => {
        accumulator[item.category].push(item);
        return accumulator;
      },
      {
        core: [],
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
    if (file.type.startsWith("image/")) return FileIcon;
    if (file.type.includes("pdf") || file.type.includes("document")) return FileText;
    return FileIcon;
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
              className="flex items-center gap-3 rounded-lg border border-white/8 bg-[rgba(2,14,30,0.72)] px-4 py-3"
            >
              <FileIcon className="h-4 w-4 shrink-0 text-cyan-300" />
              <span className="min-w-0 flex-1 truncate text-sm text-white">
                {uploadFile.file.name}
              </span>
              <span className="text-xs text-apm-dim">{formatFileSize(uploadFile.file.size)}</span>
              {uploadFile.status === "completed" && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
                  <CheckCircle className="h-3.5 w-3.5" />
                  已上传
                </span>
              )}
              {uploadFile.status === "uploading" && (
                <span className="inline-flex items-center gap-1 text-xs text-cyan-300">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {Math.round(progress?.percent ?? 0)}%
                </span>
              )}
              {uploadFile.status === "pending" && (
                <span className="text-xs text-slate-400">等待上传</span>
              )}
              {uploadFile.status === "error" && (
                <span className="text-xs text-red-300">{uploadFile.error ?? "上传失败"}</span>
              )}
              {uploadFile.status !== "uploading" && (
                <button
                  onClick={() => removeFile(uploadFile.id)}
                  className="shrink-0 rounded-md p-1 text-slate-500 transition-colors hover:bg-white/5 hover:text-red-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {uploadFile.status === "uploading" && (
                <Progress
                  value={progress?.percent ?? 0}
                  className="h-1 w-16 rounded-full bg-white/10 [&>div]:bg-cyan-400"
                />
              )}
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
    const isFull = zoneFiles.length >= MAX_FILES_PER_CATEGORY;

    return (
      <div key={zone.category}>
        <label
          onDrop={handleDrop(zone.category)}
          onDragOver={handleDragOver(zone.category)}
          onDragLeave={handleDragLeave(zone.category)}
          className={cn(
            "block rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all duration-300",
            compact ? "h-full min-h-[224px]" : "min-h-[256px]",
            isFull ? "cursor-not-allowed opacity-70" : "cursor-pointer",
            isActive || hasCompleted
              ? "border-emerald-400/60 bg-emerald-500/6"
              : "border-slate-600 bg-slate-800/50 hover:border-cyan-400/60 hover:bg-slate-800",
          )}
        >
          <input
            type="file"
            multiple
            aria-label={`选择${zone.title}文件`}
            title={`选择${zone.title}文件`}
            className="hidden"
            accept={getUploadAccept(zone.category)}
            disabled={isFull}
            onChange={handleFileSelect(zone.category)}
          />

          <div className="flex h-full flex-col items-center justify-center">
            <div
              className={cn(
                "mb-4 text-slate-400 transition-colors",
                isActive || hasCompleted ? "text-emerald-400" : "group-hover:text-cyan-300",
              )}
            >
              <Icon className={cn(compact ? "h-7 w-7" : "h-9 w-9")} />
            </div>
            <h3 className="mb-2 text-base font-medium text-white">{zone.title}</h3>
            <p className="max-w-md text-sm text-slate-400">{zone.description}</p>
            <p className="mt-2 text-xs text-slate-500">{zone.formats}</p>
            {zoneFiles.length > 0 && !hasCompleted && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
                已选择 {zoneFiles.length}/{MAX_FILES_PER_CATEGORY} 个文件
              </div>
            )}
            {hasCompleted && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                <CheckCircle className="h-3.5 w-3.5" />
                已上传
              </div>
            )}
          </div>
        </label>
        {renderFileList(zone.category)}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0e17]">
      {/* Navbar */}
      <AppHeader variant="upload" showBackButton onBack={handleSkip} />

      {/* Main */}
      <div className="mx-auto max-w-[880px] px-6 pb-20 pt-12">
        {/* Page Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-3 flex items-center justify-center gap-3 text-3xl font-bold text-white">
            <CloudUpload className="h-7 w-7 text-cyan-400" />
            上传基础设计资料
          </h1>
          <p className="text-sm leading-7 text-slate-400">
            上传 <span className="text-cyan-300">招标文件或施工合同</span> 后，AI
            将自动解析并生成完整的施工组织设计方案
            <br />
            包含进度计划、甘特图、网络图、工期-成本分析和人员轮转方案
          </p>
        </div>

        {/* Required Section */}
        <section className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-sm border border-red-500/80 bg-red-500/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-red-200">
              必传
            </span>
            <span className="text-sm font-medium uppercase tracking-wider text-slate-400">
              核心文件
            </span>
            <div className="h-px flex-1 bg-slate-700/50" />
          </div>
          {renderDropZone(REQUIRED_ZONE)}
        </section>

        {/* Optional Section */}
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-sm border border-slate-600/80 bg-slate-700/30 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-slate-300">
              选传
            </span>
            <span className="text-sm font-medium text-slate-400">
              补充资料（上传后可提升生成精度）
            </span>
            <div className="h-px flex-1 bg-slate-700/50" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {OPTIONAL_ZONES.map((zone) => renderDropZone(zone, true))}
          </div>
        </section>

        {/* Tip Box */}
        <div className="mb-10 rounded-xl border border-amber-500/30 bg-amber-500/8 px-5 py-4 text-sm leading-7 text-slate-300">
          <span className="mr-1.5 font-bold text-amber-400">提示：</span>
          <strong className="text-slate-200">招标文件/施工合同</strong> 为必传资料，AI
          将自动从中提取项目名称、建设单位、工期、造价等关键信息。 补充上传工程量清单和 CAD
          图纸可显著提升生成方案的精度和完整度。
        </div>

        {fileSelectionError && (
          <div className="mb-6 border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {fileSelectionError}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleSkip}
            className="flex items-center gap-1.5 border border-white/[0.08] bg-[rgba(4,18,37,0.7)] px-7 py-3 text-sm font-medium text-apm-muted transition-all hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-300"
          >
            <ArrowLeft className="h-4 w-4" />
            返回控制台
          </button>
          <Button
            onClick={() => void uploadAll()}
            disabled={!hasRequiredFiles || isAllUploading || isGenerating}
            className="h-12 rounded-lg bg-cyan-400 px-10 py-3 text-base font-bold text-slate-950 shadow-lg shadow-cyan-400/30 transition-all hover:bg-cyan-300 hover:shadow-cyan-400/50 disabled:bg-slate-500 disabled:text-slate-300 disabled:shadow-none"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {isAllUploading
              ? "上传资料中..."
              : allCompleted
                ? "启动 AI 智能生成"
                : "开始 AI 智能生成"}
          </Button>
        </div>
      </div>

      {/* Generating Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0e17]/95">
          <div className="w-80 text-center">
            {generationError ? (
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-red-400/40 bg-red-500/10 text-red-300">
                <X className="h-7 w-7" />
              </div>
            ) : (
              <div className="mx-auto mb-6 h-14 w-14 animate-spin rounded-full border-[3px] border-slate-700 border-t-cyan-400" />
            )}
            <h2 className="mb-2 text-xl font-bold text-white">
              {generationError ? "生成失败" : "AI 正在智能生成..."}
            </h2>
            <p className="mb-8 text-sm text-slate-400">
              {generationError ?? "正在解析文件并生成施工组织设计方案"}
            </p>
            <div className="space-y-2 text-left">
              {displayGenerationSteps.map((step) => {
                const isDone = isGenerationStepDone(step.status);
                const isRunning = !generationError && isGenerationStepRunning(step.status);
                return (
                  <div
                    key={step.key}
                    className={cn(
                      "flex items-center gap-3 text-sm",
                      isDone ? "text-emerald-400" : isRunning ? "text-cyan-300" : "text-slate-500",
                    )}
                  >
                    {isDone ? (
                      <CheckCircle className="h-4 w-4 shrink-0" />
                    ) : isRunning ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    ) : (
                      <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-600" />
                    )}
                    <span>{step.label}</span>
                  </div>
                );
              })}
            </div>
            {generationError && (
              <div className="mt-7 flex justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsGenerating(false);
                    setGenerationError(null);
                  }}
                  className="border-slate-600 bg-transparent text-slate-300 hover:border-cyan-400/60 hover:text-cyan-300"
                >
                  返回修改
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadPage;
