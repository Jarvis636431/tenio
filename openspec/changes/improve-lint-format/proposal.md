## Why

当前项目的 lint 和 format 工具链存在以下问题：

1. **ESLint 无法运行** - `eslint-config-prettier` 依赖缺失，`pnpm lint` 直接报错
2. **规则过于宽松** - `no-unused-vars` 完全关闭，缺少 import 排序等基础规则
3. **无 Git Hooks** - 提交前不检查 lint/format，坏代码可直接入库
4. **CI Node 版本不一致** - CI 用 Node 20，但 package.json 要求 Node 22.x

这些问题导致代码规范无法保障，CI 中的 lint 步骤也形同虚设。

## What Changes

- 修复 ESLint 依赖，确保 `pnpm lint` 可正常运行
- 渐进式开启 ESLint 规则（先修复基础问题，再逐步添加严格规则）
- 补充 Prettier 配置（tabWidth、endOfLine 等）
- 添加 husky + lint-staged，提交前自动 lint 和 format
- 修复 CI workflow 中 Node 版本为 22

## Capabilities

### New Capabilities

- `lint-format`: ESLint 规则配置和 Prettier 格式化工具
- `git-hooks`: Git 提交前自动检查机制

### Modified Capabilities

- (无现有 spec 需要修改)

## Impact

- **配置文件**: `eslint.config.js`, `.prettierrc.json`, `vitest.config.ts`
- **新增**: `.husky/` 目录, `lint-staged` 配置
- **CI**: `.github/workflows/ci.yml` Node 版本更新
- **现有代码**: 开启 `no-unused-vars` 后可能需要修复部分未使用变量
