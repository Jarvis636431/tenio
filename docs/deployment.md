# 部署说明

当前前端按静态站点部署：GitHub Actions 构建 `apps/web/dist/`，再通过 SSH + rsync 同步到服务器目录，服务器由 Nginx 或其他静态服务托管。

## GitHub Actions 流程

- `Tenio Monorepo CI/CD` workflow：PR、`main` 推送都会运行校验。
- 校验步骤：`format:check`、`lint:all`、`typecheck:all`、`test:all`。
- PR 会额外运行一次 monorepo 构建，验证 shared、web、api 都可以正常打包或通过类型构建。
- `main` 推送会在部署 job 中使用 `production` Environment 的变量构建一次发布产物。
- `main` 推送会在校验通过后触发生产服务部署流程。
- 部署 job 通过 `needs: verify` 等待校验成功后运行；发布构建只在部署 job 内执行一次，不再重复 build。
- `production` Environment 需要设置 `ENABLE_DEPLOY=true`，否则不会部署。

## 产品服务分层

当前主线只需要配置生产服务的 GitHub Environment：

| GitHub Environment | 触发分支 | 用途 | 后端/AI 地址 | 部署目标 |
| --- | --- | --- | --- | --- |
| `production` | `main` | 生产服务 | 生产服务对应的后端和 AI 服务 | 生产前端服务器目录 |

前端代码仍只读取 `VITE_API_BASE_URL`、`VITE_AI_SERVICE_URL` 等标准变量，不需要引入 `LITE_` 前缀。

建议分支策略：

- PR：只运行校验，不部署。
- `main`：运行校验，校验通过后发布到 `production` Environment。

当前生产服务的部署目录示例：

```text
/usr/share/nginx/tenio
```

部署时会执行：

```text
rsync -az --delete apps/web/dist/ "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/"
```

所以 `DEPLOY_PATH` 目录下会直接出现 `index.html`、`assets/` 等构建产物，不会再嵌套 `apps/web/dist`。

## 关键配置原则

- `VITE_API_BASE_URL` 必须指向当前环境对应的 APM 后端。
- `VITE_AI_SERVICE_URL` 必须指向当前环境对应的 agent-service。
- 上传文件时，前端会用 `VITE_API_BASE_URL` 重建后端返回的上传地址 origin。
- AI 会话请求会用 `VITE_AI_SERVICE_URL`，不使用 ticket 响应里的 `agent_base_url` 作为前端请求 base。
- 生产环境不应误连测试或旧 lite 服务的后端、AI 服务或数据库。即使部署在同一服务器，也要通过独立 API 地址、部署目录和域名隔离。

## 需要配置的 GitHub Variables

在 GitHub 仓库的 `Settings -> Environments` 中创建 `production`，然后在该 Environment 的 Variables 中配置：

| 名称 | 是否必需 | 说明 |
| --- | --- | --- |
| `ENABLE_DEPLOY` | 必需 | 设置为 `true` 后启用当前 Environment 对应服务的自动部署 |
| `VITE_API_BASE_URL` | 必需 | 当前产品服务的后端 API 地址，例如 `https://api.example.com` |
| `VITE_AI_SERVICE_URL` | 必需 | 当前产品服务的 AI 服务地址 |
| `VITE_ANALYTICS_ENABLED` | 可选 | 是否启用埋点 |
| `VITE_ANALYTICS_DEBUG` | 可选 | 是否启用埋点调试 |
| `VITE_ANALYTICS_ENDPOINT` | 可选 | 埋点上报地址 |
| `VITE_ANALYTICS_PROVIDER` | 可选 | 埋点 provider |

## 需要配置的 GitHub Secrets

在每个 GitHub Environment 的 Secrets 中配置：

| 名称 | 是否必需 | 说明 |
| --- | --- | --- |
| `DEPLOY_HOST` | 必需 | 服务器 IP 或域名 |
| `DEPLOY_USER` | 必需 | SSH 登录用户 |
| `DEPLOY_PATH` | 必需 | 服务器上的静态文件目录，例如 `/usr/share/nginx/tenio` |
| `DEPLOY_SSH_PRIVATE_KEY` | 必需 | 对应部署用户的 SSH 私钥 |
| `DEPLOY_PORT` | 可选 | SSH 端口，默认 `22` |
| `DEPLOY_RELOAD_COMMAND` | 可选 | 部署后执行的重载命令，例如 `sudo systemctl reload nginx`；不配置时会跳过 reload |
| `VITE_VOLC_APP_ID` | 可选 | 火山语音 App ID |
| `VITE_VOLC_ACCESS_TOKEN` | 可选 | 火山语音 Access Token |

当前生产服务示例：

```text
DEPLOY_HOST=47.93.156.146
DEPLOY_PORT=22
DEPLOY_USER=root
DEPLOY_PATH=/usr/share/nginx/tenio
```

## 服务器侧要求

- 部署用户可以通过 SSH 登录服务器。
- 部署用户对 `DEPLOY_PATH` 有写权限。
- GitHub runner 和服务器都需要安装 `rsync`；workflow 会安装 runner 侧 `rsync`，服务器侧需要提前安装。
- 服务器已配置 Nginx 或其他静态服务指向 `DEPLOY_PATH`。
- React Router 需要 SPA fallback，Nginx 应将不存在的路径回退到 `index.html`。
- 如果配置自动 reload，部署用户需要有权限执行 `DEPLOY_RELOAD_COMMAND`。
- 后端和 AI 服务需要允许对应前端域名跨域访问。

## Nginx 示例

```nginx
server {
  listen 80;
  server_name tenio.example.com;

  root /usr/share/nginx/tenio;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```
