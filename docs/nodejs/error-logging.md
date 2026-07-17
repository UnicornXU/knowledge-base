---
sidebar_position: 10
title: "错误处理与日志系统"
difficulty: "medium"
tags: ["nodejs", "错误处理", "日志", "监控"]
---

# 错误处理与日志系统

健壮的错误处理和完善的日志系统是生产环境应用的基石。本文系统讲解 Node.js 错误分类、全局错误策略、自定义错误体系、日志实践和错误追踪集成。

## Node.js 错误分类

| 错误类型 | 触发方式 | 示例 | 处理方式 |
|---------|---------|------|---------|
| 同步错误 | throw | JSON.parse 失败 | try/catch |
| 异步回调错误 | callback(err) | fs.readFile 失败 | error-first 回调 |
| Promise 拒绝 | reject / throw in async | API 请求失败 | .catch() / try-catch |
| 未捕获异常 | 无处处理的 throw | 代码逻辑 bug | process.on('uncaughtException') |
| 未处理 Promise 拒绝 | 无 .catch 的 reject | 忘记 await | process.on('unhandledRejection') |
| EventEmitter 错误 | emitter.emit('error') | Stream 错误 | emitter.on('error') |

:::warning 重要区分
- **可预期错误（Operational Errors）**：网络超时、数据库连接失败、参数验证失败 → 应该优雅处理并响应用户
- **编程错误（Programmer Errors）**：undefined 引用、类型错误、逻辑 bug → 应该修复代码，生产中记录并重启
:::

## 全局错误处理策略

### 进程级错误捕获

```typescript
// 未捕获异常 - 通常意味着程序状态不可预知
process.on('uncaughtException', (error: Error) => {
  logger.fatal({ err: error }, '未捕获异常，进程即将退出');
  
  // 尝试优雅关闭
  gracefulShutdown().finally(() => {
    process.exit(1);  // 必须退出，状态可能已损坏
  });
});

// 未处理的 Promise 拒绝
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error({ err: reason }, '未处理的 Promise 拒绝');
  // Node.js 15+ 默认会终止进程
  // 建议：和 uncaughtException 相同处理
});

// 优雅关闭
async function gracefulShutdown() {
  logger.info('开始优雅关闭...');
  
  // 停止接收新请求
  server.close();
  
  // 关闭数据库连接
  await prisma.$disconnect();
  
  // 关闭 Redis 连接
  await redis.quit();
  
  // 刷新日志缓冲区
  await logger.flush();
  
  logger.info('优雅关闭完成');
}

// 处理进程信号
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
```

### Express 错误中间件

```typescript
import { Request, Response, NextFunction } from 'express';

// 异步错误包装器
function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 404 处理
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 404,
    code: 'NOT_FOUND',
    message: `路径 ${req.method} ${req.path} 不存在`,
    timestamp: new Date().toISOString()
  });
});

// 全局错误处理中间件（必须有4个参数）
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // 判断是否是已知的业务错误
  if (err instanceof AppError) {
    logger.warn({ err, requestId: req.id, path: req.path }, err.message);
    return res.status(err.statusCode).json({
      status: err.statusCode,
      code: err.code,
      message: err.message,
      details: err.details,
      requestId: req.id
    });
  }

  // 未知错误 - 不暴露内部信息
  logger.error({ err, requestId: req.id, path: req.path, body: req.body }, '未知服务器错误');
  
  res.status(500).json({
    status: 500,
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production' 
      ? '服务器内部错误' 
      : err.message,
    requestId: req.id
  });
});
```

## 自定义错误类层次

```typescript
// errors/AppError.ts
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(message: string, statusCode: number, code: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;  // 标记为可预期错误
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

// errors/ValidationError.ts
export class ValidationError extends AppError {
  constructor(details: { field: string; message: string }[]) {
    super('请求参数验证失败', 422, 'VALIDATION_ERROR', details);
  }
}

// errors/NotFoundError.ts
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string | number) {
    super(
      id ? `${resource} (ID: ${id}) 不存在` : `${resource} 不存在`,
      404, 'NOT_FOUND'
    );
  }
}

// errors/AuthError.ts
export class AuthError extends AppError {
  constructor(message = '认证失败', code = 'AUTH_FAILED') {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = '权限不足') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

// 使用示例
app.get('/api/posts/:id', asyncHandler(async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: Number(req.params.id) } });
  if (!post) throw new NotFoundError('文章', req.params.id);
  res.json({ data: post });
}));
```

## 日志库对比

| 特性 | Winston | Pino | Bunyan |
|------|---------|------|--------|
| 性能 | 中等 | ⭐ 极快（5x Winston） | 良好 |
| JSON 格式 | 支持 | 默认 JSON | 默认 JSON |
| 传输目标 | 多种 Transport | 文件/stdout | Stream |
| 日志级别 | 自定义 | 标准 6 级 | 标准 6 级 |
| 子 Logger | 支持 | 支持（child） | 支持 |
| 生态丰富度 | 极高 | 高 | 中 |
| 适用场景 | 通用、自定义需求多 | 高性能、生产推荐 | 传统 Node.js |

### Pino 配置实践

```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'SYS:standard' }
  } : undefined,
  base: {
    service: 'blog-api',
    env: process.env.NODE_ENV
  },
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res
  },
  redact: ['req.headers.authorization', 'req.body.password']  // 敏感信息脱敏
});

export default logger;
```

## 结构化日志实践

### 请求 ID 追踪

```typescript
import { randomUUID } from 'crypto';

// 中间件：注入请求 ID
app.use((req: Request, res: Response, next: NextFunction) => {
  req.id = req.headers['x-request-id'] as string || randomUUID();
  res.setHeader('X-Request-Id', req.id);
  
  // 创建请求级别的 child logger
  req.logger = logger.child({ requestId: req.id, method: req.method, path: req.path });
  next();
});

// 请求日志中间件
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length'),
      userAgent: req.get('user-agent'),
      ip: req.ip
    };

    if (res.statusCode >= 500) {
      req.logger.error(logData, '请求完成 - 服务器错误');
    } else if (res.statusCode >= 400) {
      req.logger.warn(logData, '请求完成 - 客户端错误');
    } else {
      req.logger.info(logData, '请求完成');
    }
  });
  next();
});
```

### 日志级别规范

| 级别 | 用途 | 示例 |
|------|------|------|
| fatal | 系统崩溃 | 无法连接数据库导致启动失败 |
| error | 运行时错误 | API 调用失败、未知异常 |
| warn | 潜在问题 | 请求参数异常、接近阈值 |
| info | 关键业务事件 | 用户注册、订单创建 |
| debug | 调试信息 | 函数入参、中间状态 |
| trace | 极细粒度 | 循环每次迭代、SQL 语句 |

## 错误追踪集成（Sentry）

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: `blog-api@${process.env.npm_package_version}`,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
    new Sentry.Integrations.Prisma({ client: prisma })
  ],
  beforeSend(event) {
    // 过滤掉可预期的业务错误
    if (event.extra?.isOperational) return null;
    return event;
  }
});

// Sentry 中间件（必须在路由之前）
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// 路由...

// Sentry 错误处理（在自定义错误中间件之前）
app.use(Sentry.Handlers.errorHandler({
  shouldHandleError(error) {
    // 只上报 5xx 错误
    return !(error instanceof AppError) || error.statusCode >= 500;
  }
}));

// 手动捕获错误
function captureWithContext(error: Error, context: Record<string, any>) {
  Sentry.withScope((scope) => {
    scope.setExtras(context);
    scope.setTag('module', context.module);
    Sentry.captureException(error);
  });
}
```

## 生产环境最佳实践

### 日志轮转配置

```typescript
// 使用 pino 配合 logrotate 或 pino-roll
import { multistream } from 'pino';
import { createStream } from 'rotating-file-stream';

const errorStream = createStream('error.log', {
  interval: '1d',       // 每天轮转
  maxFiles: 30,         // 保留 30 天
  path: './logs',
  compress: 'gzip'      // 压缩旧日志
});

const combinedStream = createStream('combined.log', {
  interval: '1d',
  maxFiles: 14,
  path: './logs',
  size: '100M'          // 或按大小轮转
});

const streams = [
  { level: 'info', stream: combinedStream },
  { level: 'error', stream: errorStream },
  { stream: process.stdout }  // 同时输出到控制台
];

const logger = pino({ level: 'info' }, multistream(streams));
```

### 敏感信息脱敏

```typescript
// 脱敏工具函数
function sanitize(obj: any, sensitiveFields: string[]): any {
  const sanitized = { ...obj };
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  }
  return sanitized;
}

// Pino 内置 redact 功能
const logger = pino({
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.creditCard',
      '*.token',
      '*.secret'
    ],
    censor: '[REDACTED]'
  }
});
```

:::tip 生产环境 Checklist
- ✅ 所有异步操作都有错误处理
- ✅ 全局 uncaughtException / unhandledRejection 处理
- ✅ 结构化 JSON 日志
- ✅ 请求 ID 全链路追踪
- ✅ 敏感信息脱敏
- ✅ 日志分级 + 日志轮转
- ✅ 错误追踪平台集成（Sentry）
- ✅ 优雅关闭（Graceful Shutdown）
- ✅ 健康检查端点 `/health`
:::

## 面试高频题

:::info 面试题精选

**Q1: uncaughtException 和 unhandledRejection 的区别？该如何处理？**

uncaughtException 是同步代码抛出未被 try-catch 捕获的异常；unhandledRejection 是 Promise reject 后没有 .catch 处理。两者都应记录日志并优雅退出进程（因为应用状态可能已不一致）。

**Q2: 为什么生产环境不应该把错误详情返回给前端？**

安全原因：堆栈信息可能暴露文件路径、依赖版本、数据库结构等敏感信息，给攻击者提供攻击面。应该返回通用错误信息 + 请求 ID，详细错误只记录在日志系统中。

**Q3: 如何实现全链路请求追踪？**

方案：① 网关/中间件生成唯一 requestId ② 所有日志携带 requestId ③ 跨服务调用传递 requestId（通过 Header）④ 日志平台按 requestId 聚合查询。Node.js 可用 AsyncLocalStorage 实现自动透传。

**Q4: Winston 和 Pino 该如何选择？**

性能要求高选 Pino（快 5 倍以上，低 CPU 开销）；需要丰富 Transport（如 Elasticsearch、CloudWatch）选 Winston；新项目推荐 Pino + pino-pretty（开发）+ JSON stdout（生产配合日志收集器）。

**Q5: 什么是"优雅关闭"？为什么需要？**

优雅关闭 = 收到终止信号后，停止接收新请求 → 等待进行中请求完成 → 关闭数据库/Redis连接 → 刷新日志 → 退出进程。避免请求中断、数据不一致、连接泄漏。Kubernetes 发送 SIGTERM 后默认等待 30 秒才强制终止。
:::
