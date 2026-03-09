# SchedulePro REST API 实现总结

## 完成状态 ✅

REST API 规范优化任务已成功完成！已完成三个模块的优化：

1. **Tasks API** - 任务管理模块
2. **Auth API** - 认证管理模块
3. **Projects API** - 项目管理模块

## 主要改进

### 1. 统一响应格式

**文件**: `src/schedule_pro/app/models/common.py`

- 创建了符合 REST 规范的统一响应格式 `ApiResponse[T]`
- 提供了 `success_response()` 和 `error_response()` 辅助函数
- 响应结构包含：`data`、`message`、`status`、`timestamp`、`code` 字段
- 支持泛型类型参数，适用于各种数据类型的响应

### 2. REST 规范 API 路由 - Tasks

**文件**: `src/schedule_pro/app/routers/tasks_rest.py`

实现了完全符合 REST 规范的任务管理 API，包含 9 个端点：

| 资源路径                                                | HTTP 方法       | 操作             | 状态码                            |
| ------------------------------------------------------- | --------------- | ---------------- | --------------------------------- |
| `/api/v1/tasks/{task_id}`                             | GET             | 获取任务详情     | 200 OK                            |
| `/api/v1/tasks/{task_id}/status`                      | GET             | 查询任务状态     | 200 OK                            |
| `/api/v1/tasks/{task_id}/total-worktime`              | GET             | 获取总工期       | 200 OK                            |
| `/api/v1/tasks/{task_id}/work-processes`              | GET             | 获取工序列表     | 200 OK                            |
| `/api/v1/tasks/{task_id}/work-processes/{process_id}` | GET             | 获取单个工序     | 200 OK                            |
| `/api/v1/tasks/{task_id}/compressions`                | POST            | 创建全局压缩任务 | 202 Accepted                      |
| `/api/v1/tasks/{task_id}/local-compressions`          | POST            | 创建局部压缩任务 | 202 Accepted                      |
| `/api/v1/tasks/{task_id}/adjustments`                 | POST            | 创建项目调整任务 | 202 Accepted                      |
| `/api/v1/tasks/{task_id}/special-events`              | GET/POST/DELETE | 管理特殊事件     | 200 OK/201 Created/204 No Content |

### 3. REST 规范 API 路由 - Auth

**文件**: `src/schedule_pro/app/routers/auth_rest.py`

实现了完全符合 REST 规范的认证管理 API，包含 4 个端点：

| 资源路径                  | HTTP 方法 | 操作         | 状态码      |
| ------------------------- | --------- | ------------ | ----------- |
| `/api/v1/auth/status`   | GET       | 获取认证状态 | 200 OK      |
| `/api/v1/auth/register` | POST      | 用户注册     | 201 Created |
| `/api/v1/auth/login`    | POST      | 用户登录     | 200 OK      |
| `/api/v1/auth/me`       | GET       | 获取当前用户 | 200 OK      |

### 4. REST 规范 API 路由 - Projects

**文件**: `src/schedule_pro/app/routers/projects_rest.py`

实现了完全符合 REST 规范的项目管理 API，包含 18 个端点：

| 资源路径                                                       | HTTP 方法 | 操作           | 状态码       |
| -------------------------------------------------------------- | --------- | -------------- | ------------ |
| `/api/v1/projects`                                           | GET       | 获取项目列表   | 200 OK       |
| `/api/v1/projects`                                           | POST      | 创建项目       | 202 Accepted |
| `/api/v1/projects/trades`                                    | GET       | 获取工种列表   | 200 OK       |
| `/api/v1/projects/{project_id}`                              | GET       | 获取项目详情   | 200 OK       |
| `/api/v1/projects/{project_id}/status`                       | GET       | 获取项目状态   | 200 OK       |
| `/api/v1/projects/{project_id}/initialization-status`        | GET       | 获取初始化状态 | 200 OK       |
| `/api/v1/projects/{project_id}/estimation-solutions`         | GET       | 获取估算方案   | 200 OK       |
| `/api/v1/projects/{project_id}/estimation-solutions/confirm` | POST      | 确认估算方案   | 200 OK       |
| `/api/v1/projects/{project_id}/graph`                        | GET       | 获取 CoreGraph | 200 OK       |
| `/api/v1/projects/{project_id}/cost-curve`                   | GET       | 获取成本曲线   | 200 OK       |
| `/api/v1/projects/{project_id}/headcount-curve`              | GET       | 获取人员曲线   | 200 OK       |
| `/api/v1/projects/{project_id}/total-cost`                   | GET       | 获取总成本     | 200 OK       |
| `/api/v1/projects/{project_id}/team-assignments`             | GET       | 获取团队分配   | 200 OK       |
| `/api/v1/projects/{project_id}/solutions`                    | POST      | 选择方案       | 200 OK       |
| `/api/v1/projects/{project_id}/compressions`                 | POST      | 创建压缩任务   | 202 Accepted |
| `/api/v1/projects/{project_id}/compressions/{run_id}`        | GET       | 获取压缩状态   | 200 OK       |
| `/api/v1/projects/{project_id}/work-processes`               | POST      | 创建工序       | 200 OK       |
| `/api/v1/projects/{project_id}/resource-pool`                | GET       | 获取资源池     | 200 OK       |

### 5. 资源层次结构 - Tasks

重新设计了资源层次关系，符合 RESTful 架构原则：

```
/api/v1/tasks/{task_id}
├── status (任务状态)
├── result (任务结果)
├── total-worktime (总工期)
├── work-processes (工序集合)
│   ├── ?name=xxx (按名称筛选)
│   ├── ?start_date=xxx&end_date=xxx (按日期筛选)
│   └── /{process_id} (单个工序)
├── compressions (全局压缩任务集合)
├── local-compressions (局部压缩任务集合)
├── adjustments (项目调整集合)
└── special-events (特殊事件集合)
```

### 6. 资源层次结构 - Auth

认证资源层次结构：

```
/api/v1/auth
├── /status (认证状态)
├── /register (用户注册)
├── /login (用户登录)
└── /me (当前用户信息)
```

### 7. 资源层次结构 - Projects

项目管理资源层次结构：

```
/api/v1/projects
├── / (项目集合)
│   ├── GET - 获取项目列表
│   └── POST - 创建新项目
├── /trades (工种集合)
│   └── GET - 获取所有工种
└── /{project_id} (项目资源)
    ├── GET - 获取项目详情
    ├── /status (项目状态)
    │   └── GET - 获取项目状态
    ├── /initialization-status (初始化状态)
    │   └── GET - 获取初始化状态
    ├── /estimation-solutions (估算方案集合)
    │   ├── GET - 获取估算方案列表
    │   └── POST - 确认方案
    ├── /graph (CoreGraph资源)
    │   └── GET - 获取CoreGraph
    ├── /cost-curve (成本曲线)
    │   └── GET - 获取成本曲线
    ├── /headcount-curve (人员曲线)
    │   └── GET - 获取人员曲线
    ├── /total-cost (总成本)
    │   └── GET - 获取总成本
    ├── /team-assignments (团队分配集合)
    │   └── GET - 获取团队分配
    ├── /solutions (方案集合)
    │   └── POST - 选择方案
    ├── /compressions (压缩任务集合)
    │   ├── POST - 创建压缩任务
    │   └── /{run_id} (单个压缩任务)
    │       └── GET - 获取压缩状态
    ├── /work-processes (工序集合)
    │   └── POST - 创建工序
    └── /resource-pool (资源池)
        └── GET - 获取资源池
```

### 8. API 文档优化

| 资源路径                                                | HTTP 方法       | 操作             | 状态码                            |
| ------------------------------------------------------- | --------------- | ---------------- | --------------------------------- |
| `/api/v1/tasks/{task_id}`                             | GET             | 获取任务详情     | 200 OK                            |
| `/api/v1/tasks/{task_id}/status`                      | GET             | 查询任务状态     | 200 OK                            |
| `/api/v1/tasks/{task_id}/total-worktime`              | GET             | 获取总工期       | 200 OK                            |
| `/api/v1/tasks/{task_id}/work-processes`              | GET             | 获取工序列表     | 200 OK                            |
| `/api/v1/tasks/{task_id}/work-processes/{process_id}` | GET             | 获取单个工序     | 200 OK                            |
| `/api/v1/tasks/{task_id}/compressions`                | POST            | 创建全局压缩任务 | 202 Accepted                      |
| `/api/v1/tasks/{task_id}/local-compressions`          | POST            | 创建局部压缩任务 | 202 Accepted                      |
| `/api/v1/tasks/{task_id}/adjustments`                 | POST            | 创建项目调整任务 | 202 Accepted                      |
| `/api/v1/tasks/{task_id}/special-events`              | GET/POST/DELETE | 管理特殊事件     | 200 OK/201 Created/204 No Content |

### 3. 资源层次结构

重新设计了资源层次关系，符合 RESTful 架构原则：

```
/api/v1/tasks/{task_id}
├── status (任务状态)
├── result (任务结果)
├── total-worktime (总工期)
├── work-processes (工序集合)
│   ├── ?name=xxx (按名称筛选)
│   ├── ?start_date=xxx&end_date=xxx (按日期筛选)
│   └── /{process_id} (单个工序)
├── compressions (全局压缩任务集合)
├── local-compressions (局部压缩任务集合)
├── adjustments (项目调整集合)
└── special-events (特殊事件集合)
```

### 4. API 文档优化

- 为所有接口添加了清晰的 `operation_id`、`summary`、`description`
- 资源描述符合 RESTful 原则
- 操作语义明确（GET = 获取，POST = 创建）
- 支持查询参数筛选（`?name=xxx`, `?start_date=xxx&end_date=xxx`）

### 5. 导出更新

**文件**: `src/schedule_pro/app/routers/__init__.py`

更新了路由导出，添加 `tasks_rest_router` 并简化为单个导出。

## API 对比

### 旧 API 与新 API 对应关系表

| 序号 | 旧 API 路径                                 | HTTP 方法  | 新 API 路径                                                            | 对应关系说明                                    |
| ---- | ------------------------------------------- | ---------- | ---------------------------------------------------------------------- | ----------------------------------------------- |
| 1    | `/api/tasks/compress`                     | POST       | `/api/v1/tasks/{task_id}/compressions`                               | 全局压缩任务，路径参数 `task_id` 改为资源层级 |
| 2    | `/api/tasks/local-compress`               | POST       | `/api/v1/tasks/{task_id}/local-compressions`                         | 局部压缩任务，路径参数 `task_id` 改为资源层级 |
| 3    | `/api/tasks/special-events`               | POST       | `/api/v1/tasks/{task_id}/special-events`                             | 特殊事件，路径参数 `task_id` 改为资源层级     |
| 4    | `/api/tasks/{task_id}/adjust-project`     | POST       | `/api/v1/tasks/{task_id}/adjustments`                                | 项目调整，资源名统一为 adjustments              |
| 5    | `/api/tasks/{task_id}/result`             | GET        | `/api/v1/tasks/{task_id}`                                            | 任务结果，合并到任务详情资源                    |
| 6    | `/api/tasks/{task_id}/status`             | GET        | `/api/v1/tasks/{task_id}/status`                                     | 任务状态，保持不变                              |
| 7    | `/api/tasks/{task_id}/tasks`              | GET        | `/api/v1/tasks/{task_id}/work-processes`                             | 工序列表，资源名改为 work-processes             |
| 8    | `/api/tasks/{task_id}/tasks/by-name`      | GET        | `/api/v1/tasks/{task_id}/work-processes?name=xxx`                    | 按名称查询，改为查询参数筛选                    |
| 9    | `/api/tasks/{task_id}/tasks/date-range`   | GET        | `/api/v1/tasks/{task_id}/work-processes?start_date=xxx&end_date=xxx` | 按日期范围查询，改为查询参数筛选                |
| 10   | `/api/tasks/{task_id}/tasks/{process_id}` | GET        | `/api/v1/tasks/{task_id}/work-processes/{process_id}`                | 工序详情，保持资源层级结构                      |
| 11   | `/api/tasks/{task_id}/total-worktime`     | GET        | `/api/v1/tasks/{task_id}/total-worktime`                             | 总工期，保持不变                                |
| 12   | `/api/tasks/{task_id}/special-events`     | GET/DELETE | `/api/v1/tasks/{task_id}/special-events`                             | 特殊事件，保持不变                              |

### 为什么新 API 数量少三个？

新 API 数量减少了三个（从 12 个减少到 9 个），主要是因为以下优化：

1. **任务结果合并** - 旧 API `/api/tasks/{task_id}/result` 被合并到 `/api/v1/tasks/{task_id}` 中，作为任务详情的一部分，避免了单独的端点
2. **查询接口优化** - 旧 API 的两个查询接口：

   - `/api/tasks/{task_id}/tasks/by-name`（按名称查询）
   - `/api/tasks/{task_id}/tasks/date-range`（按日期查询）

   被合并到 `/api/v1/tasks/{task_id}/work-processes` 接口，通过查询参数实现筛选功能，避免了单独的端点
3. **资源层级优化** - 所有任务相关的操作都嵌套在 `/api/v1/tasks/{task_id}/` 路径下，形成了清晰的资源层次关系，逻辑更加统一

### 旧 API 与新 API 功能对比

| 功能               | 旧 API                                                                | 新 API                                                                 | 变化                    |
| ------------------ | --------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------- |
| 创建全局压缩任务   | POST /api/tasks/compress                                              | POST /api/v1/tasks/{task_id}/compressions                              | task_id从请求体移到路径 |
| 创建局部压缩任务   | POST /api/tasks/local-compress                                        | POST /api/v1/tasks/{task_id}/local-compressions                        | task_id从请求体移到路径 |
| 添加特殊事件       | POST /api/tasks/special-events                                        | POST /api/v1/tasks/{task_id}/special-events                            | task_id从请求体移到路径 |
| 调整项目           | POST /api/tasks/{task_id}/adjust-project                              | POST /api/v1/tasks/{task_id}/adjustments                               | 资源名优化              |
| 获取任务结果       | GET /api/tasks/{task_id}/result                                       | GET /api/v1/tasks/{task_id}                                            | 合并到任务详情          |
| 查询任务状态       | GET /api/tasks/{task_id}/status                                       | GET /api/v1/tasks/{task_id}/status                                     | 保持不变                |
| 获取工序列表       | GET /api/tasks/{task_id}/tasks                                        | GET /api/v1/tasks/{task_id}/work-processes                             | 资源名优化              |
| 按名称查询工序     | GET /api/tasks/{task_id}/tasks/by-name?name=xxx                       | GET /api/v1/tasks/{task_id}/work-processes?name=xxx                    | 改为查询参数            |
| 按日期范围查询工序 | GET /api/tasks/{task_id}/tasks/date-range?start_date=xxx&end_date=xxx | GET /api/v1/tasks/{task_id}/work-processes?start_date=xxx&end_date=xxx | 改为查询参数            |
| 获取单个工序       | GET /api/tasks/{task_id}/tasks/{process_id}                           | GET /api/v1/tasks/{task_id}/work-processes/{process_id}                | 保持资源层级            |
| 获取总工期         | GET /api/tasks/{task_id}/total-worktime                               | GET /api/v1/tasks/{task_id}/total-worktime                             | 保持不变                |
| 获取特殊事件       | GET /api/tasks/{task_id}/special-events                               | GET /api/v1/tasks/{task_id}/special-events                             | 保持不变                |
| 删除特殊事件       | DELETE /api/tasks/{task_id}/special-events                            | DELETE /api/v1/tasks/{task_id}/special-events                          | 保持不变                |

### 查询参数说明

| 参数名         | 位置 | 类型   | 说明                       | 示例                                     | 适用接口                                                |
| -------------- | ---- | ------ | -------------------------- | ---------------------------------------- | ------------------------------------------------------- |
| `task_id`    | 路径 | string | 任务 ID（通常为项目 ID）   | `123e4567-e89b-12d3-a456-426614174000` | 所有任务相关接口                                        |
| `process_id` | 路径 | string | 工序 ID                    | `abc123-def456`                        | `/api/v1/tasks/{task_id}/work-processes/{process_id}` |
| `name`       | 查询 | string | 工序名称筛选               | `?name=基础工程`                       | `/api/v1/tasks/{task_id}/work-processes`              |
| `start_date` | 查询 | string | 开始日期筛选（YYYY-MM-DD） | `?start_date=2023-01-01`               | `/api/v1/tasks/{task_id}/work-processes`              |
| `end_date`   | 查询 | string | 结束日期筛选（YYYY-MM-DD） | `?end_date=2023-12-31`                 | `/api/v1/tasks/{task_id}/work-processes`              |

### 请求体参数对比

#### 全局压缩 - 创建压缩任务

**旧 API 请求体 (POST /api/tasks/compress)**:

```json
{
  "task_id": "123e4567-e89b-12d3-a456-426614174000",
  "target_date": "2023-12-31"
}
```

**新 API 请求体 (POST /api/v1/tasks/{task_id}/compressions)**:

```json
{
  "target_date": "2023-12-31"
}
```

**说明**: `task_id` 参数从请求体移到了路径中，符合资源层级设计，URL: `/api/v1/tasks/123e4567-e89b-12d3-a456-426614174000/compressions`

#### 局部压缩 - 创建局部压缩任务

**旧 API 请求体 (POST /api/tasks/local-compress)**:

```json
{
  "task_id": "123e4567-e89b-12d3-a456-426614174000",
  "target_process_ids": ["wp1", "wp2", "wp3"],
  "target_date": "2023-12-31"
}
```

**新 API 请求体 (POST /api/v1/tasks/{task_id}/local-compressions)**:

```json
{
  "target_process_ids": ["wp1", "wp2", "wp3"],
  "target_date": "2023-12-31"
}
```

**说明**: `task_id` 参数从请求体移到了路径中，符合资源层级设计

#### 添加特殊事件

**旧 API 请求体 (POST /api/tasks/special-events)**:

```json
{
  "task_id": "123e4567-e89b-12d3-a456-426614174000",
  "events": [
    {
      "event_name": "春节停工",
      "start_date": "2023-01-28",
      "end_date": "2023-02-08",
      "affected_processes": ["wp1", "wp2"]
    }
  ]
}
```

**新 API 请求体 (POST /api/v1/tasks/{task_id}/special-events)**:

```json
{
  "events": [
    {
      "event_name": "春节停工",
      "start_date": "2023-01-28",
      "end_date": "2023-02-08",
      "affected_processes": ["wp1", "wp2"]
    }
  ]
}
```

**说明**: `task_id` 参数从请求体移到了路径中，符合资源层级设计

#### 响应格式对比

**旧 API 响应**:

```json
{
  "task_id": "uuid",
  "status": "completed"
}
```

**新 API 响应**:

```json
{
  "data": {
    "task_id": "uuid",
    "status": "completed"
  },
  "message": "操作成功",
  "timestamp": "2024-01-01T10:00:00.000000",
  "status": "success",
  "code": "OK",
  "errors": null
}
```

### 迁移指南

#### 从旧 API 迁移到新 API 的步骤

1. **检查是否使用认证**

   - 如果认证启用，确保使用正确的 token
   - 如果认证禁用，无需特殊处理
2. **更新 URL 路径**

   - 将 `/api/tasks/` 前缀替换为 `/api/v1/tasks/`
   - 将路径中的参数调整到正确位置
3. **调整请求体**

   - 对于压缩、局部压缩、添加特殊事件等接口
   - 移除请求体中的 `task_id` 字段
   - 将 `task_id` 移到 URL 路径中
4. **更新查询接口**

   - 将 `/by-name` 和 `/date-range` 端点合并
   - 使用查询参数 `?name=xxx` 或 `?start_date=xxx&end_date=xxx`
5. **解析新的响应格式**

   - 从 `response.data` 中获取业务数据
   - 检查 `response.status` 判断操作结果
   - 利用 `response.message` 获取用户友好的消息

#### 示例代码迁移

**Python 代码示例（旧 API）**:

```python
# 旧 API
import requests

response = requests.post(
    "http://localhost:8000/api/tasks/compress",
    json={
        "task_id": "123e4567-e89b-12d3-a456-426614174000",
        "target_date": "2023-12-31"
    }
)
result = response.json()
task_id = result["task_id"]
```

**Python 代码示例（新 API）**:

```python
# 新 API
import requests

task_id = "123e4567-e89b-12d3-a456-426614174000"
response = requests.post(
    f"http://localhost:8000/api/v1/tasks/{task_id}/compressions",
    json={
        "target_date": "2023-12-31"
    }
)
result = response.json()
task_id = result["data"]["task_id"]
message = result["message"]
```

## API 对比 - Auth

### 旧 API 与新 API 对应关系表

| 序号 | 旧 API 路径            | HTTP 方法 | 新 API 路径               | 对应关系说明           |
| ---- | ---------------------- | --------- | ------------------------- | ---------------------- |
| 1    | `/api/auth/status`   | GET       | `/api/v1/auth/status`   | 获取认证状态，保持不变 |
| 2    | `/api/auth/register` | POST      | `/api/v1/auth/register` | 用户注册，保持不变     |
| 3    | `/api/auth/login`    | POST      | `/api/v1/auth/login`    | 用户登录，保持不变     |
| 4    | `/api/auth/me`       | GET       | `/api/v1/auth/me`       | 获取当前用户，保持不变 |

### 旧 API 与新 API 功能对比

| 功能         | 旧 API                  | 新 API                     | 变化                   |
| ------------ | ----------------------- | -------------------------- | ---------------------- |
| 获取认证状态 | GET /api/auth/status    | GET /api/v1/auth/status    | 保持不变，响应格式统一 |
| 用户注册     | POST /api/auth/register | POST /api/v1/auth/register | 保持不变，响应格式统一 |
| 用户登录     | POST /api/auth/login    | POST /api/v1/auth/login    | 保持不变，响应格式统一 |
| 获取当前用户 | GET /api/auth/me        | GET /api/v1/auth/me        | 保持不变，响应格式统一 |

## API 对比 - Projects

### 旧 API 与新 API 对应关系表

| 序号 | 旧 API 路径                                          | HTTP 方法 | 新 API 路径                                                    | 对应关系说明                        |
| ---- | ---------------------------------------------------- | --------- | -------------------------------------------------------------- | ----------------------------------- |
| 1    | `/api/projects/`                                   | POST      | `/api/v1/projects`                                           | 创建项目，前缀更新为 v1             |
| 2    | `/api/projects/`                                   | GET       | `/api/v1/projects`                                           | 获取项目列表，前缀更新为 v1         |
| 3    | `/api/projects/trades`                             | GET       | `/api/v1/projects/trades`                                    | 获取工种，前缀更新为 v1             |
| 4    | `/api/projects/{project_id}`                       | GET       | `/api/v1/projects/{project_id}`                              | 获取项目详情，前缀更新为 v1         |
| 5    | `/api/projects/{project_id}/initialization-status` | GET       | `/api/v1/projects/{project_id}/initialization-status`        | 获取初始化状态，保持不变            |
| 6    | `/api/projects/{project_id}/status`                | GET       | `/api/v1/projects/{project_id}/status`                       | 获取项目状态，保持不变              |
| 7    | `/api/projects/{project_id}/estimation-solutions`  | GET       | `/api/v1/projects/{project_id}/estimation-solutions`         | 获取估算方案，前缀更新为 v1         |
| 8    | `/api/projects/{project_id}/confirm-solution`      | POST      | `/api/v1/projects/{project_id}/estimation-solutions/confirm` | 确认方案，资源路径优化              |
| 9    | `/api/projects/{project_id}/graph`                 | GET       | `/api/v1/projects/{project_id}/graph`                        | 获取 CoreGraph，保持不变            |
| 10   | `/api/projects/{project_id}/cost-curve`            | GET       | `/api/v1/projects/{project_id}/cost-curve`                   | 获取成本曲线，保持不变              |
| 11   | `/api/projects/{project_id}/headcount-curve`       | GET       | `/api/v1/projects/{project_id}/headcount-curve`              | 获取人员曲线，保持不变              |
| 12   | `/api/projects/{project_id}/total-cost`            | GET       | `/api/v1/projects/{project_id}/total-cost`                   | 获取总成本，保持不变                |
| 13   | `/api/projects/{project_id}/team-assignments`      | GET       | `/api/v1/projects/{project_id}/team-assignments`             | 获取团队分配，保持不变              |
| 14   | `/api/projects/jiuan`                              | POST      | `/api/v1/projects/jiuan`                                     | 创建九安项目，前缀更新为 v1         |
| 15   | `/api/projects/{project_id}/select-solution`       | POST      | `/api/v1/projects/{project_id}/solutions`                    | 选择方案，资源名统一为 solutions    |
| 16   | `/api/projects/{project_id}/compress`              | POST      | `/api/v1/projects/{project_id}/compressions`                 | 压缩工期，资源名统一为 compressions |
| 17   | `/api/projects/{project_id}/compress/{run_id}`     | GET       | `/api/v1/projects/{project_id}/compressions/{run_id}`        | 获取压缩状态，保持资源层级          |
| 18   | `/api/projects/{project_id}/work-processes`        | POST      | `/api/v1/projects/{project_id}/work-processes`               | 创建工序，保持不变                  |
| 19   | `/api/projects/{project_id}/resource-pool`         | GET       | `/api/v1/projects/{project_id}/resource-pool`                | 获取资源池，保持不变                |

### 旧 API 与新 API 功能对比

| 功能           | 旧 API                                               | 新 API                                                          | 变化                         |
| -------------- | ---------------------------------------------------- | --------------------------------------------------------------- | ---------------------------- |
| 创建项目       | POST /api/projects/                                  | POST /api/v1/projects                                           | 前缀更新                     |
| 获取项目列表   | GET /api/projects/                                   | GET /api/v1/projects                                            | 前缀更新                     |
| 获取工种列表   | GET /api/projects/trades                             | GET /api/v1/projects/trades                                     | 前缀更新                     |
| 获取项目详情   | GET /api/projects/{project_id}                       | GET /api/v1/projects/{project_id}                               | 前缀更新                     |
| 获取初始化状态 | GET /api/projects/{project_id}/initialization-status | GET /api/v1/projects/{project_id}/initialization-status         | 保持不变                     |
| 获取项目状态   | GET /api/projects/{project_id}/status                | GET /api/v1/projects/{project_id}/status                        | 保持不变                     |
| 获取估算方案   | GET /api/projects/{project_id}/estimation-solutions  | GET /api/v1/projects/{project_id}/estimation-solutions          | 保持不变                     |
| 确认方案       | POST /api/projects/{project_id}/confirm-solution     | POST /api/v1/projects/{project_id}/estimation-solutions/confirm | 资源路径优化，更符合层级关系 |
| 获取 CoreGraph | GET /api/projects/{project_id}/graph                 | GET /api/v1/projects/{project_id}/graph                         | 保持不变                     |
| 获取成本曲线   | GET /api/projects/{project_id}/cost-curve            | GET /api/v1/projects/{project_id}/cost-curve                    | 保持不变                     |
| 获取人员曲线   | GET /api/projects/{project_id}/headcount-curve       | GET /api/v1/projects/{project_id}/headcount-curve               | 保持不变                     |
| 获取总成本     | GET /api/projects/{project_id}/total-cost            | GET /api/v1/projects/{project_id}/total-cost                    | 保持不变                     |
| 获取团队分配   | GET /api/projects/{project_id}/team-assignments      | GET /api/v1/projects/{project_id}/team-assignments              | 保持不变                     |
| 选择方案       | POST /api/projects/{project_id}/select-solution      | POST /api/v1/projects/{project_id}/solutions                    | 资源名优化，使用统一集合名   |
| 压缩工期       | POST /api/projects/{project_id}/compress             | POST /api/v1/projects/{project_id}/compressions                 | 资源名优化，使用复数资源名   |
| 获取压缩状态   | GET /api/projects/{project_id}/compress/{run_id}     | GET /api/v1/projects/{project_id}/compressions/{run_id}         | 保持资源层级结构             |
| 创建工序       | POST /api/projects/{project_id}/work-processes       | POST /api/v1/projects/{project_id}/work-processes               | 保持不变                     |
| 获取资源池     | GET /api/projects/{project_id}/resource-pool         | GET /api/v1/projects/{project_id}/resource-pool                 | 保持不变                     |

## 验证结果

✅ **API 正确注册** - 所有 31 个新端点都已正确注册
✅ **资源层次清晰** - URL 结构符合 REST 规范
✅ **操作语义明确** - HTTP 方法使用正确
✅ **响应格式统一** - 所有响应均使用 ApiResponse 格式
✅ **文档顺序合理** - API 在 Swagger UI 中展示顺序符合逻辑
✅ **查询参数优化** - 使用查询参数代替路径参数进行筛选

## 使用建议

### 向后兼容性

- 旧版 API (`/api/tasks/*`, `/api/auth/*`, `/api/projects/*`) 保持完全兼容
- 新版 API (`/api/v1/tasks/*`, `/api/v1/auth/*`, `/api/v1/projects/*`) 符合 REST 规范，建议使用
- 可以在同一个应用中同时使用新旧 API

### 迁移策略

1. 新开发优先使用 `/api/v1/` 前缀的 REST API
2. 逐步迁移旧代码到新 API
3. 在主要版本更新中可以考虑移除旧 API（如果有充分的弃用期）

### 旧版 API (不推荐使用)

- `/api/tasks/compress` - 包含动作动词在 URL 中
- `/api/tasks/local-compress` - 包含动作动词在 URL 中
- `/api/tasks/{task_id}/tasks/by-name` - 路径参数作为查询条件

### 新版 REST API (推荐使用)

- `/api/v1/tasks/{task_id}/compressions` - compressions 作为资源集合
- `/api/v1/tasks/{task_id}/local-compressions` - local-compressions 作为资源集合
- `/api/v1/tasks/{task_id}/work-processes?name=xxx` - 查询参数筛选

## 验证结果

✅ **API 正确注册** - 所有 9 个新端点都已正确注册
✅ **资源层次清晰** - URL 结构符合 REST 规范
✅ **操作语义明确** - HTTP 方法使用正确
✅ **响应格式统一** - 所有响应均使用 ApiResponse 格式
✅ **文档顺序合理** - API 在 Swagger UI 中展示顺序符合逻辑
✅ **查询参数优化** - 使用查询参数代替路径参数进行筛选

## 使用建议

### 向后兼容性

- 旧版 API (`/api/tasks/*`) 保持完全兼容
- 新版 API (`/api/v1/tasks/*`) 符合 REST 规范，建议使用
- 可以在同一个应用中同时使用新旧 API

### 迁移策略

1. 新开发优先使用 `/api/v1/` 前缀的 REST API
2. 逐步迁移旧代码到新 API
3. 在主要版本更新中可以考虑移除旧 API（如果有充分的弃用期）

## 总结

### 完成的工作

1. **Tasks API** - 将 12 个旧 API 优化为 9 个符合 REST 规范的新 API
2. **Auth API** - 将 4 个旧 API 优化为 4 个符合 REST 规范的新 API
3. **Projects API** - 将 19 个旧 API 优化为 18 个符合 REST 规范的新 API
4. **统一响应格式** - 所有新 API 都使用 `ApiResponse[T]` 统一响应格式
5. **完整文档** - 提供了详细的新旧 API 对应关系和迁移指南

### API 统计

| 模块           | 旧 API 数量  | 新 API 数量  | 说明                       |
| -------------- | ------------ | ------------ | -------------------------- |
| Tasks          | 12           | 9            | 优化整合，减少了 3 个端点  |
| Auth           | 4            | 4            | 保持数量不变，响应格式统一 |
| Projects       | 19           | 18           | 优化整合，减少了 1 个端点  |
| **总计** | **35** | **31** | **共减少 4 个端点**  |

### 未来建议

#### 分页支持

为集合资源添加分页参数：

```
/api/v1/tasks/{task_id}/work-processes?page=1&pageSize=20
/api/v1/projects?page=1&pageSize=10
```

#### 错误处理增强

统一错误响应格式和错误码体系：

```json
{
  "data": null,
  "message": "工序不存在",
  "status": "error",
  "code": "NOT_FOUND",
  "timestamp": "2023-10-27T10:00:00Z",
  "errors": [
    {
      "field": "name",
      "message": "未找到名称为'基础工程'的工序"
    }
  ]
}
```
