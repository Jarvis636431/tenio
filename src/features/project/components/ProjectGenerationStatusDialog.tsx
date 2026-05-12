import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Loader2, X, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useGenerationStore } from "@/stores/generationStore";
import {
  cancelProjectGeneration,
  deleteProject,
  getProjectGenerationStatus,
} from "../services/project-api";
import { projectQueryKeys } from "../queryKeys";

const POLL_INTERVAL_MS = 2000;
const MAX_GENERATION_POLL_ATTEMPTS = 900;
const FALLBACK_GENERATION_STEPS = [
  "解析上传文件",
  "提取项目计划",
  "生成施工方案",
  "同步工作台成果",
];

function isGenerationDone(status?: string) {
  const value = status?.toLowerCase() ?? "";
  return value === "succeeded" || value === "completed";
}

function isGenerationFailed(status?: string) {
  return status?.toLowerCase() === "failed";
}

function isStepDone(status?: string) {
  const value = status?.toLowerCase() ?? "";
  return value === "succeeded" || value === "completed" || value.includes("完成");
}

function isStepRunning(status?: string) {
  const value = status?.toLowerCase() ?? "";
  return value === "running" || value === "processing" || value.includes("进行");
}

function getDialogTitle(status?: string, hasError?: boolean) {
  if (hasError || isGenerationFailed(status)) return "项目生成失败";
  if (isGenerationDone(status)) return "项目生成完成";
  return "AI 正在生成项目";
}

function getDialogDescription(status?: string, hasError?: boolean) {
  if (hasError || isGenerationFailed(status)) return "生成流程已停止，请检查错误信息后重试。";
  if (isGenerationDone(status)) return "施工组织设计方案已生成，可以进入项目工作台查看。";
  return "可停留在控制台，系统会持续同步生成进度。";
}

function waitForNextPoll(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timeoutId = window.setTimeout(resolve, POLL_INTERVAL_MS);
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timeoutId);
        reject(new DOMException("生成轮询已取消", "AbortError"));
      },
      { once: true },
    );
  });
}

/**
 * 在项目控制台常显展示上传后 AI 生成任务状态，并负责最长 30 分钟轮询。
 *
 * @returns 控制台生成状态弹窗
 */
export function ProjectGenerationStatusDialog() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const task = useGenerationStore((state) => state.task);
  const updateGeneration = useGenerationStore((state) => state.updateGeneration);
  const failGeneration = useGenerationStore((state) => state.failGeneration);
  const clearGeneration = useGenerationStore((state) => state.clearGeneration);
  const [isCanceling, setIsCanceling] = useState(false);

  const isRunning = Boolean(task && !isGenerationDone(task.generationStatus) && !task.errorMessage);
  const pollingProjectId = isRunning ? task?.projectId : undefined;
  const progressValue =
    task?.progressPercent ?? (isGenerationDone(task?.generationStatus) ? 100 : 8);
  const displaySteps = useMemo(() => {
    if (!task) return [];
    if (task.steps.length > 0) {
      return task.steps
        .slice()
        .sort((a, b) => a.step_order - b.step_order)
        .map((step) => ({
          key: step.step_code,
          label: step.step_name,
          status: step.step_status,
        }));
    }
    return FALLBACK_GENERATION_STEPS.map((step, index) => ({
      key: `fallback-${index}`,
      label: step,
      status: index === 0 ? "running" : "pending",
    }));
  }, [task]);

  useEffect(() => {
    if (!pollingProjectId) return;

    const abortController = new AbortController();

    async function pollGenerationStatus() {
      try {
        for (let attempt = 0; attempt < MAX_GENERATION_POLL_ATTEMPTS; attempt += 1) {
          if (abortController.signal.aborted) return;

          const status = await getProjectGenerationStatus(pollingProjectId);
          if (abortController.signal.aborted) return;

          updateGeneration({
            generationJobId: status.generation_job_id,
            generationStatus: status.generation_status,
            currentStepName: status.current_step_name,
            progressPercent: status.step_progress_percent,
            steps: status.steps ?? [],
            errorMessage: status.error_message ?? null,
          });

          if (isGenerationDone(status.generation_status)) {
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ["projects"] }),
              queryClient.invalidateQueries({
                queryKey: projectQueryKeys.generationStatus(pollingProjectId),
              }),
              queryClient.invalidateQueries({
                queryKey: projectQueryKeys.graphArtifact(pollingProjectId),
              }),
              queryClient.invalidateQueries({
                queryKey: projectQueryKeys.documentArtifact(pollingProjectId),
              }),
              queryClient.invalidateQueries({
                queryKey: projectQueryKeys.timeCostArtifact(pollingProjectId),
              }),
              queryClient.invalidateQueries({
                queryKey: projectQueryKeys.crewPlanArtifact(pollingProjectId),
              }),
              queryClient.invalidateQueries({
                queryKey: projectQueryKeys.uploadSummary(pollingProjectId),
              }),
            ]);
            return;
          }

          if (isGenerationFailed(status.generation_status)) {
            failGeneration(status.error_message ?? "生成失败，请稍后重试");
            return;
          }

          await waitForNextPoll(abortController.signal);
        }

        failGeneration("生成超时，请稍后在项目工作台查看结果");
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        failGeneration(error instanceof Error ? error.message : "生成状态查询失败");
      }
    }

    void pollGenerationStatus();

    return () => {
      abortController.abort();
    };
  }, [failGeneration, pollingProjectId, queryClient, updateGeneration]);

  if (!task) return null;

  const hasError = Boolean(task.errorMessage) || isGenerationFailed(task.generationStatus);
  const isDone = isGenerationDone(task.generationStatus);

  const handleCancelGeneration = async () => {
    if (!task || isCanceling) return;

    setIsCanceling(true);
    try {
      await cancelProjectGeneration(task.projectId);
      if (task.deleteProjectOnCancel !== false) {
        await deleteProject(task.projectId);
      }
      clearGeneration();
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    } catch (error) {
      failGeneration(error instanceof Error ? error.message : "取消生成失败，请稍后重试");
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <Dialog open>
      <DialogContent
        hideCloseButton={isRunning}
        className="max-w-[460px] rounded-none border border-cyan-400/25 bg-[rgba(4,18,37,0.96)] p-0 text-white shadow-2xl shadow-cyan-950/40"
      >
        <div className="border-b border-cyan-400/15 px-6 py-5">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="font-display text-xl font-bold">
              {getDialogTitle(task.generationStatus, hasError)}
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-apm-muted">
              {task.errorMessage ?? getDialogDescription(task.generationStatus, hasError)}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center border",
                hasError
                  ? "border-red-400/30 bg-red-500/10 text-red-300"
                  : isDone
                    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                    : "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
              )}
            >
              {hasError ? (
                <XCircle className="h-5 w-5" />
              ) : isDone ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">
                {task.currentStepName ?? "等待生成进度"}
              </div>
              <div className="mt-1 text-xs text-apm-muted">项目 ID：{task.projectId}</div>
            </div>
          </div>

          <Progress value={progressValue} className="h-2 bg-cyan-950/70" />

          <div className="space-y-2">
            {displaySteps.map((step) => {
              const done = isStepDone(step.status);
              const running = !hasError && !isDone && isStepRunning(step.status);
              return (
                <div
                  key={step.key}
                  className={cn(
                    "flex min-h-7 items-center gap-3 text-sm",
                    done ? "text-emerald-300" : running ? "text-cyan-300" : "text-slate-500",
                  )}
                >
                  {done ? (
                    <CheckCircle className="h-4 w-4 shrink-0" />
                  ) : running ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  ) : (
                    <div className="h-1.5 w-1.5 shrink-0 bg-slate-600" />
                  )}
                  <span className="truncate">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {isRunning && (
          <div className="flex justify-end border-t border-cyan-400/15 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              disabled={isCanceling}
              onClick={() => {
                void handleCancelGeneration();
              }}
              className="border-red-400/30 bg-red-500/5 text-red-100 hover:border-red-400/60 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCanceling ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <X className="mr-2 h-4 w-4" />
              )}
              取消生成
            </Button>
          </div>
        )}

        {!isRunning && (
          <div className="flex justify-end gap-3 border-t border-cyan-400/15 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={clearGeneration}
              className="border-cyan-400/25 bg-transparent text-cyan-100 hover:border-cyan-400/60 hover:bg-cyan-400/10"
            >
              留在控制台
            </Button>
            {isDone && (
              <Button
                type="button"
                onClick={() => {
                  clearGeneration();
                  navigate(`/project/${task.projectId}`);
                }}
                className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
              >
                进入项目
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
