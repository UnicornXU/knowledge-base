---
title: React 19 新特性
description: Actions、useOptimistic、新 Context API、编译器优化 — React 19 完整指南
keywords: [React 19, Actions, useOptimistic, useActionState, React Compiler, use() API]
---

# React 19 新特性

React 19 是 React 的重大版本更新，引入了 Actions 数据模型、新的 Hook、编译器优化等革命性变化，重新定义了 React 应用的数据流和开发方式。

## React 19 新特性全景

```mermaid
graph TB
    subgraph R19["React 19 新特性全景"]
        direction TB

        subgraph ACTIONS["Actions 数据模型"]
            A1["useActionState"]
            A2["useOptimistic"]
            A3["useFormStatus"]
            A4["action prop"]
        end

        subgraph HOOKS["新 Hook / API"]
            H1["use() API"]
            H2["ref 回调清理"]
            H3["Context as Provider"]
            H4["useId / useSyncExternalStore"]
        end

        subgraph COMPILER["编译器优化"]
            C1["React Compiler"]
            C2["自动 memo"]
            C3["自动 useMemo / useCallback"]
            C4["自动细粒度更新"]
        end

        subgraph META["元框架支持"]
            M1["改进 RSC 支持"]
            M2["改进 SSR 流式"]
            M3["改进预加载 API"]
        end
    end

    ACTIONS -->|"驱动"| HOOKS
    COMPILER -->|"优化"| ACTIONS
    META -->|"支持"| ACTIONS

    style ACTIONS fill:#e3f2fd,stroke:#2196f3
    style HOOKS fill:#e8f5e9,stroke:#4caf50
    style COMPILER fill:#fff3e0,stroke:#ff9800
    style META fill:#f3e5f5,stroke:#9c27b0
```

## Actions 数据模型

### 传统表单处理 vs Actions

```mermaid
graph TB
    subgraph OLD["传统方式（React 18 之前）"]
        direction TB
        O1["onChange 更新状态"] --> O2["提交时阻止默认行为"]
        O2 --> O3["手动管理 loading 状态"]
        O3 --> O4["手动管理错误状态"]
        O4 --> O5["手动管理乐观更新"]
    end

    subgraph NEW["Actions 方式（React 19）"]
        direction TB
        N1["action prop 绑定函数"] --> N2["React 管理 pending 状态"]
        N2 --> N3["内置错误处理"]
        N3 --> N4["内置乐观更新"]
        N4 --> N5["自动表单重置"]
    end

    style OLD fill:#ffcdd2,stroke:#e53935
    style NEW fill:#c8e6c9,stroke:#43a047
```

### useActionState

`useActionState` 是 React 19 中处理表单提交和状态管理的核心 Hook。

```tsx
import { useActionState } from 'react';

interface FormState {
  success?: boolean;
  error?: string;
  data?: { id: string; name: string };
}

// Action 函数 — 可以在服务端或客户端运行
async function addUserAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  try {
    const user = await createUser({ name, email });
    return { success: true, data: user };
  } catch (err) {
    return { error: 'Failed to create user' };
  }
}

export function CreateUserForm() {
  const [state, formAction, isPending] = useActionState(addUserAction, {});

  return (
    <form action={formAction}>
      <input name="name" placeholder="Name" required />
      <input name="email" placeholder="Email" required />

      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create User'}
      </button>

      {state.error && <p className="error">{state.error}</p>}
      {state.success && <p className="success">Created: {state.data?.name}</p>}
    </form>
  );
}
```

### useActionState 执行流程

```mermaid
sequenceDiagram
    participant Form as 表单
    participant Hook as useActionState
    participant Action as Action 函数
    participant Server as 服务端

    Form->>Hook: 用户提交表单
    Hook->>Hook: isPending = true
    Hook->>Action: 调用 action(prevState, formData)

    alt Action 是服务端函数
        Action->>Server: 发送请求
        Server-->>Action: 返回结果
    else Action 是客户端函数
        Action->>Action: 直接执行
    end

    Action-->>Hook: 返回新状态
    Hook->>Hook: 更新 state, isPending = false
    Hook->>Form: 重新渲染（显示结果）
```

### useOptimistic

`useOptimistic` 实现乐观更新 — 在服务端响应前立即显示预期结果。

```tsx
import { useOptimistic, useTransition } from 'react';

interface Message {
  id: string;
  text: string;
  sending?: boolean;
}

export function MessageList({ messages }: { messages: Message[] }) {
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage: string) => [
      ...state,
      {
        id: crypto.randomUUID(),
        text: newMessage,
        sending: true, // 标记为乐观状态
      },
    ]
  );

  const [isPending, startTransition] = useTransition();

  const handleSend = async (formData: FormData) => {
    const text = formData.get('message') as string;

    startTransition(async () => {
      // 立即显示消息（乐观更新）
      addOptimisticMessage(text);

      // 发送到服务端
      await sendMessage(text);
      // 服务端成功后，optimisticMessages 自动替换为真实数据
    });
  };

  return (
    <div>
      <ul>
        {optimisticMessages.map(msg => (
          <li
            key={msg.id}
            style={{ opacity: msg.sending ? 0.6 : 1 }}
          >
            {msg.text}
            {msg.sending && <span> (发送中...)</span>}
          </li>
        ))}
      </ul>

      <form action={handleSend}>
        <input name="message" placeholder="Type a message..." />
        <button type="submit" disabled={isPending}>Send</button>
      </form>
    </div>
  );
}
```

### useOptimistic 执行流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant UI as 界面
    participant Optimistic as useOptimistic
    participant Server as 服务端

    User->>UI: 输入 "Hello" 并发送
    UI->>Optimistic: addOptimistic("Hello")
    Optimistic->>UI: 立即显示 "Hello"（半透明）
    Note over UI: 用户立即看到反馈

    UI->>Server: 发送消息到服务端
    Note over Server: 处理中...

    alt 成功
        Server-->>UI: 返回确认
        Optimistic->>UI: 替换为真实数据（不透明）
    else 失败
        Server-->>UI: 返回错误
        Optimistic->>UI: 移除乐观消息
    end
```

### useFormStatus

`useFormStatus` 在表单组件内部获取表单提交状态。

```tsx
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  // 必须在 <form> 内部的组件中使用
  const { pending, data, method, action } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Submitting...' : 'Submit'}
    </button>
  );
}

function StatusDisplay() {
  const { pending, data } = useFormStatus();

  if (!data) return null;

  return (
    <p>
      {pending ? 'Processing...' : `Submitted: ${data.get('name')}`}
    </p>
  );
}

export function Form() {
  return (
    <form action={submitForm}>
      <input name="name" />
      <StatusDisplay />
      <SubmitButton />
    </form>
  );
}
```

## use() API

`use()` 是 React 19 引入的新 API，可以在渲染时读取 Promise 和 Context。

```tsx
import { use } from 'react';

// 读取 Promise — 配合 Suspense 使用
function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise); // 如果未 resolve，触发 Suspense
  return <h1>{user.name}</h1>;
}

// 读取 Context — 可以在条件语句中使用
function ThemedButton() {
  const theme = use(ThemeContext); // 可以在 if/循环中调用
  return <button style={{ color: theme.primary }}>Click</button>;
}

// 父组件中传递 Promise
export function Page() {
  const userPromise = fetchUser(); // 创建 Promise

  return (
    <Suspense fallback={<Loading />}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  );
}
```

### use() vs useEffect 获取数据

```mermaid
graph TB
    subgraph USE_EFFECT["传统方式 useEffect"]
        direction TB
        UE1["组件挂载"] --> UE2["useEffect 触发"]
        UE2 --> UE3["fetch 数据"]
        UE3 --> UE4["setState 更新"]
        UE4 --> UE5["组件重新渲染"]
        NOTE1["问题：需要管理 loading/error 状态<br/>容易产生瀑布流"]
    end

    subgraph USE_HOOK["use() 方式"]
        direction TB
        U1["父组件创建 Promise"] --> U2["传递 Promise 给子组件"]
        U2 --> U3["use(promise) 读取"]
        U3 --> U4{"Promise 状态?"}
        U4 -->|"pending"| U5["触发 Suspense fallback"]
        U4 -->|"resolved"| U6["直接渲染"]
        NOTE2["优势：配合 Suspense 天然处理 loading<br/>无瀑布流"]
    end

    style USE_EFFECT fill:#ffcdd2,stroke:#e53935
    style USE_HOOK fill:#c8e6c9,stroke:#43a047
```

## 新 Context API — Context as Provider

```tsx
import { createContext } from 'react';

// React 19: 直接使用 Context 作为 Provider
const ThemeContext = createContext('light');

function App() {
  return (
    // 不再需要 ThemeContext.Provider
    <ThemeContext value="dark">
      <ChildComponent />
    </ThemeContext>
  );
}

function ChildComponent() {
  const theme = use(ThemeContext); // 使用新 use() API
  return <div className={theme}>Content</div>;
}
```

## ref 回调清理函数

```tsx
// React 19: ref 回调可以返回清理函数
function TextInput() {
  return (
    <input
      ref={(node) => {
        // 挂载时：聚焦输入框
        if (node) {
          node.focus();
        }

        // 返回清理函数（卸载时执行）
        return () => {
          console.log('Input unmounted');
        };
      }}
    />
  );
}

// 对比 React 18 的方式（需要 useEffect）
function TextInputOld() {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
    return () => console.log('unmounted');
  }, []);

  return <input ref={ref} />;
}
```

## React Compiler

React Compiler（原 React Forget）是 React 19 生态中的革命性工具，自动优化组件重渲染。

### React Compiler 做了什么

```mermaid
graph TB
    subgraph COMPILER_FLOW["React Compiler 优化流程"]
        direction TB

        INPUT["源代码<br/>普通 React 组件"]
        ANALYZE["编译器分析<br/>数据流 / 依赖图"]
        OPTIMIZE["自动优化"]

        OPTIMIZE --> O1["自动 memo 组件"]
        OPTIMIZE --> O2["自动 memo 计算值"]
        OPTIMIZE --> O3["自动 useCallback"]
        OPTIMIZE --> O4["细粒度依赖追踪"]

        OUTPUT["优化后的代码<br/>零手动 memo"]
    end

    INPUT --> ANALYZE --> OPTIMIZE --> OUTPUT

    style INPUT fill:#e3f2fd,stroke:#2196f3
    style ANALYZE fill:#fff3e0,stroke:#ff9800
    style OPTIMIZE fill:#e8f5e9,stroke:#4caf50
    style OUTPUT fill:#f3e5f5,stroke:#9c27b0
```

### 编译器优化对比

```tsx
// ❌ 手动优化（React 18）
const ExpensiveComponent = memo(function ExpensiveComponent({ data, onAction }) {
  const sorted = useMemo(() => data.sort(compareFn), [data]);
  const handleClick = useCallback(() => onAction(data.id), [onAction, data.id]);

  return (
    <div onClick={handleClick}>
      {sorted.map(item => <Item key={item.id} {...item} />)}
    </div>
  );
});

// ✅ 自动优化（React Compiler）
// 编译器自动添加 memo、useMemo、useCallback
function ExpensiveComponent({ data, onAction }) {
  const sorted = data.sort(compareFn);
  const handleClick = () => onAction(data.id);

  return (
    <div onClick={handleClick}>
      {sorted.map(item => <Item key={item.id} {...item} />)}
    </div>
  );
}

// 编译器输出（简化）：
// - ExpensiveComponent 自动 memo
// - sorted 自动 useMemo
// - handleClick 自动 useCallback
// - 组件只在实际依赖变化时重渲染
```

### 编译器规则

```mermaid
graph LR
    subgraph RULES["React Compiler 规则"]
        direction TB
        R1["组件必须是纯函数"]
        R2["Hook 调用必须在顶层"]
        R3["不可在渲染时修改已创建的对象"]
        R4["不可在渲染时调用 setState"]
        R5["遵循 React 约定即可自动优化"]
    end

    style RULES fill:#e3f2fd,stroke:#2196f3
```

## 改进的预加载 API

```tsx
// React 19 新增的资源预加载 API
import { prefetchDNS, preconnect, preload, preinit } from 'react-dom';

function Page() {
  // 预解析 DNS
  prefetchDNS('https://api.example.com');

  // 预建立连接
  preconnect('https://fonts.googleapis.com');

  // 预加载资源
  preload('/fonts/inter.woff2', { as: 'font', type: 'font/woff2' });
  preload('/hero.webp', { as: 'image' });

  // 预初始化（加载并执行）
  preinit('/scripts/analytics.js', { as: 'script' });

  return <div>...</div>;
}
```

## React 19 迁移清单

```mermaid
graph TB
    subgraph MIGRATION["React 19 迁移要点"]
        direction TB

        subgraph BREAKING["破坏性变更"]
            B1["移除 defaultProps<br/>改用默认参数"]
            B2["移除 propTypes<br/>使用 TypeScript"]
            B3["移除 legacy Context<br/>使用新 Context"]
            B4["ref 必须通过 prop 传递<br/>移除 forwardRef"]
            B5["cleanup ref 回调"]
        end

        subgraph NEW["新 API 采用"]
            N1["useActionState 替代手动表单状态"]
            N2["useOptimistic 替代手动乐观更新"]
            N3["use() 替代 useContext"]
            N4["action prop 替代 onSubmit"]
        end

        subgraph OPT["优化机会"]
            O1["启用 React Compiler"]
            O2["使用新预加载 API"]
            O3["使用改进的 SSR"]
        end
    end

    style BREAKING fill:#ffcdd2,stroke:#e53935
    style NEW fill:#c8e6c9,stroke:#43a047
    style OPT fill:#e3f2fd,stroke:#2196f3
```

### forwardRef 的变化

```tsx
// React 18: 需要 forwardRef
const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  return <input ref={ref} {...props} />;
});

// React 19: ref 作为普通 prop
function Input({ ref, ...props }: InputProps & { ref?: Ref<HTMLInputElement> }) {
  return <input ref={ref} {...props} />;
}
```

## 综合实战：React 19 表单

```tsx
'use client';

import { useActionState, useOptimistic, useFormStatus } from 'react';
import { submitComment } from './actions';

interface Comment {
  id: string;
  text: string;
  author: string;
  pending?: boolean;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Posting...' : 'Post Comment'}
    </button>
  );
}

export function CommentSection({ comments }: { comments: Comment[] }) {
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    comments,
    (state, newComment: { text: string; author: string }) => [
      ...state,
      {
        id: crypto.randomUUID(),
        ...newComment,
        pending: true,
      },
    ]
  );

  const [state, formAction] = useActionState(
    async (prevState: any, formData: FormData) => {
      const text = formData.get('text') as string;
      const author = formData.get('author') as string;

      // 乐观更新
      addOptimisticComment({ text, author });

      try {
        await submitComment({ text, author });
        return { success: true };
      } catch {
        return { error: 'Failed to post comment' };
      }
    },
    {}
  );

  return (
    <div>
      <ul>
        {optimisticComments.map(comment => (
          <li key={comment.id} style={{ opacity: comment.pending ? 0.5 : 1 }}>
            <strong>{comment.author}</strong>: {comment.text}
          </li>
        ))}
      </ul>

      <form action={formAction}>
        <input name="author" placeholder="Your name" required />
        <textarea name="text" placeholder="Write a comment..." required />
        <SubmitButton />
      </form>

      {state.error && <p className="error">{state.error}</p>}
    </div>
  );
}
```

## 面试要点

1. **Actions 是什么？** — React 19 的数据变更模型，将异步操作（表单提交、数据变更）统一为 action 函数
2. **useActionState 和 useState 的区别？** — useActionState 接收 action 函数，自动管理 pending 状态和错误处理
3. **useOptimistic 的工作原理？** — 在 action 执行期间显示乐观状态，成功后替换为真实数据，失败后回滚
4. **React Compiler 的作用？** — 自动 memo 化组件和计算值，无需手动 useMemo/useCallback/memo
5. **use() API 的用途？** — 在渲染时读取 Promise（配合 Suspense）和 Context（可在条件中使用）
6. **React 19 为什么移除 forwardRef？** — ref 作为普通 prop 传递，简化了 API，减少了嵌套层级
7. **useFormStatus 的使用限制？** — 必须在 `<form>` 内部的子组件中调用，用于获取父表单的提交状态

---

> **相关章节**：[React Server Components](./server-components.md) | [Suspense 与并发模式](./suspense-concurrent.md)
