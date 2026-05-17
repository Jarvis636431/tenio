# Auth Module

## 职责

`AuthModule` 负责系统入口认证与登录态管理。

对应代码：

- `apps/api/src/modules/auth/*`
- `apps/api/src/common/auth/*`

当前职责包括：

- 短信登录
- 账号密码登录
- refresh token 轮换
- 当前用户查询
- 首次登录资料补全
- JWT 鉴权守卫

## 为什么这样设计

当前产品的最外层入口是登录，因此 auth 不是附属模块，而是最先建立的业务边界。

这里采用的是：

- `access token + refresh token`
- refresh token 入库
- `JwtAuthGuard` 做访问控制
- `AuthTokenService` 单独收口 token 逻辑

这样拆分是为了避免 `AuthService` 同时承担：

- 登录业务
- token 签发
- token 校验
- refresh 轮换

## 优点

- 登录逻辑与 token 逻辑分层清楚
- refresh token 可撤销，可轮换，不是纯无状态 JWT
- 与前端当前 auth 流程对接自然
- 后续可以继续扩展短信服务、密码找回、设备管理

## 缺点

- 当前短信验证码仍是开发占位实现
- 暂未做设备级 refresh token 管理
- 暂未做细粒度 RBAC

## 可选方案

### 只用单 JWT，不保存 refresh token

优点：

- 实现简单

缺点：

- 无法真正登出
- 无法控制刷新策略
- 生产可控性差

### `passport-jwt`

优点：

- 策略化更标准

缺点：

- 对当前阶段增加了一层抽象
- 现在的 Guard 逻辑并不复杂，收益不大

## 当前结论

当前方案适合作为第一版正式认证架构。它已经比 demo 级 JWT 稳定，同时复杂度还没有高到影响迭代速度。
