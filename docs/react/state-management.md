---
sidebar_position: 3
title: "状态管理"
difficulty: "medium"
tags: ["react", "state", "zustand", "redux"]
---

# 状态管理

## 状态管理方案对比

| 方案 | 核心思想 | 适用场景 | 学习成本 |
|------|---------|---------|---------|
| useState | 组件内状态 | 简单组件 | 低 |
| useContext | 跨组件共享 | 主题、语言等 | 低 |
| Redux | 单一数据源 + 纯函数 | 大型应用 | 高 |
| Zustand | 轻量 Store | 中小型应用 | 低 |
| Jotai | 原子化状态 | 细粒度状态 | 中 |
| Recoil | 图状态 | 复杂依赖关系 | 中 |

## Zustand（推荐）

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface TodoStore {
  todos: Todo[];
  addTodo: (text: string) => void;
  toggleTodo: (id: number) => void;
  removeTodo: (id: number) => void;
}

const useTodoStore = create<TodoStore>()(
  devtools(
    persist(
      (set) => ({
        todos: [],
        addTodo: (text) =>
          set((state) => ({
            todos: [...state.todos, { id: Date.now(), text, completed: false }],
          })),
        toggleTodo: (id) =>
          set((state) => ({
            todos: state.todos.map((t) =>
              t.id === id ? { ...t, completed: !t.completed } : t
            ),
          })),
        removeTodo: (id) =>
          set((state) => ({
            todos: state.todos.filter((t) => t.id !== id),
          })),
      }),
      { name: 'todo-store' }
    )
  )
);

// 组件中使用
function TodoList() {
  const todos = useTodoStore((state) => state.todos);
  const addTodo = useTodoStore((state) => state.addTodo);
  // ...
}
```

## React Query / TanStack Query

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function UserList() {
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 5 * 60 * 1000, // 5 分钟内认为数据是新鲜的
  });

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  if (isLoading) return <Loading />;

  return (
    <div>
      {users.map((user) => <UserCard key={user.id} user={user} />)}
    </div>
  );
}
```

## 关键点

- 优先使用组件内状态（`useState`），只在需要共享时提升
- 服务端状态用 TanStack Query，客户端状态用 Zustand/Jotai
- Redux Toolkit 简化了 Redux 的使用，但仍有较多模板代码
- Zustand 体积小（~1KB）、API 简洁、支持中间件
