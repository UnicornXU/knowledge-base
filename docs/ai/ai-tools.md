---
sidebar_position: 5
title: "AI 编程工具"
difficulty: "easy"
tags: ["ai", "tools", "cursor", "copilot"]
---

# AI 编程工具

## 主流 AI 编程工具对比

| 工具 | 类型 | 特点 | 适用场景 |
|------|------|------|---------|
| GitHub Copilot | IDE 插件 | 行级/函数级补全 | 日常编码 |
| Cursor | IDE（VS Code 分支） | 全局上下文理解 | 复杂重构 |
| Claude Code | CLI/IDE | 深度代码理解 | 架构设计、代码审查 |
| Windsurf | IDE | 全局代码感知 | 项目级修改 |
| Cline | VS Code 插件 | 自主编码代理 | 自动化任务 |

## GitHub Copilot 使用技巧

### 注释驱动开发

```typescript
// 实现一个防抖函数，支持取消和立即执行选项
// → Copilot 会生成完整的 debounce 实现

// 创建一个 React Hook 用于管理表单状态
// 支持验证、提交、重置功能
// → Copilot 会生成 useForm Hook
```

### 测试驱动

```typescript
// 先写测试，让 Copilot 生成实现
describe('parseMarkdown', () => {
  it('should parse headings', () => {
    expect(parseMarkdown('# Hello')).toEqual({
      type: 'heading',
      level: 1,
      content: 'Hello',
    });
  });

  it('should parse bold text', () => {
    expect(parseMarkdown('**bold**')).toEqual({
      type: 'bold',
      content: 'bold',
    });
  });
});

// → Copilot 会根据测试生成 parseMarkdown 函数
```

## Cursor 使用技巧

### Cmd+K：内联编辑

```typescript
// 选中代码后按 Cmd+K
// 输入指令：将这个函数改为使用 async/await 语法
// Cursor 会直接修改选中的代码

// 输入：给这个组件添加 TypeScript 类型
// Cursor 会添加完整的类型定义
```

### Cmd+L：对话模式

```
@codebase 这个项目的状态管理方案是什么？
帮我找到所有未使用的导出函数
解释一下这个文件的架构设计
```

### @ 符号引用

```
@file:src/utils/helpers.ts  - 引用特定文件
@folder:src/components/      - 引用整个目录
@codebase                    - 引用整个代码库
@web                         - 搜索网络
@docs                        - 引用文档
```

## Claude Code 最佳实践

### CLAUDE.md 配置

```markdown
# 项目说明
这是一个 React + TypeScript 的电商前端项目

# 代码规范
- 使用函数式组件和 Hooks
- 使用 Zustand 管理状态
- 使用 Tailwind CSS 样式
- 所有组件需要 TypeScript 类型

# 常用命令
- npm run dev: 启动开发服务器
- npm run test: 运行测试
- npm run build: 构建生产版本
```

### 代码审查

```bash
# 让 Claude Code 审查代码
> 审查 src/components/ 目录下的所有组件，检查性能问题

# 生成测试
> 为 src/utils/helpers.ts 生成完整的单元测试

# 重构建议
> 分析这个文件的复杂度，建议如何拆分
```

## AI 辅助编码的局限性

```
✅ 适合：
- 生成模板代码和样板代码
- 编写测试用例
- 代码补全和重构
- 解释复杂代码
- 生成文档和注释

⚠️ 需要人工审查：
- 业务逻辑的正确性
- 安全相关代码
- 性能敏感的实现
- 第三方 API 的使用方式

❌ 不适合：
- 架构设计决策
- 需求理解和产品判断
- 复杂的业务逻辑推理
```

## 关键点

- AI 工具是**辅助**而非替代，核心判断仍需人工
- 好的提示词（Prompt）能显著提升 AI 输出质量
- 始终审查 AI 生成的代码，尤其是安全相关部分
- 不同工具适合不同场景，可以组合使用
- AI 工具在快速原型开发和学习新技术时特别有用
