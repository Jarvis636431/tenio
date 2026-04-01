## Context

当前项目使用 ESLint 9 + Prettier 作为 lint/format 工具链，但存在以下问题：

1. `eslint-config-prettier` 依赖缺失，ESLint 无法运行
2. `no-unused-vars` 完全关闭，代码中存在大量未使用变量
3. 没有 Git Hooks，提交前不检查
4. CI 使用 Node 20，但 package.json engines 要求 Node 22.x

## Goals / Non-Goals

**Goals:**

- ESLint 可正常运行，基础规则生效
- 提交前自动 lint 和 format
- CI 环境与实际开发环境一致

**Non-Goals:**

- 不追求一次性开启所有严格规则（渐进式）
- 不引入新的 lint 工具（如 biome）
- 不修改现有代码风格约定（保持 Prettier 现有配置）

## Decisions

### 1. ESLint 规则渐进式开启

**Decision**: 先修复依赖，开启 `no-unused-vars` 为 `warn` 级别，后续再逐步提升为 `error` 并添加更多规则。

**Rationale**: 直接开启所有规则会产生大量报错，阻碍开发。warn 级别可以先看到问题数量，分批修复。

**Alternatives considered**:

- 直接开启为 error → 会产生太多报错，影响开发节奏
- 保持关闭 → 无法发现问题

### 2. husky + lint-staged 方案

**Decision**: 使用 husky 9.x + lint-staged，pre-commit hook 只对暂存文件执行 `eslint --fix` 和 `prettier --write`。

**Rationale**: 行业标准方案，只对变更文件检查，速度快。

### 3. Prettier 配置补充

**Decision**: 补充 `tabWidth: 2`, `endOfLine: "lf"` 两个基础选项，保持现有 `printWidth: 100` 等不变。

**Rationale**: 最小化变更，避免格式化大量文件。

### 4. CI Node 版本

**Decision**: 改为 `node-version: 22`，与 package.json engines 一致。

## Risks / Trade-offs

| Risk                               | Mitigation                                   |
| ---------------------------------- | -------------------------------------------- |
| 开启 no-unused-vars 后现有代码报错 | 先用 warn 级别，分批修复后再改为 error       |
| husky 安装失败                     | 添加 postinstall 脚本自动执行 husky init     |
| lint-staged 对大文件慢             | 只检查 .ts/.tsx 文件，排除 dist/node_modules |
