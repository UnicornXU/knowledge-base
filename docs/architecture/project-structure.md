---
sidebar_position: 1
title: "项目架构与目录设计"
difficulty: "high"
tags: ["architecture", "monorepo", "ddd", "layered-architecture"]
---

# 项目架构与目录设计

## 为什么目录结构很重要？

```
糟糕的目录结构：              优秀的目录结构：
src/                         src/
├── components/              ├── features/
│   ├── Button.tsx           │   ├── auth/
│   ├── UserProfile.tsx      │   │   ├── components/
│   ├── DashboardHeader.tsx  │   │   ├── hooks/
│   ├── LoginModal.tsx       │   │   ├── services/
│   ├── Sidebar.tsx          │   │   ├── types/
│   ├── DataTable.tsx        │   │   └── index.ts
│   ├── Chart.tsx            │   ├── dashboard/
│   ├── ... (200+ 文件)      │   │   ├── components/
│   └── ...                  │   │   ├── hooks/
├── utils/                   │   │   ├── services/
│   ├── helpers.ts (1000行)  │   │   └── index.ts
│   └── ...                  │   └── user/
└── ...                      │       ├── components/
                             │       ├── hooks/
找一个组件要 10 分钟            │       └── index.ts
                             ├── shared/
                             │   ├── components/
                             │   ├── hooks/
                             │   └── utils/
                             └── app/
                                 ├── layout/
                                 ├── providers/
                                 └── routes/
                             
找一个组件只要 10 秒
```

## 一、Monorepo 架构

### 1.1 什么是 Monorepo？

Monorepo 是将多个项目/包放在同一个 Git 仓库中管理的策略。

### 1.2 Monorepo vs Multirepo

```
Monorepo：                      Multirepo：
┌─────────────────┐            ┌─────────┐  ┌─────────┐
│   git repo      │            │ repo-a  │  │ repo-b  │
│  ┌───────────┐  │            │         │  │         │
│  │  apps/    │  │            │  app-a  │  │  app-b  │
│  │  ├── web  │  │            │         │  │         │
│  │  └── admin│  │            └─────────┘  └─────────┘
│  │           │  │
│  │ packages/ │  │            代码共享：npm 发包
│  │  ├── ui   │  │            原子提交：不支持
│  │  └── utils│  │            版本管理：各自独立
│  └───────────┘  │
└─────────────────┘
  代码共享：直接引用
  原子提交：支持
  版本管理：统一
```

### 1.3 pnpm Workspace 配置

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
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  }
}
```

### 1.4 典型 Monorepo 目录结构

```
my-monorepo/
├── apps/
│   ├── web/                    # 主 Web 应用
│   │   ├── src/
│   │   ├── package.json
│   │   └── vite.config.ts
│   ├── admin/                  # 管理后台
│   │   ├── src/
│   │   └── package.json
│   └── mobile/                 # H5 应用
│       ├── src/
│       └── package.json
│
├── packages/
│   ├── ui/                     # 公共组件库
│   │   ├── src/
│   │   │   ├── Button/
│   │   │   ├── Modal/
│   │   │   └── index.ts
│   │   └── package.json
│   ├── utils/                  # 工具函数库
│   │   ├── src/
│   │   └── package.json
│   ├── shared/                 # 共享业务逻辑
│   │   ├── src/
│   │   └── package.json
│   └── config/                 # 共享配置
│       ├── eslint/
│       ├── tsconfig/
│       └── vite/
│
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
└── tsconfig.json
```

### 1.5 Turborepo 配置

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

## 二、分层架构

### 2.1 经典三层架构

```
┌─────────────────────────────────────────────┐
│              表现层 (Presentation)            │
│   组件、页面、样式、交互逻辑                   │
├─────────────────────────────────────────────┤
│              业务逻辑层 (Business)            │
│   状态管理、业务规则、数据转换                 │
├─────────────────────────────────────────────┤
│              数据访问层 (Data Access)         │
│   API 调用、缓存策略、数据持久化              │
└─────────────────────────────────────────────┘
```

### 2.2 前端分层目录结构

```
src/
├── presentation/              # 表现层
│   ├── components/            # 通用 UI 组件
│   ├── pages/                 # 页面组件
│   ├── layouts/               # 布局组件
│   └── styles/                # 样式文件
│
├── business/                  # 业务逻辑层
│   ├── stores/                # 状态管理
│   ├── hooks/                 # 业务 hooks
│   ├── services/              # 业务服务
│   └── validators/            # 业务校验
│
├── data/                      # 数据访问层
│   ├── api/                   # API 客户端
│   ├── repositories/          # 数据仓库
│   ├── models/                # 数据模型
│   └── cache/                 # 缓存策略
│
└── shared/                    # 共享层
    ├── utils/                 # 工具函数
    ├── constants/             # 常量定义
    ├── types/                 # 类型定义
    └── config/                # 配置
```

### 2.3 依赖规则

```typescript
// ✅ 正确：上层依赖下层
// presentation → business → data → shared

// pages/UserProfile.tsx
import { useUserStore } from '@/business/stores/user';
import { UserCard } from '@/presentation/components/UserCard';

// business/stores/user.ts
import { userRepository } from '@/data/repositories/user';
import { User } from '@/shared/types/user';

// data/repositories/user.ts
import { httpClient } from '@/shared/utils/http';
import { API_ENDPOINTS } from '@/shared/constants/api';
```

## 三、领域驱动设计（DDD）在前端的应用

### 3.1 DDD 核心概念

```
DDD 核心概念：
═══════════════════════════════════════

领域 (Domain)          → 业务问题空间
限界上下文 (Bounded Context) → 业务边界
聚合 (Aggregate)       → 一组相关对象的集合
实体 (Entity)          → 有唯一标识的对象
值对象 (Value Object)  → 没有唯一标识的对象
仓储 (Repository)      → 数据访问抽象
服务 (Service)         → 不属于任何实体的业务逻辑
```

### 3.2 前端 DDD 目录结构

```
src/
├── domains/                    # 领域层
│   ├── user/                   # 用户领域
│   │   ├── entities/           # 实体
│   │   │   └── User.ts
│   │   ├── value-objects/      # 值对象
│   │   │   ├── Email.ts
│   │   │   └── PhoneNumber.ts
│   │   ├── repositories/       # 仓储接口
│   │   │   └── IUserRepository.ts
│   │   ├── services/           # 领域服务
│   │   │   └── UserDomainService.ts
│   │   └── events/             # 领域事件
│   │       └── UserCreatedEvent.ts
│   │
│   ├── order/                  # 订单领域
│   │   ├── entities/
│   │   ├── value-objects/
│   │   ├── repositories/
│   │   └── services/
│   │
│   └── product/                # 产品领域
│       ├── entities/
│       ├── value-objects/
│       ├── repositories/
│       └── services/
│
├── application/                # 应用层
│   ├── user/                   # 用户应用服务
│   │   ├── use-cases/          # 用例
│   │   │   ├── GetUserProfile.ts
│   │   │   ├── UpdateUserProfile.ts
│   │   │   └── LoginUser.ts
│   │   └── dto/                # 数据传输对象
│   │       └── UserDTO.ts
│   │
│   └── order/
│       ├── use-cases/
│       └── dto/
│
├── infrastructure/             # 基础设施层
│   ├── repositories/           # 仓储实现
│   │   ├── HttpUserRepository.ts
│   │   └── LocalUserRepository.ts
│   ├── api/                    # API 客户端
│   └── cache/                  # 缓存实现
│
└── presentation/               # 表现层
    ├── features/               # 功能模块
    │   ├── user-profile/
    │   │   ├── UserProfilePage.tsx
    │   │   ├── UserAvatar.tsx
    │   │   └── useUserProfile.ts
    │   └── login/
    │       ├── LoginPage.tsx
    │       └── useLogin.ts
    └── shared/                 # 共享 UI
        ├── components/
        └── layouts/
```

### 3.3 实体与值对象

```typescript
// domains/user/entities/User.ts
export class User {
  constructor(
    public readonly id: string,
    public readonly email: Email,
    public readonly name: string,
    public readonly role: UserRole
  ) {}

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  changeName(newName: string): User {
    return new User(this.id, this.email, newName, this.role);
  }
}

// domains/user/value-objects/Email.ts
export class Email {
  private constructor(private readonly value: string) {}

  static create(email: string): Email {
    if (!Email.isValid(email)) {
      throw new Error(`Invalid email: ${email}`);
    }
    return new Email(email);
  }

  private static isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
```

### 3.4 仓储模式

```typescript
// domains/user/repositories/IUserRepository.ts
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}

// infrastructure/repositories/HttpUserRepository.ts
export class HttpUserRepository implements IUserRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async findById(id: string): Promise<User | null> {
    const data = await this.httpClient.get(`/users/${id}`);
    return data ? UserMapper.toDomain(data) : null;
  }

  async save(user: User): Promise<void> {
    const data = UserMapper.toPersistence(user);
    await this.httpClient.put(`/users/${user.id}`, data);
  }
}
```

## 四、Feature-Based 架构（推荐）

### 4.1 目录结构

```
src/
├── features/                   # 功能模块
│   ├── auth/                   # 认证模块
│   │   ├── components/         # 模块内组件
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── hooks/              # 模块内 hooks
│   │   │   ├── useAuth.ts
│   │   │   └── useLogin.ts
│   │   ├── services/           # 模块内服务
│   │   │   └── authService.ts
│   │   ├── stores/             # 模块内状态
│   │   │   └── authStore.ts
│   │   ├── types/              # 模块内类型
│   │   │   └── auth.types.ts
│   │   └── index.ts            # 模块导出
│   │
│   ├── dashboard/              # 仪表盘模块
│   │   ├── components/
│   │   ├── hooks/
│   │   └── index.ts
│   │
│   └── user/                   # 用户模块
│       ├── components/
│       ├── hooks/
│       └── index.ts
│
├── shared/                     # 共享层
│   ├── components/             # 通用组件
│   │   ├── ui/                 # 基础 UI 组件
│   │   └── layout/             # 布局组件
│   ├── hooks/                  # 通用 hooks
│   ├── utils/                  # 工具函数
│   ├── types/                  # 通用类型
│   └── constants/              # 常量定义
│
├── app/                        # 应用层
│   ├── routes/                 # 路由配置
│   ├── providers/              # 全局 Provider
│   ├── layouts/                # 根布局
│   └── App.tsx                 # 应用入口
│
└── main.tsx                    # 入口文件
```

### 4.2 模块导出规范

```typescript
// features/auth/index.ts
// 公共 API —— 外部只能访问这些
export { LoginForm } from './components/LoginForm';
export { RegisterForm } from './components/RegisterForm';
export { useAuth } from './hooks/useAuth';
export { authService } from './services/authService';
export type { User, LoginCredentials, AuthState } from './types/auth.types';

// 内部实现不导出 —— 外部无法访问
// features/auth/services/authService.internal.ts
```

### 4.3 模块间通信

```typescript
// ✅ 好：通过共享层通信
// features/dashboard/hooks/useDashboard.ts
import { useAuth } from '@/features/auth';      // 通过 index.ts
import { useUser } from '@/features/user';       // 通过 index.ts

// ❌ 坏：直接引用内部实现
import { authStore } from '@/features/auth/stores/authStore';
import { UserAvatar } from '@/features/user/components/UserAvatar';
```

## 五、微前端架构

### 5.1 微前端方案对比

| 方案 | 原理 | 优点 | 缺点 |
|------|------|------|------|
| **qiankun** | JS Entry + 沙箱 | 生态成熟、接入简单 | 性能一般、样式隔离不完美 |
| **Module Federation** | Webpack 5 模块共享 | 性能好、真正的模块共享 | 配置复杂、版本耦合 |
| **Micro-app** | Web Component | 接入简单、性能好 | 生态较小 |
| **无界** | Web Component + iframe | 隔离彻底 | 包体积较大 |

### 5.2 qiankun 基本配置

```typescript
// 主应用
import { registerMicroApps, start } from 'qiankun';

registerMicroApps([
  {
    name: 'react-app',
    entry: '//localhost:3001',
    container: '#micro-container',
    activeRule: '/react',
  },
  {
    name: 'vue-app',
    entry: '//localhost:3002',
    container: '#micro-container',
    activeRule: '/vue',
  },
]);

start();
```

## 面试要点

### 常见面试问题

1. **如何设计一个大型前端项目的目录结构？**
   - 按功能（Feature-Based）而非按类型组织代码
   - 使用 barrel exports 控制模块公共 API
   - 共享层提取通用逻辑

2. **Monorepo 和 Multirepo 如何选择？**
   - Monorepo：多项目共享代码、需要原子提交、团队规模较大
   - Multirepo：项目独立性强、团队自治、技术栈差异大

3. **DDD 在前端有什么价值？**
   - 明确业务边界、便于大型团队协作
   - 通过限界上下文降低耦合
   - 实体和值对象保证业务规则的一致性

4. **微前端架构的优缺点？**
   - 优点：独立部署、技术栈无关、团队自治
   - 缺点：通信复杂、样式隔离、性能开销

### 关键要点

- **Feature-Based 优于 Type-Based**：按功能组织代码更易维护
- **模块边界清晰**：通过 barrel exports 控制公共 API
- **依赖方向明确**：上层依赖下层，不反向引用
- **共享层提取**：通用逻辑放在 shared 目录
