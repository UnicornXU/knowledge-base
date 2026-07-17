---
sidebar_position: 8
title: 'Redis 缓存策略'
difficulty: 'hard'
tags: ['nodejs', 'Redis', '缓存', '性能优化']
---

# Redis 缓存策略

Redis 是高性能内存数据库，在 Node.js 应用中承担缓存、会话管理、消息队列等多种角色。本文深入讲解 Redis 数据类型、缓存策略模式、常见问题解决方案及分布式锁实现。

## Redis 核心数据类型

| 数据类型          | 结构说明              | 典型适用场景                   | 示例命令                     |
| ----------------- | --------------------- | ------------------------------ | ---------------------------- |
| String            | 字符串/数字           | 缓存、计数器、分布式锁         | `SET`, `GET`, `INCR`         |
| Hash              | 哈希表（字段-值映射） | 对象存储、用户信息             | `HSET`, `HGET`, `HGETALL`    |
| List              | 双向链表              | 消息队列、最新动态             | `LPUSH`, `RPOP`, `LRANGE`    |
| Set               | 无序集合（去重）      | 标签、共同好友、去重           | `SADD`, `SMEMBERS`, `SINTER` |
| ZSet (Sorted Set) | 有序集合（带分数）    | 排行榜、延迟队列               | `ZADD`, `ZRANGE`, `ZRANK`    |
| Stream            | 日志型数据流          | 事件流、消息队列(替代 Pub/Sub) | `XADD`, `XREAD`, `XGROUP`    |

## Node.js 连接 Redis

### ioredis 基础配置

```typescript
import Redis from 'ioredis';

// 单节点连接
const redis = new Redis({
  host: '127.0.0.1',
  port: 6379,
  password: process.env.REDIS_PASSWORD,
  db: 0,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  connectTimeout: 10000,
});

// 事件监听
redis.on('connect', () => console.log('Redis 已连接'));
redis.on('error', (err) => console.error('Redis 错误:', err));
redis.on('close', () => console.warn('Redis 连接关闭'));

// 集群模式
const cluster = new Redis.Cluster(
  [
    {host: '192.168.1.1', port: 6379},
    {host: '192.168.1.2', port: 6379},
    {host: '192.168.1.3', port: 6379},
  ],
  {
    redisOptions: {password: process.env.REDIS_PASSWORD},
    scaleReads: 'slave', // 从节点读取
    maxRedirections: 16,
  },
);
```

## 缓存策略模式详解

### Cache-Aside（旁路缓存）

最常用的模式。应用代码同时管理缓存和数据库。

```typescript
class CacheAsideService {
  private readonly TTL = 3600; // 1小时

  async getUser(userId: number): Promise<User> {
    const cacheKey = `user:${userId}`;

    // 1. 先查缓存
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // 2. 缓存未命中，查数据库
    const user = await prisma.user.findUnique({where: {id: userId}});
    if (!user) throw new NotFoundError('用户不存在');

    // 3. 写入缓存
    await redis.setex(cacheKey, this.TTL, JSON.stringify(user));
    return user;
  }

  async updateUser(userId: number, data: UpdateUserDTO): Promise<User> {
    const user = await prisma.user.update({where: {id: userId}, data});
    // 更新时删除缓存（而非更新缓存，避免并发不一致）
    await redis.del(`user:${userId}`);
    return user;
  }
}
```

### Write-Through（写穿透）

写操作同时更新缓存和数据库，由缓存层负责写入数据库。

```typescript
class WriteThroughCache {
  async set(key: string, data: any, writeToDB: () => Promise<void>) {
    // 先写数据库
    await writeToDB();
    // 再更新缓存
    await redis.setex(key, 3600, JSON.stringify(data));
  }
}
```

### Write-Behind（写回）

写操作只更新缓存，异步批量写入数据库。提升写入性能但有数据丢失风险。

```typescript
class WriteBehindCache {
  private writeQueue: Map<string, any> = new Map();

  async set(key: string, data: any) {
    await redis.setex(key, 3600, JSON.stringify(data));
    this.writeQueue.set(key, data);
  }

  // 定时批量写入数据库
  startFlush(intervalMs = 5000) {
    setInterval(async () => {
      if (this.writeQueue.size === 0) return;
      const batch = new Map(this.writeQueue);
      this.writeQueue.clear();

      try {
        await this.batchWriteToDB(batch);
      } catch (err) {
        // 写入失败，重新加入队列
        batch.forEach((v, k) => this.writeQueue.set(k, v));
      }
    }, intervalMs);
  }
}
```

### Read-Through

缓存层自动从数据库加载数据，对应用透明。

```typescript
class ReadThroughCache {
  async get<T>(key: string, loader: () => Promise<T>, ttl = 3600): Promise<T> {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);

    const data = await loader();
    if (data) {
      await redis.setex(key, ttl, JSON.stringify(data));
    }
    return data;
  }
}

// 使用
const user = await cache.get(`user:${id}`, () => prisma.user.findUnique({where: {id}}), 1800);
```

## 缓存过期策略

| 策略     | 说明                 | 适用场景     |
| -------- | -------------------- | ------------ |
| 固定 TTL | 设置固定过期时间     | 大部分场景   |
| 随机 TTL | TTL + 随机偏移       | 防止缓存雪崩 |
| LRU 淘汰 | 最近最少使用淘汰     | 内存受限     |
| LFU 淘汰 | 最不经常使用淘汰     | 热点数据场景 |
| 缓存预热 | 启动时预加载热点数据 | 系统启动     |

```typescript
// 缓存预热示例
async function warmupCache() {
  console.log('开始缓存预热...');

  // 预热热门文章
  const hotPosts = await prisma.post.findMany({
    orderBy: {viewCount: 'desc'},
    take: 100,
  });

  const pipeline = redis.pipeline();
  hotPosts.forEach((post) => {
    pipeline.setex(`post:${post.id}`, 7200, JSON.stringify(post));
  });
  await pipeline.exec();

  console.log(`缓存预热完成，加载 ${hotPosts.length} 条数据`);
}
```

## 缓存问题与解决方案

:::warning 三大缓存问题

### 缓存穿透

**问题**：查询不存在的数据，请求直达数据库。
**解决方案**：

```typescript
// 方案1：缓存空值
async function getWithNullCache(key: string, loader: () => Promise<any>) {
  const cached = await redis.get(key);
  if (cached === 'NULL') return null; // 空值标记
  if (cached) return JSON.parse(cached);

  const data = await loader();
  if (data) {
    await redis.setex(key, 3600, JSON.stringify(data));
  } else {
    await redis.setex(key, 300, 'NULL'); // 缓存空值，短TTL
  }
  return data;
}

// 方案2：布隆过滤器
import {BloomFilter} from 'bloom-filters';
const filter = new BloomFilter(10000, 0.01);

// 启动时加载所有存在的ID
const allIds = await prisma.user.findMany({select: {id: true}});
allIds.forEach(({id}) => filter.add(id.toString()));

async function getUserSafe(userId: number) {
  if (!filter.has(userId.toString())) return null; // 一定不存在
  return getUser(userId);
}
```

### 缓存击穿

**问题**：热点 key 过期瞬间，大量并发请求直达数据库。

```typescript
// 互斥锁方案
async function getWithMutex(key: string, loader: () => Promise<any>) {
  let data = await redis.get(key);
  if (data) return JSON.parse(data);

  const lockKey = `lock:${key}`;
  const locked = await redis.set(lockKey, '1', 'EX', 10, 'NX');

  if (locked) {
    try {
      data = await loader();
      await redis.setex(key, 3600, JSON.stringify(data));
    } finally {
      await redis.del(lockKey);
    }
    return data;
  } else {
    // 未获得锁，等待后重试
    await new Promise((resolve) => setTimeout(resolve, 100));
    return getWithMutex(key, loader);
  }
}
```

### 缓存雪崩

**问题**：大量缓存同时过期，请求全部打到数据库。

```typescript
// 随机 TTL 方案
function randomTTL(baseTTL: number): number {
  const jitter = Math.floor(Math.random() * 300); // 0-300秒随机偏移
  return baseTTL + jitter;
}

await redis.setex(key, randomTTL(3600), JSON.stringify(data));
```

:::

## 分布式锁实现

```typescript
// Redlock 算法简化实现
class DistributedLock {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async acquire(resource: string, ttl = 10000): Promise<string | null> {
    const token = crypto.randomUUID();
    const result = await this.redis.set(`lock:${resource}`, token, 'PX', ttl, 'NX');
    return result === 'OK' ? token : null;
  }

  async release(resource: string, token: string): Promise<boolean> {
    // 使用 Lua 脚本保证原子性
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    const result = await this.redis.eval(script, 1, `lock:${resource}`, token);
    return result === 1;
  }

  async withLock<T>(resource: string, fn: () => Promise<T>, ttl = 10000): Promise<T> {
    const token = await this.acquire(resource, ttl);
    if (!token) throw new Error('获取锁失败');
    try {
      return await fn();
    } finally {
      await this.release(resource, token);
    }
  }
}

// 使用示例：秒杀扣库存
const lock = new DistributedLock(redis);
await lock.withLock('product:123:stock', async () => {
  const stock = await redis.get('product:123:stock');
  if (Number(stock) <= 0) throw new Error('库存不足');
  await redis.decr('product:123:stock');
  await prisma.order.create({data: {productId: 123, userId}});
});
```

## Session 共享方案

```typescript
// connect-redis 配置
import session from 'express-session';
import RedisStore from 'connect-redis';

app.use(
  session({
    store: new RedisStore({
      client: redis,
      prefix: 'sess:',
      ttl: 86400, // Session 过期时间（秒）
    }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {secure: true, httpOnly: true, maxAge: 86400000},
  }),
);
```

:::tip 多实例部署
使用 Redis 存储 Session 后，多个 Node.js 实例可以共享会话状态，实现无状态水平扩展。PM2 cluster 模式或 Kubernetes 多副本部署都不会丢失登录状态。
:::

## 面试高频题

:::info 面试题精选

**Q1: 缓存穿透、击穿、雪崩的区别和解决方案？**

穿透：查询不存在的数据（布隆过滤器+缓存空值）。击穿：热点 key 过期（互斥锁+逻辑过期）。雪崩：大量 key 同时过期（随机 TTL+多级缓存+熔断降级）。

**Q2: Redis 为什么这么快？**

① 纯内存操作 ② 单线程避免锁竞争和上下文切换 ③ IO 多路复用（epoll）④ 高效数据结构（跳表、压缩列表）⑤ 6.0+ 多线程网络 IO。

**Q3: 如何保证缓存和数据库的一致性？**

方案：① 先更新数据库再删除缓存（推荐）② 延迟双删 ③ 订阅 binlog 异步更新缓存（Canal）。不推荐先删缓存再更新数据库（有并发不一致窗口）。

**Q4: Redis 的持久化机制？RDB 和 AOF 的区别？**

RDB：定时快照，恢复快但可能丢数据。AOF：记录每次写命令，数据安全但文件大。混合持久化（Redis 4.0+）：RDB + 增量 AOF，兼顾性能和安全。

**Q5: 分布式锁的实现要点？为什么释放锁要用 Lua 脚本？**

要点：① SET NX EX 原子操作 ② 唯一标识（UUID）防止误释放 ③ TTL 防止死锁。Lua 脚本保证"检查持有者+删除"操作的原子性，避免竞态条件。

**Q6: Redis 内存淘汰策略有哪些？如何选择？**

noeviction（报错）、allkeys-lru、volatile-lru、allkeys-lfu、volatile-lfu、allkeys-random、volatile-random、volatile-ttl。缓存场景推荐 allkeys-lfu 或 allkeys-lru。
:::
