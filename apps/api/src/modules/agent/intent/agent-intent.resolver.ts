import { Injectable } from "@nestjs/common";
import type { AgentIntent } from "./agent-intent.types.js";

@Injectable()
export class AgentIntentResolver {
  resolve(content: string): AgentIntent | null {
    const normalized = content.trim();
    if (!normalized) {
      return null;
    }

    const projectName = this.extractProjectName(normalized);
    if (projectName) {
      return {
        intentType: "update_project_name",
        rawText: normalized,
        projectName,
      };
    }

    const fileName = this.extractFileName(normalized);
    if (fileName) {
      return {
        intentType: "delete_project_file",
        rawText: normalized,
        fileName,
      };
    }

    if (/(激活项目|启用项目|恢复项目|设为进行中|设为活跃)/.test(normalized)) {
      return { intentType: "activate_project", rawText: normalized };
    }

    if (/(归档项目|归档当前项目|archive project)/i.test(normalized)) {
      return { intentType: "archive_project", rawText: normalized };
    }

    if (/(项目概况|项目情况|项目状态|项目上下文|项目信息)/.test(normalized)) {
      return { intentType: "get_project_context", rawText: normalized };
    }

    if (/(文件列表|项目文件|上传文件|有哪些文件|列出文件)/.test(normalized)) {
      return { intentType: "list_project_files", rawText: normalized };
    }

    if (/(文档|施工组织设计|目录|章节|markdown)/i.test(normalized)) {
      return { intentType: "get_document_artifact", rawText: normalized };
    }

    if (/(网络图|关键路径|graph|计划图)/i.test(normalized)) {
      return { intentType: "get_graph_artifact", rawText: normalized };
    }

    if (/(时长成本|工期成本|time[\s_-]?cost|成本分析|推荐工期)/i.test(normalized)) {
      return { intentType: "get_time_cost_artifact", rawText: normalized };
    }

    if (/(班组计划|班组|劳动力计划|crew[\s_-]?plan)/i.test(normalized)) {
      return { intentType: "get_crew_plan_artifact", rawText: normalized };
    }

    if (/(产物|最新结果)/.test(normalized)) {
      return { intentType: "get_latest_artifacts", rawText: normalized };
    }

    return null;
  }

  private extractProjectName(content: string): string | null {
    if (!/(项目名称|项目名|项目).*(改成|改为|改名为|重命名为|命名为)/.test(content)) {
      return null;
    }

    const quotedMatch = content.match(/[“"'「](.+?)[”"'」]\s*$/);
    if (quotedMatch?.[1]) {
      return quotedMatch[1].trim();
    }

    const match = content.match(/(?:改成|改为|改名为|重命名为|命名为)\s*(.+)$/);
    if (!match?.[1]) {
      return null;
    }

    return match[1].trim().replace(/[。！!]+$/u, "");
  }

  private extractFileName(content: string): string | null {
    if (!/(删除文件|删除项目文件|移除文件|删掉文件)/.test(content)) {
      return null;
    }

    const quotedMatch = content.match(/[“"'「](.+?)[”"'」]/);
    if (quotedMatch?.[1]) {
      return quotedMatch[1].trim();
    }

    const match = content.match(/(?:删除文件|删除项目文件|移除文件|删掉文件)\s*(.+)$/);
    if (!match?.[1]) {
      return null;
    }

    return match[1].trim().replace(/[。！!]+$/u, "");
  }
}
