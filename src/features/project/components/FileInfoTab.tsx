import { useMemo } from "react";
import { useUploads, FILE_CATEGORY_LABELS } from "@/features/upload";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, X, CheckCircle, Eye, Wand2 } from "lucide-react";
import { formatFileSize } from "@/lib/utils";
import { formatIsoDate } from "@/lib/date";

interface FileInfoTabProps {
  projectId: string | null | undefined;
  projectSummary?: {
    projectName: string;
    planTaskCount: number;
    totalDurationLabel: string;
  };
  onViewResults?: () => void;
}

interface InfoCardProps {
  label: string;
  value: React.ReactNode;
  sub: string;
}

function InfoCard({ label, value, sub }: InfoCardProps) {
  return (
    <div className="relative border border-cyan-400/18 bg-[rgba(4,18,37,0.85)] px-3.5 py-3">
      <span className="absolute left-0 top-0 h-full w-0.5 bg-gradient-to-b from-cyan-400 to-transparent" />
      <div className="mb-[5px] text-[9px] font-semibold uppercase tracking-[0.15em] text-cyan-400/50">
        {label}
      </div>
      <div className="mb-0.5 text-sm font-bold text-white">{value}</div>
      <div className="text-[10px] text-slate-400">{sub}</div>
    </div>
  );
}

function isParsed(status?: string) {
  const value = status?.toLowerCase() ?? "";
  return value === "succeeded" || value === "completed" || value.includes("完成");
}

function isParseFailed(status?: string) {
  const value = status?.toLowerCase() ?? "";
  return value === "failed" || value === "error" || value.includes("失败");
}

export function FileInfoTab({ projectId, projectSummary, onViewResults }: FileInfoTabProps) {
  const { files, total, isLoading } = useUploads({ projectId, pageSize: 10 });

  const latestFile = files[0];
  const hasFile = files.length > 0;
  const taskCount = projectSummary?.planTaskCount ?? 0;
  const duration = projectSummary?.totalDurationLabel ?? "—";
  const hasGeneratedArtifacts = taskCount > 0 || (duration !== "—" && duration.trim() !== "");
  const latestFileParsed = latestFile ? isParsed(latestFile.parseStatus) : false;
  const latestFileParseFailed = latestFile ? isParseFailed(latestFile.parseStatus) : false;
  const fileStatusLabel = latestFileParseFailed
    ? "解析失败"
    : latestFileParsed
      ? "解析成功"
      : latestFile?.parseStatus
        ? "解析中"
        : "已上传";
  const fileStatusClass = latestFileParseFailed
    ? "text-red-300"
    : latestFileParsed
      ? "text-emerald-400"
      : "text-cyan-300";
  const generatedTagCount = taskCount > 0 ? taskCount : "—";
  const infoCards = useMemo(
    () => [
      {
        label: "项目名称",
        value: (
          <span className="block text-xs leading-snug">{projectSummary?.projectName || "—"}</span>
        ),
        sub: hasGeneratedArtifacts ? "建设工程施工" : "等待 AI 提取",
      },
      {
        label: "建设规模",
        value: "—",
        sub: "建筑面积（约）",
      },
      {
        label: "合同工期",
        value: duration,
        sub: "质量要求：—",
      },
      {
        label: "发包价",
        value: "—",
        sub: "控制价 —",
      },
      {
        label: "招标人",
        value: "—",
        sub: "联系人：—",
      },
      {
        label: "资质要求",
        value: "—",
        sub: "建筑工程施工",
      },
      {
        label: "资金来源",
        value: "—",
        sub: "待提取",
      },
      {
        label: "评标方式",
        value: "—",
        sub: "资格后审",
      },
    ],
    [duration, hasGeneratedArtifacts, projectSummary?.projectName],
  );

  if (!projectId) {
    return (
      <div className="flex h-[360px] items-center justify-center text-slate-400">请先选择项目</div>
    );
  }

  return (
    <div className="flex h-full min-h-[360px] flex-col gap-4">
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[72px] w-full" />
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-[86px] w-full" />
            ))}
          </div>
          <Skeleton className="h-[128px] w-full" />
        </div>
      ) : !hasFile || !latestFile ? (
        <div className="flex h-[260px] items-center justify-center border border-cyan-400/18 bg-[rgba(4,18,37,0.55)] text-sm text-slate-400">
          暂无已上传资料
        </div>
      ) : (
        <>
          <div className="flex items-center gap-[13px] border border-emerald-400/30 bg-emerald-500/[0.06] px-4 py-[13px]">
            <FileText className="h-[22px] w-[22px] shrink-0 text-emerald-400" />
            <div className="min-w-0 flex-1">
              <div className="mb-[3px] truncate text-[13px] font-semibold text-white">
                {latestFile.name}
              </div>
              <div className="text-[11px] text-slate-400">
                {formatFileSize(latestFile.size)} · {FILE_CATEGORY_LABELS[latestFile.category]} ·
                上传于 {formatIsoDate(latestFile.uploadedAt)}
              </div>
            </div>
            <div
              className={`ml-auto flex shrink-0 items-center gap-[5px] text-[11px] font-semibold ${fileStatusClass}`}
            >
              {latestFileParseFailed ? (
                <X className="h-3.5 w-3.5" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5" />
              )}
              {fileStatusLabel}
            </div>
          </div>

          <div>
            <div className="mb-[9px] flex items-center text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
              <Wand2 className="mr-[5px] h-3 w-3 text-cyan-400" />
              AI 自动提取的项目信息
            </div>
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              {infoCards.map((card) => (
                <InfoCard key={card.label} label={card.label} value={card.value} sub={card.sub} />
              ))}
            </div>
          </div>

          <div className="relative flex flex-col gap-[18px] border border-cyan-400/18 bg-[linear-gradient(135deg,rgba(0,40,100,0.35),rgba(0,20,55,0.45))] px-[22px] py-[18px] sm:flex-row sm:items-center">
            <span className="absolute left-0 right-0 top-0 h-0.5 bg-gradient-to-r from-cyan-400 via-cyan-400/20 to-transparent" />
            <div className="min-w-0 flex-1">
              <div className="mb-1 text-[15px] font-bold text-white">
                <CheckCircle className="mr-[7px] inline h-4 w-4 text-emerald-400" />
                {hasGeneratedArtifacts ? "AI 已完成全部生成" : "AI 正在生成施工组织设计"}
              </div>
              <div className="text-xs text-slate-400">
                基于招标文件自动生成完整施工组织设计，包含进度计划、甘特图、网络图、人员轮转
              </div>
              <div className="mt-[9px] flex flex-wrap gap-[7px]">
                {[
                  `施工组织设计（${taskCount > 0 ? Math.floor(taskCount * 200) : "—"}字）`,
                  `进度计划（${generatedTagCount}项）`,
                  `甘特图（${duration || "—"}）`,
                  "网络图",
                  `人员轮转（${total > 0 ? total : "—"}份资料）`,
                ].map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 border border-cyan-400/18 px-[9px] py-[3px] text-[10px] font-medium text-slate-400"
                  >
                    <span className="h-[5px] w-[5px] rounded-full bg-emerald-400" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <Button
              onClick={onViewResults}
              disabled={!hasGeneratedArtifacts}
              className="shrink-0 rounded-none bg-[linear-gradient(135deg,#00d4ff,#0099ff)] px-7 py-[13px] text-[13px] font-bold text-[#020c1b] hover:opacity-90 disabled:opacity-40"
            >
              <Eye className="mr-[7px] h-4 w-4" />
              查看生成结果
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
