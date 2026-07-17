---
sidebar_position: 2
title: 'Rust 构建工具实战'
difficulty: 'hard'
tags: ['swc', 'Turbopack', 'oxlint', 'Biome', '构建工具']
---

# Rust 构建工具实战

## swc 实战（替代 Babel）

### swc 简介

swc（Speedy Web Compiler）是用 Rust 编写的超高性能 JavaScript/TypeScript 编译器，可直接替代 Babel 进行代码转译和压缩。由 Donny（강동윤）开发，已被 Next.js、Deno、Parcel 等主流项目采用。

### .swcrc 配置详解

```json
{
  "$schema": "https://json.schemastore.org/swcrc",
  "jsc": {
    "parser": {
      "syntax": "typescript",
      "tsx": true,
      "decorators": true,
      "dynamicImport": true
    },
    "transform": {
      "react": {
        "runtime": "automatic",
        "importSource": "@emotion/react"
      },
      "decoratorVersion": "2022-03"
    },
    "target": "es2020",
    "loose": false,
    "externalHelpers": true,
    "keepClassNames": true
  },
  "module": {
    "type": "es6",
    "strict": true,
    "strictMode": true,
    "lazy": false,
    "noInterop": false
  },
  "minify": true,
  "sourceMaps": true
}
```

:::info 配置说明

- `jsc.parser`：定义解析器行为，支持 TypeScript、JSX、装饰器等语法
- `jsc.transform.react`：React JSX 转换配置，`automatic` 对应 React 17+ 新 JSX 转换
- `jsc.target`：输出代码的目标 ES 版本
- `module.type`：输出模块格式（es6/commonjs/amd/umd）
  :::

### 与 Babel 配置对照表

| Babel 配置                          | swc 等价配置                      | 说明         |
| ----------------------------------- | --------------------------------- | ------------ |
| `@babel/preset-env`                 | `jsc.target`                      | 指定目标环境 |
| `@babel/preset-react`               | `jsc.transform.react`             | JSX 转换     |
| `@babel/preset-typescript`          | `jsc.parser.syntax: "typescript"` | TS 支持      |
| `@babel/plugin-proposal-decorators` | `jsc.parser.decorators: true`     | 装饰器       |
| `@babel/plugin-transform-runtime`   | `jsc.externalHelpers: true`       | 辅助函数外置 |
| `babel-plugin-module-resolver`      | 不直接支持，需 bundler 配合       | 路径别名     |
| `babel-plugin-styled-components`    | SWC 插件（Rust 编写）             | CSS-in-JS    |

### webpack loader 集成

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true,
              },
              transform: {
                react: {
                  runtime: 'automatic',
                },
              },
              target: 'es2020',
            },
          },
        },
      },
    ],
  },
};
```

### 性能对比数据

| 项目规模    | Babel 耗时 | swc 耗时 | 提升倍数 |
| ----------- | ---------- | -------- | -------- |
| 100 文件    | 4.2s       | 0.18s    | **23x**  |
| 1,000 文件  | 38s        | 0.9s     | **42x**  |
| 5,000 文件  | 210s       | 3.2s     | **65x**  |
| 10,000 文件 | 450s+      | 6.8s     | **66x**  |

:::warning 已知限制

- **Babel 插件不兼容**：Babel 的 JS 插件无法在 swc 中使用，需要用 Rust 重写为 swc 插件
- **装饰器差异**：legacy decorator 行为可能与 Babel 有细微差别
- **宏支持**：`babel-plugin-macros` 无法直接迁移
- **source map 精度**：极少数情况下 source map 映射位置与 Babel 不完全一致
  :::

---

## Turbopack 实战（替代 Webpack）

### 架构原理

Turbopack 是 Vercel 团队开发的基于 Rust 的增量打包器，核心基于 **Turbo 引擎**：

```text
Turbopack 架构：
┌─────────────────────────────────────────┐
│              Turbo Engine                │
│  ┌──────────────────────────────────┐   │
│  │   函数级细粒度缓存（Memoization） │   │
│  │   自动依赖追踪（Dependency Track）│   │
│  │   最小化重计算（Invalidation）    │   │
│  └──────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  Source → Resolve → Transform → Bundle  │
│     ↓         ↓          ↓         ↓    │
│  [每一步都是可缓存的细粒度函数]         │
└─────────────────────────────────────────┘
```

**核心设计理念：**

- **增量计算**：每个编译函数的输入/输出被追踪，仅在输入变化时重新执行
- **函数级缓存**：不是文件级缓存，而是更细粒度的函数结果缓存
- **按需编译**：开发模式下只编译浏览器实际请求的模块
- **持久化缓存**：编译结果跨进程/跨启动复用

### Next.js 中使用 Turbopack

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 14+ 开发模式默认启用 Turbopack
  // 也可以显式配置：
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
      resolveAlias: {
        '@components': './src/components',
        '@utils': './src/utils',
      },
      resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    },
  },
};

module.exports = nextConfig;
```

```bash
# 启动开发服务器（Turbopack模式）
next dev --turbo
```

### 与 Webpack/Vite 性能对比

| 指标     | Webpack 5 | Vite (esbuild) | Turbopack | 说明           |
| -------- | --------- | -------------- | --------- | -------------- |
| 冷启动   | 12.5s     | 3.2s           | 1.8s      | 10,000模块项目 |
| HMR 更新 | 1.2s      | 120ms          | 8ms       | 单文件修改     |
| 内存占用 | 2.1GB     | 680MB          | 520MB     | 峰值内存       |
| 增量构建 | 8.5s      | 1.5s           | 0.4s      | 修改10个文件   |

:::tip 何时选择 Turbopack

- 你在使用 Next.js 13.4+（原生支持）
- 项目规模大（1000+ 模块），HMR 慢
- 团队不想维护复杂的 webpack 配置
  :::

### 当前限制与路线图

- ❌ 生产构建尚未完全 GA（2025 年中持续推进）
- ❌ 不支持所有 webpack loader（需查看兼容性表）
- ❌ 独立使用（脱离 Next.js）的 API 尚未稳定
- ✅ 开发模式已稳定可用
- ✅ React Server Components 完整支持

---

## oxlint 实战（替代 ESLint）

### 安装与配置

```bash
# 安装
npm install -D oxlint

# 或全局安装
npm install -g oxlint

# 运行
npx oxlint .
npx oxlint --fix ./src
npx oxlint --deny-warnings ./src
```

配置文件 `.oxlintrc.json`：

```json
{
  "rules": {
    "no-unused-vars": "warn",
    "no-console": "off",
    "eqeqeq": "error",
    "no-debugger": "error",
    "prefer-const": "warn"
  },
  "ignorePatterns": ["dist/", "node_modules/", "*.config.js"],
  "env": {
    "browser": true,
    "node": true,
    "es2024": true
  }
}
```

### 规则集覆盖率对比

| 规则来源              | ESLint 规则数 | oxlint 已实现 | 覆盖率 |
| --------------------- | ------------- | ------------- | ------ |
| eslint 核心规则       | ~280          | ~220          | 78%    |
| typescript-eslint     | ~130          | ~80           | 61%    |
| eslint-plugin-react   | ~85           | ~50           | 59%    |
| eslint-plugin-import  | ~45           | ~25           | 55%    |
| eslint-plugin-unicorn | ~120          | ~60           | 50%    |

### 与 ESLint 共存策略

```json
// package.json - 推荐的共存方案
{
  "scripts": {
    "lint": "oxlint . && eslint --rule 'import/order: error' ./src",
    "lint:fast": "oxlint .",
    "lint:full": "eslint ./src"
  }
}
```

:::tip 共存策略
推荐方案：用 oxlint 处理通用规则（速度快），用 ESLint 仅处理 oxlint 未覆盖的特殊规则（如 import 排序、自定义团队规则）。
:::

### 性能对比

| 项目规模   | ESLint | oxlint | 提升倍数 |
| ---------- | ------ | ------ | -------- |
| 100 文件   | 3.8s   | 52ms   | **73x**  |
| 1,000 文件 | 32s    | 0.4s   | **80x**  |
| 5,000 文件 | 165s   | 1.7s   | **97x**  |

---

## Biome 一体化方案

### Biome = Formatter + Linter

Biome（前身 Rome）是一个用 Rust 编写的一体化前端工具链，一个工具同时替代 Prettier（格式化）和 ESLint（代码检查）。

```text
传统方案                    Biome 方案
┌─────────┐ ┌───────┐      ┌──────────────┐
│ Prettier │+│ESLint │  ──► │    Biome     │
└─────────┘ └───────┘      │ Format+Lint  │
  2个依赖    N个插件         └──────────────┘
  2套配置    冲突解决            1个工具
  2次AST解析                    1次AST解析
```

### biome.json 配置

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf"
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "complexity": {
        "noExtraBooleanCast": "error",
        "useSimplifiedLogicExpression": "warn"
      },
      "correctness": {
        "noUnusedVariables": "warn",
        "noUnusedImports": "error"
      },
      "style": {
        "noNonNullAssertion": "warn",
        "useConst": "error"
      },
      "suspicious": {
        "noExplicitAny": "warn"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all",
      "semicolons": "always",
      "arrowParentheses": "always"
    }
  },
  "files": {
    "ignore": ["node_modules", "dist", "build", ".next"]
  }
}
```

### VS Code 集成

```json
// .vscode/settings.json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "[javascript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[json]": {
    "editor.defaultFormatter": "biomejs.biome"
  }
}
```

### 从 Prettier/ESLint 迁移指南

```bash
# 1. 安装 Biome
npm install -D @biomejs/biome

# 2. 初始化配置（自动从现有配置迁移）
npx @biomejs/biome init

# 3. 从 Prettier 迁移
npx @biomejs/biome migrate prettier --write

# 4. 从 ESLint 迁移
npx @biomejs/biome migrate eslint --write

# 5. 运行检查
npx @biomejs/biome check .
npx @biomejs/biome check --write .  # 自动修复
```

:::warning 迁移注意事项

- Biome 的格式化输出与 Prettier 有约 3% 的差异（主要在长行折行策略上）
- 部分 ESLint 插件规则尚未覆盖（如 eslint-plugin-testing-library）
- 建议在 CI 中先并行运行两套工具，确认无重大差异后再完全切换
  :::

**迁移后的 package.json 对比：**

```json
// 迁移前
{
  "devDependencies": {
    "eslint": "^8.x",
    "prettier": "^3.x",
    "@typescript-eslint/parser": "^6.x",
    "@typescript-eslint/eslint-plugin": "^6.x",
    "eslint-config-prettier": "^9.x",
    "eslint-plugin-react": "^7.x",
    "eslint-plugin-react-hooks": "^4.x"
  }
}

// 迁移后
{
  "devDependencies": {
    "@biomejs/biome": "^1.9.0"
  }
}
```

---

## 面试题

### 1. 如何将一个使用 Babel + Webpack 的项目逐步迁移到 Rust 工具链？

**参考答案：**

推荐分阶段迁移策略：

**阶段一（低风险）：** 用 swc-loader 替换 babel-loader，保留 webpack 配置不变。将 `.babelrc` 转换为 `.swcrc`，运行测试确认行为一致。

**阶段二（中风险）：** 用 Biome 替换 Prettier + ESLint，运行 `biome migrate` 命令自动转换配置，在 CI 中并行对比结果。

**阶段三（高收益）：** 如果使用 Next.js，启用 Turbopack 开发模式。如果是自建 webpack 配置，考虑迁移到 rspack（webpack API 兼容）。

**关键原则：** 每阶段都要有回退方案，在 CI 中设置对比验证，逐步建立信心。

### 2. oxlint 为什么能比 ESLint 快 50-100 倍？

**参考答案：**

1. **语言层面**：Rust 编译为原生代码，无 V8 解释/JIT 开销
2. **解析器差异**：oxc 解析器比 espree/acorn 快 3x+，且零拷贝设计减少内存分配
3. **无插件系统开销**：ESLint 的 visitor pattern 需要为每条规则遍历 AST，oxlint 合并遍历
4. **并行执行**：oxlint 天然多线程并行处理不同文件
5. **内存效率**：紧凑的数据结构，无 JS 对象开销

### 3. Biome 相比 Prettier + ESLint 组合的优劣势？

**参考答案：**

**优势：**

- 性能：25-35x 提升（单次 AST 解析）
- 配置简化：一个工具、一个配置文件
- 无冲突：不存在 Prettier/ESLint 规则冲突问题
- 依赖精简：从 7-10 个包减少到 1 个

**劣势：**

- 规则覆盖率：部分 ESLint 社区插件规则未实现
- 格式化差异：与 Prettier 有 ~3% 输出差异
- 生态集成：部分 IDE 插件/CI 工具尚未适配
- 自定义规则：目前不支持 JS 自定义规则（需 Rust 编写）

### 4. Turbopack 的函数级缓存与 Webpack 的文件级缓存有何本质区别？

**参考答案：**

**Webpack 文件级缓存：**

- 以文件为最小缓存单元
- 文件任何变化都会使整个文件的编译缓存失效
- 依赖关系追踪粒度粗

**Turbopack 函数级缓存：**

- 编译过程被拆分为大量细粒度函数（resolve、parse、transform、codegen 等）
- 每个函数的输入输出独立追踪
- 只有当函数的精确输入变化时才重新执行
- 例如：修改一个组件的样式，只需重新执行该文件的 CSS transform 函数，其他函数结果复用

这使得 Turbopack 的 HMR 可以精确到只重新执行"必要的最小计算"，而非重新处理整个文件或模块子树。
