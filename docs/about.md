---
sidebar_position: 100
title: 关于本库
slug: /about
---

# 关于前端面试知识库

## 📖 项目简介

前端面试知识库是一个开源的前端面试准备平台，旨在帮助开发者系统性地备战技术面试。

### 特色

- **200+ 精选面试题** — 覆盖 JavaScript、TypeScript、React、Vue、AI、工程化、性能优化七大方向
- **45+ 深度文档** — 从基础概念到源码解析，层层递进
- **在线测验系统** — 支持错题本、答题历史、自定义题数、计时模式
- **AI 前沿专题** — LLM 集成、RAG、流式响应等热门方向
- **难度分级** — 🟢 Easy / 🟡 Medium / 🔴 Hard 三级标注

## 🛠️ 技术栈

- [Docusaurus 3](https://docusaurus.io/) — 静态站点生成器
- [React 19](https://react.dev/) — UI 框架
- [TypeScript](https://www.typescriptlang.org/) — 类型安全
- [Netlify](https://netlify.com/) — 部署平台

## 🤝 贡献指南

欢迎任何形式的贡献！

### 贡献方式

1. **提交 Issue** — 报告错误、提出建议、请求新内容
2. **提交 Pull Request** — 修复错误、添加题目、完善文档
3. **分享推广** — Star 本仓库，分享给需要的朋友

### 开发流程

```bash
# 1. Fork 并克隆仓库
git clone https://github.com/your-username/knowledge-base.git
cd knowledge-base

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm start

# 4. 创建特性分支
git checkout -b feature/my-feature

# 5. 提交更改
git commit -m "feat: add my feature"

# 6. 推送并创建 PR
git push origin feature/my-feature
```

### 文档规范

- 使用中文撰写
- 遵循 Markdown 规范
- 代码示例使用 TypeScript（优先）
- 每篇文档包含 frontmatter：

```yaml
---
sidebar_position: 1
title: "文档标题"
difficulty: "easy"  # easy / medium / hard
tags: ["tag1", "tag2"]
---
```

### 题目规范

添加新题目到 `src/data/quiz-questions.ts`：

```typescript
{
  id: 唯一ID,
  category: 'javascript',  // javascript/typescript/react/vue/performance/engineering
  difficulty: 'medium',    // easy/medium/hard
  type: 'single',          // single/multiple/judge
  question: '题目描述',
  code: '// 可选的代码片段',
  options: [
    { value: 'A', label: '选项 A' },
    { value: 'B', label: '选项 B' },
    { value: 'C', label: '选项 C' },
    { value: 'D', label: '选项 D' },
  ],
  answer: 'B',  // 单选为 string，多选为 string[]
  explanation: {
    correct: '正确答案的解释',
    thinking: '解题思路',
    pitfalls: '可选：常见陷阱',
  },
},
```

## 📄 开源协议

MIT License

## 🙏 致谢

感谢所有贡献者和使用者的支持！
