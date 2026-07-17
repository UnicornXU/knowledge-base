---
sidebar_position: 5
title: '包管理工具'
difficulty: 'easy'
tags: ['engineering', 'npm', 'yarn', 'pnpm', 'package-manager']
---

# 包管理工具

## npm vs yarn vs pnpm

| 特性              | npm                | yarn (Berry)           | pnpm                             |
| ----------------- | ------------------ | ---------------------- | -------------------------------- |
| 安装速度          | 中                 | 快                     | 最快                             |
| 磁盘占用          | 高                 | 中                     | 低                               |
| node_modules 结构 | 扁平               | 扁平/Plug'n'Play       | 严格（硬链接）                   |
| Workspace         | v7+ 支持           | 原生支持               | 原生支持                         |
| 幽灵依赖          | 存在               | 存在                   | 不存在                           |
| Lock 文件         | package-lock.json  | yarn.lock              | pnpm-lock.yaml                   |
| 市场份额（2025）  | 最高（但份额收窄） | 稳定（Berry 生态有限） | 主流选择（已成为许多新项目首选） |

## 依赖版本管理

### 语义化版本（SemVer）

```
^1.2.3  →  >=1.2.3 <2.0.0  (允许 minor 和 patch 更新)
~1.2.3  →  >=1.2.3 <1.3.0  (只允许 patch 更新)
1.2.3   →  精确版本
*       →  任意版本（危险！）
```

### 锁文件的重要性

```bash
# 安装依赖时的行为
npm install          # 读取 package-lock.json 安装精确版本
npm install --save   # 更新 package.json 和 lock 文件

# 团队协作中
# 1. lock 文件必须提交到 Git
# 2. 不要手动修改 lock 文件
# 3. 升级依赖使用专门命令
npm outdated         # 查看过期依赖
npm update           # 更新依赖（遵守 SemVer 范围）
```

## npm 常用命令

```bash
# 依赖管理
npm install                  # 安装所有依赖
npm install lodash           # 安装到 dependencies
npm install -D jest           # 安装到 devDependencies
npm install lodash@4.17.21   # 安装指定版本
npm uninstall lodash         # 卸载

# npx：临时执行
npx create-react-app my-app  # 临时下载并执行
npx serve dist               # 本地预览构建产物

# npm scripts
npm run build
npm run test
npm run lint

# 发布
npm publish
npm version patch            # 1.0.0 → 1.0.1
npm version minor            # 1.0.0 → 1.1.0
npm version major            # 1.0.0 → 2.0.0
```

## pnpm 特性

### 严格依赖管理

```javascript
// npm/yarn 的扁平 node_modules 导致幽灵依赖
// package.json 中没有声明 lodash，但代码中可以直接使用
import _ from 'lodash'; // npm 不报错，但这是不安全的

// pnpm 的严格模式下会报错
// Error: lodash is not declared in dependencies
```

### 内容寻址存储

```bash
# pnpm 全局存储位置
~/.pnpm-store/

# 硬链接机制
# 多个项目引用同一个 lodash，磁盘上只有一份
project-a/node_modules/lodash → ~/.pnpm-store/lodash@4.17.21
project-b/node_modules/lodash → ~/.pnpm-store/lodash@4.17.21
```

### pnpm 命令

```bash
# 基础
pnpm install
pnpm add lodash
pnpm add -D jest
pnpm remove lodash

# Workspace
pnpm -r run build          # 递归执行所有包
pnpm --filter @my/ui run test  # 只执行指定包
pnpm -r --parallel run dev  # 并行执行

# 其他
pnpm store status          # 检查存储完整性
pnpm store prune           # 清理未引用的包
```

## 面试高频问题

### Q: 为什么 pnpm 比 npm 快？

**回答要点：**

1. **硬链接** — 不需要复制文件，直接链接到全局存储
2. **并行安装** — 依赖解析和下载并行执行
3. **内容寻址** — 相同内容只下载一次
4. **非扁平结构** — 不需要计算扁平化路径

### Q: package.json 中 dependencies 和 devDependencies 的区别？

```json
{
  "dependencies": {
    "react": "^18.0.0" // 运行时需要，会被打包
  },
  "devDependencies": {
    "typescript": "^5.0.0", // 只在开发时需要
    "jest": "^29.0.0" // 测试框架，生产环境不需要
  }
}
```

| 字段                 | 安装场景                 | 是否打包 |
| -------------------- | ------------------------ | -------- |
| dependencies         | `npm install`            | ✅ 是    |
| devDependencies      | `npm install`            | ❌ 否    |
| peerDependencies     | 不自动安装，需要宿主提供 | -        |
| optionalDependencies | 安装失败不报错           | 视情况   |

### Q: 如何处理依赖冲突？

**回答要点：**

1. **npm dedupe** — 扁平化依赖，减少重复
2. **resolutions (yarn)** — 强制指定某个依赖的版本
3. **pnpm.overrides (pnpm)** — 类似 resolutions
4. **升级策略** — 定期更新依赖，避免版本差距过大
