---
sidebar_position: 3
title: "Git 工作流与代码规范"
difficulty: "medium"
tags: ["engineering", "git", "eslint", "prettier", "husky"]
---

# Git 工作流与代码规范

## Git 工作流对比

| 工作流 | 适用场景 | 复杂度 | 特点 |
|--------|---------|--------|------|
| Git Flow | 大型项目、版本发布 | 高 | develop/feature/release/hotfix 分支 |
| GitHub Flow | 持续部署、小团队 | 低 | main + feature 分支，PR 合并 |
| Trunk-Based | 高频发布、CI/CD 成熟 | 中 | 主干开发，短生命周期分支 |

### Git Flow

```
main ──────●──────────────●─────────── (生产)
            \            /
release      \──v1.0────/
              \
develop ──●────●────●────●──── (开发)
           \       /     \
feature     \─f1──/       ──f2──
```

```bash
# Git Flow 常用命令
git flow init
git flow feature start new-login
git flow feature finish new-login
git flow release start v1.0.0
git flow release finish v1.0.0
```

### GitHub Flow（推荐）

```bash
# 1. 从 main 创建分支
git checkout -b feature/user-auth

# 2. 开发并提交
git add .
git commit -m "feat: implement user authentication"

# 3. 推送并创建 PR
git push origin feature/user-auth

# 4. Code Review 通过后合并
# 5. 自动部署到生产环境
```

## 代码规范工具链

### ESLint 配置

```javascript
// eslint.config.js (ESLint Flat Config)
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      react: reactPlugin,
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },
];
```

### Prettier 配置

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

### ESLint + Prettier 集成

```javascript
// eslint.config.js
import prettierConfig from 'eslint-config-prettier';

export default [
  // ...其他配置
  prettierConfig, // 放在最后，关闭与 Prettier 冲突的规则
];
```

## Git Hooks：Husky + lint-staged

```bash
npm install -D husky lint-staged
npx husky init
```

```javascript
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{css,json,md}": ["prettier --write"]
  }
}
```

```bash
# .husky/pre-commit
npx lint-staged
```

### Commit 规范：Conventional Commits

```
<type>(<scope>): <description>

# 示例
feat(auth): add OAuth2 login support
fix(api): handle null response from server
docs(readme): update installation guide
refactor(utils): extract date formatting logic
perf(chart): optimize rendering with virtualization
test(auth): add unit tests for login flow
```

| type | 说明 |
|------|------|
| feat | 新功能 |
| fix | Bug 修复 |
| docs | 文档 |
| style | 代码格式（不影响逻辑） |
| refactor | 重构 |
| perf | 性能优化 |
| test | 测试 |
| chore | 构建/工具变更 |

## 面试高频问题

### Q: 如何保证团队代码规范一致性？

**回答要点：**
1. **工具强制** — ESLint + Prettier + Husky，提交时自动检查
2. **CI 卡点** — CI 流程中运行 lint 检查，不通过不允许合并
3. **EditorConfig** — 统一编辑器基础配置（缩进、换行等）
4. **Code Review** — PR 审查制度，知识共享 + 质量把关

### Q: git merge 和 git rebase 的区别？

```bash
# merge：保留完整历史，产生合并提交
git checkout main
git merge feature-branch
# 结果：main ← M ← feat1 ← feat2 ← (merge commit)

# rebase：线性历史，重写提交
git checkout feature-branch
git rebase main
# 结果：main ← feat1' ← feat2' (重新应用的提交)
```

| 对比 | merge | rebase |
|------|-------|--------|
| 历史 | 非线性，保留分支 | 线性，干净 |
| 安全性 | 不修改历史 | 重写历史 |
| 适用 | 公共分支 | 本地分支 |
| 冲突 | 一次解决 | 逐个提交解决 |
