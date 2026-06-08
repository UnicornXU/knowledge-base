---
sidebar_position: 10
title: "Vue 3 新特性"
difficulty: "medium"
tags: ["vue", "vue3", "features"]
---

# Vue 3 新特性

## Fragment（多根节点）

```vue
<!-- Vue 2：必须有单根节点 -->
<template>
  <div>
    <header>Header</header>
    <main>Content</main>
    <footer>Footer</footer>
  </div>
</template>

<!-- Vue 3：支持多根节点 -->
<template>
  <header>Header</header>
  <main>Content</main>
  <footer>Footer</footer>
</template>
```

## Teleport（传送门）

```vue
<!-- 将组件 DOM 渲染到指定位置 -->
<template>
  <button @click="showModal = true">打开弹窗</button>

  <Teleport to="body">
    <div v-if="showModal" class="modal-overlay">
      <div class="modal">
        <h2>弹窗内容</h2>
        <button @click="showModal = false">关闭</button>
      </div>
    </div>
  </Teleport>
</template>

<!-- 条件 Teleport -->
<Teleport to="body" :disabled="isMobile">
  <DropdownMenu />
</Teleport>
```

## Suspense（异步组件）

```vue
<script setup>
// 父组件
import AsyncChild from './AsyncChild.vue';
</script>

<template>
  <Suspense>
    <!-- 默认插槽：异步组件 -->
    <template #default>
      <AsyncChild />
    </template>

    <!-- fallback 插槽：加载状态 -->
    <template #fallback>
      <div class="loading">加载中...</div>
    </template>
  </Suspense>
</template>
```

```vue
<script setup>
// AsyncChild.vue
// setup 中可以直接使用 await
const data = await fetch('/api/data').then(r => r.json());
</script>
```

## v-model 变化

```vue
<!-- Vue 2 -->
<input v-model="text" />
<!-- 等价于 -->
<input :value="text" @input="text = $event.target.value" />

<!-- Vue 3 -->
<input v-model="text" />
<!-- 等价于 -->
<input :modelValue="text" @update:modelValue="text = $event" />

<!-- Vue 3 支持多个 v-model -->
<UserForm
  v-model:first-name="first"
  v-model:last-name="last"
  v-model:email="email"
/>
```

## defineModel（Vue 3.4+）

```vue
<script setup>
// 以前的写法
const props = defineProps({ modelValue: String });
const emit = defineEmits(['update:modelValue']);

// Vue 3.4+ 的新写法
const model = defineModel();

// 带修饰符
const [model, modifiers] = defineModel('text', {
  set: (v) => modifiers.trim ? v.trim() : v,
});
</script>

<template>
  <input v-model="model" />
</template>
```

## defineExpose

```vue
<!-- 子组件 -->
<script setup>
import { ref } from 'vue';

const count = ref(0);
const name = ref('Vue');

function increment() {
  count.value++;
}

// 暴露给父组件（默认不暴露）
defineExpose({ count, increment });
</script>
```

```vue
<!-- 父组件 -->
<script setup>
import { ref } from 'vue';
import Child from './Child.vue';

const childRef = ref(null);

function callChild() {
  childRef.value.increment();       // ✅
  console.log(childRef.value.count); // ✅
  // childRef.value.name             // ❌ 未暴露，无法访问
}
</script>
```

## defineOptions

```vue
<script setup>
// 在 script setup 中定义组件选项
defineOptions({
  name: 'MyComponent',
  inheritAttrs: false,
  customOptions: {
    /* ... */
  },
});

// 以前必须用两个 script 标签
</script>
```

## useAttrs / useSlots

```vue
<script setup>
import { useAttrs, useSlots } from 'vue';

const attrs = useAttrs(); // 非 prop 的属性
const slots = useSlots(); // 插槽

// 访问
console.log(attrs.class);
console.log(slots.default?.());
</script>
```

## Tree-shaking 支持

```typescript
// Vue 3 按需引入，未使用的 API 不会打包
import { ref, computed, onMounted } from 'vue';

// ❌ 不会打包
// watch, watchEffect, Transition 等未引入的 API

// Vue 2 中，即使不用也会打包整个 Vue
import Vue from 'vue'; // 包含所有 API
```

## 内置组件增强

```vue
<template>
  <!-- Transition 支持 CSS + JS 钩子 -->
  <Transition
    name="fade"
    mode="out-in"
    :duration="{ enter: 500, leave: 300 }"
    @before-enter="onBeforeEnter"
    @enter="onEnter"
    @leave="onLeave"
    @after-leave="onAfterLeave"
  >
    <component :is="currentComponent" />
  </Transition>

  <!-- TransitionGroup 支持 move 动画 -->
  <TransitionGroup name="list" tag="ul" move-class="list-move">
    <li v-for="item in items" :key="item.id">
      {{ item.name }}
    </li>
  </TransitionGroup>
</template>
```

## Vue 3 新特性对比

| 特性 | Vue 2 | Vue 3 |
|------|-------|-------|
| 根节点 | 必须单根 | 支持多根（Fragment） |
| 弹窗渲染 | 第三方库 | Teleport 内置 |
| 异步组件 | loading/error 选项 | Suspense 组件 |
| v-model | value/input | modelValue/update:modelValue |
| 多 v-model | 不支持 | 支持 |
| defineModel | 无 | 3.4+ 支持 |
| Tree-shaking | 不支持 | 完全支持 |
| setup 语法糖 | 无 | `<script setup>` |

## 关键点

- Fragment 解除了单根节点限制，但多根节点需要注意 attribute 继承
- Teleport 适合弹窗、Tooltip 等需要脱离 DOM 层级的场景
- Suspense 目前仍是实验性特性，生产环境谨慎使用
- `defineModel` 大幅简化了 v-model 组件的实现
- `defineExpose` 控制组件对外暴露的 API
