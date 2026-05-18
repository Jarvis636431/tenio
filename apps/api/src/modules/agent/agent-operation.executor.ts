import { Injectable, NotFoundException } from "@nestjs/common";
import { AgentOperationStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service.js";
import type { AuthenticatedRequestUser } from "../auth/auth.types.js";
import { AgentToolRegistry } from "./tools/agent-tool.registry.js";
import type { AgentToolExecutionResult } from "./tools/agent-tool.types.js";

export interface AgentOperationExecutionResult {
  operationId: string;
  result: AgentToolExecutionResult;
}

@Injectable()
export class AgentOperationExecutor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly toolRegistry: AgentToolRegistry,
  ) {}

  async executeApprovedOperation(
    currentUser: AuthenticatedRequestUser,
    operationId: string,
  ): Promise<AgentOperationExecutionResult> {
    const operation = await this.prisma.agentOperation.findFirst({
      where: {
        id: operationId,
        project: { ownerId: currentUser.id },
      },
    });

    if (!operation) {
      throw new NotFoundException(`Operation ${operationId} not found`);
    }

    await this.prisma.agentOperation.update({
      where: { id: operation.id },
      data: {
        operationStatus: AgentOperationStatus.RUNNING,
        errorCode: null,
        errorMessage: null,
      },
    });

    try {
      const inputRecord = this.asRecord(operation.inputPayloadJson);
      const content = this.getString(inputRecord, "content_text") ?? "";
      const tool = this.toolRegistry.resolveWriteTool(content);

      if (!tool) {
        throw new Error("当前未识别到可执行的写操作工具");
      }

      const result = await tool.execute({
        currentUser,
        projectId: operation.projectId,
        content,
      });

      await this.prisma.agentOperation.update({
        where: { id: operation.id },
        data: {
          operationType: tool.toolId,
          operationStatus: AgentOperationStatus.COMPLETED,
          requiresApproval: false,
          resultPayloadJson: {
            tool_id: tool.toolId,
            data: result.data ?? null,
          },
        },
      });

      return {
        operationId: operation.id,
        result,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Agent operation 执行失败";
      await this.prisma.agentOperation.update({
        where: { id: operation.id },
        data: {
          operationStatus: AgentOperationStatus.FAILED,
          requiresApproval: false,
          errorCode: "AGENT_TOOL_EXECUTION_FAILED",
          errorMessage: message,
        },
      });
      throw error;
    }
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private getString(record: Record<string, unknown>, key: string): string | undefined {
    const value = record[key];
    return typeof value === "string" ? value : undefined;
  }
}
