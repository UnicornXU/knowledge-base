# 📚 前端面试知识库

> 基于 Docusaurus 3 的前端面试与 AI 开发知识库，提供系统化文档、在线测验、错题本和答题历史。

## ✨ 项目规模

项目会在启动和构建前自动统计内容，当前包含：

- **238 篇知识文档**
- **255 道测验题**
- **47 个内容分类**
- JavaScript、TypeScript、React、Vue、浏览器、网络、工程化、AI、性能优化等专题

## 🚀 本地开发

要求 Node.js 20 或更高版本。

```bash
npm ci
npm start
```

常用命令：

```bash
npm run validate:content # 校验题库并更新真实统计
npm run typecheck        # TypeScript 检查
npm run lint             # ESLint
npm run format:check     # Prettier 检查
npm test                 # Vitest 单元测试
npm run build            # 生产构建
npm run test:e2e         # Playwright 端到端测试（需先安装 Chromium）
npm run check            # 完整质量检查
```

首次运行 E2E 测试前安装浏览器：

```bash
npx playwright install chromium
```

## 📝 测验系统

- 可按分类选择 5、10、20 或全部题目
- 支持单选、多选和判断题
- 即时答案解析和常见误区提示
- 浏览器本地保存最近 50 条答题历史和错题本
- 存储不可用时会给出明确提示
- 支持键盘操作和可见焦点

## 📁 主要目录

```text
docs/                     Markdown/MDX 文档
src/data/                 题库与自动生成的内容统计
src/pages/                首页和测验页面
src/utils/                可测试的测验逻辑
scripts/                  内容统计与题库校验
tests/e2e/                Playwright 测试
.github/workflows/ci.yml   持续集成
```

## ✅ 题库质量规则

`npm run validate:content` 会检查：

- 题目 ID 唯一
- 分类合法且非空
- 选项值不重复
- 答案存在于选项中
- 单选、多选题答案结构正确
- 解析和答题思路非空
- 分类统计与实际题量一致

新增或修改内容后，请在提交前运行：

```bash
npm run check
```

## 🌐 部署

Netlify 使用 `npm run build` 构建并发布 `build/`。Docusaurus 会生成静态路由和 404 页面，不需要 SPA 全站重定向。

## 🤝 贡献

欢迎补充题目、修正文档或改进交互。请确保构建、类型检查、Lint、单元测试和内容校验全部通过。
