---
sidebar_position: 3
title: H5 编辑器架构设计
---

# H5 编辑器架构设计

H5 编辑器（也称页面搭建器、可视化编辑器）是低代码平台的产品形态，用户通过拖拽和配置完成页面搭建，最终输出可运行的页面。

## 一、整体架构

### 1.1 系统分层

```
┌─────────────────────────────────────────────────────┐
│                    编辑器 UI 层                       │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌────────┐│
│  │ 物料面板  │ │  画布区域  │ │ 属性面板  │ │ 大纲树 ││
│  └──────────┘ └───────────┘ └──────────┘ └────────┘│
├─────────────────────────────────────────────────────┤
│                   状态管理层                          │
│  ┌────────────────────────────────────────────────┐│
│  │         Editor Store（全局状态）                 ││
│  │  - DSL Tree（组件树 JSON）                      ││
│  │  - 选中状态 / 悬停状态                          ││
│  │  - 操作历史（撤销/重做）                         ││
│  └────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────┤
│                   核心引擎层                          │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌────────┐│
│  │ 拖拽引擎  │ │ 渲染引擎  │ │ DSL 引擎 │ │ 导出器 ││
│  └──────────┘ └───────────┘ └──────────┘ └────────┘│
├─────────────────────────────────────────────────────┤
│                   组件物料层                          │
│  ┌────────────────────────────────────────────────┐│
│  │  基础组件 │ 表单组件 │ 布局组件 │ 图表组件       ││
│  └────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### 1.2 技术选型对比

| 方案 | 代表产品 | 优点 | 缺点 |
|------|----------|------|------|
| iframe 隔离 | 阿里 LowCodeEngine | 样式/JS 完全隔离，预览即编辑 | 通信复杂，跨 iframe 操作有延迟 |
| Shadow DOM | 微信小程序编辑器 | 原生隔离，性能好 | 兼容性问题，调试不便 |
| 同文档渲染 | 绝大多数开源方案 | 实现简单，交互流畅 | 需要处理样式污染 |

## 二、DSL 设计

### 2.1 DSL 是什么

DSL（Domain Specific Language）是编辑器的"数据模型"，描述页面的组件树结构。

```json
{
  "componentName": "Page",
  "props": {
    "style": { "padding": "20px" }
  },
  "children": [
    {
      "componentName": "Header",
      "props": { "title": "活动页面" },
      "id": "header_001"
    },
    {
      "componentName": "Container",
      "props": { "direction": "column" },
      "id": "container_001",
      "children": [
        {
          "componentName": "Banner",
          "props": {
            "src": "https://example.com/banner.jpg",
            "alt": "活动横幅"
          },
          "id": "banner_001"
        },
        {
          "componentName": "Button",
          "props": {
            "text": "立即参与",
            "type": "primary",
            "size": "large"
          },
          "id": "button_001"
        }
      ]
    }
  ]
}
```

### 2.2 DSL 设计原则

```typescript
// 节点类型定义
interface DSLNode {
  id: string;                    // 唯一标识
  componentName: string;         // 组件名称
  props: Record<string, any>;    // 属性
  children?: DSLNode[];          // 子节点（容器组件）
  condition?: string;            // 渲染条件（动态显隐）
  loop?: {                       // 循环渲染
    data: string;                // 数据源表达式
    itemName?: string;           // 循环变量名
    indexName?: string;          // 索引变量名
  };
  events?: Record<string, {     // 事件绑定
    type: 'action' | 'link' | 'script';
    config: any;
  }>;
  style?: Record<string, any>;  // 内联样式
  className?: string;            // CSS 类名
}
```

### 2.3 节点操作方法

```typescript
class DSLOperations {
  // 插入节点
  static insertNode(tree: DSLNode, targetId: string, newNode: DSLNode, position: 'before' | 'after' | 'inside'): DSLNode {
    return produce(tree, (draft) => {
      const parent = findParent(draft, targetId);
      if (!parent || !parent.children) return;

      const targetIndex = parent.children.findIndex(c => c.id === targetId);
      if (position === 'before') {
        parent.children.splice(targetIndex, 0, newNode);
      } else if (position === 'after') {
        parent.children.splice(targetIndex + 1, 0, newNode);
      } else {
        const target = parent.children[targetIndex];
        target.children = target.children ?? [];
        target.children.push(newNode);
      }
    });
  }

  // 删除节点
  static removeNode(tree: DSLNode, nodeId: string): DSLNode {
    return produce(tree, (draft) => {
      const parent = findParent(draft, nodeId);
      if (!parent?.children) return;
      parent.children = parent.children.filter(c => c.id !== nodeId);
    });
  }

  // 移动节点
  static moveNode(tree: DSLNode, nodeId: string, targetId: string, position: 'before' | 'after'): DSLNode {
    return produce(tree, (draft) => {
      const node = findNode(draft, nodeId);
      if (!node) return;
      // 先从原位置移除
      const oldParent = findParent(draft, nodeId);
      if (oldParent?.children) {
        oldParent.children = oldParent.children.filter(c => c.id !== nodeId);
      }
      // 插入新位置
      const newParent = findParent(draft, targetId);
      if (newParent?.children) {
        const targetIndex = newParent.children.findIndex(c => c.id === targetId);
        const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
        newParent.children.splice(insertIndex, 0, node);
      }
    });
  }

  // 更新节点属性
  static updateNodeProps(tree: DSLNode, nodeId: string, props: Record<string, any>): DSLNode {
    return produce(tree, (draft) => {
      const node = findNode(draft, nodeId);
      if (node) {
        node.props = { ...node.props, ...props };
      }
    });
  }
}
```

## 三、画布设计

### 3.1 画布渲染模式

```typescript
// 画布渲染器：将 DSL 转换为 React 组件树
function CanvasRenderer({ dsl, selectedId, onSelect }: CanvasRendererProps) {
  return (
    <div className="canvas-container">
      {renderNode(dsl, selectedId, onSelect)}
    </div>
  );
}

function renderNode(node: DSLNode, selectedId: string | null, onSelect: (id: string) => void): React.ReactNode {
  const Component = componentRegistry.get(node.componentName);
  if (!Component) return null;

  const isSelected = node.id === selectedId;

  return (
    <ComponentWrapper
      key={node.id}
      nodeId={node.id}
      isSelected={isSelected}
      onClick={(e: MouseEvent) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
    >
      <Component {...node.props}>
        {node.children?.map(child => renderNode(child, selectedId, onSelect))}
      </Component>
    </ComponentWrapper>
  );
}

// 选中框组件
function ComponentWrapper({ nodeId, isSelected, onClick, children }: WrapperProps) {
  return (
    <div
      className={`component-wrapper ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      data-node-id={nodeId}
    >
      {children}
      {isSelected && (
        <>
          <div className="selection-border" />
          <div className="resize-handle" />
        </>
      )}
    </div>
  );
}
```

### 3.2 辅助线与标尺

```typescript
// 标尺组件
function Ruler({ direction, length, zoom }: RulerProps) {
  const pixelsPerCM = 50 * zoom; // 1cm = 50px * 缩放比
  const marks = [];

  for (let i = 0; i < length; i += pixelsPerCM) {
    marks.push(
      <div key={i} className="ruler-mark" style={{ [direction === 'h' ? 'left' : 'top']: i }}>
        <span>{Math.round(i / zoom)}</span>
      </div>
    );
  }

  return <div className={`ruler ruler-${direction}`}>{marks}</div>;
}

// 对齐辅助线
function AlignmentLines({ guidelines }: { guidelines: Guideline[] }) {
  return (
    <div className="alignment-lines">
      {guidelines.map((line, i) => (
        <div
          key={i}
          className={`guideline guideline-${line.type}`}
          style={{
            [line.type === 'vertical' ? 'left' : 'top']: line.position,
          }}
        />
      ))}
    </div>
  );
}
```

## 四、组件树与状态管理

### 4.1 Editor Store 设计

```typescript
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface EditorState {
  // DSL 树
  dsl: DSLNode;
  // 选中的节点 ID
  selectedId: string | null;
  // 悬停的节点 ID
  hoveredId: string | null;
  // 操作历史
  history: DSLNode[];
  historyIndex: number;
  // 画布缩放
  zoom: number;
  // 是否预览模式
  isPreview: boolean;
}

interface EditorActions {
  // 节点操作
  insertNode: (targetId: string, node: DSLNode, position: 'before' | 'after' | 'inside') => void;
  removeNode: (nodeId: string) => void;
  moveNode: (nodeId: string, targetId: string, position: 'before' | 'after') => void;
  updateProps: (nodeId: string, props: Record<string, any>) => void;

  // 选中操作
  selectNode: (nodeId: string | null) => void;
  hoverNode: (nodeId: string | null) => void;

  // 历史操作
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  // 画布操作
  setZoom: (zoom: number) => void;
  togglePreview: () => void;
}

const useEditorStore = create<EditorState & EditorActions>()(
  subscribeWithSelector((set, get) => ({
    dsl: { componentName: 'Page', props: {}, id: 'root' },
    selectedId: null,
    hoveredId: null,
    history: [],
    historyIndex: -1,
    zoom: 1,
    isPreview: false,

    insertNode: (targetId, node, position) => {
      set((state) => {
        const newDsl = DSLOperations.insertNode(state.dsl, targetId, node, position);
        return { dsl: newDsl };
      });
      get().pushHistory();
    },

    removeNode: (nodeId) => {
      set((state) => ({
        dsl: DSLOperations.removeNode(state.dsl, nodeId),
        selectedId: state.selectedId === nodeId ? null : state.selectedId,
      }));
      get().pushHistory();
    },

    moveNode: (nodeId, targetId, position) => {
      set((state) => ({
        dsl: DSLOperations.moveNode(state.dsl, nodeId, targetId, position),
      }));
      get().pushHistory();
    },

    updateProps: (nodeId, props) => {
      set((state) => ({
        dsl: DSLOperations.updateNodeProps(state.dsl, nodeId, props),
      }));
      get().pushHistory();
    },

    selectNode: (nodeId) => set({ selectedId: nodeId }),
    hoverNode: (nodeId) => set({ hoveredId: nodeId }),

    pushHistory: () => {
      set((state) => {
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(state.dsl);
        return { history: newHistory, historyIndex: newHistory.length - 1 };
      });
    },

    undo: () => {
      set((state) => {
        if (state.historyIndex <= 0) return state;
        const newIndex = state.historyIndex - 1;
        return { dsl: state.history[newIndex], historyIndex: newIndex };
      });
    },

    redo: () => {
      set((state) => {
        if (state.historyIndex >= state.history.length - 1) return state;
        const newIndex = state.historyIndex + 1;
        return { dsl: state.history[newIndex], historyIndex: newIndex };
      });
    },

    setZoom: (zoom) => set({ zoom }),
    togglePreview: () => set((state) => ({ isPreview: !state.isPreview })),
  }))
);
```

### 4.2 快捷键注册

```typescript
function useEditorHotkeys() {
  const { removeNode, selectedId, undo, redo } = useEditorStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Delete / Backspace 删除选中节点
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        removeNode(selectedId);
      }
      // Ctrl+Z 撤销
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Ctrl+Shift+Z 重做
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        redo();
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [selectedId, removeNode, undo, redo]);
}
```

## 五、属性面板

### 5.1 属性面板与 Schema 驱动

```typescript
function PropertyPanel() {
  const { dsl, selectedId, updateProps } = useEditorStore();

  if (!selectedId) {
    return <div className="property-panel empty">请选择一个组件</div>;
  }

  const selectedNode = findNode(dsl, selectedId);
  if (!selectedNode) return null;

  // 获取该组件的属性 Schema
  const material = materialRegistry.get(selectedNode.componentName);
  const propertySchema = material?.propertySchema;

  if (!propertySchema) {
    return <div className="property-panel">该组件无可配置属性</div>;
  }

  // 使用 JSON Schema 表单渲染属性面板
  return (
    <div className="property-panel">
      <h3>{material.title} 属性</h3>
      <SchemaForm
        schema={propertySchema}
        value={selectedNode.props}
        onChange={(newProps) => updateProps(selectedId, newProps)}
      />

      {/* 样式面板 */}
      <h3>样式</h3>
      <StyleEditor
        value={selectedNode.style ?? {}}
        onChange={(style) => updateProps(selectedId, { style })}
      />

      {/* 事件面板 */}
      <h3>事件</h3>
      <EventEditor
        events={selectedNode.events ?? {}}
        onChange={(events) => updateProps(selectedId, { events })}
      />
    </div>
  );
}
```

## 六、预览与导出

### 6.1 预览模式

```typescript
// 预览渲染器（去掉编辑态的包裹元素）
function PreviewRenderer({ dsl }: { dsl: DSLNode }) {
  return renderPreviewNode(dsl);
}

function renderPreviewNode(node: DSLNode): React.ReactNode {
  const Component = componentRegistry.get(node.componentName);
  if (!Component) return null;

  // 条件渲染
  if (node.condition) {
    const visible = evaluateExpression(node.condition, {});
    if (!visible) return null;
  }

  // 循环渲染
  if (node.loop) {
    const list = evaluateExpression(node.loop.data, {});
    return list.map((item: any, index: number) => (
      <Component key={index} {...node.props}>
        {node.children?.map(child => renderPreviewNode(child))}
      </Component>
    ));
  }

  return (
    <Component {...node.props}>
      {node.children?.map(child => renderPreviewNode(child))}
    </Component>
  );
}
```

### 6.2 导出为代码

```typescript
// DSL → React 代码生成器
function generateReactCode(dsl: DSLNode, indent = 0): string {
  const pad = '  '.repeat(indent);
  const { componentName, props, children } = dsl;

  const propsStr = Object.entries(props)
    .map(([key, value]) => `${key}=${serializeProp(value)}`)
    .join(' ');

  if (!children || children.length === 0) {
    return `${pad}<${componentName} ${propsStr} />`;
  }

  const childrenCode = children
    .map(child => generateReactCode(child, indent + 1))
    .join('\n');

  return `${pad}<${componentName} ${propsStr}>\n${childrenCode}\n${pad}</${componentName}>`;
}

// DSL → Vue SFC 代码生成器
function generateVueCode(dsl: DSLNode): string {
  const template = generateVueTemplate(dsl);
  const script = generateVueScript(dsl);
  const style = generateVueStyle(dsl);

  return `<template>\n${template}\n</template>\n\n<script>\n${script}\n</script>\n\n<style scoped>\n${style}\n</style>`;
}
```

### 6.3 导出为 JSON（存档/分享）

```typescript
// 导出完整项目数据
function exportProject(editorState: EditorState): ProjectFile {
  return {
    version: '1.0.0',
    name: '我的项目',
    createdAt: new Date().toISOString(),
    dsl: editorState.dsl,
    globalStyle: {
      theme: 'light',
      primaryColor: '#1677ff',
    },
    dataSources: [],
    pages: [
      {
        id: 'page_1',
        name: '首页',
        path: '/',
        dsl: editorState.dsl,
      },
    ],
  };
}
```

## 七、面试要点

### 高频问题

1. **H5 编辑器的 DSL 应该怎么设计？**
   - 树形结构描述组件层级，每个节点包含 componentName、props、children
   - 需要支持条件渲染、循环渲染、事件绑定
   - 节点需要唯一 ID 用于选中和操作

2. **编辑器的状态管理方案怎么选？**
   - Zustand / Jotai 等轻量方案适合中小型编辑器
   - Redux / MobX 适合需要复杂中间件的场景
   - 核心状态：DSL 树、选中状态、操作历史

3. **如何实现撤销/重做？**
   - 维护历史栈（history array）和当前索引（historyIndex）
   - 每次操作后 push 新状态到栈中
   - undo 移动索引指针，redo 向后移动
   - 注意使用 immutable 更新，避免引用问题

4. **画布用 iframe 还是同文档渲染？**
   - iframe：隔离性好，适合第三方物料（避免样式污染）
   - 同文档：性能好，交互简单，适合自研物料

5. **预览和编辑态如何共用一套代码？**
   - 编辑态：渲染 ComponentWrapper 包裹层（选中框、拖拽手柄）
   - 预览态：直接渲染组件，不加包裹层
   - 抽离 renderNode 函数，通过 isPreview 参数控制

### 架构设计要点

- DSL 与渲染解耦：同一套 DSL 可以渲染为 React/Vue/小程序
- 组件注册机制：物料通过统一协议注册，编辑器无需硬编码组件
- 插件化：拖拽行为、属性面板、导出器都可以通过插件扩展
- 性能优化：大画布场景使用虚拟滚动、增量渲染
