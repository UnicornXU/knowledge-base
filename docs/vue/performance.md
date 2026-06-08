---
sidebar_position: 9
title: "性能优化"
difficulty: "medium"
tags: ["vue", "performance"]
---

# 性能优化

## 1. 组件懒加载

```vue
<script setup>
import { defineAsyncComponent } from 'vue';

// 异步组件，按需加载
const HeavyChart = defineAsyncComponent(() =>
  import('./components/HeavyChart.vue')
);

// 带加载状态和错误处理
const AdminPanel = defineAsyncComponent({
  loader: () => import('./components/AdminPanel.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorDisplay,
  delay: 200,        // 延迟显示 loading（避免闪烁）
  timeout: 10000,    // 超时时间
});
</script>

<template>
  <Suspense>
    <template #default>
      <HeavyChart />
    </template>
    <template #fallback>
      <div>加载中...</div>
    </template>
  </Suspense>
</template>
```

## 2. v-once / v-memo

```vue
<template>
  <!-- v-once：只渲染一次，后续更新跳过 -->
  <header v-once>
    <h1>{{ title }}</h1>
    <p>{{ description }}</p>
  </header>

  <!-- v-memo：条件缓存，依赖变化才重新渲染 -->
  <div v-for="item in list" :key="item.id" v-memo="[item.selected]">
    <p>{{ item.name }}</p>
    <input type="checkbox" :checked="item.selected" />
    <!-- 只有 item.selected 变化时才重新渲染这个 div -->
  </div>
</template>
```

## 3. shallowRef / shallowReactive

```typescript
import { shallowRef, shallowReactive, triggerRef } from 'vue';

// shallowRef：只有 .value 变化才触发更新
const data = shallowRef({ list: [] });

// ❌ 不会触发更新
data.value.list.push(1);

// ✅ 替换整个 .value 才触发
data.value = { list: [...data.value.list, 1] };

// 或手动触发
data.value.list.push(1);
triggerRef(data);

// shallowReactive：只有第一层属性变化才触发
const state = shallowReactive({
  nested: { count: 0 },
  list: [],
});

// ❌ 不会触发
state.nested.count++;

// ✅ 会触发
state.list.push(1);
state.nested = { count: 1 };
```

## 4. 大列表优化

```vue
<script setup>
// 虚拟滚动：只渲染可见区域的元素
// 推荐库：@tanstack/vue-virtualizer / vue-virtual-scroller
import { useVirtualizer } from '@tanstack/vue-virtual';

const parentRef = ref(null);

const virtualizer = useVirtualizer({
  count: 10000,
  getScrollElement: () => parentRef.value,
  estimateSize: () => 50,
});
</script>

<template>
  <div ref="parentRef" style="height: 400px; overflow: auto;">
    <div :style="{ height: virtualizer.getTotalSize() + 'px' }">
      <div
        v-for="row in virtualizer.getVirtualItems()"
        :key="row.key"
        :style="{ position: 'absolute', top: row.start + 'px', height: row.size + 'px' }"
      >
        Item {{ row.index }}
      </div>
    </div>
  </div>
</template>
```

## 5. keep-alive 缓存

```vue
<template>
  <!-- 缓存组件实例，避免重复创建 -->
  <keep-alive :include="['TabA', 'TabB']" :max="10">
    <component :is="currentTab" />
  </keep-alive>
</template>

<!-- 路由级别缓存 -->
<template>
  <router-view v-slot="{ Component }">
    <keep-alive :include="cachedViews">
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>
```

## 6. computed 缓存 vs methods

```vue
<script setup>
import { computed } from 'vue';

// ✅ computed：有缓存，依赖不变则不重新计算
const sortedList = computed(() => {
  console.log('computed 执行');
  return [...list.value].sort((a, b) => a - b);
});

// ❌ methods：每次渲染都执行
function getSortedList() {
  console.log('method 执行');
  return [...list.value].sort((a, b) => a - b);
}

// 访问 3 次
// computed 只执行 1 次（有缓存）
// method 执行 3 次（无缓存）
</script>
```

## 7. 避免不必要的响应式

```typescript
import { markRaw, shallowRef } from 'vue';

// markRaw：标记为非响应式
const chart = markRaw(new Chart());
// chart 不会被 Proxy 包裹，性能更好

// 非响应式数据不需要 ref/reactive
const CONSTANT_LIST = ['a', 'b', 'c'];
// ❌ 不需要
const list = ref(CONSTANT_LIST);
// ✅ 直接使用
const list = CONSTANT_LIST;
```

## 性能优化清单

| 场景 | 优化方案 |
|------|---------|
| 首屏加载慢 | 路由懒加载 + 异步组件 |
| 长列表卡顿 | 虚拟滚动 |
| 表格数据多 | 分页 / 虚拟滚动 |
| 组件重复创建 | keep-alive 缓存 |
| 不必要的重渲染 | v-memo / computed / shallowRef |
| 大数据对象 | markRaw / shallowReactive |
| 静态内容 | v-once |

## 关键点

- `v-memo` 是 Vue 3.2+ 新增的指令，用于条件缓存
- `shallowRef` 只追踪 `.value` 的变化，适合大数据对象
- `markRaw` 跳过 Proxy 包裹，适合第三方库实例
- 虚拟滚动是解决长列表性能问题的标准方案
- keep-alive 的 `max` 属性限制缓存数量，防止内存泄漏
