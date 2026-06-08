---
sidebar_position: 4
title: "Vue Router"
difficulty: "medium"
tags: ["vue", "vue-router", "routing"]
---

# Vue Router

## 路由模式

### Hash 模式 vs History 模式

```typescript
// Hash 模式（默认）
// URL: http://example.com/#/about
import { createRouter, createWebHashHistory } from 'vue-router';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [...],
});

// History 模式
// URL: http://example.com/about
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [...],
});
```

| 特性 | Hash 模式 | History 模式 |
|------|----------|-------------|
| URL 样式 | 带 `#` 号 | 无 `#`，干净 URL |
| 服务端配置 | 不需要 | 需要配置 fallback |
| SEO | 较差 | 较好 |
| 兼容性 | IE8+ | IE10+ |
| 原理 | `hashchange` 事件 | `pushState` / `replaceState` |

### History 模式服务端配置（Nginx）

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## 导航守卫

### 全局守卫

```typescript
// 前置守卫
router.beforeEach((to, from, next) => {
  const isAuthenticated = useAuthStore().isLoggedIn;

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
  } else {
    next();
  }
});

// 后置钩子
router.afterEach((to, from) => {
  document.title = to.meta.title as string || 'My App';
});
```

### 路由独享守卫

```typescript
const routes = [
  {
    path: '/admin',
    component: Admin,
    beforeEnter: (to, from, next) => {
      if (!isAdmin()) next('/403');
      else next();
    },
  },
];
```

### 组件内守卫

```typescript
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router';

// 进入路由前
onBeforeRouteUpdate((to, from) => {
  // 路由参数变化时重新获取数据
  fetchData(to.params.id);
});

// 离开路由前
onBeforeRouteLeave((to, from) => {
  if (hasUnsavedChanges.value) {
    return window.confirm('有未保存的更改，确定离开吗？');
  }
});
```

## 路由懒加载

```typescript
const routes = [
  {
    path: '/dashboard',
    component: () => import('./views/Dashboard.vue'),
  },
  // 带命名 chunk
  {
    path: '/settings',
    component: () => import(/* webpackChunkName: "settings" */ './views/Settings.vue'),
  },
];
```

## 动态路由

```typescript
import type { RouteRecordRaw } from 'vue-router';

const router = createRouter({ ... });

// 动态添加路由（权限系统常用）
function addDynamicRoutes(menus: MenuItem[]) {
  menus.forEach((menu) => {
    const route: RouteRecordRaw = {
      path: menu.path,
      component: () => import(`./views/${menu.component}.vue`),
      name: menu.name,
    };
    router.addRoute('layout', route);
  });
}

// 动态删除路由
router.removeRoute('dashboard');

// 检查路由是否存在
router.hasRoute('dashboard');
router.getRoutes(); // 获取所有路由
```

## 路由元信息（meta）

```typescript
const routes = [
  {
    path: '/admin',
    component: Admin,
    meta: {
      requiresAuth: true,
      roles: ['admin', 'editor'],
      title: '管理后台',
      keepAlive: true,
    },
  },
];

// 在守卫中使用
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  const requiredRoles = to.meta.roles as string[];

  if (requiredRoles && !requiredRoles.includes(userStore.role)) {
    next('/403');
  } else {
    next();
  }
});
```

## 关键点

- Hash 模式基于 `hashchange` 事件，History 模式基于 `pushState` API
- History 模式需要服务端配置 fallback，否则刷新 404
- 导航守卫执行顺序：全局 beforeEach → 路由 beforeEnter → 组件 beforeRouteEnter → 全局 afterEach
- 路由懒加载配合 `Suspense` 组件可优化加载体验
- 动态路由常用于权限系统，根据用户角色动态生成路由
