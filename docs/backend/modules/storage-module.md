# Storage Module

## 职责

`StorageModule` 负责对象存储能力抽象。

对应代码：

- `apps/api/src/storage/storage.module.ts`
- `apps/api/src/storage/storage.service.ts`
- `apps/api/src/storage/storage.types.ts`

当前职责包括：

- 生成预签名上传 URL
- 读取对象元信息
- 隔离 MinIO / S3 具体 SDK 细节

## 为什么这样设计

上传域不应该直接把对象存储 SDK 混在业务 service 里。

这里单独抽 `StorageService`，目的是：

1. files 模块只关心业务，不关心具体存储 SDK
2. 未来从 MinIO 切 AWS S3 / OSS / R2 时，尽量只改存储实现

当前实现采用的是：

- S3-compatible 设计
- 本地开发默认以 MinIO 作为实现目标

## 优点

- 将业务文件记录和存储细节解耦
- 适合未来更换对象存储提供商
- 为 presigned upload 模式提供基础能力

## 缺点

- 仍然要维护一层额外抽象
- 当前只覆盖上传签名与对象检查，还不是完整存储 SDK 包装

## 可选方案

### 直接在 FilesService 里使用 S3 SDK

优点：

- 少一个模块

缺点：

- files 业务与存储细节耦合
- 后面改存储实现会更痛

### 后端代理文件上传，不使用对象存储预签名

优点：

- 前端实现简单

缺点：

- API 服务成为大文件中转层
- 扩展性和稳定性更差

## 当前结论

将对象存储抽象为独立基础设施模块是值得的。它不是为了“架构好看”，而是为了防止 files 模块后面被存储细节拖垮。
