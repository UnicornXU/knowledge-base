---
sidebar_position: 0
title: 前端测试概述
description: 前端测试全景图 — 测试金字塔、策略选择、工具链与最佳实践
keywords: [前端测试, 测试金字塔, Jest, Vitest, Playwright, Testing Library]
---

# 前端测试概述

前端测试是保障应用质量的核心手段。本文从全局视角梳理前端测试体系，帮助你建立完整的测试认知框架。

---

## 为什么需要前端测试

| 维度 | 无测试 | 有测试 |
|------|--------|--------|
| 重构信心 | 提心吊胆，怕改坏 | 自信重构，秒级反馈 |
| Bug 发现时机 | 线上用户发现 | 开发阶段拦截 |
| 协作效率 | 手动回归，耗时耗力 | 自动化回归，快速验证 |
| 文档作用 | 代码即文档，但无人敢信 | 测试即活文档，行为可读 |
| 发布节奏 | 每次发布如履薄冰 | 持续交付，快速迭代 |

---

## 测试金字塔

测试金字塔是 Mike Cohn 在《Succeeding with Agile》中提出的经典模型，它描述了不同层级测试的数量比例和执行速度。

```mermaid
graph TB
    subgraph 测试金字塔
        E2E["🔺 E2E 测试<br/>少量 · 慢 · 高信心"]
        Integration["🔶 集成测试<br/>适量 · 中速 · 组件协作"]
        Unit["🟩 单元测试<br/>大量 · 快速 · 函数级别"]
    end

    E2E --> Integration --> Unit

    style E2E fill:#ff6b6b,stroke:#c0392b,color:#fff
    style Integration fill:#feca57,stroke:#f39c12,color:#333
    style Unit fill:#48dbfb,stroke:#0abde3,color:#333
```

### 各层级特征对比

```mermaid
graph LR
    subgraph 速度
        Fast["⚡ 单元测试<br/>毫秒级"]
        Medium["⏱️ 集成测试<br/>秒级"]
        Slow["🐢 E2E 测试<br/>分钟级"]
    end

    subgraph 成本
        LowCost["💰 低"]
        MedCost["💰💰 中"]
        HighCost["💰💰💰 高"]
    end

    subgraph 覆盖范围
        Narrow["🎯 函数/方法"]
        Mid["🎯 模块协作"]
        Broad["🎯 完整用户流程"]
    end

    Fast --> LowCost --> Narrow
    Medium --> MedCost --> Mid
    Slow --> HighCost --> Broad
```

---

## 测试策略选择流程

面对一个具体需求，如何决定写哪种测试？参考以下决策流程：

```mermaid
flowchart TD
    Start["🆕 新功能/新 Bug"] --> Q1{"涉及多个模块协作？"}
    Q1 -- 是 --> Q2{"涉及用户完整操作流程？"}
    Q1 -- 否 --> Unit["✅ 写单元测试"]

    Q2 -- 是 --> E2E["✅ 写 E2E 测试"]
    Q2 -- 否 --> Integration["✅ 写集成测试"]

    Unit --> Check1{"覆盖率达标？"}
    Integration --> Check2{"关键路径覆盖？"}
    E2E --> Check3{"核心流程覆盖？"}

    Check1 -- 否 --> AddMore["补充更多用例"]
    Check1 -- 是 --> Done["✅ 完成"]
    Check2 -- 否 --> AddMore
    Check2 -- 是 --> Done
    Check3 -- 否 --> AddMore
    Check3 -- 是 --> Done

    AddMore --> Start

    style Unit fill:#48dbfb,stroke:#0abde3,color:#333
    style Integration fill:#feca57,stroke:#f39c12,color:#333
    style E2E fill:#ff6b6b,stroke:#c0392b,color:#fff
    style Done fill:#2ecc71,stroke:#27ae60,color:#fff
```

---

## 前端测试工具链全景

```mermaid
graph TB
    subgraph 单元测试
        Jest["Jest<br/>Facebook 出品 · 零配置"]
        Vitest["Vitest<br/>Vite 原生 · 极速"]
        Mocha["Mocha<br/>灵活 · 需搭配断言库"]
    end

    subgraph 组件测试
        RTL["React Testing Library<br/>用户行为驱动"]
        VueTL["@vue/test-utils<br/>Vue 官方工具"]
        Enzyme["Enzyme<br/>已不推荐 · 内部实现耦合"]
    end

    subgraph E2E 测试
        Playwright["Playwright<br/>微软出品 · 多浏览器"]
        Cypress["Cypress<br/>开发者体验好 · 时序控制"]
        Puppeteer["Puppeteer<br/>Chrome 专用 · 轻量"]
    end

    subgraph 断言与匹配
        Chai["Chai"]
        expect["expect (Jest/Vitest 内置)"]
    end

    subgraph Mock
        MSW["MSW<br/>API Mock"]
        Sinon["Sinon.js<br/>Stub/Spy"]
        JestMock["Jest.fn() / vi.fn()"]
    end

    Jest --> expect
    Vitest --> expect
    Mocha --> Chai
    RTL --> Jest
    RTL --> Vitest

    style Jest fill:#9945a3,stroke:#7b2d8e,color:#fff
    style Vitest fill:#729b1b,stroke:#5a7c15,color:#fff
    style Playwright fill:#2ea44f,stroke:#1a7f37,color:#fff
    style Cypress fill:#1b1f22,stroke:#000,color:#fff
    style RTL fill:#e33332,stroke:#b71c1c,color:#fff
    style MSW fill:#ff6a33,stroke:#e65100,color:#fff
```

---

## 测试覆盖率指标

| 指标 | 含义 | 推荐阈值 |
|------|------|----------|
| **行覆盖率** (Line) | 有多少行被执行 | >= 80% |
| **分支覆盖率** (Branch) | if/else 是否都走到 | >= 75% |
| **函数覆盖率** (Function) | 有多少函数被调用 | >= 85% |
| **语句覆盖率** (Statement) | 有多少语句被执行 | >= 80% |

> **面试要点**：覆盖率高不等于测试质量高。100% 覆盖率但全是 `expect(true).toBe(true)` 毫无意义。关注 **有效断言** 和 **边界条件**。

---

## 子主题导航

| 文档 | 内容 | 关键词 |
|------|------|--------|
| [单元测试详解](./unit-testing.md) | Jest/Vitest 配置、Mock/Stub、覆盖率、TDD | Jest, Vitest, Mock, Coverage |
| [React 组件测试](./react-testing.md) | Testing Library 原理、渲染/事件/异步测试 | RTL, render, fireEvent, waitFor |
| [E2E 测试详解](./e2e-testing.md) | Playwright/Cypress 对比、选择器策略、CI 集成 | Playwright, Cypress, CI/CD |

---

## 面试高频问题

1. **什么是测试金字塔？各层级的比例如何分配？**
2. **单元测试、集成测试、E2E 测试的区别是什么？**
3. **如何选择合适的测试策略？**
4. **测试覆盖率 100% 是否意味着代码没有 Bug？**
5. **TDD 的流程是什么？红-绿-重构分别指什么？**

---

## 参考资源

- [Testing JavaScript — Kent C. Dodds](https://testingjavascript.com/)
- [Vitest 官方文档](https://vitest.dev/)
- [Playwright 官方文档](https://playwright.dev/)
- [React Testing Library 文档](https://testing-library.com/docs/react-testing-library/intro/)
- Martin Fowler — [Test Pyramid](https://martinfowler.com/bliki/TestPyramid.html)
