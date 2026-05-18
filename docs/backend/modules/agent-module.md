# Agent Module

## 职责

`AgentModule` 负责内置 agent 的业务边界，而不是模型推理本身。

对应代码：

- `apps/api/src/modules/agent/*`

当前第一版职责包括：

- 基于用户 JWT 的项目级 agent 访问控制
- agent session 创建与查询
- session message 存储
- SSE 流式输出
- agent operation 状态查询与审批前边界

## 为什么这样设计

当前系统已经具备：

- `auth`
- `projects`
- `files`

这些已经足够成为 agent 的上下文层。

因此 agent 的第一阶段重点不应该是“做出复杂 AI 能力”，而应该是先把这几个边界立住：

1. 会话是谁的
2. 消息存在哪里
3. 流式输出怎么发
4. 有副作用的动作如何建模
5. 哪些动作需要显式确认

## 优点

- agent 具备项目上下文，不是独立漂浮的聊天服务
- 会话、消息、操作都有数据库承载
- 去掉 ticket / product_code / baseUrl 后，前后端 contract 更短
- SSE 协议可以先跑通，再逐步增强
- 以后接工具调用、审批、审计都有落点

## 缺点

- 当前流式输出还是单机内存 registry，不适合多实例部署
- 第一版回复逻辑仍是占位实现，不是完整模型编排
- operation 目前只到 `WAITING_APPROVAL / COMPLETED / CANCELED` 骨架，不包含真实工具执行

## 可选方案

### 继续把 AI 放成完全外部服务

优点：

- 主后端更轻

缺点：

- 项目上下文、操作审计、权限边界都会更碎

### 一开始就做多 agent / 工具编排平台

优点：

- 理论扩展能力更强

缺点：

- 对当前阶段过重
- 很容易把边界和业务一起做乱

### 保留 ticket 作为前端二次鉴权层

优点：

- 如果 agent 是独立外部服务，更容易做短期凭证隔离

缺点：

- 当前 agent 已经内收进主后端，ticket 只是在重复 JWT 鉴权
- 前端会被迫保存 `agentTicket / baseUrl / refreshAt` 这类非核心状态
- 会让 session、stream、operation 的核心边界继续混浊

## 当前结论

当前方案是一个务实的第一版内置 agent 架构：

- 先把 session / message / stream / operation 骨架做出来
- 直接基于 JWT 和项目归属做访问控制
- 把会影响项目数据的请求先收口为 `WAITING_APPROVAL`
- 再往里填模型调用、tool registry 和真实执行边界

这比反过来先做复杂 AI 编排更稳。
