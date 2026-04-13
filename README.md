# A.PM 智能管理平台

智慧工地/项目管理前端。当前版本已经形成完整的工作流入口：

- 登录页 `/login`
- 项目控制台 `/projects`
- 项目资料上传页 `/upload`
- 单项目工作台 `/project/:id`

## 技术栈

- Vite + React + TypeScript
- Tailwind CSS + shadcn-ui（Radix primitives）
- React Router + React Query
- Recharts

## 当前页面结构（精简版）

- 顶层路由：
  - `/login`
  - `/projects`
  - `/`
  - `/upload`
  - `/project/:id`（项目工作台，核心为 `Overview`）
- `/` 当前直接跳转到 `/projects`
- 项目控制台页 `Projects`：
  - 顶部导航栏
  - 欢迎区和统计卡片
  - 项目筛选 / 搜索
  - 项目卡片列表
  - 新建项目入口
- 应用主布局 `AppLayout` 当前为 AI 工作台壳层：
  - 左：AI 助手侧栏
  - 右：项目工作区
- 项目页 `Overview` 聚合：
  - 工作台头部
  - Tab 控制条
  - 施工计划（甘特图 / 网络图）
  - 资源趋势（人员 / 成本）
  - 文档 / 上传 / 资源面板

## 当前用户流程

```text
/login
  -> /projects
  -> /upload   (新建项目)
  -> /project/:id
```

上传页在当前实现中会先展示一段“AI 生成中”状态，随后返回 `/projects`。

## 本地开发

```bash
pnpm i
pnpm dev
```

常用命令：

```bash
pnpm build
pnpm lint
pnpm test
pnpm preview
```

## 环境变量

在项目根目录配置 `.env`（或 `.env.local`）：

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_AI_SERVICE_URL=http://127.0.0.1:8123
VITE_RESOURCE_BASE_URL=https://apmoss.emio.cn/public/resources
VITE_VOLC_APP_ID=your_volc_app_id
VITE_VOLC_ACCESS_TOKEN=your_volc_access_token
VITE_VOLC_SECRET_KEY=your_volc_secret_key
```

## 配置入口

运行时配置统一在 `src/config/index.ts` 管理（API Base、AI 地址、地图 Key、语音识别配置、环境标志等）。

## 目录结构

```text
src/
  components/        # 跨 feature 共享的基础 UI / layout / chart
  config/            # 运行时配置
  features/
    ai/              # AI 会话、语音、SSE 服务
    project/         # 项目工作台、图表、项目服务
    upload/          # 文件上传与上传结果管理
  pages/             # 路由层页面（Login / Projects / Upload / NotFound）
  routes/            # 路由编排
  services/          # 跨 feature 的 HTTP 基础设施
  stores/            # Zustand 状态
  lib/               # 纯工具函数
  index.css          # A.PM 设计 token 与全局视觉基线
```

## 设计系统与原型

- A.PM 设计 token 与全局工具类集中在 `src/index.css`
- 参考原型和设计指南位于 `templete/`
- 当前演化约束和页面映射文档位于 `docs/frontend-evolution-guide.md`

不要把 `templete/apm_react_template` 当作当前实现基线。主实现只在 `src/` 下。

## AI 模块说明

AI 能力由常驻左侧聊天面板提供，入口位于 `src/components/layout/AppLayout.tsx`。

- UI 组件：`src/features/ai/components/Chat.tsx`
- 状态与交互编排：`src/features/ai/hooks/useChat.ts`
- 语音录制与识别：`src/features/ai/hooks/useVoice.ts`
- AI 服务封装：`src/features/ai/services/ai-service.ts`

### AI Agent 初始化

- 接口：`POST ${API_BASE.aiService}/api/agent/init`
- 封装位置：`src/features/ai/services/ai-service.ts` 中 `initAgent(payload)`
- 入参：`project_id`、`base_date`、`solution_id`、`access_token`
- `project_id` 由页面上下文传入，不做前端写死：
  - 项目总览页 `src/features/project/pages/Overview.tsx` 使用 `resolvedProjectId`

### AI 对话与流式返回

- 新对话接口：`POST ${API_BASE.aiService}/api/agent/chat/sse`
- 中断恢复接口：`POST ${API_BASE.aiService}/api/agent/chat/resume`
- 前端通过 SSE 增量消费 AI 返回内容，主要逻辑在 `src/features/ai/hooks/useChat.ts`
- AI 返回 `refetch` 事件时，前端会刷新项目图谱、成本曲线和人数曲线缓存

### 语音输入

- 语音录制与识别逻辑位于 `src/features/ai/hooks/useVoice.ts`
- 识别服务配置来自 `VOLC_SPEECH`
- 当前实际依赖的关键环境变量：
  - `VITE_VOLC_APP_ID`
  - `VITE_VOLC_ACCESS_TOKEN`
- `VITE_VOLC_SECRET_KEY` 已保留在配置中，但当前前端录音识别流程未直接使用

### 当前限制

- AI 面板消息和线程状态当前保存在内存中，按项目维度切换，不持久化到本地存储
- AI SSE 请求已统一接入 `src/services/http.ts` 中的 `requestSse`

## 上传流程

- 上传入口页位于 `src/features/upload/pages/UploadPage.tsx`
- 上传能力由 `src/features/upload/hooks/useUploads.ts` 和 `src/features/upload/services/uploads-api.ts` 提供
- 当前上传能力仍基于前端 mock store 实现，主要用于演示上传流程与状态
- 文件分类常量统一来自 `src/features/upload/types/uploads.ts`
- 页面结构已对齐“必传核心资料 + 选传补充资料”的原型
- 上传全部成功后会进入生成中状态，并在结束后返回 `/projects`

## Mock

开发环境支持 MSW（`src/main.tsx`，worker 位于 `public/mockServiceWorker.js`）。

## 测试

项目当前使用 Vitest，测试统一放在根目录 `tests/` 下。

```bash
pnpm test
```

当前已启用的测试目录约定：

- `tests/services`
- `tests/hooks`
- `tests/components`
- `tests/stores`
- `tests/utils`
- `tests/integration`
