import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, X, FileText, Image, File, CheckCircle, Loader2 } from "lucide-react";
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

const CATEGORIES: FileCategory[] = ["drawing", "document", "contract", "photo", "bim", "other"];
const UPLOAD_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.bmp,.dwg,.dxf,.ifc,.rvt,.zip,.rar";

function createQueueItem(file: File): UploadQueueItem {
  return {
    id: `file-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    file,
    category: "other",
    status: "pending",
  };
}

function UploadPage() {
  const navigate = useNavigate();
  const { currentProject, projects, addProject, setCurrentProject } = useProject();
  const [files, setFiles] = useState<UploadQueueItem[]>([]);
  const [isAllUploading, setIsAllUploading] = useState(false);

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

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles.map(createQueueItem)]);
    event.target.value = "";
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles.map(createQueueItem)]);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  }, []);

  const updateFileCategory = useCallback((id: string, category: FileCategory) => {
    setFiles((prev) => prev.map((file) => (file.id === id ? { ...file, category } : file)));
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
    } finally {
      setIsAllUploading(false);
    }
  }, [ensureProjectId, files, uploadFile]);

  const handleSkip = useCallback(() => {
    navigate(currentProject?.id ? `/project/${currentProject.id}` : "/");
  }, [currentProject, navigate]);

  const completedCount = files.filter((file) => file.status === "completed").length;
  const allCompleted = files.length > 0 && completedCount === files.length;

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return Image;
    if (file.type.includes("pdf") || file.type.includes("document")) return FileText;
    return File;
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020c1b] p-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-semibold text-white">上传项目资料</h1>
          <p className="text-sm text-cyan-300/70">请上传您的项目相关文件，支持多文件上传</p>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={cn(
            "rounded-xl border-2 border-dashed border-cyan-900/60 p-8 text-center",
            "bg-[#041332]/50 backdrop-blur-sm transition-all duration-200",
            "hover:border-cyan-500/60 hover:bg-[#041332]/70",
          )}
        >
          <Upload className="mx-auto mb-4 h-12 w-12 text-cyan-400/60" />
          <p className="mb-2 text-cyan-100/80">拖拽文件到此处，或</p>
          <label>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept={UPLOAD_ACCEPT}
            />
            <span className="inline-block cursor-pointer rounded-lg bg-cyan-600/20 px-4 py-2 text-cyan-400 transition-colors hover:bg-cyan-600/30">
              选择文件
            </span>
          </label>
          <p className="mt-3 text-xs text-slate-500">支持 PDF、Word、Excel、图片、BIM模型等文件</p>
        </div>

        {files.length > 0 && (
          <div className="mt-6 space-y-3">
            {files.map((uploadFile) => {
              const FileIcon = getFileIcon(uploadFile.file);
              const progress = progressMap.get(uploadFile.id);

              return (
                <div
                  key={uploadFile.id}
                  className="rounded-lg border border-cyan-900/40 bg-[#041332]/70 p-4 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-4">
                    <FileIcon className="h-10 w-10 flex-shrink-0 text-cyan-400/70" />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <p className="truncate text-sm text-white">{uploadFile.file.name}</p>
                        {uploadFile.status !== "uploading" && (
                          <button
                            onClick={() => removeFile(uploadFile.id)}
                            className="text-slate-400 transition-colors hover:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <select
                          value={uploadFile.category}
                          onChange={(event) =>
                            updateFileCategory(uploadFile.id, event.target.value as FileCategory)
                          }
                          disabled={
                            uploadFile.status === "uploading" || uploadFile.status === "completed"
                          }
                          className="rounded border border-cyan-900/50 bg-[#020c1b]/80 px-2 py-1 text-sm text-cyan-100/80 disabled:opacity-50"
                        >
                          {CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                              {FILE_CATEGORY_LABELS[category]}
                            </option>
                          ))}
                        </select>

                        {uploadFile.status === "completed" && (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        )}
                        {uploadFile.status === "uploading" && (
                          <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                        )}
                        {uploadFile.status === "error" && (
                          <span className="text-xs text-red-400">
                            {uploadFile.error ?? "上传失败，请重试"}
                          </span>
                        )}
                      </div>

                      {uploadFile.status !== "pending" && (
                        <Progress
                          value={uploadFile.status === "completed" ? 100 : (progress?.percent ?? 0)}
                          className="mt-2 h-1 [&>div]:bg-gradient-to-r [&>div]:from-cyan-500 [&>div]:to-blue-500"
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 flex gap-4">
          <Button
            onClick={handleSkip}
            variant="outline"
            className="h-11 flex-1 border-cyan-900/50 text-cyan-100/80 hover:bg-cyan-900/20 hover:text-white"
          >
            稍后上传
          </Button>
          <Button
            onClick={() => void uploadAll()}
            disabled={files.length === 0 || isAllUploading || isUploading || allCompleted}
            className="h-11 flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 font-medium text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-500 hover:to-blue-500"
          >
            {isAllUploading || isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                上传中...
              </>
            ) : allCompleted ? (
              "上传完成"
            ) : (
              `开始上传${files.length > 0 ? ` (${files.length})` : ""}`
            )}
          </Button>
        </div>

        {allCompleted && (
          <div className="mt-4 text-center">
            <p className="mb-3 text-sm text-green-400">所有文件上传完成！</p>
            <Button
              onClick={() => navigate(resolvedProjectId ? `/project/${resolvedProjectId}` : "/")}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
            >
              进入项目
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadPage;
