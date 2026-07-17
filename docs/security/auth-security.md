---
sidebar_position: 3
title: '认证与数据安全'
difficulty: 'hard'
tags: ['HTTPS', 'JWT', 'CORS', '数据安全']
---

# 认证与数据安全

## HTTPS 原理

### TLS 握手过程

HTTPS = HTTP + TLS，TLS（Transport Layer Security）为数据传输提供加密、完整性和身份认证。

```
┌────────┐                              ┌────────┐
│ Client │                              │ Server │
└───┬────┘                              └───┬────┘
    │                                       │
    │──── 1. ClientHello ──────────────────>│  支持的TLS版本、加密套件、随机数
    │                                       │
    │<─── 2. ServerHello ──────────────────│  选定的加密套件、随机数
    │<─── 3. Certificate ─────────────────│  服务器证书（含公钥）
    │<─── 4. ServerHelloDone ─────────────│
    │                                       │
    │──── 5. ClientKeyExchange ───────────>│  用服务器公钥加密的预主密钥
    │──── 6. ChangeCipherSpec ────────────>│  通知切换加密通信
    │──── 7. Finished ────────────────────>│  加密握手摘要验证
    │                                       │
    │<─── 8. ChangeCipherSpec ────────────│  通知切换加密通信
    │<─── 9. Finished ────────────────────│  加密握手摘要验证
    │                                       │
    │════ 加密数据传输 ══════════════════════│
```

:::info TLS 1.3 优化
TLS 1.3 将握手从 2-RTT 优化为 1-RTT，并支持 0-RTT 恢复连接。移除了不安全的加密算法（如 RSA 密钥交换、RC4、SHA-1）。
:::

### 证书体系

| 概念                   | 说明                                   | 作用                 |
| ---------------------- | -------------------------------------- | -------------------- |
| **CA（证书颁发机构）** | 可信第三方，如 Let's Encrypt、DigiCert | 签发和管理数字证书   |
| **根证书**             | 预装在浏览器/OS 中的 CA 证书           | 信任链的起点         |
| **中间证书**           | 由根 CA 签发的下级 CA 证书             | 隔离根证书，减少风险 |
| **服务器证书**         | 网站持有的证书                         | 证明服务器身份       |
| **证书链**             | 根证书 → 中间证书 → 服务器证书         | 逐级验证信任关系     |

```bash
# 查看证书链
openssl s_client -connect example.com:443 -showcerts

# 使用 Let's Encrypt 免费签发证书
certbot certonly --webroot -w /var/www/html -d example.com
```

### HSTS（HTTP Strict Transport Security）

```nginx
# Nginx 配置 HSTS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# Apache 配置
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
```

| 参数                | 说明                 | 建议值                 |
| ------------------- | -------------------- | ---------------------- |
| `max-age`           | HSTS 有效期（秒）    | 31536000（1年）        |
| `includeSubDomains` | 包含所有子域名       | 推荐开启               |
| `preload`           | 加入浏览器预加载列表 | 提交到 hstspreload.org |

:::warning HSTS 注意事项

- 首次配置建议用较短的 `max-age`（如 300 秒）测试
- 开启 `preload` 前确保所有子域名都支持 HTTPS
- HSTS 一旦生效，在 max-age 期间无法回退到 HTTP
  :::

---

## JWT 安全存储

### 存储方案对比

| 存储位置                       | XSS 风险             | CSRF 风险         | 容量   | 自动发送    | 推荐指数   |
| ------------------------------ | -------------------- | ----------------- | ------ | ----------- | ---------- |
| `localStorage`                 | ⚠️ 高（JS 可读）     | ✅ 安全           | 5-10MB | ❌ 需手动   | ⭐⭐       |
| `sessionStorage`               | ⚠️ 高（JS 可读）     | ✅ 安全           | 5-10MB | ❌ 需手动   | ⭐⭐       |
| `Cookie (httpOnly)`            | ✅ 安全（JS 不可读） | ⚠️ 高（自动携带） | 4KB    | ✅ 自动     | ⭐⭐⭐⭐   |
| `Cookie (httpOnly + SameSite)` | ✅ 安全              | ✅ 安全           | 4KB    | ✅ 同站自动 | ⭐⭐⭐⭐⭐ |
| 内存变量                       | ✅ 安全（刷新丢失）  | ✅ 安全           | 无限制 | ❌ 需手动   | ⭐⭐⭐     |

### 最佳实践：安全 Cookie 配置

```javascript
// 服务端设置 JWT Cookie
function setAuthCookie(res, token) {
  res.cookie('access_token', token, {
    httpOnly: true, // 防止 JS 读取（防 XSS）
    secure: true, // 仅 HTTPS 传输
    sameSite: 'Lax', // 防 CSRF
    maxAge: 15 * 60 * 1000, // 15分钟短期 Token
    path: '/',
    domain: '.example.com',
  });
}

// Refresh Token 使用更严格的配置
function setRefreshCookie(res, refreshToken) {
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict', // 更严格，防跨站
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
    path: '/api/auth/refresh', // 限制路径
  });
}
```

### Token 泄露应对方案

```javascript
// 1. Token 黑名单机制
const tokenBlacklist = new Set();

function revokeToken(token) {
  const decoded = jwt.decode(token);
  tokenBlacklist.add(decoded.jti); // 使用唯一 ID
}

function isTokenRevoked(token) {
  const decoded = jwt.decode(token);
  return tokenBlacklist.has(decoded.jti);
}

// 2. Token 轮转 + 短生命周期
function generateTokenPair(user) {
  const accessToken = jwt.sign({userId: user.id, role: user.role}, process.env.JWT_SECRET, {
    expiresIn: '15m',
    jwtid: crypto.randomUUID(),
  });

  const refreshToken = jwt.sign(
    {userId: user.id, tokenFamily: crypto.randomUUID()},
    process.env.REFRESH_SECRET,
    {expiresIn: '7d', jwtid: crypto.randomUUID()},
  );

  return {accessToken, refreshToken};
}

// 3. Refresh Token 轮转（检测泄露）
async function refreshAccessToken(req, res) {
  const {refresh_token} = req.cookies;
  const decoded = jwt.verify(refresh_token, process.env.REFRESH_SECRET);

  // 检查 Token Family 是否已被使用过（防止重放攻击）
  const isUsed = await db.isRefreshTokenUsed(decoded.jti);
  if (isUsed) {
    // 可能发生泄露，撤销整个 Token Family
    await db.revokeTokenFamily(decoded.tokenFamily);
    return res.status(401).json({error: '安全异常，请重新登录'});
  }

  await db.markRefreshTokenUsed(decoded.jti);
  const newTokens = generateTokenPair({id: decoded.userId});
  setAuthCookie(res, newTokens.accessToken);
  setRefreshCookie(res, newTokens.refreshToken);
}
```

---

## CORS 深入

### 同源策略详解

同源要求**协议 + 域名 + 端口**完全一致：

| URL                        | 与 `https://example.com` 同源？ | 原因                     |
| -------------------------- | ------------------------------- | ------------------------ |
| `https://example.com/page` | ✅ 是                           | 路径不同，其余相同       |
| `http://example.com`       | ❌ 否                           | 协议不同                 |
| `https://api.example.com`  | ❌ 否                           | 域名不同（子域也不同源） |
| `https://example.com:8080` | ❌ 否                           | 端口不同                 |

### 简单请求 vs 预检请求

| 特性             | 简单请求                                                           | 预检请求（Preflight）       |
| ---------------- | ------------------------------------------------------------------ | --------------------------- |
| **Method**       | GET / HEAD / POST                                                  | PUT / DELETE / PATCH 等     |
| **Headers**      | 仅安全头（Accept等）                                               | 自定义头（Authorization等） |
| **Content-Type** | text/plain、multipart/form-data、application/x-www-form-urlencoded | application/json 等         |
| **流程**         | 直接发送                                                           | 先发 OPTIONS 预检           |

```javascript
// 预检请求流程示例
// 1. 浏览器自动发送 OPTIONS 请求
// OPTIONS /api/data HTTP/1.1
// Origin: https://frontend.com
// Access-Control-Request-Method: POST
// Access-Control-Request-Headers: Content-Type, Authorization

// 2. 服务端响应
// Access-Control-Allow-Origin: https://frontend.com
// Access-Control-Allow-Methods: GET, POST, PUT, DELETE
// Access-Control-Allow-Headers: Content-Type, Authorization
// Access-Control-Max-Age: 86400
```

### 服务端完整 CORS 配置

```javascript
const cors = require('cors');

// 生产环境严格配置
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = ['https://app.example.com', 'https://admin.example.com'];
    // 允许无 Origin 的请求（如移动端 App）
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS 策略禁止'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Total-Count', 'X-Request-ID'],
  credentials: true, // 允许携带 Cookie
  maxAge: 86400, // 预检缓存 24 小时
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
```

### 常见 CORS 错误排查表

| 错误信息                                       | 原因                     | 解决方案                  |
| ---------------------------------------------- | ------------------------ | ------------------------- |
| `No 'Access-Control-Allow-Origin'`             | 服务端未设置响应头       | 添加 CORS 中间件          |
| `Credential is not supported if origin is '*'` | 使用了通配符+credentials | 指定具体 Origin           |
| `Method not allowed`                           | 预检未包含该方法         | 添加到 Allow-Methods      |
| `Header not allowed`                           | 自定义头未在白名单       | 添加到 Allow-Headers      |
| `Preflight response is not successful`         | OPTIONS 返回非 2xx       | 确保 OPTIONS 路由正确响应 |
| `Redirect is not allowed`                      | CORS 请求被重定向        | 避免对 API 路径做重定向   |

---

## Subresource Integrity (SRI)

### 原理与配置

SRI 通过对资源内容进行哈希校验，防止 CDN 被劫持后加载恶意代码。

```html
<!-- 带 SRI 校验的资源加载 -->
<script
  src="https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js"
  integrity="sha384-O+wPGbnXCmMKbhSPqZ9xiUNqZGaFMYG7m0e4K5MzDHCjyQkHn3MgSOGmMd2QHKA"
  crossorigin="anonymous"
></script>

<link
  rel="stylesheet"
  href="https://cdn.example.com/styles.css"
  integrity="sha384-abc123..."
  crossorigin="anonymous"
/>
```

```bash
# 生成 SRI hash
openssl dgst -sha384 -binary file.js | openssl base64 -A
# 或使用 shasum
cat file.js | shasum -b -a 384 | xxd -r -p | base64
```

### 自动化工具集成

```javascript
// webpack 插件自动生成 SRI
// webpack.config.js
const SriPlugin = require('webpack-subresource-integrity');

module.exports = {
  output: {crossOriginLoading: 'anonymous'},
  plugins: [
    new SriPlugin({
      hashFuncNames: ['sha384'],
      enabled: process.env.NODE_ENV === 'production',
    }),
  ],
};
```

---

## 敏感数据处理

### 前端数据脱敏方案

```javascript
/**
 * 前端数据脱敏工具集
 */
const DataMasking = {
  // 手机号脱敏：138****8888
  phone(value) {
    if (!value || value.length !== 11) return value;
    return value.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  },

  // 身份证脱敏：110***********1234
  idCard(value) {
    if (!value || value.length < 15) return value;
    return value.replace(/(\d{3})\d+(\d{4})/, '$1***********$2');
  },

  // 银行卡脱敏：**** **** **** 1234
  bankCard(value) {
    if (!value || value.length < 8) return value;
    return `**** **** **** ${value.slice(-4)}`;
  },

  // 邮箱脱敏：u***@example.com
  email(value) {
    if (!value || !value.includes('@')) return value;
    const [name, domain] = value.split('@');
    const masked = name[0] + '***';
    return `${masked}@${domain}`;
  },

  // 姓名脱敏：张*明
  name(value) {
    if (!value || value.length < 2) return value;
    if (value.length === 2) return value[0] + '*';
    return value[0] + '*'.repeat(value.length - 2) + value.slice(-1);
  },
};
```

### Web Crypto API 加密

```javascript
/**
 * 使用 Web Crypto API 进行前端加密
 */
class CryptoHelper {
  // AES-GCM 加密
  static async encrypt(plaintext, key) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV

    const encrypted = await crypto.subtle.encrypt({name: 'AES-GCM', iv}, key, data);

    // 返回 IV + 密文（Base64）
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    return btoa(String.fromCharCode(...combined));
  }

  // AES-GCM 解密
  static async decrypt(ciphertext, key) {
    const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt({name: 'AES-GCM', iv}, key, data);

    return new TextDecoder().decode(decrypted);
  }

  // 生成 AES 密钥
  static async generateKey() {
    return crypto.subtle.generateKey({name: 'AES-GCM', length: 256}, true, ['encrypt', 'decrypt']);
  }

  // 密码哈希（用于前端预处理，服务端仍需二次哈希）
  static async hashPassword(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
      'deriveBits',
    ]);
    const hash = await crypto.subtle.deriveBits(
      {name: 'PBKDF2', salt: encoder.encode(salt), iterations: 100000, hash: 'SHA-256'},
      keyMaterial,
      256,
    );
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
```

### 密码安全：前端应该和不应该做什么

:::warning 前端密码处理原则
**前端不应该做的事：**

- ❌ 明文存储密码（localStorage/sessionStorage/Cookie）
- ❌ 使用简单 MD5/SHA 哈希（彩虹表可破解）
- ❌ 在 URL 参数中传输密码
- ❌ 在前端实现完整的密码验证逻辑
- ❌ 将密码写入日志或错误报告

**前端应该做的事：**

- ✅ 使用 HTTPS 传输
- ✅ 可选：前端预哈希（PBKDF2）减少明文暴露窗口
- ✅ 密码强度实时校验（UI 反馈）
- ✅ 提交后立即清除内存中的密码
- ✅ 使用 `autocomplete="new-password"` 提示浏览器密码管理
  :::

```javascript
// 密码强度校验
function checkPasswordStrength(password) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;
  const levels = ['极弱', '弱', '中等', '强', '极强'];
  return {score, level: levels[score - 1] || '极弱', checks};
}

// 提交后清除密码
function handleLogin(form) {
  const password = form.password.value;
  submitLogin({username: form.username.value, password}).finally(() => {
    form.password.value = ''; // 清除 DOM 中的密码
  });
}
```

---

## 面试高频题

### Q1: HTTPS 能防止中间人攻击吗？什么场景下不能？

:::tip 参考答案
HTTPS 在正常情况下可以有效防止中间人攻击。但以下场景可能失效：

1. **用户主动忽略证书警告**：点击"继续访问不安全网站"
2. **设备安装了恶意根证书**：企业代理、恶意软件
3. **首次访问未配置 HSTS**：可能被 SSL Strip 降级
4. **CA 被攻破**：证书被冒名签发（极罕见）

应对措施：使用 HSTS preload、证书透明度（CT）、HPKP（已废弃，被 CT 替代）。
:::

### Q2: JWT 存在 localStorage 有什么风险？如何解决？

风险：XSS 攻击可以通过 JavaScript 读取 localStorage 中的 JWT。  
解决方案：

1. 使用 httpOnly + Secure + SameSite Cookie 存储
2. Access Token 短期有效（15分钟）
3. Refresh Token 存储在严格路径限制的 Cookie 中
4. 配合 CSP 降低 XSS 风险

### Q3: CORS 预检请求的目的是什么？可以跳过吗？

预检请求目的：在实际请求前询问服务器是否允许该跨域请求，保护老旧服务器不被新型请求攻击。不能跳过，但可以通过 `Access-Control-Max-Age` 缓存预检结果减少请求次数。

### Q4: 为什么前端不应该进行密码加密存储？

前端代码对用户完全透明，加密密钥无法安全存储在前端。所有密码的安全哈希和存储必须在服务端完成（使用 bcrypt/argon2）。前端可以做密码强度校验和可选的预哈希传输。

### Q5: SRI 的局限性是什么？

1. 只适用于静态资源，动态生成的脚本无法使用
2. 资源更新时需要同步更新 hash
3. 不能防止脚本执行后的运行时攻击
4. 需要配合 `crossorigin` 属性使用
5. 不支持通过 `@import` 加载的 CSS 子资源

### Q6: 如何设计一个安全的 Token 刷新机制？

1. Access Token 短期（15分钟）+ Refresh Token 长期（7天）
2. Refresh Token 使用轮转机制（每次刷新生成新的 Refresh Token）
3. 检测 Refresh Token 重放（Token Family 机制）
4. 异常时撤销整个 Token Family
5. Refresh Token 限制使用路径和 IP
