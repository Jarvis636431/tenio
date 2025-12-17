# 依赖冲突分析与解决方案

## 问题诊断

### 冲突详情

```
npm error peer three@"^0.135.0" from web-ifc-viewer@1.0.218
npm error   three@"0.149.0" from the root project
```

### 根本原因

1. **版本不兼容**: three.js 0.149.0 超出了 web-ifc-viewer 要求的范围
2. **npm 8+ 严格模式**: 默认强制检查 peer dependencies
3. **生态系统滞后**: IFC 相关库更新较慢，未跟上 three.js 版本

## 解决方案详解

### 方案 1: 使用 --legacy-peer-deps (当前采用)

**命令:**

```bash
npm install zustand --legacy-peer-deps
```

**工作原理:**

- 告诉 npm 使用旧的 peer dependency 解析算法
- 不强制检查 peer dependency 版本
- 允许版本不匹配的包共存

**优点:**

- ✅ 快速解决问题
- ✅ 保持现有版本不变
- ✅ 不影响现有功能

**缺点:**

- ⚠️ 可能隐藏真实的兼容性问题
- ⚠️ 需要在每次安装时添加标志
- ⚠️ 团队成员需要知道这个要求

**适用场景:**

- 快速开发阶段
- 确认现有版本组合工作正常
- 临时解决方案

### 方案 2: 配置 .npmrc (推荐)

**创建 .npmrc 文件:**

```ini
legacy-peer-deps=true
```

**优点:**

- ✅ 团队统一配置
- ✅ 无需每次添加标志
- ✅ 版本控制可追踪

**实施步骤:**

```bash
echo "legacy-peer-deps=true" > .npmrc
git add .npmrc
git commit -m "chore: add npmrc for peer dependency handling"
```

### 方案 3: 版本对齐 (长期方案)

#### 选项 A: 降级 three.js

```bash
npm install three@0.135.0 --legacy-peer-deps
```

**影响评估:**

- 需要测试 ModelViewer 组件
- 检查是否使用了 0.149.0 的新特性
- 可能需要调整代码

#### 选项 B: 升级 web-ifc-viewer

```bash
npm install web-ifc-viewer@latest --legacy-peer-deps
```

**风险评估:**

- 可能有破坏性 API 变更
- 需要全面测试 IFC 加载功能
- 查看 changelog 确认兼容性

### 方案 4: 使用 overrides (npm 8.3+)

**在 package.json 中添加:**

```json
{
  "overrides": {
    "web-ifc-viewer": {
      "three": "0.149.0"
    }
  }
}
```

**优点:**

- ✅ 强制统一版本
- ✅ 清晰的版本控制
- ✅ 团队共享配置

**缺点:**

- ⚠️ 可能导致运行时错误
- ⚠️ 需要充分测试

## 推荐实施计划

### 短期 (立即执行)

1. ✅ 创建 `.npmrc` 文件
2. ✅ 添加 `legacy-peer-deps=true`
3. ✅ 提交到版本控制

### 中期 (1-2 周内)

1. 📋 测试当前版本组合的稳定性
2. 📋 检查 three.js 0.149.0 使用的特性
3. 📋 评估降级到 0.135.0 的影响

### 长期 (下个迭代)

1. 📋 监控 web-ifc-viewer 更新
2. 📋 考虑迁移到更活跃维护的 IFC 库
3. 📋 或者 fork web-ifc-viewer 自行维护

## 预防措施

### 1. 依赖版本锁定

```json
{
  "dependencies": {
    "three": "0.149.0", // 不使用 ^ 或 ~
    "web-ifc-viewer": "1.0.181"
  }
}
```

### 2. 定期依赖审计

```bash
npm outdated
npm audit
```

### 3. 使用 Renovate 或 Dependabot

自动化依赖更新和测试

## 相关资源

- [npm peer dependencies 文档](https://docs.npmjs.com/cli/v8/configuring-npm/package-json#peerdependencies)
- [three.js 版本历史](https://github.com/mrdoob/three.js/releases)
- [web-ifc-viewer issues](https://github.com/IFCjs/web-ifc-viewer/issues)
