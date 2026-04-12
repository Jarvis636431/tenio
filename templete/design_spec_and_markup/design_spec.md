# A.PM 智管 · 前端设计规范文档

## 1. 色彩系统

### 核心色值

| 用途        | 色值                     | RGB              | 说明                   |
| ----------- | ------------------------ | ---------------- | ---------------------- |
| 主背景      | `#020c1b`                | rgb(2,12,27)     | 深蓝黑，页面主背景色   |
| 面板背景    | `#041225`                | rgb(4,18,37)     | 卡片/面板背景          |
| 卡片背景    | `rgba(4,18,37,0.85)`     | -                | 半透明卡片背景         |
| 主题色/强调 | `#00d4ff`                | rgb(0,212,255)   | 霓虹青，按钮/链接/高亮 |
| 主题色暗    | `rgba(0,212,255,0.12)`   | -                | 背景填充用             |
| 主题色边框  | `rgba(0,212,255,0.18)`   | -                | 边框/分割线            |
| 文本主色    | `#e8f0fe`                | rgb(232,240,254) | 主文本颜色             |
| 文本次色    | `rgba(160,180,204,0.65)` | -                | 副标题/说明文字        |
| 文本暗色    | `rgba(160,180,204,0.35)` | -                | 辅助文字/图标          |
| 成功/绿     | `#10b981`                | rgb(16,185,129)  | 完成状态/成功提示      |
| 成功暗      | `rgba(16,185,129,0.1)`   | -                | 绿色背景填充           |
| 警告/黄     | `#f59e0b`                | rgb(245,158,11)  | 进行中/警告状态        |
| 错误/红     | `#ef4444`                | rgb(239,68,68)   | 关键路径/错误提示      |

### 渐变色

- **按钮渐变**：`linear-gradient(135deg, #00d4ff, #0099ff)`
- **关键路径渐变**：`linear-gradient(90deg, #ef4444, #f97316)`
- **成功渐变**：`linear-gradient(90deg, #10b981, #059669)`
- **进行中渐变**：`linear-gradient(90deg, #00d4ff, #0099ff)`

## 2. 字体系统

### 字体族

```css
/* 标题/数字用 */
font-family: "Space Grotesk", monospace;

/* 正文/中文用 */
font-family: "Noto Sans SC", sans-serif;

/* 通用 */
font-family: "Space Grotesk", "Noto Sans SC", sans-serif;
```

### 字体大小与权重规范

| 用途      | 大小 | 权重 | 行高 | 说明               |
| --------- | ---- | ---- | ---- | ------------------ |
| 页面标题  | 22px | 700  | 1.3  | 欢迎页、大标题     |
| 卡片标题  | 14px | 600  | 1.4  | 项目卡片、模块标题 |
| 副标题    | 13px | 500  | 1.4  | 项目元数据         |
| 正文      | 12px | 400  | 1.5  | 普通文本内容       |
| 小文本    | 11px | 400  | 1.4  | 标签、说明         |
| 超小文本  | 10px | 400  | 1.3  | 时间戳、辅助信息   |
| 数字/指标 | 26px | 700  | 1.2  | 统计数值           |
| 按钮文字  | 13px | 700  | 1    | 按钮内文本         |

## 3. 间距系统

### 基础间距单位

```
基础单位：4px
常用间距：4px, 8px, 12px, 16px, 20px, 24px, 28px, 32px
```

### 应用规范

| 场景             | 间距      | 说明               |
| ---------------- | --------- | ------------------ |
| 组件内部 padding | 16px-18px | 卡片、面板内边距   |
| 组件间 gap       | 14px-16px | 卡片间距、元素间距 |
| 页面 padding     | 24px-32px | 页面外边距         |
| 行间距           | 8px-12px  | 列表项、行间距     |
| 模块间距         | 28px-32px | 大模块间距         |

## 4. 圆角系统

| 类型   | 数值      | 用途                 |
| ------ | --------- | -------------------- |
| 无圆角 | 0px       | 网络图节点、某些边框 |
| 小圆角 | 2px-4px   | 小按钮、标签         |
| 中圆角 | 6px-8px   | 卡片、输入框         |
| 大圆角 | 12px-16px | 模态框、大组件       |
| 圆形   | 50%       | 头像、圆形节点       |

## 5. 阴影系统

| 等级     | CSS                            | 用途           |
| -------- | ------------------------------ | -------------- |
| 无阴影   | none                           | 默认           |
| 浅阴影   | `0 1px 3px rgba(0,0,0,0.12)`   | 悬停状态       |
| 中阴影   | `0 4px 12px rgba(0,0,0,0.15)`  | 卡片、下拉菜单 |
| 深阴影   | `0 8px 24px rgba(0,0,0,0.2)`   | 模态框、浮层   |
| 发光效果 | `0 0 8px rgba(0,212,255,0.25)` | 强调、关键元素 |

## 6. 边框系统

| 类型     | 样式                                                     | 用途         |
| -------- | -------------------------------------------------------- | ------------ |
| 主边框   | `1px solid rgba(0,212,255,0.18)`                         | 卡片、输入框 |
| 强调边框 | `1px solid rgba(0,212,255,0.35)`                         | 悬停、焦点   |
| 活跃边框 | `1px solid #00d4ff`                                      | 选中、激活   |
| 分割线   | `1px solid rgba(0,212,255,0.06)`                         | 内容分割     |
| 顶部条   | `2px solid linear-gradient(90deg, #00d4ff, transparent)` | 卡片顶部装饰 |

## 7. 按钮规范

### 按钮类型

#### 主按钮（Primary）

```css
background: linear-gradient(135deg, #00d4ff, #0099ff);
color: #020c1b;
padding: 11px 22px;
font-size: 13px;
font-weight: 700;
border: none;
cursor: pointer;
```

- 用于：主要操作（登录、新建、提交）
- 悬停：opacity 0.9

#### 次按钮（Secondary）

```css
background: transparent;
color: rgba(160, 180, 204, 0.65);
border: 1px solid rgba(0, 212, 255, 0.18);
padding: 6px 14px;
font-size: 12px;
font-weight: 500;
```

- 用于：次要操作（筛选、取消）
- 悬停：border-color 变浅，color 变亮

#### 文本按钮（Text）

```css
background: transparent;
color: #00d4ff;
border: none;
font-size: 12px;
cursor: pointer;
```

- 用于：链接、返回、帮助

#### 状态按钮（Status Badge）

```css
/* 进行中 */
background: rgba(0, 212, 255, 0.12);
color: #00d4ff;
border: 1px solid rgba(0, 212, 255, 0.25);

/* 已完成 */
background: rgba(16, 185, 129, 0.1);
color: #10b981;
border: 1px solid rgba(16, 185, 129, 0.25);

/* 待启动 */
background: rgba(245, 158, 11, 0.1);
color: #f59e0b;
border: 1px solid rgba(245, 158, 11, 0.25);
```

## 8. 输入框规范

```css
background: rgba(0, 212, 255, 0.04);
border: 1px solid rgba(0, 212, 255, 0.18);
color: #e8f0fe;
padding: 7px 12px;
font-size: 12px;
font-family: inherit;
```

### 状态

- **默认**：border `rgba(0,212,255,0.18)`
- **焦点**：border `rgba(0,212,255,0.35)`，background `rgba(0,212,255,0.08)`
- **禁用**：opacity 0.5，cursor not-allowed
- **错误**：border `#ef4444`

### Placeholder

```css
color: rgba(160, 180, 204, 0.35);
```

## 9. 页面布局规范

### 导航栏（Navbar）

```css
height: 54px;
background: rgba(2, 12, 27, 0.94);
border-bottom: 1px solid rgba(0, 212, 255, 0.18);
backdrop-filter: blur(12px);
padding: 0 24px;
display: flex;
align-items: center;
gap: 14px;
position: sticky;
top: 0;
z-index: 100;
```

### 主内容区

```css
max-width: 1200px;
margin: 0 auto;
padding: 32px 24px;
position: relative;
z-index: 1;
```

### 网格布局

- **项目卡片网格**：`grid-template-columns: repeat(3, 1fr); gap: 16px;`
- **统计卡片网格**：`grid-template-columns: repeat(4, 1fr); gap: 14px;`
- **响应式**：@media (max-width: 1024px) 改为 2 列，@media (max-width: 768px) 改为 1 列

## 10. 组件规范

### 卡片（Card）

```css
border: 1px solid rgba(0, 212, 255, 0.18);
background: rgba(4, 18, 37, 0.85);
padding: 18px;
position: relative;

/* 顶部装饰条 */
::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #00d4ff, transparent);
}
```

### 进度条

```css
height: 3px;
background: rgba(255, 255, 255, 0.06);
border-radius: 2px;

/* 填充部分 */
.pc-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #059669);
  border-radius: 2px;
}
```

### 标签/徽章（Badge）

```css
font-size: 10px;
font-weight: 600;
padding: 3px 8px;
border-radius: 4px;
display: inline-block;
```

### 图标

- 库：Font Awesome 6.4.0
- 大小：通常 12px-18px
- 颜色：继承文本颜色或显式指定

## 11. 动画与过渡

### 过渡效果

```css
/* 默认过渡 */
transition: all 0.15s ease;

/* 快速过渡（悬停） */
transition: all 0.1s ease;

/* 缓慢过渡（模态框） */
transition: all 0.3s ease;
```

### 禁用动画

- 避免在生产环境使用 @keyframes 动画
- 优先使用 CSS transition 和 transform
- 不使用 animation 属性

## 12. 响应式设计

### 断点

```css
/* 桌面 */
@media (min-width: 1200px) {
}

/* 平板 */
@media (max-width: 1024px) {
}

/* 手机 */
@media (max-width: 768px) {
}

/* 小手机 */
@media (max-width: 480px) {
}
```

### 移动优先原则

- 先写手机样式，再用 @media 覆盖桌面
- 字体大小不低于 16px（避免 iOS 自动放大）
- 触摸区域最小 44px × 44px

## 13. 无障碍设计

### 焦点指示

```css
:focus {
  outline: 2px solid #00d4ff;
  outline-offset: 2px;
}
```

### 颜色对比度

- 文本与背景对比度 ≥ 4.5:1（WCAG AA）
- 强调色与背景对比度 ≥ 3:1

### 键盘导航

- 所有交互元素可通过 Tab 键访问
- 使用 `tabindex` 管理焦点顺序
- 提供 ESC 键关闭模态框

## 14. 页面特定规范

### 登录页（login.html）

- 居中布局，宽度 380px
- 两个 Tab：手机号登录、账号登录
- 输入框宽度 100%
- 按钮宽度 100%

### 项目控制台（projects.html）

- 顶部欢迎条 + 统计卡片
- 筛选栏（全部、进行中、已完成、待启动）
- 搜索框右对齐
- 项目卡片 3 列网格
- 卡片内容：图标+标题+元数据 → 进度条 → 预计结束 → 状态徽章+时间

### 上传页（upload.html）

- 中央卡片布局
- 文件拖拽区域
- 必传/选传文件列表
- 上传进度条

### AI 工作台（app.html）

- 左侧 AI 对话助手（固定宽度 280px）
- 右侧内容区（flex 1）
- 顶部 Tab 栏（工期-成本分析、上传文件、施工组织设计等）
- 内容区域滚动

## 15. 网络图（Network Diagram）特殊规范

### SVG 网络图

- 格式：单代号网络图（AON）
- 节点：圆形，直径 56px
- 节点颜色：
  - 关键节点：红色 `#ef4444`，发光效果
  - 普通节点：青色 `#00d4ff`，发光效果
- 路径：
  - 关键路径：红橙渐变 `linear-gradient(90deg, #ef4444, #f97316)`，宽度 2.5px
  - 普通路径：青色 `rgba(0,212,255,0.3)`，宽度 1.5px，虚线
- 箭头：三角形，颜色同路径
- 节点标签：
  - 顶部：节点编号（Space Grotesk, 13px, 700）
  - 中部：任务名称（Noto Sans SC, 9px, 500）
  - 底部：工期（Space Grotesk, 8px）
- 参数标签（ES/EF/TF）：8px, 半透明

### 网络图背景

```css
background: radial-gradient(ellipse at center, rgba(0, 30, 60, 0.6) 0%, rgba(4, 18, 37, 1) 70%);
```

### 网络图控制

- 缩放按钮：+/- 各 15% 倍数
- 重置按钮：回到 100% 缩放
- 拖拽滚动：支持

## 16. 工期-成本分析图表

### Chart.js 配置

```javascript
{
  type: 'line',
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, labels: { color: 'rgba(160,180,204,0.65)' } }
    },
    scales: {
      x: { ticks: { color: 'rgba(160,180,204,0.65)' } },
      y: { ticks: { color: 'rgba(160,180,204,0.65)' } }
    }
  }
}
```

### 数据集颜色

- 直接成本：`#10b981`（绿）
- 间接成本：`#f59e0b`（黄）
- 总成本：`#00d4ff`（青）

## 17. 状态与反馈

### 加载状态

- 使用 Font Awesome spinner：`<i class="fas fa-spinner"></i>`
- 旋转动画：`animation: spin 1s linear infinite;`

### 成功状态

- 绿色勾号：`<i class="fas fa-check-circle"></i>`
- 背景：`rgba(16,185,129,0.1)`

### 错误状态

- 红色叉号：`<i class="fas fa-times-circle"></i>`
- 背景：`rgba(239,68,68,0.1)`

### 空状态

- 灰色图标 + 说明文字
- 文字颜色：`rgba(160,180,204,0.65)`

## 18. 网格背景

### 全页面网格

```css
body::before {
  content: "";
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 212, 255, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 212, 255, 0.025) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
  z-index: 0;
}
```

## 19. 滚动条样式

```css
::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.15);
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 212, 255, 0.18);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 212, 255, 0.35);
}
```

## 20. 前端开发建议

### 文件组织

```
src/
├── components/
│   ├── Navbar.jsx
│   ├── Card.jsx
│   ├── Button.jsx
│   ├── Badge.jsx
│   └── NetworkDiagram.jsx
├── pages/
│   ├── Login.jsx
│   ├── Projects.jsx
│   ├── Upload.jsx
│   └── Workbench.jsx
├── styles/
│   ├── variables.css (色彩、字体变量)
│   ├── global.css (全局样式)
│   └── components.css (组件样式)
├── utils/
│   ├── api.js
│   └── helpers.js
└── App.jsx
```

### CSS 变量建议

```css
:root {
  --color-bg: #020c1b;
  --color-accent: #00d4ff;
  --color-text: #e8f0fe;
  --color-text-muted: rgba(160, 180, 204, 0.65);
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;

  --font-primary: "Space Grotesk", monospace;
  --font-secondary: "Noto Sans SC", sans-serif;

  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 24px;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

### 性能优化

- 图片使用 CDN URL（已在 HTML 中配置）
- 避免内联大型 SVG，使用 `<img>` 或 `<object>`
- 网络图使用 Canvas 或 SVG，不用 DOM 节点
- 长列表使用虚拟滚动
- 防抖处理搜索、窗口大小改变事件

---

**文档版本**：v1.0  
**最后更新**：2026-04-11  
**适用项目**：A.PM 智管产品原型
