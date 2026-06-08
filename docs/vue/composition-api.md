---
sidebar_position: 2
title: "组合式 API"
difficulty: "medium"
tags: ["vue", "composition-api"]
---

# 组合式 API

## Options API vs Composition API

```javascript
// Options API：按选项组织代码
export default {
  data() {
    return { count: 0, name: '' };
  },
  computed: {
    double() { return this.count * 2; },
  },
  methods: {
    increment() { this.count++; },
  },
  mounted() {
    console.log('mounted');
  },
};

// Composition API：按逻辑功能组织代码
import { ref, computed, onMounted } from 'vue';

export default {
  setup() {
    const count = ref(0);
    const name = ref('');
    const double = computed(() => count.value * 2);
    const increment = () => count.value++;

    onMounted(() => {
      console.log('mounted');
    });

    return { count, double, increment };
  },
};
```

## 组合式函数（Composables）

```typescript
// useCounter.ts
import { ref, computed } from 'vue';

export function useCounter(initialValue = 0) {
  const count = ref(initialValue);
  const double = computed(() => count.value * 2);

  function increment() { count.value++; }
  function decrement() { count.value--; }
  function reset() { count.value = initialValue; }

  return { count, double, increment, decrement, reset };
}

// useFetch.ts
import { ref, watchEffect } from 'vue';

export function useFetch<T>(url: Ref<string> | string) {
  const data = ref<T | null>(null);
  const error = ref<Error | null>(null);
  const loading = ref(false);

  watchEffect(async () => {
    loading.value = true;
    try {
      const res = await fetch(typeof url === 'string' ? url : url.value);
      data.value = await res.json();
    } catch (e) {
      error.value = e as Error;
    } finally {
      loading.value = false;
    }
  });

  return { data, error, loading };
}
```

## Provide / Inject

```typescript
// 祖先组件
import { provide, ref } from 'vue';

export default {
  setup() {
    const theme = ref('dark');
    const toggleTheme = () => {
      theme.value = theme.value === 'dark' ? 'light' : 'dark';
    };

    provide('theme', { theme, toggleTheme });
  },
};

// 后代组件
import { inject } from 'vue';

export default {
  setup() {
    const { theme, toggleTheme } = inject('theme');
    return { theme, toggleTheme };
  },
};
```

## 生命周期钩子

```typescript
import {
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted,
} from 'vue';

// 与 Options API 对应关系：
// beforeMount   → onBeforeMount
// mounted       → onMounted
// beforeUpdate  → onBeforeUpdate
// updated       → onUpdated
// beforeDestroy → onBeforeUnmount
// destroyed     → onUnmounted
```

## 关键点

- Composition API 按逻辑关注点组织代码，Options API 按选项类型组织
- 组合式函数（Composables）是逻辑复用的核心方式
- `<script setup>` 语法糖让代码更简洁
- `provide`/`inject` 实现跨层级依赖注入
- Composition API 更适合 TypeScript 类型推导
