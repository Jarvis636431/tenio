# Shared Package

## 职责

`packages/shared` 是前后端共享协议层，不是共享业务实现层。

对应代码：

- `packages/shared/src/auth/*`
- `packages/shared/src/project/*`
- `packages/shared/src/file/*`
- `packages/shared/src/common/*`

## 为什么这样设计

monorepo 的价值不在于“代码放在一起”，而在于协议变化可以同步反馈到前后端。

因此 `shared` 的职责被限制为：

- request / response contract
- 通用枚举
- 共享数据类型

而不是：

- React hook
- Nest service
- Prisma client
- UI 组件

## 优点

- 避免前后端协议漂移
- 变更字段时类型反馈直接
- 适合当前项目的 monorepo 协作方式

## 缺点

- 需要严格控制边界，不能把它变成“公共垃圾桶”
- 运行时导出路径和 TS 配置要保持一致

## 可选方案

### 不做 shared，前后端各写一份类型

优点：

- 初期更快

缺点：

- 协议很快漂移
- 接口变动时维护成本高

### 用 OpenAPI 生成类型，不维护 shared 包

优点：

- 可以进一步标准化 contract

缺点：

- 当前阶段会增加更多生成流程和工具复杂度

## 当前结论

当前保留一个小而明确的 `shared` 包是合理的。后面如果 API 足够稳定，可以再考虑引入 OpenAPI 作为更强的 contract 源。
