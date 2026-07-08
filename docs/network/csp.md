---
sidebar_position: 12
title: "内容安全策略（CSP）详解"
difficulty: "hard"
tags: ["network", "security", "csp", "xss", "frontend"]
---

# 内容安全策略（CSP）详解

> **"CSP 是防御 XSS 的终极武器"** —— 通过白名单机制控制浏览器可以加载和执行哪些资源，从根源上杜绝恶意脚本注入。

## 一、CSP 是什么？

### 1.1 CSP 基本概念

```
CSP（Content Security Policy）内容安全策略
═══════════════════════════════════════════════════════

核心思想：
通过 HTTP 响应头或 HTML meta 标签，告诉浏览器哪些资源可以加载
浏览器严格执行策略，拒绝加载不在白名单中的资源

作用：
✅ 防止 XSS（限制脚本来源）
✅ 防止数据注入（限制连接、表单提交目标）
✅ 防止点击劫持（限制 iframe 嵌入）
✅ 减少攻击面（禁止 eval、内联脚本等）
```

### 1.2 CSP 工作原理

```
CSP 工作流程
═══════════════════════════════════════════════════════

1. 服务器发送 CSP 响应头
   HTTP/1.1 200 OK
   Content-Security-Policy: script-src 'self' https://cdn.example.com

2. 浏览器解析并存储 CSP 策略

3. 页面加载资源时，浏览器检查：
   → 该资源是否符合 CSP 白名单？
   → 符合 → 正常加载
   → 不符合 → 拒绝加载 + 控制台报错

4. 攻击者注入的脚本：
   <script>document.cookie</script>
   → 不在白名单中 → 被浏览器阻止执行
```

## 二、CSP 指令详解

### 2.1 资源加载指令

```
CSP 核心指令
═══════════════════════════════════════════════════════

指令              控制的资源类型          示例
───────────────  ────────────────────  ─────────────────────────
default-src      所有资源的默认策略      default-src 'self'
script-src       JavaScript 脚本       script-src 'self' https://cdn.com
style-src        CSS 样式              style-src 'self' 'unsafe-inline'
img-src          图片                  img-src 'self' data: https:
font-src         字体                  font-src 'self' https://fonts.com
connect-src      AJAX/WebSocket/fetch  connect-src 'self' https://api.com
media-src        音视频                 media-src 'self' https://media.com
object-src       插件（Flash 等）       object-src 'none'
frame-src        iframe                frame-src 'self' https://embed.com
frame-ancestors  谁可以嵌入当前页面      frame-ancestors 'none'
form-action      表单提交目标           form-action 'self'
base-uri         base 标签的 href      base-uri 'self'
manifest-src     Web App Manifest      manifest-src 'self'
worker-src       Web Worker            worker-src 'self'
prefetch-src     预加载资源             prefetch-src 'self'
```

### 2.2 源值（Source Values）

```
CSP 源值（Source Values）
═══════════════════════════════════════════════════════

值                  含义                         示例
──────────────────  ────────────────────────────  ─────────────────────
'self'              当前同源（不含子域名）          script-src 'self'
https://example.com 具体域名                      script-src https://cdn.com
*.example.com       通配符（子域名）               script-src *.example.com
https:              所有 HTTPS 源                  img-src https:
data:               data: URI                     img-src data:
'unsafe-inline'     允许内联脚本/样式              style-src 'unsafe-inline'
'unsafe-eval'       允许 eval()                   script-src 'unsafe-eval'
'nonce-<base64>'    允许带指定 nonce 的内联脚本     script-src 'nonce-abc123'
'hash-<algo>-<val>' 允许匹配 hash 的内联脚本       script-src 'sha256-xxxx'
'strict-dynamic'    信任由可信脚本动态加载的脚本     script-src 'strict-dynamic'
'none'              不允许任何源                    default-src 'none'
```

### 2.3 Fetch Directives 与 Document Directives

```
文档级别指令
═══════════════════════════════════════════════════════

sandbox           启用沙箱模式（类似 iframe sandbox）
                  值：allow-scripts, allow-forms, allow-same-origin 等

disown-opener     断开 window.opener 引用
                  值：true

report-uri        CSP 违规报告地址（已废弃，推荐 report-to）
                  值：URL

report-to         CSP 违规报告端点（需要配合 Reporting API）
                  值：端点名称
```

## 三、CSP 配置方式

### 3.1 HTTP 响应头配置（推荐）

```javascript
// ===== Express 配置 CSP =====

const express = require('express');
const helmet = require('helmet');

const app = express();

// 方式 1：使用 Helmet（推荐）
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'nonce-abc123'",           // 只允许带指定 nonce 的脚本
        "https://cdn.example.com"   // 允许 CDN 脚本
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",          // 样式允许内联（避免 FOUC）
        "https://fonts.googleapis.com"
      ],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://api.example.com"],
      frameSrc: ["'none'"],         // 禁止 iframe
      objectSrc: ["'none'"],        // 禁止插件
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: []   // 自动升级 HTTP 到 HTTPS
    }
  })
);

// 方式 2：手动设置响应头
app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.nonce = nonce;

  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://cdn.example.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.example.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '));

  next();
});
```

### 3.2 HTML meta 标签配置

```html
<!-- 方式 2：HTML meta 标签（功能受限，不能使用 report-uri/frame-ancestors） -->
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'self';
                 script-src 'self' https://cdn.example.com;
                 style-src 'self' 'unsafe-inline';
                 img-src 'self' data: https:;
                 connect-src 'self' https://api.example.com" />
</head>
<body>
  <!-- 页面内容 -->
</body>
</html>

<!-- ⚠️ 局限性：-->
<!-- 1. 不能使用 report-uri（必须用 HTTP 头） -->
<!-- 2. 不能使用 frame-ancestors（必须用 HTTP 头） -->
<!-- 3. 不能使用 sandbox（必须用 HTTP 头） -->
<!-- 4. meta 标签必须在 head 的最前面 -->
```

### 3.3 Nginx / Apache 配置

```nginx
# ===== Nginx 配置 CSP =====

server {
  listen 443 ssl;

  # 基本 CSP 策略
  add_header Content-Security-Policy
    "default-src 'self';
     script-src 'self' 'nonce-$request_id' https://cdn.example.com;
     style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
     img-src 'self' data: https:;
     font-src 'self' https://fonts.gstatic.com;
     connect-src 'self' https://api.example.com;
     frame-src 'none';
     object-src 'none';
     base-uri 'self';
     form-action 'self';
     report-uri /csp-violation-report"
    always;

  # 使用 Helmet 或框架生成更灵活的 CSP
  location / {
    proxy_pass http://localhost:3000;
  }
}
```

```apache
# ===== Apache 配置 CSP =====

<VirtualHost *:443>
  Header always set Content-Security-Policy "\
    default-src 'self'; \
    script-src 'self' 'nonce-%{UNIQUE_ID}e' https://cdn.example.com; \
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; \
    img-src 'self' data: https:; \
    font-src 'self' https://fonts.gstatic.com; \
    connect-src 'self' https://api.example.com; \
    frame-src 'none'; \
    object-src 'none'; \
    base-uri 'self'; \
    form-action 'self'"
</VirtualHost>
```

## 四、Nonce 与 Hash 机制

### 4.1 Nonce（推荐用于动态页面）

```javascript
// ===== Nonce 的工作原理 =====

// 1. 服务端为每个请求生成一个唯一的随机 nonce
const crypto = require('crypto');

function generateNonce() {
  return crypto.randomBytes(16).toString('base64');
}

// 2. 将 nonce 放入 CSP 响应头
app.use((req, res, next) => {
  const nonce = generateNonce();
  res.locals.nonce = nonce;

  res.setHeader('Content-Security-Policy',
    `script-src 'self' 'nonce-${nonce}'`
  );
  next();
});

// 3. 在模板中使用 nonce
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <script nonce="${res.locals.nonce}">
        // 这个脚本会执行（nonce 匹配）
        const app = new Application();
        app.init();
      </script>

      <script>
        // 这个脚本不会执行（没有 nonce）
        document.cookie
      </script>
    </head>
    <body>
      <div id="app"></div>
    </body>
    </html>
  `);
});
```

```
Nonce 安全要点
═══════════════════════════════════════════════════════

✅ 正确做法：
• 每个请求生成唯一的 nonce（不可预测）
• nonce 使用密码学安全的随机数生成器
• nonce 长度至少 128 位（16 字节 base64 编码）
• 将 nonce 放入 CSP 响应头和 script 标签

❌ 错误做法：
• 使用固定的 nonce（容易被猜测）
• 使用时间戳作为 nonce（可预测）
• nonce 值太短（容易被暴力破解）
• 允许 'unsafe-inline' 作为后备（绕过了 nonce 保护）
```

### 4.2 Hash（推荐用于静态页面）

```html
<!-- ===== Hash 的工作原理 ===== -->

<!-- 1. 计算脚本内容的 SHA-256 哈希值 -->
<script>
  const app = new Application();
  app.init();
</script>

<!-- 2. 将哈希值放入 CSP 响应头 -->
<!-- Content-Security-Policy: script-src 'self' 'sha256-abc123...' -->

<!-- 3. 浏览器对比脚本哈希，匹配则执行 -->

<!-- ===== 使用工具计算 Hash ===== -->
<!-- 方法 1：浏览器控制台 -->
<!-- 打开 DevTools → Console → 输入脚本内容 → 计算 SHA-256 -->

<!-- 方法 2：命令行工具 -->
<!-- echo -n "const app = new Application();" | openssl dgst -sha256 -binary | openssl base64 -->

<!-- 方法 3：Node.js -->
<!-- const hash = crypto.createHash('sha256').update(scriptContent).digest('base64'); -->
```

```javascript
// ===== 自动计算脚本 Hash 的构建工具 =====

// webpack 插件：csp-html-webpack-plugin
const CspHtmlWebpackPlugin = require('csp-html-webpack-plugin');

module.exports = {
  plugins: [
    new CspHtmlWebpackPlugin({
      'script-src': ["'self'"],
      'style-src': ["'self'", "'unsafe-inline'"]
    })
  ]
};

// Vite 插件：vite-plugin-csp
import { defineConfig } from 'vite';
import csp from 'vite-plugin-csp';

export default defineConfig({
  plugins: [
    csp({
      policy: {
        'script-src': ["'self'"],
        'style-src': ["'self'", "'unsafe-inline'"]
      }
    })
  ]
});
```

### 4.3 strict-dynamic（现代推荐）

```
strict-dynamic 工作原理
═══════════════════════════════════════════════════════

CSP 策略：
script-src 'strict-dynamic' 'nonce-abc123' https://cdn.example.com

行为：
1. 带有正确 nonce 的脚本可以执行 ✅
2. 该脚本动态加载的其他脚本也可以执行 ✅（信任传递）
3. 静态的 https://cdn.example.com 脚本被忽略 ❌

适用场景：
- 使用打包工具的现代前端应用
- 需要动态加载模块的场景
- 与 Webpack/Vite 的代码分割配合使用

注意：
- 需要浏览器支持 CSP Level 3
- 不支持 'unsafe-inline'（否则等于没有 CSP）
- 需要配合 nonce 或 hash 使用
```

## 五、CSP 报告模式

### 5.1 报告模式配置

```javascript
// ===== CSP 报告模式（不影响页面功能，只收集违规报告） =====

// 方式 1：使用 Report-Only 头（推荐用于测试阶段）
app.use((req, res, next) => {
  // 仅报告，不阻止（用于测试 CSP 策略是否合理）
  res.setHeader('Content-Security-Policy-Report-Only',
    "default-src 'self'; " +
    "script-src 'self' 'nonce-abc123'; " +
    "report-uri /csp-violation-report"
  );
  next();
});

// 方式 2：同时使用阻止和报告
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'nonce-abc123'; " +
    "report-uri /csp-violation-report"
  );
  next();
});

// 接收并处理违规报告
app.post('/csp-violation-report', express.json(), (req, res) => {
  const report = req.body;
  console.log('CSP Violation:', JSON.stringify(report, null, 2));

  // 存储到数据库或发送到监控系统
  // violationLogger.log(report);

  res.status(204).end();
});
```

### 5.2 违规报告格式

```json
{
  "csp-report": {
    "document-uri": "https://example.com/page",
    "referrer": "https://example.com/",
    "blocked-uri": "https://evil.com/malicious.js",
    "violated-directive": "script-src-elem",
    "effective-directive": "script-src",
    "original-policy": "default-src 'self'; script-src 'self' 'nonce-abc123'",
    "disposition": "enforce",
    "status-code": 200,
    "script-sample": "",
    "source-file": "https://example.com/page",
    "line-number": 42,
    "column-number": 15
  }
}
```

### 5.3 Reporting API v1（新版）

```javascript
// ===== 使用 Reporting API v1（更灵活的报告机制） =====

// 配置报告端点名称
app.use((req, res, next) => {
  // 定义报告端点
  res.setHeader('Report-To', JSON.stringify({
    group: 'csp-endpoint',
    max_age: 86400,
    endpoints: [
      { url: 'https://example.com/reports', priority: 1 }
    ]
  }));

  // CSP 策略引用报告端点
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'nonce-abc123'; " +
    "report-to csp-endpoint"
  );
  next();
});
```

## 六、实际项目 CSP 配置

### 6.1 Vue / React SPA 配置

```javascript
// ===== 现代前端 SPA 的 CSP 配置模板 =====

const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],

    // 脚本：只允许同源 + nonce
    scriptSrc: [
      "'self'",
      `'nonce-${nonce}'`,
      // 如果使用 Google Analytics
      // 'https://www.googletagmanager.com',
      // 'https://www.google-analytics.com',
    ],

    // 样式：允许内联（避免 FOUC）+ 外部样式
    styleSrc: [
      "'self'",
      "'unsafe-inline'",  // CSS-in-JS 和动态样式需要
      "https://fonts.googleapis.com",
    ],

    // 图片：允许 data URI 和 HTTPS
    imgSrc: [
      "'self'",
      "data:",           // base64 图片
      "https:",           // 任意 HTTPS 图片源
      "blob:",            // canvas 转图片
    ],

    // 字体
    fontSrc: [
      "'self'",
      "https://fonts.gstatic.com",
    ],

    // API 请求
    connectSrc: [
      "'self'",
      "https://api.example.com",
      "wss://ws.example.com",  // WebSocket
      // 如果使用 Google Analytics
      // 'https://www.google-analytics.com',
    ],

    // 媒体
    mediaSrc: ["'self'"],

    // 禁止插件
    objectSrc: ["'none'"],

    // 禁止 iframe 嵌入
    frameSrc: ["'none'"],

    // 禁止被 iframe 嵌入
    frameAncestors: ["'none'"],

    // 表单提交
    formAction: ["'self'"],

    // base 标签
    baseUri: ["'self'"],

    // Worker
    workerSrc: ["'self'", "blob:"],

    // 升级 HTTP 到 HTTPS
    upgradeInsecureRequests: [],
  },

  // 使用 reportOnly 模式测试
  reportOnly: process.env.NODE_ENV === 'development',

  // 报告地址
  reportUri: '/csp-violation-report',
};
```

### 6.2 Next.js SSR 配置

```javascript
// ===== Next.js CSP 配置 =====

// next.config.js
const crypto = require('crypto');

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",  // Next.js 需要 unsafe-eval
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://api.example.com wss://ws.example.com",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; ')
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;

// ===== 更安全的 Next.js 配置（使用 nonce） =====
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';

export function middleware(request: NextRequest) {
  const nonce = crypto.randomBytes(16).toString('base64');
  const response = NextResponse.next();

  // 设置 CSP 头
  response.headers.set(
    'Content-Security-Policy',
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`
  );

  // 将 nonce 传递给页面（通过 header 或 cookie）
  response.headers.set('X-Nonce', nonce);

  return response;
}
```

### 6.3 开发环境 vs 生产环境

```javascript
// ===== 区分开发和生产环境的 CSP 配置 =====

function getCspConfig(nonce, isDev) {
  if (isDev) {
    // 开发环境：宽松策略（方便开发调试）
    return {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "ws:", "wss:"],  // HMR WebSocket
      }
    };
  }

  // 生产环境：严格策略
  return {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", `'nonce-${nonce}'`],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.example.com"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    }
  };
}
```

## 七、CSP 部署策略

```
CSP 部署建议路线图
═══════════════════════════════════════════════════════

阶段 1：监控模式（1-2 周）
──────────────────────────────────────────────────────
• 使用 Content-Security-Policy-Report-Only 头
• 设置 report-uri 收集违规报告
• 分析报告，识别合法的资源加载需求
• 修复代码中的不安全写法（innerHTML 等）

阶段 2：宽松策略（1-2 周）
──────────────────────────────────────────────────────
• 启用 CSP 阻止模式
• 允许 'unsafe-inline'（临时措施）
• 逐步收紧各个指令
• 持续监控违规报告

阶段 3：严格策略（持续优化）
──────────────────────────────────────────────────────
• 移除 'unsafe-inline'，改用 nonce/hash
• 实施 strict-dynamic（如果适用）
• 移除不必要的白名单域名
• 定期审计和更新 CSP 策略

⚠️ 注意事项：
• CSP 配置错误会导致页面功能异常
• 务必先在测试环境验证
• 使用 Report-Only 模式观察影响
• 保留紧急回滚方案
```

## 八、面试高频问题

### Q1：CSP 如何防御 XSS？

```
回答要点：
1. 限制脚本来源：script-src 'self' 只允许同源脚本
2. 禁止内联脚本：移除 'unsafe-inline'，阻止 <script> 内联代码
3. 使用 nonce/hash：只允许白名单中的内联脚本执行
4. 限制 eval：移除 'unsafe-eval'，阻止 eval() 执行
5. 报告机制：通过 report-uri 收集违规信息，及时发现攻击
```

### Q2：nonce 和 hash 有什么区别？

```
回答要点：
1. nonce：每个请求生成一个随机值，动态页面适用
2. hash：对脚本内容计算 SHA-256，静态页面适用
3. nonce 适合服务端渲染（SSR）场景
4. hash 适合纯静态页面或构建时确定的脚本
5. 两者不能同时使用（选择其一即可）
```

### Q3：CSP 的 Report-Only 模式有什么用？

```
回答要点：
1. 测试 CSP 策略：在不影响页面功能的情况下观察违规情况
2. 收集数据：分析哪些资源会被阻止，哪些是合法需求
3. 渐进部署：先收集数据，再逐步启用严格策略
4. 监控攻击：通过违规报告发现潜在的 XSS 攻击
5. 生产环境建议：始终保留 Report-Only 头监控异常
```

### Q4：为什么有些网站仍然使用 'unsafe-inline'？

```
回答要点：
1. 历史遗留：旧代码大量使用内联脚本和样式
2. CSS-in-JS：很多 UI 框架生成内联样式（styled-components 等）
3. 第三方依赖：某些第三方库依赖内联脚本
4. 开发便利性：nonce/hash 增加了部署复杂度
5. 渐进迁移：需要时间逐步重构代码

解决方案：
• 使用 nonce 替代 'unsafe-inline'（脚本）
• CSS-in-JS 可以配置输出 nonce
• 检查第三方库是否支持外部脚本加载
```

### Q5：CSP 能完全防止 XSS 吗？

```
回答要点：
1. CSP 是防御 XSS 的重要手段，但不是万能的
2. 不能防御 DOM XSS：如果漏洞代码本身在白名单中，CSP 无法阻止
3. 不能防御 JSONP 劫持：如果 JSONP 端点在白名单中
4. 'unsafe-inline' 等于没有 CSP
5. CSP 需要配合其他防御措施：输出编码、输入验证、安全 API

最佳实践：
• CSP 作为纵深防御的一层
• 输出编码是第一道防线
• CSP 是最后一道防线
• 两者结合才能有效防御 XSS
```
