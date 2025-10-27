# Tianyou Backend API 接口文档

## 系统概述

Tianyou Backend 是一个建筑工程项目管理平台的后端系统，采用微服务架构，包含三个主要服务：

- **用户服务 (User Service)**: 处理用户认证和用户管理
- **管理服务 (Management Service)**: 处理项目管理、文档处理和甘特图算法
- **AI代理服务 (Agent Service)**: 提供AI智能助手功能

## 认证机制

系统使用 JWT (JSON Web Token) 进行身份认证。在需要认证的接口中，需要在请求头中包含：

```
Authorization: Bearer <JWT_TOKEN>
```

## 用户服务 (User Service)

### 基础信息

- **服务端口**: 8001
- **基础路径**: `/`

### 接口列表

#### 1. 用户注册

**接口路径**: `POST /register`

**描述**: 注册新用户账户

**请求体**:

```json
{
  "username": "string",
  "password": "string",
  "role": "string"
}
```

**响应**:

- **200 OK**: 注册成功
- **400 Bad Request**: 用户名已存在或参数错误

**示例**:

```json
// 请求
{
  "username": "john_doe",
  "password": "secure_password",
  "role": "user"
}

// 响应
{
  "message": "User registered successfully"
}
```

#### 2. 用户登录

**接口路径**: `POST /login`

**描述**: 用户登录获取JWT令牌

**请求体**:

```json
{
  "username": "string",
  "password": "string"
}
```

**响应**:

```json
{
  "access_token": "string",
  "token_type": "bearer"
}
```

**示例**:

```json
// 请求
{
  "username": "john_doe",
  "password": "secure_password"
}

// 响应
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### 3. 获取当前用户信息

**接口路径**: `GET /me`

**描述**: 获取当前登录用户的信息

**认证**: 需要JWT令牌

**响应**:

```json
{
  "user_id": "string",
  "username": "string",
  "role": "string",
  "projects": ["string"]
}
```

#### 4. 删除用户 (测试环境)

**接口路径**: `DELETE /test/user/{user_id}`

**描述**: 删除指定用户（仅在测试或开发环境可用）

**路径参数**:

- `user_id`: 用户ID

**环境限制**: 仅在 `test` 或 `development` 环境可用

## 管理服务 (Management Service)

### 基础信息

- **服务端口**: 8002
- **基础路径**: `/`

### 项目管理接口

#### 1. 项目预创建

**接口路径**: `POST /precreate`

**描述**: 开始项目创建流程的第一步

**认证**: 需要JWT令牌

**请求体**:

```json
{
  "project_name": "string",
  "description": "string"
}
```

**响应**:

```json
{
  "project_id": "string",
  "status": "precreated"
}
```

#### 2. 信息检查

**接口路径**: `POST /infocheck`

**描述**: 检查项目信息的完整性和有效性

**认证**: 需要JWT令牌

**请求体**:

```json
{
  "project_id": "string",
  "project_info": {
    "name": "string",
    "description": "string",
    "start_date": "string",
    "end_date": "string"
  }
}
```

**响应**:

```json
{
  "status": "valid",
  "issues": []
}
```

#### 3. 文档上传

**接口路径**: `POST /upload_docs`

**描述**: 上传项目相关文档

**认证**: 需要JWT令牌

**请求**: Multipart form data

- `project_id`: 项目ID
- `files`: 文件列表
- `file_type`: 文件类型 (ifc, excel, workvolume)

**响应**:

```json
{
  "uploaded_files": ["string"],
  "parse_ids": ["string"]
}
```

#### 4. 完成项目创建

**接口路径**: `POST /finalize_creation`

**描述**: 完成项目创建流程

**认证**: 需要JWT令牌

**请求体**:

```json
{
  "project_id": "string",
  "final_config": {
    "construction_methods": [],
    "overtime_tasks": [],
    "shutdown_events": [],
    "work_time": {},
    "background": "string",
    "compress_strategy": {}
  }
}
```

#### 5. 项目列表

**接口路径**: `GET /project_list`

**描述**: 获取用户可访问的项目列表

**认证**: 需要JWT令牌

**响应**:

```json
{
  "projects": [
    {
      "project_id": "string",
      "name": "string",
      "description": "string",
      "status": "string",
      "created_at": "string"
    }
  ]
}
```

#### 6. 项目详情查看

**接口路径**: `GET /view`

**描述**: 查看项目详细信息

**认证**: 需要JWT令牌

**查询参数**:

- `project_id`: 项目ID

**响应**:

```json
{
  "project_id": "string",
  "name": "string",
  "description": "string",
  "config": {},
  "status": "string",
  "created_at": "string",
  "updated_at": "string"
}
```

#### 7. 项目配置

**接口路径**: `GET /project_config`

**描述**: 获取项目配置信息

**认证**: 需要JWT令牌

**查询参数**:

- `project_id`: 项目ID

#### 8. 项目更新

**接口路径**: `POST /update`

**描述**: 更新项目信息

**认证**: 需要JWT令牌

#### 9. 流程信息

**接口路径**: `GET /process_info`

**描述**: 获取项目流程信息

**认证**: 需要JWT令牌

#### 10. 轮询状态

**接口路径**: `GET /polling`

**描述**: 轮询项目状态更新

**认证**: 需要JWT令牌

#### 11. 获取版本信息

**接口路径**: `GET /get_versions`

**描述**: 获取项目版本历史

**认证**: 需要JWT令牌

#### 12. 获取IFC模型

**接口路径**: `GET /get_ifc`

**描述**: 获取IFC模型文件

**认证**: 需要JWT令牌

### 操作员接口

#### 1. 操作员项目列表

**接口路径**: `GET /operator/projects`

**描述**: 获取操作员相关的项目列表

**认证**: 需要JWT令牌

**响应**:

```json
{
  "projects": [
    {
      "project_id": "string",
      "name": "string",
      "status": "string"
    }
  ]
}
```

#### 2. 操作员项目详情

**接口路径**: `GET /operator/project_view`

**描述**: 查看特定项目的详细信息

**认证**: 需要JWT令牌

**查询参数**:

- `project_id`: 项目ID

#### 3. 操作员文件上传

**接口路径**: `POST /operator/uploads`

**描述**: 操作员上传文件

**认证**: 需要JWT令牌

**请求**: Multipart form data

- `project_id`: 项目ID
- `files`: 文件列表
- `category`: 文件类别 (ifc, excel, workvolume)

**响应**:

```json
{
  "parse_ids": ["string"]
}
```

#### 4. 操作员文件下载

**接口路径**: `POST /operator/downloads`

**描述**: 下载指定项目和文档的文件

**认证**: 需要JWT令牌

**请求体**:

```json
{
  "project_id": "string",
  "doc_ids": ["string"]
}
```

#### 5. 完成操作员任务

**接口路径**: `POST /operator/finish`

**描述**: 完成操作员任务

**认证**: 需要JWT令牌

### 测试接口 (仅测试/开发环境)

#### 1. 删除项目

**接口路径**: `DELETE /test/delete_project/{project_id}`

**描述**: 删除项目及其所有关联数据

**环境限制**: 仅在 `test` 或 `development` 环境可用

#### 2. 删除项目成员

**接口路径**: `DELETE /test/delete_project_member/{project_id}`

**描述**: 删除项目成员

**环境限制**: 仅在 `test` 或 `development` 环境可用

#### 3. 删除文档

**接口路径**: `DELETE /test/delete_document/{project_id}`

**描述**: 删除项目文档

**环境限制**: 仅在 `test` 或 `development` 环境可用

#### 4. 删除解析产物

**接口路径**: `DELETE /test/delete_artifact/{project_id}`

**描述**: 删除解析产物

**环境限制**: 仅在 `test` 或 `development` 环境可用

#### 5. 删除工作流程

**接口路径**: `DELETE /test/delete_workprocess/{project_id}`

**描述**: 删除工作流程

**环境限制**: 仅在 `test` 或 `development` 环境可用

#### 6. 删除工作订单

**接口路径**: `DELETE /test/delete_workorder/{project_id}`

**描述**: 删除工作订单

**环境限制**: 仅在 `test` 或 `development` 环境可用

## AI代理服务 (Agent Service)

### 基础信息

- **服务端口**: 8003
- **基础路径**: `/`

### WebSocket接口

#### 1. AI代理聊天

**接口路径**: `WebSocket /ws/agent`

**描述**: 与AI代理进行实时对话

**认证**: 需要JWT令牌（通过查询参数传递）

**查询参数**:

- `token`: JWT令牌
- `project_id`: 项目ID

**消息格式**:

**发送消息**:

```json
{
  "user_id": "string",
  "message": "string"
}
```

**接收消息**:

```json
{
  "reply": "string",
  "actions": [
    {
      "action_type": "string",
      "label": "string",
      "payload": {}
    }
  ]
}
```

**动作请求**:

```json
{
  "user_id": "string",
  "action_type": "string",
  "payload": {}
}
```

**动作响应**:

```json
{
  "status": "string",
  "message": "string"
}
```

## 数据模型

### 用户模型

#### UserInDB

```json
{
  "user_id": "string",
  "username": "string",
  "role": "string",
  "hashed_password": "string",
  "projects": ["string"]
}
```

#### UserCreate

```json
{
  "username": "string",
  "password": "string",
  "role": "string"
}
```

#### LoginRequest

```json
{
  "username": "string",
  "password": "string"
}
```

### 项目模型

#### ConfigBase

```json
{
  "construction_methods": [
    {
      "name": "string",
      "description": "string"
    }
  ],
  "overtime_tasks": ["string"],
  "shutdown_events": [
    {
      "name": "string",
      "start_time": "string",
      "end_time": "string",
      "description": "string"
    }
  ],
  "work_time": {
    "start_hour": "integer",
    "end_hour": "integer",
    "work_days": ["string"]
  },
  "background": "string",
  "compress_strategy": {
    "method": "string",
    "parameters": {}
  }
}
```

### AI代理模型

#### ChatMessage

```json
{
  "user_id": "string",
  "message": "string"
}
```

#### AgentResponse

```json
{
  "reply": "string",
  "actions": [
    {
      "action_type": "string",
      "label": "string",
      "payload": {}
    }
  ]
}
```

## 错误处理

### 通用错误码

- **400 Bad Request**: 请求参数错误
- **401 Unauthorized**: 未授权访问
- **403 Forbidden**: 权限不足
- **404 Not Found**: 资源不存在
- **500 Internal Server Error**: 服务器内部错误

### 错误响应格式

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

## 环境配置

### 开发环境

- 用户服务: http://localhost:8001
- 管理服务: http://localhost:8002
- AI代理服务: http://localhost:8003

### 生产环境

- 根据实际部署配置调整端口和域名

## 注意事项

1. 所有需要认证的接口都需要在请求头中包含有效的JWT令牌
2. 测试接口仅在测试和开发环境中可用
3. WebSocket连接需要通过查询参数传递JWT令牌
4. 文件上传接口使用multipart/form-data格式
5. 所有时间字段使用ISO 8601格式
6. 项目ID和用户ID使用UUID格式

## 更新日志

- v1.0.0: 初始版本，包含基础的用户管理、项目管理和AI代理功能

---
