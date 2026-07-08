---
sidebar_position: 4
title: BFF 层设计与实践
---

# BFF 层设计与实践

BFF（Backend For Frontend）是一种架构模式，在前端和后端微服务之间建立一个中间层，为前端提供定制化的 API。BFF 层是前后端协作的关键枢纽。

## 📖 什么是 BFF

### 传统架构的问题

```
传统架构：

前端 ──── 请求 ────→ 后端微服务 A
    ──── 请求 ────→ 后端微服务 B
    ──── 请求 ────→ 后端微服务 C
    ──── 请求 ────→ 后端微服务 D

问题：
1. 前端需要了解后端服务拆分细节
2. 多次请求导致页面加载慢
3. 不同端（Web/Mobile/小程序）需求不同，难以统一
4. 前端与后端耦合度高
```

### BFF 架构

```
BFF 架构：

Web 前端 ──→ Web BFF ──┬──→ 用户服务
                        ├──→ 订单服务
                        └──→ 商品服务

Mobile App ──→ Mobile BFF ──┬──→ 用户服务
                            ├──→ 订单服务
                            └──→ 商品服务

小程序 ──→ Mini BFF ──┬──→ 用户服务
                      ├──→ 订单服务
                      └──→ 商品服务

优势：
1. 前端只与 BFF 交互，无需了解后端细节
2. BFF 聚合多个服务，减少前端请求次数
3. 不同端可以有各自的 BFF，定制化接口
4. 前后端解耦，独立演进
```

## 🏗️ BFF 架构设计

### 分层架构

```
┌─────────────────────────────────────────────┐
│                客户端层                       │
│   Web / Mobile / 小程序 / 第三方             │
└──────────────────┬──────────────────────────┘
                   │ HTTP / WebSocket
                   ▼
┌─────────────────────────────────────────────┐
│                BFF 层                        │
│  ┌─────────────────────────────────────┐    │
│  │  路由层（Router）                     │    │
│  │  - 请求路由                          │    │
│  │  - 版本管理                          │    │
│  │  - 限流                              │    │
│  └──────────────────┬──────────────────┘    │
│  ┌──────────────────▼──────────────────┐    │
│  │  业务层（Service）                    │    │
│  │  - 接口聚合                          │    │
│  │  - 数据转换                          │    │
│  │  - 业务编排                          │    │
│  └──────────────────┬──────────────────┘    │
│  ┌──────────────────▼──────────────────┐    │
│  │  基础层（Infrastructure）             │    │
│  │  - 鉴权                              │    │
│  │  - 日志                              │    │
│  │  - 缓存                              │    │
│  │  - 错误处理                          │    │
│  └─────────────────────────────────────┘    │
└──────────────────┬──────────────────────────┘
                   │ gRPC / HTTP / 消息队列
                   ▼
┌─────────────────────────────────────────────┐
│              微服务层                        │
│   用户服务 / 订单服务 / 商品服务 / 支付服务   │
└─────────────────────────────────────────────┘
```

### 技术选型

```ts
// 方案 1：Next.js / Nuxt.js 内置 API Routes
// 适合全栈团队，前端直接管理 BFF

// Next.js API Route
// app/api/dashboard/route.ts
export async function GET() {
  const [user, orders, notifications] = await Promise.all([
    fetchUserService(),
    fetchOrderService(),
    fetchNotificationService(),
  ]);

  return Response.json({ user, orders, notifications });
}

// 方案 2：独立 BFF 服务（Express / Fastify / Koa）
// 适合大型团队，BFF 独立部署和扩展

// 方案 3：GraphQL BFF
// 适合需要灵活查询的场景

// 方案 4：Node.js BFF + gRPC
// 适合高性能场景
```

## 📡 接口聚合

### 并行聚合

```ts
// BFF 层：聚合多个后端服务的数据
import { fetch } from 'undici';

interface DashboardData {
  user: UserProfile;
  orders: Order[];
  notifications: Notification[];
  recommendations: Product[];
}

export async function getDashboard(userId: string): Promise<DashboardData> {
  // 并行请求，减少总耗时
  const [userRes, ordersRes, notifRes, recRes] = await Promise.allSettled([
    fetch(`http://user-service/api/users/${userId}`),
    fetch(`http://order-service/api/orders?userId=${userId}&limit=5`),
    fetch(`http://notification-service/api/notifications?userId=${userId}`),
    fetch(`http://recommendation-service/api/recommendations?userId=${userId}`),
  ]);

  // 处理部分失败的情况
  return {
    user: userRes.status === 'fulfilled' ? await userRes.value.json() : null,
    orders: ordersRes.status === 'fulfilled' ? await ordersRes.value.json() : [],
    notifications: notifRes.status === 'fulfilled' ? await notifRes.value.json() : [],
    recommendations: recRes.status === 'fulfilled' ? await recRes.value.json() : [],
  };
}
```

### 串行聚合（依赖请求）

```ts
// 有依赖关系的聚合：先获取用户，再获取该用户的订单详情
export async function getOrderDetail(userId: string, orderId: string) {
  // 第一步：获取用户信息（用于权限校验和展示）
  const user = await fetchUser(userId);

  if (!user) {
    throw new AppError('USER_NOT_FOUND', 404);
  }

  // 第二步：获取订单信息
  const order = await fetchOrder(orderId);

  // 权限校验
  if (order.userId !== userId) {
    throw new AppError('FORBIDDEN', 403);
  }

  // 第三步：根据订单中的商品 ID 批量获取商品信息
  const productIds = order.items.map(item => item.productId);
  const products = await fetchProducts(productIds);

  // 数据转换：组装前端需要的格式
  return {
    order: {
      ...order,
      items: order.items.map(item => ({
        ...item,
        product: products.find(p => p.id === item.productId),
      })),
    },
    user: {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
    },
  };
}
```

### 数据转换与裁剪

```ts
// 后端返回的原始数据
interface RawUser {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  internal_role: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

// BFF 转换后返回给前端的数据
interface FrontendUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}

function transformUser(raw: RawUser): FrontendUser {
  return {
    id: raw.id,
    name: raw.username,
    email: raw.email,
    role: raw.internal_role === 'ADMIN' ? 'admin' : 'user',
    createdAt: new Date(raw.created_at).toLocaleDateString('zh-CN'),
  };
}
```

## 🔐 鉴权方案

### JWT 鉴权

```ts
// middleware/auth.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface AuthContext {
  userId: string;
  role: string;
}

export function authMiddleware(req: Request): AuthContext | null {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ||
                getCookie(req, 'token');

  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthContext;
    return payload;
  } catch {
    return null;
  }
}

// 在路由中使用
export async function GET(req: Request) {
  const auth = authMiddleware(req);

  if (!auth) {
    return Response.json({ error: '未登录' }, { status: 401 });
  }

  if (auth.role !== 'admin') {
    return Response.json({ error: '权限不足' }, { status: 403 });
  }

  // 业务逻辑...
}
```

### 统一鉴权装饰器

```ts
// utils/auth-decorator.ts
type Handler = (req: Request, ctx: AuthContext) => Promise<Response>;

export function withAuth(handler: Handler, options?: { roles?: string[] }) {
  return async (req: Request) => {
    const auth = authMiddleware(req);

    if (!auth) {
      return Response.json(
        { code: 401, message: '请先登录' },
        { status: 401 }
      );
    }

    if (options?.roles && !options.roles.includes(auth.role)) {
      return Response.json(
        { code: 403, message: '权限不足' },
        { status: 403 }
      );
    }

    return handler(req, auth);
  };
}

// 使用
export const GET = withAuth(async (req, auth) => {
  const user = await getUser(auth.userId);
  return Response.json(user);
}, { roles: ['admin'] });
```

## ⚠️ 错误处理

### 统一错误响应格式

```ts
// utils/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// 预定义错误
export const Errors = {
  UNAUTHORIZED: () => new AppError('UNAUTHORIZED', 401, '请先登录'),
  FORBIDDEN: () => new AppError('FORBIDDEN', 403, '权限不足'),
  NOT_FOUND: (resource: string) =>
    new AppError('NOT_FOUND', 404, `${resource}不存在`),
  VALIDATION_ERROR: (details: any) =>
    new AppError('VALIDATION_ERROR', 400, '参数校验失败', details),
  UPSTREAM_ERROR: (service: string) =>
    new AppError('UPSTREAM_ERROR', 502, `${service}服务异常`),
  RATE_LIMITED: () =>
    new AppError('RATE_LIMITED', 429, '请求过于频繁，请稍后再试'),
} as const;
```

### 全局错误处理中间件

```ts
// middleware/error-handler.ts
export function errorHandler(handler: Function) {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (error) {
      // AppError：已知业务错误
      if (error instanceof AppError) {
        console.warn(`[BFF] ${error.code}: ${error.message}`);
        return Response.json(
          {
            code: error.code,
            message: error.message,
            details: error.details,
          },
          { status: error.statusCode }
        );
      }

      // 上游服务错误
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error(`[BFF] Upstream service error:`, error);
        return Response.json(
          { code: 'UPSTREAM_ERROR', message: '服务暂时不可用，请稍后重试' },
          { status: 502 }
        );
      }

      // 未知错误
      console.error(`[BFF] Unexpected error:`, error);
      return Response.json(
        { code: 'INTERNAL_ERROR', message: '服务器内部错误' },
        { status: 500 }
      );
    }
  };
}
```

### 重试与熔断

```ts
// utils/circuit-breaker.ts
interface CircuitBreakerOptions {
  failureThreshold: number;   // 失败次数阈值
  resetTimeout: number;       // 熔断恢复时间（ms）
}

export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(private options: CircuitBreakerOptions) {}

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.options.resetTimeout) {
        this.state = 'half-open';
      } else {
        throw new AppError('SERVICE_UNAVAILABLE', 503, '服务熔断中');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.options.failureThreshold) {
      this.state = 'open';
    }
  }
}

// 使用
const userServiceBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 30000,
});

export async function fetchUser(userId: string) {
  return userServiceBreaker.call(() =>
    fetch(`http://user-service/api/users/${userId}`)
      .then(res => res.json())
  );
}
```

## ⚡ 性能优化

### 响应缓存

```ts
// utils/cache.ts
const cache = new Map<string, { data: any; expiry: number }>();

export function withCache<T>(
  key: string,
  ttl: number, // 缓存时间（秒）
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = cache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return Promise.resolve(cached.data);
  }

  return fetcher().then(data => {
    cache.set(key, { data, expiry: Date.now() + ttl * 1000 });
    return data;
  });
}

// 使用
export async function getProducts() {
  return withCache('products:all', 300, () =>
    fetch('http://product-service/api/products').then(r => r.json())
  );
}
```

### 请求合并（DataLoader）

```ts
// utils/dataloader.ts
export class DataLoader<K, V> {
  private batch: Array<{ key: K; resolve: (value: V) => void; reject: (error: any) => void }> = [];
  private scheduled = false;

  constructor(
    private batchLoadFn: (keys: K[]) => Promise<V[]>,
    private maxBatchSize = 100,
  ) {}

  load(key: K): Promise<V> {
    return new Promise((resolve, reject) => {
      this.batch.push({ key, resolve, reject });

      if (!this.scheduled) {
        this.scheduled = true;
        // 微任务中批量执行
        queueMicrotask(() => this.dispatch());
      }
    });
  }

  private async dispatch() {
    const batch = this.batch.splice(0, this.maxBatchSize);
    this.scheduled = false;

    if (batch.length === 0) return;

    try {
      const keys = batch.map(item => item.key);
      const values = await this.batchLoadFn(keys);

      batch.forEach((item, index) => {
        item.resolve(values[index]);
      });
    } catch (error) {
      batch.forEach(item => item.reject(error));
    }
  }
}

// 使用：多个组件同时请求用户信息，合并为一次批量查询
const userLoader = new DataLoader<string, User>(async (userIds) => {
  const response = await fetch('http://user-service/api/users/batch', {
    method: 'POST',
    body: JSON.stringify({ ids: userIds }),
  });
  return response.json();
});

// 多个地方调用 userLoader.load('1'), userLoader.load('2')
// 实际只会发送一次批量请求
```

## 🔑 面试高频问题

### 1. BFF 和直接调用微服务的区别？

| 维度 | 直接调用微服务 | BFF 模式 |
|------|----------------|----------|
| 请求次数 | 多次 | 聚合为一次 |
| 数据格式 | 后端定义 | 前端定制 |
| 鉴权 | 各服务各自鉴权 | 统一鉴权 |
| 错误处理 | 前端处理多种错误 | 统一错误格式 |
| 前后端耦合 | 高 | 低 |
| 适用场景 | 简单应用 | 复杂业务、多端 |

### 2. BFF 层如何保证高可用？

```ts
// 1. 熔断器：上游服务故障时快速失败
// 2. 降级策略：返回缓存数据或默认值
// 3. 超时控制：设置合理的请求超时
// 4. 限流：防止流量突增
// 5. 健康检查：定期检测上游服务状态
// 6. 多实例部署：避免单点故障
```

### 3. BFF 层的缓存策略？

```ts
// 1. 内存缓存：适合单实例、低频更新数据
// 2. Redis 缓存：适合多实例共享、高频访问数据
// 3. CDN 缓存：适合静态资源和准静态 API
// 4. HTTP 缓存：ETag、Last-Modified、Cache-Control
// 5. 浏览器缓存：配合前端 SWR 策略
```

### 4. GraphQL BFF 和 REST BFF 的对比？

| 维度 | REST BFF | GraphQL BFF |
|------|----------|-------------|
| 数据获取 | 固定结构，可能过度/不足 | 按需查询，精确获取 |
| 接口数量 | 多个端点 | 单一端点 |
| 类型系统 | 依赖文档 | Schema 强类型 |
| 学习成本 | 低 | 中等 |
| 缓存 | HTTP 缓存简单 | 需要额外方案 |
| N+1 问题 | 不存在 | 需要 DataLoader |
| 适用场景 | 简单 CRUD | 复杂关联查询 |

### 5. 如何设计 BFF 的版本管理？

```ts
// 方案 1：URL 版本号
// /api/v1/users
// /api/v2/users

// 方案 2：Header 版本号
// Accept: application/vnd.api.v1+json

// 方案 3：渐进式迁移（推荐）
// 新接口使用新路径，旧接口保持兼容
// /api/users (v2)
// /api/legacy/users (v1，标记废弃)

// 实际实现
export function routeByVersion(v1Handler: Function, v2Handler: Function) {
  return async (req: Request) => {
    const version = req.headers.get('API-Version') || 'v2';
    const handler = version === 'v1' ? v1Handler : v2Handler;
    return handler(req);
  };
}
```
