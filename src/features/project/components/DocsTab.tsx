import type { PlanTask } from "@/types/domain/plan";
import { FileText, Edit } from "lucide-react";
import { formatIsoDate } from "@/lib/date";

interface DocsTabProps {
  projectName: string;
  planTasks: PlanTask[];
  totalDurationLabel: string;
}

export function DocsTab({ projectName, planTasks, totalDurationLabel }: DocsTabProps) {
  const taskCount = planTasks.length;
  const criticalCount = planTasks.filter((t) => t.criticalPath).length;
  const keyTasks = planTasks.slice(0, 8);
  const methods = Array.from(
    new Set(planTasks.map((t) => t.constructionMethod).filter(Boolean)),
  ).slice(0, 6);

  return (
    <div className="flex h-full min-h-[520px] flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border border-cyan-400/18 bg-apm-card px-3 py-2">
        <span className="flex items-center gap-1.5 text-[11px] text-apm-muted">
          <FileText className="h-3.5 w-3.5 text-cyan-400" />
          施工组织设计文档
        </span>
        <button className="flex items-center gap-1 border border-cyan-400/18 px-2 py-1 text-[11px] text-apm-muted transition hover:border-cyan-400 hover:text-cyan-400">
          <Edit className="h-3 w-3" />
          编辑
        </button>
        <div className="flex-1" />
        <span className="text-[10px] text-apm-dim">
          约 {taskCount * 180 + 1240} 字 · {4 + Math.min(methods.length, 4)} 章节
        </span>
      </div>

      {/* Document body */}
      <div className="flex-1 overflow-y-auto border border-cyan-400/18 bg-[rgba(255,255,255,0.015)] px-5 py-6 text-[13px] leading-[1.95] text-[rgba(200,215,235,0.82)] lg:px-8 lg:py-7">
        <h1 className="border-b border-cyan-400/18 pb-3 text-center text-lg font-bold text-white">
          {projectName} 施工组织设计
        </h1>

        {/* TOC */}
        <div className="mb-5 border border-cyan-400/18 bg-[rgba(0,20,55,0.4)] p-4">
          <div className="mb-2 text-[11px] font-bold tracking-wider text-cyan-400">目 录</div>
          <ol className="ml-5 list-decimal space-y-1">
            <li className="cursor-pointer text-[12px] text-apm-muted transition hover:text-cyan-400">
              工程概况
            </li>
            <li className="cursor-pointer text-[12px] text-apm-muted transition hover:text-cyan-400">
              施工部署
            </li>
            <li className="cursor-pointer text-[12px] text-apm-muted transition hover:text-cyan-400">
              施工进度计划
            </li>
            <li className="cursor-pointer text-[12px] text-apm-muted transition hover:text-cyan-400">
              主要施工方案
            </li>
          </ol>
        </div>

        {/* Chapter 1 */}
        <h2 className="mb-2 mt-5 flex items-center gap-2 text-sm font-bold text-cyan-400">
          <span className="inline-block h-3.5 w-0.5 bg-cyan-400" />
          一、工程概况
        </h2>
        <p className="mb-3 indent-8">
          本项目为 <strong className="text-cyan-100">{projectName}</strong>， 总工期约{" "}
          <strong className="text-cyan-100">{totalDurationLabel || "—"}</strong>。
          施工内容涵盖基础工程、主体结构、装饰装修及机电安装等阶段。 项目共计{" "}
          <strong className="text-cyan-100">{taskCount}</strong> 道工序， 关键线路工序{" "}
          <strong className="text-cyan-100">{criticalCount}</strong> 项。
        </p>

        {/* Chapter 2 */}
        <h2 className="mb-2 mt-5 flex items-center gap-2 text-sm font-bold text-cyan-400">
          <span className="inline-block h-3.5 w-0.5 bg-cyan-400" />
          二、施工部署
        </h2>
        <p className="mb-3 indent-8">
          根据工程特点及工期要求，项目采用平行流水施工组织方式。
          关键线路优先保障资源投入，非关键线路合理利用总时差进行资源均衡。
          主要施工阶段划分为：施工准备、基础工程、主体结构、二次结构、装饰装修及竣工验收。
        </p>

        {/* Chapter 3 */}
        <h2 className="mb-2 mt-5 flex items-center gap-2 text-sm font-bold text-cyan-400">
          <span className="inline-block h-3.5 w-0.5 bg-cyan-400" />
          三、施工进度计划
        </h2>
        <p className="mb-3 indent-8">
          施工进度计划以关键线路为主线，综合考虑工序衔接、资源供应及现场条件编制。
          以下为主要工序节点：
        </p>
        <div className="mb-4 overflow-x-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="bg-cyan-400/[0.07]">
                <th className="border border-cyan-400/18 px-2 py-1.5 font-semibold text-cyan-400">
                  序号
                </th>
                <th className="border border-cyan-400/18 px-2 py-1.5 font-semibold text-cyan-400">
                  工序名称
                </th>
                <th className="border border-cyan-400/18 px-2 py-1.5 font-semibold text-cyan-400">
                  开始时间
                </th>
                <th className="border border-cyan-400/18 px-2 py-1.5 font-semibold text-cyan-400">
                  结束时间
                </th>
                <th className="border border-cyan-400/18 px-2 py-1.5 font-semibold text-cyan-400">
                  工期
                </th>
              </tr>
            </thead>
            <tbody>
              {keyTasks.map((task, idx) => (
                <tr key={task.id} className="even:bg-cyan-400/[0.02]">
                  <td className="border border-cyan-400/[0.09] px-2 py-1.5 text-center">
                    {task.seqNo ?? idx + 1}
                  </td>
                  <td className="border border-cyan-400/[0.09] px-2 py-1.5">{task.task}</td>
                  <td className="border border-cyan-400/[0.09] px-2 py-1.5">
                    {task.startTime ? formatIsoDate(task.startTime) : "—"}
                  </td>
                  <td className="border border-cyan-400/[0.09] px-2 py-1.5">
                    {task.endTime ? formatIsoDate(task.endTime) : "—"}
                  </td>
                  <td className="border border-cyan-400/[0.09] px-2 py-1.5 text-center">
                    {task.duration || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Chapter 4 */}
        <h2 className="mb-2 mt-5 flex items-center gap-2 text-sm font-bold text-cyan-400">
          <span className="inline-block h-3.5 w-0.5 bg-cyan-400" />
          四、主要施工方案
        </h2>
        <p className="mb-3 indent-8">
          根据 AI 对招标文件及施工图纸的解析，推荐采用以下主要施工方法：
        </p>
        <ul className="mb-4 ml-8 list-disc space-y-1">
          {methods.map((m) => (
            <li key={m}>{m}</li>
          ))}
          {methods.length === 0 && <li>按常规施工工艺组织施工</li>}
        </ul>
      </div>
    </div>
  );
}
