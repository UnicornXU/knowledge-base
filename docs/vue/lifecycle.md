---
sidebar_position: 8
title: "生命周期"
difficulty: "easy"
tags: ["vue", "lifecycle"]
---

# 生命周期

## Vue 3 生命周期流程

```
创建阶段
  ├── setup()                    ← 最先执行
  ├── beforeCreate（已被 setup 替代）
  └── created（已被 setup 替代）

挂载阶段
  ├── onBeforeMount              ← DOM 挂载前
  └── onMounted                  ← DOM 挂载完成，可访问 DOM

更新阶段
  ├── onBeforeUpdate             ← DOM 更新前
  └── onUpdated                  ← DOM 更新完成

卸载阶段
  ├── onBeforeUnmount            ← 卸载前
  └── onUnmounted                ← 卸载完成，清理副作用

keep-alive 缓存
  ├── onActivated                ← 缓存组件激活时
  └── onDeactivated              ← 缓存组件停用时

错误处理
  └── onErrorCaptured            ← 捕获后代组件错误
```

## Options API vs Composition API

```javascript
// Options API
export default {
  beforeCreate() {},    // → setup()
  created() {},         // → setup()
  beforeMount() {},     // → onBeforeMount()
  mounted() {},         // → onMounted()
  beforeUpdate() {},    // → onBeforeUpdate()
  updated() {},         // → onUpdated()
  beforeUnmount() {},   // → onBeforeUnmount()
  unmounted() {},       // → onUnmounted()
  activated() {},       // → onActivated()
  deactivated() {},     // → onDeactivated()
  errorCaptured() {},   // → onErrorCaptured()
};
```

```javascript
// Composition API
import {
  onBeforeMount, onMounted,
  onBeforeUpdate, onUpdated,
  onBeforeUnmount, onUnmounted,
  onActivated, onDeactivated,
  onErrorCaptured,
} from 'vue';

setup() {
  onBeforeMount(() => { /* ... */ });
  onMounted(() => { /* ... */ });
  onBeforeUpdate(() => { /* ... */ });
  onUpdated(() => { /* ... */ });
  onBeforeUnmount(() => { /* ... */ });
  onUnmounted(() => { /* ... */ });
}
```

## 常见使用场景

```typescript
// onMounted：访问 DOM、发起请求、初始化第三方库
onMounted(() => {
  // 访问 DOM
  const el = document.getElementById('chart');
  chart.init(el);

  // 发起请求
  fetchUser(route.params.id);

  // 第三方库初始化
  const editor = monaco.editor.create(container, { ... });
});

// onUnmounted：清理副作用
onUnmounted(() => {
  chart.dispose();
  editor.dispose();
  window.removeEventListener('resize', handleResize);
  timer && clearInterval(timer);
});

// onActivated / onDeactivated：keep-alive 场景
onActivated(() => {
  // 重新激活时刷新数据
  fetchData();
});

onDeactivated(() => {
  // 停用时保存滚动位置
  savedScrollTop.value = container.scrollTop;
});
```

## 执行顺序（父子组件）

```
挂载顺序：
  父 setup
  父 onBeforeMount
    子 setup
    子 onBeforeMount
    子 onMounted
  父 onMounted

更新顺序：
  父 onBeforeUpdate
    子 onBeforeUpdate
    子 onUpdated
  父 onUpdated

卸载顺序：
  父 onBeforeUnmount
    子 onBeforeUnmount
    子 onUnmounted
  父 onUnmounted
```

## setup() 的执行时机

```typescript
// setup 在 beforeCreate 之前执行
// 此时 this 为 undefined
export default {
  setup() {
    console.log('setup');           // 1️⃣ 最先
    // console.log(this);           // undefined
    return {};
  },
  beforeCreate() {
    console.log('beforeCreate');    // 2️⃣
  },
  created() {
    console.log('created');         // 3️⃣
  },
  mounted() {
    console.log('mounted');         // 4️⃣
  },
};
```

## onErrorCaptured 错误边界

```typescript
import { onErrorCaptured } from 'vue';

onErrorCaptured((err, instance, info) => {
  console.error('捕获到错误:', err);
  console.error('错误组件:', instance);
  console.error('错误信息:', info);

  // 返回 false 阻止错误继续向上传播
  return false;
});

// info 类型：
// 'setup function' - setup 中的错误
// 'render function' - 渲染函数中的错误
// 'watcher getter' - watcher 回调中的错误
// 'watcher callback' - watch 回调中的错误
// 'v-on handler' - 事件处理器中的错误
// 'lifecycle hook' - 生命周期钩子中的错误
```

## 关键点

- Vue 3 中 `setup()` 替代了 `beforeCreate` 和 `created`
- `onMounted` 中可以安全访问 DOM
- `onUnmounted` 用于清理定时器、事件监听等副作用
- 父子组件挂载：子组件先挂载完成，父组件后完成
- `onErrorCaptured` 可以实现 React ErrorBoundary 类似的功能
