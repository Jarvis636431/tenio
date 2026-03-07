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
  - `/create`（创建流程）
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
pnpm preview
```

## 环境变量

在项目根目录配置 `.env`（或 `.env.local`）：

```bash
VITE_USER_SERVICE_URL=http://localhost:8000
VITE_PROJECT_SERVICE_URL=http://localhost:8000
VITE_AI_SSE_URL=https://chat.zrzz.site/api/agent/chat/sse
VITE_POI_SERVICE_URL=https://chat.zrzz.site
VITE_AMAP_KEY=your_amap_key
VITE_AMAP_SECURITY_CODE=your_amap_security_code
```

## 配置入口

运行时配置统一在 `src/config/index.ts` 管理（API Base、AI 地址、地图 Key、环境标志等）。

## Mock

开发环境支持 MSW（`src/main.tsx`，worker 位于 `public/mockServiceWorker.js`）。
