import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from "@nestjs/common";
import type { Observable } from "rxjs";
import { map } from "rxjs/operators";
import type { ApiResponse } from "@tenio/shared";

type HttpResponseLike = {
  statusCode?: number;
};

function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return "data" in record && ("success" in record || "timestamp" in record || "message" in record);
}

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<unknown>> {
    const response = context.switchToHttp().getResponse<HttpResponseLike>();

    return next.handle().pipe(
      map((payload: unknown) => {
        if (isApiResponse(payload)) {
          return payload;
        }

        return {
          data: payload ?? null,
          message: "ok",
          status: String(response.statusCode ?? 200),
          success: true,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
