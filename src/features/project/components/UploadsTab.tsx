import { useCallback, useRef, useState } from "react";
import { useUploads } from "../hooks/useUploads";
import type { FileCategory } from "../types/uploads";
import { FILE_CATEGORY_LABELS, FILE_CATEGORY_ICONS } from "../types/uploads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Upload,
  Search,
  FileText,
  Trash2,
  Download,
  Image as ImageIcon,
  File,
  X,
} from "lucide-react";
import { formatFileSize } from "@/lib/utils";
import { formatIsoDate } from "@/lib/date";

interface UploadsTabProps {
  projectId: string | null | undefined;
}

export function UploadsTab({ projectId }: UploadsTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    files,
    total,
    page,
    pageSize: _pageSize,
    totalPages,
    stats,
    uploadProgress,
    category,
    keyword,
    isLoading,
    isUploading,
    isDeleting,
    setPage,
    setCategory,
    setKeyword,
    uploadFile,
    deleteFile,
    resetFilters,
  } = useUploads({ projectId, pageSize: 10 });

  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  // 处理文件选择
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      for (const file of Array.from(files)) {
        try {
          await uploadFile({
            file,
            category: "other",
            description: "",
          });
        } catch {
          // 错误已在 hook 中处理
        }
      }

      // 清空 input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [uploadFile],
  );

  // 处理删除
  const handleDelete = useCallback(
    async (fileId: string) => {
      if (!confirm("确定要删除这个文件吗？")) return;
      try {
        await deleteFile(fileId);
      } catch {
        // 错误已在 hook 中处理
      }
    },
    [deleteFile],
  );

  // 获取文件图标
  const getFileIcon = (type: string, _category: FileCategory) => {
    if (type.startsWith("image/")) {
      return <ImageIcon className="h-5 w-5 text-blue-400" />;
    }
    if (type.includes("pdf")) {
      return <FileText className="h-5 w-5 text-red-400" />;
    }
    return <File className="h-5 w-5 text-slate-400" />;
  };

  // 统计卡片
  const StatCard = ({
    icon,
    label,
    count,
    size,
  }: {
    icon: string;
    label: string;
    count: number;
    size: number;
  }) => (
    <div className="rounded border border-cyan-400/15 bg-[rgba(4,18,37,0.6)] px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-sm text-slate-400">{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-xl font-semibold text-white">{count}</span>
        <span className="text-xs text-slate-500">{formatFileSize(size)}</span>
      </div>
    </div>
  );

  if (!projectId) {
    return (
      <div className="flex h-[360px] items-center justify-center text-slate-400">请先选择项目</div>
    );
  }

  return (
    <div className="flex h-full min-h-[360px] flex-col gap-4">
      {/* 统计区域 */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard icon="📁" label="全部文件" count={stats.totalFiles} size={stats.totalSize} />
          {stats.categories.map((cat) => (
            <StatCard
              key={cat.category}
              icon={FILE_CATEGORY_ICONS[cat.category]}
              label={FILE_CATEGORY_LABELS[cat.category]}
              count={cat.count}
              size={cat.totalSize}
            />
          ))}
        </div>
      )}

      {/* 操作栏 */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => void handleFileSelect(e)}
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="h-9 rounded-none border border-cyan-400/20 bg-cyan-500/20 px-4 text-cyan-100 hover:bg-cyan-500/30"
        >
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? "上传中..." : "上传文件"}
        </Button>

        <div className="flex flex-1 items-center gap-2">
          <select
            value={category ?? "all"}
            onChange={(e) =>
              setCategory(e.target.value === "all" ? undefined : (e.target.value as FileCategory))
            }
            className="h-9 w-[140px] rounded-none border border-cyan-400/20 bg-transparent px-3 text-sm text-slate-200 outline-none focus:border-cyan-400/50"
          >
            <option value="all" className="bg-[#03112a]">
              全部分类
            </option>
            {Object.entries(FILE_CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key} className="bg-[#03112a]">
                {FILE_CATEGORY_ICONS[key as FileCategory]} {label}
              </option>
            ))}
          </select>

          <div className="relative flex-1 max-w-[300px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="搜索文件名..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="h-9 rounded-none border-cyan-400/20 bg-transparent pl-9 text-slate-200 placeholder:text-slate-500"
            />
            {keyword && (
              <button
                onClick={() => setKeyword("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {(category || keyword) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-9 text-slate-400 hover:text-slate-200"
            >
              清除筛选
            </Button>
          )}
        </div>
      </div>

      {/* 上传进度 */}
      {uploadProgress.length > 0 && (
        <div className="space-y-2 rounded border border-cyan-400/15 bg-[rgba(4,18,37,0.6)] p-3">
          <span className="text-xs font-medium text-slate-400">上传进度</span>
          {uploadProgress.map((p) => (
            <div key={p.fileId} className="flex items-center gap-3">
              <span className="w-32 truncate text-xs text-slate-300">{p.fileName}</span>
              <div className="flex-1">
                <div className="h-1.5 rounded-full bg-slate-700">
                  <div
                    className="h-full rounded-full bg-cyan-500 transition-all"
                    style={{ width: `${p.percent}%` }}
                  />
                </div>
              </div>
              <span className="w-12 text-right text-xs text-slate-400">{p.percent}%</span>
              {p.status === "error" && <span className="text-xs text-red-400">失败</span>}
            </div>
          ))}
        </div>
      )}

      {/* 文件列表 */}
      <div className="flex-1 overflow-auto rounded border border-cyan-400/15 bg-[rgba(4,18,37,0.82)]">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-slate-400">
            {keyword ? "未找到匹配的文件" : "暂无文件，点击上方按钮上传"}
          </div>
        ) : (
          <div className="divide-y divide-cyan-400/10">
            {files.map((file) => (
              <div
                key={file.id}
                className={`flex items-center gap-3 px-4 py-3 transition hover:bg-[rgba(8,34,67,0.5)] ${
                  selectedFileId === file.id ? "bg-[rgba(8,34,67,0.5)]" : ""
                }`}
                onClick={() => setSelectedFileId(file.id)}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-slate-800">
                  {file.thumbnailUrl ? (
                    <img
                      src={file.thumbnailUrl}
                      alt=""
                      className="h-full w-full rounded object-cover"
                    />
                  ) : (
                    getFileIcon(file.type, file.category)
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm text-slate-200">{file.name}</span>
                    {file.version && file.version > 1 && (
                      <span className="shrink-0 rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] text-cyan-300">
                        v{file.version}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{formatFileSize(file.size)}</span>
                    <span>{FILE_CATEGORY_LABELS[file.category]}</span>
                    <span>{formatIsoDate(file.uploadedAt)}</span>
                    {file.uploadedBy && <span>{file.uploadedBy}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-cyan-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(file.url, "_blank");
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-red-400"
                    disabled={isDeleting}
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDelete(file.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="h-8 rounded-none border-cyan-400/20 bg-transparent text-slate-300 hover:bg-cyan-500/20"
          >
            上一页
          </Button>
          <span className="text-sm text-slate-400">
            {page} / {totalPages} (共 {total} 条)
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="h-8 rounded-none border-cyan-400/20 bg-transparent text-slate-300 hover:bg-cyan-500/20"
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
}
