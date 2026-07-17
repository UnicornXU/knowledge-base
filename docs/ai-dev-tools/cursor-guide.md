---
sidebar_position: 2
title: 'Cursor IDE 完全指南'
difficulty: 'easy'
tags: ['cursor', 'ai-ide', '开发效率']
---

# Cursor IDE 完全指南

Cursor 是一款基于 VS Code 深度定制的 **AI-first IDE**，将大语言模型能力深度集成到编辑器的每个环节。它不是简单的"AI 插件"，而是从底层重新思考了"人机协作写代码"的交互范式。

## Cursor 是什么

```
VS Code 代码编辑器
    ↓ Fork 深度定制
Cursor IDE
    + AI Tab 补全（比 Copilot 更智能的多行预测）
    + Cmd+K 内联编辑（选中代码 + 自然语言修改）
    + Chat 面板（带上下文引用的对话）
    + Composer（跨多文件同时编辑）
    + Agent 模式（自主执行任务链）
```

:::info 与 VS Code 的关系
Cursor 完全兼容 VS Code 的插件生态和快捷键。你可以一键导入 VS Code 的设置、插件和主题。切换成本极低。
:::

## 核心功能详解

### 1. Tab 补全——智能多行预测

Tab 补全是最基础也是使用频率最高的功能。Cursor 的补全比普通 Copilot 更"聪明"：

```typescript
// 输入函数签名后，按 Tab 自动补全整个实现
function debounce(fn: Function, delay: number) {
  // Cursor 自动预测以下内容 ↓
  let timer: ReturnType<typeof setTimeout> | null = null;
  return function (...args: any[]) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay);
  };
}
```

**接受部分补全技巧：**

| 操作         | 快捷键         | 说明             |
| ------------ | -------------- | ---------------- |
| 接受全部     | `Tab`          | 接受整个补全建议 |
| 接受一个单词 | `Ctrl+→`       | 逐词接受         |
| 接受一行     | `Ctrl+Shift+→` | 逐行接受         |
| 拒绝         | `Esc`          | 取消补全建议     |

:::tip 补全技巧
写好注释和函数签名是获得高质量补全的关键。类型信息越完整，补全越准确。
:::

### 2. Cmd+K 内联编辑

选中一段代码后按 `Cmd+K`（Windows: `Ctrl+K`），输入自然语言指令即可就地修改：

```typescript
// 选中以下代码，按 Cmd+K 输入："添加 loading 和 error 状态处理"
// 修改前
const UserList = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(setUsers);
  }, []);

  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
};

// AI 修改后 ↓
const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/users')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setUsers)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner">加载中...</div>;
  if (error) return <div className="error">出错了: {error.message}</div>;
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
};
```

### 3. Chat 对话——上下文引用

Chat 面板的核心价值在于**精确的上下文引用**：

| 引用方式   | 语法      | 说明                   |
| ---------- | --------- | ---------------------- |
| 引用文件   | `@file`   | 将整个文件作为上下文   |
| 引用文件夹 | `@folder` | 引用目录结构和内容     |
| 引用文档   | `@docs`   | 引用第三方库文档       |
| 引用网页   | `@web`    | 搜索互联网获取最新信息 |
| 引用代码   | `@code`   | 引用代码库中的符号定义 |
| 引用 Git   | `@git`    | 引用 Git 历史和 diff   |

```markdown
实际使用示例：

"@file src/hooks/useAuth.ts @file src/api/auth.ts
请帮我在 useAuth 中添加 token 刷新逻辑，参考 auth.ts 中的 refreshToken 接口"
```

### 4. Composer 多文件编辑

Composer（`Cmd+Shift+I`）是 Cursor 的"大杀器"——它可以同时编辑多个文件：

```markdown
Composer Prompt 示例：

"创建一个用户管理模块：

1. src/types/user.ts - 定义 User 接口和相关类型
2. src/api/user.ts - 实现用户 CRUD API 调用
3. src/hooks/useUser.ts - 封装用户数据管理 Hook
4. src/components/UserCard.tsx - 用户卡片组件

要求：使用 TypeScript，API 用 fetch，Hook 用 React Query 风格"
```

:::warning 注意事项
Composer 一次修改的文件越多，准确率越低。建议单次不超过 5-8 个文件，复杂任务分步骤完成。
:::

### 5. Agent 模式

Agent 模式是最高级的交互方式——AI 自主规划并执行多步骤任务：

```
Agent 能力：
├── 读取和分析代码库结构
├── 创建和修改多个文件
├── 运行终端命令（npm install、测试等）
├── 分析错误输出并自主修复
├── 搜索互联网获取信息
└── 迭代直到任务完成
```

**Agent 模式使用场景：**

- 从零搭建项目脚手架
- 跨多文件重构（如组件迁移）
- 修复复杂 Bug（需要运行测试验证）
- 添加完整功能模块（含测试）

## 快捷键速查表

| 功能                | macOS         | Windows/Linux  |
| ------------------- | ------------- | -------------- |
| AI 补全接受         | `Tab`         | `Tab`          |
| 内联编辑            | `Cmd+K`       | `Ctrl+K`       |
| 打开 Chat           | `Cmd+L`       | `Ctrl+L`       |
| 打开 Composer       | `Cmd+Shift+I` | `Ctrl+Shift+I` |
| 切换 Agent 模式     | Chat 中切换   | Chat 中切换    |
| 引用选中代码到 Chat | `Cmd+Shift+L` | `Ctrl+Shift+L` |
| 新建 Chat           | `Cmd+Shift+N` | `Ctrl+Shift+N` |
| 接受 diff           | `Cmd+Y`       | `Ctrl+Y`       |
| 拒绝 diff           | `Cmd+N`       | `Ctrl+N`       |
| 打开终端            | `` Cmd+` ``   | `` Ctrl+` ``   |

## .cursorrules 配置详解

`.cursorrules` 是项目根目录下的规则文件，用于指导 AI 遵循项目特定的编码规范：

```markdown
# .cursorrules 示例

## 项目概述

这是一个 React + TypeScript 前端项目，使用 Vite 构建。

## 技术栈

- React 18 + TypeScript 5
- 状态管理：Zustand
- 样式：Tailwind CSS
- 路由：React Router v6
- 请求：Axios + React Query

## 编码规范

- 组件使用函数式组件 + Hooks，禁止 Class 组件
- 文件命名：组件用 PascalCase，工具函数用 camelCase
- 类型定义放在同目录的 types.ts 文件中
- 每个组件必须导出 Props 类型
- 使用 const 箭头函数定义组件

## 样式规范

- 优先使用 Tailwind 工具类
- 复杂样式提取为自定义类名
- 响应式断点：sm(640px), md(768px), lg(1024px)

## 注释要求

- 复杂业务逻辑必须添加中文注释
- 组件头部添加功能说明注释
- API 函数添加 JSDoc 注释

## 禁止事项

- 不要使用 any 类型
- 不要使用 var 声明变量
- 不要在组件内直接调用 API
- 不要使用 CSS-in-JS
```

## 实战案例

### 案例1：用 Cursor 实现一个 React 组件

**场景：** 需要实现一个可搜索的下拉选择组件

```markdown
Prompt（在 Composer 中）：
"创建一个 SearchableSelect 组件，要求：

- 支持搜索过滤选项
- 支持键盘导航（上下键选择，Enter 确认，Esc 关闭）
- 支持自定义渲染选项
- 点击外部区域关闭下拉
- 完整的 TypeScript 类型
- 使用 Tailwind CSS 样式"
```

Cursor 生成的代码（关键部分）：

```tsx
interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SearchableSelectProps {
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  renderOption?: (option: Option) => React.ReactNode;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = '请选择...',
  renderOption,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () => options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase())),
    [options, search],
  );

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        if (filtered[highlightIndex]) {
          onChange(filtered[highlightIndex].value);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  // 点击外部关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative w-64" onKeyDown={handleKeyDown}>
      {/* 组件 JSX 省略，实际会完整生成 */}
    </div>
  );
};
```

### 案例2：用 Agent 模式修复 Bug

**场景：** 用户列表页面偶尔白屏，控制台报 `Cannot read properties of undefined`

```markdown
Agent Prompt：
"用户列表页面 src/pages/UserList.tsx 偶尔白屏，
控制台报错：Cannot read properties of undefined (reading 'map')
请帮我诊断并修复这个问题。运行测试确认修复有效。"
```

**Agent 执行过程：**

1. 读取 `UserList.tsx` 分析代码
2. 发现 `users` 状态初始值可能为 `undefined`
3. 追踪 API 响应，发现异常时返回 `{ data: undefined }`
4. 修复：添加空值检查 + 默认值
5. 运行 `npm test` 验证修复

## 高级技巧

### 上下文管理

```markdown
技巧1: 使用 @codebase 让 AI 搜索整个项目
"@codebase 项目中所有使用了 localStorage 的地方有哪些？"

技巧2: 使用 .cursorignore 排除无关文件

# .cursorignore

node_modules/
dist/
*.min.js
coverage/
```

### Prompt 优化建议

| 做法        | 示例                                          |
| ----------- | --------------------------------------------- |
| ✅ 具体明确 | "用 Zustand 创建一个支持持久化的 theme store" |
| ❌ 模糊笼统 | "帮我做个状态管理"                            |
| ✅ 提供约束 | "不使用第三方库，用原生 CSS 实现"             |
| ❌ 没有边界 | "做个好看的动画"                              |
| ✅ 分步执行 | "第一步：定义类型；第二步：实现 API"          |
| ❌ 一步到位 | "帮我把整个项目重构了"                        |

## 常见问题与解决方案

| 问题               | 原因                 | 解决方案                       |
| ------------------ | -------------------- | ------------------------------ |
| 补全速度慢         | 网络延迟或模型负载高 | 切换到 Fast 模型或检查网络     |
| 生成代码风格不一致 | 缺少项目规则         | 添加 .cursorrules 配置         |
| Agent 执行卡住     | 任务过于复杂         | 拆分任务，分步执行             |
| 引用文件无效       | 文件路径错误         | 使用 @ 自动补全而非手动输入    |
| Chat 上下文丢失    | 对话过长超出窗口     | 开启新对话，重新提供关键上下文 |
| 模型输出被截断     | Token 限制           | 要求"继续"或分部分生成         |

:::warning 安全提醒
Cursor 会将代码发送到云端模型处理。对于涉密项目，请确认公司安全政策是否允许，或使用 Privacy Mode 设置。
:::
