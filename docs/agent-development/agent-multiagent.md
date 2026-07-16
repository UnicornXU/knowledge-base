---
sidebar_position: 8
title: "多 Agent 协作系统"
difficulty: "hard"
tags: ["agent", "multi-agent", "协作", "CrewAI"]
---

# 多 Agent 协作系统

前面的章节都是"一个 Agent 包揽一切"。但就像公司里一个人干不过来要招人组团队一样，当任务复杂到一个 Agent 搞不定时，就需要**多个 Agent 协作**。

> 比喻：单 Agent 是"一个人创业"，什么都自己干；多 Agent 是"组建团队"，有人调研、有人写作、有人审核，各司其职。

:::warning 难度提示
这是本手册中难度最高的一章。建议你先学完前面的工具调用、记忆、规划和工作流，再来挑战多 Agent。多 Agent 是"锦上添花"，不是"必须先学"。
:::

## 为什么需要多 Agent 系统

单 Agent 在以下情况会力不从心：

| 问题 | 单 Agent 的困境 | 多 Agent 的解法 |
|------|---------------|----------------|
| **工具太多** | 20 个工具塞给一个 Agent，它选不准 | 拆成 3 个 Agent，每个 5-7 个工具 |
| **角色冲突** | 又要批判又要创作，Prompt 难写 | 写作 Agent 和审核 Agent 分开 |
| **上下文爆炸** | 所有信息堆在一起，Token 爆了 | 各 Agent 独立上下文，只传必要信息 |
| **无法并行** | 一个 Agent 串行干活慢 | 多个 Agent 同时干不同子任务 |
| **专业深度** | 一个 Prompt 难以面面俱到 | 每个 Agent 专精一个领域 |

```
单 Agent（全能选手，容易翻车）：
         ┌─────────────────────────────┐
用户 ──→ │  调研+分析+写作+审核 全包了    │ ──→ 质量???
         └─────────────────────────────┘

多 Agent（专业团队，各司其职）：
         ┌──────────┐
用户 ──→ │ 协调者     │
         └────┬─────┘
      ┌────────┼────────┐
      ▼        ▼        ▼
  ┌──────┐ ┌──────┐ ┌──────┐
  │调研Agent│ │写作Agent│ │审核Agent│  → 高质量产出
  └──────┘ └──────┘ └──────┘
```

## 多 Agent 协作模式

### 1. 主从模式（Hub-and-Spoke）

一个"主 Agent"负责分配任务，其他"从 Agent"执行具体工作。

> 比喻：项目经理分配任务给开发、测试、设计，各人做完汇报。

```
         ┌──────────┐
用户 ──→ │ 主 Agent   │ ──→ 汇总输出
         │ (协调者)   │
         └──┬───┬───┘
            │   │
       ┌────┘   └────┐
       ▼             ▼
  ┌─────────┐  ┌─────────┐
  │ 从 Agent1 │  │ 从 Agent2 │
  └─────────┘  └─────────┘
```

**优点**：中心化控制，流程清晰
**缺点**：主 Agent 是瓶颈，单点故障

### 2. 对等模式（Peer-to-Peer）

Agent 之间直接通信，没有中心协调者。

> 比喻：头脑风暴，大家平等讨论，互相补充。

```
  Agent A ←────→ Agent B
     ↕               ↕
  Agent C ←────→ Agent D
```

**优点**：灵活、可并行、无单点故障
**缺点**：容易跑偏、难收敛、可能死循环

### 3. 层级模式（Hierarchical）

多层级，上层 Agent 管下层 Agent，像公司组织架构。

> 比喻：CEO → 部门经理 → 员工，层层下达。

```
         ┌──────────┐
         │  顶层 Agent │
         └──┬───┬───┘
            │   │
     ┌──────┘   └──────┐
     ▼                  ▼
 ┌────────┐        ┌────────┐
 │中层Agent1│        │中层Agent2│
 └──┬──┬──┘        └──┬──┬──┘
    │  │               │  │
    ▼  ▼               ▼  ▼
  基层  基层          基层  基层
```

**优点**：适合超大型任务，分工精细
**缺点**：层级多信息失真大、调试难

### 模式选择

| 场景 | 推荐模式 |
|------|---------|
| 任务可清晰拆分，需统一协调 | 主从模式 |
| Agent 间需频繁讨论协商 | 对等模式 |
| 超大型任务，需分层管理 | 层级模式 |
| 新手起步 | **主从模式**（最可控） |

## Agent 之间的通信机制

多 Agent 要协作，就得"说话"。常见通信方式：

### 1. 直接消息传递

Agent A 的输出直接作为 Agent B 的输入：

```typescript
interface AgentMessage {
  from: string;
  to: string;
  content: string;
  timestamp: number;
}

class Agent {
  constructor(
    public name: string,
    public systemPrompt: string
  ) {}

  async receive(message: AgentMessage): Promise<string> {
    // 收到消息后处理并回复
    const response = await callLLM(
      this.systemPrompt,
      `${message.from} 说: ${message.content}`
    );
    return response;
  }
}
```

### 2. 共享黑板（Blackboard）

所有 Agent 读写同一个"黑板"（共享状态），通过黑板间接通信：

```typescript
// 共享黑板
class Blackboard {
  private data: Record<string, any> = {};

  write(key: string, value: any) {
    this.data[key] = value;
    console.log(`📋 黑板更新: ${key}`);
  }

  read(key: string): any {
    return this.data[key];
  }

  readAll(): Record<string, any> {
    return { ...this.data };
  }
}

// Agent 通过黑板协作
const blackboard = new Blackboard();

// 调研 Agent 把结果写到黑板
async function researchAgent(topic: string) {
  const result = await callLLM('你是调研员，收集信息。', topic);
  blackboard.write('research', result);
}

// 写作 Agent 从黑板读调研结果来写
async function writerAgent() {
  const research = blackboard.read('research');
  const article = await callLLM('你是作家，基于调研写文章。', research);
  blackboard.write('article', article);
}
```

## 角色定义与任务分配

多 Agent 系统的核心是"角色设计"。每个 Agent 要有**清晰的角色定义、专属工具、明确边界**。

```typescript
interface AgentRole {
  name: string;           // 角色名
  role: string;           // 角色定位
  goal: string;           // 目标
  backstory: string;      // 背景设定（影响风格）
  tools: string[];        // 专属工具
}

// 定义一个"内容生产团队"
const team: AgentRole[] = [
  {
    name: '调研员',
    role: '负责收集和整理信息',
    goal: '提供全面、准确、最新的调研资料',
    backstory: '你是一位严谨的行业研究员，擅长从多角度收集信息。',
    tools: ['searchWeb', 'readUrl'],
  },
  {
    name: '作家',
    role: '负责撰写内容',
    goal: '把调研资料写成通俗易懂、结构清晰的文章',
    backstory: '你是一位资深技术作家，擅长把复杂概念讲简单。',
    tools: ['writeFile'],
  },
  {
    name: '审核员',
    role: '负责质量把关',
    goal: '检查文章的准确性、完整性和可读性',
    backstory: '你是一位严格的编辑，眼里容不下错误。',
    tools: [],
  },
];
```

:::tip 角色设计原则
1. **职责不重叠**：每个 Agent 干的事别交叉，避免互相抢活
2. **目标可衡量**：每个角色的目标要清晰，方便评估
3. **工具专精**：给每个 Agent 只配它需要的工具
4. **边界明确**：明确规定谁负责什么，谁不负责什么
:::

## 使用 CrewAI 构建多 Agent 团队

**CrewAI** 是目前最流行的多 Agent 框架之一，它的"船员+任务+编队"模型非常直观。

> 比喻：CrewAI 就像组建一支探险队——定义船员（Agent）、分配任务（Task）、设定队形（Process）。

### CrewAI 核心概念

| 概念 | 类比 | 说明 |
|------|------|------|
| **Agent** | 船员 | 有角色、目标、工具的个体 |
| **Task** | 任务单 | 具体要完成的工作，分配给某个 Agent |
| **Crew** | 探险队 | 把 Agent 和 Task 组起来，定义执行方式 |
| **Process** | 队形 | 顺序执行 or 协作执行 |

### 代码示例（TypeScript 风格伪代码）

CrewAI 原生是 Python，这里用 TypeScript 风格展示核心思路（实际可用 LangGraph.js 实现同等效果）：

```typescript
// === 定义 Agent（船员）===
const researcher = {
  name: '研究员',
  role: '资深行业研究员',
  goal: '全面收集关于 {topic} 的信息，包括现状、趋势和案例',
  backstory: '你有 10 年行业研究经验，擅长多角度分析。',
  tools: ['searchWeb', 'readUrl'],
};

const writer = {
  name: '作家',
  role: '技术内容作家',
  goal: '把调研资料写成 2000 字的通俗文章',
  backstory: '你擅长把复杂技术讲得小白也能懂。',
  tools: [],
};

const reviewer = {
  name: '审核员',
  role: '严格的内容审核编辑',
  goal: '检查文章准确性、逻辑性和可读性，给出修改意见',
  backstory: '你是出版界的资深编辑，对质量要求极高。',
  tools: [],
};

// === 定义 Task（任务）===
const tasks = [
  {
    description: '调研主题：{topic}。收集关键信息、数据和案例。',
    agent: researcher,
    expectedOutput: '一份结构化的调研报告，包含 5 个关键发现',
  },
  {
    description: '基于调研报告，写一篇 2000 字的科普文章。',
    agent: writer,
    expectedOutput: '一篇结构清晰、通俗易懂的文章',
  },
  {
    description: '审核文章，检查事实准确性、逻辑连贯性和可读性。',
    agent: reviewer,
    expectedOutput: '审核意见 + 修改后的终稿',
  },
];

// === 组建 Crew 并执行 ===
const crew = {
  agents: [researcher, writer, reviewer],
  tasks: tasks,
  process: 'sequential', // 顺序执行：调研→写作→审核
};

// const result = await crew.kickoff({ topic: 'AI Agent 的应用前景' });
```

## 冲突解决与共识机制

多个 Agent 可能产生矛盾的观点（如写作 Agent 说"好"，审核 Agent 说"不行"）。需要冲突解决机制：

### 1. 仲裁者模式

引入第三方"仲裁 Agent"做最终裁决：

```typescript
async function resolveConflict(
  opinionA: string,
  opinionB: string,
  context: string
): Promise<string> {
  const r = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `你是仲裁者。两个 Agent 意见冲突，请基于事实和上下文做出公正裁决。
给出最终决定和理由。`,
      },
      {
        role: 'user',
        content: `上下文: ${context}\n\nAgent A 观点: ${opinionA}\n\nAgent B 观点: ${opinionB}`,
      },
    ],
  });
  return r.choices[0].message.content!;
}
```

### 2. 投票机制

多个 Agent 各出方案，少数服从多数：

```typescript
async function vote(proposals: string[]): Promise<string> {
  const r = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: '以下是多个方案，选出最佳的一个并说明理由。只返回被选方案的编号。',
      },
      { role: 'user', content: proposals.map((p, i) => `方案${i + 1}: ${p}`).join('\n\n') },
    ],
  });
  return r.choices[0].message.content!;
}
```

### 3. 迭代收敛

让冲突双方多轮讨论，逐步达成一致：

```typescript
async function debateUntilConsensus(
  agentA: Agent,
  agentB: Agent,
  topic: string,
  maxRounds = 3
): Promise<string> {
  let messageA = await agentA.receive({ from: 'user', content: topic, to: 'A' } as any);
  let messageB: string;

  for (let i = 0; i < maxRounds; i++) {
    messageB = await agentB.receive({ from: 'A', content: messageA, to: 'B' } as any);
    messageA = await agentA.receive({ from: 'B', content: messageB, to: 'A' } as any);

    // 检查是否达成一致
    if (await checkAgreement(messageA, messageB)) {
      return `达成共识：${messageA}`;
    }
  }
  return `未达成共识，采用 A 的最终观点：${messageA}`;
}
```

## 实战案例：研究 + 写作双 Agent 系统

下面用 TypeScript 从零实现一个"调研员 + 作家"双 Agent 系统（不依赖框架，理解原理）：

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 工具模拟
function searchWeb(query: string): string {
  return `搜索「${query}」的结果：模拟数据，包含关键信息...`;
}

// ===== 基础 Agent 类 =====
class BaseAgent {
  constructor(
    public name: string,
    public systemPrompt: string
  ) {}

  async run(userInput: string): Promise<string> {
    const r = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: userInput },
      ],
    });
    return r.choices[0].message.content!;
  }
}

// ===== 调研员 Agent（带搜索工具）=====
class ResearcherAgent extends BaseAgent {
  constructor() {
    super(
      '调研员',
      `你是一位资深调研员。你的任务是：
1. 分析研究主题，确定要搜索的关键词
2. 对每个关键词调用 searchWeb 工具获取信息
3. 整合搜索结果，输出结构化的调研报告

输出格式：
- 主题概述
- 关键发现（3-5 条）
- 数据与案例
- 总结`
    );
  }

  async research(topic: string): Promise<string> {
    console.log(`\n🔬 调研员开始工作：${topic}`);

    // 1. 让 Agent 决定搜索关键词
    const keywordsResp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: '为以下主题生成 3 个搜索关键词，用逗号分隔。只返回关键词。' },
        { role: 'user', content: topic },
      ],
    });
    const keywords = keywordsResp.choices[0].message.content!.split('，').map((s) => s.trim());

    // 2. 执行搜索
    const searchResults: string[] = [];
    for (const kw of keywords) {
      console.log(`  🔍 搜索: ${kw}`);
      searchResults.push(`【${kw}】${searchWeb(kw)}`);
    }

    // 3. 整合报告
    const report = await this.run(
      `主题：${topic}\n\n搜索结果：\n${searchResults.join('\n')}\n\n请整合成调研报告。`
    );
    console.log(`✅ 调研报告完成（${report.length} 字）`);
    return report;
  }
}

// ===== 作家 Agent =====
class WriterAgent extends BaseAgent {
  constructor() {
    super(
      '作家',
      `你是一位资深技术作家。你的任务是：
1. 阅读调研报告
2. 把它写成通俗易懂、结构清晰的文章
3. 字数 1500-2000 字
4. 用比喻和案例帮助读者理解

文章结构：引言 → 正文（分小节）→ 总结`
    );
  }

  async write(researchReport: string): Promise<string> {
    console.log(`\n✍️ 作家开始写作...`);
    const article = await this.run(`以下是调研报告，请改写成科普文章：\n\n${researchReport}`);
    console.log(`✅ 文章完成（${article.length} 字）`);
    return article;
  }
}

// ===== 协调者：编排双 Agent 协作 =====
class Coordinator {
  private researcher: ResearcherAgent;
  private writer: WriterAgent;

  constructor() {
    this.researcher = new ResearcherAgent();
    this.writer = new WriterAgent();
  }

  async run(topic: string): Promise<string> {
    console.log(`\n🎯 任务启动：${topic}`);

    // 第一步：调研员工作
    const report = await this.researcher.research(topic);

    // 第二步：作家基于调研写文章
    const article = await this.writer.write(report);

    console.log(`\n🎉 任务完成！`);
    return article;
  }
}

// ===== 运行 =====
const coordinator = new Coordinator();
coordinator.run('AI Agent 在教育领域的应用前景').then((article) => {
  console.log('\n===== 最终文章 =====');
  console.log(article);
});
```

这个例子展示了多 Agent 协作的本质：**每个 Agent 专精一件事，前一个的输出是后一个的输入，协调者负责编排**。

## 多 Agent 的陷阱与建议

| 陷阱 | 说明 | 建议 |
|------|------|------|
| **过度设计** | 简单任务也上多 Agent | 能单 Agent 就别多 Agent |
| **通信开销** | Agent 间传太多信息 | 只传必要的总结，别传原始数据 |
| **死循环** | 两个 Agent 互相踢皮球 | 设最大轮次限制 |
| **上下文丢失** | 信息层层传递后失真 | 用共享黑板而非纯消息传递 |
| **调试困难** | 不知道哪个 Agent 出错 | 每个 Agent 加详细日志 |
| **成本翻倍** | N 个 Agent = N 倍 API 调用 | 控制 Agent 数量和调用次数 |

:::warning 黄金法则
**先用单 Agent 做出能用的版本，遇到明确的瓶颈（工具太多/上下文爆炸/需并行）再上多 Agent。** 多 Agent 是"优化手段"，不是"起步方案"。
:::

## 小结

- **多 Agent 系统**通过角色分工解决单 Agent 工具太多、上下文爆炸、无法并行等问题
- 三种协作模式：**主从**（中心协调）、**对等**（自由通信）、**层级**（分层管理）
- 通信机制：**直接消息** 和 **共享黑板**
- 角色设计原则：职责不重叠、目标可衡量、工具专精、边界明确
- **CrewAI** 用"船员+任务+编队"模型组织多 Agent，直观易懂
- 冲突解决：仲裁者、投票、迭代收敛
- **核心建议**：能单 Agent 就别多 Agent，多 Agent 是优化不是起步

## 下一步

理论学够了，是时候动手了！下一章 [从零构建你的第一个 Agent](./agent-practice.md) 带你一步步实现一个完整的信息调研 Agent。
