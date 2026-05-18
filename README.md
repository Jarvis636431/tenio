# A.PM 智能管理平台

智慧工地/项目管理平台。pnpm monorepo 结构，包含前端 (React)、后端 (NestJS)、共享类型包。

产品已形成完整的工作流入口：

- 登录页 `/login`
- 项目控制台 `/projects`
- 项目资料上传页 `/upload`
- 单项目工作台 `/project/:id`

## 技术栈

- **前端**: Vite + React 18 + TypeScript + Tailwind CSS + shadcn-ui
- **后端**: NestJS 11 + Prisma ORM + PostgreSQL
- **共享类型**: `@tenio/shared`（前后端共用的请求/响应类型）
- **包管理**: pnpm workspace

## 项目结构

```text
tenio/
  apps/
    web/       # 前端 (Vite + React)
    api/       # 后端 (NestJS + Prisma)
  packages/
    shared/    # 共享类型 (@tenio/shared)
```

## 本地开发

```bash
pnpm i          # 安装依赖
pnpm dev        # 启动前端 (8080)
pnpm dev:api    # 启动后端
```

### 常用命令

```bash
pnpm build             # 前端构建
pnpm lint              # 前端 ESLint
pnpm --filter api lint  # 后端 ESLint
pnpm test              # 前端测试 (Vitest)
pnpm --filter api test  # 后端测试 (Jest)
pnpm typecheck         # 前端类型检查
pnpm format            # 格式化
pnpm check             # 前端完整检查 (lint + typecheck + test + build)

# API 数据库
pnpm --filter api prisma:generate
pnpm --filter api prisma:migrate:dev
pnpm --filter api prisma:studio
```

## 环境变量

在项目根目录配置 `.env`：

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_AI_SERVICE_URL=http://127.0.0.1:8123
VITE_RESOURCE_BASE_URL=https://apmoss.emio.cn/public/resources
VITE_VOLC_APP_ID=your_volc_app_id
VITE_VOLC_ACCESS_TOKEN=your_volc_access_token
```

运行时配置统一在 `apps/web/src/config/index.ts` 管理。

## 前端结构

```text
apps/web/src/
  components/    # 共享 UI / layout
  features/
    ai/          # AI 会话、语音、SSE
    project/     # 项目工作台、图表
    upload/      # 文件上传
  routes/        # 路由编排
  stores/        # Zustand 状态
  services/      # HTTP 基础设施
  lib/           # 工具函数
```

Feature 模块规则（ESLint 强制）：

- 跨 feature 导入必须走 barrel (`@/features/ai`)
- feature 内部使用相对路径
- 详细规则见 `.rules/feature-architecture.md`

## AI 助手

AI 能力由常驻左侧聊天面板提供。

### Agent 会话流程

1. `POST ${API_BASE.backend}/api/agent/tickets` — 申请短期 `agent_ticket`
2. `POST ${API_BASE.aiService}/api/agent/init` — 初始化会话
3. `POST ${API_BASE.aiService}/api/agent/sessions/{id}/messages` — 发送消息
4. `GET ${API_BASE.aiService}/api/agent/streams/{stream_id}/sse` — 流式输出
5. `401 + AGENT_TICKET_EXPIRED` — 重新申请 ticket 并重试
6. `refetch` 事件 — 刷新工作台缓存

### 当前限制

- AI 消息按项目维度保存在内存，不持久化
- 刷新浏览器后需要重新初始化会话上下文

## 上传流程

1. 创建项目 → 获取上传凭证 → `PUT` 文件 → 完成回执
2. 启动生成任务 → 轮询状态（最长 30 分钟）
3. 成功后进入工作台

`upload_url` origin 会被替换为 `VITE_API_BASE_URL`，避免内部地址。

## Mock

前端开发环境支持 MSW（`apps/web/src/main.tsx`，worker 位于 `public/mockServiceWorker.js`）。

## 测试

- **前端**: Vitest（`apps/web/tests/`）
- **后端**: Jest + ts-jest（`apps/api/tests/`）

## 设计系统

- A.PM 设计 token 在 `apps/web/src/index.css`
- 参考原型在 `templete/`（非生产代码）
