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

## 12. 数据库表结构草案

以下表结构是面向当前业务形态的初版草案，目标是先把领域对象建模清楚，而不是一次性追求最全字段。

### 12.1 users

```sql
CREATE TABLE users (
  user_id            BIGSERIAL PRIMARY KEY,
  account            VARCHAR(64) NOT NULL UNIQUE,
  password_hash      TEXT,
  display_name       VARCHAR(128) NOT NULL,
  phone              VARCHAR(32),
  email              VARCHAR(128),
  user_status        VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 12.2 refresh_tokens

```sql
CREATE TABLE refresh_tokens (
  refresh_token_id   BIGSERIAL PRIMARY KEY,
  user_id            BIGINT NOT NULL REFERENCES users(user_id),
  token_hash         TEXT NOT NULL,
  expires_at         TIMESTAMPTZ NOT NULL,
  revoked_at         TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
```

### 12.3 projects

```sql
CREATE TABLE projects (
  project_id                 BIGSERIAL PRIMARY KEY,
  project_name               VARCHAR(255) NOT NULL,
  project_status             VARCHAR(32) NOT NULL DEFAULT 'draft',
  source_type                VARCHAR(32) NOT NULL DEFAULT 'upload',
  active_scheme_id           BIGINT,
  latest_generation_job_id   BIGINT,
  created_by                 BIGINT NOT NULL REFERENCES users(user_id),
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_status ON projects(project_status);
```

### 12.4 project_members

```sql
CREATE TABLE project_members (
  project_member_id    BIGSERIAL PRIMARY KEY,
  project_id           BIGINT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  user_id              BIGINT NOT NULL REFERENCES users(user_id),
  role_code            VARCHAR(32) NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);
```

### 12.5 schemes

```sql
CREATE TABLE schemes (
  scheme_id            BIGSERIAL PRIMARY KEY,
  project_id           BIGINT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  scheme_name          VARCHAR(255) NOT NULL,
  scheme_status        VARCHAR(32) NOT NULL DEFAULT 'draft',
  created_by           BIGINT NOT NULL REFERENCES users(user_id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_schemes_project_id ON schemes(project_id);
```

后续建议增加外键：

```sql
ALTER TABLE projects
ADD CONSTRAINT fk_projects_active_scheme
FOREIGN KEY (active_scheme_id) REFERENCES schemes(scheme_id);
```

### 12.6 files

```sql
CREATE TABLE files (
  file_id              BIGSERIAL PRIMARY KEY,
  project_id           BIGINT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  file_name            VARCHAR(512) NOT NULL,
  file_category        VARCHAR(64) NOT NULL,
  file_role            VARCHAR(64),
  mime_type            VARCHAR(128),
  file_size_bytes      BIGINT NOT NULL,
  storage_key          TEXT NOT NULL,
  content_hash         VARCHAR(128) NOT NULL,
  upload_status        VARCHAR(32) NOT NULL DEFAULT 'pending',
  parse_status         VARCHAR(32) NOT NULL DEFAULT 'pending',
  uploaded_by          BIGINT NOT NULL REFERENCES users(user_id),
  uploaded_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_files_project_id ON files(project_id);
CREATE INDEX idx_files_content_hash ON files(content_hash);
CREATE INDEX idx_files_upload_status ON files(upload_status);
```

### 12.7 generation_jobs

```sql
CREATE TABLE generation_jobs (
  generation_job_id        BIGSERIAL PRIMARY KEY,
  project_id               BIGINT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  scheme_id                BIGINT REFERENCES schemes(scheme_id),
  generation_status        VARCHAR(32) NOT NULL DEFAULT 'pending',
  trigger_source           VARCHAR(32) NOT NULL,
  trigger_reason           TEXT,
  current_step_code        VARCHAR(64),
  current_step_name        VARCHAR(128),
  step_progress_percent    NUMERIC(5,2) NOT NULL DEFAULT 0,
  started_by               BIGINT REFERENCES users(user_id),
  started_at               TIMESTAMPTZ,
  finished_at              TIMESTAMPTZ,
  error_code               VARCHAR(64),
  error_message            TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_generation_jobs_project_id ON generation_jobs(project_id);
CREATE INDEX idx_generation_jobs_scheme_id ON generation_jobs(scheme_id);
CREATE INDEX idx_generation_jobs_status ON generation_jobs(generation_status);
```

### 12.8 generation_steps

```sql
CREATE TABLE generation_steps (
  generation_step_id     BIGSERIAL PRIMARY KEY,
  generation_job_id      BIGINT NOT NULL REFERENCES generation_jobs(generation_job_id) ON DELETE CASCADE,
  step_code              VARCHAR(64) NOT NULL,
  step_name              VARCHAR(128) NOT NULL,
  step_order             INT NOT NULL,
  step_status            VARCHAR(32) NOT NULL DEFAULT 'pending',
  progress_percent       NUMERIC(5,2) NOT NULL DEFAULT 0,
  detail_message         TEXT,
  started_at             TIMESTAMPTZ,
  finished_at            TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(generation_job_id, step_code)
);

CREATE INDEX idx_generation_steps_job_id ON generation_steps(generation_job_id);
```

### 12.9 artifacts

```sql
CREATE TABLE artifacts (
  artifact_id            BIGSERIAL PRIMARY KEY,
  project_id             BIGINT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  scheme_id              BIGINT REFERENCES schemes(scheme_id),
  generation_job_id      BIGINT REFERENCES generation_jobs(generation_job_id),
  artifact_type          VARCHAR(32) NOT NULL,
  artifact_version       INT NOT NULL,
  artifact_status        VARCHAR(32) NOT NULL DEFAULT 'ready',
  created_by             BIGINT REFERENCES users(user_id),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, scheme_id, artifact_type, artifact_version)
);

CREATE INDEX idx_artifacts_project_id_type ON artifacts(project_id, artifact_type);
CREATE INDEX idx_artifacts_job_id ON artifacts(generation_job_id);
```

### 12.10 document_artifacts

```sql
CREATE TABLE document_artifacts (
  artifact_id            BIGINT PRIMARY KEY REFERENCES artifacts(artifact_id) ON DELETE CASCADE,
  content_markdown       TEXT NOT NULL,
  content_html           TEXT,
  summary_text           TEXT
);
```

### 12.11 graph_artifacts

```sql
CREATE TABLE graph_artifacts (
  artifact_id            BIGINT PRIMARY KEY REFERENCES artifacts(artifact_id) ON DELETE CASCADE,
  graph_payload          JSONB NOT NULL,
  task_count             INT,
  edge_count             INT
);

CREATE INDEX idx_graph_artifacts_payload_gin ON graph_artifacts USING GIN (graph_payload);
```

### 12.12 time_cost_artifacts

```sql
CREATE TABLE time_cost_artifacts (
  artifact_id            BIGINT PRIMARY KEY REFERENCES artifacts(artifact_id) ON DELETE CASCADE,
  curve_payload          JSONB NOT NULL,
  summary_payload        JSONB
);
```

### 12.13 crew_plan_artifacts

```sql
CREATE TABLE crew_plan_artifacts (
  artifact_id            BIGINT PRIMARY KEY REFERENCES artifacts(artifact_id) ON DELETE CASCADE,
  plan_payload           JSONB NOT NULL,
  summary_payload        JSONB
);
```

### 12.14 chat_sessions

```sql
CREATE TABLE chat_sessions (
  chat_session_id        BIGSERIAL PRIMARY KEY,
  project_id             BIGINT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  user_id                BIGINT NOT NULL REFERENCES users(user_id),
  session_status         VARCHAR(32) NOT NULL DEFAULT 'active',
  session_title          VARCHAR(255),
  last_message_at        TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_sessions_project_user ON chat_sessions(project_id, user_id);
```

### 12.15 chat_messages

```sql
CREATE TABLE chat_messages (
  chat_message_id        BIGSERIAL PRIMARY KEY,
  chat_session_id        BIGINT NOT NULL REFERENCES chat_sessions(chat_session_id) ON DELETE CASCADE,
  sender_type            VARCHAR(32) NOT NULL,
  message_type           VARCHAR(32) NOT NULL DEFAULT 'text',
  content_text           TEXT NOT NULL,
  seq_no                 BIGINT NOT NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(chat_session_id, seq_no)
);

CREATE INDEX idx_chat_messages_session_id ON chat_messages(chat_session_id);
```

### 12.16 agent_tickets

```sql
CREATE TABLE agent_tickets (
  agent_ticket_id        BIGSERIAL PRIMARY KEY,
  ticket_jti             VARCHAR(128) NOT NULL UNIQUE,
  project_id             BIGINT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  user_id                BIGINT NOT NULL REFERENCES users(user_id),
  scopes                 JSONB NOT NULL,
  expires_at             TIMESTAMPTZ NOT NULL,
  revoked_at             TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_tickets_project_user ON agent_tickets(project_id, user_id);
CREATE INDEX idx_agent_tickets_expires_at ON agent_tickets(expires_at);
```

### 12.17 operations

```sql
CREATE TABLE operations (
  operation_id           BIGSERIAL PRIMARY KEY,
  project_id             BIGINT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  generation_job_id      BIGINT REFERENCES generation_jobs(generation_job_id),
  chat_session_id        BIGINT REFERENCES chat_sessions(chat_session_id),
  operation_type         VARCHAR(64) NOT NULL,
  operation_status       VARCHAR(32) NOT NULL DEFAULT 'pending',
  source                 VARCHAR(32) NOT NULL,
  requested_by           BIGINT REFERENCES users(user_id),
  input_payload          JSONB,
  result_payload         JSONB,
  error_message          TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_operations_project_id ON operations(project_id);
CREATE INDEX idx_operations_status ON operations(operation_status);
```

### 12.18 console_logs

```sql
CREATE TABLE console_logs (
  console_log_id         BIGSERIAL PRIMARY KEY,
  project_id             BIGINT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  generation_job_id      BIGINT REFERENCES generation_jobs(generation_job_id),
  log_level              VARCHAR(16) NOT NULL,
  log_source             VARCHAR(64) NOT NULL,
  message                TEXT NOT NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_console_logs_project_id ON console_logs(project_id);
CREATE INDEX idx_console_logs_job_id ON console_logs(generation_job_id);
```

### 12.19 建模说明

- `artifact` 采用“公共表 + 类型子表”模式，避免所有产物都塞进一个大 JSON
- `generation_job` 与 `generation_step` 分表，便于审计、重试和统计
- `operation` 是 agent 与业务系统的桥，不建议省略
- `files.content_hash` 是后续做文件去重、增量生成、缓存命中的关键字段
- `projects.active_scheme_id` 与 `latest_generation_job_id` 都属于工作台高频读取字段，值得保留在主表

## 13. 项目数据流

### 13.1 登录与初始化

1. 前端调用 `POST /api/auth/login/*`
2. 后端返回 `access_token + refresh_token`
3. 前端请求 `GET /api/me`
4. 前端进入项目列表页，调用 `GET /api/projects`

这里的重点是：

- 登录态只服务业务后台
- agent 能力不直接复用业务 token

### 13.2 新建项目与上传

1. 前端 `POST /api/projects` 创建项目
2. 前端 `POST /api/projects/:project_id/files/upload-init`
3. 后端生成 `file_id + upload_url + storage_key`
4. 前端直传对象存储
5. 前端 `POST /api/projects/:project_id/files/complete`
6. 后端将 `upload_status` 更新为 `uploaded`

涉及数据变化：

- `projects` 新增一条记录
- `files` 新增一条或多条记录
- 对象存储新增原始文件

### 13.3 首次生成

1. 前端调用 `POST /api/projects/:project_id/generation/start`
2. 后端创建 `generation_jobs`
3. 后端初始化 `generation_steps`
4. worker 开始执行：
   - 文件解析
   - 文档生成
   - 图谱生成
   - 工期成本分析
   - 人员轮转分析
5. 每个步骤更新 `generation_steps`
6. 每类产物写入 `artifacts + 对应子表`
7. `projects.latest_generation_job_id` 更新为当前任务
8. 若需要设置方案上下文，则同步更新 `projects.active_scheme_id`

前端读取路径：

- 轮询 `GET /api/projects/:project_id/generation/status`
- 或通过 SSE 接收状态事件
- 再请求 `GET /api/projects/:project_id/workbench/overview`

### 13.4 工作台展示

工作台首屏建议由一个聚合接口驱动：

`GET /api/projects/:project_id/workbench/overview`

返回内容建议包括：

- `project`
- `active_scheme`
- `latest_generation`
- `artifact_summaries`
- `recent_operations`
- `upload_summary`

各 tab 再按需请求细粒度接口：

- DocsTab -> `document/latest`
- GraphTab -> `graph/latest`
- TimeCostTab -> `time_cost/latest`
- CrewPlanTab -> `crew_plan/latest`

这样首屏与深度详情分层清楚，不会让前端一次拉太多大 payload。

### 13.5 重新生成

1. 前端调用 `POST /api/projects/:project_id/generation/regenerate`
2. 请求体可带：
   - `artifact_types`
   - `scheme_id`
   - `reason`
3. 后端新增一条 `generation_job`
4. worker 仅重跑指定产物链路
5. 新产物写入新的 `artifact_version`
6. 工作台始终读取 latest 版本

关键点：

- 重新生成不是覆盖旧产物，而是产出新版本
- 旧版本保留，便于审计和回退

### 13.6 Agent 交互数据流

1. 前端用业务登录态调用 `POST /api/agent/tickets`
2. 后端校验用户是否有该项目访问权
3. 后端签发短期 `agent ticket`
4. 前端用 ticket 创建 `chat_session`
5. 前端发送消息
6. agent 服务通过 SSE 返回事件流：
   - `message_delta`
   - `operation_started`
   - `artifact_refresh_required`
   - `interrupt_required`
7. 如果 agent 要写业务数据，先创建 `operations`
8. 如果需要用户确认，前端调用：
   - `POST /api/agent/operations/:operation_id/confirm`
   - `POST /api/agent/operations/:operation_id/reject`
9. 操作完成后，工作台刷新聚合数据或指定 artifact

### 13.7 导出数据流

如果导出由后端负责，建议如下：

1. 前端调用 `POST /api/projects/:project_id/artifacts/document/export`
2. 后端读取最新 `document_artifact`
3. 后端生成 `.docx`
4. 后端上传到对象存储或直接返回下载流
5. 前端下载

如果导出仍由前端负责：

- 后端仅提供 `document/latest`
- 前端读取 `content_markdown`
- 前端自行转换为 `.docx`

### 13.8 状态一致性原则

- 上传完成后才能进入 generation
- generation 失败不应覆盖旧 artifact
- operation 必须可审计、可查询
- active scheme 的切换应是显式动作
- agent 触发的业务写操作必须先落 operation 再执行

## 14. 为什么这里没有优先推荐 Gin

不是 `Gin` 不能用，而是它不是这份方案里最值得强调的核心选择。

### 14.1 Gin 的优点

- 社区成熟
- 性能很好
- 上手成本低
- 资料多，团队招聘面也广

如果团队已经熟悉 `Gin`，直接用它完全可以，不会构成架构问题。

### 14.2 为什么文档里写的是 Echo / Fiber

这份方案更看重的是：

- 路由与中间件组织清晰
- 请求/响应绑定简洁
- SSE、上传、长连接处理顺手
- 工程代码不要太重

`Echo` 和 `Fiber` 在这些维度上都比较直接，所以我在文档里先写了它们。

更具体一点：

- `Echo` 的语义比较传统，接近标准库思维，团队更容易收敛
- `Fiber` 的性能和 API 手感不错，但它建立在 `fasthttp` 上，生态兼容性要单独评估

### 14.3 为什么我没有把 Gin 单独拎出来推荐

因为 `Gin` 在这个项目里不是决定成败的关键变量。

真正重要的是：

- 你有没有把 `generation_job / artifact / operation / agent ticket` 建模清楚
- 你有没有把同步接口和异步 worker 的边界分清楚
- 你有没有设计好 SSE 事件模型和版本化产物

这些问题没处理好，用 `Gin`、`Echo`、`Fiber` 都一样会乱。

### 14.4 如果团队问我最终怎么选

我会这样落：

- 团队已经熟 `Gin`：直接用 `Gin`
- 想要更稳、更传统的 Go Web 体验：优先 `Echo`
- 对性能和轻量 API 风格有偏好，并且能接受 `fasthttp` 生态差异：可以用 `Fiber`

所以结论不是“别用 Gin”，而是：

- `Gin` 可以用
- 只是它不是这份架构设计里最关键的决策点

## 15. 结论

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
