# Artifacts Module

## 职责

`ArtifactsModule` 负责项目产物的读取边界，而不是生成边界。

对应代码：

- `apps/api/src/modules/artifacts/*`

当前第一版职责包括：

- 保存统一的 artifact 版本记录模型
- 提供 `latest` 产物读取接口
- 提供项目级 artifact summary 列表
- 提供工作台最小上传汇总接口

## 为什么这样设计

当前系统里，真正会变化的不是“前端怎么读”，而是“谁来写 artifact”：

- 可能是 generation 服务
- 可能是内置 agent
- 也可能是后续的人工回写流程

如果先把 generation 逻辑和 artifact 读取逻辑绑死，后面一旦生产者变化，接口边界就会被迫重做。

因此第一版先把 artifact 做成独立的读模型：

1. 项目下有哪些 artifact
2. 每类 artifact 的最新版本是什么
3. 前端怎么稳定读取这些产物

这样后面不管谁生产，只要写入 `ProjectArtifact`，前端读取层都不需要变化。

## 优点

- `document / graph / time_cost / crew_plan` 统一挂在同一个版本域下
- `latest` 读取接口稳定，便于前端和 agent 使用
- 生成链路可以后补，不会反向污染读取接口
- 工作台 summary 可以基于同一份 artifact 记录做聚合

## 缺点

- 当前第一版采用 `payload_json + summary_json`，不是强类型子表结构
- 对复杂分析查询不如“公共表 + 子表”模式精细
- 目前只补了读取边界，没有补 artifact 写入回调入口

## 可选方案

### 一开始就做“公共表 + 四张子表”

优点：

- 结构更强约束
- 后续复杂查询更友好

缺点：

- 当前阶段实现成本更高
- 产物生产者还没完全确定时，会过早锁死写入结构

### 完全不建 artifact 表，直接让前端读各种业务表

优点：

- 短期实现快

缺点：

- 前端读取路径会分裂
- generation / agent / workbench 很快会出现多套“最新版本”定义

## 当前结论

当前方案是一个更稳的中间层：

- 先统一 artifact 版本模型
- 先统一 `latest` 读取接口
- 后面再补回调写入或生成写入

这比现在就把 generation 和 artifact 强耦合更合理。
