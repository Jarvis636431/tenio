# 状态管理迁移 - 需求文档

## 简介

本项目旨在将现有的 React Context 状态管理迁移到 Zustand，以简化代码、提升性能并改善开发体验。

## 术语表

- **Zustand**: 轻量级的 React 状态管理库
- **Context API**: React 内置的状态共享机制
- **React Query**: 用于服务端状态管理的库
- **Store**: Zustand 中的状态容器

## 需求

### 需求 1: 迁移认证状态管理

**用户故事:** 作为开发者，我希望使用 Zustand 替代 AuthContext，以便简化认证相关的状态管理代码。

#### 验收标准

1. WHEN 创建 Zustand auth store THEN 该 store 应包含 user、token、isLoading 状态
2. WHEN 用户登录 THEN 系统应更新 store 中的用户信息和 token
3. WHEN 用户登出 THEN 系统应清除 store 中的所有认证信息
4. WHEN 应用初始化 THEN 系统应从持久化存储中恢复认证状态
5. WHEN 状态更新 THEN 系统应自动持久化到 localStorage

### 需求 2: 保持 API 兼容性

**用户故事:** 作为开发者，我希望迁移过程不影响现有组件的使用方式，以便减少重构工作量。

#### 验收标准

1. WHEN 组件使用 useAuth hook THEN 应返回与原 AuthContext 相同的接口
2. WHEN 移除 AuthProvider THEN 应用应继续正常工作
3. WHEN 更新所有导入路径 THEN 所有组件应能正常编译
4. WHEN 构建应用 THEN 不应出现类型错误或编译错误

### 需求 3: 性能优化

**用户故事:** 作为用户，我希望应用响应更快，以便获得更好的使用体验。

#### 验收标准

1. WHEN 认证状态更新 THEN 只有订阅该状态的组件应重新渲染
2. WHEN 使用 Zustand THEN 应避免 Context 导致的不必要重渲染
3. WHEN 状态持久化 THEN 应使用 Zustand 的 persist 中间件

### 需求 4: 代码简化

**用户故事:** 作为开发者，我希望状态管理代码更简洁，以便提高可维护性。

#### 验收标准

1. WHEN 对比新旧代码 THEN Zustand 实现应减少至少 60% 的代码量
2. WHEN 查看 store 定义 THEN 应清晰展示所有状态和操作
3. WHEN 添加新的状态或操作 THEN 应只需修改 store 文件

## 迁移状态

### ✅ 已完成

1. **安装 Zustand** - 已添加到项目依赖
2. **创建 Auth Store** - `src/stores/authStore.ts`
3. **创建兼容 Hook** - `src/hooks/useAuth.ts`
4. **更新 App.tsx** - 移除 AuthProvider
5. **更新所有组件** - 更新导入路径
6. **验证构建** - 构建成功，无错误

### 🔄 进行中

- 测试所有认证相关功能

### 📋 待办

1. 迁移 ProjectContext 到 Zustand
2. 优化其他组件级状态
3. 添加开发者工具集成
4. 性能测试和优化

## 技术优势

### 代码对比

**之前 (AuthContext.tsx - 156 行):**

```typescript
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 复杂的初始化逻辑
  }, []);

  // 大量的 useCallback 和状态管理代码
  // ...
}
```

**之后 (authStore.ts - 约 130 行，但更清晰):**

```typescript
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,

      login: async (username, password) => {
        // 简洁的异步逻辑
      },
      // ...
    }),
    { name: "auth-storage" }
  )
);
```

### 性能提升

- **减少重渲染**: Zustand 只更新订阅特定状态的组件
- **更好的代码分割**: Store 可以按需导入
- **内置持久化**: 无需手动管理 localStorage

### 开发体验

- **更简洁的 API**: 无需 Provider 包裹
- **更好的 TypeScript 支持**: 完整的类型推断
- **更容易测试**: Store 可以独立测试
- **DevTools 支持**: 可集成 Redux DevTools

## 下一步

1. 测试登录/登出功能
2. 验证状态持久化
3. 检查所有使用认证的页面
4. 准备迁移 ProjectContext
