---
sidebar_position: 3
title: Cloudflare Workers 实践
---

# Cloudflare Workers 实践

Cloudflare Workers 是最成熟的边缘计算平台之一，运行在 Cloudflare 全球 300+ 数据中心上，基于 V8 Isolates 实现 < 5ms 冷启动。它不仅提供计算能力，还提供了一整套边缘存储方案（KV、D1、R2、Durable Objects），让前端工程师可以在边缘完成完整的数据读写。

## 📖 Workers 基础

### 项目初始化

```bash
# 创建项目
npm create cloudflare@latest my-worker

# 项目结构
my-worker/
├── src/
│   └── index.ts        # 入口文件
├── wrangler.toml       # 配置文件
├── package.json
└── tsconfig.json

# 本地开发
npx wrangler dev

# 部署到 Cloudflare
npx wrangler deploy
```

### 基本请求处理

```ts
// src/index.ts
export interface Env {
  // 环境变量和绑定在这里声明
  MY_KV: KVNamespace;
  MY_DB: D1Database;
  MY_BUCKET: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // 路由
    switch (url.pathname) {
      case '/api/hello':
        return new Response(JSON.stringify({ message: 'Hello World!' }), {
          headers: { 'Content-Type': 'application/json' },
        });

      case '/api/geo':
        // request.cf 包含地理信息
        const cf = request.cf;
        return Response.json({
          country: cf?.country,
          city: cf?.city,
          colo: cf?.colo,
          latitude: cf?.latitude,
          longitude: cf?.longitude,
          timezone: cf?.timezone,
        });

      default:
        return new Response('Not Found', { status: 404 });
    }
  },
};
```

### 使用 Hono 框架

```bash
npm install hono
```

```ts
// src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

type Bindings = {
  MY_KV: KVNamespace;
  MY_DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// 中间件
app.use('*', logger());
app.use('/api/*', cors());

// 路由
app.get('/api/users', async (c) => {
  const { env } = c;
  const users = await env.MY_DB.prepare('SELECT * FROM users LIMIT 10').all();
  return c.json(users.results);
});

app.post('/api/users', async (c) => {
  const { env } = c;
  const body = await c.req.json();

  const result = await env.MY_DB.prepare(
    'INSERT INTO users (name, email) VALUES (?, ?)'
  ).bind(body.name, body.email).run();

  return c.json({ id: result.meta.last_row_id }, 201);
});

export default app;
```

## KV（键值存储）

```
Cloudflare KV 特点
═══════════════════════════════════════════════════════

KV = Key-Value Store（全球分布式键值存储）

特点：
• 全球分布 —— 数据自动复制到所有边缘节点
• 低延迟 —— 读取通常 < 10ms（本地边缘节点）
• 最终一致性 —— 写入后可能有几秒延迟（全球传播）
• 适合读多写少 —— 读取免费额度高，写入较贵

适用场景：
  ✅ 配置存储（功能开关、A/B 测试配置）
  ✅ 缓存（API 响应缓存、页面缓存）
  ✅ Session 存储（用户会话数据）
  ✅ 限流计数器

不适用场景：
  ❌ 频繁写入（每次写入都有全球传播开销）
  ❌ 需要强一致性（KV 是最终一致性）
  ❌ 复杂查询（只能按 key 查询）
```

```ts
// KV 基本操作
app.get('/api/config/:key', async (c) => {
  const key = c.req.param('key');
  const value = await c.env.MY_KV.get(key, 'json');
  return c.json({ key, value });
});

app.put('/api/config/:key', async (c) => {
  const key = c.req.param('key');
  const body = await c.req.json();

  await c.env.MY_KV.put(key, JSON.stringify(body), {
    expirationTtl: 3600, // 1 小时后过期
  });

  return c.json({ success: true });
});

// KV 缓存模式
app.get('/api/products/:id', async (c) => {
  const id = c.req.param('id');
  const cacheKey = `product:${id}`;

  // 1. 先查缓存
  const cached = await c.env.MY_KV.get(cacheKey, 'json');
  if (cached) {
    return c.json({ ...cached, source: 'cache' });
  }

  // 2. 缓存未命中，查数据库
  const product = await c.env.MY_DB.prepare(
    'SELECT * FROM products WHERE id = ?'
  ).bind(id).first();

  if (!product) {
    return c.json({ error: 'Not found' }, 404);
  }

  // 3. 写入缓存（TTL 5 分钟）
  await c.env.MY_KV.put(cacheKey, JSON.stringify(product), {
    expirationTtl: 300,
  });

  return c.json({ ...product, source: 'database' });
});
```

## D1（SQLite 数据库）

```
Cloudflare D1 特点
═══════════════════════════════════════════════════════

D1 = 分布式 SQLite 数据库

特点：
• SQL 兼容 —— 标准 SQLite 语法
• 全球分布 —— 数据自动复制到边缘（读优化）
• Serverless —— 无需管理数据库实例
• 成本低 —— 免费额度：每天 5M 读 + 100K 写

适用场景：
  ✅ 结构化数据存储
  ✅ 需要 SQL 查询的场景
  ✅ 中小型应用的主数据库
  ✅ 边缘应用的数据层

不适用场景：
  ❌ 超大规模数据（TB 级别）
  ❌ 需要复杂事务（D1 事务支持有限）
  ❌ 高并发写入（写入有速率限制）
```

```ts
// D1 数据库操作
// 创建表（通过 wrangler 执行）
// npx wrangler d1 execute my-db --command "
//   CREATE TABLE IF NOT EXISTS posts (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     title TEXT NOT NULL,
//     content TEXT,
//     author TEXT,
//     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
//   );
// "

// CRUD 操作
app.get('/api/posts', async (c) => {
  const { env } = c;
  const page = Number(c.req.query('page')) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  const { results } = await env.MY_DB.prepare(
    'SELECT * FROM posts ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).bind(limit, offset).all();

  const total = await env.MY_DB.prepare(
    'SELECT COUNT(*) as count FROM posts'
  ).first();

  return c.json({
    posts: results,
    pagination: {
      page,
      limit,
      total: (total as any).count,
    },
  });
});

app.post('/api/posts', async (c) => {
  const { title, content, author } = await c.req.json();

  const result = await c.env.MY_DB.prepare(
    'INSERT INTO posts (title, content, author) VALUES (?, ?, ?)'
  ).bind(title, content, author).run();

  return c.json({ id: result.meta.last_row_id }, 201);
});

app.get('/api/posts/:id', async (c) => {
  const id = c.req.param('id');
  const post = await c.env.MY_DB.prepare(
    'SELECT * FROM posts WHERE id = ?'
  ).bind(id).first();

  if (!post) {
    return c.json({ error: 'Post not found' }, 404);
  }
  return c.json(post);
});

// 批量操作
app.post('/api/posts/batch', async (c) => {
  const posts = await c.req.json();
  const { env } = c;

  const stmt = env.MY_DB.prepare(
    'INSERT INTO posts (title, content, author) VALUES (?, ?, ?)'
  );

  const batch = posts.map((p: any) =>
    stmt.bind(p.title, p.content, p.author)
  );

  const results = await env.MY_DB.batch(batch);
  return c.json({ inserted: results.length });
});
```

## R2（对象存储）

```
Cloudflare R2 特点
═══════════════════════════════════════════════════════

R2 = S3 兼容的对象存储（零出口费用）

特点：
• S3 兼容 API —— 可用 AWS SDK 访问
• 零出口费用 —— 不收数据传输费（对比 S3 省很多）
• 全球分布 —— 自动复制到边缘
• 无限存储 —— 按实际使用量计费

适用场景：
  ✅ 图片/视频/文件存储
  ✅ 静态资源托管
  ✅ 备份和归档
  ✅ CDN 源站

定价（免费额度）：
  • 存储：10GB/月
  • A 类操作（写入）：1M 次/月
  • B 类操作（读取）：10M 次/月
  • 出口流量：免费！
```

```ts
// R2 文件上传和下载
app.post('/api/upload', async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return c.json({ error: 'No file provided' }, 400);
  }

  const key = `uploads/${Date.now()}-${file.name}`;

  await c.env.MY_BUCKET.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000',
    },
    customMetadata: {
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
    },
  });

  return c.json({
    key,
    url: `/api/files/${key}`,
  });
});

app.get('/api/files/*', async (c) => {
  const key = c.req.path.replace('/api/files/', '');

  const object = await c.env.MY_BUCKET.get(key);

  if (!object) {
    return c.json({ error: 'File not found' }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000');

  return new Response(object.body, { headers });
});

// 列出文件
app.get('/api/files', async (c) => {
  const prefix = c.req.query('prefix') || '';
  const limit = Number(c.req.query('limit')) || 100;

  const listed = await c.env.MY_BUCKET.list({
    prefix,
    limit,
  });

  return c.json({
    files: listed.objects.map(obj => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded,
      etag: obj.etag,
    })),
    truncated: listed.truncated,
  });
});
```

## Durable Objects

```
Durable Objects 特点
═══════════════════════════════════════════════════════

Durable Objects = 有状态的边缘计算对象

核心概念：
• 全局唯一 —— 每个 DO 实例在整个 Cloudflare 网络中只有一个
• 有状态 —— 可以在内存中保持状态，也有持久化存储
• 强一致性 —— 所有请求都路由到同一个实例（单点串行处理）
• 可编程 —— 用 JavaScript/TypeScript 编写逻辑

适用场景：
  ✅ 实时协作（文档编辑、白板）
  ✅ 聊天室 / WebSocket 服务
  ✅ 游戏状态管理
  ✅ 分布式锁
  ✅ 速率限制器
  ✅ 会话管理

与 KV/D1 的区别：
  KV：无状态、最终一致性、键值存储
  D1：无状态、SQL 数据库、读优化
  DO：有状态、强一致性、单实例串行处理
```

```ts
// Durable Object 类定义
// src/chat-room.ts
export class ChatRoom {
  state: DurableObjectState;
  sessions: WebSocket[] = [];

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/websocket') {
      // 升级为 WebSocket
      const pair = new WebSocketPair();
      const [client, server] = [pair[0], pair[1]];

      this.handleSession(server);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    if (url.pathname === '/messages') {
      // 获取历史消息
      const messages = await this.state.storage.get('messages');
      return Response.json(messages || []);
    }

    return new Response('Not Found', { status: 404 });
  }

  handleSession(ws: WebSocket) {
    ws.accept();
    this.sessions.push(ws);

    ws.addEventListener('message', async (event) => {
      const message = JSON.parse(event.data as string);

      // 保存消息
      const messages: any[] =
        (await this.state.storage.get('messages')) || [];
      messages.push({
        ...message,
        timestamp: Date.now(),
      });

      // 只保留最近 100 条
      if (messages.length > 100) {
        messages.splice(0, messages.length - 100);
      }

      await this.state.storage.put('messages', messages);

      // 广播给所有连接
      const broadcast = JSON.stringify({
        type: 'message',
        data: message,
      });

      for (const session of this.sessions) {
        try {
          session.send(broadcast);
        } catch {
          // 移除断开的连接
          this.sessions = this.sessions.filter(s => s !== session);
        }
      }
    });

    ws.addEventListener('close', () => {
      this.sessions = this.sessions.filter(s => s !== ws);
    });
  }
}

// 路由入口
// src/index.ts
app.get('/api/chat/:roomId', async (c) => {
  const roomId = c.req.param('roomId');

  // 获取 Durable Object 实例
  const id = c.env.CHAT_ROOMS.idFromName(roomId);
  const obj = c.env.CHAT_ROOMS.get(id);

  // 转发请求到 Durable Object
  return obj.fetch(c.req.raw);
});
```

```ts
// Durable Object 作为速率限制器
export class RateLimiter {
  state: DurableObjectState;
  requests: Map<string, number[]> = new Map();

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const { ip, limit, window } = await request.json();

    const now = Date.now();
    const windowStart = now - window * 1000;

    // 获取该 IP 的请求记录
    let timestamps = this.requests.get(ip) || [];

    // 清除过期记录
    timestamps = timestamps.filter(t => t > windowStart);

    // 检查是否超限
    if (timestamps.length >= limit) {
      return Response.json({
        allowed: false,
        remaining: 0,
        resetAt: timestamps[0] + window * 1000,
      });
    }

    // 记录本次请求
    timestamps.push(now);
    this.requests.set(ip, timestamps);

    return Response.json({
      allowed: true,
      remaining: limit - timestamps.length,
      resetAt: now + window * 1000,
    });
  }
}
```

## wrangler.toml 配置

```toml
# wrangler.toml
name = "my-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# KV 命名空间绑定
[[kv_namespaces]]
binding = "MY_KV"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# D1 数据库绑定
[[d1_databases]]
binding = "MY_DB"
database_name = "my-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# R2 存储桶绑定
[[r2_buckets]]
binding = "MY_BUCKET"
bucket_name = "my-bucket"

# Durable Objects 绑定
[[durable_objects.bindings]]
name = "CHAT_ROOMS"
class_name = "ChatRoom"
script_name = "chat-room"

# 环境变量
[vars]
API_KEY = "your-api-key"
ENVIRONMENT = "production"

# 环境特定配置
[env.staging]
name = "my-worker-staging"
vars = { ENVIRONMENT = "staging" }
```

## 实际部署流程

```bash
# 1. 登录 Cloudflare
npx wrangler login

# 2. 创建 KV 命名空间
npx wrangler kv namespace create MY_KV
npx wrangler kv namespace create MY_KV --preview

# 3. 创建 D1 数据库
npx wrangler d1 create my-db

# 4. 执行数据库迁移
npx wrangler d1 execute my-db --file=./migrations/001_init.sql

# 5. 创建 R2 存储桶
npx wrangler r2 bucket create my-bucket

# 6. 本地开发
npx wrangler dev

# 7. 部署
npx wrangler deploy

# 8. 查看日志
npx wrangler tail
```

## 面试要点

### 常见面试问题

**Q1：Cloudflare KV、D1、R2 分别适合什么场景？**

> KV 是全球分布式键值存储，适合读多写少的配置和缓存场景，最终一致性。D1 是分布式 SQLite 数据库，适合需要 SQL 查询的结构化数据。R2 是 S3 兼容的对象存储，适合文件和媒体存储，零出口费用是其最大优势。

**Q2：Durable Objects 和 KV 有什么区别？**

> KV 是无状态的键值存储，最终一致性，适合全局配置和缓存。Durable Objects 是有状态的单实例对象，强一致性，所有请求路由到同一个实例串行处理。KV 适合读多写少，DO 适合需要强一致性和实时协作的场景（如聊天室、协作编辑）。

**Q3：Cloudflare Workers 的冷启动为什么这么快？**

> Workers 基于 V8 Isolates 而非容器。V8 Isolates 共享底层 V8 引擎，只需创建轻量级的隔离上下文（几 KB 内存），不需要启动操作系统或 Node.js 运行时。因此冷启动时间 < 5ms，远低于传统 Serverless 的 100ms-数秒。

**Q4：如何处理 D1 数据库的迁移？**

> 使用 wrangler CLI 执行 SQL 迁移文件：`npx wrangler d1 execute my-db --file=./migrations/001_init.sql`。也可以在 CI/CD 中自动化执行。建议将迁移文件纳入版本控制，按序号命名确保执行顺序。

**Q5：Workers 的免费额度够用吗？免费版有什么限制？**

> Workers 免费版每天 100K 请求，每次请求 CPU 时间 10ms。KV 免费版每天 100K 读取、1K 写入。D1 免费版每天 5M 读取、100K 写入。R2 免费版每月 10GB 存储、10M 读取。对于个人项目和中小型应用足够，生产环境通常需要付费版（$5/月起）。
