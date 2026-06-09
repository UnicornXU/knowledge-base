---
sidebar_position: 4
title: "Monorepo 方案"
difficulty: "medium"
tags: ["engineering", "monorepo", "turborepo", "pnpm"]
---

# Monorepo 方案

## 什么是 Monorepo？

Monorepo（单一仓库）是将多个项目/包放在同一个 Git 仓库中管理的策略。

### Monorepo vs Multirepo

| 对比 | Monorepo | Multirepo |
|------|----------|-----------|
| 仓库数量 | 一个 | 每个项目独立 |
| 代码共享 | 直接引用 | npm 发包 |
| 原子提交 | ✅ 支持 | ❌ 不支持 |
| 依赖管理 | 统一版本 | 各自管理 |
| CI 复杂度 | 需要增量构建 | 简单独立 |
| 适用场景 | 中大型团队、组件库 | 独立项目、微服务 |

## pnpm Workspace

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

```json
// 根目录 package.json
{
  "name": "my-monorepo",
  "private": true,
  "scripts": {
    "dev": "pnpm -r --parallel run dev",
    "build": "pnpm -r run build",
    "lint": "pnpm -r run lint",
    "test": "pnpm -r run test"
  }
}
```

### 包之间互相引用

```json
// apps/web/package.json
{
  "dependencies": {
    "@my/ui": "workspace:*",
    "@my/utils": "workspace:*"
  }
}
```

## Turborepo

Turborepo 是 Monorepo 的构建编排工具，提供增量构建和任务缓存。

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### 核心特性

```bash
# 增量构建 — 只构建发生变化的包
turbo run build

# 远程缓存 — 团队共享构建缓存
turbo run build --cache-dir=.turbo

# 过滤 — 只运行指定包的任务
turbo run build --filter=@my/ui
turbo run test --filter=./packages/*

# 并行执行
turbo run build --concurrency=15
```

## Nx（替代方案）

```json
// nx.json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "test", "lint"]
      }
    }
  }
}
```

```bash
# Nx 常用命令
nx build my-app          # 构建指定项目
nx affected:test         # 只测试受影响的项目
nx graph                 # 查看依赖关系图
nx generate @nx/react:component Button --project=ui  # 生成组件
```

## 常见 Monorepo 工具对比

| 工具 | 特点 | 适用场景 |
|------|------|---------|
| pnpm workspace | 原生支持，轻量 | 基础 Monorepo 管理 |
| Turborepo | 增量构建，远程缓存 | 中大型 Monorepo |
| Nx | 全功能，插件丰富 | 企业级大型项目 |
| Lerna | npm 包发布管理 | 组件库发布（已维护减少） |
| Rush | 微软出品，企业级 | 超大型仓库 |

## 面试高频问题

### Q: 为什么选择 pnpm 而不是 npm/yarn？

**回答要点：**
1. **磁盘效率** — 通过硬链接和内容寻址存储，相同依赖只保留一份
2. **安装速度** — 并行安装 + 硬链接，比 npm/yarn 快 2-3 倍
3. **严格依赖** — 默认非扁平 node_modules，防止幽灵依赖
4. **Workspace 原生支持** — 不需要额外工具即可管理 Monorepo

```bash
# pnpm 的 node_modules 结构
node_modules/
  .pnpm/          # 所有包的实际文件（硬链接）
  react/          # 只有直接依赖暴露在顶层
  vue/
```

### Q: Monorepo 如何实现增量构建？

**回答要点：**
1. **依赖图分析** — 构建工具分析包之间的依赖关系
2. **变更检测** — 通过 git diff 或文件 hash 检测变化
3. **任务编排** — 按依赖拓扑顺序执行，支持并行
4. **缓存策略** — 缓存构建产物，命中缓存直接跳过
5. **远程缓存** — CI 和本地共享缓存，避免重复构建
