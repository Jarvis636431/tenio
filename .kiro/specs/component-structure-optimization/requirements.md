# 需求文档

## 介绍

本文档概述了优化 A.PM 智慧建管应用组件结构的需求。当前结构是有机增长的，需要重新组织以提高可维护性、可发现性和开发效率，同时遵循 React 和 TypeScript 最佳实践。

## 术语表

- **组件系统**: React 组件架构和文件组织结构
- **功能模块**: 与特定业务领域相关的组件逻辑分组
- **共享组件**: 可在多个功能间重复使用的组件
- **UI 组件**: 来自设计系统的低级通用组件 (shadcn/ui)
- **业务组件**: 包含特定领域逻辑和功能的组件
- **布局组件**: 负责页面结构和导航的组件

## 需求

### 需求 1

**用户故事:** 作为开发者，我希望消除空目录和未使用的结构，以便有清晰的组件组织架构。

#### 验收标准

1. WHEN 检查组件目录 THEN 组件系统 SHALL 移除所有空目录（shared/charts、shared/dialogs、shared/forms、routes、monitoring/shared、plan/shared）
2. WHEN 组织共享组件 THEN 组件系统 SHALL 将实际使用的共享组件放置在有意义的目录结构中
3. WHEN 检查文件结构 THEN 组件系统 SHALL 确保每个目录都有实际的组件文件
4. WHEN 浏览代码库 THEN 组件系统 SHALL 提供清晰的目录用途说明
5. WHEN 添加新组件 THEN 组件系统 SHALL 有明确的目录分类指导原则

### 需求 2

**用户故事:** 作为开发者，我希望拆分大型组件并提取重复的对话框模式，以便提高代码可维护性和重用性。

#### 验收标准

1. WHEN 组件超过 500 行 THEN 组件系统 SHALL 将其拆分为更小的专注组件（RealTimeMonitoring.tsx、PlanAndOrders.tsx）
2. WHEN 对话框组件有相似结构 THEN 组件系统 SHALL 提供统一的对话框模板（AddCommunicationDialog、EditCraftsmanDialog、NewProjectDialog）
3. WHEN 表单逻辑重复 THEN 组件系统 SHALL 提取通用的表单组件和验证逻辑
4. WHEN 数据处理逻辑相似 THEN 组件系统 SHALL 创建可重用的数据处理 hooks
5. WHEN UI 交互模式重复 THEN 组件系统 SHALL 提供标准化的交互组件（编辑/查看切换、分页、筛选）

### 需求 3

**用户故事:** 作为开发者，我希望统一功能模块的组织模式，以便有一致的代码结构和更好的可维护性。

#### 验收标准

1. WHEN 功能模块只有单个组件 THEN 组件系统 SHALL 评估是否需要独立目录或合并到相关模块
2. WHEN 功能模块有多个相关组件 THEN 组件系统 SHALL 按组件类型进行子分类（如 dialogs、forms、views）
3. WHEN 组件导入路径过深 THEN 组件系统 SHALL 提供统一的导出入口和简化的导入路径
4. WHEN 检查模块结构 THEN 组件系统 SHALL 确保每个模块都有清晰的职责边界
5. WHEN 添加新功能 THEN 组件系统 SHALL 提供标准的模块组织模板

### 需求 4

**用户故事:** 作为开发者，我希望建立清晰的组件分层架构，以便理解不同类型组件的职责和依赖关系。

#### 验收标准

1. WHEN 检查组件 THEN 组件系统 SHALL 将 UI 组件、业务组件、布局组件明确分层
2. WHEN 处理数据展示 THEN 组件系统 SHALL 区分纯展示组件和数据连接组件
3. WHEN 管理状态 THEN 组件系统 SHALL 分离有状态组件和无状态组件
4. WHEN 处理副作用 THEN 组件系统 SHALL 隔离具有外部依赖的组件
5. WHEN 组件间通信 THEN 组件系统 SHALL 建立清晰的数据流和事件传递模式

### 需求 5

**用户故事:** 作为开发者，我希望改善组件的可发现性和文档，以便高效使用现有组件并理解其用途。

#### 验收标准

1. WHEN 探索组件 THEN 组件系统 SHALL 提供导出所有公共组件的索引文件
2. WHEN 使用共享组件 THEN 组件系统 SHALL 包含清晰的接口定义和属性类型
3. WHEN 检查组件目录 THEN 组件系统 SHALL 为复杂功能模块包含 README 文件
4. WHEN 处理组件变体 THEN 组件系统 SHALL 记录组件使用模式和示例
5. WHEN 集成组件 THEN 组件系统 SHALL 提供清晰的导入路径和依赖信息

### 需求 6

**用户故事:** 作为开发者，我希望优化包大小和加载性能，以便应用为最终用户高效加载。

#### 验收标准

1. WHEN 构建应用 THEN 组件系统 SHALL 为未使用的组件启用 tree-shaking
2. WHEN 加载功能 THEN 组件系统 SHALL 支持功能特定组件的懒加载
3. WHEN 导入组件 THEN 组件系统 SHALL 避免阻止优化的循环依赖
4. WHEN 打包共享组件 THEN 组件系统 SHALL 最小化跨块的重复代码
5. WHEN 组织大型组件 THEN 组件系统 SHALL 将复杂组件拆分为更小的专注单元
