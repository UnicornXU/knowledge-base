---
sidebar_position: 1
title: React
slug: /react
---

# React

React 是最流行的前端框架之一，深入理解其原理是高级前端工程师的必备技能。

## 📚 内容导航

| 文档 | 难度 | 说明 |
|------|------|------|
| [Hooks 深入](./hooks-deep.md) | 🟡 中 | useState、useEffect、自定义 Hook |
| [Fiber 架构](./fiber-architecture.md) | 🔴 高 | 调度算法、时间切片、优先级 |
| [状态管理](./state-management.md) | 🟡 中 | Context、Redux、Zustand 对比 |
| [性能优化](./performance.md) | 🟡 中 | memo、useMemo、useCallback |
| [源码解析](./react-source-code.md) | 🔴 高 | createElement、reconciler、scheduler |

## 🎯 学习路线

```
Hooks 深入 → 状态管理 → 性能优化 → Fiber 架构 → 源码解析
  (基础)      (核心)     (进阶)      (深入)      (高级)
```

## 面试考察重点

- **Hooks**：闭包陷阱、依赖数组、自定义 Hook 设计
- **Fiber**：为什么需要 Fiber、时间切片原理、双缓冲树
- **渲染机制**：setState 的批量更新、并发模式
- **性能优化**：React.memo vs useMemo、虚拟列表实现
- **源码**：reconciler 的 diff 算法、scheduleHostCallback

import DocCardList from '@theme/DocCardList';

<DocCardList />
