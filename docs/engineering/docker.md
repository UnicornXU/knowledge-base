---
sidebar_position: 6
title: "Docker 容器化"
difficulty: "medium"
tags: ["engineering", "docker", "container", "devops"]
---

# Docker 容器化

## Docker 核心概念

| 概念 | 说明 | 类比 |
|------|------|------|
| 镜像 (Image) | 只读模板，包含运行环境 | 类定义 |
| 容器 (Container) | 镜像的运行实例 | 对象实例 |
| Dockerfile | 构建镜像的脚本 | 类的构造函数 |
| Docker Compose | 多容器编排 | 系统架构图 |

## Dockerfile 最佳实践

### 前端项目 Dockerfile

```dockerfile
# 多阶段构建 — 大幅减小最终镜像体积
# 阶段 1：构建
FROM node:20-alpine AS builder

WORKDIR /app

# 利用缓存：先复制依赖文件
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# 再复制源码
COPY . .
RUN pnpm build

# 阶段 2：运行
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx 配置（SPA）

```nginx
# nginx.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # SPA 路由回退
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
```

## Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    environment:
      - NODE_ENV=production
    depends_on:
      - backend

  backend:
    image: node:20-alpine
    working_dir: /app
    volumes:
      - ./server:/app
    command: node server.js
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/mydb

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

```bash
# 常用命令
docker-compose up -d          # 后台启动所有服务
docker-compose down           # 停止并删除容器
docker-compose logs -f        # 查看日志
docker-compose build --no-cache  # 重新构建
```

## Docker 优化技巧

### 镜像体积优化

```dockerfile
# ❌ 不推荐：使用完整 Node 镜像 (~900MB)
FROM node:20

# ✅ 推荐：使用 Alpine 镜像 (~180MB)
FROM node:20-alpine

# ✅ 更好：使用 distroless 镜像 (~120MB)
FROM gcr.io/distroless/nodejs20-debian12
```

### 构建缓存优化

```dockerfile
# ❌ 每次代码变更都重新安装依赖
COPY . .
RUN npm install

# ✅ 先复制依赖文件，利用缓存层
COPY package.json package-lock.json ./
RUN npm ci --only=production
COPY . .
```

### .dockerignore

```
node_modules
.git
.env
*.md
.DS_Store
dist
coverage
.nyc_output
```

## CI/CD 中的 Docker

```yaml
# GitHub Actions 示例
name: Build and Deploy
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t my-app:${{ github.sha }} .

      - name: Push to registry
        run: |
          docker tag my-app:${{ github.sha }} registry.example.com/my-app:latest
          docker push registry.example.com/my-app:latest
```

## 面试高频问题

### Q: Docker 和虚拟机的区别？

| 对比 | Docker 容器 | 虚拟机 |
|------|------------|--------|
| 隔离级别 | 进程级 | 操作系统级 |
| 启动速度 | 秒级 | 分钟级 |
| 体积 | MB 级 | GB 级 |
| 性能 | 接近原生 | 有损耗 |
| 资源占用 | 少 | 多 |

### Q: 什么是多阶段构建？为什么需要？

**回答要点：**
1. **减小镜像体积** — 构建工具和依赖不进入最终镜像
2. **安全性** — 减少攻击面，不暴露源码和构建工具
3. **分离关注** — 构建环境和运行环境独立

```dockerfile
# 构建阶段：包含 node_modules 和源码 (~500MB)
FROM node:20 AS builder
COPY . .
RUN npm install && npm run build

# 运行阶段：只包含构建产物 (~50MB)
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```
