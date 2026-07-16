---
sidebar_position: 3
title: 'Agent 架构模式'
difficulty: 'medium'
tags: ['agent', 'architecture', 'ReAct', 'planning']
---

# Agent 架构模式

上一章我们知道了 Agent 是什么。这一章解决一个关键问题：**Agent 的"大脑"到底怎么组织它的思考和行动？** 这就是架构模式。

> 比喻：架构模式就像公司的"工作制度"。同样是完成任务，有的公司是"边想边干"（ReAct），有的是"先计划再执行"（Plan-and-Execute），有的是"按流程卡点走"（状态机）。

## 架构模式总览

| 模式                 | 核心思想               | 优点               | 缺点             | 适用场景       |
| -------------------- | ---------------------- | ------------------ | ---------------- | -------------- |
| **ReAct**            | 边推理边行动，循环往复 | 灵活、能纠错       | 可能绕圈子       | 大多数通用任务 |
| **Plan-and-Execute** | 先整体规划，再逐步执行 | 方向清晰、省 Token | 计划可能脱离实际 | 复杂多步任务   |
| **状态机**           | 预定义状态和跳转       | 可控、可预测       | 灵活性低         | 流程固定的任务 |
| **多 Agent**         | 多个角色分工协作       | 专精、可并行       | 协调复杂         | 大型复杂任务   |

下面逐一详解。

## 一、ReAct 模式（Reasoning + Acting）

### 核心思想

ReAct 是最经典的 Agent 模式。它的核心是**"想一步、做一步、看结果、再想下一步"**的循环：

```
Thought（思考）→ Action（行动）→ Observation（观察）→ Thought → ... → Final Answer
```

> 比喻：就像你做菜时——想"该切洋葱了"→ 切洋葱 → 看到切好了 → 想"该热油了"→ 热油 → 看油温够了 → ……一步步直到菜做好。

### 为什么 ReAct 好用

- **灵活**：每一步都根据上一步的真实结果决定，能应对意外
- **可纠错**：发现工具返回不对，下一步可以调整
- **透明**：思考过程可见，方便调试

### 完整代码示例

下面用原生 OpenAI SDK 实现一个 ReAct Agent。它能搜索网页和做数学计算：

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

// ---------- 1. 定义工具 ----------
// 工具就是普通的函数，Agent 会自己决定何时调用
function searchWeb(query: string): string {
  // 实际项目这里调用搜索 API，演示用模拟数据
  const mockDb: Record<string, string> = {
    '北京 天气': '北京今天晴，气温 15°C 到 28°C',
    '上海 天气': '上海今天多云，气温 20°C 到 26°C',
  };
  return mockDb[query] ?? `搜索结果：关于「${query}」的相关信息...`;
}

function calculate(expression: string): string {
  try {
    // 注意：生产环境不要用 eval，这里仅演示
    const result = Function(`"use strict"; return (${expression})`)();
    return String(result);
  } catch {
    return '计算错误：表达式不合法';
  }
}

// ---------- 2. 定义工具的 Schema（告诉模型有哪些工具可用）----------
const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'searchWeb',
      description: '搜索网页获取实时信息，如天气、新闻、价格等',
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
      name: 'calculate',
      description: '执行数学计算，支持加减乘除',
      parameters: {
        type: 'object',
        properties: {
          expression: {type: 'string', description: '数学表达式，如 28 - 15'},
        },
        required: ['expression'],
      },
    },
  },
];

// ---------- 3. 工具执行分发器 ----------
function executeTool(name: string, args: any): string {
  switch (name) {
    case 'searchWeb':
      return searchWeb(args.query);
    case 'calculate':
      return calculate(args.expression);
    default:
      return `未知工具: ${name}`;
  }
}

// ---------- 4. ReAct 核心循环 ----------
async function reactAgent(userTask: string, maxIterations = 10) {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: '你是一个能使用工具的助手。遇到需要实时信息或计算的任务，请调用相应工具。',
    },
    {role: 'user', content: userTask},
  ];

  for (let i = 0; i < maxIterations; i++) {
    console.log(`\n--- 第 ${i + 1} 轮思考 ---`);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      tools,
    });

    const message = response.choices[0].message;
    messages.push(message);

    // 如果模型没有调用工具，说明它给出了最终答案
    if (!message.tool_calls?.length) {
      console.log('✅ 最终回答:', message.content);
      return message.content;
    }

    // 模型决定调用工具 → 执行工具 → 把结果喂回去
    for (const toolCall of message.tool_calls) {
      const args = JSON.parse(toolCall.function.arguments);
      console.log(`🔧 调用工具: ${toolCall.function.name}(${JSON.stringify(args)})`);

      const result = executeTool(toolCall.function.name, args);
      console.log(`👀 观察结果: ${result}`);

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: result,
      });
    }
    // 拿到工具结果后，进入下一轮循环，让模型继续思考
  }

  return '达到最大迭代次数，任务未完成。';
}

// ---------- 5. 运行 ----------
reactAgent('帮我查一下北京和上海今天的天气，然后算出两地最高温相差多少度');
```

运行后你会看到 Agent 自己完成了：查北京天气 → 查上海天气 → 计算 28-26 → 给出答案。

:::tip ReAct 的精髓
ReAct 的精髓不在代码，而在那个 **for 循环**：每次让模型看完工具结果后**继续思考**，而不是直接输出。这个"继续思考"就是 Agent 区别于普通 API 调用的关键。
:::

## 二、Plan-and-Execute 模式

### 核心思想

ReAct 是"走一步看一步"，Plan-and-Execute 是"先看全局做计划，再照计划执行"：

```
Step 1: Planner 制定完整计划（拆成 N 个子任务）
Step 2: Executor 逐个执行子任务
Step 3: Re-planner（可选）根据执行结果重新规划
```

> 比喻：ReAct 像逛街随走随看，Plan-and-Execute 像出发前先用导航规划好整条路线。

### 适用场景

- 任务步骤多、彼此有依赖关系
- 想节省 Token（计划只需规划一次，不用每步都把全部上下文喂给模型）
- 需要可预览的计划（先给用户看计划，确认后再执行）

### 代码示例

```typescript
import OpenAI from 'openai';
const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

// ---------- 第一步：Planner 制定计划 ----------
async function makePlan(goal: string): Promise<string[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `你是一个任务规划器。把用户目标拆解为有序的子任务步骤。
返回 JSON 数组，每个元素是一个具体的子任务描述。只返回 JSON，不要其他内容。`,
      },
      {role: 'user', content: goal},
    ],
    response_format: {type: 'json_object'},
  });

  const parsed = JSON.parse(response.choices[0].message.content!);
  return parsed.steps ?? parsed.tasks ?? [];
}

// ---------- 第二步：Executor 执行单个子任务 ----------
async function executeStep(step: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: '你是任务执行器。认真完成给定的子任务，返回执行结果。',
      },
      {role: 'user', content: step},
    ],
  });
  return response.choices[0].message.content!;
}

// ---------- 主流程：先规划，再逐个执行 ----------
async function planAndExecute(goal: string) {
  console.log('📋 制定计划中...');
  const steps = await makePlan(goal);
  console.log('计划:', steps);

  const results: string[] = [];
  for (let i = 0; i < steps.length; i++) {
    console.log(`\n▶️ 执行步骤 ${i + 1}/${steps.length}: ${steps[i]}`);
    const result = await executeStep(steps[i]);
    results.push(result);
    console.log(`结果: ${result.slice(0, 80)}...`);

    // 可选：如果某步失败，可以触发重新规划
    // if (result.includes('失败')) { steps = await makePlan(...); }
  }

  return results;
}

planAndExecute('写一篇关于 AI Agent 的科普文章，包含定义、应用和未来展望');
```

### ReAct vs Plan-and-Execute 对比

| 维度           | ReAct                    | Plan-and-Execute           |
| -------------- | ------------------------ | -------------------------- |
| **规划时机**   | 每步现想                 | 开头一次性规划             |
| **灵活性**     | 高，随时调整             | 中，需重新规划才能改       |
| **Token 消耗** | 较高（每步带全量上下文） | 较低（执行器只需当前步骤） |
| **可预测性**   | 低                       | 高，计划可预览             |
| **适合任务**   | 探索性、不确定性高       | 步骤明确、可拆解           |

:::tip 实践建议
很多优秀 Agent 采用**混合模式**：先用 Planner 出一个粗略计划，执行时每个子任务内部用 ReAct 循环。这样既有全局方向，又有局部灵活性。
:::

## 三、基于状态机的 Agent 模式

### 核心思想

状态机模式把 Agent 的工作流程抽象成**有限个状态 + 状态之间的跳转条件**。Agent 始终处于某个状态，根据输入跳到下一个状态。

> 比喻：像电梯——有"开门、关门、上行、下行、停止"几个状态，按不同按钮跳到不同状态，不会乱来。

### 适用场景

- 流程相对固定、需要强可控（如客服、审批流程）
- 需要明确的状态追踪和错误恢复
- 需要可视化、可审计

### 代码示例

```typescript
// 定义状态
type AgentState = 'IDLE' | 'COLLECTING_INFO' | 'PROCESSING' | 'AWAITING_CONFIRM' | 'DONE';

// 定义状态跳转表
const transitions: Record<AgentState, (input: string) => AgentState> = {
  IDLE: (input) => (input.includes('查询') || input.includes('帮') ? 'COLLECTING_INFO' : 'IDLE'),
  COLLECTING_INFO: (input) => (input.includes('确认') ? 'PROCESSING' : 'COLLECTING_INFO'),
  PROCESSING: (input) => 'AWAITING_CONFIRM',
  AWAITING_CONFIRM: (input) => (input.includes('是') || input.includes('确认') ? 'DONE' : 'COLLECTING_INFO'),
  DONE: () => 'IDLE',
};

// 状态机驱动的 Agent
class StateMachineAgent {
  private state: AgentState = 'IDLE';
  private context: string[] = [];

  async handle(input: string): Promise<string> {
    this.context.push(input);

    // 根据当前状态执行对应逻辑
    let reply = '';
    switch (this.state) {
      case 'IDLE':
        reply = '你好，请告诉我你需要查询什么？';
        break;
      case 'COLLECTING_INFO':
        reply = `收到：${input}。请补充更多信息，或输入"确认"开始处理。`;
        break;
      case 'PROCESSING':
        reply = '正在处理中...处理完成，请确认结果是否符合预期？（是/否）';
        break;
      case 'AWAITING_CONFIRM':
        reply = input.includes('是') ? '任务完成！' : '好的，让我们重新收集信息。';
        break;
    }

    // 状态跳转
    this.state = transitions[this.state](input);
    return reply;
  }

  getState() {
    return this.state;
  }
}

// 使用
const agent = new StateMachineAgent();
console.log(await agent.handle('帮我查询订单')); // COLLECTING_INFO
console.log(await agent.handle('订单号 12345')); // COLLECTING_INFO
console.log(await agent.handle('确认')); // PROCESSING → AWAITING_CONFIRM
console.log(await agent.handle('是')); // DONE
```

状态机的优势是**可控、可预测、可可视化**，LangGraph 本质上就是一个状态机框架。

## 四、单 Agent vs 多 Agent 架构

### 单 Agent 架构

一个 Agent 包揽所有事，自带所有工具。

```
         ┌─────────────────────────┐
用户 ──→ │   单 Agent（全能选手）     │ ──→ 结果
         │  工具：搜索/计算/写文件...  │
         └─────────────────────────┘
```

**优点**：简单、上下文连贯、无通信开销
**缺点**：工具一多容易混乱、单点瓶颈、难以并行

### 多 Agent 架构

多个 Agent 各司其职，协作完成任务。

```
         ┌──────────┐
用户 ──→ │ 协调者     │ ──→ 结果
         └────┬─────┘
      ┌────────┼────────┐
      ▼        ▼        ▼
  ┌──────┐ ┌──────┐ ┌──────┐
  │搜索Agent│ │分析Agent│ │写作Agent│
  └──────┘ └──────┘ └──────┘
```

**优点**：专精、可并行、可扩展
**缺点**：通信复杂、上下文传递有损、调试难

### 对比

| 维度             | 单 Agent              | 多 Agent              |
| ---------------- | --------------------- | --------------------- |
| **复杂度**       | 低                    | 高                    |
| **工具管理**     | 一个 Agent 拿所有工具 | 每个 Agent 拿专属工具 |
| **并行能力**     | 弱（串行循环）        | 强（可并行执行）      |
| **上下文一致性** | 强                    | 弱（需传递）          |
| **适用规模**     | 中小任务              | 大型复杂任务          |

## 五、如何选择合适的架构模式

用下面这个决策流程来选：

```
你的任务流程是否固定（如客服流程）？
├── 是 → 状态机模式（可控、可预测）
└── 否 → 任务能否提前拆解成清晰步骤？
         ├── 能 → Plan-and-Execute（方向清晰、省 Token）
         └── 不能/不确定 → 任务规模大吗？
              ├── 中小 → ReAct（灵活、能纠错）
              └── 大 → 多 Agent（分工协作、可并行）
```

**实际建议**：

1. **新手起步**：永远先从 ReAct 开始，它最直观、最通用
2. **任务变复杂**：在 ReAct 基础上加 Plan 环节，演变成 Plan-and-Execute
3. **流程要可控**：引入状态机约束（LangGraph）
4. **单 Agent 撑不住**：才上多 Agent（别一上来就多 Agent，那是过度设计）

:::warning 常见误区
很多新手一上来就想搞多 Agent 系统，结果调试地狱、效果还不如单 Agent。**多 Agent 是"不得已"的选择，不是"显得高级"的选择**。能用单 Agent 解决的，就不要上多 Agent。
:::

## 小结

- **ReAct**：边想边做，循环纠错，最通用，新手首选
- **Plan-and-Execute**：先规划全局再执行，适合可拆解的复杂任务
- **状态机**：预定义状态和跳转，适合固定流程、强可控场景
- **多 Agent**：分工协作，适合大型任务，但别过度使用
- 选择原则：**从简单开始，按需升级**——ReAct → 加 Plan → 加状态约束 → 多 Agent

## 下一步

架构模式里反复出现"工具调用"，下一章我们就深入 [工具调用与 Function Calling](./agent-tools.md)，学会让 Agent 真正"动手"干活。
