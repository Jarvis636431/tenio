# 组件结构优化设计文档

## 概述

本设计文档详细说明了如何重构 A.PM 智慧建管应用的组件结构，以解决当前存在的空目录、大型组件、重复模式和组织不一致等问题。重构将采用分层架构和模块化设计，提高代码的可维护性、可重用性和可发现性。

## 架构设计

### 新的目录结构

```
src/components/
├── ui/                          # 基础UI组件 (shadcn/ui)
├── shared/                      # 共享组件
│   ├── dialogs/                # 通用对话框组件
│   │   ├── BaseDialog.tsx      # 基础对话框模板
│   │   ├── FormDialog.tsx      # 表单对话框模板
│   │   └── ConfirmDialog.tsx   # 确认对话框
│   ├── forms/                  # 通用表单组件
│   │   ├── BaseForm.tsx        # 基础表单组件
│   │   ├── FormField.tsx       # 表单字段组件
│   │   └── FormValidation.tsx  # 表单验证组件
│   ├── tables/                 # 通用表格组件
│   │   ├── DataTable.tsx       # 数据表格
│   │   ├── TableFilters.tsx    # 表格筛选
│   │   └── TablePagination.tsx # 表格分页
│   ├── charts/                 # 图表组件
│   │   ├── BaseChart.tsx       # 基础图表
│   │   └── CustomTooltip.tsx   # 自定义提示
│   └── layout/                 # 布局相关共享组件
│       ├── PageContainer.tsx   # 页面容器
│       └── SectionCard.tsx     # 区域卡片
├── layout/                      # 应用布局组件
│   ├── AppSidebar.tsx
│   ├── Layout.tsx
│   ├── PageBreadcrumb.tsx
│   ├── PageHeader.tsx
│   └── SidebarToggle.tsx
├── features/                    # 功能模块 (重命名并重组)
│   ├── project/                # 项目管理
│   │   ├── components/         # 项目相关组件
│   │   │   ├── ProjectHomepage.tsx
│   │   │   ├── ProjectSelector.tsx
│   │   │   └── BasicInfo.tsx
│   │   ├── dialogs/           # 项目相关对话框
│   │   │   └── NewProjectDialog.tsx
│   │   └── index.ts           # 统一导出
│   ├── planning/              # 施工计划 (重命名plan)
│   │   ├── components/
│   │   │   ├── TaskOverview.tsx      # 从PlanAndOrders拆分
│   │   │   ├── GanttChart.tsx
│   │   │   └── TaskFilters.tsx       # 筛选逻辑拆分
│   │   ├── dialogs/
│   │   │   ├── NewTaskDialog.tsx
│   │   │   └── TaskDetailDialog.tsx
│   │   └── index.ts
│   ├── monitoring/            # 实时监测
│   │   ├── components/
│   │   │   ├── MonitoringDashboard.tsx  # 从RealTimeMonitoring拆分
│   │   │   ├── CalendarView.tsx         # 日历视图拆分
│   │   │   ├── WeeklyView.tsx           # 周视图拆分
│   │   │   ├── TableView.tsx            # 表格视图拆分
│   │   │   └── DataEntryForm.tsx
│   │   └── index.ts
│   ├── craftsman/             # 工匠管理
│   │   ├── components/
│   │   │   └── CraftsmanManagement.tsx
│   │   ├── dialogs/
│   │   │   ├── EditCraftsmanDialog.tsx
│   │   │   ├── ImportCraftsmanDialog.tsx
│   │   │   └── TeamDetailDialog.tsx
│   │   └── index.ts
│   ├── communication/         # 沟通协作
│   │   ├── components/
│   │   │   └── CommunicationCollaboration.tsx
│   │   ├── dialogs/
│   │   │   ├── AddCommunicationDialog.tsx
│   │   │   ├── EditCommunicationDialog.tsx
│   │   │   └── CommunicationDetailDialog.tsx
│   │   └── index.ts
│   ├── quality/               # 质量管理
│   │   ├── components/
│   │   │   ├── QualityInspection.tsx
│   │   │   ├── DailyLog.tsx
│   │   │   └── KnowledgeQA.tsx
│   │   └── index.ts
│   ├── funding/               # 资金物料
│   │   ├── components/
│   │   │   └── FundingMaterials.tsx
│   │   └── index.ts
│   ├── model/                 # 3D模型
│   │   ├── components/
│   │   │   └── ModelViewer/
│   │   │       └── index.tsx
│   │   └── index.ts
│   └── ai/                    # AI助手
│       ├── components/
│       │   └── AIAssistant.tsx
│       └── index.ts
└── index.ts                   # 全局组件导出
```

## 组件设计

### 1. 共享对话框组件

#### BaseDialog 组件

```typescript
interface BaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
}
```

#### FormDialog 组件

```typescript
interface FormDialogProps<T> extends Omit<BaseDialogProps, "children"> {
  initialData?: T;
  onSubmit: (data: T) => void | Promise<void>;
  validationSchema?: ZodSchema<T>;
  children: (props: FormDialogChildProps<T>) => React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
}
```

### 2. 共享表单组件

#### BaseForm 组件

```typescript
interface BaseFormProps<T> {
  initialData?: T;
  onSubmit: (data: T) => void | Promise<void>;
  validationSchema?: ZodSchema<T>;
  children: React.ReactNode;
  className?: string;
}
```

#### FormField 组件

```typescript
interface FormFieldProps {
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "number" | "select" | "textarea";
  placeholder?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  description?: string;
  className?: string;
}
```

### 3. 共享表格组件

#### DataTable 组件

```typescript
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  loading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  filters?: FilterConfig[];
  onFiltersChange?: (filters: Record<string, any>) => void;
  actions?: TableAction<T>[];
}
```

### 4. 大型组件拆分策略

#### RealTimeMonitoring 拆分

- **MonitoringDashboard**: 主控制面板和状态管理
- **CalendarView**: 日历视图逻辑
- **WeeklyView**: 周视图逻辑
- **TableView**: 表格视图逻辑
- **MonitoringFilters**: 筛选控件
- **MonitoringStats**: 统计信息显示

#### PlanAndOrders 拆分

- **TaskOverview**: 任务概览和表格
- **TaskFilters**: 筛选和搜索逻辑
- **TaskActions**: 操作按钮组
- **GanttChart**: 甘特图组件 (保持独立)

## 数据模型

### 组件配置接口

```typescript
interface ComponentConfig {
  name: string;
  path: string;
  category: "ui" | "shared" | "layout" | "feature";
  dependencies: string[];
  exports: string[];
}

interface DialogConfig {
  title: string;
  size: "sm" | "md" | "lg" | "xl";
  formSchema?: ZodSchema;
  fields: FormFieldConfig[];
}

interface FormFieldConfig {
  name: string;
  type: string;
  label: string;
  validation?: ValidationRule[];
  options?: SelectOption[];
}
```

### 重构映射表

```typescript
interface RefactorMapping {
  oldPath: string;
  newPath: string;
  action: "move" | "split" | "merge" | "delete";
  dependencies: string[];
}
```

## 正确性属性

_属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的正式声明。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。_

### 属性反思

在编写正确性属性之前，让我分析需求中的可测试标准：

**需求 1 - 空目录清理:**

- 1.1: 移除空目录 - 可测试为属性
- 1.2: 共享组件放置 - 可测试为属性
- 1.3: 目录包含文件 - 可测试为属性
- 1.4: 目录用途说明 - 不可测试（文档质量）
- 1.5: 分类指导原则 - 不可测试（文档质量）

**需求 2 - 组件拆分:**

- 2.1: 大组件拆分 - 可测试为属性
- 2.2: 对话框模板统一 - 可测试为属性
- 2.3: 表单逻辑提取 - 可测试为属性
- 2.4: 数据处理 hooks - 可测试为属性
- 2.5: 交互组件标准化 - 可测试为属性

**需求 3 - 模块组织:**

- 3.1: 单组件模块评估 - 可测试为属性
- 3.2: 多组件子分类 - 可测试为属性
- 3.3: 导入路径简化 - 可测试为属性
- 3.4: 职责边界清晰 - 不可测试（架构质量）
- 3.5: 模块组织模板 - 不可测试（文档质量）

**需求 4 - 分层架构:**

- 4.1: 组件分层 - 可测试为属性
- 4.2: 展示组件区分 - 可测试为属性
- 4.3: 状态组件分离 - 可测试为属性
- 4.4: 副作用隔离 - 可测试为属性
- 4.5: 数据流模式 - 可测试为属性

**需求 5 - 可发现性:**

- 5.1: 索引文件导出 - 可测试为属性
- 5.2: 接口定义 - 可测试为属性
- 5.3: README 文件 - 可测试为示例
- 5.4: 使用模式文档 - 不可测试（文档质量）
- 5.5: 导入路径清晰 - 可测试为属性

**需求 6 - 组合模式:**

- 6.1: 对话框组合模式 - 可测试为属性
- 6.2: 表单组件模板 - 可测试为属性
- 6.3: CRUD 组件模式 - 可测试为属性
- 6.4: 图表组件抽象 - 可测试为属性
- 6.5: 组件组合接口 - 可测试为属性

### 属性整合

经过反思，我发现一些属性可以合并以避免冗余：

- 属性 1-3 都涉及目录结构验证，可以合并为一个综合属性
- 属性 4-6 都涉及组件模板和模式，可以合并
- 属性 7-9 都涉及组件分层和职责，可以合并

Property 1: 目录结构一致性
_对于任何_ 组件目录，该目录应该包含实际的组件文件，遵循既定的命名约定，并且不存在空目录
**验证: 需求 1.1, 1.2, 1.3**

Property 2: 组件大小限制
_对于任何_ 组件文件，其行数应该不超过 500 行，如果超过则应该被拆分为更小的专注组件
**验证: 需求 2.1**

Property 3: 对话框模板一致性  
_对于任何_ 对话框组件，它应该继承自 BaseDialog 或 FormDialog 模板，并遵循统一的属性接口
**验证: 需求 2.2, 6.1**

Property 4: 表单组件标准化
_对于任何_ 表单组件，它应该使用 BaseForm 和 FormField 组件，并包含统一的验证逻辑
**验证: 需求 2.3, 6.2**

Property 5: 模块导出完整性
_对于任何_ 功能模块目录，它应该包含 index.ts 文件，该文件导出所有公共组件
**验证: 需求 3.3, 5.1**

Property 6: 组件分层遵循
_对于任何_ 组件，它应该被正确分类到 ui、shared、layout 或 features 层级中，并且不违反层级依赖规则
**验证: 需求 4.1, 4.2, 4.3**

Property 7: 导入路径简化
_对于任何_ 组件导入，应该能够通过简化的路径（最多 3 层深度）进行导入
**验证: 需求 3.3, 5.5**

Property 8: 组件接口定义
_对于任何_ 共享组件，它应该包含完整的 TypeScript 接口定义和属性类型
**验证: 需求 5.2**

## 错误处理

### 重构过程中的错误处理

1. **文件移动失败**: 提供回滚机制，记录所有文件操作
2. **导入路径更新失败**: 使用 AST 解析确保准确更新
3. **类型检查失败**: 分步骤验证，确保每步都通过类型检查
4. **组件拆分错误**: 保留原始文件作为备份，直到验证完成

### 运行时错误处理

1. **组件加载失败**: 提供 fallback 组件
2. **属性验证失败**: 显示开发时警告
3. **循环依赖**: 构建时检测和报告

## 测试策略

### 双重测试方法

本设计采用单元测试和属性测试相结合的方法：

**单元测试**覆盖：

- 共享组件的具体功能
- 对话框模板的渲染和交互
- 表单验证逻辑
- 组件拆分后的集成点

**属性测试**使用 **fast-check** 库验证：

- 目录结构一致性属性
- 组件大小限制属性
- 模板继承属性
- 导入路径属性
- 接口定义完整性属性

每个属性测试配置为运行最少 100 次迭代，确保在各种输入条件下验证系统行为。

属性测试将使用以下格式标记：

```typescript
// **Feature: component-structure-optimization, Property 1: 目录结构一致性**
```

### 测试工具配置

- **单元测试**: Jest + React Testing Library
- **属性测试**: fast-check
- **类型检查**: TypeScript strict mode
- **代码覆盖率**: 目标 >90%

### 验证流程

1. 重构前：运行完整测试套件建立基线
2. 重构中：每个步骤后运行相关测试
3. 重构后：运行完整测试套件验证无回归
4. 持续集成：每次提交自动运行所有测试
