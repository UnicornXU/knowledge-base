---
sidebar_position: 7
title: "身份认证与授权"
difficulty: "hard"
tags: ["nodejs", "认证", "JWT", "OAuth", "安全"]
---

# 身份认证与授权

身份认证（Authentication）确认"你是谁"，授权（Authorization）决定"你能做什么"。本文系统讲解 Node.js 中主流的认证方案、权限模型和安全实践。

## 认证方案对比

| 特性 | Session-based | JWT | OAuth 2.0 |
|------|--------------|-----|-----------|
| 原理 | 服务端存储会话状态 | 客户端持有签名令牌 | 第三方授权委托 |
| 状态管理 | 有状态（服务端） | 无状态（客户端） | 混合 |
| 存储位置 | 服务端内存/Redis | 客户端（Cookie/Storage） | 授权服务器 |
| 扩展性 | 需共享 Session | 天然分布式 | 独立授权中心 |
| 安全性 | CSRF 风险 | XSS 泄露风险 | 较高（标准协议） |
| 适用场景 | 传统 Web 应用 | SPA/移动端/微服务 | 第三方登录/开放平台 |
| 注销能力 | 即时（删除 Session） | 困难（需黑名单） | 撤销 Token |
| 性能开销 | 每次查询 Session 存储 | 仅验证签名 | 依赖授权服务器 |

## Session-based 认证

### 原理与流程

1. 用户提交用户名密码
2. 服务端验证后创建 Session，生成 Session ID
3. Session ID 通过 Set-Cookie 返回客户端
4. 后续请求自动携带 Cookie，服务端查找对应 Session

### Express Session 配置

```typescript
import express from 'express';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

const redisClient = createClient({ url: 'redis://localhost:6379' });
await redisClient.connect();

const app = express();

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  name: 'sid',  // 自定义 cookie 名称，避免暴露技术栈
  cookie: {
    httpOnly: true,    // 防止 XSS 读取
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',   // CSRF 防护
    maxAge: 24 * 60 * 60 * 1000  // 24小时
  }
}));

// 登录接口
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).json({ error: '邮箱或密码错误' });
  }

  req.session.userId = user.id;
  req.session.role = user.role;
  res.json({ user: { id: user.id, name: user.name, role: user.role } });
});

// 登出
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    res.clearCookie('sid');
    res.json({ message: '已退出登录' });
  });
});
```

:::warning CSRF 防护
Session 认证必须防范 CSRF 攻击。推荐方案：
1. **SameSite Cookie**：设置 `sameSite: 'strict'` 或 `'lax'`
2. **CSRF Token**：使用 `csurf` 中间件生成 Token
3. **检查 Origin/Referer Header**
:::

## JWT 认证完整实现

### 双 Token 方案

```typescript
import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET!;

interface TokenPayload {
  userId: number;
  role: string;
}

// 生成 Token 对
function generateTokens(payload: TokenPayload) {
  const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

// 登录接口
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).json({ error: '认证失败' });
  }

  const tokens = generateTokens({ userId: user.id, role: user.role });

  // Refresh Token 存入 httpOnly Cookie
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth/refresh'
  });

  // Access Token 返回给前端
  res.json({ accessToken: tokens.accessToken, user: { id: user.id, name: user.name } });
});

// Token 刷新
app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) return res.status(401).json({ error: '未提供 Refresh Token' });

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET) as TokenPayload;
    
    // 检查 Token 是否在黑名单中（用于注销）
    const isBlacklisted = await redis.get(`bl_${refreshToken}`);
    if (isBlacklisted) return res.status(401).json({ error: 'Token 已失效' });

    const tokens = generateTokens({ userId: payload.userId, role: payload.role });
    
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true, secure: true, sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, path: '/api/auth/refresh'
    });
    
    res.json({ accessToken: tokens.accessToken });
  } catch {
    res.status(401).json({ error: 'Refresh Token 无效或已过期' });
  }
});
```

### 认证中间件

```typescript
// middleware/auth.ts
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: '缺少认证信息' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, ACCESS_SECRET) as TokenPayload;
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token 已过期', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Token 无效' });
  }
}
```

## OAuth 2.0 实战

### 四种授权模式

| 模式 | 适用场景 | 安全性 |
|------|---------|--------|
| 授权码模式 (Authorization Code) | Web 服务端应用 | 最高 |
| 授权码 + PKCE | SPA / 移动端 | 高 |
| 客户端凭证 (Client Credentials) | 服务间通信 | 高（无用户参与） |
| 设备授权 (Device Code) | 智能电视/CLI 工具 | 中 |

:::info
隐式模式（Implicit）和密码模式（Resource Owner Password）已不推荐使用。
:::

### GitHub 第三方登录

```typescript
import axios from 'axios';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!;
const REDIRECT_URI = 'http://localhost:3000/api/auth/github/callback';

// 1. 引导用户授权
app.get('/api/auth/github', (req, res) => {
  const state = crypto.randomUUID(); // 防 CSRF
  req.session.oauthState = state;
  
  const url = `https://github.com/login/oauth/authorize?` +
    `client_id=${GITHUB_CLIENT_ID}&redirect_uri=${REDIRECT_URI}` +
    `&scope=user:email&state=${state}`;
  res.redirect(url);
});

// 2. 授权回调
app.get('/api/auth/github/callback', async (req, res) => {
  const { code, state } = req.query;
  
  // 验证 state 防止 CSRF
  if (state !== req.session.oauthState) {
    return res.status(403).json({ error: 'State 验证失败' });
  }

  // 3. 用 code 换取 access_token
  const tokenRes = await axios.post('https://github.com/login/oauth/access_token', {
    client_id: GITHUB_CLIENT_ID,
    client_secret: GITHUB_CLIENT_SECRET,
    code, redirect_uri: REDIRECT_URI
  }, { headers: { Accept: 'application/json' } });

  const { access_token } = tokenRes.data;

  // 4. 获取用户信息
  const userRes = await axios.get('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${access_token}` }
  });

  // 5. 查找或创建用户
  const user = await prisma.user.upsert({
    where: { githubId: userRes.data.id.toString() },
    update: { name: userRes.data.name, avatar: userRes.data.avatar_url },
    create: {
      githubId: userRes.data.id.toString(),
      email: userRes.data.email,
      name: userRes.data.name,
      avatar: userRes.data.avatar_url
    }
  });

  // 6. 签发应用自己的 Token
  const tokens = generateTokens({ userId: user.id, role: user.role });
  res.redirect(`/auth/success?token=${tokens.accessToken}`);
});
```

## RBAC 权限模型

### 角色-权限设计

```typescript
// 权限定义
const PERMISSIONS = {
  'post:read': '查看文章',
  'post:create': '创建文章',
  'post:update': '编辑文章',
  'post:delete': '删除文章',
  'user:manage': '管理用户',
  'system:config': '系统配置'
} as const;

// 角色-权限映射
const ROLE_PERMISSIONS: Record<string, string[]> = {
  USER: ['post:read'],
  EDITOR: ['post:read', 'post:create', 'post:update'],
  ADMIN: ['post:read', 'post:create', 'post:update', 'post:delete', 'user:manage'],
  SUPER_ADMIN: Object.keys(PERMISSIONS)
};

// 权限检查中间件
function requirePermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    if (!userRole) return res.status(401).json({ error: '未认证' });

    const userPermissions = ROLE_PERMISSIONS[userRole] || [];
    const hasPermission = permissions.every(p => userPermissions.includes(p));

    if (!hasPermission) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
}

// 使用示例
app.delete('/api/posts/:id', authenticate, requirePermission('post:delete'), deletePost);
app.get('/api/admin/users', authenticate, requirePermission('user:manage'), listUsers);
```

## Token 安全存储

| 存储方式 | XSS 防护 | CSRF 防护 | 适用场景 |
|---------|----------|----------|---------|
| httpOnly Cookie | ✅ JS 无法读取 | ❌ 需额外防护 | SSR 应用 |
| localStorage | ❌ XSS 可读取 | ✅ 不自动发送 | 非敏感应用 |
| 内存变量 | ✅ 页面关闭即清除 | ✅ 不持久化 | 高安全要求 SPA |
| httpOnly Cookie + CSRF Token | ✅ | ✅ | 推荐方案 |

:::tip 推荐存储方案
**Access Token**：存储在内存变量中（JS 闭包/状态管理），刷新页面时通过 Refresh Token 重新获取。
**Refresh Token**：存储在 httpOnly、Secure、SameSite=Strict 的 Cookie 中。
这样既防 XSS（Token 不在 Storage 中），又防 CSRF（Access Token 不在 Cookie 中）。
:::

## 面试高频题

:::info 面试题精选

**Q1: JWT 和 Session 的核心区别是什么？各自适合什么场景？**

Session 是有状态的，服务端存储会话数据；JWT 是无状态的，信息编码在 Token 中。Session 适合传统 MPA 应用、需要即时注销的场景；JWT 适合分布式系统、微服务、移动端、SPA。

**Q2: JWT 如何实现"注销"功能？**

方案：① Token 黑名单（Redis 存储已注销 Token 的 jti）②短过期时间 + Refresh Token 旋转 ③ 修改签名密钥（会影响所有用户）。推荐方案①配合短期 Access Token。

**Q3: Access Token 和 Refresh Token 为什么要分开？**

Access Token 短效期（15min），频繁使用，泄露风险窗口小。Refresh Token 长效期（7d），仅用于刷新，存储在 httpOnly Cookie 中更安全。分离实现了安全性和用户体验的平衡。

**Q4: OAuth 2.0 中 state 参数的作用？**

防止 CSRF 攻击。攻击者可能构造恶意授权链接，引导用户将攻击者的账号绑定到受害者账户。state 是一次性随机值，回调时验证一致性即可防范。

**Q5: 如何设计一个支持多租户的权限系统？**

方案：RBAC + 租户隔离。每个租户有独立的角色和权限配置。数据层通过 tenant_id 隔离，中间件验证用户的租户归属和对应权限。

**Q6: 前端如何安全存储 Token？localStorage 有什么问题？**

localStorage 容易被 XSS 攻击读取。推荐：Access Token 存内存，Refresh Token 存 httpOnly Cookie。配合 Content-Security-Policy 和输入过滤进一步加固。
:::

## 实战案例：完整认证流程

```typescript
// 整合：注册 → 登录 → 认证 → 授权 完整链路
class AuthService {
  async register(data: RegisterDTO) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) throw new ConflictError('邮箱已注册');

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: { ...data, password: hashedPassword }
    });

    // 发送验证邮件
    await emailService.sendVerification(user.email, user.id);
    return { message: '注册成功，请验证邮箱' };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.emailVerified) throw new AuthError('账户未验证或不存在');
    if (!await bcrypt.compare(password, user.password)) {
      await this.recordFailedAttempt(email);  // 登录失败计数
      throw new AuthError('密码错误');
    }
    await this.clearFailedAttempts(email);
    return generateTokens({ userId: user.id, role: user.role });
  }
}
```
