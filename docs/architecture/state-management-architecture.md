---
sidebar_position: 2
title: "状态管理架构选型"
difficulty: "high"
tags: ["architecture", "state-management", "redux", "zustand", "jotai"]
---

# 状态管理架构选型

## 为什么状态管理如此重要？

```
没有状态管理的 React 应用：

  App
  ├── props drilling (层层传递)
  │   ├── Header ← user
  │   │   └── Avatar ← user
  │   ├── Sidebar ← user, theme, collapsed
  │   │   └── Menu ← user, permissions
  │   └── Content ← user, data
  │       └── Form ← user, data, onSubmit
      
  问题：
  1. props 穿透 5+ 层组件
  2. 中间组件被迫接收不需要的 props
  3. 状态更新导致大面积重渲染
  4. 组件耦合严重，难以复用
```

## 一、状态分类

### 1.1 客户端状态 vs 服务端状态

```
┌─────────────────────────────────────────────────────────┐
│                    状态分类全景图                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  客户端状态                    服务端状态                 │
│  (Client State)               (Server State)            │
│  ────────────────             ────────────────          │
│  • UI 状态 (modal/tooltip)    • 用户数据                │
│  • 表单数据                   • 列表数据                │
│  • 主题/语言偏好              • 配置信息                │
│  • 本地缓存                   • 权限数据                │
│  • 路由状态                   • 搜索结果                │
│                                                         │
│  管理工具:                    管理工具:                  │
│  Redux / Zustand / Jotai      TanStack Query / SWR     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 1.2 状态的作用域

```
┌─────────────────────────────────────────┐
│              全局状态 (Global)            │
│   用户信息、主题、权限、全局配置          │
├─────────────────────────────────────────┤
│              特性状态 (Feature)           │
│   购物车、表单向导、当前页面数据          │
├─────────────────────────────────────────┤
│              局部状态 (Local)             │
│   表单输入、下拉展开、hover 状态          │
└─────────────────────────────────────────┘
```

## 二、状态管理方案对比

### 2.1 Redux (Redux Toolkit)

```
Redux 核心架构：
═══════════════

  View ──dispatch──→ Action ──→ Reducer ──→ Store ──→ View
    ↑                                                    │
    └──────────────── subscribe ─────────────────────────┘

  单向数据流，可预测的状态管理
```

```typescript
// Redux Toolkit 示例
import { createSlice, configureStore } from '@reduxjs/toolkit';

// 定义 slice
const userSlice = createSlice({
  name: 'user',
  initialState: {
    currentUser: null,
    loading: false,
    error: null,
  },
  reducers: {
    setUser: (state, action) => {
      state.currentUser = action.payload;  // Immer 自动处理不可变更新
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    logout: (state) => {
      state.currentUser = null;
    },
  },
});

// 创建 store
const store = configureStore({
  reducer: {
    user: userSlice.reducer,
  },
});

// 在组件中使用
function UserProfile() {
  const user = useSelector((state) => state.user.currentUser);
  const dispatch = useDispatch();

  return (
    <div>
      <p>{user?.name}</p>
      <button onClick={() => dispatch(logout())}>退出</button>
    </div>
  );
}
```

**Redux 适用场景：**
- 大型应用，需要严格的状态管理规范
- 团队协作，需要可追踪的状态变更
- 需要时间旅行调试
- 状态逻辑复杂，需要中间件支持

### 2.2 Zustand

```
Zustand 核心架构：
═════════════════

  Store (create) ──→ useStore Hook ──→ Component
  
  简洁、轻量、无 Provider
```

```typescript
// Zustand 示例
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface UserStore {
  currentUser: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const useUserStore = create<UserStore>()(
  devtools(
    persist(
      (set, get) => ({
        currentUser: null,
        loading: false,

        login: async (credentials) => {
          set({ loading: true });
          try {
            const user = await authService.login(credentials);
            set({ currentUser: user, loading: false });
          } catch (error) {
            set({ loading: false });
            throw error;
          }
        },

        logout: () => {
          set({ currentUser: null });
          authService.logout();
        },
      }),
      { name: 'user-store' }  // 持久化配置
    )
  )
);

// 在组件中使用
function UserProfile() {
  const { currentUser, logout } = useUserStore();

  return (
    <div>
      <p>{currentUser?.name}</p>
      <button onClick={logout}>退出</button>
    </div>
  );
}
```

**Zustand 适用场景：**
- 中小型应用，追求简洁 API
- 不需要 Redux 的严格规范
- 需要快速上手，减少样板代码
- 需要内置的持久化和 devtools 支持

### 2.3 Jotai

```
Jotai 核心架构：
═══════════════

  atom (状态单元) ──→ useAtom Hook ──→ Component
  
  原子化状态，按需订阅
```

```typescript
// Jotai 示例
import { atom, useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// 定义原子
const currentUserAtom = atom<User | null>(null);
const loadingAtom = atom(false);

// 派生原子
const isAuthenticatedAtom = atom((get) => get(currentUserAtom) !== null);

// 持久化原子
const themeAtom = atomWithStorage('theme', 'light');

// 带异步操作的原子
const loginAtom = atom(
  null,
  async (get, set, credentials: LoginCredentials) => {
    set(loadingAtom, true);
    try {
      const user = await authService.login(credentials);
      set(currentUserAtom, user);
    } finally {
      set(loadingAtom, false);
    }
  }
);

// 在组件中使用
function UserProfile() {
  const [user] = useAtom(currentUserAtom);
  const [, login] = useAtom(loginAtom);
  const [isAuthenticated] = useAtom(isAuthenticatedAtom);

  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />;
  }

  return <div>{user?.name}</div>;
}
```

**Jotai 适用场景：**
- 需要细粒度的状态订阅
- 状态之间有复杂的依赖关系
- 追求最小化重渲染
- 喜欢 React 原生的 atom 概念

### 2.4 Recoil

```typescript
// Recoil 示例
import { atom, selector, useRecoilState, useRecoilValue } from 'recoil';

// 定义 atom
const currentUserState = atom<User | null>({
  key: 'currentUser',
  default: null,
});

const loadingState = atom<boolean>({
  key: 'loading',
  default: false,
});

// 定义 selector（派生状态）
const isAuthenticatedSelector = selector({
  key: 'isAuthenticated',
  get: ({ get }) => get(currentUserState) !== null,
});

// 异步 selector
const userProfileSelector = selector({
  key: 'userProfile',
  get: async ({ get }) => {
    const user = get(currentUserState);
    if (!user) return null;
    return await fetchUserProfile(user.id);
  },
});

// 在组件中使用
function UserProfile() {
  const [user, setUser] = useRecoilState(currentUserState);
  const isAuthenticated = useRecoilValue(isAuthenticatedSelector);
  const profile = useRecoilValue(userProfileSelector);

  return <div>{profile?.name}</div>;
}
```

### 2.5 方案对比总结

| 特性 | Redux | Zustand | Jotai | Recoil |
|------|-------|---------|-------|--------|
| **学习曲线** | 较陡 | 平缓 | 平缓 | 中等 |
| **样板代码** | 多（RTK 较少） | 少 | 少 | 中等 |
| **包体积** | ~11KB | ~1KB | ~2KB | ~15KB |
| **TypeScript** | 优秀 | 优秀 | 优秀 | 良好 |
| **DevTools** | 完善 | 支持 | 支持 | 支持 |
| **中间件** | 丰富 | 支持 | 有限 | 有限 |
| **状态模型** | 集中式 | Store 模式 | 原子化 | 原子化 |
| **适用规模** | 大型 | 中小型 | 中大型 | 中大型 |
| **推荐指数** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

## 三、服务端状态管理

### 3.1 TanStack Query (React Query)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// 查询用户数据
function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    staleTime: 5 * 60 * 1000,  // 5 分钟内数据视为新鲜
    gcTime: 10 * 60 * 1000,    // 10 分钟后清理缓存
  });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;

  return <div>{user.name}</div>;
}

// 修改用户数据
function EditUser({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: UpdateUserData) => updateUser(userId, data),
    onSuccess: () => {
      // 自动重新获取相关数据
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    },
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      mutation.mutate({ name: 'New Name' });
    }}>
      <button disabled={mutation.isPending}>保存</button>
    </form>
  );
}
```

### 3.2 SWR

```typescript
import useSWR from 'swr';

function UserProfile({ userId }: { userId: string }) {
  const { data: user, error, isLoading, mutate } = useSWR(
    `/api/users/${userId}`,
    fetcher,
    {
      revalidateOnFocus: true,    // 窗口聚焦时重新验证
      revalidateOnReconnect: true, // 网络重连时重新验证
      dedupingInterval: 2000,      // 2 秒内去重
    }
  );

  return <div>{user?.name}</div>;
}
```

### 3.3 服务端状态 vs 客户端状态

```
决策树：
═════

这个状态需要和服务端同步吗？
├── 是 → 使用 TanStack Query / SWR
│        ├── 需要缓存？ → 配置 staleTime / gcTime
│        ├── 需要乐观更新？ → useMutation + onMutate
│        └── 需要实时？ → useQuery + refetchInterval
│
└── 否 → 这个状态是全局的吗？
         ├── 是 → 使用 Zustand / Jotai
         │        ├── 状态逻辑复杂？ → Zustand + middleware
         │        └── 需要细粒度订阅？ → Jotai
         │
         └── 否 → 使用 useState / useReducer
```

## 四、状态管理最佳实践

### 4.1 状态设计原则

```typescript
// ✅ 好：状态最小化
const useCartStore = create((set) => ({
  items: [],          // 只存必要数据
  addItem: (item) => set((state) => ({
    items: [...state.items, item]
  })),
}));

// ❌ 坏：冗余状态
const useCartStore = create((set) => ({
  items: [],
  totalPrice: 0,      // 可以从 items 计算得出
  itemCount: 0,       // 可以从 items 计算得出
}));

// ✅ 好：派生状态
function CartSummary() {
  const items = useCartStore((state) => state.items);
  const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
  const itemCount = items.length;
}
```

### 4.2 状态切分

```typescript
// ✅ 好：按功能切分
const useUserStore = create(...)    // 用户相关
const useCartStore = create(...)    // 购物车相关
const useUIStore = create(...)      // UI 状态相关

// ❌ 坏：一个巨大的 store
const useAppStore = create(...)     // 所有状态混在一起
```

### 4.3 避免状态滥用

```typescript
// ❌ 不需要状态管理的情况

// 1. 表单状态 —— 使用 React Hook Form
const { register, handleSubmit } = useForm();

// 2. URL 状态 —— 使用 URL 参数
const [searchParams, setSearchParams] = useSearchParams();

// 3. 局部 UI 状态 —— 使用 useState
const [isOpen, setIsOpen] = useState(false);

// 4. 服务端数据 —— 使用 TanStack Query
const { data } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
```

## 五、综合方案示例

### 5.1 大型项目状态架构

```typescript
// 1. 全局客户端状态 —— Zustand
// stores/app.store.ts
interface AppState {
  theme: 'light' | 'dark';
  locale: string;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      locale: 'zh-CN',
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'app-store' }
  )
);

// 2. 服务端状态 —— TanStack Query
// hooks/useUsers.ts
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 5 * 60 * 1000,
  });
}

// 3. 局部状态 —— useState
// components/UserForm.tsx
function UserForm() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(initialData);
  // ...
}
```

## 面试要点

### 常见面试问题

1. **Redux、Zustand、Jotai 分别适用于什么场景？**
   - Redux：大型应用、严格规范、时间旅行调试
   - Zustand：中小型应用、简洁 API、快速开发
   - Jotai：细粒度订阅、原子化状态、性能敏感

2. **客户端状态和服务端状态有什么区别？**
   - 客户端状态：UI 状态、表单数据、偏好设置
   - 服务端状态：需要与后端同步的数据，使用 TanStack Query/SWR

3. **如何避免不必要的重渲染？**
   - 状态切分：按功能模块拆分 store
   - 选择器优化：只订阅需要的状态片段
   - 使用 useMemo/useCallback 缓存计算结果

4. **什么时候不需要状态管理？**
   - 局部 UI 状态用 useState
   - 表单状态用 React Hook Form
   - URL 状态用 URL 参数
   - 服务端数据用 TanStack Query

### 关键要点

- **选型依据**：项目规模、团队习惯、性能要求
- **状态分类**：客户端状态 vs 服务端状态，全局 vs 局部
- **避免滥用**：不是所有状态都需要全局管理
- **性能优化**：状态切分、选择器优化、避免冗余状态
