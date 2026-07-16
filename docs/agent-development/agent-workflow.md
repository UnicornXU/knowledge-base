---
sidebar_position: 7
title: "工作流编排"
difficulty: "medium"
tags: ["agent", "workflow", "LangGraph", "状态机"]
---

# 工作流编排

前面的章节讲的都是"一个 Agent 怎么思考、怎么用工具、怎么记忆"。但现实中的任务往往需要**多个步骤按特定流程组织起来**——这就是工作流编排。

> 比喻：单个 Agent 像一个"全能员工"，工作流像"公司的标准作业流程（SOP）"。有了 SOP，即使员工能力一般，也能稳定产出高质量结果。

## 什么是 Agent 工作流

工作流把多个步骤（可能是多个 Agent、多个工具调用）按**预定结构**组织起来。它解决三个问题：

1. **顺序控制**：先做什么、后做什么
2. **条件分支**：根据结果走不同路线
3. **循环控制**：重复执行直到满足条件

```
没有工作流：Agent 自由发挥 → 结果不稳定、难复现
有工作流：  按流程走     → 结果可控、可调试、可优化
```

## 常见工作流模式

### 1. 简单顺序工作流

最基础的模式：A → B → C，前一步的输出是后一步的输入。

> 比喻：流水线——原料经过一道道工序变成成品。

```typescript
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 一个顺序工作流：调研 → 分析 → 写报告
async function sequentialWorkflow(topic: string) {
  // 步骤 1：调研
  const research = await callLLM(
    '你是调研员。收集关于以下主题的关键信息，列出要点。',
    topic
  );
  console.log('✅ 步骤1 调研完成');

  // 步骤 2：分析（基于调研结果）
  const analysis = await callLLM(
    '你是分析师。基于以下调研信息，分析趋势和洞察。',
    research
  );
  console.log('✅ 步骤2 分析完成');

  // 步骤 3：写报告（基于分析结果）
  const report = await callLLM(
    '你是报告撰写人。基于以下分析，写一份结构清晰的报告。',
    analysis
  );
  console.log('✅ 步骤3 报告完成');

  return report;
}

async function callLLM(system: string, user: string): Promise<string> {
  const r = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });
  return r.choices[0].message.content!;
}

sequentialWorkflow('2024 年 AI Agent 技术趋势');
```

### 2. 条件分支工作流

根据中间结果走不同路线。

> 比喻：高速公路的匝道——根据目的地走不同出口。

```typescript
// 工作流状态
interface WorkflowState {
  input: string;
  category?: string;
  result?: string;
}

// 分类节点：判断走哪个分支
async function classifyNode(state: WorkflowState): Promise<string> {
  const r = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: '判断用户问题属于哪类。只回答: "技术" / "闲聊" / "投诉"。',
      },
      { role: 'user', content: state.input },
    ],
  });
  state.category = r.choices[0].message.content!.trim();
  console.log(`🔀 分类结果: ${state.category}`);
  return state.category; // 返回路由 key
}

// 分支处理节点
async function techHandler(state: WorkflowState) {
  state.result = await callLLM('你是技术专家，回答技术问题。', state.input);
  return state;
}

async function chatHandler(state: WorkflowState) {
  state.result = await callLLM('你是友好的聊天伙伴。', state.input);
  return state;
}

async function complaintHandler(state: WorkflowState) {
  state.result = await callLLM('你是客服，安抚投诉用户并给出解决方案。', state.input);
  return state;
}

// 条件路由函数
function routeByCategory(category: string): string {
  switch (category) {
    case '技术': return 'tech';
    case '闲聊': return 'chat';
    case '投诉': return 'complaint';
    default: return 'chat';
  }
}

// 手动编排的条件分支工作流
async function conditionalWorkflow(input: string) {
  let state: WorkflowState = { input };

  // 1. 分类
  const category = await classifyNode(state);

  // 2. 根据分类路由到不同处理节点
  const route = routeByCategory(category);
  switch (route) {
    case 'tech': state = await techHandler(state); break;
    case 'chat': state = await chatHandler(state); break;
    case 'complaint': state = await complaintHandler(state); break;
  }

  return state.result;
}

conditionalWorkflow('我的代码报了 TypeError，怎么调试？');
```

### 3. 循环工作流（带退出条件）

重复执行某个步骤，直到满足退出条件。

> 比喻：洗衣机的"洗涤→漂洗→脱水"循环，直到衣服干净为止。

```typescript
interface DraftState {
  topic: string;
  draft: string;
  qualityScore: number;
  iteration: number;
}

// 写草稿
async function writeDraft(state: DraftState): Promise<DraftState> {
  state.draft = await callLLM(
    '你是技术写作专家，写一篇高质量文章。',
    state.topic + (state.draft ? `\n\n参考上一版改进：\n${state.draft}` : '')
  );
  state.iteration++;
  return state;
}

// 评估质量
async function evaluateDraft(state: DraftState): Promise<DraftState> {
  const r = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: '给文章打分（0-100）。只返回数字。',
      },
      { role: 'user', content: state.draft },
    ],
  });
  state.qualityScore = parseInt(r.choices[0].message.content!.trim(), 10);
  console.log(`📝 第 ${state.iteration} 版，质量分: ${state.qualityScore}`);
  return state;
}

// 循环工作流：写 → 评 → 不够好就再写
async function iterativeWorkflow(topic: string, targetScore = 80, maxLoops = 5) {
  let state: DraftState = {
    topic,
    draft: '',
    qualityScore: 0,
    iteration: 0,
  };

  while (state.qualityScore < targetScore && state.iteration < maxLoops) {
    state = await writeDraft(state);
    state = await evaluateDraft(state);
  }

  console.log(`✅ 完成！共迭代 ${state.iteration} 次，最终分数 ${state.qualityScore}`);
  return state.draft;
}

iterativeWorkflow('AI Agent 入门指南', 85);
```

## 使用 LangGraph 构建工作流

手动编排简单工作流没问题，但复杂工作流（多分支、多循环、状态共享）会让代码很乱。**LangGraph** 是专门为 Agent 工作流设计的框架，用"图"来组织节点和边。

> 比喻：手写工作流像"用 if-else 拼流程"，LangGraph 像"用流程图工具画流程"——更清晰、可可视化。

### LangGraph 核心概念

```
节点（Node）    = 一个处理步骤（函数）
边（Edge）      = 节点之间的跳转
条件边          = 根据状态决定下一个节点
状态（State）   = 在节点间共享的数据
```

### LangGraph 代码示例

```typescript
import { StateGraph, END, START } from '@langchain/langgraph';
import { Annotation } from '@langchain/langgraph';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 1. 定义工作流状态
const WorkflowState = Annotation.Root({
  input: Annotation<string>,
  category: Annotation<string>,
  result: Annotation<string>,
});

// 2. 定义节点（每个节点是一个函数，接收状态返回更新）
async function classifyNode(state: typeof WorkflowState.State) {
  const r = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: '分类为: 技术/闲聊/投诉。只回答类别名。' },
      { role: 'user', content: state.input },
    ],
  });
  return { category: r.choices[0].message.content!.trim() };
}

async function techNode(state: typeof WorkflowState.State) {
  const r = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: '你是技术专家。' },
      { role: 'user', content: state.input },
    ],
  });
  return { result: r.choices[0].message.content };
}

async function chatNode(state: typeof WorkflowState.State) {
  const r = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: '你是友好的聊天伙伴。' },
      { role: 'user', content: state.input },
    ],
  });
  return { result: r.choices[0].message.content };
}

// 3. 定义条件路由
function routeFunction(state: typeof WorkflowState.State): string {
  switch (state.category) {
    case '技术': return 'tech';
    case '投诉': return 'complaint';
    default: return 'chat';
  }
}

// 4. 构建图
const workflow = new StateGraph(WorkflowState)
  .addNode('classify', classifyNode)
  .addNode('tech', techNode)
  .addNode('chat', chatNode)
  // 边：起点 → 分类 → 条件路由 → 各处理节点 → 终点
  .addEdge(START, 'classify')
  .addConditionalEdges('classify', routeFunction, {
    tech: 'tech',
    chat: 'chat',
    complaint: 'chat', // 投诉暂归到 chat
  })
  .addEdge('tech', END)
  .addEdge('chat', END);

// 5. 编译并运行
const app = workflow.compile();

async function main() {
  const result = await app.invoke({ input: '怎么用 TypeScript 写一个防抖函数？' });
  console.log('分类:', result.category);
  console.log('回答:', result.result);
}

main();
```

:::tip LangGraph 的优势
- **可视化**：图结构天然可可视化，方便理解和调试
- **状态管理**：状态自动在节点间传递，不用手动传参
- **条件路由**：`addConditionalEdges` 让分支逻辑清晰
- **持久化**：支持 checkpoint，可暂停/恢复工作流
:::

## 人机协作（Human-in-the-loop）模式

有些操作风险高（如发邮件、删数据、转账），不能让 Agent 自动执行，需要**人工确认**。这就是 Human-in-the-loop（HITL）。

> 比喻：自动驾驶的"人工接管"——平时自己开，遇到复杂路况问司机要不要继续。

### 实现方式

```typescript
// 需要 human review 的节点
async function humanReviewNode(state: any): Promise<any> {
  console.log('\n⚠️  Agent 准备执行高风险操作，请确认：');
  console.log('操作:', state.proposedAction);
  console.log('参数:', JSON.stringify(state.actionParams));

  // 在实际应用中，这里可以：
  // 1. 暂停工作流，等待前端用户点击"确认/拒绝"
  // 2. 通过 WebSocket 推送给人工审核台
  // 3. 发邮件/消息给管理员审批

  const approved = await waitForHumanApproval(); // 模拟等待人工确认

  if (!approved) {
    return { ...state, result: '操作已被人工拒绝', cancelled: true };
  }

  // 确认后执行
  const result = await executeAction(state.proposedAction, state.actionParams);
  return { ...state, result };
}

// 模拟等待人工审批
function waitForHumanApproval(): Promise<boolean> {
  return new Promise((resolve) => {
    // 实际项目：监听前端事件 / 数据库状态变化
    // 这里简化为：3 秒后自动批准
    setTimeout(() => resolve(true), 3000);
  });
}
```

### HITL 的典型场景

| 场景 | 为什么需要人工 |
|------|--------------|
| 发送邮件/消息 | 内容可能不当，需确认 |
| 执行数据库删除 | 不可逆操作，需确认 |
| 资金交易 | 涉及金钱，需审批 |
| 代码提交/部署 | 影响生产环境，需 review |
| 生成最终报告 | 需人工把关质量 |

## 工作流可视化与调试

复杂工作流不调试就是黑盒。调试技巧：

```typescript
// 给每个节点加日志
function withLogging<T extends (...args: any[]) => any>(
  name: string,
  fn: T
): T {
  return (async (...args: any[]) => {
    console.log(`▶️ 进入节点: ${name}`);
    console.log(`   输入: ${JSON.stringify(args[0]).slice(0, 100)}...`);
    const start = Date.now();
    const result = await fn(...args);
    console.log(`✅ 离开节点: ${name} (耗时 ${Date.now() - start}ms)`);
    console.log(`   输出: ${JSON.stringify(result).slice(0, 100)}...`);
    return result;
  }) as T;
}

// 包装节点
const loggedClassify = withLogging('classify', classifyNode);
const loggedTech = withLogging('tech', techNode);
```

## 错误处理与重试机制

工作流中任何节点都可能失败。健壮的工作流需要错误处理：

```typescript
// 带重试的节点执行
async function executeWithRetry<T>(
  nodeFn: () => Promise<T>,
  nodeName: string,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await nodeFn();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️ 节点 ${nodeName} 第 ${attempt} 次失败: ${msg}`);
      if (attempt === maxRetries) {
        // 重试耗尽，走降级路径
        console.error(`❌ 节点 ${nodeName} 彻底失败，走降级路径`);
        throw new Error(`节点 ${nodeName} 失败: ${msg}`);
      }
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  throw new Error('unreachable');
}

// 工作流级别的降级：主流程失败走备用流程
async function workflowWithFallback(input: string) {
  try {
    // 主流程
    return await mainWorkflow(input);
  } catch (error) {
    console.log('主流程失败，启用降级流程...');
    // 降级流程：简化版、缓存版、人工兜底
    return await fallbackWorkflow(input);
  }
}
```

### 错误处理策略汇总

| 策略 | 适用场景 | 实现 |
|------|---------|------|
| **重试** | 网络抖动、临时故障 | 指数退避重试 N 次 |
| **降级** | 主流程失败 | 切换到简化备用流程 |
| **跳过** | 非关键节点失败 | 记录错误，继续后续节点 |
| **中断** | 关键节点失败 | 停止工作流，通知人工 |
| **回滚** | 已产生副作用 | 撤销已执行的操作 |

## 小结

- **工作流编排**把多个步骤按顺序/分支/循环组织起来，让 Agent 行为可控可复现
- **顺序工作流**：A→B→C 流水线；**条件分支**：根据结果路由；**循环工作流**：重复直到达标
- **LangGraph** 用"图"组织工作流，节点+边+条件路由，可可视化、可持久化
- **人机协作（HITL）**：高风险操作暂停等待人工确认
- **调试**：给节点加日志、可视化状态流转
- **错误处理**：重试、降级、跳过、中断、回滚五种策略按场景选择

## 下一步

工作流是"一个 Agent 的多条线"，当任务大到需要"多个 Agent 协作"时，就该上多 Agent 系统了。下一章 [多 Agent 协作系统](./agent-multiagent.md)。
