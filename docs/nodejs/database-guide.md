---
sidebar_position: 6
title: "数据库实战指南"
difficulty: "medium"
tags: ["nodejs", "数据库", "MySQL", "MongoDB", "Prisma"]
---

# 数据库实战指南

在全栈开发中，数据库是应用的核心基础设施。本文将从数据库选型、ORM 框架对比、Prisma 实战、连接池管理到事务处理，系统讲解 Node.js 数据库开发的最佳实践。

## 数据库选型对比

选择合适的数据库是架构设计的第一步。以下是三种主流数据库的对比：

| 特性 | MySQL | PostgreSQL | MongoDB |
|------|-------|-----------|---------|
| 数据模型 | 关系型（表结构） | 关系型（表结构） | 文档型（JSON） |
| 查询语言 | SQL | SQL（扩展） | MQL |
| 事务支持 | 完整 ACID | 完整 ACID | 多文档事务（4.0+） |
| JSON 支持 | JSON 类型 | JSONB（高性能） | 原生支持 |
| 全文搜索 | 基础支持 | 内置 ts_vector | 内置 text index |
| 水平扩展 | 读写分离/分库分表 | Citus 扩展 | 原生分片 |
| 适用场景 | 电商、ERP、传统业务 | 复杂查询、GIS、数据分析 | 灵活 schema、高写入、文档存储 |
| 性能特点 | 读性能优秀 | 复杂查询优化强 | 写入性能高、聚合灵活 |
| 生态成熟度 | 极高 | 高 | 高 |

:::tip 选型建议
- **初创项目/快速迭代**：MongoDB（schema 灵活，开发速度快）
- **电商/金融业务**：MySQL 或 PostgreSQL（强事务保证）
- **复杂数据分析**：PostgreSQL（窗口函数、CTE 支持完善）
- **混合需求**：PostgreSQL + JSONB（兼顾关系型和文档型）
:::

## ORM 框架对比

| 特性 | Prisma | TypeORM | Sequelize | Mongoose |
|------|--------|---------|-----------|----------|
| 类型安全 | ⭐⭐⭐ 完美 | ⭐⭐ 装饰器 | ⭐ 弱 | ⭐⭐ Schema 推断 |
| 学习曲线 | 低 | 中 | 中 | 低 |
| 迁移工具 | 内置 | 内置 | 内置 | 无（需第三方） |
| 数据库支持 | 多种 SQL + MongoDB | 多种 SQL | 多种 SQL | 仅 MongoDB |
| 性能 | 优秀（Rust 引擎） | 良好 | 良好 | 良好 |
| 原始查询 | 支持 $queryRaw | 支持 | 支持 | 支持 aggregate |
| 关联查询 | 声明式 include | Eager/Lazy loading | include | populate |
| 社区活跃度 | 极高 | 高 | 中 | 高 |

## Prisma 实战

### Schema 定义

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  password  String
  role      Role     @default(USER)
  posts     Post[]
  profile   Profile?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
  tags      Tag[]
  createdAt DateTime @default(now())

  @@index([authorId, published])
}

model Profile {
  id     Int    @id @default(autoincrement())
  bio    String?
  avatar String?
  user   User   @relation(fields: [userId], references: [id])
  userId Int    @unique
}

model Tag {
  id    Int    @id @default(autoincrement())
  name  String @unique
  posts Post[]
}

enum Role {
  USER
  ADMIN
  EDITOR
}
```

### 数据库迁移

```bash
# 创建迁移
npx prisma migrate dev --name init

# 生产环境部署
npx prisma migrate deploy

# 重置数据库（开发环境）
npx prisma migrate reset

# 生成 Prisma Client
npx prisma generate
```

### CRUD 操作与关联查询

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 创建用户并关联 Profile
async function createUser() {
  const user = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      name: 'Alice',
      password: await bcrypt.hash('password123', 10),
      profile: {
        create: { bio: '全栈开发者', avatar: '/avatars/alice.png' }
      }
    },
    include: { profile: true }
  });
  return user;
}

// 创建文章并关联标签
async function createPost(authorId: number) {
  return prisma.post.create({
    data: {
      title: 'Prisma 入门指南',
      content: '详细的 Prisma 教程...',
      authorId,
      tags: {
        connectOrCreate: [
          { where: { name: 'prisma' }, create: { name: 'prisma' } },
          { where: { name: 'database' }, create: { name: 'database' } }
        ]
      }
    },
    include: { tags: true, author: true }
  });
}

// 复杂关联查询
async function getUserWithPosts(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      posts: {
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { tags: true }
      },
      profile: true
    }
  });
}
```

## 连接池配置与管理

:::warning 为什么需要连接池？
数据库连接的创建和销毁是昂贵操作。没有连接池时，每个请求都创建新连接会导致：
- 连接创建延迟（TCP 握手 + 认证）
- 数据库连接数耗尽
- 内存和资源浪费
:::

```typescript
// Prisma 连接池配置（通过 URL 参数）
// DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10"

// 手动配置示例（使用 generic-pool）
import { createPool } from 'generic-pool';
import { createConnection } from 'mysql2/promise';

const pool = createPool({
  create: async () => {
    return createConnection({
      host: 'localhost',
      user: 'root',
      database: 'myapp',
      password: 'secret'
    });
  },
  destroy: async (connection) => {
    await connection.end();
  }
}, {
  max: 20,          // 最大连接数
  min: 5,           // 最小连接数
  acquireTimeoutMillis: 30000,  // 获取连接超时
  idleTimeoutMillis: 60000,    // 空闲连接回收时间
  evictionRunIntervalMillis: 10000 // 检查空闲连接间隔
});
```

### 连接泄漏排查

```typescript
// 检测连接泄漏
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'warn', emit: 'stdout' },
    { level: 'error', emit: 'stdout' }
  ]
});

prisma.$on('query', (e) => {
  if (e.duration > 5000) {
    console.warn(`慢查询检测: ${e.query} 耗时 ${e.duration}ms`);
  }
});
```

## 事务处理

### ACID 原则

| 特性 | 含义 | 示例 |
|------|------|------|
| 原子性 (Atomicity) | 事务要么全成功，要么全回滚 | 转账操作：扣款和入账必须同时成功 |
| 一致性 (Consistency) | 事务前后数据满足完整性约束 | 账户余额不能为负 |
| 隔离性 (Isolation) | 并发事务互不干扰 | 两人同时购买最后一件商品 |
| 持久性 (Durability) | 事务提交后数据持久保存 | 系统崩溃后数据不丢失 |

### Prisma 事务实现

```typescript
// 交互式事务
async function transfer(fromId: number, toId: number, amount: number) {
  return prisma.$transaction(async (tx) => {
    const sender = await tx.account.update({
      where: { id: fromId },
      data: { balance: { decrement: amount } }
    });

    if (sender.balance < 0) {
      throw new Error('余额不足');
    }

    await tx.account.update({
      where: { id: toId },
      data: { balance: { increment: amount } }
    });

    await tx.transactionLog.create({
      data: { fromId, toId, amount, type: 'TRANSFER' }
    });
  }, {
    maxWait: 5000,
    timeout: 10000,
    isolationLevel: 'Serializable'
  });
}
```

### 乐观锁 vs 悲观锁

```typescript
// 乐观锁 - 通过版本号实现
async function optimisticUpdate(productId: number, newStock: number) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  
  const updated = await prisma.product.updateMany({
    where: { id: productId, version: product.version },
    data: { stock: newStock, version: { increment: 1 } }
  });

  if (updated.count === 0) {
    throw new Error('数据已被其他事务修改，请重试');
  }
}

// 悲观锁 - 使用 SELECT FOR UPDATE
async function pessimisticUpdate(productId: number) {
  return prisma.$transaction(async (tx) => {
    const [product] = await tx.$queryRaw`
      SELECT * FROM "Product" WHERE id = ${productId} FOR UPDATE
    `;
    // 此时其他事务无法修改该行
    await tx.product.update({
      where: { id: productId },
      data: { stock: product.stock - 1 }
    });
  });
}
```

## 常用查询模式

### 分页查询

```typescript
// Offset 分页（适合数据量小的场景）
async function getPostsPaginated(page: number, pageSize: number) {
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.post.count()
  ]);
  return { posts, total, totalPages: Math.ceil(total / pageSize) };
}

// Cursor 分页（适合大数据量/无限滚动）
async function getPostsByCursor(cursor?: number, take = 20) {
  const posts = await prisma.post.findMany({
    take: take + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: { id: 'desc' }
  });
  const hasMore = posts.length > take;
  return {
    posts: posts.slice(0, take),
    nextCursor: hasMore ? posts[take - 1].id : null
  };
}
```

### 模糊搜索与聚合统计

```typescript
// 模糊搜索
async function searchPosts(keyword: string) {
  return prisma.post.findMany({
    where: {
      OR: [
        { title: { contains: keyword, mode: 'insensitive' } },
        { content: { contains: keyword, mode: 'insensitive' } }
      ]
    }
  });
}

// 聚合统计
async function getPostStats() {
  const stats = await prisma.post.groupBy({
    by: ['published'],
    _count: { id: true },
    _avg: { viewCount: true }
  });
  return stats;
}
```

## 面试高频题

:::info 面试题精选

**Q1: SQL 注入是什么？如何防范？**

SQL 注入是通过拼接恶意 SQL 语句来攻击数据库的手段。防范方式：使用参数化查询（ORM 自动处理）、输入验证、最小权限原则。

**Q2: 什么时候用 NoSQL，什么时候用关系型数据库？**

关系型：数据结构固定、需要复杂关联查询、强一致性要求。NoSQL：schema 变化频繁、高写入吞吐、水平扩展需求、文档/嵌套数据结构。

**Q3: 数据库索引的原理是什么？什么时候不应该建索引？**

B+ 树索引通过有序结构加速查找。不建索引的场景：低基数列、频繁写入的表、小数据量表、很少用于查询条件的列。

**Q4: 连接池大小如何确定？**

经验公式：`pool_size = (core_count * 2) + disk_spindles`。实际需要根据压测调整。过大导致资源浪费和锁竞争，过小导致请求排队。

**Q5: 乐观锁和悲观锁的适用场景？**

乐观锁：读多写少、冲突概率低（如商品浏览）。悲观锁：写多、冲突概率高（如库存扣减、秒杀场景）。

**Q6: 如何处理数据库的 N+1 查询问题？**

使用 ORM 的 Eager Loading（Prisma 的 include）、DataLoader 批量查询、JOIN 查询替代循环查询。
:::

## 实战案例：博客系统数据层

```typescript
// services/post.service.ts
class PostService {
  async createPost(data: CreatePostDTO, userId: number) {
    return prisma.post.create({
      data: {
        ...data,
        authorId: userId,
        tags: {
          connectOrCreate: data.tags.map(tag => ({
            where: { name: tag },
            create: { name: tag }
          }))
        }
      },
      include: { tags: true, author: { select: { id: true, name: true } } }
    });
  }

  async getPostFeed(userId: number, cursor?: number) {
    return prisma.post.findMany({
      where: { published: true },
      take: 21,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, name: true, profile: true } },
        tags: true,
        _count: { select: { comments: true } }
      }
    });
  }
}
```
