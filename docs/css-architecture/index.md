---
sidebar_position: 0
title: CSS 架构概述
description: CSS 架构体系全景 — 从方法论到工程化的完整指南
keywords: [CSS架构, BEM, CSS-in-JS, 设计系统, CSS工程化]
---

# CSS 架构概述

CSS 架构是前端工程化的核心支柱之一。良好的 CSS 架构能让样式代码可维护、可扩展、可协作，避免"CSS 地狱"。

## 为什么需要 CSS 架构？

随着项目规模增长，原生 CSS 会面临以下问题：

| 问题 | 表现 | 根因 |
|------|------|------|
| 命名冲突 | 样式被意外覆盖 | 全局作用域 |
| 依赖关系混乱 | 修改一处影响全局 | 无模块化 |
| 代码冗余 | 大量重复样式 | 无复用机制 |
| 难以删除 | 不确定样式是否被使用 | 无引用追踪 |
| 团队协作困难 | 合并冲突频繁 | 无规范约束 |

## CSS 架构全景

```mermaid
graph TB
    subgraph 方法论层["方法论层 Methodology"]
        BEM[BEM]
        OOCSS[OOCSS]
        SMACSS[SMACSS]
        ITCSS[ITCSS]
        ATOMIC[Atomic CSS]
    end

    subgraph 工具层["工具层 Tooling"]
        PRE[预处理器<br/>Sass/Less/Stylus]
        POST[后处理器<br/>PostCSS]
        LINT[Lint 工具<br/>Stylelint]
        FMT[格式化<br/>Prettier]
    end

    subgraph 方案层["方案层 Solutions"]
        MODULES[CSS Modules]
        SC[Styled-Components]
        EMOTION[Emotion]
        TW[Tailwind CSS]
        VANILLA[Vanilla Extract]
    end

    subgraph 系统层["系统层 Design System"]
        TOKENS[Design Tokens]
        THEME[主题系统]
        COMP[组件库]
        DOC[文档站点]
    end

    方法论层 --> 方案层
    工具层 --> 方案层
    方案层 --> 系统层

    style 方法论层 fill:#e8f5e9,stroke:#4caf50
    style 工具层 fill:#e3f2fd,stroke:#2196f3
    style 方案层 fill:#fff3e0,stroke:#ff9800
    style 系统层 fill:#fce4ec,stroke:#e91e63
```

## 主流 CSS 架构方案对比

```mermaid
graph LR
    subgraph 传统方案["传统方案"]
        direction TB
        A1["全局 CSS"]
        A2["预处理器"]
        A3["BEM 命名"]
    end

    subgraph 模块化方案["模块化方案"]
        direction TB
        B1["CSS Modules"]
        B2["CSS-in-JS"]
        B3["Utility-First"]
    end

    传统方案 -->|"演进"| 模块化方案

    style 传统方案 fill:#ffcdd2,stroke:#e53935
    style 模块化方案 fill:#c8e6c9,stroke:#43a047
```

### 核心维度对比

```mermaid
graph TB
    subgraph 选择决策树["CSS 方案选择决策树"]
        START{项目规模?} -->|"小型"| S1{需要动态样式?}
        START -->|"中型"| S2{团队偏好?}
        START -->|"大型"| S3{需要 SSR?}

        S1 -->|"是"| R1["CSS-in-JS"]
        S1 -->|"否"| R2["CSS Modules"]

        S2 -->|"实用优先"| R3["Tailwind CSS"]
        S2 -->|"组件化"| R4["CSS Modules"]
        S2 -->|"完全 JS 控制"| R5["Styled-Components"]

        S3 -->|"是"| R6["CSS Modules / Tailwind"]
        S3 -->|"否"| R7["任意方案均可"]
    end

    style START fill:#ff9800,color:#fff
    style R1 fill:#2196f3,color:#fff
    style R2 fill:#2196f3,color:#fff
    style R3 fill:#4caf50,color:#fff
    style R4 fill:#2196f3,color:#fff
    style R5 fill:#9c27b0,color:#fff
    style R6 fill:#4caf50,color:#fff
    style R7 fill:#607d8b,color:#fff
```

## CSS 架构层级（ITCSS 模型）

ITCSS（Inverted Triangle CSS）是最经典的 CSS 架构分层模型，由 Harry Roberts 提出：

```mermaid
graph TB
    subgraph ITCSS["ITCSS 分层模型 — 从抽象到具体"]
        direction TB
        L1["1. Settings<br/>变量、配置<br/>_variables.scss"]
        L2["2. Tools<br/>Mixin、函数<br/>_mixins.scss"]
        L3["3. Generic<br/>重置、normalize<br/>_reset.scss"]
        L4["4. Elements<br/>HTML 原生标签<br/>h1, p, a"]
        L5["5. Objects<br/>布局模式<br/>.o-container"]
        L6["6. Components<br/>UI 组件<br/>.c-card, .c-btn"]
        L7["7. Utilities<br/>工具类<br/>.u-hidden, .u-text-center"]
    end

    L1 --> L2 --> L3 --> L4 --> L5 --> L6 --> L7

    style L1 fill:#e8eaf6,stroke:#3f51b5
    style L2 fill:#e8eaf6,stroke:#3f51b5
    style L3 fill:#e3f2fd,stroke:#2196f3
    style L4 fill:#e3f2fd,stroke:#2196f3
    style L5 fill:#e0f7fa,stroke:#00bcd4
    style L6 fill:#e0f2f1,stroke:#009688
    style L7 fill:#fff3e0,stroke:#ff9800
```

**特异性从上到下递增，每一层只依赖上一层，不反向依赖。**

## 本模块内容导航

| 章节 | 核心内容 | 关键知识点 |
|------|----------|------------|
| [BEM 方法论](./bem.md) | CSS 命名规范与方法论 | Block/Element/Modifier、命名约定、变体管理 |
| [CSS-in-JS 方案](./css-in-js.md) | 运行时与编译时方案对比 | Styled-Components、Emotion、CSS Modules、Tailwind |
| [设计系统搭建](./design-system.md) | 从 Token 到组件库的完整体系 | Design Token、主题切换、组件库架构 |

## 面试要点

1. **解释 ITCSS 模型的分层思想** — 从最宽泛的设置层到最具体的工具层
2. **BEM 方法论解决了什么问题** — 全局命名冲突、样式耦合
3. **CSS-in-JS 与 CSS Modules 的区别** — 运行时 vs 编译时
4. **Design Token 是什么** — 设计决策的原子化存储
5. **如何做主题切换** — CSS 变量、Theme Provider、数据属性切换

---

> **下一步**：从 [BEM 方法论](./bem.md) 开始，了解最基础的 CSS 命名规范。
