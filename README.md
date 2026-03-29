# A.PM 智能管理平台

智慧工地/项目管理前端，当前版本以“单项目单页面聚合”作为主工作台。

## 技术栈

- Vite + React + TypeScript
- Tailwind CSS + shadcn-ui（Radix UI）
- React Router + React Query
- three.js + web-ifc/web-ifc-three
- Recharts

## 当前页面结构（精简版）

- 顶层路由：
  - `/login`
  - `/`
  - `/project/:id`（项目工作台，核心为 `Overview`）
- 应用主布局 `AppLayout` 为三栏：
  - 左：极简侧边栏（logo + home）
  - 中：常驻 AI ChatPanel
  - 右：业务内容区
- 项目页 `Overview` 聚合：
  - 项目头部 `ProjectHeader`
  - 进度时间轴
  - 资源趋势（人员/成本）
  - 施工计划（甘特图/网络图）
  - 模型预览
  - 当日工序列表（与时间轴同步）

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
VITE_AMAP_KEY=your_amap_key
VITE_AMAP_SECURITY_CODE=your_amap_security_code
VITE_VOLC_APP_ID=your_volc_app_id
VITE_VOLC_ACCESS_TOKEN=your_volc_access_token
VITE_VOLC_SECRET_KEY=your_volc_secret_key
```

## 配置入口

运行时配置统一在 `src/config/index.ts` 管理（API Base、AI 地址、地图 Key、语音识别配置、环境标志等）。

## AI 模块说明

AI 能力由常驻中栏聊天面板提供，入口位于 `src/components/layout/AppLayout.tsx`。

- UI 组件：`src/components/ai/Chat.tsx`
- 状态与交互编排：`src/components/ai/hooks/useChatPanel.ts`
- AI 服务封装：`src/services/ai-service.ts`

### AI Agent 初始化

- 接口：`POST ${API_BASE.aiService}/api/agent/init`
- 封装位置：`src/services/ai-service.ts` 中 `initAgent(payload)`
- 入参：`project_id`、`base_date`、`solution_id`、`access_token`
- `project_id` 由页面上下文传入，不做前端写死：
  - 项目总览页 `src/pages/project/Overview.tsx` 使用 `resolvedProjectId`

### AI 对话与流式返回

- 新对话接口：`POST ${API_BASE.aiService}/api/agent/chat/sse`
- 中断恢复接口：`POST ${API_BASE.aiService}/api/agent/chat/resume`
- 前端通过 SSE 增量消费 AI 返回内容，主要逻辑在 `useChatPanel.ts`
- AI 返回 `refetch` 事件时，前端会刷新项目图谱、成本曲线和人数曲线缓存

### 语音输入

- 语音录制与识别逻辑位于 `src/components/ai/hooks/useChatPanel.ts`
- 识别服务配置来自 `VOLC_SPEECH`
- 当前实际依赖的关键环境变量：
  - `VITE_VOLC_APP_ID`
  - `VITE_VOLC_ACCESS_TOKEN`
- `VITE_VOLC_SECRET_KEY` 已保留在配置中，但当前前端录音识别流程未直接使用

### 当前限制

- AI 面板消息和线程状态当前保存在内存中，按项目维度切换，不持久化到本地存储
- AI SSE 请求当前直接通过 `fetch` 发起，尚未统一接入 `src/services/http.ts`

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
