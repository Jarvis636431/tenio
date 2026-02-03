# SchedulePro REST API 接口规范

版本: Beta v0.2.0
最后更新: 2025-12-28

---

## 目录

1. [认证接口](#认证接口)
2. [项目管理接口](#项目管理接口)
3. [班组分配接口](#班组分配接口)
4. [数据模型](#数据模型)
5. [工期压缩接口](#工期压缩接口)

---

## 认证接口

### 1. 用户注册

**端点**: `POST /api/auth/register`

**描述**: 创建新用户账号并返回访问令牌

**请求体**:
```json
{
  "username": "string",
  "email": "user@example.com",
  "password": "string",
  "full_name": "string (optional)"
}
```

**响应** (201 Created):
```json
{
  "access_token": "string",
  "token_type": "bearer",
  "user_id": "uuid",
  "username": "string"
}
```

**错误响应**:
- 400 Bad Request: 用户名或邮箱已存在

---

### 2. 用户登录

**端点**: `POST /api/auth/login`

**描述**: 用户登录并获取访问令牌

**请求体**:
```json
{
  "username": "string",
  "password": "string"
}
```

**响应** (200 OK):
```json
{
  "access_token": "string",
  "token_type": "bearer",
  "user_id": "uuid",
  "username": "string"
}
```

**错误响应**:
- 401 Unauthorized: 用户名或密码错误

---

### 3. 获取当前用户信息

**端点**: `GET /api/auth/me`

**描述**: 获取当前认证用户的个人信息

**认证**: 需要 Bearer Token

**响应** (200 OK):
```json
{
  "user_id": "uuid",
  "username": "string",
  "email": "user@example.com",
  "full_name": "string",
  "is_active": true
}
```

---

## 项目管理接口

### 1. 创建项目（Jiuan 模式）

**端点**: `POST /api/projects/jiuan`

**描述**: 创建新项目（Jiuan 模式）。后端从硬编码的九安 Excel 文件中解析工序数据并保存到数据库。此接口同步执行，不触发异步求解。项目创建后处于"已创建"状态，等待前端选择施工方案。

**认证**: 需要 Bearer Token

**请求体**:
```json
{
  "project_name": "string"
}
```

**响应** (200 OK):
```json
{
  "project_id": "uuid",
  "project_name": "string",
  "status": "created",
  "work_process_count": 255,
  "dependency_count": 320
}
```

**说明**:
- 后端从 `data/九安完整0124.xlsx` 读取工序数据
- 自动解析工序名称、工期、工种、前置任务、班组配置、设备资源等
- 默认开工日期设为 2026-02-24（北京时间）
- 工序数据保存到数据库后，可通过 `/graph` 接口查看

**错误响应**:
- 401 Unauthorized: 未认证
- 500 Internal Server Error: 创建失败（Excel 文件不存在或解析失败）

---

### 1.5. 选择施工方案

**端点**: `POST /api/projects/{project_id}/select-solution`

**描述**: 前端选择一个施工方案，后端加载对应的预计算结果（txt 格式），将每个工序的工作时间 intervals 更新到数据库中。

**认证**: 需要 Bearer Token

**路径参数**:
- `project_id` (uuid): 项目ID

**请求体**:
```json
{
  "solution_id": 0
}
```

**solution_id 映射规则**:
- `0`: `data/solutions/example_solution.txt`（默认方案）
- `N` (N >= 1): `data/solutions/solution_N.txt`

**响应** (200 OK):
```json
{
  "project_id": "uuid",
  "solution_id": 0,
  "total_duration_hours": 7764,
  "start_date": "2026-02-24",
  "finish_date": "2027-01-13",
  "matched_tasks": 250,
  "skipped_tasks": 5,
  "holidays": [
    {
      "date": "2026-03-26",
      "name": "清明节"
    },
    {
      "date": "2026-05-01",
      "name": "劳动节"
    }
  ],
  "daily_schedule": {
    "2026-02-24": ["施工准备（临建、临设...）", "测量放线、规划验线", "基础结构施工"],
    "2026-02-25": ["施工准备（临建、临设...）", "测量放线、规划验线"],
    "2026-02-26": ["施工准备（临建、临设...）", "测量放线、规划验线", "外槽剩余土方回填"]
  }
}
```

**字段说明**:
- `total_duration_hours`: 总工期（小时）
- `start_date` / `finish_date`: 开工日期 / 完工日期
- `matched_tasks`: 成功匹配到数据库工序的任务数
- `skipped_tasks`: txt 中存在但数据库中不存在的任务数（已跳过）
- `holidays`: 项目时间范围内的节假日列表（包含日期和名称）
- `daily_schedule`: 按天的施工工序名列表，key 是日期字符串 (YYYY-MM-DD)，value 是当天施工的工序名数组

**错误响应**:
- 400 Bad Request: 请求参数错误
- 403 Forbidden: 无权限
- 404 Not Found: 方案文件不存在
- 500 Internal Server Error: 应用方案失败

### 7. 获取项目 CoreGraph (用于甘特图渲染)

**端点**: `GET /api/projects/{project_id}/graph`

**描述**: 获取项目完整的 CoreGraph 数据，包含所有工序、依赖关系、执行状态等，前端可用此数据渲染甘特图。

**认证**: 需要 Bearer Token

**路径参数**:
- `project_id` (uuid): 项目ID

**响应** (200 OK):
```json
{
  "project_id": "uuid",
  "work_processes": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "code": "WP0001",                    // 自动生成的工序编码 (格式: WP{seq_no:04d})
      "name": "土方开挖",
      "is_dummy": false,                   // 是否为虚拟工序

      // 工程量
      "quantity": 1500.5,
      "unit": "m³",

      // 工期和资源参数
      "base_duration_days": 5.0,           // 基础工期（天）
      "duration_days": 5.0,                // 实际计划工期（从 execution_state 计算得出）
      "team_size": 10,
      "suggested_team_count": 2,
      "construction_coefficient": 1.2,

      // 成本信息
      "labor_cost": 50000.00,
      "material_cost": 120000.00,
      "device_rental_cost": 8000.00,       // 设备租赁成本

      // 建筑信息
      "building_number": "1#",

      // 层级信息 (用于大纲视图)
      "outline_level": 2,
      "outline_path": "1.2",
      "outline_metadata": {},

      // 字典信息 (嵌套对象)
      "trade": {
        "id": 1,
        "name": "土建",
        "code": "TD"
      },
      "process_type": {
        "id": 1,
        "name": "土方工程",
        "code": "TF"
      },
      "selected_method": {
        "id": 1,
        "name": "机械开挖",
        "code": "JXKW"
      },
      "selected_condition": {
        "id": 1,
        "name": "正常施工",
        "code": "NORMAL"
      },

      // 执行状态 (嵌套对象，非数组)
      "execution_state": {
        "id": "uuid",
        "work_process_id": "uuid",
        "status": "planned",               // 状态: planned | in_progress | completed | paused

        // 以 intervals 为主的排程时间（新增结构）
        "planned_intervals": [
          {
            "id": "uuid",
            "execution_state_id": "uuid",
            "start_datetime": "2025-12-23T08:00:00Z",
            "end_datetime": "2025-12-23T18:00:00Z",
            "interval_type": "work",      // work | overtime
            "seq_no": 1
          },
          {
            "id": "uuid",
            "execution_state_id": "uuid",
            "start_datetime": "2025-12-24T08:00:00Z",
            "end_datetime": "2025-12-24T17:00:00Z",
            "interval_type": "work",
            "seq_no": 2
          }
        ],

        // 兼容字段（从 planned_intervals 计算得出；无 interval 时回退到存储值）
        "planned_start_datetime": "2025-12-23T08:00:00Z",
        "planned_end_datetime": "2025-12-24T17:00:00Z",

        // 运行态
        "actual_start_datetime": null,
        "actual_end_datetime": null,
        "progress_percent": 0,
        "critical_path": true              // 是否在关键路径上
      },

      // 施工方法因子 (嵌套数组)
      "method_factors": [
        {
          "id": "uuid",
          "work_process_id": "uuid",
          "method_id": 1,
          "method": {                      // 嵌套的方法字典
            "id": 1,
            "name": "机械开挖",
            "code": "JXKW"
          },
          "factor_value": 1.2
        }
      ],

      // 施工条件因子 (嵌套数组)
      "condition_factors": [
        {
          "id": "uuid",
          "work_process_id": "uuid",
          "condition_id": 1,
          "condition": {                   // 嵌套的条件字典
            "id": 1,
            "name": "雨天",
            "code": "RAINY"
          },
          "factor_value": 0.8
        }
      ]
    }
  ],

  // 依赖关系
  "dependencies": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "from_work_process_id": "uuid",
      "to_work_process_id": "uuid",
      "dependency_type": "finish_to_start",  // FS | SS | FF | SF
      "lag_days": 0,
      "is_deleted": false
    }
  ],

  // 班组分配
  "team_assignments": [
    {
      "id": "uuid",
      "work_process_id": "uuid",
      "team_id": "uuid",
      "assignment_ratio": 1.0,
      "assigned_workers_count": 10
    }
  ],

  // 资源估算
  "resource_estimations": [
    {
      "id": "uuid",
      "work_process_id": "uuid",
      "resource_type": "labor",
      "estimated_quantity": 50.0,
      "unit": "person-days"
    }
  ],

  // 设备资源字典
  "device_resources": [
    {
      "id": 1,
      "code": "CRANE",
      "name": "塔吊"
    }
  ],

  // 工序设备需求
  "work_process_device_resources": [
    {
      "id": "uuid",
      "work_process_id": "uuid",
      "device_resource_id": 1,
      "quantity": 2,
      "device_resource": {                 // 嵌套的设备字典
        "id": 1,
        "code": "CRANE",
        "name": "塔吊"
      }
    }
  ],

  // 顶层列表 (向后兼容，可选使用)
  "execution_states": [...],               // 所有执行状态的平铺列表
  "method_factors": [...],                 // 所有方法因子的平铺列表
  "condition_factors": [...],              // 所有条件因子的平铺列表

  // 元数据
  "version": 1,
  "updated_at": "2025-12-29T10:30:00Z"
}
```

**数据结构说明**:

1. **嵌套 vs 平铺**：
   - ✅ **推荐使用嵌套结构**：`work_process.execution_state`、`work_process.method_factors` 等
   - ⚠️ **避免使用顶层数组**：`execution_states`、`method_factors` 等仅为向后兼容保留

2. **计算字段**：
   - `code`: 从 `seq_no` 自动生成（格式：`WP{seq_no:04d}`）
   - `planned_start_datetime` / `planned_end_datetime`: 从 `planned_intervals` 计算得出；若 `planned_intervals` 为空，回退到存储的起止时间
   - `duration_days`: 仍可由 `planned_start_datetime`、`planned_end_datetime` 计算（兼容字段）

3. **甘特图渲染所需字段**：
   - `id`, `code`, `name`: 工序标识
   - `execution_state.planned_intervals`: 主时间源，包含所有连续工作区间
   - `execution_state.planned_start_datetime`: 由 intervals 推导的开始时间
   - `execution_state.planned_end_datetime`: 由 intervals 推导的结束时间
   - `execution_state.critical_path`: 是否关键路径
   - `dependencies`: 前后置关系

**错误响应**:
- 404 Not Found: 项目不存在
- 403 Forbidden: 无权限访问

---

### 8. 获取项目成本折线图

**端点**: `GET /api/projects/{project_id}/cost-curve`

**描述**: 获取最新一次排程结果产生的累计成本折线图（人工/租赁/总成本）。

**认证**: 需要 Bearer Token

**路径参数**:
- `project_id` (uuid): 项目ID

**响应** (200 OK):
```json
{
  "project_id": "uuid",
  "start_date": "2025-01-01",
  "points": [
    {
      "day_index": 1,
      "labor_cost": 12000.0,
      "rental_cost": 3000.0,
      "total_cost": 15000.0
    },
    {
      "day_index": 2,
      "labor_cost": 22000.0,
      "rental_cost": 4500.0,
      "total_cost": 26500.0
    }
  ],
  "total_labor_cost": 22000.0,
  "total_rental_cost": 4500.0,
  "total_cost": 26500.0,
  "generated_at": "2025-01-01T12:30:00Z"
}
```

**错误响应**:
- 404 Not Found: 项目不存在或尚未生成成本折线图
- 403 Forbidden: 无权限访问

---

## 班组分配接口

### 1. 获取项目的班组分配数据

**端点**: `GET /api/projects/{project_id}/team-assignments`

**描述**: 获取项目中所有班组的工序分配情况（资源池中所有班组对应的工序ID）

**认证**: 需要 Bearer Token

**路径参数**:
- `project_id` (uuid): 项目ID

**响应** (200 OK):
```json
{
  "project_id": "uuid",
  "total_assignments": 2415,
  "assignments": [
    {
      "team_id": "uuid",
      "team_name": "土建班组A1",
      "work_process_id": "uuid",
      "work_process_code": "WP001",
      "work_process_name": "土方开挖",
      "building_number": "1#",
      "planned_start_datetime": "2025-01-01T08:00:00+00:00",
      "planned_end_datetime": "2025-01-05T18:00:00+00:00",
      "assigned_workers_count": 10
    },
    {
      "team_id": "uuid",
      "team_name": "土建班组A1",
      "work_process_id": "uuid",
      "work_process_code": "WP002",
      "work_process_name": "基础浇筑",
      "building_number": "1#",
      "planned_start_datetime": "2025-01-06T08:00:00+00:00",
      "planned_end_datetime": "2025-01-10T18:00:00+00:00",
      "assigned_workers_count": 5
    },
    {
      "team_id": "uuid",
      "team_name": "钢筋班组B2",
      "work_process_id": "uuid",
      "work_process_code": "WP150",
      "work_process_name": "2#楼梁板钢筋绑扎",
      "building_number": "2#",
      "planned_start_datetime": null,
      "planned_end_datetime": null,
      "assigned_workers_count": 8
    }
  ]
}
```

**字段说明**:
- `team_id`, `team_name`: 班组标识和名称
- `work_process_id`, `work_process_code`, `work_process_name`: 工序标识、编码和名称
- `building_number`: 楼号（可能为 `null`，如果工序不属于特定楼栋）
- `planned_start_datetime`: 工序计划开始时间（ISO 8601 格式，可能为 `null` 如果尚未排程）
- `planned_end_datetime`: 工序计划结束时间（ISO 8601 格式，可能为 `null` 如果尚未排程）
- `assigned_workers_count`: 分配到该工序的工人数量

**说明**:
- 返回扁平化的分配列表，每一项表示一个班组到一个工序的分配
- 包含 `building_number` 字段，方便前端按楼号分组显示或筛选
- 包含 `planned_start_datetime` 和 `planned_end_datetime`，支持时间线/甘特图显示
- 时间字段可能为 `null`，表示该工序尚未完成排程
- 适用于资源分配可视化、工作量分析、进度追踪等场景

**错误响应**:
- 404 Not Found: 项目不存在
- 403 Forbidden: 无权限访问

---

## 工期压缩接口

### 1. 启动压缩

**端点**: `POST /api/projects/{project_id}/compress`

**描述**: 基于当前项目排期发起压缩，目标是把总工期压缩到指定小时数。后台异步执行迭代压缩与估算，前端需轮询进度接口。

**认证**: Bearer Token（editor 及以上）

**请求体**:
```json
{
  "target_duration_hours": 12000,
  "batch_size": 50,
  "compression_factor": 1.5,
  "final_solve_time_limit_seconds": 120,
  "estimate_time_limit_seconds": 120,
  "solver_relative_gap": 0.2
}
```

**响应** (200 OK):
```json
{
  "run_id": "uuid",
  "project_id": "uuid",
  "status": "pending",
  "message": "任务已创建",
  "target_duration_hours": 12000,
  "progress_percent": 0
}
```

### 2. 轮询进度

**端点**: `GET /api/projects/{project_id}/compress/{run_id}`

**描述**: 轮询压缩进度和每轮估算结果。每次“人员效率调整”（compression_factor 应用）或新的估算都会返回最新的预估工期。

**响应** (200 OK):
```json
{
  "run_id": "uuid",
  "project_id": "uuid",
  "status": "running|completed|failed",
  "progress_percent": 42,
  "target_duration_hours": 12000,
  "latest_estimated_duration_hours": 12800.5,
  "iterations": [
    {
      "iteration": 1,
      "stage": "compress",
      "estimated_duration_hours": 13500.0,
      "compressed_batch": 50,
      "compressed_quantity_based": 48,
      "total_compressed": 50,
      "compression_factor": 1.5,
      "batch_size": 50,
      "message": "完成一轮压缩：批量 50，有效压缩 48",
      "timestamp": "2025-12-28T12:00:00Z"
    }
  ],
  "result_summary": {
    "initial_total_duration_hours": 15000,
    "final_total_duration_hours": 11800,
    "target_duration_hours": 12000,
    "iterations": 5,
    "task_count": 320
  },
  "message": "压缩完成",
  "error_message": null,
  "created_at": "2025-12-28T11:59:00Z",
  "updated_at": "2025-12-28T12:01:00Z"
}
```

**前端刷新建议**:
- 当 `status` 变为 `completed` 时，后端已持久化最新的排期结果到 `work_process_execution_state`。前端应主动刷新项目的 Graph/API 数据（例如重新调用 `/api/projects/{project_id}/graph`）以获取最新排期。
- 在 `status=running` 时，`iterations` 中每条记录包含本轮“人员效率调整”后新的预估工期，可直接用来渲染进度。

---

## 数据模型

### ProjectSummary (项目摘要)
```json
{
  "project_id": "uuid",
  "project_name": "string",
  "description": "string",
  "status": "active | archived | deleted",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### WorkProcessSummary (工序摘要)
```json
{
  "work_process_id": "uuid",
  "name": "string",
  "code": "string",
  "duration_days": "number"
}
```

### FileReference (文件引用)
```json
{
  "file_url": "string",
  "file_name": "string",
  "file_type": "string",
  "uploaded_at": "datetime"
}
```

### TeamAssignment (班组分配)
```json
{
  "work_process_id": "uuid",
  "work_process_code": "string",
  "work_process_name": "string",
  "assignment_ratio": "number (0-1)",
  "assigned_workers_count": "integer"
}
```

---

## 认证说明

所有需要认证的接口都需要在请求头中包含 JWT Token:

```
Authorization: Bearer <access_token>
```

Token 有效期: 24小时

---

## 错误响应格式

所有错误响应遵循统一格式:

```json
{
  "detail": "错误描述信息"
}
```

常见 HTTP 状态码:
- 200 OK: 请求成功
- 201 Created: 资源创建成功
- 400 Bad Request: 请求参数错误
- 401 Unauthorized: 未认证或认证失败
- 403 Forbidden: 无权限访问
- 404 Not Found: 资源不存在
- 500 Internal Server Error: 服务器内部错误

---

## 完整的项目创建流程示例（新版异步流程）

```bash
# 1. 用户注册
POST /api/auth/register
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "full_name": "Test User"
}
# 响应: { "access_token": "...", "user_id": "..." }

# 2. 用户登录（或直接使用注册时返回的token）
POST /api/auth/login
{
  "username": "testuser",
  "password": "password123"
}
# 响应: { "access_token": "...", "user_id": "..." }

# 3. 创建项目（异步，立即返回）
POST /api/projects/
Headers: Authorization: Bearer <token>
FormData:
  - project_name: "我的项目"
  - description: "测试项目"
  - files: [core_work_process_type1221.xlsx]
# 响应 (202 Accepted):
# { "project_id": "...", "status": "preparing", "message": "..." }

# 4. 轮询项目状态（等待估算完成）
GET /api/projects/{project_id}/status
Headers: Authorization: Bearer <token>
# 响应: { "status": "estimating", "progress_percent": 30 }
# ... 继续轮询 ...
# 响应: { "status": "estimation_ready", "progress_percent": 60 }

# 5. 获取估算方案列表
GET /api/projects/{project_id}/estimation-solutions
Headers: Authorization: Bearer <token>
# 响应: {
#   "solutions": [
#     {
#       "solution_id": "uuid",
#       "estimated_duration_days": 180,
#       "team_composition": [...],
#       "is_recommended": true
#     },
#     ...
#   ]
# }

# 6. 用户选择方案并确认
POST /api/projects/{project_id}/confirm-solution
Headers: Authorization: Bearer <token>
{
  "solution_id": "uuid"
}
# 响应: { "status": "solving", "message": "Final solve started" }

# 7. 继续轮询直到完成
GET /api/projects/{project_id}/status
Headers: Authorization: Bearer <token>
# 响应: { "status": "solving", "progress_percent": 80 }
# ... 继续轮询 ...
# 响应: { "status": "completed", "progress_percent": 100 }

# 8. 获取班组分配数据
GET /api/projects/{project_id}/team-assignments
Headers: Authorization: Bearer <token>
# 响应: { "teams": [...] }

# 9. 获取用户的所有项目列表
GET /api/projects/
Headers: Authorization: Bearer <token>
# 响应: [{ "project_id": "...", "project_name": "..." }]
```

---

## 与旧系统接口的映射关系

| 旧接口 | 新接口 | 说明 |
|-------|-------|------|
| POST /precreate | POST /api/projects/ | 异步创建，立即返回 202 |
| POST /uploads/{file_type} | POST /api/projects/ | 文件上传整合到项目创建 |
| GET /initialization-status | GET /api/projects/{project_id}/status | 统一的状态轮询接口 |
| - | GET /api/projects/{project_id}/estimation-solutions | 新增：获取估算方案 |
| - | POST /api/projects/{project_id}/confirm-solution | 新增：确认方案并触发求解 |
| GET /{project_id}/graph | GET /api/projects/{project_id}/graph | CoreGraph 数据 |
| - | GET /api/projects/{project_id}/cost-curve | 新增：成本折线图 |
| - | GET /api/projects/{project_id}/team-assignments | 新增：班组分配数据 |

---

**版本历史**:
- **v0.3.0** (2026-02-03): Jiuan 模式 - 新增创建项目 + 选择施工方案两步接口
- **v0.2.1** (2025-12-29): CoreGraph API 优化 - 嵌套结构、计算字段、完整字典解析
- **v0.2.0** (2025-12-28): 新增异步初始化流程、估算方案选择、用户确认机制
- **v0.1.0** (2025-12-23): 初始版本

**最后更新**: 2026-02-03
