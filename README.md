# 📚 前端面试知识库

> 前端面试题 & AI 开发面试指南 — 系统备战前端面试，斩获心仪 Offer！

## ✨ 特性

- **200+ 精选面试题** — 涵盖 JavaScript、TypeScript、React、Vue、AI 应用开发、工程化、性能优化
- **45+ 深度文档** — 从基础概念到源码解析，层层递进
- **在线测验系统** — 随机出题、即时反馈、错题回顾、分数统计
- **AI 前沿专题** — LLM 集成、RAG、流式响应、AI SDK 等热门方向
- **难度分级** — 🟢 Easy / 🟡 Medium / 🔴 Hard 三级标注
- **暗色模式** — 支持系统偏好自动切换
- **响应式设计** — 完美适配手机、平板、桌面端

## 📖 内容分类

| 分类 | 文档数 | 说明 |
|------|--------|------|
| JavaScript 基础 | 5 | 类型系统、闭包、异步、原型链、ES6+ |
| TypeScript | 3 | 泛型、工具类型、类型体操 |
| React | 5 | Hooks、Fiber、状态管理、性能优化、源码 |
| Vue | 11 | 响应式、组合式 API、虚拟 DOM、源码、路由 |
| AI 应用开发 | 6 | LLM 集成、RAG、流式响应、AI SDK |
| 工程化 | 5+ | 构建工具、CI/CD、Monorepo、包管理 |
| 前端性能优化 | 6 | 加载、渲染、网络、监控、框架优化 |

## 🚀 快速开始

### 环境要求

- Node.js >= 20.0
- npm / yarn / pnpm

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm start

# 构建生产版本
npm run build

# 预览构建结果
npm run serve
```

## 🛠️ 技术栈

- [Docusaurus 3](https://docusaurus.io/) — 静态站点生成器
- [React 19](https://react.dev/) — UI 框架
- [TypeScript](https://www.typescriptlang.org/) — 类型安全
- [Prism](https://prismjs.com/) — 代码语法高亮
- [Netlify](https://netlify.com/) — 部署平台

## 📁 项目结构

```
├── docs/                    # 文档内容 (Markdown/MDX)
│   ├── javascript/          # JavaScript 基础
│   ├── typescript/          # TypeScript
│   ├── react/               # React
│   ├── vue/                 # Vue.js
│   ├── ai/                  # AI 应用开发
│   ├── engineering/         # 工程化
│   └── performance/         # 前端性能优化
├── src/
│   ├── components/          # React 组件
│   │   ├── HomepageFeatures/ # 首页特性卡片
│   │   └── Quiz/            # 测验系统组件
│   ├── data/
│   │   └── quiz-questions.ts # 题库数据 (200+ 题)
│   ├── pages/               # 自定义页面
│   │   ├── index.tsx        # 首页
│   │   └── quiz.tsx         # 测验页面
│   └── css/
│       └── custom.css       # 全局自定义样式
├── static/                  # 静态资源
├── docusaurus.config.ts     # 站点配置
└── sidebars.ts              # 侧边栏配置
```

## 📝 测验系统

- 选择分类开始测验（每轮 10 题随机抽取）
- 支持单选、多选、判断题型
- 答题后即时显示解析和常见误区
- 分数统计与错题回顾
- 支持重测和分类切换

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'feat: add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

## 📄 License

MIT License
