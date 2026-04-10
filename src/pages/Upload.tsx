import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, X, FileText, Image, File, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type FileCategory = "drawing" | "document" | "contract" | "photo" | "bim" | "other";

const FILE_CATEGORY_LABELS: Record<FileCategory, string> = {
  drawing: "图纸",
  document: "文档",
  contract: "合同",
  photo: "照片",
  bim: "BIM模型",
  other: "其他",
};

interface UploadFile {
  id: string;
  file: File;
  category: FileCategory;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
}

const CATEGORIES: FileCategory[] = ["drawing", "document", "contract", "photo", "bim", "other"];

function UploadPage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isAllUploading, setIsAllUploading] = useState(false);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const newFiles: UploadFile[] = selectedFiles.map((file) => ({
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      category: "other" as FileCategory,
      progress: 0,
      status: "pending",
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    event.target.value = "";
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const newFiles: UploadFile[] = droppedFiles.map((file) => ({
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      category: "other" as FileCategory,
      progress: 0,
      status: "pending",
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const updateFileCategory = useCallback((id: string, category: FileCategory) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, category } : f)));
  }, []);

  const uploadAll = useCallback(async () => {
    setIsAllUploading(true);
    for (const uploadFile of files) {
      if (uploadFile.status !== "pending") continue;

      setFiles((prev) =>
        prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "uploading" } : f)),
      );

      for (let i = 1; i <= 10; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        setFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? { ...f, progress: i * 10 } : f)),
        );
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id ? { ...f, status: "completed", progress: 100 } : f,
        ),
      );
    }
    setIsAllUploading(false);
  }, [files]);

  const handleSkip = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const completedCount = files.filter((f) => f.status === "completed").length;
  const allCompleted = files.length > 0 && completedCount === files.length;

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return Image;
    if (file.type.includes("pdf") || file.type.includes("document")) return FileText;
    return File;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020c1b] relative overflow-hidden p-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-white mb-2">上传项目资料</h1>
          <p className="text-cyan-300/70 text-sm">请上传您的项目相关文件，支持多文件上传</p>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={cn(
            "border-2 border-dashed border-cyan-900/60 rounded-xl p-8 text-center",
            "bg-[#041332]/50 backdrop-blur-sm transition-all duration-200",
            "hover:border-cyan-500/60 hover:bg-[#041332]/70",
          )}
        >
          <Upload className="h-12 w-12 text-cyan-400/60 mx-auto mb-4" />
          <p className="text-cyan-100/80 mb-2">拖拽文件到此处，或</p>
          <label>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.bmp,.dwg,.dxf,.ifc,.rvt,.zip,.rar"
            />
            <span className="inline-block px-4 py-2 bg-cyan-600/20 text-cyan-400 rounded-lg cursor-pointer hover:bg-cyan-600/30 transition-colors">
              选择文件
            </span>
          </label>
          <p className="text-slate-500 text-xs mt-3">支持 PDF、Word、Excel、图片、BIM模型等文件</p>
        </div>

        {files.length > 0 && (
          <div className="mt-6 space-y-3">
            {files.map((uploadFile) => {
              const FileIcon = getFileIcon(uploadFile.file);
              return (
                <div
                  key={uploadFile.id}
                  className="bg-[#041332]/70 backdrop-blur-sm border border-cyan-900/40 rounded-lg p-4"
                >
                  <div className="flex items-center gap-4">
                    <FileIcon className="h-10 w-10 text-cyan-400/70 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-white text-sm truncate">{uploadFile.file.name}</p>
                        {uploadFile.status !== "uploading" && (
                          <button
                            onClick={() => removeFile(uploadFile.id)}
                            className="text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <select
                          value={uploadFile.category}
                          onChange={(e) =>
                            updateFileCategory(uploadFile.id, e.target.value as FileCategory)
                          }
                          disabled={
                            uploadFile.status === "uploading" || uploadFile.status === "completed"
                          }
                          className="text-sm bg-[#020c1b]/80 border border-cyan-900/50 rounded px-2 py-1 text-cyan-100/80 disabled:opacity-50"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {FILE_CATEGORY_LABELS[cat]}
                            </option>
                          ))}
                        </select>

                        {uploadFile.status === "completed" && (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        )}
                        {uploadFile.status === "uploading" && (
                          <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
                        )}
                      </div>

                      {uploadFile.status !== "pending" && (
                        <Progress
                          value={uploadFile.progress}
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

        <div className="flex gap-4 mt-8">
          <Button
            onClick={handleSkip}
            variant="outline"
            className="flex-1 h-11 border-cyan-900/50 text-cyan-100/80 hover:bg-cyan-900/20 hover:text-white"
          >
            稍后上传
          </Button>
          <Button
            onClick={() => void uploadAll()}
            disabled={files.length === 0 || isAllUploading || allCompleted}
            className="flex-1 h-11 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium shadow-lg shadow-cyan-500/20"
          >
            {isAllUploading ? (
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
          <div className="text-center mt-4">
            <p className="text-green-400 text-sm mb-3">所有文件上传完成！</p>
            <Button
              onClick={() => navigate("/")}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
            >
              进入首页
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadPage;
