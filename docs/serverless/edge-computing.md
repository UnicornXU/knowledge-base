---
sidebar_position: 1
title: 边缘计算与 Edge Runtime
---

# 边缘计算与 Edge Runtime

边缘计算将代码运行在离用户最近的全球节点上，而不是集中在某个区域的服务器。对于前端工程师来说，Edge Runtime 是最常接触的边缘计算形式——它让中间件、鉴权、A/B 测试等逻辑在全球 50+ 节点上以亚毫秒延迟执行。

## 📖 核心概念

### 什么是边缘计算？

```
传统架构 vs 边缘架构
═══════════════════════════════════════════════════════

传统架构：
  用户（北京）──→ 服务器（美国弗吉尼亚）──→ 返回响应
  延迟：200-300ms（跨太平洋网络传输）

边缘架构：
  用户（北京）──→ 边缘节点（北京/上海）──→ 返回响应
  延迟：5-20ms（本地节点处理）

边缘计算的本质：
  将计算从"中心"推向"边缘"，让代码在离用户最近的地方执行
```

### Edge Runtime vs Node.js

```
关键区别
═══════════════════════════════════════════════════════

Node.js Runtime：
  ├── 完整的 Node.js API（fs, net, child_process...）
  ├── npm 生态（几乎任何包都能用）
  ├── 执行时间长（可达 10s+）
  ├── 部署在少数区域（US / EU / Asia）
  └── 冷启动：100ms ~ 数秒

Edge Runtime：
  ├── Web 标准 API（fetch, Request, Response, URL...）
  ├── 有限的 npm 包（不支持 Node.js 原生模块）
  ├── 执行时间短（通常 < 30s）
  ├── 部署在全球 50+ 边缘节点
  └── 冷启动：< 5ms（V8 Isolates）
```

### V8 Isolates 原理

Edge Runtime 的核心是 **V8 Isolates**——与 Chrome 浏览器相同的 JavaScript 引擎的隔离实例：

```
V8 Isolates 工作原理
═══════════════════════════════════════════════════════

传统容器（Docker）：
  启动时间：100ms-1s（需要启动完整 OS + Node.js）
  内存开销：50-200MB 每个实例
  隔离级别：OS 级别

V8 Isolates：
  启动时间：< 5ms（共享 V8 引擎，只需创建隔离上下文）
  内存开销：几 KB 到几 MB
  隔离级别：JavaScript 上下文级别

为什么快？
  1. 共享 V8 引擎（不需要每次启动新的引擎）
  2. 极小的内存占用（不需要 OS 层）
  3. 预热快（JIT 编译缓存）
```

## 三大 Edge Runtime 平台对比

### Vercel Edge Functions

```ts
// app/api/hello/route.ts
export const runtime = 'edge'; // 声明使用 Edge Runtime

export async function GET(request: Request) {
  const geo = request.geo; // 获取用户地理位置
  const ip = request.ip;

  return new Response(
    JSON.stringify({
      message: `Hello from ${geo?.city || 'unknown'}!`,
      country: geo?.country,
      city: geo?.city,
      ip: ip,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
```

**Vercel Edge 特性**：

```ts
// 中间件 —— 在请求到达页面之前执行
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*'],
};

export function middleware(request: NextRequest) {
  // A/B 测试：根据地理位置分流
  const country = request.geo?.country || 'US';
  const bucket = hashCountry(country) % 2 === 0 ? 'A' : 'B';

  const response = NextResponse.next();
  response.cookies.set('ab-test', bucket, { maxAge: 86400 });

  // 鉴权：检查 token
  const token = request.cookies.get('auth-token')?.value;
  if (request.nextUrl.pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}
```

### Cloudflare Workers

```ts
// src/index.ts
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // 路由处理
    if (url.pathname === '/api/hello') {
      return new Response(
        JSON.stringify({ message: 'Hello from Cloudflare Workers!' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 地理位置信息
    const cf = request.cf;
    return new Response(
      JSON.stringify({
        country: cf?.country,
        city: cf?.city,
        colo: cf?.colo, // 数据中心代号
        latitude: cf?.latitude,
        longitude: cf?.longitude,
      })
    );
  },
};
```

### Deno Deploy

```ts
// main.ts
Deno.serve((req: Request) => {
  const url = new URL(req.url);

  if (url.pathname === '/api/time') {
    // Deno Deploy 自动部署到全球 35+ 区域
    return new Response(
      JSON.stringify({
        time: new Date().toISOString(),
        region: Deno.env.get('DENO_REGION') || 'unknown',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response('Hello from Deno Deploy!', {
    headers: { 'Content-Type': 'text/plain' },
  );
});
```

## 三大平台详细对比

| 特性 | Vercel Edge Functions | Cloudflare Workers | Deno Deploy |
|------|----------------------|-------------------|-------------|
| 运行时 | V8 Isolates | V8 Isolates | Deno (V8) |
| 全球节点数 | 20+ (AWS Lambda@Edge) | 300+ (Cloudflare CDN) | 35+ (GCP) |
| 冷启动 | < 5ms | < 5ms | < 10ms |
| 最大执行时间 | 30s | 30s (免费) / 15min (付费) | 10s (免费) / 60s (付费) |
| 内存限制 | 128MB | 128MB | 512MB |
| Web API 支持 | 完整 Web API | 完整 Web API | 完整 Web API + Deno API |
| npm 兼容性 | 部分（不支持 Node.js 原生模块） | 部分（需 node: 兼容层） | 部分（需 npm: 前缀） |
| 存储集成 | Vercel KV / Postgres / Blob | KV / D1 / R2 / Durable Objects | Deno KV / 外部服务 |
| 部署方式 | Git Push 自动部署 | Wrangler CLI | Git Push 自动部署 |
| 免费额度 | 100K 请求/月 | 100K 请求/天 | 100K 请求/月 |
| 定价 | $0.6/百万请求 | $0.30/百万请求 | $0.30/百万请求 |

## 边缘计算适用场景

### 适合边缘的场景

```ts
// 1. 地理路由 —— 根据用户位置返回不同内容
export const runtime = 'edge';

export default function handler(request: Request) {
  const country = request.geo?.country;

  const content = {
    CN: { lang: 'zh-CN', currency: 'CNY', message: '你好！' },
    US: { lang: 'en-US', currency: 'USD', message: 'Hello!' },
    JP: { lang: 'ja-JP', currency: 'JPY', message: 'こんにちは！' },
  };

  const data = content[country as keyof typeof content] || content['US'];
  return Response.json(data);
}
```

```ts
// 2. 请求头改写 —— 在边缘修改请求/响应头
export const runtime = 'edge';

export default function middleware(request: Request) {
  const response = NextResponse.next();

  // 安全头
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 根据路径设置缓存策略
  if (request.nextUrl.pathname.startsWith('/static')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  return response;
}
```

```ts
// 3. JWT 验证 —— 在边缘完成鉴权，无需回源
export const runtime = 'edge';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 在边缘验证 JWT（不需要回源到服务器）
  try {
    const payload = await verifyJWT(token, SECRET_KEY);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.sub);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
```

### 不适合边缘的场景

```
边缘计算的限制
═══════════════════════════════════════════════════════

❌ 不适合：
  • 需要 Node.js 原生模块（fs, net, child_process）
  • 长时间运行的任务（视频转码、大数据处理）
  • 需要与数据库保持长连接
  • 需要大量 npm 依赖（很多包不兼容）
  • 需要文件系统读写
  • WebSocket 长连接（部分平台支持，但有限制）

✅ 适合：
  • 请求/响应改写（头信息、URL 重写）
  • 鉴权与授权（JWT 验证、Session 检查）
  • A/B 测试与功能开关
  • 地理路由与内容本地化
  • API 代理与聚合
  • 边缘缓存与 CDN 控制
  • 轻量级 API 端点
```

## 边缘与传统服务器的架构选择

```
如何选择运行时？
═══════════════════════════════════════════════════════

                    需要完整 Node.js API？
                         │
                    ┌────┴────┐
                    Yes       No
                    │         │
              Node.js      需要长执行时间？
              Runtime          │
                         ┌─────┴─────┐
                         Yes         No
                         │           │
                   Serverless    需要全球低延迟？
                   Functions         │
                               ┌─────┴─────┐
                               Yes         No
                               │           │
                          Edge Runtime  Serverless
                          (Workers)     Functions
```

## 在 Next.js 中混合使用

```ts
// 默认 Node.js Runtime（App Router 默认）
// app/api/heavy/route.ts
export async function GET() {
  // 可以使用 Node.js API
  const data = await fs.readFile('./data.json', 'utf-8');
  return Response.json(JSON.parse(data));
}

// 明确使用 Edge Runtime
// app/api/light/route.ts
export const runtime = 'edge';

export async function GET(request: Request) {
  // 只能使用 Web API
  const geo = request.geo;
  return Response.json({ country: geo?.country });
}

// Middleware 总是运行在 Edge Runtime
// middleware.ts（无需声明 runtime）
export function middleware(request: NextRequest) {
  // 自动在全球边缘节点执行
  return NextResponse.next();
}
```

## 面试要点

### 常见面试问题

**Q1：Edge Runtime 和 Node.js Runtime 的核心区别是什么？**

> Edge Runtime 基于 V8 Isolates，只支持 Web 标准 API，没有 Node.js 原生模块（如 `fs`、`net`）。优势是冷启动极低（< 5ms）和全球分布；限制是执行时间短、依赖兼容性有限。

**Q2：什么是 V8 Isolates？为什么它比 Docker 容器快？**

> V8 Isolates 是 V8 引擎的轻量级隔离上下文。它共享底层 V8 引擎实例，不需要启动完整的操作系统，因此启动时间从 Docker 的 100ms-1s 降低到 < 5ms，内存开销也从 50-200MB 降低到几 KB。

**Q3：边缘计算的冷启动问题如何解决？**

> Edge Runtime 本身几乎不存在传统意义上的冷启动问题，因为 V8 Isolates 的启动时间 < 5ms。但如果边缘函数需要连接外部数据库或调用第三方 API，这些网络调用仍可能成为瓶颈。解决方案包括：使用边缘原生存储（如 Cloudflare KV）、连接池、预热策略。

**Q4：什么时候不应该使用 Edge Runtime？**

> 当需要 Node.js 原生模块（文件系统、网络）、长时间运行的任务、大量 npm 依赖、或 WebSocket 长连接时，应该使用传统 Node.js Runtime 而非 Edge Runtime。

**Q5：Vercel Edge Functions 和 Cloudflare Workers 如何选型？**

> Vercel Edge 与 Next.js 生态深度集成，适合 Vercel 部署的项目；Cloudflare Workers 节点更多（300+）、免费额度更高、定价更低，适合需要更多控制和更低延迟的场景。如果项目已部署在 Vercel，优先用 Vercel Edge；如果需要独立部署或更多边缘能力，选 Cloudflare Workers。
