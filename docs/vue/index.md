---
sidebar_position: 1
title: Vue
slug: /vue
---

# Vue

Vue 是国内最流行的前端框架，深入理解其响应式原理和架构设计是面试高频考点。

## 📚 内容导航

| 文档 | 难度 | 说明 |
|------|------|------|
| [响应式系统](./reactivity-system.md) | 🟡 中 | Proxy、依赖收集、watchEffect |
| [组合式 API](./composition-api.md) | 🟢 初 | setup、ref、computed、生命周期 |
| [虚拟 DOM](./virtual-dom.md) | 🟡 中 | diff 算法、patch、最长递增子序列 |
| [组件通信](./component-communication.md) | 🟢 初 | props/emit、provide/inject、事件总线 |
| [Vue Router](./vue-router.md) | 🟡 中 | 路由模式、导航守卫、动态路由 |
| [Pinia 与 Vuex](./pinia-vuex.md) | 🟡 中 | 状态管理对比、Pinia 最佳实践 |
| [编译优化](./compiler-optimization.md) | 🔴 高 | 静态提升、PatchFlag、Block Tree |
| [生命周期](./lifecycle.md) | 🟢 初 | 选项式 vs 组合式、执行时机 |
| [性能优化](./performance.md) | 🟡 中 | 组件懒加载、虚拟滚动、shallowRef |
| [Vue 3 新特性](./vue3-features.md) | 🟡 中 | Teleport、Suspense、`<script setup>` |
| [源码解析](./vue-source-code.md) | 🔴 高 | 响应式、编译器、渲染器源码 |

## 🎯 学习路线

```
组合式 API → 响应式系统 → 虚拟 DOM → 编译优化 → 源码解析
  (入门)      (核心)       (进阶)     (深入)     (高级)
    ↓
组件通信 → 生命周期 → Vue Router → Pinia
 (基础)    (基础)     (实用)      (实用)
```

## 面试考察重点

- **响应式原理**：Vue 2 vs Vue 3 的实现差异、`reactive` vs `ref`
- **虚拟 DOM**：diff 算法、最长递增子序列优化
- **编译优化**：PatchFlag、Block Tree、静态提升
- **组合式 API**：`setup` 的执行时机、`<script setup>` 编译结果
- **源码**：effect 的依赖收集、trigger 的调度策略

import DocCardList from '@theme/DocCardList';

<DocCardList />
