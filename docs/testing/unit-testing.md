---
sidebar_position: 1
title: 单元测试详解
description: Jest/Vitest 配置与实战、Mock/Stub、测试覆盖率、TDD 流程
keywords: [单元测试, Jest, Vitest, Mock, Stub, TDD, 测试覆盖率]
---

# 单元测试详解

单元测试是对软件中最小可测试单元（函数、方法、组件）进行验证的测试方式。它是前端测试金字塔的基石。

---

## 单元测试执行流程

```mermaid
flowchart TD
    Start["📝 编写测试用例"] --> Setup["⚙️ 初始化环境<br/>beforeEach / describe"]
    Setup --> Execute["▶️ 执行被测函数"]
    Execute --> Assert["🔍 断言结果<br/>expect(actual).toBe(expected)"]
    Assert --> Pass{"通过？"}
    Pass -- 是 --> Teardown["🧹 清理环境<br/>afterEach / afterAll"]
    Pass -- 否 --> Fail["❌ 测试失败<br/>输出差异信息"]
    Teardown --> Report["📊 生成测试报告"]
    Fail --> Report

    style Start fill:#48dbfb,stroke:#0abde3,color:#333
    style Pass fill:#feca57,stroke:#f39c12,color:#333
    style Report fill:#2ecc71,stroke:#27ae60,color:#fff
    style Fail fill:#ff6b6b,stroke:#c0392b,color:#fff
```

---

## Jest vs Vitest 对比

```mermaid
graph LR
    subgraph Jest
        J1["Facebook 维护"]
        J2["零配置启动"]
        J3["生态成熟"]
        J4["较慢（CommonJS）"]
    end

    subgraph Vitest
        V1["Vite 生态"]
        V2["原生 ESM"]
        V3["兼容 Jest API"]
        V4["极快（HMR）"]
    end

    J1 -.->|"选择"| Decision{选择哪个？}
    V1 -.-> Decision

    Decision -- "新项目 + Vite" --> Vitest2["✅ Vitest"]
    Decision -- "已有 Jest 配置" --> Jest2["✅ Jest"]
    Decision -- "需要快照 + 覆盖率" --> Either["✅ 都可以"]

    style Jest2 fill:#9945a3,stroke:#7b2d8e,color:#fff
    style Vitest2 fill:#729b1b,stroke:#5a7c15,color:#fff
    style Either fill:#feca57,stroke:#f39c12,color:#333
```

### 核心配置对比

```typescript
// Jest 配置 — jest.config.ts
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterSetup: ['./jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 85,
      lines: 80,
      statements: 80,
    },
  },
};
```

```typescript
// Vitest 配置 — vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true, // 无需每个文件 import
    coverage: {
      provider: 'v8',
      thresholds: {
        branches: 75,
        functions: 85,
        lines: 80,
        statements: 80,
      },
    },
  },
});
```

---

## Mock 与 Stub 详解

Mock 和 Stub 都是测试替身（Test Double），但用途不同。

```mermaid
sequenceDiagram
    participant Test as 测试用例
    participant SUT as 被测系统
    participant Mock as Mock 对象
    participant Stub as Stub 对象
    participant Real as 真实依赖

    Test->>SUT: 调用被测函数
    SUT->>Mock: 验证是否被调用
    Mock-->>SUT: 返回预设值
    Note over Mock: 重点：验证交互行为

    Test->>SUT: 调用另一个函数
    SUT->>Stub: 请求数据
    Stub-->>SUT: 返回固定数据
    Note over Stub: 重点：提供固定返回值

    SUT-->>Test: 返回结果
    Test->>Test: 断言结果正确
```

### Mock 实战示例

```typescript
// 被测函数：fetchUser
export async function fetchUser(id: string): Promise<User> {
  const response = await api.get(`/users/${id}`);
  return response.data;
}

// Jest Mock
describe('fetchUser', () => {
  it('should return user data', async () => {
    const mockGet = jest.fn().mockResolvedValue({
      data: { id: '1', name: '张三' },
    });

    // 注入 mock
    (api as any).get = mockGet;

    const user = await fetchUser('1');

    expect(user).toEqual({ id: '1', name: '张三' });
    expect(mockGet).toHaveBeenCalledWith('/users/1');
  });
});

// Vitest Mock — API 完全一致
import { vi } from 'vitest';

describe('fetchUser', () => {
  it('should return user data', async () => {
    const mockGet = vi.fn().mockResolvedValue({
      data: { id: '1', name: '张三' },
    });

    (api as any).get = mockGet;

    const user = await fetchUser('1');

    expect(user).toEqual({ id: '1', name: '张三' });
    expect(mockGet).toHaveBeenCalledWith('/users/1');
  });
});
```

### Stub 实战示例

```typescript
// Stub：替换模块导出
jest.mock('@/services/api', () => ({
  getUser: jest.fn().mockReturnValue({ id: '1', name: '李四' }),
  updateUser: jest.fn().mockReturnValue(true),
}));

// Vitest 的模块 Mock
vi.mock('@/services/api', () => ({
  getUser: vi.fn().mockReturnValue({ id: '1', name: '李四' }),
  updateUser: vi.fn().mockReturnValue(true),
}));
```

### Spy 实战示例

```typescript
// Spy：监控函数调用但不改变行为
describe('Logger', () => {
  it('should log messages', () => {
    const spy = jest.spyOn(console, 'log');
    spy.mockImplementation(() => {}); // 静默输出

    Logger.info('test message');

    expect(spy).toHaveBeenCalledWith('test message');
    spy.mockRestore(); // 恢复原实现
  });
});
```

---

## 测试覆盖率

```mermaid
graph TB
    subgraph 覆盖率报告
        Line["行覆盖率<br/>Line Coverage"]
        Branch["分支覆盖率<br/>Branch Coverage"]
        Func["函数覆盖率<br/>Function Coverage"]
        Stmt["语句覆盖率<br/>Statement Coverage"]
    end

    Line --> |"哪些行被执行？"| Analysis["📊 分析未覆盖代码"]
    Branch --> |"if/else 都走到？"| Analysis
    Func --> |"哪些函数没调用？"| Analysis
    Stmt --> |"哪些语句没执行？"| Analysis

    Analysis --> Action["🎯 补充测试用例"]
    Action --> CI["🤖 CI 流水线卡门禁"]

    style Line fill:#48dbfb,stroke:#0abde3,color:#333
    style Branch fill:#feca57,stroke:#f39c12,color:#333
    style Func fill:#2ecc71,stroke:#27ae60,color:#fff
    style Stmt fill:#a29bfe,stroke:#6c5ce7,color:#fff
```

### 覆盖率配置

```json
// package.json
{
  "scripts": {
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch"
  },
  "nyc": {
    "check-coverage": true,
    "lines": 80,
    "functions": 85,
    "branches": 75,
    "statements": 80
  }
}
```

---

## TDD 流程：红-绿-重构

```mermaid
flowchart LR
    Red["🔴 RED<br/>写一个失败的测试"] --> Green["🟢 GREEN<br/>写最少代码让测试通过"]
    Green --> Refactor["🔵 REFACTOR<br/>重构代码保持测试通过"]
    Refactor --> Red

    style Red fill:#ff6b6b,stroke:#c0392b,color:#fff
    style Green fill:#2ecc71,stroke:#27ae60,color:#fff
    style Refactor fill:#48dbfb,stroke:#0abde3,color:#333
```

### TDD 实战：实现一个 `formatCurrency` 函数

```typescript
// Step 1: RED — 先写测试
describe('formatCurrency', () => {
  it('should format number with ¥ symbol', () => {
    expect(formatCurrency(1234.5)).toBe('¥1,234.50');
  });

  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('¥0.00');
  });

  it('should handle negative numbers', () => {
    expect(formatCurrency(-99.9)).toBe('-¥99.90');
  });
});

// Step 2: GREEN — 最少代码让测试通过
export function formatCurrency(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('zh-CN', {
    style: 'currency',
    currency: 'CNY',
  });
  return amount < 0 ? `-${formatted}` : formatted;
}

// Step 3: REFACTOR — 优化可读性（测试仍通过才继续）
```

---

## 测试组织最佳实践

```typescript
// ✅ 好的测试结构 — AAA 模式
describe('UserService', () => {
  describe('getUserById', () => {
    it('should return user when valid id is provided', async () => {
      // Arrange — 准备数据
      const userId = '123';
      const expectedUser = { id: '123', name: '张三' };
      mockApi.getUser.mockResolvedValue(expectedUser);

      // Act — 执行操作
      const result = await service.getUserById(userId);

      // Assert — 验证结果
      expect(result).toEqual(expectedUser);
      expect(mockApi.getUser).toHaveBeenCalledWith('123');
    });

    it('should throw error when user not found', async () => {
      // Arrange
      mockApi.getUser.mockRejectedValue(new Error('Not Found'));

      // Act & Assert
      await expect(service.getUserById('999')).rejects.toThrow('Not Found');
    });
  });
});
```

### 测试命名规范

| 模式 | 示例 |
|------|------|
| should + 动词 | `should return user when id is valid` |
| 给定...当...那么 | `given valid id, when called, then returns user` |
| 动词开头 | `returns user for valid id` |

---

## 面试高频问题

1. **Jest 和 Vitest 的区别是什么？新项目如何选择？**
2. **Mock、Stub、Spy 的区别是什么？各适用什么场景？**
3. **什么是 TDD？红-绿-重构具体怎么操作？**
4. **测试覆盖率 100% 有意义吗？如何正确看待覆盖率？**
5. **如何测试异步函数（Promise、async/await）？**
6. **如何测试抛出异常的函数？**
7. **beforeEach / beforeAll / afterEach / afterAll 的区别？**

---

## 参考资源

- [Jest 官方文档](https://jestjs.io/)
- [Vitest 官方文档](https://vitest.dev/)
- [Kent C. Dodds — Testing Implementation Details](https://kentcdodds.com/blog/testing-implementation-details)
- Martin Fowler — [Mocks Aren't Stubs](https://martinfowler.com/articles/mocksArentStubs.html)
