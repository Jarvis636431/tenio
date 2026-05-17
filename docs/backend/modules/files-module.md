# Files Module

## 职责

`FilesModule` 负责项目文件域，而不是单纯“上传接口”。

对应代码：

- `apps/api/src/modules/files/*`

当前职责包括：

- 上传初始化
- 上传完成确认
- 项目文件列表
- 项目文件详情
- 文件统计
- 文件删除
- 文件下载地址签发
- `ProjectFile` 记录与项目归属管理

## 为什么这样设计

这里刻意没有采用“后端直接接收文件流再转发”的方案，而是采用：

- `Project`
- `ProjectFile`
- `upload-init`
- 客户端直传对象存储
- `complete`

这套设计的核心思想是：

1. 文件是业务记录，不只是二进制对象
2. 上传动作和文件实体不是一回事
3. 后端应该管理文件状态，而不是充当大文件中转层

当前接口形态：

- `POST /api/projects/:projectId/uploads/init`
- `POST /api/projects/:projectId/uploads/complete`
- `GET /api/projects/:projectId/files`
- `GET /api/projects/:projectId/files/:fileId`
- `GET /api/projects/:projectId/files/stats`
- `GET /api/projects/:projectId/files/:fileId/download-url`
- `DELETE /api/projects/:projectId/files/:fileId`

## 优点

- 上传协议更适合大文件和多文件
- 文件记录可以独立追踪状态
- 与对象存储天然兼容
- 后续生成链路可以直接消费 `ProjectFile`
- 文件删除、重新选择、重新下载这些日常操作也有明确边界

## 缺点

- 比“一个上传接口”更复杂
- 前端需要多一步上传初始化/完成确认
- 需要额外维护文件状态流转

## 可选方案

### 后端直接接收 multipart 文件

优点：

- 前端简单

缺点：

- API 压力更大
- 不适合后续大文件和分段扩展
- 文件记录和上传行为耦合

### 上传成功后再补数据库记录

优点：

- 上传流程表面更直接

缺点：

- 上传中断时状态不可追踪
- 无法在上传前建立业务上下文

## 当前结论

当前方案更适合作为项目级文件入口。它为后续 generation、artifact、文件替换、失败重传留出了空间。
