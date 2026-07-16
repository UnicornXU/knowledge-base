---
sidebar_position: 1
title: 'Agent 开发实战'
slug: /agent-development
---

# Agent 开发实战

> 如果说 ChatGPT 是一个"只会说不会做"的聊天机器人，那么 AI Agent 就是一个**能自己思考、决策、使用工具完成任务的智能助手**。本手册将带你从零开始，真正学会 Agent 开发。

## 这本手册解决什么问题

很多人对 AI Agent 的理解停留在"调一下 OpenAI API"，但真正的 Agent 开发远不止于此。一个完整的 Agent 需要：**感知环境 → 自主规划 → 调用工具 → 记忆上下文 → 反思纠错**。

本手册面向初学者，用通俗的比喻和大量可运行的 TypeScript 代码，带你走完 Agent 开发的全链路：

- **什么是 Agent**，它和普通聊天机器人有什么本质区别
- **Agent 的架构模式**：ReAct、Plan-and-Execute、状态机
- **工具调用**：Function Calling 怎么用、怎么自定义工具
- **记忆系统**：短期记忆、长期记忆、向量数据库
- **规划推理**：思维链、任务分解、自我反思
- **工作流编排**：顺序、分支、循环、人机协作
- **多 Agent 协作**：团队分工、通信、冲突解决
- **从零实战**：亲手构建一个信息调研 Agent

## 📚 内容导航

| 文档                                               | 难度  | 说明                                              |
| -------------------------------------------------- | ----- | ------------------------------------------------- |
| [什么是 AI Agent](./agent-concepts.md)             | 🟢 易 | Agent 定义、核心特征、与 Chatbot 的区别、主流框架 |
| [Agent 架构模式](./agent-architecture.md)          | 🟡 中 | ReAct、Plan-and-Execute、状态机、单/多 Agent 对比 |
| [工具调用与 Function Calling](./agent-tools.md)    | 🟡 中 | OpenAI Function Calling、自定义工具、工具编排     |
| [记忆系统设计](./agent-memory.md)                  | 🟡 中 | 短期/长期/工作记忆、向量数据库、上下文管理        |
| [规划与推理能力](./agent-planning.md)              | 🟡 中 | 思维链、任务分解、自我反思、ReAct 循环实现        |
| [工作流编排](./agent-workflow.md)                  | 🟡 中 | 顺序/分支/循环工作流、LangGraph、人机协作         |
| [多 Agent 协作系统](./agent-multiagent.md)         | 🔴 难 | 主从/对等/层级模式、CrewAI、双 Agent 实战         |
| [从零构建第一个 Agent](./agent-practice.md)        | 🟡 中 | 完整项目：对话→工具→记忆→规划→交互                |
| [Agent Prompt 工程](./agent-prompt-engineering.md) | 🟡 中 | System Prompt、角色定义、指令层级、防护机制       |

## 🎯 学习路线图

建议按下面的顺序循序渐进地学习：

```
什么是 AI Agent（建立认知）
        ↓
Agent 架构模式（理解骨架）
        ↓
工具调用 Function Calling（学会"动手"）  ←→  记忆系统设计（学会"记住"）
        ↓                                        ↓
        └──────────────┬─────────────────────────┘
                      ↓
            规划与推理能力（学会"思考"）
                      ↓
            工作流编排（学会"组织"）
                      ↓
       多 Agent 协作系统（学会"协作"）  ← 高阶，可后学
                      ↓
      从零构建第一个 Agent（综合实战）  ← 强烈推荐动手做
                      ↓
      Agent Prompt 工程（持续打磨）
```

:::tip 学习建议

- **第一遍**：快速通读"什么是 AI Agent"和"架构模式"，建立整体认知
- **第二遍**：重点啃"工具调用"和"记忆系统"，这是 Agent 的两条腿
- **第三遍**：跟着"从零构建第一个 Agent"动手敲代码，真正跑起来
- **进阶**：研究"多 Agent 协作"和"工作流编排"，构建复杂系统
  :::

## 前置知识

在开始之前，建议你具备以下基础：

| 知识点                  | 要求    | 说明                                |
| ----------------------- | ------- | ----------------------------------- |
| TypeScript / JavaScript | ✅ 必备 | 能看懂 async/await、接口、泛型      |
| OpenAI API 基础         | ✅ 必备 | 知道如何调用 Chat Completions       |
| Node.js                 | ✅ 必备 | 会用 npm/pnpm 安装依赖、运行脚本    |
| LLM 基本概念            | 🟡 推荐 | 了解 Token、上下文窗口、Temperature |
| 向量数据库              | 🟡 可选 | 知道 Embedding 是什么即可，手册会讲 |

## 一个 30 秒的直观感受

还没开始学，先看一段伪代码感受一下 Agent 到底在做什么：

```typescript
// 一个最简单的 Agent 循环
async function agentLoop(userTask: string) {
  let messages = [{role: 'user', content: userTask}];

  while (true) {
    // 1. 思考：我应该做什么？
    const decision = await llm.chat({
      messages,
      tools: [searchTool, calculatorTool, weatherTool],
    });

    // 2. 如果模型决定调用工具，就执行工具
    if (decision.toolCalls) {
      for (const call of decision.toolCalls) {
        const result = await executeTool(call); // 真正去搜索/计算/查天气
        messages.push({role: 'tool', content: result});
      }
      continue; // 拿到工具结果后，继续让模型思考
    }

    // 3. 如果模型不再调用工具，说明任务完成，输出最终回答
    return decision.content;
  }
}

// Agent 会自己决定：先搜索 → 再计算 → 最后总结
agentLoop('帮我查一下北京和上海今天的气温，然后算出两地温差');
```

这就是 Agent 的核心：**一个"思考 → 行动 → 观察"的不断循环，直到任务完成**。后面的章节会把这个循环拆开，一步步教你实现。

## 技术栈说明

本手册的代码示例统一使用以下技术栈：

- **语言**：TypeScript（运行在 Node.js 20+）
- **LLM SDK**：OpenAI Node SDK（`openai` 包）
- **框架示例**：LangChain.js / LangGraph.js / CrewAI（概念演示）
- **向量数据库**：以 MemoryVectorStore 等轻量方案演示原理

:::note 关于 API Key
手册中的代码示例需要 OpenAI API Key。你也可以把 `baseURL` 替换成兼容 OpenAI 接口的任意服务商（如 DeepSeek、通义千问、Moonshot 等），代码几乎不用改。
:::

## 🚀 准备好了吗

让我们从 [什么是 AI Agent](./agent-concepts.md) 开始吧！

import DocCardList from '@theme/DocCardList';

<DocCardList />
