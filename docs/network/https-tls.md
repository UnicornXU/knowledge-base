---
sidebar_position: 7
title: "HTTPS 与 TLS"
difficulty: "hard"
tags: ["network", "https", "tls", "ssl", "certificate"]
---

# 🔒 HTTPS 与 TLS

> **"HTTPS 是现代 Web 的基石"** —— 理解 TLS 握手过程和证书体系，是前端工程师网络知识的重要一环。

## 一、HTTP vs HTTPS

```
HTTP vs HTTPS
═══════════════════════════════════════════════════════

HTTP                          HTTPS
────────────                  ────────────
明文传输                       加密传输
端口 80                       端口 443
无加密、无认证、无完整性        加密 + 认证 + 完整性
容易被窃听、篡改、劫持         安全可靠

HTTPS = HTTP + TLS（传输层安全协议）

加密过程：
  客户端 ←→ TLS 握手 ←→ 服务器
           ↓
    协商加密算法、交换密钥
           ↓
    使用对称加密传输数据
```

## 二、TLS 握手过程

### 2.1 TLS 1.2 握手（经典）

```
TLS 1.2 握手流程（2-RTT）
═══════════════════════════════════════════════════════

客户端                                      服务器
  │                                           │
  │──── ClientHello ─────────────────────────→│
  │     • 支持的 TLS 版本                      │
  │     • 支持的加密套件列表                    │
  │     • 客户端随机数 (Client Random)          │
  │                                           │
  │←─── ServerHello ─────────────────────────│
  │     • 选定的 TLS 版本                      │
  │     • 选定的加密套件                        │
  │     • 服务器随机数 (Server Random)          │
  │                                           │
  │←─── Certificate ─────────────────────────│
  │     • 服务器证书（公钥）                    │
  │                                           │
  │←─── ServerHelloDone ─────────────────────│
  │                                           │
  │──── ClientKeyExchange ───────────────────→│
  │     • 预主密钥（用服务器公钥加密）           │
  │                                           │
  │     双方用两个随机数 + 预主密钥              │
  │     生成相同的会话密钥 (Master Secret)       │
  │                                           │
  │──── ChangeCipherSpec ────────────────────→│
  │──── Finished ────────────────────────────→│
  │                                           │
  │←─── ChangeCipherSpec ────────────────────│
  │←─── Finished ────────────────────────────│
  │                                           │
  │←═══ 加密数据传输 ═════════════════════════→│
```

### 2.2 TLS 1.3 握手（最新）

```
TLS 1.3 握手流程（1-RTT）
═══════════════════════════════════════════════════════

客户端                                      服务器
  │                                           │
  │──── ClientHello ─────────────────────────→│
  │     • 支持的加密套件                        │
  │     • 密钥共享参数（密钥交换）               │
  │     • 支持的版本                            │
  │                                           │
  │←─── ServerHello ─────────────────────────│
  │←─── EncryptedExtensions ─────────────────│
  │←─── Certificate ─────────────────────────│
  │←─── CertificateVerify ──────────────────│
  │←─── Finished ────────────────────────────│
  │                                           │
  │──── Finished ────────────────────────────→│
  │                                           │
  │←═══ 加密数据传输 ═════════════════════════→│

TLS 1.3 改进：
• 1-RTT 握手（更快）
• 0-RTT 恢复（会话恢复时无需握手）
• 移除不安全的加密算法
• 加密握手过程（更多隐私）
```

### 2.3 加密方式

```
TLS 使用的加密方式
═══════════════════════════════════════════════════════

1. 非对称加密（握手阶段）
   公钥加密，私钥解密
   用途：交换密钥、验证身份
   算法：RSA、ECDHE

2. 对称加密（数据传输）
   同一密钥加密和解密
   用途：加密实际传输的数据
   算法：AES-256-GCM、ChaCha20

3. 哈希算法
   不可逆的摘要计算
   用途：验证数据完整性
   算法：SHA-256、SHA-384

为什么混合使用？
• 非对称加密安全但慢 → 用于握手交换密钥
• 对称加密快 → 用于传输大量数据
• 哈希 → 验证数据未被篡改
```

## 三、数字证书

### 3.1 证书体系

```
数字证书的信任链
═══════════════════════════════════════════════════════

根证书（Root CA）
  │  预装在操作系统和浏览器中
  │  自签名，信任的起点
  ▼
中间证书（Intermediate CA）
  │  由根证书签发
  │  保护根证书私钥安全
  ▼
服务器证书（End-entity）
  │  由中间证书签发
  │  包含网站域名和公钥
  ▼
验证过程：
  浏览器验证服务器证书
    → 验证签名是否由中间证书签发
    → 验证中间证书是否由根证书签发
    → 验证根证书是否在受信任列表中
    → 验证证书是否过期、域名是否匹配
```

### 3.2 证书类型

```
证书类型对比
═══════════════════════════════════════════════════════

DV（域名验证）       只验证域名所有权         最便宜、最快
OV（组织验证）       验证域名 + 组织信息      中等价格
EV（扩展验证）       最严格的验证             最贵、地址栏显示企业名

通配符证书           *.example.com            保护所有子域名
多域名证书           a.com + b.com            一张证书多个域名
```

### 3.3 Let's Encrypt

```bash
# 免费证书申请（使用 certbot）
# 安装 certbot
sudo apt install certbot python3-certbot-nginx

# 申请证书
sudo certbot --nginx -d example.com -d www.example.com

# 自动续期（certbot 自动配置 cron）
sudo certbot renew --dry-run

# 证书文件位置
# /etc/letsencrypt/live/example.com/fullchain.pem  — 证书链
# /etc/letsencrypt/live/example.com/privkey.pem    — 私钥
```

## 四、HTTPS 配置实践

### 4.1 Nginx 配置

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    # 证书配置
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    # TLS 版本
    ssl_protocols TLSv1.2 TLSv1.3;

    # 加密套件
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;

    # Session 缓存
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}
```

### 4.2 前端配置

```html
<!-- 强制 HTTPS -->
<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">

<!-- 混合内容检查 -->
<script>
// 检查页面是否有混合内容（HTTP 资源加载在 HTTPS 页面上）
if (location.protocol === 'https:') {
  console.log('当前使用 HTTPS');
}
</script>

<!-- Subresource Integrity (SRI) -->
<script src="https://cdn.example.com/lib.js"
        integrity="sha384-xxxx"
        crossorigin="anonymous"></script>
```

## 五、常见面试题

**Q1: HTTPS 的握手过程？**

A: 1) 客户端发送 ClientHello（支持的 TLS 版本、加密套件、随机数）；2) 服务器返回 ServerHello + 证书 + 随机数；3) 客户端验证证书，生成预主密钥并用服务器公钥加密发送；4) 双方用三个随机数生成会话密钥；5) 使用对称加密传输数据。

**Q2: TLS 1.2 和 1.3 的区别？**

A: TLS 1.3 握手只需 1-RTT（1.2 需要 2-RTT），支持 0-RTT 会话恢复，移除了不安全的加密算法，加密了更多握手过程。TLS 1.3 更快、更安全。

**Q3: 为什么 HTTPS 同时使用对称加密和非对称加密？**

A: 非对称加密安全但慢（用于握手阶段交换密钥），对称加密快但需要安全地共享密钥（用于传输数据）。两者结合既保证了安全性又保证了性能。
