---
sidebar_position: 2
title: Serverless 前端应用模式
---

# Serverless 前端应用模式

Serverless 不仅仅是"把函数部署到云端"，它改变了前端应用的架构模式。从前端直接调用第三方 API，到 BFF 层聚合、事件驱动、流式响应，Serverless 为前端工程师提供了一整套全新的架构工具。

## 📖 核心模式

### BFF（Backend For Frontend）模式

```
BFF 模式的核心思想
═══════════════════════════════════════════════════════

传统模式：
  前端 ──→ 多个后端微服务 API
  问题：前端需要调用多个 API、处理数据聚合、处理鉴权

BFF 模式：
  前端 ──→ BFF 层 ──→ 多个后端微服务 API
  BFF 负责：接口聚合、数据裁剪、鉴权、缓存

Serverless BFF 的优势：
  • 无需维护服务器 —— 函数即服务
  • 独立部署 —— BFF 和前端可以独立发布
  • 按需扩展 —— 自动处理流量高峰
  • 成本低 —— 没有请求就没有费用
```

```ts
// app/api/dashboard/route.ts —— Serverless BFF 示例
export const runtime = 'edge';

export async function GET(request: Request) {
  const token = request.headers.get('Authorization');

  // 并行调用多个后端服务
  const [user, orders, notifications] = await Promise.all([
    fetch('https://api.example.com/user', {
      headers: { Authorization: token! },
    }).then(r => r.json()),

    fetch('https://api.example.com/orders?limit=5', {
      headers: { Authorization: token! },
    }).then(r => r.json()),

    fetch('https://api.example.com/notifications?unread=true', {
      headers: { Authorization: token! },
    }).then(r => r.json()),
  ]);

  // 聚合 & 裁剪数据 —— 只返回前端需要的字段
  return Response.json({
    user: {
      name: user.name,
      avatar: user.avatar,
      plan: user.plan,
    },
    recentOrders: orders.items.map((o: any) => ({
      id: o.id,
      title: o.product.name,
      amount: o.total,
      status: o.status,
    })),
    unreadCount: notifications.total,
  });
}
```

### API Gateway 模式

```
API Gateway 架构
═══════════════════════════════════════════════════════

                    ┌─────────────────┐
                    │   API Gateway   │
                    │  (Edge Function)│
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
        ┌─────┴─────┐ ┌─────┴─────┐ ┌─────┴─────┐
        │  Auth     │ │  User API │ │ Order API │
        │  Service  │ │           │ │           │
        └───────────┘ └───────────┘ └───────────┘

Gateway 职责：
  • 统一入口 —— 前端只需调用一个域名
  • 鉴权验证 —— 在边缘完成 JWT 验证
  • 请求路由 —— 根据路径分发到不同服务
  • 限流熔断 —— 防止后端服务过载
  • 响应缓存 —— 缓存频繁请求的数据
```

```ts
// app/api/gateway/[...path]/route.ts
export const runtime = 'edge';

const SERVICES: Record<string, string> = {
  users: 'https://user-service.internal',
  orders: 'https://order-service.internal',
  products: 'https://product-service.internal',
};

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  const [service, ...rest] = params.path;
  const target = SERVICES[service];

  if (!target) {
    return Response.json({ error: 'Unknown service' }, { status: 404 });
  }

  // 鉴权
  const token = request.headers.get('Authorization');
  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 转发请求
  const url = new URL(request.url);
  const targetUrl = `${target}/${rest.join('/')}${url.search}`;

  const response = await fetch(targetUrl, {
    method: request.method,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  });

  // 透传响应
  const data = await response.json();
  return Response.json(data, { status: response.status });
}
```

### 事件驱动模式

```
事件驱动架构
═══════════════════════════════════════════════════════

传统同步模式：
  用户注册 → 发邮件 → 创建配置 → 返回响应
  问题：发邮件和创建配置阻塞了响应

事件驱动模式：
  用户注册 → 发布事件 → 立即返回响应
                │
                ├──→ 异步：发送欢迎邮件
                ├──→ 异步：创建默认配置
                └──→ 异步：记录分析数据

优势：
  • 响应更快 —— 不等待副作用完成
  • 解耦 —— 注册逻辑不关心"注册后做什么"
  • 可扩展 —— 新增副作用只需订阅事件
```

```ts
// 事件发布（用户注册 API）
// app/api/register/route.ts
export async function POST(request: Request) {
  const { email, password } = await request.json();

  // 创建用户
  const user = await db.user.create({ data: { email, password } });

  // 发布事件（不等待处理完成）
  await fetch('https://events.example.com/publish', {
    method: 'POST',
    body: JSON.stringify({
      type: 'user.registered',
      data: { userId: user.id, email: user.email },
      timestamp: Date.now(),
    }),
  });

  return Response.json({ success: true, userId: user.id });
}

// 事件处理函数 1：发送欢迎邮件
// functions/welcome-email.ts
export async function handler(event: UserRegisteredEvent) {
  await sendEmail({
    to: event.data.email,
    subject: '欢迎注册！',
    template: 'welcome',
    data: { userId: event.data.userId },
  });
}

// 事件处理函数 2：创建默认配置
// functions/default-settings.ts
export async function handler(event: UserRegisteredEvent) {
  await db.settings.create({
    data: {
      userId: event.data.userId,
      theme: 'light',
      language: 'zh-CN',
      notifications: true,
    },
  });
}
```

## 冷启动优化

```
冷启动问题
═══════════════════════════════════════════════════════

什么是冷启动？
  Serverless 函数首次调用（或长时间未调用后）需要：
  1. 分配计算资源
  2. 下载代码
  3. 启动运行时（Node.js / Python）
  4. 初始化依赖
  这个过程可能需要 100ms ~ 数秒

冷启动时间线：
  请求到达 → [分配资源 50ms] → [下载代码 30ms] → [启动运行时 200ms]
             → [初始化依赖 100ms] → [执行函数 50ms] → 返回响应
  总耗时：~430ms（冷启动）vs ~50ms（热启动）
```

### 优化策略

```ts
// 策略 1：减少依赖体积
// ❌ 错误：导入整个 lodash
import _ from 'lodash';
_.get(obj, 'a.b.c');

// ✅ 正确：按需导入
import get from 'lodash/get';
get(obj, 'a.b.c');

// ✅ 更好：用原生可选链
obj?.a?.b?.c;
```

```ts
// 策略 2：延迟初始化 —— 在函数外部声明，函数内部使用
// ❌ 错误：每次调用都初始化
export async function handler(request: Request) {
  const db = new DatabaseClient({ /* config */ }); // 每次都初始化
  const result = await db.query('SELECT ...');
  return Response.json(result);
}

// ✅ 正确：模块级别初始化（复用热实例）
let db: DatabaseClient;

function getDb() {
  if (!db) {
    db = new DatabaseClient({ /* config */ });
  }
  return db;
}

export async function handler(request: Request) {
  const result = await getDb().query('SELECT ...');
  return Response.json(result);
}
```

```ts
// 策略 3：选择轻量运行时
// Edge Runtime（V8 Isolates）冷启动 < 5ms
export const runtime = 'edge';

export async function handler(request: Request) {
  // 轻量逻辑放在 Edge
  const token = request.headers.get('Authorization');
  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 重逻辑回源到 Serverless Function
  const data = await fetch('https://api.example.com/data', {
    headers: { Authorization: token },
  });

  return Response.json(await data.json());
}
```

```ts
// 策略 4：预热请求（Keep Warm）
// 定时发送请求保持函数热状态
// 可以用 cron job 或第三方服务（如 Upstash QStash）

// vercel.json
{
  "crons": [
    {
      "path": "/api/keep-warm",
      "schedule": "*/5 * * * *"
    }
  ]
}

// app/api/keep-warm/route.ts
export async function GET() {
  // 预热关键函数
  await Promise.all([
    fetch('https://your-app.com/api/dashboard'),
    fetch('https://your-app.com/api/user'),
  ]);

  return Response.json({ warmed: true, timestamp: Date.now() });
}
```

## 流式响应（Streaming）

```ts
// 流式响应 —— 边逐步返回数据，不必等全部准备好
// app/api/stream/route.ts
export const runtime = 'edge';

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // 分批返回数据
      for (let i = 0; i < 10; i++) {
        const chunk = JSON.stringify({ batch: i, data: generateData(i) });
        controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
        await sleep(100); // 模拟处理时间
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

// 前端消费流式响应
async function consumeStream() {
  const response = await fetch('/api/stream');
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value);
    const lines = text.split('\n').filter(line => line.startsWith('data: '));

    for (const line of lines) {
      const data = JSON.parse(line.slice(6));
      console.log('Received batch:', data.batch);
      // 更新 UI
    }
  }
}
```

## Serverless 完整架构示例

```
典型的 Serverless 前端应用架构
═══════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────┐
│                    CDN / Edge                        │
│  ┌───────────────────────────────────────────────┐  │
│  │  Edge Middleware (鉴权、A/B 测试、地理路由)     │  │
│  └───────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
    ┌─────┴─────┐  ┌─────┴─────┐  ┌─────┴─────┐
    │ 静态页面  │  │ SSR 页面   │  │ API 路由   │
    │ (CDN 缓存)│  │ (Edge/Node)│  │ (Serverless)│
    └───────────┘  └───────────┘  └─────┬─────┘
                                        │
                              ┌─────────┼─────────┐
                              │         │         │
                        ┌─────┴───┐ ┌───┴───┐ ┌───┴───┐
                        │ Database│ │ Cache │ │ Queue │
                        │(PlanetScale)│(Redis)│(SQS)  │
                        └─────────┘ └───────┘ └───────┘
```

## 面试要点

### 常见面试问题

**Q1：什么是 BFF 模式？Serverless BFF 有什么优势？**

> BFF（Backend For Frontend）是为前端专门设计的后端层，负责接口聚合、数据裁剪和鉴权。Serverless BFF 的优势在于：无需管理服务器、独立部署、自动弹性伸缩、按使用量计费。前端工程师可以直接编写和部署 BFF 函数，无需后端团队配合。

**Q2：如何优化 Serverless 函数的冷启动？**

> 四种核心策略：(1) 减少依赖体积，按需导入；(2) 延迟初始化，在模块级别复用连接和客户端实例；(3) 使用 Edge Runtime 替代 Node.js Runtime（冷启动 < 5ms）；(4) 预热请求，通过定时 ping 保持函数热状态。

**Q3：事件驱动架构相比同步调用有什么优势？**

> 事件驱动将主流程和副作用解耦：用户注册后立即返回响应，发送邮件、创建配置等操作异步执行。优势是响应更快、系统解耦、易于扩展新功能（只需新增事件订阅者）。但需要处理事件丢失、幂等性、顺序保证等问题。

**Q4：Serverless 函数的并发限制如何处理？**

> 各平台有不同的并发限制（AWS Lambda 默认 1000 并发）。处理策略：(1) 使用队列缓冲突发流量；(2) 预留并发（Provisioned Concurrency）；(3) 合理设置超时和重试；(4) 使用 Edge Functions 分担轻量请求。

**Q5：流式响应（Streaming）在什么场景下使用？**

> 流式响应适用于：(1) AI 大模型逐 token 输出；(2) 大数据集分批返回；(3) 实时进度更新；(4) SSE（Server-Sent Events）推送。在 Edge Runtime 中，流式响应可以进一步降低 TTFB，因为不需要等待所有数据准备好再返回。
