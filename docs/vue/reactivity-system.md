---
sidebar_position: 1
title: "响应式系统"
difficulty: "medium"
tags: ["vue", "reactivity"]
---

# 响应式系统

## Vue 2 vs Vue 3 响应式原理

### Vue 2：Object.defineProperty

```javascript
// 简化实现
function defineReactive(obj, key, val) {
  const dep = new Dep(); // 依赖收集器

  Object.defineProperty(obj, key, {
    get() {
      if (Dep.target) {
        dep.depend(); // 收集依赖
      }
      return val;
    },
    set(newVal) {
      if (newVal === val) return;
      val = newVal;
      dep.notify(); // 通知更新
    },
  });
}

// 缺点：
// 1. 无法检测新增/删除属性（需要 Vue.set/Vue.delete）
// 2. 无法检测数组索引修改和长度变化
// 3. 需要递归遍历所有属性，初始化性能差
```

### Vue 3：Proxy

```javascript
// 简化实现
function reactive(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      track(target, key); // 依赖收集
      const result = Reflect.get(target, key, receiver);
      if (typeof result === 'object' && result !== null) {
        return reactive(result); // 惰性递归
      }
      return result;
    },
    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver);
      trigger(target, key); // 触发更新
      return result;
    },
    deleteProperty(target, key) {
      const result = Reflect.deleteProperty(target, key);
      trigger(target, key);
      return result;
    },
  });
}

// 优势：
// 1. 支持新增/删除属性
// 2. 支持数组索引和长度变化
// 3. 惰性递归，性能更好
// 4. 支持 Map、Set 等集合类型
```

## 依赖收集机制

```
组件渲染 → 访问响应式数据 → track() 收集依赖
                ↓
数据变化 → trigger() → 调度器 → 组件重新渲染
```

## ref vs reactive

```typescript
import { ref, reactive, toRef, toRefs } from 'vue';

// ref：用于原始值
const count = ref(0);
console.log(count.value); // 需要 .value

// reactive：用于对象
const state = reactive({ count: 0 });
console.log(state.count); // 直接访问

// toRef：从 reactive 中提取单个属性为 ref
const countRef = toRef(state, 'count');

// toRefs：将 reactive 的所有属性转为 ref
const { count: c } = toRefs(state);
```

## 关键点

- Vue 2 用 `Object.defineProperty`，Vue 3 用 `Proxy`
- Vue 3 的 Proxy 是惰性递归，性能更优
- `ref` 包装原始值，`reactive` 包装对象
- 依赖收集发生在组件渲染时（getter 中）
- `watchEffect` 自动追踪依赖，`watch` 需要显式指定
