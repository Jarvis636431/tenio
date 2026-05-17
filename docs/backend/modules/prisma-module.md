# Prisma Module

## 职责

`PrismaModule` 负责提供数据库访问能力，是当前后端的持久化基础设施层。

对应代码：

- `apps/api/prisma/schema.prisma`
- `apps/api/src/prisma/prisma.module.ts`
- `apps/api/src/prisma/prisma.service.ts`

## 为什么这样设计

当前后端已经进入真实数据阶段，认证、项目、文件记录都需要 PostgreSQL 持久化。

这里选择：

- `PostgreSQL` 作为主数据库
- `Prisma` 作为类型安全的数据访问层
- `PrismaModule` 作为 Nest 全局基础设施模块

这样做的目的有两个：

1. 统一数据库连接生命周期
2. 让业务模块通过依赖注入拿到数据库能力，而不是各自初始化客户端

## 优点

- TypeScript 类型反馈直接
- schema 和 migration 较清晰
- 与当前 monorepo 和 Nest 组合兼容性较好
- 对 auth / project / file 这类事务型业务足够合适

## 缺点

- 复杂 SQL 报表场景下未必最优雅
- 仍然需要开发者自己控制查询边界，避免 service 直接失控
- Prisma client 是额外运行时层，不是最轻方案

## 可选方案

### TypeORM

优点：

- Nest 集成传统
- 装饰器实体风格完整

缺点：

- 实体与数据库结构更容易漂移
- migration 和关系维护心智负担更大

### Drizzle

优点：

- 更轻
- 更接近 SQL-first 风格

缺点：

- 对当前阶段来说，体系化程度和开发反馈不如 Prisma 直接

## 当前结论

在当前阶段，`Prisma + PostgreSQL` 是偏务实的选择。它不是终极最优，但足够稳定，且能支持后续 auth、project、files、generation 继续扩展。
