---
sidebar_position: 2
title: React 组件测试
description: Testing Library 原理、渲染测试、事件测试、异步测试、Hooks 测试
keywords: [React Testing Library, 组件测试, fireEvent, waitFor, renderHook]
---

# React 组件测试

React 组件测试的核心理念：**测试用户行为，而非实现细节**。React Testing Library (RTL) 由 Kent C. Dodds 创建，强制你从用户视角编写测试。

---

## 组件测试策略

```mermaid
flowchart TD
    Start["🧩 React 组件"] --> Classify{"组件类型？"}

    Classify -- "纯展示组件" --> Snapshot["📸 快照测试<br/>验证 UI 结构"]
    Classify -- "交互组件" --> Event["🖱️ 事件测试<br/>click / input / submit"]
    Classify -- "异步组件" --> Async["⏳ 异步测试<br/>waitFor / findBy"]
    Classify -- "自定义 Hook" --> Hook["🪝 Hook 测试<br/>renderHook"]

    Snapshot --> Assert1["断言 DOM 结构"]
    Event --> Assert2["断言状态变化 + DOM 更新"]
    Async --> Assert3["断言异步数据渲染"]
    Hook --> Assert4["断言返回值与副作用"]

    Assert1 --> Done["✅ 测试通过"]
    Assert2 --> Done
    Assert3 --> Done
    Assert4 --> Done

    style Snapshot fill:#a29bfe,stroke:#6c5ce7,color:#fff
    style Event fill:#48dbfb,stroke:#0abde3,color:#333
    style Async fill:#feca57,stroke:#f39c12,color:#333
    style Hook fill:#2ecc71,stroke:#27ae60,color:#fff
    style Done fill:#2ecc71,stroke:#27ae60,color:#fff
```

---

## Testing Library 核心原理

```mermaid
sequenceDiagram
    participant Test as 测试代码
    participant RTL as React Testing Library
    participant React as React 运行时
    participant DOM as 虚拟 DOM / 真实 DOM

    Test->>RTL: render(<Component />)
    RTL->>React: 创建 React Root
    React->>DOM: 渲染组件树
    DOM-->>RTL: 返回 DOM 容器

    Test->>RTL: screen.getByRole('button')
    RTL->>DOM: 查询 DOM 元素
    DOM-->>RTL: 返回匹配元素
    RTL-->>Test: 返回 HTMLElement

    Test->>RTL: fireEvent.click(button)
    RTL->>DOM: 派发 click 事件
    DOM->>React: 触发事件处理
    React->>DOM: 更新 DOM

    Test->>RTL: expect(button).toHaveTextContent('已点击')
    RTL->>DOM: 查询元素文本
    DOM-->>RTL: 返回文本内容
    RTL-->>Test: 断言结果
```

### 优先级：查询方式选择

```mermaid
graph TD
    Query["🔍 选择查询方式"] --> Priority1["🥇 优先：无障碍查询<br/>getByRole / getByLabelText<br/>getByPlaceholderText"]
    Query --> Priority2["🥈 其次：语义查询<br/>getByText / getByAltText<br/>getByTitle"]
    Query --> Priority3["🥉 最后：测试 ID<br/>getByTestId — 最后手段"]

    Priority1 --> Reason1["对用户最友好<br/>逼迫你写无障碍代码"]
    Priority2 --> Reason2["语义清晰<br/>用户可感知"]
    Priority3 --> Reason3["兜底方案<br/>无其他可选时使用"]

    style Priority1 fill:#2ecc71,stroke:#27ae60,color:#fff
    style Priority2 fill:#feca57,stroke:#f39c12,color:#333
    style Priority3 fill:#ff6b6b,stroke:#c0392b,color:#fff
```

---

## 渲染测试

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserProfile } from './UserProfile';

describe('UserProfile', () => {
  const defaultProps = {
    name: '张三',
    email: 'zhangsan@example.com',
    avatar: 'https://example.com/avatar.jpg',
    isVerified: true,
  };

  it('should render user information correctly', () => {
    render(<UserProfile {...defaultProps} />);

    expect(screen.getByText('张三')).toBeInTheDocument();
    expect(screen.getByText('zhangsan@example.com')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /张三的头像/ })).toHaveAttribute(
      'src',
      defaultProps.avatar
    );
  });

  it('should show verified badge when user is verified', () => {
    render(<UserProfile {...defaultProps} isVerified={true} />);

    expect(screen.getByText('已认证')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /已认证/ })).toBeInTheDocument();
  });

  it('should not show verified badge when user is not verified', () => {
    render(<UserProfile {...defaultProps} isVerified={false} />);

    expect(screen.queryByText('已认证')).not.toBeInTheDocument();
  });
});
```

---

## 事件测试

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Counter } from './Counter';

describe('Counter', () => {
  it('should increment count when button is clicked', async () => {
    const user = userEvent.setup();
    render(<Counter initialCount={0} />);

    const button = screen.getByRole('button', { name: /增加/ });
    const countDisplay = screen.getByTestId('count-display');

    expect(countDisplay).toHaveTextContent('0');

    await user.click(button);

    expect(countDisplay).toHaveTextContent('1');
  });

  it('should call onChange callback when count changes', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Counter initialCount={0} onChange={handleChange} />);

    const button = screen.getByRole('button', { name: /增加/ });
    await user.click(button);
    await user.click(button);

    expect(handleChange).toHaveBeenCalledTimes(2);
    expect(handleChange).toHaveBeenCalledWith(2);
  });
});
```

### 表单事件测试

```tsx
describe('LoginForm', () => {
  it('should submit form with correct values', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(<LoginForm onSubmit={handleSubmit} />);

    // 填写表单
    await user.type(
      screen.getByLabelText(/邮箱/),
      'test@example.com'
    );
    await user.type(
      screen.getByLabelText(/密码/),
      'password123'
    );

    // 提交
    await user.click(screen.getByRole('button', { name: /登录/ }));

    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});
```

---

## 异步测试

```mermaid
sequenceDiagram
    participant Test as 测试代码
    participant Component as 组件
    participant API as API 服务

    Test->>Component: render(<UserList />)
    Component->>API: useEffect → fetchUsers()
    Note over Component: 显示 Loading...

    Test->>Test: screen.getByText('加载中...')
    Note over Test: 断言 Loading 状态

    API-->>Component: 返回用户数据
    Component->>Component: setState(users)
    Note over Component: 渲染用户列表

    Test->>Test: await screen.findByText('张三')
    Note over Test: 等待异步渲染完成
    Test->>Test: expect(screen.getAllByRole('listitem')).toHaveLength(3)
    Note over Test: 断言列表数据
```

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { UserList } from './UserList';

// 方式一：findBy（推荐 — 自带等待）
describe('UserList', () => {
  it('should render user list after fetch', async () => {
    // Mock API
    server.use(
      rest.get('/api/users', (req, res, ctx) => {
        return res(
          ctx.json([
            { id: '1', name: '张三' },
            { id: '2', name: '李四' },
          ])
        );
      })
    );

    render(<UserList />);

    // findBy 会自动等待元素出现（默认 1000ms）
    expect(await screen.findByText('张三')).toBeInTheDocument();
    expect(await screen.findByText('李四')).toBeInTheDocument();
  });

  // 方式二：waitFor（更灵活的等待）
  it('should show error state on fetch failure', async () => {
    server.use(
      rest.get('/api/users', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    render(<UserList />);

    await waitFor(() => {
      expect(screen.getByText(/加载失败/)).toBeInTheDocument();
    });
  });
});
```

---

## 自定义 Hook 测试

```tsx
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('should initialize with default value', () => {
    const { result } = renderHook(() => useCounter(0));

    expect(result.current.count).toBe(0);
  });

  it('should increment count', () => {
    const { result } = renderHook(() => useCounter(0));

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('should not exceed max value', () => {
    const { result } = renderHook(() => useCounter(9, { max: 10 }));

    act(() => {
      result.current.increment();
      result.current.increment(); // 超过 max
    });

    expect(result.current.count).toBe(10);
  });
});
```

---

## MSW — API Mock 方案

```mermaid
graph LR
    subgraph 传统 Mock
        JMock["jest.mock()"] --> |"耦合实现"| Problem["❌ 测试与实现绑定"]
    end

    subgraph MSW 方案
        MSW["Mock Service Worker"] --> |"拦截网络请求"| Worker["Service Worker<br/>或 Node 拦截"]
        Worker --> |"返回模拟数据"| Response["✅ 真实网络层"]
    end

    style MSW fill:#ff6a33,stroke:#e65100,color:#fff
    style Problem fill:#ff6b6b,stroke:#c0392b,color:#fff
    style Response fill:#2ecc71,stroke:#27ae60,color:#fff
```

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: '1', name: '张三' },
      { id: '2', name: '李四' },
    ]);
  }),

  http.get('/api/users/:id', ({ params }) => {
    const { id } = params;
    return HttpResponse.json({ id, name: '张三' });
  }),
];

// tests/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// vitest.setup.ts
import { server } from './tests/mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## 最佳实践清单

| 实践 | 说明 |
|------|------|
| 查询优先用 `getByRole` | 最接近用户感知方式 |
| 用 `userEvent` 代替 `fireEvent` | 更真实的用户交互模拟 |
| 用 `findBy` 处理异步 | 自带超时与重试 |
| 测试行为而非实现 | 不要测试 state 值，测试 DOM 输出 |
| 每个测试独立 | 不依赖其他测试的执行顺序 |
| Mock 最外层 | 用 MSW 拦截网络，不要 mock 内部模块 |

---

## 面试高频问题

1. **React Testing Library 和 Enzyme 的区别？为什么推荐 RTL？**
2. **getBy、queryBy、findBy 的区别是什么？**
3. **如何测试自定义 Hook？**
4. **如何测试异步请求和 Loading 状态？**
5. **userEvent 和 fireEvent 的区别？**
6. **如何 Mock API 请求？MSW 的优势是什么？**
7. **什么是测试实现细节？为什么应该避免？**

---

## 参考资源

- [React Testing Library 官方文档](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW 官方文档](https://mswjs.io/)
- [Kent C. Dodds — Testing Implementation Details](https://kentcdodds.com/blog/testing-implementation-details)
- [userEvent 文档](https://testing-library.com/docs/user-event/intro/)
