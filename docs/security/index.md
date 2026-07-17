---
sidebar_position: 1
title: "前端安全概述"
difficulty: "medium"
tags: ["安全", "XSS", "CSRF", "OWASP"]
---

# 前端安全概述

## 为什么前端安全至关重要

在现代 Web 应用中，前端承载了越来越多的业务逻辑和用户数据交互。前端安全不再是"可选项"，而是**核心工程能力**。

### 真实数据泄露案例

| 事件 | 时间 | 影响 | 根因 |
|------|------|------|------|
| British Airways 数据泄露 | 2018 | 38万用户支付信息被窃 | 第三方脚本注入（XSS） |
| Ticketmaster 供应链攻击 | 2018 | 4万用户信用卡泄露 | 第三方 JS 库被篡改 |
| Magecart 系列攻击 | 2018-2020 | 数百万电商用户数据泄露 | 前端脚本注入 |
| Twitter XSS 蠕虫 | 2010 | 数百万用户受影响 | 存储型 XSS |

### 合规要求

- **GDPR**（欧盟通用数据保护条例）：要求保护用户个人数据，违规最高罚款 2000 万欧元或全球营收 4%
- **等保 2.0**（中国网络安全等级保护）：要求 Web 应用具备输入验证、会话管理等安全控制
- **PCI DSS**：支付卡行业数据安全标准，要求前端不存储敏感卡号信息

:::warning 重要提醒
安全不是"上线前做一次"的事情，而是贯穿整个开发生命周期的持续实践。一个 XSS 漏洞可能导致数百万用户数据泄露。
:::

---

## 前端安全威胁全景图

### 攻击类型分类

| 攻击类型 | 攻击目标 | 危害等级 | 防御难度 | 典型场景 |
|----------|----------|----------|----------|----------|
| XSS（跨站脚本） | 用户浏览器 | ⭐⭐⭐⭐⭐ | 中等 | 窃取 Cookie、钓鱼、键盘记录 |
| CSRF（跨站请求伪造） | 服务器端 | ⭐⭐⭐⭐ | 中等 | 伪造转账、修改密码 |
| 点击劫持 | 用户操作 | ⭐⭐⭐ | 低 | 诱导点击、授权操作 |
| 中间人攻击（MITM） | 网络传输 | ⭐⭐⭐⭐⭐ | 高 | 劫持数据、注入恶意代码 |
| 供应链攻击 | 依赖链 | ⭐⭐⭐⭐⭐ | 高 | 恶意 npm 包、CDN 劫持 |
| 原型链污染 | JS 运行时 | ⭐⭐⭐ | 高 | 注入恶意属性、绕过验证 |
| SSRF（服务端请求伪造） | 服务器 | ⭐⭐⭐⭐ | 中等 | 内网探测、数据获取 |
| 开放重定向 | 用户信任 | ⭐⭐ | 低 | 钓鱼攻击跳板 |

---

## OWASP Top 10 与前端关联

[OWASP Top 10 (2021)](https://owasp.org/Top10/) 中与前端开发密切相关的条目：

### A03:2021 – 注入（Injection）

```javascript
// ❌ 危险：直接将用户输入插入 DOM
document.getElementById('output').innerHTML = userInput;

// ✅ 安全：使用 textContent 或经过转义
document.getElementById('output').textContent = userInput;
```

### A05:2021 – 安全配置错误

```javascript
// ❌ 暴露敏感信息的错误响应
app.use((err, req, res, next) => {
  res.status(500).json({ stack: err.stack, query: req.query });
});

// ✅ 生产环境隐藏错误细节
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: '服务器内部错误' });
});
```

### A07:2021 – 跨站脚本（XSS）

XSS 从独立条目合并至注入类别，但仍是前端最常见漏洞。详见 [XSS 与 CSRF 攻防实战](./xss-csrf)。

### A08:2021 – 软件和数据完整性故障

```html
<!-- ❌ 未验证第三方资源完整性 -->
<script src="https://cdn.example.com/lib.js"></script>

<!-- ✅ 使用 SRI 验证完整性 -->
<script
  src="https://cdn.example.com/lib.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
  crossorigin="anonymous"
></script>
```

---

## 安全开发生命周期（SDL）

:::info
安全开发生命周期将安全实践嵌入到软件开发的每个阶段，而不是在上线前才进行安全测试。
:::

| 阶段 | 安全实践 | 工具/方法 |
|------|----------|-----------|
| **需求设计** | 威胁建模、安全需求分析 | STRIDE 模型、数据流图 |
| **编码** | 安全编码规范、代码审查 | ESLint 安全插件、SonarQube |
| **构建** | 依赖审计、SAST 静态分析 | npm audit、Snyk、CodeQL |
| **测试** | 渗透测试、DAST 动态分析 | OWASP ZAP、Burp Suite |
| **部署** | 安全头配置、HTTPS 强制 | Helmet.js、CSP 策略 |
| **运维** | 安全监控、漏洞响应 | Sentry、WAF、日志分析 |

---

## 常见安全响应头一览

```nginx
# 完整的安全响应头配置示例（Nginx）
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "0" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
```

| 响应头 | 作用 | 推荐值 |
|--------|------|--------|
| `Content-Security-Policy` | 限制资源加载来源，防止 XSS | 按需配置白名单 |
| `X-Frame-Options` | 防止页面被嵌入 iframe（点击劫持） | `DENY` 或 `SAMEORIGIN` |
| `X-Content-Type-Options` | 防止 MIME 类型嗅探 | `nosniff` |
| `Strict-Transport-Security` | 强制 HTTPS 连接 | `max-age=31536000; includeSubDomains` |
| `Referrer-Policy` | 控制 Referer 头信息泄露 | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | 控制浏览器 API 权限 | 按需禁用敏感 API |
| `X-XSS-Protection` | 旧版 XSS 过滤器（建议关闭） | `0`（配合 CSP 使用） |

:::tip 最佳实践
使用 [securityheaders.com](https://securityheaders.com) 检测你的网站安全头配置，目标是获得 A+ 评级。
:::

---

## 安全审计工具推荐

### 开发阶段

| 工具 | 类型 | 用途 | 集成方式 |
|------|------|------|----------|
| **npm audit** | 依赖审计 | 检测已知漏洞依赖 | CLI / CI |
| **Snyk** | SCA | 依赖漏洞扫描+修复建议 | GitHub App / CLI |
| **ESLint Security** | SAST | 检测不安全的代码模式 | IDE / CI |
| **SonarQube** | SAST | 综合代码质量+安全分析 | CI/CD |

### 测试阶段

| 工具 | 类型 | 用途 |
|------|------|------|
| **OWASP ZAP** | DAST | 自动化漏洞扫描 |
| **Burp Suite** | 渗透测试 | 手动+自动安全测试 |
| **Chrome DevTools Security** | 浏览器 | 检查 HTTPS、证书、混合内容 |
| **Lighthouse** | 审计 | 安全最佳实践检查 |

```bash
# 快速依赖安全审计
npm audit
npm audit fix

# 使用 Snyk 深度扫描
npx snyk test
npx snyk monitor
```

---

## 面试高频题

### Q1: 前端安全的核心原则是什么？

:::tip 参考答案
前端安全的核心原则包括：
1. **最小权限原则**：仅请求必要的权限和数据
2. **纵深防御**：不依赖单一防御手段，多层防护
3. **不信任用户输入**：所有用户输入都需要验证和转义
4. **安全默认配置**：系统默认状态应该是安全的
5. **敏感数据最小化**：前端尽量不存储敏感数据
:::

### Q2: 列举 5 种前端常见安全威胁及其防御方式

| 威胁 | 防御方式 |
|------|----------|
| XSS | 输入转义、CSP、HttpOnly Cookie |
| CSRF | CSRF Token、SameSite Cookie |
| 点击劫持 | X-Frame-Options、CSP frame-ancestors |
| 中间人攻击 | HTTPS、HSTS、证书固定 |
| 供应链攻击 | SRI、依赖审计、锁文件 |

### Q3: CSP 是什么？如何配置？

CSP（Content Security Policy）是一种安全策略，通过白名单机制限制页面可以加载的资源来源，有效防止 XSS 攻击。

### Q4: 为什么说"前端没有安全"这个说法是错误的？

前端虽然无法完全替代后端安全校验，但前端安全措施可以：提供第一道防线、减少攻击面、保护用户端数据、防止客户端逻辑被利用。安全需要前后端协同防御。

### Q5: 什么是安全开发生命周期（SDL）？前端如何实践？

SDL 是将安全贯穿软件开发全过程的方法论。前端实践包括：设计阶段进行威胁建模、编码阶段使用安全 lint 规则、构建阶段进行依赖审计、测试阶段进行安全扫描、部署阶段配置安全头。

### Q6: npm 供应链攻击有哪些形式？如何防范？

供应链攻击形式：恶意包发布、依赖劫持（typosquatting）、维护者账号被盗、构建脚本注入。防范措施：使用 lock 文件、定期 npm audit、使用 SRI、限制脚本权限、代码审查第三方依赖。
