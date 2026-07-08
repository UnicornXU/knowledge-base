---
sidebar_position: 1
title: 拖拽引擎实现原理
---

# 拖拽引擎实现原理

拖拽引擎是低代码平台的核心交互基础，负责组件从物料区拖入画布、画布内排序、跨容器拖拽等场景。

## 一、HTML5 Drag & Drop API

### 1.1 基本流程

HTML5 原生拖拽 API 提供了浏览器级别的拖拽能力，核心事件链如下：

```
拖拽源（Source）                 放置目标（Target）
    │                                │
    ├── dragstart ──────────────────►│
    │                                ├── dragenter
    │                                ├── dragover（必须 preventDefault 才允许 drop）
    │   ◄── drag（持续触发）─────────┤
    │                                ├── dragleave
    ├── drop ◄──────────────────────┤
    └── dragend                      └── drop
```

### 1.2 核心代码示例

```typescript
// 拖拽源：设置拖拽数据
function handleDragStart(event: DragEvent) {
  event.dataTransfer!.setData('application/json', JSON.stringify({
    type: 'Button',
    props: { text: '按钮', variant: 'primary' }
  }));
  event.dataTransfer!.effectAllowed = 'copy';
}

// 放置目标：允许放置
function handleDragOver(event: DragEvent) {
  event.preventDefault();
  event.dataTransfer!.dropEffect = 'copy';
}

// 放置目标：处理放置
function handleDrop(event: DragEvent) {
  event.preventDefault();
  const data = JSON.parse(event.dataTransfer!.getData('application/json'));
  // 将组件添加到画布
  canvas.addComponent(data);
}
```

### 1.3 原生 API 的局限

| 问题 | 说明 |
|------|------|
| 移动端不支持 | 触摸设备无 drag 事件，需用 touchstart/touchmove/touchend 模拟 |
| 拖拽预览不可控 | 浏览器生成的 ghost 图片样式有限，自定义需要 hack |
| 嵌套拖拽冲突 | 父子容器同时监听 dragover 时事件冒泡需手动处理 |
| 性能问题 | drag 事件触发频率高，需节流或用 requestAnimationFrame |

## 二、Sortable.js 排序原理

### 2.1 核心机制

Sortable.js 是最流行的拖拽排序库，其核心原理：

```
1. mousedown/touchstart → 识别拖拽手势
2. 创建拖拽克隆体（clone）作为视觉反馈
3. mousemove/touchmove → 计算鼠标位置，插入占位符（placeholder）
4. 通过 DOM 操作实现实时排序（不是虚拟 DOM diff）
5. mouseup/touchend → 确定最终位置，触发 onEnd 回调
```

### 2.2 关键实现细节

```typescript
// Sortable.js 简化版核心逻辑
class SimpleSortable {
  private dragging: HTMLElement | null = null;
  private placeholder: HTMLElement | null = null;

  handleMouseDown(event: MouseEvent) {
    const item = this.findDraggableItem(event.target as HTMLElement);
    if (!item) return;

    this.dragging = item;
    // 创建占位符
    this.placeholder = document.createElement('div');
    this.placeholder.className = 'sortable-placeholder';
    this.placeholder.style.height = `${item.offsetHeight}px`;

    // 记录初始位置
    const rect = item.getBoundingClientRect();
    this.offsetX = event.clientX - rect.left;
    this.offsetY = event.clientY - rect.top;

    // 插入占位符，移除原元素
    item.parentNode!.insertBefore(this.placeholder, item);
    item.style.position = 'fixed';
    item.style.zIndex = '9999';
    item.style.pointerEvents = 'none';
  }

  handleMouseMove(event: MouseEvent) {
    if (!this.dragging) return;

    // 更新拖拽元素位置
    this.dragging.style.left = `${event.clientX - this.offsetX}px`;
    this.dragging.style.top = `${event.clientY - this.offsetY}px`;

    // 计算插入位置
    const siblings = this.getSiblings();
    for (const sibling of siblings) {
      const rect = sibling.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (event.clientY < midY) {
        sibling.parentNode!.insertBefore(this.placeholder!, sibling);
        break;
      }
    }
  }

  handleMouseUp() {
    if (!this.dragging) return;
    // 将拖拽元素放回 placeholder 位置
    this.placeholder!.parentNode!.insertBefore(this.dragging, this.placeholder!);
    this.cleanup();
  }
}
```

### 2.3 Sortable.js vs DOM Diff

| 特性 | Sortable.js | 虚拟 DOM 方案 |
|------|-------------|---------------|
| 排序方式 | 直接操作 DOM | diff 算法计算最小变更 |
| 性能 | 单次移动 O(1) | diff 过程 O(n) |
| 适用场景 | 大列表拖拽排序 | 复杂状态驱动 UI |
| 框架集成 | 需要手动同步状态 | 天然与框架状态同步 |

## 三、拖拽排版与对齐辅助线

### 3.1 辅助线实现原理

```
拖拽过程中：
1. 获取拖拽元素的 bounding rect
2. 与画布中其他元素逐一比较边界
3. 当距离阈值内（如 5px）触发吸附
4. 渲染辅助线（水平/垂直线）

       辅助线
         │
    ┌────┼────┐
    │ A  │    │  ← 当 A 的右边与 B 的左边对齐时
    └────┼────┘     显示垂直辅助线
         │
    ┌────┼────┐
    │ B  │    │
    └────┼────┘
```

### 3.2 辅助线算法

```typescript
interface Guideline {
  type: 'horizontal' | 'vertical';
  position: number; // 像素位置
  source: string;   // 来源元素 ID
  target: string;   // 目标元素 ID
}

function calcGuidelines(
  dragRect: DOMRect,
  targets: DOMRect[],
  threshold = 5
): Guideline[] {
  const lines: Guideline[] = [];

  for (const target of targets) {
    // 垂直对齐：左边-左边、右边-右边、左边-右边、中心-中心
    const vChecks = [
      { s: dragRect.left, t: target.left, type: 'left-left' },
      { s: dragRect.right, t: target.right, type: 'right-right' },
      { s: dragRect.left, t: target.right, type: 'left-right' },
      { s: dragRect.right, t: target.left, type: 'right-left' },
      { s: dragRect.left + dragRect.width / 2, t: target.left + target.width / 2, type: 'center' },
    ];

    for (const check of vChecks) {
      if (Math.abs(check.s - check.t) < threshold) {
        lines.push({
          type: 'vertical',
          position: check.t,
          source: 'drag',
          target: 'target',
        });
      }
    }

    // 水平对齐同理（top-top、bottom-bottom、center）
  }
  return lines;
}
```

## 四、组件物料与拖拽注册

### 4.1 物料描述协议

```typescript
interface MaterialDescriptor {
  // 组件唯一标识
  componentName: string;
  // 显示名称
  title: string;
  // 分类
  category: 'basic' | 'layout' | 'form' | 'data' | 'chart';
  // 图标
  icon: string;
  // 默认属性
  defaultProps: Record<string, any>;
  // 拖拽预览图
  thumbnail?: string;
  // 属性配置 Schema（用于属性面板）
  propertySchema: JSONSchema;
  // 是否可嵌套子组件
  isContainer: boolean;
}
```

### 4.2 物料注册表

```typescript
// 物料注册中心
class MaterialRegistry {
  private materials = new Map<string, MaterialDescriptor>();

  register(descriptor: MaterialDescriptor) {
    this.materials.set(descriptor.componentName, descriptor);
  }

  getByCategory(category: string): MaterialDescriptor[] {
    return Array.from(this.materials.values())
      .filter(m => m.category === category);
  }

  getDragData(componentName: string): string {
    const material = this.materials.get(componentName);
    return JSON.stringify({
      componentName,
      props: material?.defaultProps ?? {},
    });
  }
}

// 注册物料
const registry = new MaterialRegistry();
registry.register({
  componentName: 'Button',
  title: '按钮',
  category: 'basic',
  icon: 'button-icon',
  defaultProps: { text: '按钮', type: 'primary' },
  isContainer: false,
  propertySchema: {
    type: 'object',
    properties: {
      text: { type: 'string', title: '按钮文字' },
      type: { type: 'string', enum: ['primary', 'default', 'dashed'], title: '类型' },
      disabled: { type: 'boolean', title: '禁用' },
    },
  },
});
```

### 4.3 拖拽与渲染的桥接

```
物料面板                    拖拽引擎                     画布渲染器
┌──────────┐     dragstart    ┌──────────┐    drop     ┌──────────┐
│ 物料卡片  │ ──────────────► │ 拖拽数据  │ ─────────► │ 组件实例  │
│ (源组件)  │                 │ (JSON)   │            │ (渲染)   │
└──────────┘                 └──────────┘            └──────────┘
                                    │
                              画布内排序时
                                    │
                              ┌─────▼─────┐
                              │ 更新 DSL   │
                              │ (JSON 树)  │
                              └───────────┘
```

## 五、面试要点

### 高频问题

1. **HTML5 Drag API 的 drop 事件不触发怎么办？**
   - 必须在 dragover 中调用 `event.preventDefault()`，否则 drop 事件不会触发

2. **Sortable.js 如何实现拖拽排序？**
   - 基于 mouse/touch 事件模拟拖拽，通过占位符 + DOM 插入实现排序
   - 不使用 HTML5 Drag API，兼容性更好

3. **拖拽辅助线如何实现吸附效果？**
   - 计算拖拽元素边界与其他元素边界的距离
   - 距离小于阈值时修正位置并显示辅助线
   - 使用 `transform: translate` 做位置修正，避免触发重排

4. **如何处理嵌套容器的拖拽冲突？**
   - 使用 `event.stopPropagation()` 阻止冒泡
   - 通过 `dataTransfer` 类型区分不同拖拽源
   - 设置拖拽层级，只有最内层容器响应 drop

### 性能优化

- 拖拽过程中的辅助线计算使用节流（throttle 16ms）
- 大量元素的碰撞检测使用四叉树优化
- 拖拽预览使用 `requestAnimationFrame` 更新位置
