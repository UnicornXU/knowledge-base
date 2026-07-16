---
sidebar_position: 9
title: '从零构建你的第一个 Agent'
difficulty: 'medium'
tags: ['agent', '实战', '项目', 'tutorial']
---

# 从零构建你的第一个 Agent

理论学完了，这一章我们动手做一个**真正能跑的 Agent**——一个信息调研助手。它会自己搜索网页、提取内容、记住对话历史、规划任务，最终给你一份调研报告。

> 这是本手册的"毕业项目"。跟着一步步敲完，你就真正入门了 Agent 开发。

## 项目目标

构建一个 **Research Agent（信息调研助手）**，能力包括：

1. **基础对话**：能和你自然交流
2. **网页搜索**：调用搜索工具获取实时信息
3. **内容提取**：从搜索结果中提取关键信息
4. **对话记忆**：记住你们聊过什么
5. **任务规划**：把"帮我调研 XX"拆成搜索步骤
6. **友好交互**：显示思考过程，错误有提示

## 技术栈与环境搭建

| 技术         | 用途         |
| ------------ | ------------ |
| Node.js 20+  | 运行环境     |
| TypeScript   | 开发语言     |
| `openai` SDK | 调用 LLM     |
| `dotenv`     | 管理环境变量 |

### 初始化项目

```bash
mkdir research-agent && cd research-agent
npm init -y
npm install openai dotenv
npm install -D typescript ts-node @types/node
npx tsc --init
```

### 配置环境变量

创建 `.env` 文件：

```bash
# .env
OPENAI_API_KEY=sk-你的key
# 可选：换成兼容 OpenAI 接口的其他服务商
# OPENAI_BASE_URL=https://api.deepseek.com/v1
```

创建 `tsconfig.json`（关键配置）：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "./dist",
    "resolveJsonModule": true
  },
  "include": ["src"]
}
```

项目结构：

```
research-agent/
├── src/
│   ├── tools.ts        # 工具定义
│   ├── memory.ts       # 记忆系统
│   ├── agent.ts        # Agent 核心
│   └── index.ts        # 入口（交互循环）
├── .env
├── package.json
└── tsconfig.json
```

## Step 1: 基础对话能力

先让 Agent 能聊天。创建 `src/agent.ts`：

```typescript
// src/agent.ts
import OpenAI from 'openai';
import 'dotenv/config';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL, // 可选
});

export class ResearchAgent {
  private systemPrompt: string;

  constructor(systemPrompt?: string) {
    this.systemPrompt =
      systemPrompt ?? '你是一个智能信息调研助手。你可以搜索网页获取信息，帮助用户完成调研任务。';
  }

  // 基础对话（Step 1 版本）
  async chat(messages: Array<{role: string; content: string}>): Promise<string> {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{role: 'system', content: this.systemPrompt}, ...messages] as any,
    });
    return response.choices[0].message.content!;
  }
}
```

创建入口 `src/index.ts`：

```typescript
// src/index.ts
import * as readline from 'readline';
import {ResearchAgent} from './agent';

const agent = new ResearchAgent();
const conversation: Array<{role: string; content: string}> = [];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask() {
  rl.question('\n你: ', async (input) => {
    if (input.trim() === 'exit') {
      console.log('再见！');
      rl.close();
      return;
    }

    conversation.push({role: 'user', content: input});
    const reply = await agent.chat(conversation);
    conversation.push({role: 'assistant', content: reply});

    console.log(`\nAgent: ${reply}`);
    ask();
  });
}

console.log('🤖 调研助手已启动，输入 exit 退出');
ask();
```

运行测试：`npx ts-node src/index.ts`。现在它能聊天了，但还不能搜索。下一步加工具。

## Step 2: 添加工具（网页搜索 + 内容提取）

创建 `src/tools.ts`：

```typescript
// src/tools.ts

// ===== 工具实现 =====

// 网页搜索（演示用模拟数据，实际可接 Tavily/SerpAPI）
export function searchWeb(query: string): string {
  const mockResults: Record<string, string> = {
    'AI Agent': 'AI Agent 是以 LLM 为大脑的智能系统，能自主规划和使用工具完成复杂任务...',
    'React 19': 'React 19 引入了 Actions、useOptimistic、use 等新特性...',
  };
  // 实际项目：
  // const res = await fetch(`https://api.tavily.com/search?q=${query}`, {...});
  // return await res.json();
  return mockResults[query] ?? `搜索「${query}」的结果：这里是模拟的搜索摘要，包含相关信息。`;
}

// 内容提取：从一段文本中提取关键要点
export function extractKeyPoints(text: string): string {
  // 简单实现：按句号分割，取前三句作为要点
  const sentences = text.split(/[。.！!？?]/).filter((s) => s.trim().length > 0);
  return sentences
    .slice(0, 3)
    .map((s, i) => `${i + 1}. ${s.trim()}`)
    .join('\n');
}

// ===== 工具 Schema（告诉模型有哪些工具）=====
export const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'searchWeb',
      description: '搜索网页获取实时信息，如最新资讯、技术文档、产品信息等',
      parameters: {
        type: 'object',
        properties: {
          query: {type: 'string', description: '搜索关键词'},
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'extractKeyPoints',
      description: '从一段文本中提取关键要点，便于总结',
      parameters: {
        type: 'object',
        properties: {
          text: {type: 'string', description: '要提取要点的文本'},
        },
        required: ['text'],
      },
    },
  },
];

// ===== 工具执行分发器 =====
export function executeTool(name: string, args: any): string {
  switch (name) {
    case 'searchWeb':
      return searchWeb(args.query);
    case 'extractKeyPoints':
      return extractKeyPoints(args.text);
    default:
      return `未知工具: ${name}`;
  }
}
```

更新 `src/agent.ts`，加入工具调用的 ReAct 循环：

```typescript
// src/agent.ts
import OpenAI from 'openai';
import 'dotenv/config';
import {tools, executeTool} from './tools';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

export class ResearchAgent {
  private systemPrompt: string;
  private maxIterations: number;

  constructor(systemPrompt?: string, maxIterations = 10) {
    this.systemPrompt =
      systemPrompt ??
      `你是一个智能信息调研助手。你可以使用工具搜索网页和提取要点。
面对调研任务，请：
1. 先思考需要搜索什么
2. 调用 searchWeb 搜索
3. 用 extractKeyPoints 提取要点
4. 综合信息给出回答`;
    this.maxIterations = maxIterations;
  }

  // 带 ReAct 循环的对话
  async chat(messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]): Promise<string> {
    const allMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {role: 'system', content: this.systemPrompt},
      ...messages,
    ];

    for (let i = 0; i < this.maxIterations; i++) {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: allMessages,
        tools,
      });

      const msg = response.choices[0].message;
      allMessages.push(msg);

      // 没有工具调用 → 返回最终回答
      if (!msg.tool_calls?.length) {
        return msg.content ?? '（无回答）';
      }

      // 执行工具调用
      for (const call of msg.tool_calls) {
        const args = JSON.parse(call.function.arguments);
        console.log(`  🔧 调用工具: ${call.function.name}(${JSON.stringify(args)})`);
        const result = executeTool(call.function.name, args);
        console.log(`  👀 结果: ${result.slice(0, 60)}...`);
        allMessages.push({role: 'tool', tool_call_id: call.id, content: result});
      }
    }
    return '抱歉，任务过于复杂，未能在限定步数内完成。';
  }
}
```

现在 Agent 能搜索了！但每次对话都要把全部历史传进去，下一步加记忆管理。

## Step 3: 添加记忆（对话历史管理）

创建 `src/memory.ts`：

```typescript
// src/memory.ts

interface Message {
  role: string;
  content: string;
}

// 带滑动窗口 + 摘要的记忆系统
export class ConversationMemory {
  private systemPrompt: string;
  private summary: string = '';
  private recentMessages: Message[] = [];
  private maxRecent: number; // 保留最近几条

  constructor(systemPrompt: string, maxRecent = 10) {
    this.systemPrompt = systemPrompt;
    this.maxRecent = maxRecent;
  }

  add(message: Message) {
    this.recentMessages.push(message);
    // 超出窗口，截断（保留 system prompt 不动）
    if (this.recentMessages.length > this.maxRecent) {
      // 把最旧的消息并入摘要（简化处理）
      const old = this.recentMessages.shift()!;
      this.summary += (this.summary ? '；' : '') + `${old.role}:${old.content.slice(0, 50)}`;
    }
  }

  getMessages(): Message[] {
    const messages: Message[] = [{role: 'system', content: this.systemPrompt}];
    if (this.summary) {
      messages.push({role: 'system', content: `之前对话摘要: ${this.summary}`});
    }
    messages.push(...this.recentMessages);
    return messages;
  }

  clear() {
    this.summary = '';
    this.recentMessages = [];
  }
}
```

更新 `src/index.ts` 使用记忆系统：

```typescript
// src/index.ts
import * as readline from 'readline';
import {ResearchAgent} from './agent';
import {ConversationMemory} from './memory';

const SYSTEM_PROMPT = `你是一个智能信息调研助手。你可以使用工具搜索网页和提取要点。
面对调研任务，请先思考需要搜索什么，再调用工具，最后综合信息给出回答。`;

const agent = new ResearchAgent(SYSTEM_PROMPT);
const memory = new ConversationMemory(SYSTEM_PROMPT, 10);

const rl = readline.createInterface({input: process.stdin, output: process.stdout});

function ask() {
  rl.question('\n你: ', async (input) => {
    if (input.trim() === 'exit') {
      console.log('再见！');
      rl.close();
      return;
    }

    memory.add({role: 'user', content: input});
    console.log('Agent 思考中...');
    const reply = await agent.chat(memory.getMessages() as any);
    memory.add({role: 'assistant', content: reply});

    console.log(`\nAgent: ${reply}`);
    ask();
  });
}

console.log('🤖 调研助手已启动（带记忆+工具），输入 exit 退出');
ask();
```

## Step 4: 添加规划（任务分解）

给 Agent 加上"先规划再执行"的能力。在 `agent.ts` 中增加规划方法：

```typescript
// 在 ResearchAgent 类中添加规划方法
async plan(goal: string): Promise<string[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `你是一个任务规划器。把调研目标拆解为 3-5 个搜索步骤。
返回 JSON: { "steps": ["步骤1", "步骤2", ...] }
每个步骤应该是一个具体的搜索方向。`,
      },
      { role: 'user', content: goal },
    ],
    response_format: { type: 'json_object' },
  });
  return JSON.parse(response.choices[0].message.content!).steps;
}

// 带规划的调研方法
async researchWithPlan(topic: string): Promise<string> {
  console.log('\n📋 制定调研计划...');
  const steps = await this.plan(topic);
  console.log('计划:', steps);

  let allFindings = '';
  for (let i = 0; i < steps.length; i++) {
    console.log(`\n▶️ 执行步骤 ${i + 1}/${steps.length}: ${steps[i]}`);
    // 每个步骤走一次 ReAct 循环
    const result = await this.chat([
      { role: 'user', content: `请搜索并总结：${steps[i]}` },
    ]);
    allFindings += `\n## ${steps[i]}\n${result}\n`;
  }

  // 最终汇总
  console.log('\n📝 汇总报告...');
  const report = await this.chat([
    {
      role: 'user',
      content: `基于以下调研发现，写一份结构清晰的调研报告：\n${allFindings}`,
    },
  ]);
  return report;
}
```

在 `index.ts` 中加入调研命令：

```typescript
// 在 ask() 函数中增加 /research 命令
function ask() {
  rl.question('\n你: ', async (input) => {
    if (input.trim() === 'exit') {
      console.log('再见！');
      rl.close();
      return;
    }

    // 特殊命令：带规划的深度调研
    if (input.startsWith('/research ')) {
      const topic = input.replace('/research ', '');
      console.log('🔬 开始深度调研...');
      const report = await agent.researchWithPlan(topic);
      console.log(`\n📊 调研报告:\n${report}`);
      ask();
      return;
    }

    // 普通对话
    memory.add({role: 'user', content: input});
    console.log('Agent 思考中...');
    const reply = await agent.chat(memory.getMessages() as any);
    memory.add({role: 'assistant', content: reply});
    console.log(`\nAgent: ${reply}`);
    ask();
  });
}

console.log('🤖 调研助手已启动（带规划+记忆+工具）');
console.log('   普通对话直接输入，深度调研用 /research <主题>');
console.log('   输入 exit 退出');
ask();
```

## Step 5: 完善错误处理和用户交互

最后一步，让 Agent 更健壮、更好用。完整版 `src/agent.ts`：

```typescript
// src/agent.ts（最终版）
import OpenAI from 'openai';
import 'dotenv/config';
import {tools, executeTool} from './tools';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

export class ResearchAgent {
  private systemPrompt: string;
  private maxIterations: number;

  constructor(systemPrompt?: string, maxIterations = 10) {
    this.systemPrompt = systemPrompt ?? '你是一个智能信息调研助手。';
    this.maxIterations = maxIterations;
  }

  async chat(messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]): Promise<string> {
    const allMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {role: 'system', content: this.systemPrompt},
      ...messages,
    ];

    for (let i = 0; i < this.maxIterations; i++) {
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: allMessages,
          tools,
        });

        const msg = response.choices[0].message;
        allMessages.push(msg);

        if (!msg.tool_calls?.length) {
          return msg.content ?? '（无回答）';
        }

        for (const call of msg.tool_calls) {
          const args = JSON.parse(call.function.arguments);
          console.log(`  🔧 ${call.function.name}(${JSON.stringify(args)})`);

          // 工具执行带错误处理
          let result: string;
          try {
            result = executeTool(call.function.name, args);
          } catch (e) {
            result = `工具执行出错: ${e instanceof Error ? e.message : e}。请换种方式。`;
          }
          allMessages.push({role: 'tool', tool_call_id: call.id, content: result});
        }
      } catch (error) {
        // API 调用失败的重试
        console.log(`  ⚠️ 第 ${i + 1} 轮出错，重试中...`);
        if (i === this.maxIterations - 1) {
          return `抱歉，处理过程中出错: ${error instanceof Error ? error.message : error}`;
        }
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
      }
    }
    return '任务未能在限定步数内完成。';
  }

  async plan(goal: string): Promise<string[]> {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `把调研目标拆为 3-5 个搜索步骤。返回 JSON: { "steps": [...] }`,
        },
        {role: 'user', content: goal},
      ],
      response_format: {type: 'json_object'},
    });
    return JSON.parse(response.choices[0].message.content!).steps;
  }

  async researchWithPlan(topic: string): Promise<string> {
    console.log('\n📋 制定计划...');
    const steps = await this.plan(topic);
    steps.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));

    let findings = '';
    for (let i = 0; i < steps.length; i++) {
      console.log(`\n▶️ 步骤 ${i + 1}/${steps.length}`);
      const result = await this.chat([{role: 'user', content: `搜索并总结: ${steps[i]}`}]);
      findings += `\n## ${steps[i]}\n${result}\n`;
    }

    console.log('\n📝 生成报告...');
    return this.chat([{role: 'user', content: `基于以下发现写调研报告:\n${findings}`}]);
  }
}
```

## 运行效果

```bash
npx ts-node src/index.ts
```

```
🤖 调研助手已启动（带规划+记忆+工具）
   普通对话直接输入，深度调研用 /research <主题>
   输入 exit 退出

你: 你好
Agent 思考中...
Agent: 你好！我是调研助手，可以帮你搜索信息、做调研。试试 /research AI Agent

你: /research AI Agent 在前端开发中的应用
🔬 开始深度调研...
📋 制定计划...
  1. 搜索 AI Agent 在前端开发中的最新应用案例
  2. 搜索 AI 辅助前端开发的工具和框架
  3. 搜索 AI Agent 对前端工程师工作流程的影响

▶️ 步骤 1/3
  🔧 searchWeb({"query":"AI Agent 前端开发 应用案例"})
  👀 结果: 搜索「AI Agent 前端开发 应用案例」的结果...

▶️ 步骤 2/3
  ...

📝 生成报告...
📊 调研报告:
# AI Agent 在前端开发中的应用调研报告
...
```

## 部署与优化建议

| 方向         | 建议                                                      |
| ------------ | --------------------------------------------------------- |
| **搜索工具** | 把模拟数据换成真实 API（Tavily / SerpAPI / Bing Search）  |
| **长期记忆** | 接入向量数据库（参考[记忆系统设计](./agent-memory.md)）   |
| **流式输出** | 用 `stream: true` 让回答逐字输出，体验更好                |
| **Web 界面** | 用 Next.js + Vercel AI SDK 包一层前端                     |
| **部署**     | 打包成 API 服务（Express/Hono），部署到 Vercel/Cloudflare |
| **成本控制** | 用 `gpt-4o-mini` 做规划，`gpt-4o` 只用于关键步骤          |
| **限流**     | 加请求频率限制，防止滥用                                  |

## 延伸：如何扩展为多 Agent 系统

当这个单 Agent 撑不住时，可以扩展为多 Agent：

```
当前（单 Agent）：
  调研助手 = 搜索 + 提取 + 规划 + 写报告

扩展为（多 Agent）：
  协调者
    ├── 搜索 Agent（专精搜索，配搜索 API）
    ├── 分析 Agent（专精信息分析）
    └── 写作 Agent（专精报告撰写）
```

参考 [多 Agent 协作系统](./agent-multiagent.md) 章节的实现方式，把 `ResearchAgent` 拆成多个角色即可。

## 完整项目回顾

我们分 5 步构建了一个完整的 Agent：

| 步骤   | 做了什么 | 对应知识点                   |
| ------ | -------- | ---------------------------- |
| Step 1 | 基础对话 | LLM API 调用                 |
| Step 2 | 添加工具 | Function Calling、ReAct 循环 |
| Step 3 | 添加记忆 | 滑动窗口、对话历史管理       |
| Step 4 | 添加规划 | 任务分解、Plan-and-Execute   |
| Step 5 | 错误处理 | 重试、降级、用户交互         |

## 小结

- 从零构建 Agent 的路径：**对话 → 工具 → 记忆 → 规划 → 健壮性**
- 核心是那个 **ReAct 循环**：思考 → 调工具 → 看结果 → 再思考
- 每一步都是增量添加，不要一上来就写复杂版本
- 真实项目要把模拟工具换成真实 API，并加上流式输出和 Web 界面
- 单 Agent 够用后再考虑扩展为多 Agent

## 下一步

你的 Agent 已经能跑了！想让它表现更好？最后一章 [Agent Prompt 工程](./agent-prompt-engineering.md) 教你打磨 System Prompt，让 Agent 更聪明、更可控。
