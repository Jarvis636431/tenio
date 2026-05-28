# A.PM API Contract

当前契约面向未上线阶段，允许破坏性调整。所有业务 JSON 字段统一使用 `snake_case`。

## 通用响应

成功响应：

```json
{
  "data": {},
  "message": "ok",
  "status": "200",
  "success": true,
  "timestamp": "2026-05-28T09:00:00.000Z"
}
```

错误响应：

```json
{
  "data": null,
  "message": "Project p-001 not found",
  "status": "404",
  "code": "HTTP_404",
  "success": false,
  "timestamp": "2026-05-28T09:00:00.000Z"
}
```

## 字段命名规则

- 当前资源主键统一为 `id`。
- 关联资源主键使用 `{resource}_id`，例如 `project_id`、`session_id`。
- 状态字段统一为 `status`。
- 类型字段统一为 `type`。
- 时间字段统一为 ISO 字符串，并使用 `_at` 后缀。
- 文件存储内部字段不对外暴露，例如 `storage_bucket`、`storage_key`、`stored_file_name`。

## Auth

`POST /api/auth/sms/send`

Request:

```json
{ "phone": "13800000000" }
```

`POST /api/auth/login/sms`

`POST /api/auth/login/password`

Response data:

```json
{
  "user": {
    "id": "user-001",
    "phone": "13800000000",
    "display_name": "张三",
    "avatar_url": null,
    "profile_completed": true,
    "created_at": "2026-05-28T09:00:00.000Z",
    "updated_at": "2026-05-28T09:00:00.000Z"
  },
  "access_token": "jwt",
  "refresh_token": "jwt",
  "expires_at": "2026-05-28T10:00:00.000Z"
}
```

`POST /api/auth/refresh`

`POST /api/auth/logout`

`POST /api/auth/setup-profile`

`GET /api/me`

## Projects

Project:

```json
{
  "id": "project-001",
  "name": "城南综合体",
  "status": "draft",
  "created_at": "2026-05-28T09:00:00.000Z",
  "updated_at": "2026-05-28T09:00:00.000Z"
}
```

Status values: `draft`、`uploading`、`generating`、`active`、`failed`、`archived`。

`GET /api/projects?status=active&q=城南&page=1&page_size=20`

Response data:

```json
{ "items": [], "total": 0, "page": 1, "page_size": 20 }
```

`GET /api/projects/:project_id`

`POST /api/projects`

Request:

```json
{ "name": "城南综合体", "source_type": "manual_create" }
```

`GET /api/projects/metrics`

## Files

ProjectFile:

```json
{
  "id": "file-001",
  "project_id": "project-001",
  "original_name": "contract.pdf",
  "mime_type": "application/pdf",
  "size_bytes": 1200,
  "category": "contract",
  "status": "uploaded",
  "created_at": "2026-05-28T09:00:00.000Z",
  "updated_at": "2026-05-28T09:00:00.000Z"
}
```

Category values: `model`、`drawing`、`schedule`、`bill`、`contract`、`site_photo`、`other`。

Status values: `pending`、`uploading`、`uploaded`、`processing`、`ready`、`failed`。

`POST /api/projects/:project_id/uploads/init`

Request:

```json
{
  "original_name": "contract.pdf",
  "size_bytes": 1200,
  "mime_type": "application/pdf",
  "category": "contract"
}
```

Response data:

```json
{
  "file": {},
  "upload": {
    "url": "https://upload.example.com/object",
    "method": "PUT",
    "headers": {},
    "expires_at": "2026-05-28T09:15:00.000Z"
  }
}
```

`POST /api/projects/:project_id/uploads/complete`

Request:

```json
{ "id": "file-001" }
```

`GET /api/projects/:project_id/files`

`GET /api/projects/:project_id/files/:file_id`

`GET /api/projects/:project_id/files/:file_id/download-url`

`DELETE /api/projects/:project_id/files/:file_id`

Delete response data:

```json
{ "id": "file-001" }
```

## Artifacts

Artifact base:

```json
{
  "id": "artifact-001",
  "project_id": "project-001",
  "type": "schedule",
  "version": 1,
  "status": "ready",
  "title": "施工进度计划",
  "generated_at": "2026-05-28T09:00:00.000Z",
  "source": "generation"
}
```

Type values: `document`、`schedule`、`time_cost`、`crew_plan`。

`GET /api/projects/:project_id/artifacts`

`GET /api/projects/:project_id/artifacts/document/latest`

`GET /api/projects/:project_id/artifacts/graph/latest`

备注：当前路由仍使用历史路径 `graph/latest`，返回体 `type` 已统一为 `schedule`。

`GET /api/projects/:project_id/artifacts/time-cost/latest`

`GET /api/projects/:project_id/artifacts/crew-plan/latest`

`GET /api/projects/:project_id/workbench/upload-summary`

## Generation

`POST /api/projects/:project_id/generation/start`

Request:

```json
{ "trigger_source": "manual" }
```

Response data:

```json
{
  "id": "job-001",
  "project_id": "project-001",
  "status": "pending",
  "progress_percent": 0,
  "started_at": null
}
```

`GET /api/projects/:project_id/generation/status`

Response data:

```json
{
  "id": "job-001",
  "project_id": "project-001",
  "status": "running",
  "progress_percent": 40,
  "current_step": {
    "code": "build_schedule",
    "name": "生成进度计划",
    "order": 2,
    "status": "running",
    "started_at": "2026-05-28T09:00:00.000Z",
    "finished_at": null
  },
  "steps": [],
  "started_at": "2026-05-28T09:00:00.000Z",
  "finished_at": null,
  "error": null
}
```

`POST /api/projects/:project_id/generation/cancel`

`POST /api/projects/:project_id/generation/regenerate`

Request:

```json
{ "types": ["schedule", "document"], "reason": "文件更新后重算" }
```

## Agent

AgentSession:

```json
{
  "id": "session-001",
  "title": "方案讨论",
  "status": "active",
  "last_message_at": null
}
```

AgentMessage:

```json
{
  "id": "message-001",
  "role": "assistant",
  "type": "text",
  "content": "已收到你的消息。",
  "sent_at": "2026-05-28T09:00:00.000Z"
}
```

`POST /api/projects/:project_id/agent/sessions`

`GET /api/projects/:project_id/agent/sessions`

`GET /api/projects/:project_id/agent/tools`

`GET /api/projects/:project_id/agent/sessions/:session_id/messages`

Response data:

```json
{ "session_id": "session-001", "messages": [] }
```

`POST /api/projects/:project_id/agent/sessions/:session_id/messages`

Request:

```json
{ "content": "压缩工期" }
```

Response data:

```json
{
  "id": "message-001",
  "role": "user",
  "type": "text",
  "content": "压缩工期",
  "sent_at": "2026-05-28T09:00:00.000Z",
  "stream_id": "stream-001"
}
```

`GET /api/projects/:project_id/agent/streams/:stream_id/sse`

SSE event data:

```json
{ "type": "message.delta", "content": "处理中" }
```

```json
{ "type": "artifact.refresh_required", "operation_id": "op-001", "types": ["schedule"] }
```

`GET /api/projects/:project_id/operations/:operation_id`

Response data:

```json
{
  "id": "op-001",
  "project_id": "project-001",
  "status": "waiting_approval",
  "error_code": null,
  "error_message": null
}
```

## Health

`GET /api/health`

