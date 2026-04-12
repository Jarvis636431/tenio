# A.PM 智管 - React 前端项目

这是 A.PM 智管产品的 React 前端开发项目模板。基于原型 HTML 进行组件化重构。

## 项目结构

```
src/
├── components/          # React 组件库
│   ├── Button.jsx      # 按钮组件
│   ├── Button.css
│   ├── Card.jsx        # 卡片组件
│   ├── Card.css
│   ├── Navbar.jsx      # 导航栏
│   ├── NetworkDiagram.jsx  # 网络图组件
│   └── ...
├── pages/              # 页面级组件
│   ├── Login.jsx
│   ├── Projects.jsx
│   ├── Upload.jsx
│   └── Workbench.jsx
├── styles/             # 全局样式
│   ├── variables.css   # CSS 变量定义
│   ├── global.css      # 全局样式
│   └── ...
├── hooks/              # 自定义 React hooks
│   ├── useAuth.js
│   ├── useProjects.js
│   └── ...
├── utils/              # 工具函数
│   ├── api.js          # API 调用
│   ├── helpers.js
│   └── ...
├── store/              # 状态管理 (Zustand)
│   ├── authStore.js
│   ├── projectStore.js
│   └── ...
├── App.jsx             # 根组件
├── main.jsx            # 入口文件
└── index.html          # HTML 模板
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 `http://localhost:5173`

### 生产构建

```bash
npm run build
```

### 代码检查

```bash
npm run lint
```

## 技术栈

- **React 18** - UI 框架
- **React Router v6** - 路由管理
- **Zustand** - 轻量级状态管理
- **Axios** - HTTP 客户端
- **Chart.js** - 图表库
- **Vite** - 构建工具
- **ESLint** - 代码检查

## 设计规范

所有组件开发需遵循 `design_spec.md` 中的规范，包括：

- **色彩系统**：使用 CSS 变量定义的色值
- **字体系统**：Space Grotesk (标题) + Noto Sans SC (正文)
- **间距系统**：基于 4px 基础单位
- **组件规范**：按钮、卡片、输入框等

### CSS 变量使用示例

```jsx
// 在 CSS 中使用
.my-component {
  background: var(--color-bg-card);
  color: var(--color-text);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

// 在 React 中使用
<div style={{
  background: 'var(--color-accent)',
  padding: 'var(--spacing-lg)',
}}>
  Content
</div>
```

## 组件开发指南

### 创建新组件

```jsx
// src/components/MyComponent.jsx
import React from "react";
import "./MyComponent.css";

/**
 * MyComponent 组件说明
 * @param {string} variant - 组件变体
 * @param {ReactNode} children - 子元素
 */
export const MyComponent = ({ variant = "default", children, ...props }) => {
  return (
    <div className={`my-component my-component-${variant}`} {...props}>
      {children}
    </div>
  );
};

export default MyComponent;
```

### 组件 CSS 编写

```css
/* src/components/MyComponent.css */
.my-component {
  /* 使用 CSS 变量 */
  background: var(--color-bg-card);
  color: var(--color-text);
  padding: var(--spacing-lg);
  border: 1px solid var(--color-accent-border);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

.my-component:hover {
  border-color: var(--color-accent);
}

.my-component-primary {
  background: var(--color-accent-dim);
  color: var(--color-accent);
}
```

## 页面开发流程

### 1. 创建页面组件

```jsx
// src/pages/MyPage.jsx
import React, { useState, useEffect } from "react";
import { Card, Button } from "../components";

export const MyPage = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    // 获取数据
    fetchData();
  }, []);

  return (
    <div className="page">
      <h1>页面标题</h1>
      {/* 页面内容 */}
    </div>
  );
};

export default MyPage;
```

### 2. 在路由中注册

```jsx
// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MyPage from "./pages/MyPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/my-page" element={<MyPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## 状态管理 (Zustand)

### 创建 Store

```javascript
// src/store/myStore.js
import { create } from "zustand";

export const useMyStore = create((set) => ({
  items: [],
  loading: false,

  setItems: (items) => set({ items }),
  setLoading: (loading) => set({ loading }),

  fetchItems: async () => {
    set({ loading: true });
    try {
      const response = await fetch("/api/items");
      const data = await response.json();
      set({ items: data });
    } finally {
      set({ loading: false });
    }
  },
}));
```

### 在组件中使用

```jsx
import { useMyStore } from "../store/myStore";

export const MyComponent = () => {
  const { items, loading, fetchItems } = useMyStore();

  useEffect(() => {
    fetchItems();
  }, []);

  return (
    <div>
      {loading ? <p>加载中...</p> : items.map((item) => <div key={item.id}>{item.name}</div>)}
    </div>
  );
};
```

## API 集成

### API 工具函数

```javascript
// src/utils/api.js
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // 处理未授权
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export const projectAPI = {
  getProjects: () => api.get("/projects"),
  getProject: (id) => api.get(`/projects/${id}`),
  createProject: (data) => api.post("/projects", data),
  updateProject: (id, data) => api.put(`/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/projects/${id}`),
};

export default api;
```

## 网络图组件开发

网络图是项目的核心可视化组件，需要使用 SVG 或 Canvas 实现。

```jsx
// src/components/NetworkDiagram.jsx
import React, { useEffect, useRef } from "react";
import "./NetworkDiagram.css";

export const NetworkDiagram = ({ data }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (svgRef.current && data) {
      renderNetworkDiagram(svgRef.current, data);
    }
  }, [data]);

  return (
    <div className="network-diagram-container">
      <svg ref={svgRef} width="1450" height="820" />
    </div>
  );
};

const renderNetworkDiagram = (svg, data) => {
  // SVG 绘制逻辑
  // 参考原型 HTML 中的网络图实现
};

export default NetworkDiagram;
```

## 性能优化建议

1. **代码分割**：使用 React.lazy 和 Suspense 进行路由级别的代码分割
2. **图片优化**：使用 CDN URL，避免本地图片
3. **虚拟滚动**：长列表使用虚拟滚动库（如 react-window）
4. **防抖/节流**：搜索、窗口大小改变等事件
5. **缓存策略**：合理使用 useMemo 和 useCallback

## 浏览器兼容性

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## 常见问题

### Q: 如何添加新的 CSS 变量？

A: 在 `src/styles/variables.css` 中的 `:root` 选择器内添加，然后在组件中使用 `var(--variable-name)`。

### Q: 如何处理深色/浅色主题切换？

A: 可以在 `:root` 和 `[data-theme="light"]` 中定义不同的变量值，通过 JavaScript 切换 `data-theme` 属性。

### Q: 如何集成后端 API？

A: 使用 `src/utils/api.js` 中的 axios 实例，在 store 或 hooks 中调用 API。

## 贡献指南

1. 创建功能分支：`git checkout -b feature/my-feature`
2. 提交更改：`git commit -am 'Add my feature'`
3. 推送到远程：`git push origin feature/my-feature`
4. 创建 Pull Request

## 许可证

MIT

---

**项目维护者**：A.PM 团队  
**最后更新**：2026-04-11
