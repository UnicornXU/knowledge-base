---
sidebar_position: 4
title: '工具调用与 Function Calling'
difficulty: 'medium'
tags: ['agent', 'tools', 'function-calling', 'OpenAI']
---

# 工具调用与 Function Calling

## 为什么需要工具调用

LLM 再聪明也有三个硬伤：

1. **知识有截止日期**——它不知道今天的天气、最新的股价
2. **不会算数**——复杂计算容易出错
3. **不能动手**——它没法发邮件、写文件、查数据库

**Function Calling（函数调用 / 工具调用）** 就是解决这三个问题的方案：让 LLM 能"调用"你预先写好的函数，从而获取实时数据、做精确计算、执行真实操作。

> 比喻：LLM 是一个聪明的调度员，它自己不干活，但能"下令"让对应的工具去干。Function Calling 就是这个"下令"的机制。

## Function Calling 的工作原理

整个流程分三步，一定要理解清楚：

```
① 你把"有哪些工具、每个工具怎么用"告诉模型（通过 tools 参数）
        ↓
② 模型分析用户问题，决定"要不要调工具、调哪个、参数是什么"
        ↓
③ 你的代码真正执行这个函数，把结果返回给模型，模型再据此回答
```

关键点：**模型本身不执行任何函数，它只是"建议"你该调用哪个函数。真正执行的是你的代码。** 这保证了安全性——模型不能偷偷干坏事。

## OpenAI Function Calling 完整示例

下面是一个最简单的示例，让模型决定是否调用天气查询工具：

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

// 1. 你自己写的函数
function getWeather(city: string, date: string): string {
  // 实际项目调用天气 API，这里用模拟数据
  const data: Record<string, string> = {
    '北京-今天': '晴，15~28°C',
    '上海-今天': '多云，20~26°C',
  };
  return data[`${city}-${date}`] ?? `${city}${date}天气数据暂无`;
}

// 2. 告诉模型这个函数的存在和用法（JSON Schema 格式）
const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'getWeather',
      description: '查询指定城市指定日期的天气',
      parameters: {
        type: 'object',
        properties: {
          city: {type: 'string', description: '城市名，如"北京"'},
          date: {type: 'string', description: '日期，如"今天"或"明天"'},
        },
        required: ['city', 'date'],
      },
    },
  },
];

async function main() {
  // 3. 第一次调用：让模型决定要不要用工具
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{role: 'user', content: '北京今天天气怎么样？'}],
    tools,
  });

  const message = response.choices[0].message;
  console.log('模型决定调用工具:', message.tool_calls);

  // 4. 如果模型要调工具，执行它，再把结果喂回去
  if (message.tool_calls?.length) {
    const toolCall = message.tool_calls[0];
    const args = JSON.parse(toolCall.function.arguments);

    // 真正执行你的函数
    const result = getWeather(args.city, args.date);

    // 把工具结果加到对话里，再调用一次模型
    const finalResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {role: 'user', content: '北京今天天气怎么样？'},
        message, // 模型说"我要调 getWeather"
        {role: 'tool', tool_call_id: toolCall.id, content: result}, // 工具结果
      ],
    });

    console.log('最终回答:', finalResponse.choices[0].message.content);
    // → "北京今天天气晴朗，气温 15 到 28 摄氏度。"
  }
}

main();
```

:::tip 理解对话流程
注意 messages 数组里的角色顺序：`user` → `assistant(带tool_calls)` → `tool(工具结果)` → `assistant(最终回答)`。这是 Function Calling 的标准对话结构，**工具结果必须用 `role: 'tool'` 且带 `tool_call_id` 对应**。
:::

## 如何定义 Tool Schema

Tool Schema 用 **JSON Schema** 格式描述。模型完全靠这个描述来理解工具，所以**描述写得好不好直接影响调用准确率**。

```typescript
const tool = {
  type: 'function',
  function: {
    name: 'searchFlights', // 函数名：用动词+名词，清晰
    description: '搜索航班信息，可根据出发地、目的地和日期筛选', // 描述：越具体越好
    parameters: {
      type: 'object',
      properties: {
        from: {
          type: 'string',
          description: '出发城市，如"北京"',
        },
        to: {
          type: 'string',
          description: '目的城市，如"上海"',
        },
        date: {
          type: 'string',
          description: '出发日期，格式 YYYY-MM-DD，如"2024-12-25"',
        },
        maxPrice: {
          type: 'number',
          description: '最高价格（元），可选',
        },
      },
      required: ['from', 'to', 'date'], // 必填参数
    },
  },
};
```

**写好 Schema 的三个原则**：

1. **description 要具体**：不要写"城市"，要写"出发城市，如'北京'"
2. **required 要准确**：哪些参数必须有、哪些可选，要标清楚
3. **name 要语义化**：`searchFlights` 比 `func1` 好，模型靠名字猜用途

## 实战：查天气 + 搜索网页的 Agent

把多个工具组合起来，就是一个实用的 Agent。下面是完整可运行代码：

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

// ============ 工具实现 ============
function getWeather(city: string): string {
  const data: Record<string, string> = {
    北京: '晴，15~28°C，空气质量良',
    上海: '多云转晴，20~26°C',
    广州: '阵雨，25~32°C',
  };
  return data[city] ?? `${city}天气数据暂无`;
}

function searchWeb(query: string): string {
  // 实际项目调用搜索 API（如 Tavily/SerpAPI）
  return `关于「${query}」的搜索结果：这是模拟的搜索摘要内容...`;
}

// ============ 工具 Schema ============
const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'getWeather',
      description: '查询某个城市的实时天气',
      parameters: {
        type: 'object',
        properties: {city: {type: 'string', description: '城市名'}},
        required: ['city'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'searchWeb',
      description: '搜索网页获取最新信息',
      parameters: {
        type: 'object',
        properties: {query: {type: 'string', description: '搜索关键词'}},
        required: ['query'],
      },
    },
  },
];

// ============ 工具执行分发器 ============
function executeTool(name: string, args: any): string {
  switch (name) {
    case 'getWeather':
      return getWeather(args.city);
    case 'searchWeb':
      return searchWeb(args.query);
    default:
      return `未知工具: ${name}`;
  }
}

// ============ Agent 主循环 ============
async function agent(userMessage: string) {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: '你是一个智能助手，可以查天气和搜索网页。根据用户需求选择合适的工具。',
    },
    {role: 'user', content: userMessage},
  ];

  for (let i = 0; i < 10; i++) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      tools,
    });

    const msg = response.choices[0].message;
    messages.push(msg);

    // 没有工具调用 → 任务完成
    if (!msg.tool_calls?.length) {
      return msg.content;
    }

    // 执行所有工具调用（模型可能一次调多个）
    for (const call of msg.tool_calls) {
      const args = JSON.parse(call.function.arguments);
      console.log(`🔧 ${call.function.name}(${JSON.stringify(args)})`);
      const result = executeTool(call.function.name, args);
      messages.push({role: 'tool', tool_call_id: call.id, content: result});
    }
  }
  return '任务未能在限定步数内完成';
}

// ============ 测试 ============
agent('帮我查查北京和广州的天气，再搜一下最近有什么科技新闻，最后给我一个出行建议');
```

这个 Agent 会自主决定：查北京天气 → 查广州天气 → 搜索科技新闻 → 综合给出建议。

## 工具调用的错误处理和重试策略

工具调用会失败（网络超时、API 报错、参数错误）。好的 Agent 必须能优雅处理：

```typescript
async function executeToolWithRetry(name: string, args: any, maxRetries = 3): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await executeToolAsync(name, args);
      return result;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️ 工具 ${name} 第 ${attempt} 次失败: ${errMsg}`);

      if (attempt === maxRetries) {
        // 重试耗尽，返回错误信息让模型自己决定怎么办
        return `工具执行失败（已重试${maxRetries}次）: ${errMsg}。请尝试其他方式或告知用户。`;
      }
      // 指数退避：等越来越久再重试
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  return '工具执行失败';
}
```

**错误处理的关键原则**：

| 策略               | 说明                                                     |
| ------------------ | -------------------------------------------------------- |
| **重试 + 退避**    | 网络抖动类错误，重试几次通常能好                         |
| **把错误告诉模型** | 工具失败了，把错误信息作为 tool 结果返回，模型会自己调整 |
| **参数校验**       | 执行前校验参数，避免无效调用                             |
| **超时控制**       | 给每个工具设超时，防止卡死                               |
| **降级方案**       | 主工具失败时有备选（如搜索 API 挂了，用缓存）            |

:::tip 把错误喂给模型
一个高级技巧：工具失败时，把错误信息用 `role: 'tool'` 返回给模型。模型看到"工具失败了"，会自己尝试换参数重试或换其他工具。这就是 Agent "自我纠错"的体现。
:::

```typescript
// 错误信息也作为 tool 结果返回
try {
  const result = executeTool(name, args);
  messages.push({role: 'tool', tool_call_id: call.id, content: result});
} catch (e) {
  messages.push({
    role: 'tool',
    tool_call_id: call.id,
    content: `错误：${e.message}。请检查参数或换一种方式。`,
  });
}
```

## 自定义工具开发最佳实践

### 1. 工具要"单一职责"

```typescript
// ❌ 不好：一个工具做太多事
function doEverything(action: string, params: any) { ... }

// ✅ 好：拆成多个专用工具
function sendEmail(to: string, subject: string, body: string) { ... }
function readFile(path: string) { ... }
function writeData(key: string, value: string) { ... }
```

### 2. 用 TypeScript 类型保证安全

```typescript
// 定义工具的统一接口
interface Tool {
  name: string;
  description: string;
  parameters: object; // JSON Schema
  execute: (args: any) => Promise<string>;
}

// 用注册表管理工具，避免 switch-case 膨胀
class ToolRegistry {
  private tools = new Map<string, Tool>();

  register(tool: Tool) {
    this.tools.set(tool.name, tool);
  }

  getSchema() {
    return Array.from(this.tools.values()).map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));
  }

  async execute(name: string, args: any): Promise<string> {
    const tool = this.tools.get(name);
    if (!tool) return `未知工具: ${name}`;
    return tool.execute(args);
  }
}

// 注册工具
const registry = new ToolRegistry();
registry.register({
  name: 'getWeather',
  description: '查询城市天气',
  parameters: {
    type: 'object',
    properties: {city: {type: 'string'}},
    required: ['city'],
  },
  execute: async (args) => getWeather(args.city),
});
```

### 3. 工具数量别太多

模型一次拿太多工具会"选择困难"。建议：

- 单个 Agent 的工具控制在 **5~15 个**
- 超过了就拆成多 Agent，或用"工具路由"先选大类

## 工具编排：串行、并行、条件调用

### 串行调用

一个工具的结果是另一个工具的输入：

```typescript
// 先搜索 → 再用搜索结果做翻译 → 再保存
const searchResult = await executeTool('searchWeb', {query: 'AI Agent'});
const translated = await executeTool('translate', {text: searchResult, to: 'zh'});
await executeTool('saveFile', {name: 'result.txt', content: translated});
```

### 并行调用

OpenAI 模型支持一次返回多个 tool_calls，可以并行执行：

```typescript
const msg = response.choices[0].message;
if (msg.tool_calls?.length) {
  // 用 Promise.all 并行执行所有工具调用
  const results = await Promise.all(
    msg.tool_calls.map(async (call) => {
      const args = JSON.parse(call.function.arguments);
      const result = await executeTool(call.function.name, args);
      return {id: call.id, result};
    }),
  );
  // 把所有结果喂回去
  for (const {id, result} of results) {
    messages.push({role: 'tool', tool_call_id: id, content: result});
  }
}
```

### 条件调用

根据上一个工具的结果决定下一步：

```typescript
const weather = await executeTool('getWeather', {city: '北京'});

// 根据天气决定要不要提醒带伞
if (weather.includes('雨')) {
  await executeTool('sendNotification', {message: '今天有雨，记得带伞'});
}
```

## 小结

- **Function Calling** 让 LLM 能"调用"你的函数，是 Agent 动手干活的核心机制
- 工作流程：**告诉模型有哪些工具 → 模型决定调哪个 → 你的代码执行 → 结果喂回模型**
- **Tool Schema** 用 JSON Schema 写，description 越具体调用越准
- **错误处理**：重试+退避、把错误告诉模型让它自己纠错
- **工具设计**：单一职责、类型安全、数量适中、用注册表管理
- **工具编排**：串行（依赖链）、并行（独立任务）、条件（动态决策）

## 下一步

Agent 有了"双手"（工具），还需要"记忆"。下一章 [记忆系统设计](./agent-memory.md) 教你让 Agent 记住对话历史和长期知识。
