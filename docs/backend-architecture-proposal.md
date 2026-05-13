# A.PM Backend Architecture Proposal

## 1. 设计目标

本文档描述 A.PM 智能管理平台后端的推荐设计。目标不是追求“最炫的架构”，而是围绕当前业务形态建立一套可落地、可迭代、后续可平滑演进的后端方案。

当前系统的核心问题不是简单 CRUD，而是以下三类能力的组合：

- 事务型业务：登录、项目、文件、方案、状态流转
- 生成型业务：上传后触发长流程，生成 document、graph、time-cost、crew-plan 等产物
- 交互型业务：agent 会话、流式响应、中断确认、操作回写

因此，推荐架构不是一开始就微服务，而是：

- 模块化单体 `API Server`
- 独立 `Worker`
- 明确领域边界
- 显式建模 generation、artifact、operation、agent ticket/session

## 2. 推荐技术栈

### 2.1 主技术栈

- 语言：`Go`
- HTTP 框架：`Echo` 或 `Fiber`
- 数据库：`PostgreSQL`
- 缓存 / 临时状态：`Redis`
- 对象存储：`S3 / MinIO`
- 长任务编排：`Temporal`（优先）或 `Asynq`
- 全文检索：`PostgreSQL FTS`
- 内部服务通信：必要时使用 `gRPC`
- 前端通信：`HTTP/JSON + SSE`

### 2.2 选择理由

- `Go` 适合高并发 I/O、SSE、上传、长任务调度、外部服务编排
- `PostgreSQL` 适合强事务和版本化业务模型
- `Redis` 适合 ticket、短期状态、任务协调
- `Temporal` 适合可取消、可重试、可审计的长流程生成链路

## 3. 总体架构

### 3.1 部署形态

初期建议采用以下进程布局：

- `api-server`
- `worker`
- `postgres`
- `redis`
- `object-storage`

说明：

- `api-server` 负责同步接口、鉴权、会话管理、工作台聚合接口
- `worker` 负责 generation workflow、外部 AI / 解析服务编排、产物落库
- `object-storage` 用于文件上传和导出文档存储

### 3.2 设计原则

- 不一开始拆成微服务
- 先把领域边界设计清楚
- 长任务必须显式建模
- 所有生成产物必须版本化
- 所有 agent 写操作必须落成 operation
- 权限隔离优先于调用便利

## 4. 模块划分

### 4.1 iam

职责：

- 登录
- refresh token
- 用户资料
- 组织 / 角色

### 4.2 project

职责：

- 项目
- 文件元数据
- 施工方案
- 工作台聚合接口
- 产物元信息查询

### 4.3 generation

职责：

- 上传后启动长流程
- 调用解析、文档生成、图生成、成本分析、人员轮转等能力
- 跟踪 generation job / steps
- 写入 artifact version

### 4.4 agent

职责：

- agent ticket
- chat session
- stream
- interrupt / approval
- agent operation 回写

说明：

- 以上 4 个模块初期放在一个仓库、一个主服务内
- `generation` 的实际执行放在独立 `worker` 进程中

## 5. 核心领域模型

### 5.1 Project

关键字段：

- `project_id`
- `project_name`
- `status`
- `source_type`
- `active_scheme_id`
- `latest_generation_job_id`
- `created_by`
- `created_at`

### 5.2 File

关键字段：

- `file_id`
- `project_id`
- `file_category`
- `file_role`
- `upload_status`
- `parse_status`
- `storage_key`
- `content_hash`
- `uploaded_at`

说明：

- `content_hash` 用于去重和后续增量生成判断

### 5.3 GenerationJob

关键字段：

- `generation_job_id`
- `project_id`
- `generation_status`
- `current_step_code`
- `current_step_name`
- `step_progress_percent`
- `started_at`
- `finished_at`
- `error_code`
- `error_message`

状态建议：

- `pending`
- `running`
- `succeeded`
- `failed`
- `canceling`
- `canceled`

### 5.4 GenerationStep

关键字段：

- `generation_job_id`
- `step_code`
- `step_name`
- `step_order`
- `step_status`
- `step_started_at`
- `step_finished_at`

说明：

- 不建议把步骤列表全部塞到单个 JSON 字段中
- 单独建表更利于审计、追踪和统计

### 5.5 Artifact

公共字段：

- `artifact_id`
- `project_id`
- `artifact_type`
- `artifact_version`
- `artifact_status`
- `scheme_id`
- `generation_job_id`
- `created_at`

产物类型：

- `document`
- `graph`
- `time_cost`
- `crew_plan`

建议：

- 公共字段放统一 artifact 表
- 具体内容按类型拆独立表：
  - `document_artifacts`
  - `graph_artifacts`
  - `time_cost_artifacts`
  - `crew_plan_artifacts`

### 5.6 Scheme

关键字段：

- `scheme_id`
- `project_id`
- `scheme_name`
- `scheme_status`
- `created_by`
- `created_at`

说明：

- 施工方案必须是一等公民，否则后续版本化和重新生成会越来越混乱

### 5.7 AgentTicket

关键字段：

- `agent_ticket`
- `user_id`
- `project_id`
- `scopes`
- `expires_at`
- `refresh_after_seconds`

说明：

- ticket 是能力凭证，不等同于业务登录 token
- 只用于访问 agent-service 能力

### 5.8 ChatSession

关键字段：

- `chat_session_id`
- `project_id`
- `user_id`
- `session_status`
- `session_title`
- `last_message_at`

### 5.9 Operation

关键字段：

- `operation_id`
- `project_id`
- `operation_type`
- `operation_status`
- `requested_by`
- `source`
- `input_payload`
- `result_payload`
- `error_message`
- `created_at`

说明：

- 凡是 agent 触发业务写操作，都应落成 operation

## 6. 接口设计原则

- 前端可见资源保持稳定：`project`、`file`、`artifact`、`generation`、`chat_session`、`operation`
- 长任务必须显式建模
- 生成产物必须版本化
- agent 交互协议尽量事件化，避免前端从文本流中“推断”副作用
- ticket 作为 capability token 单独设计，不与主登录态混用

## 7. 推荐 API 设计

### 7.1 Auth

```http
POST /api/auth/login/password
POST /api/auth/login/sms
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/me
POST /api/auth/setup-profile
```

### 7.2 Projects

```http
GET    /api/projects
POST   /api/projects
GET    /api/projects/:project_id
PATCH  /api/projects/:project_id
DELETE /api/projects/:project_id
GET    /api/projects/metrics
```

### 7.3 Files

建议采用两段式上传：

```http
POST /api/projects/:project_id/files/upload-init
POST /api/projects/:project_id/files/complete
GET  /api/projects/:project_id/files
GET  /api/files/:file_id
```

`upload-init` 返回：

- `file_id`
- `upload_url`
- `storage_key`
- `expire_at`

说明：

- 前端直接上传对象存储或内部上传网关
- `complete` 后端确认状态并允许进入生成流程

### 7.4 Generation

```http
POST /api/projects/:project_id/generation/start
POST /api/projects/:project_id/generation/regenerate
POST /api/projects/:project_id/generation/cancel
GET  /api/projects/:project_id/generation/status
GET  /api/generation-jobs/:generation_job_id
```

`regenerate` 请求建议支持：

- `artifact_types`
- `reason`
- `scheme_id`

### 7.5 Artifacts

```http
GET /api/projects/:project_id/artifacts
GET /api/projects/:project_id/artifacts/:artifact_type/latest
GET /api/projects/:project_id/artifacts/:artifact_type/:artifact_version
```

### 7.6 Workbench Aggregates

```http
GET /api/projects/:project_id/workbench/upload-summary
GET /api/projects/:project_id/workbench/console-logs
GET /api/projects/:project_id/workbench/overview
```

`overview` 建议返回：

- 项目信息
- active scheme
- latest artifact summaries
- 当前 generation 状态
- 最近 operations

### 7.7 Schemes

```http
GET  /api/projects/:project_id/schemes
POST /api/projects/:project_id/schemes
PATCH /api/projects/:project_id/schemes/:scheme_id
POST /api/projects/:project_id/schemes/:scheme_id/activate
```

### 7.8 Agent

```http
POST /api/agent/tickets
POST /api/agent/sessions
GET  /api/agent/sessions/:chat_session_id
GET  /api/agent/sessions/:chat_session_id/messages
POST /api/agent/sessions/:chat_session_id/messages
GET  /api/agent/streams/:stream_id/sse
POST /api/agent/operations/:operation_id/confirm
POST /api/agent/operations/:operation_id/reject
```

建议：

- `agent_ticket` 只通过 `Authorization` 头传递
- 不建议同时放在 body 与 header 中

## 8. Agent 事件模型

SSE 不建议只返回文本片段，建议定义显式事件类型：

```json
{ "type": "message_delta", "content": "..." }
{ "type": "message_done" }
{ "type": "operation_started", "operation_id": "op_xxx" }
{ "type": "artifact_refresh_required", "artifact_types": ["graph"] }
{ "type": "interrupt_required", "operation_id": "op_xxx", "prompt": "..." }
{ "type": "error", "message": "..." }
```

这样前端可以稳定处理：

- 文本流更新
- operation 状态轮询
- artifact 刷新
- interrupt / approval

## 9. 典型业务流

### 9.1 上传并生成

1. 前端请求 `upload-init`
2. 前端上传对象存储
3. 前端请求 `complete`
4. 前端调用 `generation/start`
5. worker 拉起 generation workflow
6. 每一步写入 generation steps
7. 每类产物写入 artifact version
8. 前端通过轮询或 SSE 获取状态

### 9.2 Agent 交互

1. 前端使用业务登录态向 APM 后端申请 `agent ticket`
2. 前端拿 ticket 创建 `chat session`
3. 前端发送消息
4. 前端订阅 SSE
5. agent 若触发业务动作，先创建 `operation`
6. 若需要确认，发送 `interrupt_required`
7. 前端显式调用 `confirm / reject`
8. 操作成功后刷新工作台相关数据

## 10. 为什么不建议一开始微服务

当前阶段不建议直接拆微服务，原因如下：

- 复杂度主要在业务编排，不在吞吐量
- 文件、generation、artifact、agent、operation 之间存在强关联
- 一致性、幂等、重试、排障会在拆分后显著复杂化
- 团队成本和基础设施成本会上升

更合理的路线是：

1. 模块化单体
2. `api` 与 `worker` 分进程部署
3. generation 或 agent 成熟后再服务化拆分

## 11. 演进路径

### 阶段一：模块化单体

- 一个仓库
- 一个 `api-server`
- 一个 `worker`
- 一个主数据库
- 一个 Redis

### 阶段二：进程级拆分

- `api-server` 独立扩缩容
- `worker` 独立扩缩容
- generation 能力与同步 API 生命周期分离

### 阶段三：按边界服务化

优先拆：

- `generation-service`
- `agent-service`

保留在主服务：

- auth
- project
- file metadata
- scheme
- workbench aggregate

## 12. 结论

对 A.PM 当前业务形态，推荐方案不是“立刻微服务”，也不是“把 AI 独立成完全旁路系统”，而是：

- 采用 `Go + PostgreSQL + Redis + Object Storage + Worker`
- 使用模块化单体承接主业务
- 将 generation 作为显式 workflow 建模
- 将 agent ticket / session / operation 作为一等领域对象建模
- 预留未来拆分 `generation-service` 和 `agent-service` 的边界

这套方案的目标是：

- 当前可快速落地
- 中期可承受复杂生成链路和 agent 交互
- 后期可在边界稳定后平滑演进为服务化架构
