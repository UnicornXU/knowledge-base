---
sidebar_position: 1
title: 工程化
slug: /engineering
---

# 工程化

工程化是现代前端开发的基石，涵盖构建工具、代码规范、包管理、容器化、CI/CD 等核心领域。

## 📚 内容导航

| 文档 | 难度 | 说明 |
|------|------|------|
| [构建工具](./bundler.md) | 🟡 中 | Webpack vs Vite 原理与配置 |
| [CI/CD](./cicd.md) | 🟡 中 | 持续集成与部署流程 |
| [Git 工作流与代码规范](./git-workflow.md) | 🟡 中 | Git Flow、ESLint、Prettier、Husky |
| [Monorepo 方案](./monorepo.md) | 🟡 中 | pnpm workspace、Turborepo、Nx |
| [包管理工具](./package-management.md) | 🟢 初 | npm/yarn/pnpm 对比与最佳实践 |
| [Docker 容器化](./docker.md) | 🟡 中 | Dockerfile、多阶段构建、Compose |

## 🎯 学习路线

```
基础 → 包管理工具 (npm/pnpm)
 │
 ├→ 构建工具 (Vite/Webpack)
 │
 ├→ 代码规范 (ESLint + Prettier + Husky)
 │
 ├→ Git 工作流 (GitHub Flow + Conventional Commits)
 │
 ├→ Monorepo (pnpm workspace + Turborepo)
 │
 └→ 容器化 & CI/CD (Docker + GitHub Actions)
```

## 面试考察重点

- **构建工具**：Vite 原理（ESM + esbuild）、Webpack 优化策略
- **包管理**：pnpm 优势、幽灵依赖问题、锁文件机制
- **代码规范**：ESLint + Prettier 集成、Git Hooks 工作流
- **Monorepo**：依赖管理、增量构建、远程缓存
- **Docker**：多阶段构建、镜像优化、Compose 编排

import DocCardList from '@theme/DocCardList';

<DocCardList />
