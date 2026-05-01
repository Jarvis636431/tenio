# 部署说明

当前前端按静态站点部署：GitHub Actions 构建 `dist/`，再通过 SSH + rsync 同步到服务器目录，服务器由 Nginx 或其他静态服务托管。

## GitHub Actions 流程

- PR、`main`、`feature/*` 推送都会运行校验。
- 校验步骤：`format:check`、`lint`、`typecheck`、`test`、`build`。
- `main` 推送在校验通过后可部署生产环境。
- 生产部署需要先设置仓库变量 `ENABLE_PRODUCTION_DEPLOY=true`，否则 deploy job 不会运行。

## 需要配置的 GitHub Variables

在 GitHub 仓库的 `Settings -> Secrets and variables -> Actions -> Variables` 中配置：

| 名称 | 是否必需 | 说明 |
| --- | --- | --- |
| `ENABLE_PRODUCTION_DEPLOY` | 必需 | 设置为 `true` 后启用 `main` 分支自动部署 |
| `VITE_API_BASE_URL` | 必需 | 后端 API 地址，例如 `https://api.example.com` |
| `VITE_AI_SERVICE_URL` | 必需 | AI 服务地址 |
| `VITE_RESOURCE_BASE_URL` | 可选 | 资源文件基础地址 |
| `VITE_ANALYTICS_ENABLED` | 可选 | 是否启用埋点 |
| `VITE_ANALYTICS_DEBUG` | 可选 | 是否启用埋点调试 |
| `VITE_ANALYTICS_ENDPOINT` | 可选 | 埋点上报地址 |
| `VITE_ANALYTICS_PROVIDER` | 可选 | 埋点 provider |

## 需要配置的 GitHub Secrets

在 GitHub 仓库的 `Settings -> Secrets and variables -> Actions -> Secrets` 中配置：

| 名称 | 是否必需 | 说明 |
| --- | --- | --- |
| `DEPLOY_HOST` | 必需 | 服务器 IP 或域名 |
| `DEPLOY_USER` | 必需 | SSH 登录用户 |
| `DEPLOY_PATH` | 必需 | 服务器上的静态文件目录，例如 `/var/www/apm` |
| `DEPLOY_SSH_PRIVATE_KEY` | 必需 | 对应部署用户的 SSH 私钥 |
| `DEPLOY_PORT` | 可选 | SSH 端口，默认 `22` |
| `DEPLOY_RELOAD_COMMAND` | 可选 | 部署后执行的重载命令，例如 `sudo systemctl reload nginx` |
| `VITE_VOLC_APP_ID` | 可选 | 火山语音 App ID |
| `VITE_VOLC_ACCESS_TOKEN` | 可选 | 火山语音 Access Token |
| `VITE_VOLC_SECRET_KEY` | 可选 | 火山语音 Secret Key |

## 服务器侧要求

- 部署用户可以通过 SSH 登录服务器。
- 部署用户对 `DEPLOY_PATH` 有写权限。
- 服务器已配置 Nginx 或其他静态服务指向 `DEPLOY_PATH`。
- React Router 需要 SPA fallback，Nginx 应将不存在的路径回退到 `index.html`。
- 如果需要自动 reload，部署用户需要有权限执行 `DEPLOY_RELOAD_COMMAND`。
- 后端和 AI 服务需要允许生产前端域名跨域访问。

## Nginx 示例

```nginx
server {
  listen 80;
  server_name example.com;

  root /var/www/apm;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```
