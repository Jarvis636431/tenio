# 部署说明

当前前端按静态站点部署：GitHub Actions 构建 `dist/`，再通过 SSH + rsync 同步到服务器目录，服务器由 Nginx 或其他静态服务托管。

## GitHub Actions 流程

- PR、`main`、`tenio-lite` 推送都会运行校验。
- 校验步骤：`format:check`、`lint`、`typecheck`、`test`、`build`。
- `main` 推送在校验通过后可部署 main 产品线的生产环境。
- 生产部署需要先设置仓库变量 `ENABLE_PRODUCTION_DEPLOY=true`，否则 deploy job 不会运行。

当前仓库已有生产部署 job，但还没有单独的 staging 部署 job。`tenio-lite` 是独立于 `main` 的业务路线，建议先为 `tenio-lite` 增加 staging 部署，再决定是否配置单独的 lite production。

## 环境分层建议

推荐至少区分两个前端发布环境：

| 环境 | 用途 | 建议触发分支 | 后端/AI 地址 | 数据要求 |
| --- | --- | --- | --- | --- |
| staging | 联调、验收、回归测试 | `tenio-lite` 或手动触发 | 测试/预发后端和 AI 服务 | 可使用测试数据，可重置 |
| production | main 产品线正式用户访问 | `main` | 生产后端和 AI 服务 | 真实数据，需谨慎变更 |

staging 应尽量模拟 production 的部署方式，例如同样使用 `pnpm build`、同样由 Nginx 托管静态文件、同样走真实后端接口。区别只在域名、服务器目录、后端 API 地址、AI 服务地址和数据源。

建议分支策略：

- PR：只运行校验，不部署。
- `tenio-lite`：校验通过后部署 staging，用于 lite 产品线联调、验收、回归。
- `main`：校验通过后部署 main 产品线 production，建议配合 GitHub Environment 审批。
- 如 `tenio-lite` 后续需要正式发布，应增加独立的 lite production environment 和部署 job，不建议复用 `main` 的 production 配置。

建议 GitHub Environments：

| Environment | 用途 |
| --- | --- |
| `staging` | 保存 staging 的部署变量和密钥，可允许自动部署 |
| `production` | 保存生产部署变量和密钥，建议开启 required reviewers |

如果暂时只有一台服务器，也可以用两个目录区分：

```text
/var/www/apm-staging
/var/www/apm
```

并分别配置两个 Nginx server_name，例如：

```text
staging-apm.example.com
apm.example.com
```

## 关键配置原则

- `VITE_API_BASE_URL` 必须指向当前环境对应的 APM 后端。
- `VITE_AI_SERVICE_URL` 必须指向当前环境对应的 agent-service。
- 上传文件时，前端会用 `VITE_API_BASE_URL` 重建后端返回的上传地址 origin。
- AI 会话请求会用 `VITE_AI_SERVICE_URL`，不使用 ticket 响应里的 `agent_base_url` 作为前端请求 base。
- staging 和 production 不应共用生产数据库，除非明确接受测试操作影响真实数据。

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

如增加 staging 部署，建议用 GitHub Environment 隔离变量，而不是给变量名加前缀。也就是说，staging environment 下的 `VITE_API_BASE_URL` 指向预发后端，production environment 下的同名变量指向生产后端。

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

如增加 staging 部署，建议同样用 GitHub Environment 隔离 secrets：

- `staging` 的 `DEPLOY_HOST`、`DEPLOY_PATH` 指向预发服务器或预发目录
- `production` 的 `DEPLOY_HOST`、`DEPLOY_PATH` 指向生产服务器或生产目录

## 服务器侧要求

- 部署用户可以通过 SSH 登录服务器。
- 部署用户对 `DEPLOY_PATH` 有写权限。
- 服务器已配置 Nginx 或其他静态服务指向 `DEPLOY_PATH`。
- React Router 需要 SPA fallback，Nginx 应将不存在的路径回退到 `index.html`。
- 如果需要自动 reload，部署用户需要有权限执行 `DEPLOY_RELOAD_COMMAND`。
- 后端和 AI 服务需要允许生产前端域名跨域访问。
- 如果配置 staging，需要同时允许 staging 前端域名跨域访问。

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
