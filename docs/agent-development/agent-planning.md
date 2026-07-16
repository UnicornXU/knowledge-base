---
sidebar_position: 6
title: "规划与推理能力"
difficulty: "medium"
tags: ["agent", "planning", "reasoning", "CoT"]
---

# 规划与推理能力

前面的章节让 Agent 有了"双手"（工具）和"记忆"。但如果你只给工具和记忆，Agent 还只是"会查东西的聊天机器人"。真正让 Agent 变强的，是**规划和推理能力**——它会"想"。

> 比喻：工具是手脚，记忆是笔记本，而规划推理是"大脑的前额叶"——负责制定计划、拆解任务、反思纠错。这是人区别于动物、Agent 区别于脚本的关键。

## 什么是 Agent 的规划能力

面对一个复杂任务，规划能力让 Agent 能：

1. **理解目标**：搞清楚用户到底要什么
2. **拆解任务**：把大目标分成可执行的小步骤
3. **安排顺序**：决定先做什么后做什么
4. **预判困难**：提前想到可能的问题
5. **反思纠错**：做错了能发现并调整

```
用户："帮我分析 React 和 Vue 哪个更适合做后台管理系统"

没有规划能力的 Agent：
  → 直接凭记忆瞎说一通（可能过时、片面）

有规划能力的 Agent：
  → 规划：①搜索 React 后台管理生态 ②搜索 Vue 后台管理生态
          ③对比开发效率 ④对比性能 ⑤对比社区 ⑥给出建议
  → 逐步执行，每步基于真实信息
```

## Chain of Thought（思维链）

### 原理

思维链（CoT）是让模型**"把思考过程写出来"**，而不是直接给答案。研究表明，一步步推理能显著提升模型在复杂问题上的准确率。

> 比喻：就像数学老师要求你"写解题过程"而不是只写答案。写过程能帮你理清思路、发现错误。

```
普通提问：
  Q: 一个商店有 23 个苹果，卖了 17 个，又进了 12 个，现在有几个？
  A: 18  （可能直接猜，容易错）

思维链提问：
  Q: 一个商店有 23 个苹果，卖了 17 个，又进了 12 个，现在有几个？请一步步思考。
  A: 原有 23 个，卖了 17 个，剩 23-17=6 个；又进了 12 个，6+12=18 个。答案是 18。
```

### 实现：在 Prompt 中引导思维链

```typescript
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 方式一：System Prompt 引导
const cotSystemPrompt = `你是一个善于推理的助手。面对复杂问题，请按以下格式回答：
1. 分析：拆解问题，明确已知条件和目标
2. 推理：一步步推导，写出思考过程
3. 结论：给出最终答案

即使问题简单，也要展示关键推理步骤。`;

async function askWithCoT(question: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: cotSystemPrompt },
      { role: 'user', content: question },
    ],
  });
  return response.choices[0].message.content;
}

// 方式二：在问题中加"一步步思考"
async function askSimple(question: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'user', content: `${question}\n\n请一步步思考后再回答。` },
    ],
  });
  return response.choices[0].message.content;
}
```

:::tip 思维链的本质
思维链不是什么魔法，本质是**让模型多生成一些"中间token"**，这些中间token相当于模型的"草稿纸"，帮助它理清逻辑再下结论。生成的中间步骤越多，复杂推理越准确。
:::

## 任务分解策略

复杂任务必须拆解。常见的分解策略：

### 1. 按流程分解（顺序依赖）

```
任务：写一篇技术博客
分解：选题 → 调研 → 列大纲 → 写初稿 → 修改 → 发布
（后一步依赖前一步的结果）
```

### 2. 按模块分解（可并行）

```
任务：对比 3 个前端框架
分解：[调研框架A] + [调研框架B] + [调研框架C] → 综合对比
（三个调研可并行，最后汇总）
```

### 3. 按难度分解（先易后难）

```
任务：构建一个全栈应用
分解：先做静态页面（易）→ 加交互逻辑（中）→ 接后端 API（难）
```

### 代码实现：LLM 驱动的任务分解

```typescript
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface SubTask {
  id: number;
  description: string;
  dependsOn: number[]; // 依赖哪些前置任务
}

async function decomposeTask(goal: string): Promise<SubTask[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `你是一个任务规划专家。将用户目标分解为具体的子任务。
返回 JSON 格式：
{
  "tasks": [
    { "id": 1, "description": "子任务描述", "dependsOn": [] },
    { "id": 2, "description": "子任务描述", "dependsOn": [1] }
  ]
}
规则：
- 每个子任务要具体可执行
- dependsOn 标明依赖关系
- 最多拆成 8 个子任务`,
      },
      { role: 'user', content: goal },
    ],
    response_format: { type: 'json_object' },
  });

  const data = JSON.parse(response.choices[0].message.content!);
  return data.tasks;
}

// 使用
decomposeTask('帮我调研并对比 React、Vue、Svelte 三个框架的性能').then((tasks) => {
  console.log('分解结果:');
  tasks.forEach((t) => console.log(`  ${t.id}. ${t.description} (依赖: ${t.dependsOn})`));
});
// 输出：
// 1. 搜索 React 性能基准测试数据 (依赖: [])
// 2. 搜索 Vue 性能基准测试数据 (依赖: [])
// 3. 搜索 Svelte 性能基准测试数据 (依赖: [])
// 4. 对比三者渲染性能 (依赖: [1,2,3])
// 5. 对比三者包体积 (依赖: [1,2,3])
// 6. 生成对比报告 (依赖: [4,5])
```

## 自我反思与纠错（Reflection）

优秀的 Agent 不是"做完就走"，而是**做完后检查自己做得对不对**，错了就改。这就是 Reflection（反思）机制。

> 比喻：就像写完作业自己检查一遍，发现错题自己改正。

### 反思循环

```
执行任务 → 生成结果 → 自我评估 → 发现问题？→ 是 → 修正 → 再评估
                                      ↓ 否
                                   输出结果
```

### 代码实现

```typescript
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 生成初版结果
async function generate(task: string): Promise<string> {
  const r = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: '你是一个专业的写作助手。' },
      { role: 'user', content: task },
    ],
  });
  return r.choices[0].message.content!;
}

// 反思：评估结果并给出改进建议
async function reflect(task: string, result: string): Promise<{ ok: boolean; feedback: string }> {
  const r = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `你是一个严格的审查员。评估以下内容是否很好地完成了任务。
返回 JSON: { "ok": true/false, "feedback": "改进建议，如果ok为true则留空" }
检查点：是否遗漏关键信息？是否有事实错误？是否偏题？`,
      },
      {
        role: 'user',
        content: `任务：${task}\n\n待审查内容：\n${result}`,
      },
    ],
    response_format: { type: 'json_object' },
  });
  return JSON.parse(r.choices[0].message.content!);
}

// 根据反馈改进
async function improve(task: string, result: string, feedback: string): Promise<string> {
  const r = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: '你是写作助手，根据反馈改进内容。' },
      {
        role: 'user',
        content: `任务：${task}\n\n当前内容：\n${result}\n\n改进建议：${feedback}\n\n请输出改进后的完整内容。`,
      },
    ],
  });
  return r.choices[0].message.content!;
}

// 完整的反思循环
async function generateWithReflection(task: string, maxRounds = 3): Promise<string> {
  let result = await generate(task);

  for (let i = 0; i < maxRounds; i++) {
    console.log(`\n🔄 反思第 ${i + 1} 轮...`);
    const { ok, feedback } = await reflect(task, result);

    if (ok) {
      console.log('✅ 审查通过，无需修改');
      return result;
    }

    console.log(`⚠️ 发现问题: ${feedback}`);
    result = await improve(task, result, feedback);
  }

  console.log('达到最大反思轮数，返回当前版本');
  return result;
}

// 使用：写一段代码说明并自我完善
generateWithReflection('解释 JavaScript 闭包，要给初学者讲明白，附带代码示例');
```

## ReAct 循环的完整实现

把推理（Reasoning）和行动（Acting）结合起来，就是 ReAct。前面架构章节给过一个版本，这里给一个**带显式思考日志**的增强版：

```typescript
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 工具
function searchWeb(q: string) {
  return `搜索「${q}」的结果：模拟数据...`;
}
function calculate(expr: string) {
  try {
    return String(Function(`return (${expr})`)());
  } catch {
    return '计算错误';
  }
}

const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'searchWeb',
      description: '搜索网页获取信息',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'calculate',
      description: '数学计算',
      parameters: {
        type: 'object',
        properties: { expression: { type: 'string' } },
        required: ['expression'],
      },
    },
  },
];

function executeTool(name: string, args: any): string {
  if (name === 'searchWeb') return searchWeb(args.query);
  if (name === 'calculate') return calculate(args.expression);
  return '未知工具';
}

async function reactAgent(task: string) {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `你是一个能使用工具的 Agent。面对任务，请：
1. 先思考（Thought）当前该做什么
2. 决定是否调用工具（Action）
3. 根据工具结果（Observation）继续思考
重复直到任务完成，给出最终答案。

可用工具：searchWeb（搜索）、calculate（计算）`,
    },
    { role: 'user', content: task },
  ];

  const log: string[] = [`🎯 任务: ${task}`];

  for (let step = 1; step <= 10; step++) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      tools,
    });

    const msg = response.choices[0].message;
    messages.push(msg);

    if (!msg.tool_calls?.length) {
      log.push(`\n✅ 最终答案:\n${msg.content}`);
      console.log(log.join('\n'));
      return msg.content;
    }

    for (const call of msg.tool_calls) {
      const args = JSON.parse(call.function.arguments);
      log.push(`\n[第${step}步] Thought: 需要${call.function.name}`);
      log.push(`         Action: ${call.function.name}(${JSON.stringify(args)})`);

      const result = executeTool(call.function.name, args);
      log.push(`         Observation: ${result}`);

      messages.push({ role: 'tool', tool_call_id: call.id, content: result });
    }
  }

  log.push('\n❌ 达到最大步数');
  console.log(log.join('\n'));
}

reactAgent('搜索 iPhone 15 和 iPhone 16 的价格，算出差价');
```

运行后你能清楚看到 Agent 的每一步思考，这就是 ReAct 的"透明性"。

## 规划失败的处理：回溯与重规划

Agent 不是万能的，计划可能失败。处理方式：

### 回溯

发现走错路了，退回上一步换条路：

```typescript
async function executeWithBacktrack(tasks: SubTask[]) {
  const results: Record<number, string> = {};
  let i = 0;

  while (i < tasks.length) {
    const task = tasks[i];
    console.log(`执行任务 ${task.id}: ${task.description}`);

    try {
      const result = await executeTask(task, results);
      // 检查结果是否合理
      if (result.quality === 'poor') {
        console.log(`⚠️ 任务 ${task.id} 结果质量差，回溯重试`);
        // 回溯：退回到依赖任务重新执行
        for (const dep of task.dependsOn) {
          delete results[dep];
          const depIndex = tasks.findIndex((t) => t.id === dep);
          i = Math.min(i, depIndex);
        }
        continue;
      }
      results[task.id] = result.output;
      i++;
    } catch (error) {
      console.log(`❌ 任务 ${task.id} 失败: ${error}`);
      // 重新规划剩余任务
      const remaining = tasks.slice(i);
      const newPlan = await replan(remaining, results);
      tasks = [...tasks.slice(0, i), ...newPlan];
    }
  }
}
```

### 重规划

当环境变化或计划走不通时，让 Planner 重新制定计划：

```typescript
async function replan(
  remainingTasks: SubTask[],
  doneResults: Record<number, string>
): Promise<SubTask[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `你是任务规划器。之前的计划部分失败了，请根据已完成的结果重新规划剩余任务。
返回 JSON: { "tasks": [{ "id": N, "description": "...", "dependsOn": [] }] }`,
      },
      {
        role: 'user',
        content: `已完成: ${JSON.stringify(doneResults)}\n待重新规划: ${JSON.stringify(remainingTasks)}`,
      },
    ],
    response_format: { type: 'json_object' },
  });
  return JSON.parse(response.choices[0].message.content!).tasks;
}
```

## Prompt Engineering 在规划中的关键作用

规划质量很大程度取决于 Prompt。关键技巧：

| 技巧 | 示例 | 作用 |
|------|------|------|
| **明确输出格式** | "返回 JSON 数组" | 让规划结果可程序解析 |
| **约束数量** | "最多 8 个子任务" | 防止过度拆解 |
| **要求标注依赖** | "标明 dependsOn" | 支持并行执行 |
| **提供示例** | Few-shot 给个范例 | 提升规划质量 |
| **要求可行性自评** | "评估每个子任务是否可执行" | 提前发现问题 |

```typescript
const planningPrompt = `你是一个任务规划专家。将目标分解为子任务。

要求：
1. 每个子任务必须是单一、可执行的动作
2. 子任务数量在 3~8 个之间
3. 标注依赖关系（dependsOn）
4. 如果某个子任务需要外部工具，在 description 中说明

示例：
目标："查北京到上海的航班并预订最便宜的"
输出：
{
  "tasks": [
    { "id": 1, "description": "用 searchFlights 搜索北京到上海的航班", "dependsOn": [] },
    { "id": 2, "description": "从结果中筛选价格最低的航班", "dependsOn": [1] },
    { "id": 3, "description": "用 bookFlight 预订该航班", "dependsOn": [2] }
  ]
}`;
```

## 小结

- **规划能力**让 Agent 能拆解复杂任务、安排步骤、预判困难
- **思维链（CoT）**：让模型"写出思考过程"，提升复杂推理准确率
- **任务分解**：按流程（顺序）、按模块（并行）、按难度（递进）三种策略
- **自我反思（Reflection）**：生成 → 评估 → 改进的循环，让 Agent 自我完善
- **ReAct 循环**：思考 → 行动 → 观察的显式日志，透明可调试
- **失败处理**：回溯（退回重试）+ 重规划（重新制定计划）
- **Prompt 是规划质量的关键**：明确格式、约束数量、标注依赖、提供示例

## 下一步

单个 Agent 的能力有限，复杂任务需要"组织"多个步骤。下一章 [工作流编排](./agent-workflow.md) 教你用 LangGraph 构建顺序、分支、循环和人在回路的工作流。
