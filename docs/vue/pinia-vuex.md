---
sidebar_position: 5
title: "Pinia 状态管理"
difficulty: "medium"
tags: ["vue", "pinia", "vuex", "state"]
---

# Pinia 状态管理

## Pinia vs Vuex

| 特性 | Pinia | Vuex |
|------|-------|------|
| API 风格 | 去掉 mutations，只有 state/getters/actions | state/getters/mutations/actions |
| TypeScript | 完美支持，自动推导 | 需要手动声明类型 |
| 模块化 | 天然模块化，无需嵌套 | 需要 modules 嵌套 |
| 体积 | ~1KB | ~10KB |
| DevTools | 完全支持 | 完全支持 |
| Vue 版本 | Vue 2/3 | Vue 2/3 |

## 基础用法

```typescript
// stores/user.ts
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  // State
  state: () => ({
    name: '',
    token: '',
    role: 'user' as 'user' | 'admin',
  }),

  // Getters
  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.role === 'admin',
    displayName: (state) => state.name || '匿名用户',
  },

  // Actions
  actions: {
    async login(credentials: { username: string; password: string }) {
      const { token, user } = await api.login(credentials);
      this.token = token;
      this.name = user.name;
      this.role = user.role;
    },

    logout() {
      this.token = '';
      this.name = '';
      this.role = 'user';
    },
  },
});
```

## Composition API 风格（推荐）

```typescript
// stores/counter.ts
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

export const useCounterStore = defineStore('counter', () => {
  // State
  const count = ref(0);

  // Getters
  const double = computed(() => count.value * 2);
  const isEven = computed(() => count.value % 2 === 0);

  // Actions
  function increment() {
    count.value++;
  }

  function decrement() {
    count.value--;
  }

  async function fetchCount() {
    const res = await fetch('/api/count');
    count.value = (await res.json()).count;
  }

  // 必须返回所有需要暴露的状态和方法
  return { count, double, isEven, increment, decrement, fetchCount };
});
```

## 组件中使用

```vue
<script setup lang="ts">
import { useUserStore } from '@/stores/user';
import { storeToRefs } from 'pinia';

const userStore = useUserStore();

// ✅ 使用 storeToRefs 解构，保持响应式
const { name, isLoggedIn } = storeToRefs(userStore);

// ✅ actions 直接解构
const { login, logout } = userStore;

// ❌ 错误：直接解构会丢失响应式
// const { name, isLoggedIn } = userStore;
</script>

<template>
  <div v-if="isLoggedIn">
    <span>{{ name }}</span>
    <button @click="logout">退出</button>
  </div>
  <div v-else>
    <button @click="login({ username: 'admin', password: '123' })">
      登录
    </button>
  </div>
</template>
```

## 插件系统

```typescript
// plugins/logger.ts
import type { PiniaPluginContext } from 'pinia';

export function loggerPlugin({ store }: PiniaPluginContext) {
  store.$subscribe((mutation, state) => {
    console.log(`[${mutation.storeId}] ${mutation.type}`, state);
  });

  store.$onAction(({ name, args, after, onError }) => {
    console.log(`[${store.$id}] Action: ${name}`, args);
    after((result) => console.log(`[${store.$id}] Result:`, result));
    onError((error) => console.error(`[${store.$id}] Error:`, error));
  });
}

// main.ts
const pinia = createPinia();
pinia.use(loggerPlugin);
app.use(pinia);
```

## 持久化存储

```typescript
// plugins/persist.ts
import type { PiniaPluginContext } from 'pinia';

export function persistPlugin({ store, options }: PiniaPluginContext) {
  const key = `pinia-${store.$id}`;

  // 从 localStorage 恢复
  const saved = localStorage.getItem(key);
  if (saved) {
    store.$patch(JSON.parse(saved));
  }

  // 监听变化，保存到 localStorage
  store.$subscribe((_, state) => {
    localStorage.setItem(key, JSON.stringify(state));
  });
}

// 或使用 pinia-plugin-persistedstate
// npm install pinia-plugin-persistedstate
import piniaPersist from 'pinia-plugin-persistedstate';

pinia.use(piniaPersist);

// Store 中启用
export const useUserStore = defineStore('user', {
  state: () => ({ token: '' }),
  persist: true, // 一行搞定
});
```

## 关键点

- Pinia 是 Vue 官方推荐的状态管理方案（Vue 3 默认）
- 去掉了 Vuex 的 mutations，actions 直接修改 state
- `storeToRefs` 用于解构 store 并保持响应式
- Composition API 风格更灵活，TypeScript 推导更好
- 插件系统支持日志、持久化等扩展
