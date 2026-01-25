# A.PM 智能管理平台

面向智慧工地/项目管理的前端应用，包含项目管理、地图选址、BIM/IFC 模型浏览等模块。

## 技术栈

- Vite + React + TypeScript
- Tailwind CSS + shadcn-ui (Radix UI)
- React Router + React Query
- three.js + web-ifc/web-ifc-three
- 高德地图 AMap JS API

## 本地开发

```bash
pnpm i
pnpm dev
```

## 环境变量

在项目根目录配置 `.env`（或 `.env.local`）：

```bash
VITE_USER_SERVICE_URL=http://localhost:8001
VITE_PROJECT_SERVICE_URL=http://localhost:8002
VITE_AMAP_KEY=your_amap_key
VITE_AMAP_SECURITY_CODE=your_amap_security_code
VITE_SOCKET_URL=ws://localhost:8000
```

## 配置收口

所有运行时配置统一在 `src/config/index.ts` 中管理，包含：

- API Base（用户服务/项目服务）
- AMap Key 与 Security Code
- Socket 地址
- 环境标志（是否开发环境）

## 页面标题规则

通过路由前缀统一设置标题：

- `/login` → 登录
- `/create-project` → 创建
- 其他路由 → A.PM 智能管理平台

## Mock

开发环境会自动启用 MSW（`src/main.tsx`）。
