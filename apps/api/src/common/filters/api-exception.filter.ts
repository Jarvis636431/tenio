import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  type ExceptionFilter,
} from "@nestjs/common";
import type { ApiResponse } from "@tenio/shared";

type HttpResponseLike = {
  status(statusCode: number): {
    json(body: ApiResponse<null>): void;
  };
};

function extractErrorMessage(response: unknown): string {
  if (typeof response === "string") return response;

  if (response && typeof response === "object") {
    const record = response as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
    if (Array.isArray(record.message)) {
      return record.message.filter((item): item is string => typeof item === "string").join("; ");
    }
    if (typeof record.error === "string") return record.error;
  }

  return "服务器内部错误";
}

function extractErrorCode(response: unknown, statusCode: number): string {
  if (response && typeof response === "object") {
    const record = response as Record<string, unknown>;
    if (typeof record.code === "string") return record.code;
    if (typeof record.error === "string") return record.error;
  }

  return `HTTP_${statusCode}`;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<HttpResponseLike>();
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const errorResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;

    response.status(statusCode).json({
      data: null,
      message: extractErrorMessage(errorResponse),
      status: String(statusCode),
      code: extractErrorCode(errorResponse, statusCode),
      success: false,
      timestamp: new Date().toISOString(),
    });
  }
}
