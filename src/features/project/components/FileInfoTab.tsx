import { useMemo, useState } from "react";
import { useUploads, FILE_CATEGORY_LABELS } from "@/features/upload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, X, CheckCircle, Eye, Wand2 } from "lucide-react";
import { formatFileSize } from "@/lib/utils";
import { formatIsoDate } from "@/lib/date";
import type { WorkbenchProjectInfo } from "../types";
import type { ProjectFile } from "@/features/upload";

interface FileInfoTabProps {
  projectId: string | null | undefined;
  projectSummary?: {
    projectName: string;
    planTaskCount: number;
    totalDurationLabel: string;
  };
  projectInfo?: WorkbenchProjectInfo | null;
  onViewResults?: () => void;
}

interface InfoCardProps {
  label: string;
  value: string;
  sub: string;
  onOpen: () => void;
}

function InfoCard({ label, value, sub, onOpen }: InfoCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative min-h-[86px] w-full border border-white/[0.08] bg-[rgba(4,18,37,0.85)] px-3.5 py-3 text-left transition-colors hover:border-cyan-400/35 hover:bg-cyan-400/[0.08]"
    >
      <span className="absolute left-0 top-0 h-full w-0.5 bg-gradient-to-b from-cyan-400 to-transparent" />
      <div className="mb-[5px] text-[9px] font-semibold uppercase tracking-[0.15em] text-cyan-400/50">
        {label}
      </div>
      <div
        className="mb-0.5 overflow-hidden break-words text-sm font-bold leading-5 text-white"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
        }}
      >
        {value}
      </div>
      <div className="truncate text-[10px] text-slate-400">{sub}</div>
      <div className="mt-1 text-[10px] font-medium text-cyan-300/0 transition-colors group-hover:text-cyan-300/80">
        查看完整信息
      </div>
    </button>
  );
}

function isParsed(status?: string) {
  const value = status?.toLowerCase() ?? "";
  return (
    value === "parsed" || value === "succeeded" || value === "completed" || value.includes("完成")
  );
}

function isParseFailed(status?: string) {
  const value = status?.toLowerCase() ?? "";
  return value === "failed" || value === "error" || value.includes("失败");
}

function getFileRoleLabel(role?: string) {
  const labels: Record<string, string> = {
    bidding_document: "招标文件",
    construction_contract: "施工合同",
    bill_of_quantities: "工程量清单",
    cad_drawing: "CAD / BIM 图纸",
    supplementary_material: "补充资料",
    primary_contract: "合同文件",
    drawing: "图纸",
    bill_or_document: "清单 / 文档",
    supplement: "补充资料",
  };
  return role ? (labels[role] ?? role) : "未分类";
}

function getFileStatus(file: ProjectFile) {
  const parsed = isParsed(file.parseStatus);
  const failed = isParseFailed(file.parseStatus);
  const label = failed ? "解析失败" : parsed ? "解析成功" : file.parseStatus ? "解析中" : "已上传";
  const className = failed ? "text-red-300" : parsed ? "text-emerald-400" : "text-cyan-300";
  return { failed, label, className };
}

function formatText(value?: string | null) {
  const text = value?.trim();
  return text || "—";
}

function formatArea(value?: number | null) {
  if (!Number.isFinite(value ?? Number.NaN)) return "—";
  return `${Number(value).toLocaleString("zh-CN")}㎡`;
}

function formatDurationDays(value?: number | null, fallback?: string) {
  if (Number.isFinite(value ?? Number.NaN)) return `${value}天`;
  return fallback || "—";
}

function formatMoney(value?: number | null) {
  if (!Number.isFinite(value ?? Number.NaN)) return "—";
  const yuan = Number(value) / 100;
  if (Math.abs(yuan) >= 100000000) return `${(yuan / 100000000).toFixed(2)}亿元`;
  if (Math.abs(yuan) >= 10000) return `${(yuan / 10000).toFixed(2)}万元`;
  return `${yuan.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}元`;
}

export function FileInfoTab({
  projectId,
  projectSummary,
  projectInfo,
  onViewResults,
}: FileInfoTabProps) {
  const { files, total, isLoading } = useUploads({ projectId, pageSize: 100 });
  const [selectedInfoCard, setSelectedInfoCard] = useState<{
    label: string;
    value: string;
    sub: string;
  } | null>(null);

  const hasFile = files.length > 0;
  const taskCount = projectSummary?.planTaskCount ?? 0;
  const generatedDuration = projectSummary?.totalDurationLabel ?? "—";
  const duration = formatDurationDays(projectInfo?.contract_duration_days, generatedDuration);
  const hasGeneratedArtifacts =
    taskCount > 0 || (generatedDuration !== "—" && generatedDuration.trim() !== "");
  const generatedTagCount = taskCount > 0 ? taskCount : "—";
  const infoCards = useMemo(
    () => [
      {
        label: "项目名称",
        value: formatText(projectInfo?.project_name ?? projectSummary?.projectName),
        sub: formatText(projectInfo?.project_subtitle ?? projectInfo?.location),
      },
      {
        label: "建设规模",
        value: formatArea(projectInfo?.building_area_sqm),
        sub: projectInfo?.building_area_sqm ? "建筑面积（约）" : "建筑面积：—",
      },
      {
        label: "合同工期",
        value: duration,
        sub: `质量要求：${formatText(projectInfo?.quality_standard)}`,
      },
      {
        label: "发包价",
        value: formatMoney(projectInfo?.contract_amount_cents),
        sub: `控制价 ${formatMoney(projectInfo?.control_amount_cents)}`,
      },
      {
        label: "招标人",
        value: formatText(projectInfo?.employer_name),
        sub: `联系人：${formatText(projectInfo?.employer_contact_name)}`,
      },
      {
        label: "资质要求",
        value: formatText(projectInfo?.qualification_requirement_text),
        sub: "资质要求",
      },
      {
        label: "资金来源",
        value: formatText(projectInfo?.funding_source),
        sub: projectInfo?.funding_source ? "已提取" : "待提取",
      },
      {
        label: "评标方式",
        value: formatText(projectInfo?.bid_evaluation_method),
        sub: "评标办法",
      },
    ],
    [
      duration,
      projectInfo?.bid_evaluation_method,
      projectInfo?.building_area_sqm,
      projectInfo?.contract_amount_cents,
      projectInfo?.control_amount_cents,
      projectInfo?.employer_contact_name,
      projectInfo?.employer_name,
      projectInfo?.funding_source,
      projectInfo?.location,
      projectInfo?.project_name,
      projectInfo?.project_subtitle,
      projectInfo?.quality_standard,
      projectInfo?.qualification_requirement_text,
      projectSummary?.projectName,
    ],
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
      ) : !hasFile ? (
        <div className="flex h-[260px] items-center justify-center border border-white/[0.08] bg-[rgba(4,18,37,0.55)] text-sm text-slate-400">
          暂无已上传资料
        </div>
      ) : (
        <>
          <div>
            <div className="mb-[9px] flex items-center justify-between">
              <div className="flex items-center text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                <FileText className="mr-[5px] h-3 w-3 text-cyan-400" />
                已上传资料
              </div>
              <div className="text-[10px] text-apm-dim">共 {total} 份</div>
            </div>
            <div className="space-y-2">
              {files.map((file) => {
                const status = getFileStatus(file);
                return (
                  <div
                    key={file.id}
                    className="flex items-center gap-[13px] border border-white/[0.08] bg-[rgba(4,18,37,0.72)] px-4 py-[13px]"
                  >
                    <FileText className="h-[22px] w-[22px] shrink-0 text-emerald-400" />
                    <div className="min-w-0 flex-1">
                      <div className="mb-[3px] truncate text-[13px] font-semibold text-white">
                        {file.name}
                      </div>
                      <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-slate-400">
                        <span>{formatFileSize(file.size)}</span>
                        <span>{FILE_CATEGORY_LABELS[file.category] ?? file.category}</span>
                        <span>{getFileRoleLabel(file.role)}</span>
                        <span>{file.extension?.toUpperCase() || file.type || "未知格式"}</span>
                        <span>上传于 {formatIsoDate(file.uploadedAt)}</span>
                        {file.parsedAt && <span>解析于 {formatIsoDate(file.parsedAt)}</span>}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {typeof file.pageCount === "number" && file.pageCount > 0 && (
                          <span className="border border-white/[0.08] px-1.5 py-0.5 text-[10px] text-apm-dim">
                            {file.pageCount} 页
                          </span>
                        )}
                        {typeof file.characterCount === "number" && file.characterCount > 0 && (
                          <span className="border border-white/[0.08] px-1.5 py-0.5 text-[10px] text-apm-dim">
                            {file.characterCount.toLocaleString()} 字
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      className={`ml-auto flex shrink-0 items-center gap-[5px] text-[11px] font-semibold ${status.className}`}
                    >
                      {status.failed ? (
                        <X className="h-3.5 w-3.5" />
                      ) : (
                        <CheckCircle className="h-3.5 w-3.5" />
                      )}
                      {status.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-[9px] flex items-center text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
              <Wand2 className="mr-[5px] h-3 w-3 text-cyan-400" />
              AI 自动提取的项目信息
            </div>
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              {infoCards.map((card) => (
                <InfoCard
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  sub={card.sub}
                  onOpen={() => setSelectedInfoCard(card)}
                />
              ))}
            </div>
          </div>

          <div className="relative flex flex-col gap-[18px] border border-white/[0.08] bg-[linear-gradient(135deg,rgba(0,40,100,0.35),rgba(0,20,55,0.45))] px-[22px] py-[18px] sm:flex-row sm:items-center">
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
                    className="inline-flex items-center gap-1 border border-white/[0.08] px-[9px] py-[3px] text-[10px] font-medium text-slate-400"
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

          <Dialog
            open={Boolean(selectedInfoCard)}
            onOpenChange={(open) => {
              if (!open) setSelectedInfoCard(null);
            }}
          >
            <DialogContent className="max-w-[560px] rounded-none border border-cyan-400/25 bg-[rgba(4,18,37,0.98)] text-white shadow-2xl shadow-cyan-950/40">
              <DialogHeader className="text-left">
                <DialogTitle className="font-display text-xl font-bold">
                  {selectedInfoCard?.label}
                </DialogTitle>
                <DialogDescription className="text-sm text-apm-muted">
                  AI 自动提取字段详情
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
                <div>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-400/70">
                    主要内容
                  </div>
                  <div className="whitespace-pre-wrap break-words border border-white/[0.08] bg-cyan-400/[0.04] px-4 py-3 text-sm leading-7 text-slate-100">
                    {selectedInfoCard?.value}
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-400/70">
                    补充信息
                  </div>
                  <div className="whitespace-pre-wrap break-words border border-white/[0.08] bg-cyan-400/[0.04] px-4 py-3 text-sm leading-7 text-slate-300">
                    {selectedInfoCard?.sub}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
