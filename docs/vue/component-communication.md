---
sidebar_position: 6
title: "组件通信"
difficulty: "easy"
tags: ["vue", "component", "props", "emit"]
---

# 组件通信

## 通信方式总览

```
父子组件：  Props / Emit / v-model / ref / $attrs
兄弟组件：  共同父组件中转 / Pinia / EventBus（不推荐）
跨层级：   Provide/Inject / Pinia
全局：     Pinia / EventBus（不推荐）
```

## 1. Props / Emit（最常用）

```vue
<!-- 父组件 -->
<script setup>
import Child from './Child.vue';
import { ref } from 'vue';

const message = ref('hello');
const count = ref(0);

function handleUpdate(newVal) {
  count.value = newVal;
}
</script>

<template>
  <Child
    :message="message"
    :count="count"
    @update="handleUpdate"
  />
</template>
```

```vue
<!-- 子组件 -->
<script setup>
// defineProps 编译器宏，无需导入
const props = defineProps({
  message: { type: String, required: true },
  count: { type: Number, default: 0 },
});

// defineEmits 编译器宏，无需导入
const emit = defineEmits(['update', 'delete']);

function handleClick() {
  emit('update', props.count + 1);
}
</script>
```

## 2. v-model（语法糖）

```vue
<!-- 父组件 -->
<template>
  <CustomInput v-model="name" />
  <!-- 等价于 -->
  <CustomInput :modelValue="name" @update:modelValue="name = $event" />
</template>
```

```vue
<!-- 子组件 -->
<script setup>
const model = defineModel(); // Vue 3.4+

// 或手动实现
const props = defineProps({ modelValue: String });
const emit = defineEmits(['update:modelValue']);
</script>

<template>
  <input
    :value="model"
    @input="model = $event.target.value"
  />
</template>
```

### 多个 v-model

```vue
<!-- 父组件 -->
<UserForm v-model:firstName="first" v-model:lastName="last" />
```

```vue
<!-- 子组件 -->
<script setup>
const firstName = defineModel('firstName');
const lastName = defineModel('lastName');
</script>

<template>
  <input v-model="firstName" />
  <input v-model="lastName" />
</template>
```

## 3. ref / $parent

```vue
<!-- 父组件访问子组件 -->
<script setup>
import Child from './Child.vue';
import { ref } from 'vue';

const childRef = ref(null);

function callChildMethod() {
  childRef.value?.someMethod();
}
</script>

<template>
  <Child ref="childRef" />
</template>
```

```vue
<!-- 子组件访问父组件（不推荐） -->
<script setup>
import { getCurrentInstance } from 'vue';

const instance = getCurrentInstance();
const parent = instance?.parent;
</script>
```

## 4. $attrs（透传属性）

```vue
<!-- 祖先组件 -->
<Button type="submit" class="btn-primary" data-testid="submit-btn" />
```

```vue
<!-- 中间组件（不消费 props） -->
<template>
  <!-- v-bind="$attrs" 将所有非 prop 属性透传 -->
  <button v-bind="$attrs">
    <slot />
  </button>
</template>

<script setup>
// 禁用单根元素自动透传
defineOptions({ inheritAttrs: false });
</script>
```

## 5. Provide / Inject（跨层级）

```vue
<!-- 祖先组件 -->
<script setup>
import { provide, ref } from 'vue';

const theme = ref('dark');
const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
};

// 提供响应式数据
provide('theme', { theme, toggleTheme });

// 提供只读数据
provide('appName', 'MyApp');
</script>
```

```vue
<!-- 后代组件 -->
<script setup>
import { inject } from 'vue';

const { theme, toggleTheme } = inject('theme');
const appName = inject('appName');

// 带默认值
const config = inject('config', { debug: false });
</script>
```

## 6. Pinia（推荐用于复杂场景）

```typescript
// stores/notification.ts
export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref([]);

  function notify(message, type = 'info') {
    notifications.value.push({ id: Date.now(), message, type });
  }

  function remove(id) {
    notifications.value = notifications.value.filter((n) => n.id !== id);
  }

  return { notifications, notify, remove };
});

// 任何组件中
const store = useNotificationStore();
store.notify('操作成功', 'success');
```

## 通信方式选择指南

| 场景 | 推荐方式 |
|------|---------|
| 父 → 子 | Props |
| 子 → 父 | Emit / v-model |
| 兄弟 | Pinia |
| 跨层级 | Provide/Inject |
| 全局状态 | Pinia |
| 表单双向绑定 | v-model |
| 调用子组件方法 | ref |

## 关键点

- Props 单向数据流，子组件不能直接修改 props
- `defineModel()` 是 Vue 3.4+ 的语法糖，简化 v-model 实现
- `$attrs` 包含所有非 prop 的 attribute，用于属性透传
- Provide/Inject 不是响应式的，除非传递 ref/reactive 对象
- 复杂应用优先使用 Pinia，避免 EventBus 和 $parent
