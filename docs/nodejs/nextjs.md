---
sidebar_position: 2
title: Next.js 核心概念与面试题
---

# Next.js 核心概念与面试题

Next.js 是 React 生态中最主流的全栈框架，提供了 SSR、SSG、ISR、API Routes、App Router 等能力。深入理解 Next.js 的核心概念是高级前端工程师的必备技能。

## 🏗️ 架构概览

```
Next.js 应用架构
├── 路由层（App Router / Pages Router）
│   ├── 文件系统路由
│   ├── 布局嵌套
│   └── 并行路由 / 拦截路由
├── 渲染层
│   ├── Server Components（默认）
│   ├── Client Components（'use client'）
│   └── Streaming SSR
├── 数据层
│   ├── Server Actions
│   ├── Route Handlers
│   └── 数据获取策略
├── 缓存层
│   ├── Data Cache
│   ├── Full Route Cache
│   ├── Router Cache
│   └── Request Memoization
└── 部署层
    ├── Node.js Runtime
    ├── Edge Runtime
    └── 静态导出
```

## 📁 App Router vs Pages Router

### Pages Router（传统方式）

```
pages/
├── _app.tsx          # 全局 App 组件
├── _document.tsx     # 自定义 Document
├── index.tsx         # 首页 /
├── about.tsx         # 关于页 /about
├── posts/
│   ├── index.tsx     # 文章列表 /posts
│   └── [id].tsx      # 文章详情 /posts/:id
└── api/
    └── users.ts      # API 路由 /api/users
```

### App Router（推荐方式）

```
app/
├── layout.tsx        # 根布局（必需）
├── page.tsx          # 首页 /
├── loading.tsx       # 加载状态
├── error.tsx         # 错误边界
├── not-found.tsx     # 404 页面
├── about/
│   └── page.tsx      # 关于页 /about
├── posts/
│   ├── page.tsx      # 文章列表 /posts
│   └── [id]/
│       ├── page.tsx  # 文章详情 /posts/:id
│       └── loading.tsx
└── api/
    └── users/
        └── route.ts  # API 路由
```

### 核心差异对比

| 特性 | Pages Router | App Router |
|------|--------------|------------|
| 渲染模式 | 默认 CSR + getServerSideProps | 默认 RSC（服务端组件） |
| 布局 | 无原生支持 | 原生嵌套布局 |
| 流式渲染 | 不支持 | 支持 Suspense 流式 |
| 数据获取 | getServerSideProps / getStaticProps | async Server Components / fetch |
| 状态管理 | 客户端状态 | 服务端状态 + 客户端状态分离 |
| 缓存控制 | 精细度低 | 四层缓存体系 |

## ⚛️ React Server Components（RSC）

Server Components 是 Next.js App Router 的核心概念，组件默认在服务端执行。

```tsx
// app/dashboard/page.tsx — 默认是 Server Component
// ✅ 可以直接访问数据库、文件系统、环境变量
// ❌ 不能使用 useState、useEffect、事件处理
import { db } from '@/lib/db';

export default async function DashboardPage() {
  // 直接在组件中查询数据库
  const users = await db.user.findMany();
  const stats = await db.analytics.aggregate();

  return (
    <div>
      <h1>Dashboard</h1>
      <UserList users={users} />
      <StatsChart data={stats} />  {/* 可以嵌套 Client Component */}
    </div>
  );
}
```

```tsx
// components/StatsChart.tsx — 显式标记为 Client Component
'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis } from 'recharts';

export function StatsChart({ data }) {
  const [timeRange, setTimeRange] = useState('7d');

  return (
    <div>
      <select value={timeRange} onChange={e => setTimeRange(e.target.value)}>
        <option value="7d">近 7 天</option>
        <option value="30d">近 30 天</option>
      </select>
      <LineChart data={data}>
        <Line type="monotone" dataKey="value" />
      </LineChart>
    </div>
  );
}
```

### Server vs Client Component 对比

| 特性 | Server Component | Client Component |
|------|------------------|------------------|
| 执行环境 | 服务端 | 客户端 |
| 包大小 | 不计入 JS Bundle | 计入 JS Bundle |
| 数据获取 | async/await 直接调用 | useEffect / SWR / fetch |
| 状态管理 | 无状态 | useState / useReducer |
| 副作用 | 无 | useEffect |
| 浏览器 API | ❌ 不可用 | ✅ 可用 |
| 使用 `'use client'` | ❌ 不需要 | ✅ 必须声明 |

## 📡 数据获取策略

### 服务端数据获取

```tsx
// 1. 在 Server Component 中直接获取
export default async function ProductsPage() {
  // 默认缓存（类似 SSG）
  const products = await fetch('https://api.example.com/products').then(r => r.json());

  // 不缓存（类似 SSR）
  const realtime = await fetch('https://api.example.com/realtime', {
    cache: 'no-store',
  }).then(r => r.json());

  // 带重新验证（ISR）
  const featured = await fetch('https://api.example.com/featured', {
    next: { revalidate: 3600 }, // 每小时重新验证
  }).then(r => r.json());

  return <ProductGrid products={products} />;
}
```

### Server Actions（表单处理）

```tsx
// app/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  // 验证
  if (!title || title.length < 3) {
    return { error: '标题至少 3 个字符' };
  }

  // 数据库操作
  await db.post.create({ data: { title, content } });

  // 重新验证缓存
  revalidatePath('/posts');

  // 重定向
  redirect('/posts');
}

// app/posts/new/page.tsx
import { createPost } from '@/app/actions';

export default function NewPostPage() {
  return (
    <form action={createPost}>
      <input name="title" placeholder="标题" required />
      <textarea name="content" placeholder="内容" required />
      <button type="submit">发布</button>
    </form>
  );
}
```

## 💾 缓存体系（四层缓存）

```
请求流程中的四层缓存：

┌─────────────────────────────────────────────────┐
│ 第 1 层：Router Cache（客户端，内存）              │
│ 缓存 RSC Payload，页面导航时复用                   │
│ 路由切换时直接使用缓存，无需重新请求服务端          │
├─────────────────────────────────────────────────┤
│ 第 2 层：Full Route Cache（服务端，构建时）         │
│ 缓存整个路由的 RSC Payload 和渲染后的 HTML         │
│ 构建时生成，部署后静态分发                          │
├─────────────────────────────────────────────────┤
│ 第 3 层：Data Cache（服务端，持久化）               │
│ 缓存 fetch 请求的响应数据                          │
│ 跨请求、跨部署持久化，直到手动 revalidate           │
├─────────────────────────────────────────────────┤
│ 第 4 层：Request Memoization（服务端，单次请求）    │
│ 同一渲染过程中重复的 fetch 调用去重                  │
│ React 组件树中多个组件请求同一 URL 只发一次          │
└─────────────────────────────────────────────────┘
```

### 缓存控制 API

```tsx
// 1. fetch 级别缓存控制
fetch('https://api.example.com/data', {
  next: { revalidate: 3600 },        // ISR：每小时重新验证
  next: { tags: ['products'] },       // 按标签缓存
  cache: 'no-store',                  // SSR：不缓存
  cache: 'force-cache',              // SSG：强制缓存
});

// 2. 路由级别缓存控制
export const dynamic = 'force-static';   // 强制静态
export const dynamic = 'force-dynamic';  // 强制动态
export const revalidate = 3600;          // 路由级 ISR

// 3. 按需重新验证
import { revalidatePath, revalidateTag } from 'next/cache';

revalidatePath('/products');           // 重新验证特定路径
revalidateTag('products');             // 重新验证特定标签
```

## 🔀 高级路由功能

### 并行路由（Parallel Routes）

```
app/
├── layout.tsx
├── page.tsx
└── @analytics/      # 并行路由槽
    └── page.tsx
└── @notifications/  # 并行路由槽
    └── page.tsx
```

```tsx
// app/layout.tsx
export default function Layout({
  children,
  analytics,
  notifications,
}: {
  children: React.ReactNode;
  analytics: React.ReactNode;
  notifications: React.ReactNode;
}) {
  return (
    <div>
      <main>{children}</main>
      <aside>
        {analytics}
        {notifications}
      </aside>
    </div>
  );
}
```

### 拦截路由（Intercepting Routes）

```
app/
├── feed/
│   └── page.tsx          # Feed 列表页
├── @modal/
│   └── (..)photo/
│       └── [id]/
│           └── page.tsx  # 拦截 /photo/:id，显示为弹窗
└── photo/
    └── [id]/
        └── page.tsx      # 直接访问 /photo/:id，显示完整页面
```

## 🔑 面试高频问题

### 1. Next.js App Router 的渲染流程是什么？

```
构建时：
  1. 分析路由文件结构
  2. 预渲染静态路由（Static Rendering）
  3. 标记动态路由（Dynamic Rendering）
  4. 生成 RSC Payload
  5. 生成 HTML

运行时（动态路由）：
  1. 接收请求
  2. 匹配路由
  3. 执行 Server Components
  4. 获取数据（fetch / DB）
  5. 流式传输 RSC Payload
  6. 客户端 Hydrate
  7. 绑定事件，页面可交互
```

### 2. 为什么 Server Components 不能使用 Hooks？

Server Components 在服务端执行，没有浏览器环境和 React 的客户端运行时。Hooks（如 useState、useEffect）依赖于 React 的 Fiber 树和浏览器 DOM，这些在服务端不存在。

### 3. 如何优化 Next.js 应用的性能？

```tsx
// 1. 图片优化
import Image from 'next/image';
<Image src="/hero.jpg" width={800} height={600} priority />;

// 2. 字体优化
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });

// 3. 动态导入（懒加载）
import dynamic from 'next/dynamic';
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <p>加载中...</p>,
  ssr: false, // 仅客户端渲染
});

// 4. 使用 Suspense 流式渲染
import { Suspense } from 'react';

export default function Page() {
  return (
    <main>
      <h1>首页</h1>
      <Suspense fallback={<Skeleton />}>
        <SlowDataComponent />
      </Suspense>
    </main>
  );
}
```

### 4. middleware.ts 的作用和使用场景？

```ts
// middleware.ts（项目根目录）
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 鉴权检查
  const token = request.cookies.get('token');
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');

  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // 国际化重写
  const locale = request.cookies.get('locale')?.value || 'zh';
  return NextResponse.rewrite(
    new URL(`/${locale}${request.nextUrl.pathname}`, request.url)
  );
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*'],
};
```

### 5. Server Actions 和 API Routes 的区别？

| 特性 | Server Actions | API Routes |
|------|----------------|------------|
| 调用方式 | 直接在组件中调用 | HTTP 请求 |
| 类型安全 | ✅ 端到端类型推导 | ❌ 需手动定义类型 |
| 表单处理 | ✅ 原生支持 | ❌ 需自行处理 |
| 渐进增强 | ✅ 无 JS 也能工作 | ❌ 依赖 JS |
| 适用场景 | 表单提交、数据变更 | 第三方集成、Webhook |
