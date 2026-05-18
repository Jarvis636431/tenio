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
- tool registry 与只读/写入工具分层

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
6. 哪些能力是 tool，哪些只是普通对话

## 优点

- agent 具备项目上下文，不是独立漂浮的聊天服务
- 会话、消息、操作都有数据库承载
- 去掉 ticket / product_code / baseUrl 后，前后端 contract 更短
- SSE 协议可以先跑通，再逐步增强
- 读工具可以直接执行，写工具必须先经过 operation + approval
- 以后接工具调用、审批、审计都有落点

## 缺点

- 当前流式输出还是单机内存 registry，不适合多实例部署
- 第一版回复逻辑仍是占位实现，不是完整模型编排
- 写工具目前只实现了 `archive_project`，能力还很窄

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
- 先用 tool registry 落三类只读工具和一个受控写工具
- 再往里填模型调用与更完整的执行边界

这比反过来先做复杂 AI 编排更稳。

## 当前已落地的 tools

当前注册了 11 个工具：

- `get_project_context`
- `list_project_files`
- `get_document_artifact`
- `get_graph_artifact`
- `get_time_cost_artifact`
- `get_crew_plan_artifact`
- `get_latest_artifacts`
- `update_project_name`
- `activate_project`
- `delete_project_file`
- `archive_project`

其中：

- 前 7 个是只读工具，可直接执行
- `update_project_name`
- `activate_project`
- `delete_project_file`
- `archive_project`

以上 4 个写工具都必须先经过 approval

## 当前 executor 行为

当前 `AgentOperationExecutor` 的规则是：

1. 用户消息命中写工具时，先创建 `WAITING_APPROVAL` operation
2. 用户回复“同意”后，operation 进入 `RUNNING`
3. executor 根据原始消息选择写工具
4. 成功则写回 `COMPLETED`
5. 未识别到可执行写工具，则写回 `FAILED`

这保证了系统不会再把“识别出动作”误判成“动作已经执行完成”。
