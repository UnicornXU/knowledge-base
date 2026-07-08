---
sidebar_position: 3
title: Nuxt.js 核心概念与面试题
---

# Nuxt.js 核心概念与面试题

Nuxt.js 是 Vue 生态中最成熟的全栈框架，提供了 SSR、SSG、自动导入、文件系统路由等能力。Nuxt 3 基于 Vue 3 + Vite 构建，是 Vue 全栈开发的首选方案。

## 🏗️ 架构概览

```
Nuxt 3 应用架构
├── 路由层
│   ├── 文件系统路由（pages/）
│   ├── 布局系统（layouts/）
│   ├── 中间件（middleware/）
│   └── 路由参数与嵌套路由
├── 渲染层
│   ├── 服务端渲染（SSR）
│   ├── 静态生成（SSG）
│   ├── 混合渲染（Hybrid）
│   └── 流式渲染
├── 数据层
│   ├── useFetch / useAsyncData
│   ├── useState（跨请求状态管理）
│   ├── Server Routes（服务端 API）
│   └── Nitro 引擎
├── 模块层
│   ├── 自动导入
│   ├── Nuxt Modules
│   └── 插件系统
└── 部署层
    ├── Node.js 服务
    ├── 静态托管
    ├── Edge 部署
    └── Serverless
```

## 📁 项目结构

```
my-nuxt-app/
├── app.vue              # 根组件
├── nuxt.config.ts       # 配置文件
├── pages/               # 页面（自动生成路由）
│   ├── index.vue        # 首页 /
│   ├── about.vue        # 关于页 /about
│   └── posts/
│       ├── index.vue    # 文章列表 /posts
│       └── [id].vue     # 文章详情 /posts/:id
├── layouts/             # 布局
│   ├── default.vue      # 默认布局
│   └── admin.vue        # 管理后台布局
├── components/          # 组件（自动导入）
│   ├── Header.vue
│   └── Footer.vue
├── composables/         # 组合式函数（自动导入）
│   └── useAuth.ts
├── middleware/           # 路由中间件
│   ├── auth.ts
│   └── guest.ts
├── server/              # 服务端
│   ├── api/             # API 路由
│   │   └── users.get.ts
│   ├── middleware/       # 服务端中间件
│   └── utils/           # 服务端工具函数
├── plugins/             # 插件
├── public/              # 静态资源
└── assets/              # 需要构建处理的资源
```

## 📡 数据获取

### useFetch（推荐）

```vue
<!-- pages/posts/[id].vue -->
<script setup lang="ts">
// 自动处理 SSR、客户端缓存、错误处理
const route = useRoute();

const { data: post, pending, error, refresh } = await useFetch(
  `/api/posts/${route.params.id}`,
  {
    // 缓存 key（自动基于 URL 生成）
    key: `post-${route.params.id}`,

    // 转换响应数据
    transform: (data) => ({
      ...data,
      createdAt: new Date(data.createdAt).toLocaleDateString('zh-CN'),
    }),

    // 服务端和客户端都获取
    // lazy: true 表示客户端不阻塞渲染
    lazy: false,

    // 监听参数变化自动重新获取
    watch: [() => route.params.id],
  }
);
</script>

<template>
  <div v-if="pending">加载中...</div>
  <div v-else-if="error">错误：{{ error.message }}</div>
  <article v-else>
    <h1>{{ post.title }}</h1>
    <p>{{ post.content }}</p>
  </article>
</template>
```

### useAsyncData（更灵活）

```vue
<script setup lang="ts">
// 当需要更复杂的数据获取逻辑时使用
const { data: dashboard } = await useAsyncData(
  'dashboard',
  async () => {
    // 可以并行获取多个数据源
    const [posts, stats, user] = await Promise.all([
      $fetch('/api/posts'),
      $fetch('/api/stats'),
      $fetch('/api/user'),
    ]);

    return { posts, stats, user };
  },
  {
    // 自定义缓存策略
    getCachedData: (key, nuxtApp) => {
      return nuxtApp.payload.data[key] || null;
    },
  }
);
</script>
```

### 组合式函数封装

```ts
// composables/useAuth.ts
export const useAuth = () => {
  const user = useState<User | null>('auth-user', () => null);
  const token = useCookie('auth-token');

  const login = async (credentials: LoginCredentials) => {
    const { data, error } = await useFetch('/api/auth/login', {
      method: 'POST',
      body: credentials,
    });

    if (data.value) {
      user.value = data.value.user;
      token.value = data.value.token;
      navigateTo('/dashboard');
    }

    return { data, error };
  };

  const logout = async () => {
    await $fetch('/api/auth/logout', { method: 'POST' });
    user.value = null;
    token.value = null;
    navigateTo('/login');
  };

  const fetchUser = async () => {
    if (token.value && !user.value) {
      const { data } = await useFetch('/api/auth/me');
      user.value = data.value;
    }
  };

  return { user, login, logout, fetchUser };
};
```

## 🔀 路由与中间件

### 路由中间件

```ts
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const { user } = useAuth();

  if (!user.value) {
    return navigateTo('/login', {
      redirectCode: 302,
    });
  }
});

// middleware/guest.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const { user } = useAuth();

  if (user.value) {
    return navigateTo('/dashboard');
  }
});

// pages/dashboard.vue 中使用
definePageMeta({
  middleware: ['auth'],
  layout: 'admin',
});
```

### 服务端中间件

```ts
// server/middleware/auth.ts
export default defineEventHandler((event) => {
  const token = getCookie(event, 'auth-token') ||
                getHeader(event, 'Authorization')?.replace('Bearer ', '');

  if (token) {
    // 验证 token 并注入用户信息到上下文
    const user = verifyToken(token);
    event.context.user = user;
  }
});

// server/api/me.get.ts
export default defineEventHandler((event) => {
  const user = event.context.user;

  if (!user) {
    throw createError({
      statusCode: 401,
      message: '未登录',
    });
  }

  return user;
});
```

## 🖥️ Server Routes（Nitro 引擎）

```ts
// server/api/posts.get.ts — GET /api/posts
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;

  const posts = await db.post.findMany({
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  return { posts, page, limit };
});

// server/api/posts.post.ts — POST /api/posts
export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // 验证
  if (!body.title || body.title.length < 3) {
    throw createError({
      statusCode: 400,
      message: '标题至少 3 个字符',
    });
  }

  const post = await db.post.create({ data: body });
  return post;
});

// server/api/posts/[id].put.ts — PUT /api/posts/:id
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);

  const post = await db.post.update({
    where: { id },
    data: body,
  });

  return post;
});
```

## 🎛️ 配置与优化

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  // 渲染模式
  ssr: true,

  // 路由规则（混合渲染）
  routeRules: {
    '/': { prerender: true },           // SSG
    '/blog/**': { isr: 3600 },          // ISR 每小时
    '/admin/**': { ssr: false },        // 纯客户端
    '/api/**': { cors: true },          // API 跨域
  },

  // 自动导入
  imports: {
    dirs: ['composables/**'],
  },

  // 模块
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt',
  ],

  // 运行时配置
  runtimeConfig: {
    // 仅服务端可用
    apiSecret: process.env.API_SECRET,

    // 客户端也可用
    public: {
      apiBase: process.env.API_BASE || '/api',
    },
  },
});
```

## 🔑 面试高频问题

### 1. Nuxt 3 和 Nuxt 2 的核心区别？

| 特性 | Nuxt 2 | Nuxt 3 |
|------|--------|--------|
| Vue 版本 | Vue 2 | Vue 3 |
| 构建工具 | Webpack | Vite |
| API 风格 | Options API | Composition API |
| 服务端引擎 | 自研 | Nitro（跨平台） |
| 状态管理 | Vuex | useState / Pinia |
| 数据获取 | asyncData / fetch | useFetch / useAsyncData |
| TypeScript | 可选 | 原生支持 |
| 包大小 | 较大 | Tree-shaking 优化 |

### 2. useFetch 和 $fetch 的区别？

```ts
// useFetch — 组合式函数，自动处理 SSR
const { data, pending, error } = await useFetch('/api/posts');
// ✅ SSR 时数据会在服务端获取并序列化到 HTML
// ✅ 客户端 hydration 时自动恢复
// ✅ 内置缓存、错误处理、pending 状态

// $fetch — 直接的 HTTP 调用
const posts = await $fetch('/api/posts');
// ❌ 如果在 setup 中直接调用，SSR 时不会自动处理
// ❌ 客户端 hydration 后才会执行
// ✅ 适合在事件处理函数中使用（点击、提交等）
```

### 3. Nuxt 的自动导入机制是什么？

Nuxt 3 会自动导入以下内容，无需手动 import：

```ts
// Vue API（自动导入）
const count = ref(0);           // 无需 import { ref } from 'vue'
const doubled = computed(() => count.value * 2);

// Nuxt API（自动导入）
const route = useRoute();
const router = useRouter();
const { data } = await useFetch('/api/data');

// composables/ 目录下的自定义函数（自动导入）
// composables/useAuth.ts → 自动可用
const { user, login } = useAuth();

// components/ 目录下的组件（自动导入）
// components/Header.vue → <Header /> 直接使用
```

### 4. useState 和 Pinia 的区别？

```ts
// useState — 轻量级状态管理，跨请求安全
const counter = useState('counter', () => 0);
// ✅ SSR 时自动序列化到客户端
// ✅ 跨组件共享
// ❌ 不支持复杂的 actions / getters

// Pinia — 完整的状态管理方案
// stores/counter.ts
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0);
  const doubleCount = computed(() => count.value * 2);
  const increment = () => count.value++;

  return { count, doubleCount, increment };
});
// ✅ 支持 devtools
// ✅ 支持插件、持久化
// ✅ 复杂状态逻辑
```

### 5. Nuxt 的混合渲染（Hybrid Rendering）是什么？

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    // 不同路由使用不同的渲染策略
    '/': { prerender: true },              // SSG
    '/blog/**': { isr: 3600 },             // ISR
    '/dashboard/**': { ssr: false },       // CSR
    '/api/**': { cors: true },             // API 路由
    '/old-page': { redirect: '/new-page' }, // 重定向
  },
});
```

混合渲染允许在同一应用中为不同路由配置不同的渲染策略，实现最优的性能和用户体验。
