---
sidebar_position: 11
title: "CSRF 攻击详解与防御"
difficulty: "hard"
tags: ["network", "security", "csrf", "cookie", "frontend"]
---

# CSRF 攻击详解与防御

> **"CSRF 是一种借刀杀人式的攻击"** —— 攻击者利用用户已登录的身份，在用户不知情的情况下以用户身份执行操作。

## 一、CSRF 攻击原理

### 1.1 什么是 CSRF？

```
CSRF（Cross-Site Request Forgery）跨站请求伪造
═══════════════════════════════════════════════════════

核心思想：
攻击者诱导用户在已登录目标网站的状态下，访问攻击者控制的页面
该页面自动向目标网站发送请求，浏览器自动携带 Cookie
目标服务器无法区分这是用户本人操作还是攻击者伪造

前提条件：
1. 用户已登录目标网站（浏览器中存在有效的 Cookie）
2. 目标网站只依赖 Cookie 进行身份验证
3. 用户访问了攻击者构造的恶意页面
```

### 1.2 CSRF 攻击流程

```
CSRF 攻击完整流程
═══════════════════════════════════════════════════════

步骤 1：用户登录银行网站
   用户 → 浏览器 Cookie 存储了 session_id

步骤 2：用户未退出银行，访问了恶意网站
   用户 → 访问 evil.com（攻击者控制的网站）

步骤 3：恶意网站自动发送请求
   evil.com 页面中的代码：
   <img src="https://bank.com/transfer?to=attacker&amount=10000">

步骤 4：浏览器自动携带 Cookie
   浏览器 → bank.com/transfer（自动带上 bank.com 的 Cookie）

步骤 5：服务器无法区分
   bank.com 服务器 → 看到有效的 Cookie → 执行转账操作

结果：用户在不知情的情况下转出了 10000 元
```

### 1.3 为什么浏览器会自动携带 Cookie？

```
浏览器 Cookie 发送机制
═══════════════════════════════════════════════════════

当浏览器向某个域名发送请求时，会自动附带该域名下的所有 Cookie
这是 HTTP 协议的设计，与请求的发起方无关

关键点：
- Cookie 是跟着域名走的，不是跟着发起方走的
- 从 evil.com 发起的对 bank.com 的请求，浏览器仍然会携带 bank.com 的 Cookie
- 这正是 CSRF 攻击成立的根本原因
```

## 二、CSRF 攻击方式

### 2.1 GET 类型 CSRF

```html
<!-- ===== GET 请求 CSRF（最简单） ===== -->

<!-- 方式 1：img 标签（自动发起 GET 请求） -->
<img src="https://bank.com/transfer?to=attacker&amount=10000" />

<!-- 方式 2：script 标签 -->
<script src="https://bank.com/api/user/info"></script>

<!-- 方式 3：link 标签 -->
<link href="https://bank.com/transfer?to=attacker" rel="stylesheet" />

<!-- 方式 4：iframe -->
<iframe src="https://bank.com/transfer?to=attacker&amount=10000"></iframe>

<!-- 方式 5：CSS background -->
<style>
  body {
    background: url('https://bank.com/transfer?to=attacker&amount=10000');
  }
</style>
```

### 2.2 POST 类型 CSRF

```html
<!-- ===== POST 请求 CSRF ===== -->

<!-- 方式 1：自动提交的表单 -->
<body onload="document.getElementById('csrf-form').submit()">
  <form id="csrf-form" action="https://bank.com/transfer" method="POST">
    <input type="hidden" name="to" value="attacker" />
    <input type="hidden" name="amount" value="10000" />
  </form>
</body>

<!-- 方式 2：JavaScript 自动提交 -->
<script>
  const form = document.createElement('form');
  form.action = 'https://bank.com/transfer';
  form.method = 'POST';

  const toInput = document.createElement('input');
  toInput.name = 'to';
  toInput.value = 'attacker';
  form.appendChild(toInput);

  const amountInput = document.createElement('input');
  amountInput.name = 'amount';
  amountInput.value = '10000';
  form.appendChild(amountInput);

  document.body.appendChild(form);
  form.submit();
</script>

<!-- 方式 3：fetch 请求（简单请求不会触发预检） -->
<script>
  fetch('https://bank.com/transfer', {
    method: 'POST',
    credentials: 'include',  // 携带 Cookie
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'to=attacker&amount=10000'
  });
</script>
```

### 2.3 JSON CSRF

```html
<!-- ===== JSON 接口 CSRF ===== -->

<!-- 利用 form 的 enctype 属性发送 JSON -->
<form action="https://api.example.com/transfer" method="POST"
      enctype="text/plain">
  <!-- 构造一个以 JSON 开头的请求体 -->
  <input name='{"to":"attacker","amount":10000,"ignore":"' value='"}' />
  <!-- 最终请求体：{"to":"attacker","amount":10000,"ignore":"="} -->
</form>

<!-- 利用 Flash（已过时，但了解一下） -->
<!-- 旧版 Flash 允许发送任意 Content-Type 的跨域请求 -->
```

## 三、CSRF 防御手段

### 3.1 CSRF Token 验证（最常用）

```javascript
// ===== 服务端生成并验证 CSRF Token =====

const crypto = require('crypto');
const express = require('express');
const app = express();

// 生成 CSRF Token
function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

// 中间件：为每个请求生成 Token
app.use((req, res, next) => {
  if (req.method === 'GET') {
    // GET 请求：生成 Token 并存储在 Session 中
    req.session.csrfToken = generateCsrfToken();
  }
  next();
});

// 渲染页面时将 Token 嵌入表单
app.get('/transfer', (req, res) => {
  res.send(`
    <form action="/transfer" method="POST">
      <input type="hidden" name="_csrf" value="${req.session.csrfToken}" />
      <input type="text" name="to" />
      <input type="number" name="amount" />
      <button type="submit">转账</button>
    </form>
  `);
});

// POST 请求：验证 Token
app.post('/transfer', (req, res) => {
  const token = req.body._csrf || req.headers['x-csrf-token'];

  if (!token || token !== req.session.csrfToken) {
    return res.status(403).json({ error: 'CSRF Token 验证失败' });
  }

  // Token 验证通过，执行业务逻辑
  res.json({ success: true });
});
```

```javascript
// ===== 前端自动携带 CSRF Token =====

// 方式 1：在 Axios 请求拦截器中自动添加
import axios from 'axios';

axios.interceptors.request.use(config => {
  // 从 cookie 中读取 CSRF Token
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf_token='))
    ?.split('=')[1];

  if (token) {
    config.headers['X-CSRF-Token'] = token;
  }
  return config;
});

// 方式 2：在 Fetch 请求中手动添加
async function transfer(to, amount) {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;

  const response = await fetch('/api/transfer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({ to, amount })
  });

  return response.json();
}
```

### 3.2 SameSite Cookie（最简单有效）

```javascript
// ===== SameSite Cookie 属性 =====

// Set-Cookie: session_id=abc123; SameSite=Strict; Secure; HttpOnly

// SameSite 的三个值：
// Strict  — 完全禁止第三方网站发送请求时携带 Cookie
// Lax     — 允许顶级导航（链接、GET 表单）携带 Cookie
// None    — 允许所有跨站请求携带 Cookie（必须同时设置 Secure）

// ===== Express 设置 SameSite =====
const session = require('express-session');

app.use(session({
  secret: 'your-secret-key',
  cookie: {
    sameSite: 'strict',  // 推荐 Strict 或 Lax
    secure: true,        // 仅 HTTPS
    httpOnly: true       // 防止 JS 读取
  }
}));

// ===== 各浏览器对 SameSite 的默认值 =====
// Chrome 80+：默认 Lax
// Firefox 69+：默认 Lax
// Safari 13+：默认 Lax（有细微差异）
// Edge 80+：默认 Lax
```

```
SameSite 属性对比
═══════════════════════════════════════════════════════

场景                          Strict    Lax      None
───────────────────────────  ────────  ────────  ────────
点击链接跳转                   ❌ 不带   ✅ 带    ✅ 带
GET 表单提交                  ❌ 不带   ✅ 带    ✅ 带
POST 表单提交                 ❌ 不带   ❌ 不带   ✅ 带
img/script/iframe 请求        ❌ 不带   ❌ 不带   ✅ 带
AJAX 请求（fetch/XHR）        ❌ 不带   ❌ 不带   ✅ 带

推荐：
- 一般场景用 Lax（用户体验和安全的平衡）
- 敏感操作用 Strict（如银行、支付）
- 跨域场景用 None + Secure（如 SSO、第三方嵌入）
```

### 3.3 Referer / Origin 检查

```javascript
// ===== 服务端检查请求来源 =====

function checkOrigin(req, res, next) {
  const origin = req.headers.origin || req.headers.referer;
  const allowedOrigins = [
    'https://example.com',
    'https://www.example.com',
    'https://app.example.com'
  ];

  // 检查 Origin 头（优先）
  if (req.headers.origin) {
    if (!allowedOrigins.includes(req.headers.origin)) {
      return res.status(403).json({ error: '非法来源' });
    }
  }
  // 检查 Referer 头（备选）
  else if (req.headers.referer) {
    const refererUrl = new URL(req.headers.referer);
    const isAllowed = allowedOrigins.some(
      origin => new URL(origin).hostname === refererUrl.hostname
    );
    if (!isAllowed) {
      return res.status(403).json({ error: '非法来源' });
    }
  }
  // 两者都没有（可能是隐私模式或代理移除了）
  else {
    return res.status(403).json({ error: '缺少来源信息' });
  }

  next();
}

app.post('/api/transfer', checkOrigin, (req, res) => {
  // 来源验证通过
});
```

```
Referer / Origin 检查注意事项
═══════════════════════════════════════════════════════

⚠️ 局限性：
1. Referer 可能被用户隐私设置或浏览器策略移除
2. 某些代理服务器会剥离 Referer 头
3. 从 HTTPS 降级到 HTTP 时，Referer 会被截断
4. 不能单独依赖此方案，应作为辅助防御

✅ 最佳实践：
1. 优先检查 Origin（更可靠，不受路径影响）
2. Origin 不存在时再检查 Referer
3. 两者都不存在时拒绝请求（或结合其他验证）
4. 配合 CSRF Token 一起使用
```

### 3.4 双重 Cookie 验证

```javascript
// ===== 双重 Cookie 验证（Double Submit Cookie） =====

// 原理：
// 1. 服务端设置一个随机 Cookie（非 HttpOnly）
// 2. 前端 JS 读取该 Cookie，放入请求参数或自定义 Header
// 3. 服务端比较 Cookie 中的值和请求中的值是否一致
// 4. 攻击者无法读取 Cookie（同源策略），因此无法伪造

// ===== 服务端设置 =====
app.get('/api/csrf-token', (req, res) => {
  const token = crypto.randomBytes(32).toString('hex');

  // 设置 Cookie（非 HttpOnly，前端 JS 需要读取）
  res.cookie('csrf_token', token, {
    sameSite: 'strict',
    secure: true,
    maxAge: 3600000
  });

  res.json({ token });
});

// ===== 服务端验证 =====
app.post('/api/transfer', (req, res) => {
  const cookieToken = req.cookies.csrf_token;
  const headerToken = req.headers['x-csrf-token'];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: 'CSRF 验证失败' });
  }

  // 验证通过
});

// ===== 前端自动携带 =====
axios.interceptors.request.use(config => {
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  if (match) {
    config.headers['X-CSRF-Token'] = match[1];
  }
  return config;
});
```

## 四、CSRF vs XSS 对比

```
CSRF vs XSS 对比
═══════════════════════════════════════════════════════

                CSRF                          XSS
───────────  ──────────────────────  ──────────────────────
全称          Cross-Site Request       Cross-Site Scripting
             Forgery

攻击目标      以用户身份执行操作         窃取用户数据/冒充用户

利用方式      伪造请求                  注入脚本

是否需要登录   必须（利用已有登录态）     不必须（可以钓鱼获取）

用户感知      用户完全不知情            可能有弹窗等异常表现

防御核心      验证请求来源              输入输出过滤

主要防御手段   CSRF Token               输出编码
             SameSite Cookie           CSP 策略
             Referer 检查              HttpOnly Cookie
```

## 五、完整防御方案

```javascript
// ===== Express 完整 CSRF 防御方案 =====

const express = require('express');
const helmet = require('helmet');
const csrf = require('csurf');

const app = express();

// 1. 使用 Helmet 设置安全头
app.use(helmet());

// 2. 设置 SameSite Cookie
app.use(require('cookie-parser')());
app.use(require('express-session')({
  secret: process.env.SESSION_SECRET,
  cookie: {
    sameSite: 'strict',
    secure: true,
    httpOnly: true
  }
}));

// 3. CSRF Token 中间件
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// 4. 前端获取 Token 的接口
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// 5. 所有状态修改请求自动验证
app.post('/api/*', csrfProtection, (req, res, next) => {
  // CSRF 验证通过，继续处理
  next();
});

// 6. 错误处理
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      error: 'CSRF Token 验证失败，请刷新页面重试'
    });
  }
  next(err);
});
```

## 六、面试高频问题

### Q1：CSRF 攻击的原理是什么？

```
回答要点：
1. 利用浏览器自动携带 Cookie 的机制
2. 诱导用户在已登录状态下访问恶意页面
3. 恶意页面自动向目标网站发送请求
4. 浏览器自动携带目标网站的 Cookie
5. 服务器误认为是用户本人操作
```

### Q2：CSRF 和 XSS 的区别？

```
回答要点：
1. CSRF 利用的是 Cookie 自动携带机制，XSS 利用的是脚本注入
2. CSRF 不需要在目标网站注入代码，XSS 需要
3. CSRF 防御核心是验证请求来源，XSS 防御核心是输入输出过滤
4. CSRF 以用户身份执行操作，XSS 窃取用户数据
5. 两者可以结合使用：XSS 可以窃取 CSRF Token
```

### Q3：如何防御 CSRF？

```
回答要点（按优先级排序）：
1. SameSite Cookie —— 浏览器原生支持，最简单有效
2. CSRF Token —— 最经典可靠的服务端防御方案
3. 验证 Referer/Origin —— 辅助防御手段
4. 双重 Cookie 验证 —— 无需服务端存储状态
5. 关键操作二次验证 —— 密码确认、短信验证码
```

### Q4：为什么 CSRF 攻击不能读取 Cookie？

```
回答要点：
1. 同源策略限制：evil.com 无法读取 bank.com 的 Cookie
2. CSRF 攻击只是"借用" Cookie，不是"窃取" Cookie
3. 浏览器自动在请求中携带目标域名的 Cookie
4. 攻击者无法看到 Cookie 的具体内容
5. 这也是为什么 HttpOnly 不能防御 CSRF（CSRF 不需要读取 Cookie）
```

### Q5：SameSite Cookie 的三种值有什么区别？

```
回答要点：
1. Strict：完全禁止跨站携带 Cookie（安全性最高，但影响用户体验）
2. Lax：允许顶级导航携带 Cookie（默认值，平衡安全和体验）
3. None：允许所有跨站携带 Cookie（必须设置 Secure，用于跨域场景）

选择策略：
- 普通应用用 Lax（Chrome 默认）
- 银行/支付用 Strict
- SSO/第三方嵌入用 None + Secure
```
