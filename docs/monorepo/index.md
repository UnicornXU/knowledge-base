---
sidebar_position: 0
title: Monorepo 进阶
slug: /monorepo
---

# Monorepo 进阶

> **"Monorepo 不是简单的'把代码放在一起'，而是一套完整的工程管理体系"** —— 当项目规模增长、团队扩张时，Monorepo 是解决代码复用、依赖管理、构建效率的核心方案。

## 什么是 Monorepo？

```
Monorepo vs Multirepo
═══════════════════════════════════════════════════════

Multirepo（多仓库）：
  project-a/     ← 独立 Git 仓库
  project-b/     ← 独立 Git 仓库
  project-c/     ← 独立 Git 仓库
  shared-lib/    ← 独立 Git 仓库

Monorepo（单仓库）：
  my-monorepo/   ← 一个 Git 仓库
  ├── packages/
  │   ├── app-web/        ← Web 应用
  │   ├── app-mobile/     ← 移动端应用
  │   ├── shared-ui/      ← UI 组件库
  │   ├── shared-utils/   ← 工具函数
  │   └── shared-types/   ← TypeScript 类型
  └── tools/
      └── eslint-config/  ← 共享配置

核心区别：
  Multirepo = 每个项目独立仓库、独立版本、独立 CI/CD
  Monorepo  = 所有项目在一个仓库、统一版本、共享 CI/CD
```

## 为什么需要 Monorepo？

```mermaid
graph TB
    subgraph "Multirepo 的痛点"
        P1[代码复用困难<br/>需要发 npm 包]
        P2[依赖版本不一致<br/>各项目用不同版本]
        P3[跨项目修改繁琐<br/>需要多个 PR]
        P4[原子提交不可能<br/>无法一次提交改多个项目]
        P5[代码审查分散<br/>需要看多个仓库]
    end

    subgraph "Monorepo 的优势"
        S1[代码复用简单<br/>直接 import]
        S2[依赖版本统一<br/>一处管理]
        S3[跨项目修改容易<br/>一个 PR 搞定]
        S4[原子提交支持<br/>一次提交改所有]
        S5[代码审查集中<br/>一个仓库看所有]
    end

    P1 --> S1
    P2 --> S2
    P3 --> S3
    P4 --> S4
    P5 --> S5

    style P1 fill:#ffcdd2,stroke:#c62828
    style P2 fill:#ffcdd2,stroke:#c62828
    style P3 fill:#ffcdd2,stroke:#c62828
    style P4 fill:#ffcdd2,stroke:#c62828
    style P5 fill:#ffcdd2,stroke:#c62828
    style S1 fill:#c8e6c9,stroke:#2e7d32
    style S2 fill:#c8e6c9,stroke:#2e7d32
    style S3 fill:#c8e6c9,stroke:#2e7d32
    style S4 fill:#c8e6c9,stroke:#2e7d32
    style S5 fill:#c8e6c9,stroke:#2e7d32
```

## Monorepo 生态全景

```mermaid
graph TB
    subgraph "包管理器"
        PNPM[pnpm workspaces<br/>原生支持、磁盘效率高]
        YARN[yarn workspaces<br/>Berry 版本支持好]
        NPM[npm workspaces<br/>Node.js 16+ 支持]
    end

    subgraph "构建编排工具"
        TURBO[Turborepo<br/>Vercel 出品、增量构建]
        NX[Nx<br/>功能最全、插件丰富]
        LERNA[Lerna<br/>经典方案、已维护]
        RUSH[Rush<br/>微软出品、大型项目]
    end

    subgraph "代码质量工具"
        ESLINT[ESLint<br/>共享配置]
        PRETTIER[Prettier<br/>统一格式]
        CHANGESETS[Changesets<br/>版本管理]
    end

    PNPM --> TURBO
    PNPM --> NX
    YARN --> TURBO
    YARN --> NX

    style TURBO fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    style NX fill:#fff3e0,stroke:#e65100,stroke-width:2px
    style PNPM fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px
```

## pnpm Workspaces 基础

### 项目结构

```yaml
# pnpm-workspace.yaml
packages:
  - "packages/*"
  - "apps/*"
  - "tools/*"
```

```
my-monorepo/
├── apps/
│   ├── web/                  # Web 应用
│   │   ├── package.json
│   │   └── src/
│   ├── mobile/               # 移动端应用
│   │   ├── package.json
│   │   └── src/
│   └── admin/                # 管理后台
│       ├── package.json
│       └── src/
├── packages/
│   ├── ui/                   # UI 组件库
│   │   ├── package.json
│   │   └── src/
│   ├── utils/                # 工具函数
│   │   ├── package.json
│   │   └── src/
│   ├── types/                # TypeScript 类型
│   │   ├── package.json
│   │   └── src/
│   └── config/               # 共享配置
│       ├── eslint/
│       ├── tsconfig/
│       └── jest/
├── package.json
├── pnpm-workspace.yaml
└── pnpm-lock.yaml
```

### package.json 配置

```json
// 根目录 package.json
{
  "name": "my-monorepo",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "lint": "turbo lint",
    "format": "prettier --write \"**/*.{ts,tsx,md}\""
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "prettier": "^3.0.0"
  },
  "packageManager": "pnpm@9.0.0"
}
```

```json
// apps/web/package.json
{
  "name": "@myorg/web",
  "version": "0.0.0",
  "private": true,
  "dependencies": {
    "@myorg/ui": "workspace:*",
    "@myorg/utils": "workspace:*",
    "@myorg/types": "workspace:*",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@myorg/tsconfig": "workspace:*",
    "@myorg/eslint-config": "workspace:*"
  }
}
```

```json
// packages/ui/package.json
{
  "name": "@myorg/ui",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./button": "./src/button/index.ts",
    "./modal": "./src/modal/index.ts"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

## Monorepo 依赖关系图

```mermaid
graph TD
    subgraph "应用层 (apps)"
        WEB["@myorg/web<br/>Web 应用"]
        MOBILE["@myorg/mobile<br/>移动端"]
        ADMIN["@myorg/admin<br/>管理后台"]
    end

    subgraph "包层 (packages)"
        UI["@myorg/ui<br/>组件库"]
        UTILS["@myorg/utils<br/>工具函数"]
        TYPES["@myorg/types<br/>类型定义"]
        HOOKS["@myorg/hooks<br/>React Hooks"]
    end

    subgraph "配置层 (tools)"
        TSCONFIG["@myorg/tsconfig"]
        ESLINT["@myorg/eslint-config"]
        JEST["@myorg/jest-config"]
    end

    WEB --> UI
    WEB --> UTILS
    WEB --> TYPES
    WEB --> HOOKS

    MOBILE --> UI
    MOBILE --> UTILS
    MOBILE --> TYPES

    ADMIN --> UI
    ADMIN --> UTILS
    ADMIN --> TYPES

    UI --> TYPES
    HOOKS --> UTILS
    HOOKS --> TYPES

    WEB -.->|devDependencies| TSCONFIG
    WEB -.->|devDependencies| ESLINT
    WEB -.->|devDependencies| JEST

    style WEB fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    style MOBILE fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    style ADMIN fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    style UI fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    style UTILS fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    style TYPES fill:#fff9c4,stroke:#f57f17,stroke-width:2px
```

## 工具选型指南

### Turborepo vs Nx 对比

```
Turborepo vs Nx 详细对比
═══════════════════════════════════════════════════════

特性              Turborepo              Nx
─────────────────────────────────────────────────────────
出品方            Vercel                 Nrwl
定位              轻量级构建编排          全功能 Monorepo 平台
配置复杂度        低（turbo.json）       中（nx.json + 插件）
学习曲线          平缓                   较陡
增量构建          ✅ 内置                 ✅ 内置
远程缓存          ✅ Vercel Remote Cache  ✅ Nx Cloud
依赖图分析        ✅ 自动                 ✅ 自动 + 可视化
受影响分析        ✅ --filter             ✅ affected 命令
插件系统          ❌ 无                   ✅ 丰富的插件
代码生成器        ❌ 无                   ✅ 内置
任务编排          ✅ 简单直观              ✅ 灵活强大
CI 集成           ✅ 简单                 ✅ 丰富
社区生态          中等                   活跃
适用规模          中小型项目              中大型项目
─────────────────────────────────────────────────────────

选择建议：
  • 小团队、简单项目 → Turborepo（开箱即用）
  • 大团队、复杂项目 → Nx（功能全面）
  • 已用 pnpm workspaces → Turborepo（集成好）
  • 需要代码生成、迁移 → Nx（插件丰富）
```

## 学习路线图

```mermaid
graph TD
    A[pnpm Workspaces 基础] --> B[Monorepo 项目结构设计]
    B --> C[构建编排工具选择]
    C --> D{选择工具}
    D -->|轻量级| E[Turborepo]
    D -->|功能全面| F[Nx]
    E --> G[任务编排与缓存]
    F --> G
    G --> H[CI/CD 集成]
    H --> I[版本管理与发布]
    I --> J[最佳实践与面试]

    style A fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    style J fill:#fff3e0,stroke:#e65100,stroke-width:2px
    style D fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
```

## 本章内容导航

| 文档 | 内容 |
|------|------|
| [Turborepo 详解](./turborepo.md) | 任务编排、远程缓存、增量构建、与 Lerna/pnpm workspaces 对比 |
| [Nx 详解](./nx.md) | 依赖图分析、受影响分析、插件系统、Monorepo 策略 |

## 面试要点速览

```
Monorepo 高频面试题
═══════════════════════════════════════════════════════

1. Monorepo 和 Multirepo 的区别？各自的优缺点？
2. pnpm workspaces 的工作原理是什么？
3. Turborepo 和 Nx 的区别？如何选择？
4. Monorepo 中如何处理依赖版本不一致的问题？
5. 如何实现 Monorepo 的增量构建和缓存？
6. Monorepo 中如何管理不同项目的发布版本？
7. 如何在 CI/CD 中优化 Monorepo 的构建效率？
8. 大型 Monorepo 的最佳实践有哪些？
```
