---
sidebar_position: 4
title: 'AI 驱动的开发工作流'
difficulty: 'medium'
tags: ['ai', '工作流', 'TDD', 'code-review', '架构设计']
---

# AI 驱动的开发工作流

AI 工具不仅改变了"怎么写代码"，更在重塑整个开发流程。从需求分析到测试部署，AI 可以嵌入开发生命周期的每个环节。

## AI 时代开发流程的变化

### 传统流程 vs AI 增强流程

```
传统开发流程：
需求分析 → 技术设计 → 手动编码 → 手动测试 → Code Review → 部署
  (2天)      (1天)       (5天)       (2天)       (1天)     (0.5天)
                                                    总计 ≈ 11.5 天

AI 增强流程：
需求分析 → AI 辅助设计 → AI 编码+人工指导 → AI 生成测试 → AI Review → 部署
  (1天)      (0.5天)         (2天)            (0.5天)      (0.5天)   (0.5天)
                                                           总计 ≈ 5 天
```

:::info 核心理念
AI 增强流程的关键不是"让 AI 全部完成"，而是**人机协作**——AI 处理重复性工作，人类专注于决策和审核。
:::

### 角色转变

| 维度     | 传统开发者           | AI 时代开发者             |
| -------- | -------------------- | ------------------------- |
| 核心活动 | 手动编写每行代码     | 描述意图 + 审核 AI 输出   |
| 关键技能 | 语法记忆、API 熟悉度 | Prompt 工程、架构判断力   |
| 时间分配 | 70% 编码 / 30% 思考  | 30% 编码 / 70% 思考和审核 |
| 质量保障 | 个人经验 + 测试      | AI 辅助审查 + 自动化测试  |

## AI + TDD 工作流

### 流程概览

```
┌─────────────────────────────────────────────────┐
│  1. 编写需求描述                                   │
│  2. AI 根据需求生成测试用例                         │
│  3. 人工审核测试（补充边界情况）                     │
│  4. AI 根据测试实现代码                            │
│  5. 运行测试 → 通过则完成 / 失败则 AI 修复         │
│  6. 人工最终审核                                   │
└─────────────────────────────────────────────────┘
```

### 完整代码示例

**第一步：描述需求**

```markdown
Prompt: "我需要一个购物车模块，要求：

- 添加商品（支持指定数量）
- 删除商品
- 修改数量
- 计算总价（考虑折扣）
- 清空购物车"
```

**第二步：AI 生成测试**

```typescript
// cart.test.ts — AI 生成的测试
import {describe, it, expect, beforeEach} from 'vitest';
import {createCart, type Cart} from './cart';

describe('购物车模块', () => {
  let cart: Cart;

  beforeEach(() => {
    cart = createCart();
  });

  describe('添加商品', () => {
    it('应该能添加商品到空购物车', () => {
      cart.addItem({id: '1', name: 'T恤', price: 99, quantity: 1});
      expect(cart.getItems()).toHaveLength(1);
      expect(cart.getItems()[0].name).toBe('T恤');
    });

    it('重复添加同一商品应增加数量', () => {
      cart.addItem({id: '1', name: 'T恤', price: 99, quantity: 1});
      cart.addItem({id: '1', name: 'T恤', price: 99, quantity: 2});
      expect(cart.getItems()).toHaveLength(1);
      expect(cart.getItems()[0].quantity).toBe(3);
    });

    it('数量不能为负数或零', () => {
      expect(() => cart.addItem({id: '1', name: 'T恤', price: 99, quantity: 0})).toThrow('数量必须大于0');
    });
  });

  describe('计算总价', () => {
    it('应正确计算多个商品的总价', () => {
      cart.addItem({id: '1', name: 'T恤', price: 99, quantity: 2});
      cart.addItem({id: '2', name: '裤子', price: 199, quantity: 1});
      expect(cart.getTotal()).toBe(397); // 99*2 + 199
    });

    it('应用折扣后正确计算总价', () => {
      cart.addItem({id: '1', name: 'T恤', price: 100, quantity: 2});
      cart.applyDiscount(0.8); // 8 折
      expect(cart.getTotal()).toBe(160);
    });
  });

  describe('删除和修改', () => {
    it('应该能删除指定商品', () => {
      cart.addItem({id: '1', name: 'T恤', price: 99, quantity: 1});
      cart.removeItem('1');
      expect(cart.getItems()).toHaveLength(0);
    });

    it('应该能修改商品数量', () => {
      cart.addItem({id: '1', name: 'T恤', price: 99, quantity: 1});
      cart.updateQuantity('1', 5);
      expect(cart.getItems()[0].quantity).toBe(5);
    });

    it('清空购物车', () => {
      cart.addItem({id: '1', name: 'T恤', price: 99, quantity: 2});
      cart.clear();
      expect(cart.getItems()).toHaveLength(0);
      expect(cart.getTotal()).toBe(0);
    });
  });
});
```

**第三步：人工审核后，AI 生成实现**

```typescript
// cart.ts — AI 根据测试实现的代码
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Cart {
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  getItems: () => CartItem[];
  getTotal: () => number;
  applyDiscount: (rate: number) => void;
  clear: () => void;
}

export function createCart(): Cart {
  let items: CartItem[] = [];
  let discountRate = 1;

  return {
    addItem(item) {
      if (item.quantity <= 0) throw new Error('数量必须大于0');
      const existing = items.find((i) => i.id === item.id);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        items.push({...item});
      }
    },
    removeItem(id) {
      items = items.filter((i) => i.id !== id);
    },
    updateQuantity(id, quantity) {
      const item = items.find((i) => i.id === id);
      if (item) item.quantity = quantity;
    },
    getItems: () => [...items],
    getTotal: () => Math.round(items.reduce((sum, i) => sum + i.price * i.quantity, 0) * discountRate),
    applyDiscount(rate) {
      discountRate = rate;
    },
    clear() {
      items = [];
      discountRate = 1;
    },
  };
}
```

:::tip TDD + AI 的优势
先写测试再让 AI 实现代码，可以确保 AI 生成的代码有明确的正确性标准。测试就是最好的"验收条件"。
:::

## AI Code Review 工作流

### 让 AI 审查代码的 Prompt 模板

```markdown
请对以下 Pull Request 的代码变更进行审查：

变更文件：
@git [commit hash 或 branch diff]

审查清单：
□ 安全性 - 是否存在 XSS、CSRF、SQL 注入等风险
□ 性能 - 是否有 N+1 查询、内存泄漏、不必要的重渲染
□ 可维护性 - 命名是否清晰、逻辑是否过于复杂
□ 最佳实践 - 是否符合 React/Vue 官方推荐模式
□ 类型安全 - TypeScript 类型是否完备、是否有 any
□ 测试覆盖 - 关键路径是否有测试保障

输出格式：
🚨 严重问题（必须修复才能合并）
⚠️ 建议改进（推荐在本次修复）
💡 优化建议（可后续处理）
```

### 审查维度详解

| 维度     | AI 审查重点                | 人工补充重点         |
| -------- | -------------------------- | -------------------- |
| 安全性   | 常见漏洞模式匹配           | 业务逻辑层的权限问题 |
| 性能     | 算法复杂度、明显的性能问题 | 实际流量下的性能影响 |
| 可维护性 | 代码复杂度、重复代码       | 长期维护成本判断     |
| 最佳实践 | 框架官方推荐模式           | 团队约定的特殊模式   |

### 与 CI/CD 集成

```yaml
# .github/workflows/ai-review.yml
name: AI Code Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  ai-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Get PR Diff
        id: diff
        run: |
          echo "diff<<EOF" >> $GITHUB_OUTPUT
          git diff origin/main...HEAD >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT

      - name: AI Review
        uses: your-org/ai-review-action@v1
        with:
          diff: ${{ steps.diff.outputs.diff }}
          model: gpt-4
          rules: |
            - 检查安全漏洞
            - 检查性能问题
            - 检查类型安全
            - 遵循项目 .cursorrules 中的规范

      - name: Post Review Comments
        uses: actions/github-script@v7
        with:
          script: |
            // 将 AI 审查结果作为 PR Comment 发布
```

:::warning 重要提醒
AI Code Review 是**辅助手段，不能替代人工审查**。AI 擅长发现模式化问题（格式、命名、常见 Bug），但对业务逻辑的正确性判断能力有限。
:::

## Agent 辅助架构设计

### 用 AI 生成系统设计文档

```markdown
Prompt 示例：

"请为一个在线教育平台的前端架构进行设计，要求：

业务需求：

- 课程浏览和购买
- 视频播放（支持倍速、字幕、笔记）
- 实时互动（聊天、答题）
- 学习进度追踪

技术约束：

- React 18 + Next.js 14
- 预期用户量 10w DAU
- 首屏加载 < 2s
- 支持离线学习

请输出：

1. 整体架构图（模块划分）
2. 技术选型表（含理由）
3. 目录结构
4. 核心模块 API 设计
5. 性能优化策略"
```

### 用 AI 评估技术方案

```markdown
我们团队在讨论状态管理方案，候选：
A) Zustand —— 简洁轻量
B) Jotai —— 原子化状态
C) Redux Toolkit —— 生态成熟

项目背景：

- 中大型 B 端应用（50+ 页面）
- 5 人前端团队，经验 1-5 年不等
- 需要支持 SSR
- 有大量表单和列表场景

请从以下维度对比并给出推荐：

| 维度      | Zustand | Jotai | Redux Toolkit |
| --------- | ------- | ----- | ------------- |
| 学习成本  |         |       |               |
| 类型安全  |         |       |               |
| DevTools  |         |       |               |
| SSR 支持  |         |       |               |
| 性能      |         |       |               |
| 团队协作  |         |       |               |
| 生态/社区 |         |       |               |
```

### 用 AI 生成 API 设计

```markdown
请为用户模块设计 RESTful API：

实体：User（id, name, email, avatar, role, createdAt）

需要的端点：

- 用户注册/登录
- 获取用户信息
- 更新用户资料
- 用户列表（分页+搜索+筛选）
- 修改密码

输出格式（每个端点）：

- 方法 + 路径
- Request Body / Query Params 类型定义
- Response 类型定义
- 错误码定义
- 前端 TypeScript 接口代码
```

## 团队协作中的 AI 工作流

### 代码规范自动化

```markdown
团队共享 .cursorrules / .github/copilot-instructions.md：

# 项目规范（所有 AI 工具遵循）

## 代码风格

- 使用 ESLint + Prettier 标准配置
- 组件文件使用 PascalCase，工具文件使用 camelCase
- 单文件不超过 200 行，超过则拆分

## Git 规范

- Commit 格式：type(scope): message
- PR 标题格式同 Commit
- 每个 PR 不超过 300 行变更

## 组件规范

- 公共组件必须有 Storybook 示例
- 必须导出 Props 类型
- 必须处理 loading/error/empty 三种状态
```

### 文档自动生成

```typescript
// 用 AI 从代码自动生成 API 文档
// Prompt: "根据以下 API 路由文件，生成完整的 API 文档，
//          包含请求参数、响应格式、错误码、使用示例"

/**
 * @api {post} /api/auth/login 用户登录
 * @description AI 自动生成的文档
 *
 * @param {string} email - 用户邮箱
 * @param {string} password - 用户密码
 *
 * @returns {200} { token: string, user: User }
 * @returns {401} { error: "Invalid credentials" }
 * @returns {429} { error: "Too many attempts" }
 *
 * @example
 * const { data } = await api.post('/auth/login', {
 *   email: 'user@example.com',
 *   password: 'password123'
 * });
 */
```

### PR 描述自动撰写

```markdown
Prompt（配合 Git diff）：

"根据以下 git diff，生成一个规范的 PR 描述：

@git diff

PR 描述模板：

## 变更说明

[一句话总结]

## 变更类型

- [ ] 新功能
- [ ] Bug 修复
- [ ] 重构
- [ ] 文档

## 详细说明

[具体修改了什么，为什么要改]

## 测试方法

[如何验证这次变更]

## 截图（如有 UI 变更）

"
```

## AI 工作流的陷阱与应对

### 过度依赖的风险

| 陷阱     | 表现                  | 应对                       |
| -------- | --------------------- | -------------------------- |
| 技能退化 | 离开 AI 写不出代码    | 定期"裸写"练习核心逻辑     |
| 理解缺失 | 不理解 AI 生成的代码  | 要求 AI 解释每段代码的原理 |
| 盲目信任 | 不验证就合并 AI 代码  | 建立强制人工审查机制       |
| 调试无力 | AI 解决不了时束手无策 | 保持传统调试技能的锻炼     |

### 代码审查不能完全自动化

```
✅ AI 擅长审查的：
- 代码格式和风格一致性
- 常见安全漏洞模式
- 性能反模式（如循环中创建闭包）
- 未使用的变量和导入
- TypeScript 类型问题

❌ AI 不擅长审查的：
- 业务逻辑正确性
- 需求是否完整实现
- 用户体验是否合理
- 技术债务的长期影响
- 团队协作约定（口头约定的部分）
```

### 安全与隐私考量

:::warning 安全红线

| 风险       | 说明                       | 防范措施                     |
| ---------- | -------------------------- | ---------------------------- |
| 代码泄露   | 代码发送到第三方 API       | 评估工具的隐私政策           |
| 敏感信息   | API Key 等出现在 Prompt 中 | 使用 .env + .cursorignore    |
| 供应链攻击 | AI 建议安装恶意包          | 验证每个新依赖的来源         |
| 训练数据   | 代码可能被用于模型训练     | 选择承诺不训练的服务商       |
| 合规风险   | 生成代码的版权归属         | 了解公司法务对 AI 代码的政策 |

:::

## 最佳实践总结

```
AI 开发工作流黄金法则：

1. AI 生成，人类审核 — 永远保持最后的审核权
2. 小步快跑 — 复杂任务拆分为小的可验证步骤
3. 测试先行 — 先有测试标准，再让 AI 实现
4. 持续学习 — 通过 AI 输出学习新模式和最佳实践
5. 保持批判 — 质疑 AI 的每一个建议
6. 规则共享 — 团队统一 AI 配置规则
7. 渐进采纳 — 从低风险任务开始，逐步扩大 AI 参与度
```

:::tip 行动建议
从今天开始，选择一个低风险的日常任务（如写单元测试或生成工具函数），用 AI + TDD 的方式完成它。体验一次完整的 AI 增强工作流后，你会对如何融入 AI 有更直观的理解。
:::
