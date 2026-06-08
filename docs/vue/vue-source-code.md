---
sidebar_position: 12
title: Vue 源码解析
tags:
  - Vue
  - 源码
  - 原理
---

# Vue 源码解析

## 🟢 基础篇

### 1. Vue 3 源码的整体架构是什么？

**答：**

Vue 3 采用 **Monorepo** 结构，核心模块包括：

```
vue/
├── packages/
│   ├── reactivity/      # 响应式系统
│   ├── runtime-core/    # 运行时核心
│   ├── runtime-dom/     # DOM 运行时
│   ├── compiler-core/   # 编译器核心
│   ├── compiler-dom/    # DOM 编译器
│   ├── compiler-sfc/    # 单文件组件编译
│   ├── vue/             # 完整构建
│   └── shared/          # 共享工具
```

**核心流程：**
1. **编译阶段**：Template → AST → Render Function
2. **运行时阶段**：VNode → Patch → DOM

---

### 2. 响应式系统的核心原理是什么？

**答：**

Vue 3 使用 **Proxy** 实现响应式（Vue 2 使用 Object.defineProperty）：

```typescript
// packages/reactivity/src/reactive.ts
export function reactive(target: object) {
  return createReactiveObject(target, mutableHandlers, reactiveMap)
}

function createReactiveObject(
  target: Target,
  baseHandlers: ProxyHandler<any>,
  proxyMap: WeakMap<Target, any>
) {
  // 检查缓存
  const existingProxy = proxyMap.get(target)
  if (existingProxy) return existingProxy

  // 创建 Proxy
  const proxy = new Proxy(target, baseHandlers)
  proxyMap.set(target, proxy)
  return proxy
}
```

**依赖收集流程：**
1. `track()` - 收集依赖
2. `trigger()` - 触发更新
3. `effect()` - 副作用函数

---

### 3. Vue 3 的依赖收集是如何实现的？

**答：**

使用 **WeakMap + Map + Set** 三层数据结构：

```typescript
// 数据结构
type Dep = Set<ReactiveEffect>
type KeyToDepMap = Map<any, Dep>
type TargetMap = WeakMap<any, KeyToDepMap>

// 依赖收集
export function track(target: object, type: TrackOpTypes, key: unknown) {
  if (!activeEffect) return
  
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Dep()))
  }
  
  dep.add(activeEffect)
}

// 触发更新
export function trigger(target: object, type: TriggerOpTypes, key?: unknown) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  
  const dep = depsMap.get(key)
  if (dep) {
    dep.forEach(effect => {
      if (effect.scheduler) {
        effect.scheduler()
      } else {
        effect.run()
      }
    })
  }
}
```

---

## 🟡 进阶篇

### 4. Vue 3 的编译器优化有哪些？

**答：**

Vue 3 编译器引入了多项优化：

**1. 静态提升（Static Hoisting）**
```javascript
// 编译前
<div>Static</div>

// 编译后 - 静态节点只创建一次
const _hoisted_1 = createElementVNode("div", null, "Static")
```

**2. Patch Flags**
```javascript
// 标记动态内容类型
createElementVNode("div", {
  class: dynamicClass,
  id: dynamicId
}, null, CLASS | PROPS, ["id"])
```

**3. 事件缓存**
```javascript
// 内联事件缓存
const _cache = cache[0] || (cache[0] = [])
```

**4. Block Tree**
- 只追踪动态节点
- 跳过静态内容比较

---

### 5. 调度器（Scheduler）是如何工作的？

**答：**

Vue 3 使用 **微任务队列** 实现异步更新：

```typescript
// packages/runtime-core/src/scheduler.ts
const queue: SchedulerJob[] = []
let isFlushing = false
let currentFlushPromise: Promise<void> | null = null

export function queueJob(job: SchedulerJob) {
  // 去重
  if (!queue.includes(job)) {
    queue.push(job)
    queueFlush()
  }
}

function queueFlush() {
  if (!isFlushing) {
    isFlushing = true
    currentFlushPromise = resolvedPromise.then(flushJobs)
  }
}

function flushJobs() {
  // 1. 先执行前置任务（beforeMounted 等）
  // 2. 按 id 排序（父组件先于子组件）
  // 3. 执行任务队列
  // 4. 重置状态
}
```

---

### 6. Vue 3 的 Diff 算法相比 Vue 2 有什么改进？

**答：**

**Vue 2：双端比较**
- 头头、尾尾、头尾、尾头比较
- 最后使用 key 查找

**Vue 3：最长递增子序列**
1. 从头开始比较，跳过相同节点
2. 从尾部开始比较，跳过相同节点
3. 处理新增/删除节点
4. 使用 **最长递增子序列** 算法优化中间乱序部分

```typescript
// 核心逻辑
const increasingNewIndexSequence = getSequence(newIndexToOldIndexMap)
let j = increasingNewIndexSequence.length - 1

for (let i = toBePatched - 1; i >= 0; i--) {
  if (i !== increasingNewIndexSequence[j]) {
    // 需要移动
    move(newChildren[i], container, anchor)
  } else {
    j-- // 不需要移动
  }
}
```

---

## 🔴 高级篇

### 7. Vue 3 是如何实现组件渲染的？

**答：**

组件渲染的核心流程：

```typescript
// 1. 创建组件实例
function setupComponent(instance) {
  // 处理 props
  // 处理 slots
  // 调用 setup()
  setupStatefulComponent(instance)
}

// 2. 执行 setup
function setupStatefulComponent(instance) {
  const setupResult = setup()
  handleSetupResult(instance, setupResult)
}

// 3. 渲染
function renderComponentRoot(instance) {
  const { render, data } = instance
  // 调用 render 函数生成 VNode
  return render.call(data, ...)
}

// 4. Patch
function patch(n1, n2, container, anchor) {
  const { type } = n2
  if (typeof type === 'object') {
    processComponent(n1, n2, container, anchor)
  } else {
    processElement(n1, n2, container, anchor)
  }
}
```

---

### 8. EffectScope 的作用是什么？

**答：**

EffectScope 用于**统一管理响应式副作用**：

```typescript
// 创建作用域
const scope = effectScope()

scope.run(() => {
  // 在作用域内的 effect 会被统一管理
  const doubled = computed(() => count.value * 2)
  watchEffect(() => console.log(doubled.value))
})

// 暂停所有副作用
scope.pause()

// 恢复所有副作用
scope.resume()

// 停止所有副作用
scope.stop()
```

**应用场景：**
- 组件卸载时清理所有 effect
- 组合式函数的副作用管理
- 状态库（如 Pinia）的实现

---

## 🎯 高频面试题

### 9. Vue 3 为什么比 Vue 2 快？

**答：**

| 优化点 | Vue 2 | Vue 3 |
|--------|-------|-------|
| 响应式 | Object.defineProperty | Proxy（无需递归） |
| 编译 | 无优化 | 静态提升、Patch Flags |
| Diff | 双端比较 | 最长递增子序列 |
| Tree-shaking | 不支持 | 完全支持 |
| 体积 | ~20KB | ~10KB |

---

### 10. Vue 3 的 Fragment、Teleport、Suspense 是如何实现的？

**答：**

**Fragment：**
```typescript
// 类型标记
export const Fragment = Symbol('Fragment')

// 渲染时直接处理子节点
function processFragment(n1, n2, container) {
  mountChildren(n2.children, container)
}
```

**Teleport：**
```typescript
// 移动 DOM 到指定目标
function processTeleport(n1, n2, container) {
  const target = document.querySelector(n2.props.to)
  n2.children.forEach(child => {
    target.appendChild(child.el)
  })
}
```

**Suspense：**
```typescript
// 异步组件状态管理
function processSuspense(n1, n2, container) {
  const { fallback, default: content } = n2.children
  
  try {
    // 尝试渲染内容
    content()
  } catch (err) {
    if (err instanceof Promise) {
      // 显示 fallback
      render(fallback, container)
      err.then(() => {
        // Promise 完成后重新渲染
        render(content, container)
      })
    }
  }
}
```

---

## 💡 学习建议

1. **循序渐进**：先理解响应式 → 再看编译器 → 最后看运行时
2. **动手调试**：在 Vue 3 源码中打断点，跟踪执行流程
3. **画图理解**：数据结构和流程图能帮助理解
4. **对比学习**：与 Vue 2 对比，理解设计差异

---

## 📚 推荐资源

- [Vue 3 官方文档](https://vuejs.org/)
- [Vue 3 源码](https://github.com/vuejs/core)
- [Vue 3 技术揭秘](https://vue-js.com/)
- [Vue Mastery](https://www.vuemastery.com/)
