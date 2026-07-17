---
sidebar_position: 9
title: "RESTful API 设计最佳实践"
difficulty: "medium"
tags: ["nodejs", "API", "REST", "设计规范"]
---

# RESTful API 设计最佳实践

良好的 API 设计是前后端协作效率的关键。本文系统讲解 RESTful API 的设计原则、URL 规范、版本管理、分页策略、错误处理和文档集成。

## RESTful 设计原则

REST（Representational State Transfer）的核心约束：

| 约束 | 含义 | 实践 |
|------|------|------|
| 资源导向 | URI 表示资源而非操作 | `/users` 而非 `/getUsers` |
| 无状态 | 每次请求包含所有信息 | 不依赖服务端 Session |
| 统一接口 | HTTP 方法表达操作语义 | GET 读、POST 创建、PUT 更新 |
| 分层系统 | 客户端无需知道中间层 | 网关、负载均衡对客户端透明 |
| 可缓存 | 响应明确标记缓存策略 | 使用 Cache-Control、ETag |

:::tip 资源命名黄金法则
- 使用**名词复数**：`/users`、`/posts`、`/comments`
- 避免动词：`/createUser` ❌ → `POST /users` ✅
- 用连字符分隔：`/user-profiles` 而非 `/userProfiles`
- 不要暴露实现细节：`/api/db/tables` ❌
:::

## URL 设计规范

### 资源层级关系

```
# 一级资源
GET    /api/v1/users
POST   /api/v1/users
GET    /api/v1/users/:id
PUT    /api/v1/users/:id
DELETE /api/v1/users/:id

# 子资源（嵌套关系）
GET    /api/v1/users/:id/posts        # 某用户的所有文章
POST   /api/v1/users/:id/posts        # 为某用户创建文章
GET    /api/v1/posts/:id/comments     # 某文章的所有评论

# 避免过深嵌套（最多2层）
# ❌ /users/:id/posts/:postId/comments/:commentId/replies
# ✅ /comments/:id/replies
```

### 查询参数规范

```
# 过滤
GET /api/v1/posts?status=published&authorId=5

# 排序（-前缀表示降序）
GET /api/v1/posts?sort=-createdAt,title

# 字段选择（减少响应大小）
GET /api/v1/users?fields=id,name,email

# 分页
GET /api/v1/posts?page=2&pageSize=20

# 搜索
GET /api/v1/posts?search=nodejs&category=backend
```

## HTTP 方法语义对比

| 方法 | 语义 | 幂等性 | 安全性 | 请求体 | 典型响应码 |
|------|------|--------|--------|--------|-----------|
| GET | 获取资源 | ✅ 是 | ✅ 是 | 无 | 200 |
| POST | 创建资源 | ❌ 否 | ❌ 否 | 有 | 201 |
| PUT | 完整替换资源 | ✅ 是 | ❌ 否 | 有 | 200 |
| PATCH | 部分更新资源 | ❌ 否 | ❌ 否 | 有 | 200 |
| DELETE | 删除资源 | ✅ 是 | ❌ 否 | 无 | 204 |
| HEAD | 获取响应头（无体） | ✅ 是 | ✅ 是 | 无 | 200 |
| OPTIONS | 获取支持的方法 | ✅ 是 | ✅ 是 | 无 | 204 |

:::warning PUT vs PATCH
- **PUT**：替换整个资源，必须传递完整数据。未传字段会被置为默认值。
- **PATCH**：只更新传递的字段，其他字段保持不变。
- 推荐大多数更新场景使用 PATCH，更灵活且节省带宽。
:::

## 版本管理策略

| 方案 | 示例 | 优点 | 缺点 |
|------|------|------|------|
| URL 路径 | `/api/v1/users` | 直观、易缓存 | URL 变长 |
| 请求头 | `Accept: application/vnd.api.v1+json` | URL 干净 | 调试不便 |
| 查询参数 | `/api/users?version=1` | 简单 | 不够规范 |

```typescript
// URL 路径版本管理（推荐）
import { Router } from 'express';

const v1Router = Router();
const v2Router = Router();

// v1 - 原始接口
v1Router.get('/users', async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

// v2 - 新版本（响应格式变化）
v2Router.get('/users', async (req, res) => {
  const users = await prisma.user.findMany({
    include: { profile: true }
  });
  res.json({ data: users, meta: { total: users.length } });
});

app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router);
```

## 分页、过滤与排序

### Offset vs Cursor 分页对比

| 特性 | Offset 分页 | Cursor 分页 |
|------|------------|------------|
| 实现复杂度 | 低 | 中 |
| 随机跳页 | ✅ 支持 | ❌ 不支持 |
| 数据一致性 | 新增数据可能导致重复/遗漏 | 稳定一致 |
| 大数据量性能 | 差（OFFSET 越大越慢） | 优秀 |
| 适用场景 | 管理后台、数据量小 | 信息流、无限滚动 |

```typescript
// Offset 分页实现
app.get('/api/v1/posts', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
  
  const [data, total] = await Promise.all([
    prisma.post.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.post.count()
  ]);

  res.json({
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasNext: page * pageSize < total,
      hasPrev: page > 1
    }
  });
});

// Cursor 分页实现
app.get('/api/v1/feed', async (req, res) => {
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const cursor = req.query.cursor as string | undefined;

  const posts = await prisma.post.findMany({
    take: limit + 1,
    ...(cursor && { cursor: { id: Number(cursor) }, skip: 1 }),
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { id: true, name: true } } }
  });

  const hasMore = posts.length > limit;
  const data = posts.slice(0, limit);

  res.json({
    data,
    pagination: {
      hasMore,
      nextCursor: hasMore ? data[data.length - 1].id : null
    }
  });
});
```

## 错误响应规范

### 统一错误格式

```typescript
// 错误响应标准格式
interface ErrorResponse {
  status: number;
  code: string;           // 业务错误码
  message: string;        // 用户可读的错误描述
  details?: any[];        // 详细错误信息（如字段验证）
  timestamp: string;
  path: string;
  requestId: string;
}

// 示例响应
{
  "status": 422,
  "code": "VALIDATION_ERROR",
  "message": "请求参数验证失败",
  "details": [
    { "field": "email", "message": "邮箱格式不正确" },
    { "field": "password", "message": "密码长度至少8位" }
  ],
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/v1/users",
  "requestId": "req_abc123"
}
```

### HTTP 状态码使用指南

| 状态码 | 含义 | 使用场景 |
|--------|------|---------|
| 200 | OK | GET 成功、PUT/PATCH 更新成功 |
| 201 | Created | POST 创建成功 |
| 204 | No Content | DELETE 成功 |
| 400 | Bad Request | 请求格式错误、参数缺失 |
| 401 | Unauthorized | 未认证（未登录） |
| 403 | Forbidden | 已认证但权限不足 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突（如邮箱已注册） |
| 422 | Unprocessable Entity | 参数验证失败 |
| 429 | Too Many Requests | 请求频率超限 |
| 500 | Internal Server Error | 服务器内部错误 |

### 错误码体系设计

```typescript
// 错误码规范：模块前缀 + 错误编号
const ERROR_CODES = {
  // 通用错误 (10xxx)
  UNKNOWN_ERROR: { status: 500, code: '10001', message: '未知错误' },
  VALIDATION_ERROR: { status: 422, code: '10002', message: '参数验证失败' },
  
  // 认证错误 (20xxx)
  UNAUTHORIZED: { status: 401, code: '20001', message: '请先登录' },
  TOKEN_EXPIRED: { status: 401, code: '20002', message: 'Token 已过期' },
  FORBIDDEN: { status: 403, code: '20003', message: '权限不足' },

  // 用户模块 (30xxx)
  USER_NOT_FOUND: { status: 404, code: '30001', message: '用户不存在' },
  EMAIL_EXISTS: { status: 409, code: '30002', message: '邮箱已注册' },

  // 文章模块 (40xxx)
  POST_NOT_FOUND: { status: 404, code: '40001', message: '文章不存在' },
} as const;
```

## HATEOAS 超媒体驱动

```typescript
// HATEOAS 响应示例
app.get('/api/v1/posts/:id', async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: Number(req.params.id) } });
  
  res.json({
    data: post,
    _links: {
      self: { href: `/api/v1/posts/${post.id}` },
      author: { href: `/api/v1/users/${post.authorId}` },
      comments: { href: `/api/v1/posts/${post.id}/comments` },
      update: { href: `/api/v1/posts/${post.id}`, method: 'PATCH' },
      delete: { href: `/api/v1/posts/${post.id}`, method: 'DELETE' }
    }
  });
});
```

## OpenAPI/Swagger 集成

```typescript
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'Blog API', version: '1.0.0', description: '博客系统 API 文档' },
    servers: [{ url: '/api/v1' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    }
  },
  apis: ['./src/routes/*.ts']
};

const spec = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));

// 路由注释示例
/**
 * @openapi
 * /posts:
 *   get:
 *     summary: 获取文章列表
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 20, maximum: 100 }
 *     responses:
 *       200:
 *         description: 文章列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Post' }
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
app.get('/posts', listPosts);
```

## 面试高频题

:::info 面试题精选

**Q1: RESTful API 中 PUT 和 PATCH 的区别？**

PUT 是完整替换资源（幂等），必须传递完整数据；PATCH 是部分更新（非幂等），只传需要修改的字段。PUT 类比"覆盖文件"，PATCH 类比"打补丁"。

**Q2: 如何设计一个支持复杂过滤的 API？**

方案：① 简单过滤用查询参数 `?status=active&role=admin` ② 复杂查询用 JSON 格式 `?filter={"age":{"$gt":18}}` ③ 全文搜索用独立参数 `?q=keyword` ④ 超复杂场景考虑 GraphQL。

**Q3: API 限流（Rate Limiting）如何实现？**

算法：① 固定窗口 ② 滑动窗口 ③ 令牌桶 ④ 漏桶。实现：Redis + Lua 脚本计数，配合 `X-RateLimit-Limit`、`X-RateLimit-Remaining`、`Retry-After` 响应头。

**Q4: 接口幂等性如何保证？**

GET/PUT/DELETE 天然幂等。POST 非幂等需特殊处理：① 唯一请求 ID（Idempotency-Key）② 数据库唯一约束 ③ 状态机控制（已处理则直接返回结果）。

**Q5: RESTful 和 GraphQL 各自的适用场景？**

REST：资源模型清晰、缓存需求强、团队熟悉。GraphQL：前端数据需求多变、过度获取（over-fetching）严重、多端差异大。两者可共存。

**Q6: 如何处理 API 的向后兼容？**

策略：① 新增字段不影响旧客户端 ② 废弃字段标记 deprecated 而非删除 ③ 大改动使用新版本 ④ 提供迁移指南和过渡期 ⑤ 使用 sunset header 通知下线时间。
:::

## 实战案例：Express 路由设计

```typescript
// routes/posts.router.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createPostSchema, updatePostSchema, queryPostSchema } from '../schemas/post';

const router = Router();

router.get('/', validate(queryPostSchema, 'query'), listPosts);
router.get('/:id', getPost);
router.post('/', authenticate, validate(createPostSchema), createPost);
router.patch('/:id', authenticate, validate(updatePostSchema), updatePost);
router.delete('/:id', authenticate, deletePost);
router.get('/:id/comments', listPostComments);
router.post('/:id/comments', authenticate, createComment);

export default router;
```
