---
sidebar_position: 3
title: "路由架构设计"
difficulty: "medium"
tags: ["architecture", "routing", "react-router", "micro-frontend"]
---

# 路由架构设计

## 为什么路由架构很重要？

```
简单的路由：                    复杂的路由架构：

/                              /
├── /home                     ├── /auth
├── /about                    │   ├── /login
└── /contact                  │   └── /register
                              ├── /app (需登录)
简单的 SPA                    │   ├── /dashboard
3 个页面                      │   ├── /users
                              │   │   ├── /:id
                              │   │   └── /:id/edit
                              │   ├── /settings
                              │   │   ├── /profile
                              │   │   ├── /security (需管理员)
                              │   │   └── /notifications
                              │   └── /reports (需权限)
                              └── /admin (需管理员权限)
                                  ├── /users
                                  ├── /roles
                                  └── /system
                              
                              企业级应用
                              50+ 页面、权限控制、嵌套布局
```

## 一、路由基础架构

### 1.1 路由配置化

```typescript
// routes/index.tsx
import { createBrowserRouter, RouteObject } from 'react-router-dom';

// 路由配置类型
interface RouteConfig {
  path: string;
  component: React.LazyExoticComponent<React.ComponentType>;
  meta?: {
    title?: string;
    auth?: boolean;
    roles?: string[];
  };
  children?: RouteConfig[];
}

// 路由配置
export const routes: RouteConfig[] = [
  {
    path: '/login',
    component: lazy(() => import('@/features/auth/pages/LoginPage')),
    meta: { title: '登录' },
  },
  {
    path: '/app',
    component: lazy(() => import('@/features/app/layouts/AppLayout')),
    meta: { auth: true },
    children: [
      {
        path: 'dashboard',
        component: lazy(() => import('@/features/dashboard/pages/DashboardPage')),
        meta: { title: '仪表盘' },
      },
      {
        path: 'users',
        component: lazy(() => import('@/features/user/pages/UserListPage')),
        meta: { title: '用户管理', roles: ['admin'] },
      },
    ],
  },
];

// 生成路由对象
function generateRoutes(config: RouteConfig[]): RouteObject[] {
  return config.map(({ path, component: Component, children }) => ({
    path,
    element: (
      <Suspense fallback={<Loading />}>
        <Component />
      </Suspense>
    ),
    children: children ? generateRoutes(children) : undefined,
  }));
}

export const router = createBrowserRouter(generateRoutes(routes));
```

### 1.2 文件系统路由（Next.js 风格）

```
app/                              路由结构：
├── page.tsx                     → /
├── about/
│   └── page.tsx                 → /about
├── blog/
│   ├── page.tsx                 → /blog
│   └── [slug]/
│       └── page.tsx             → /blog/:slug
├── dashboard/
│   ├── layout.tsx               → 布局组件
│   ├── page.tsx                 → /dashboard
│   ├── settings/
│   │   └── page.tsx             → /dashboard/settings
│   └── users/
│       ├── page.tsx             → /dashboard/users
│       └── [id]/
│           └── page.tsx         → /dashboard/users/:id
└── (auth)/                      → 路由组（不影响 URL）
    ├── login/
    │   └── page.tsx             → /login
    └── register/
        └── page.tsx             → /register
```

## 二、嵌套路由与布局系统

### 2.1 嵌套路由原理

```
嵌套路由的渲染结构：
═══════════════════

URL: /app/users/123

┌─────────────────────────────────────────┐
│              RootLayout                  │
│  ┌───────────────────────────────────┐  │
│  │           AppLayout               │  │
│  │  ┌─────────┬──────────────────┐  │  │
│  │  │         │   UserLayout     │  │  │
│  │  │  Side   │  ┌────────────┐  │  │  │
│  │  │  bar    │  │ UserProfile│  │  │  │
│  │  │         │  │    Page    │  │  │  │
│  │  │         │  └────────────┘  │  │  │
│  │  └─────────┴──────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### 2.2 React Router 嵌套路由

```tsx
// 根布局
function RootLayout() {
  return (
    <html>
      <body>
        <Outlet />  {/* 子路由渲染位置 */}
      </body>
    </html>
  );
}

// 应用布局
function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-content">
        <Outlet />  {/* 子路由渲染位置 */}
      </main>
    </div>
  );
}

// 用户模块布局
function UserLayout() {
  return (
    <div className="user-layout">
      <UserBreadcrumb />
      <Outlet />  {/* 子路由渲染位置 */}
    </div>
  );
}

// 路由配置
const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/app',
        element: <AppLayout />,
        children: [
          { path: 'dashboard', element: <DashboardPage /> },
          {
            path: 'users',
            element: <UserLayout />,
            children: [
              { index: true, element: <UserListPage /> },
              { path: ':id', element: <UserProfilePage /> },
              { path: ':id/edit', element: <UserEditPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
```

### 2.3 面包屑自动生成

```typescript
// hooks/useBreadcrumbs.ts
import { useMatches } from 'react-router-dom';

interface Breadcrumb {
  title: string;
  path: string;
}

export function useBreadcrumbs(): Breadcrumb[] {
  const matches = useMatches();

  return matches
    .filter((match) => match.handle?.breadcrumb)
    .map((match) => ({
      title: match.handle.breadcrumb,
      path: match.pathname,
    }));
}

// 路由配置中定义 handle
{
  path: 'users/:id',
  element: <UserProfilePage />,
  handle: {
    breadcrumb: '用户详情',
  },
}
```

## 三、权限路由

### 3.1 路由守卫组件

```tsx
// components/RouteGuard.tsx
interface RouteGuardProps {
  children: React.ReactNode;
  auth?: boolean;        // 是否需要登录
  roles?: string[];      // 需要的角色
  permissions?: string[]; // 需要的权限
  fallback?: React.ReactNode;
}

function RouteGuard({
  children,
  auth = false,
  roles = [],
  permissions = [],
  fallback,
}: RouteGuardProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // 1. 检查登录状态
  if (auth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. 检查角色权限
  if (roles.length > 0 && !roles.includes(user?.role)) {
    return fallback || <Navigate to="/403" replace />;
  }

  // 3. 检查细粒度权限
  if (permissions.length > 0) {
    const hasPermission = permissions.every((p) =>
      user?.permissions.includes(p)
    );
    if (!hasPermission) {
      return fallback || <Navigate to="/403" replace />;
    }
  }

  return <>{children}</>;
}

// 使用示例
<RouteGuard auth roles={['admin']}>
  <AdminDashboard />
</RouteGuard>
```

### 3.2 基于配置的权限路由

```typescript
// routes/config.ts
export const routeConfig = [
  {
    path: '/app',
    component: AppLayout,
    auth: true,
    children: [
      {
        path: 'dashboard',
        component: DashboardPage,
        meta: { title: '仪表盘' },
      },
      {
        path: 'users',
        component: UserListPage,
        meta: { title: '用户管理', roles: ['admin', 'manager'] },
      },
      {
        path: 'settings',
        component: SettingsLayout,
        children: [
          {
            path: 'profile',
            component: ProfilePage,
            meta: { title: '个人设置' },
          },
          {
            path: 'security',
            component: SecurityPage,
            meta: { title: '安全设置', roles: ['admin'] },
          },
        ],
      },
    ],
  },
];

// 路由生成器 —— 自动注入守卫
function generateProtectedRoutes(config: RouteConfig[]): RouteObject[] {
  return config.map(({ path, component, meta, children }) => ({
    path,
    element: (
      <RouteGuard auth={meta?.auth} roles={meta?.roles}>
        <Suspense fallback={<Loading />}>
          {createElement(component)}
        </Suspense>
      </RouteGuard>
    ),
    children: children ? generateProtectedRoutes(children) : undefined,
  }));
}
```

### 3.3 动态路由生成

```typescript
// 根据后端返回的菜单/权限动态生成路由
function useDynamicRoutes(menus: MenuItem[]): RouteObject[] {
  return useMemo(() => {
    return menus.map((menu) => ({
      path: menu.path,
      element: (
        <RouteGuard auth roles={menu.roles}>
          <Suspense fallback={<Loading />}>
            {createElement(lazy(() => import(`@/pages/${menu.component}`)))}
          </Suspense>
        </RouteGuard>
      ),
      children: menu.children ? useDynamicRoutes(menu.children) : undefined,
    }));
  }, [menus]);
}

// App.tsx
function App() {
  const { menus } = useMenus();  // 从后端获取菜单配置
  const dynamicRoutes = useDynamicRoutes(menus);
  const router = createBrowserRouter([...staticRoutes, ...dynamicRoutes]);

  return <RouterProvider router={router} />;
}
```

## 四、微前端路由

### 4.1 微前端路由架构

```
主应用路由：
═══════════

URL: /app/users/123

┌──────────────────────────────────────────────┐
│  主应用                                       │
│  ┌────────────────────────────────────────┐  │
│  │  /app → 主应用布局                     │  │
│  │  ┌──────────────────────────────────┐  │  │
│  │  │  /app/users → 子应用 A           │  │  │
│  │  │  ┌────────────────────────────┐  │  │  │
│  │  │  │  /app/users/123 → 用户详情 │  │  │  │
│  │  │  └────────────────────────────┘  │  │  │
│  │  └──────────────────────────────────┘  │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘

主应用负责：一级路由、布局、鉴权
子应用负责：业务页面、内部路由
```

### 4.2 qiankun 路由配置

```typescript
// 主应用路由配置
import { registerMicroApps, start } from 'qiankun';

registerMicroApps([
  {
    name: 'user-app',
    entry: '//localhost:3001',
    container: '#micro-container',
    activeRule: '/app/users',
    props: {
      routerBase: '/app/users',  // 传递路由前缀
    },
  },
  {
    name: 'order-app',
    entry: '//localhost:3002',
    container: '#micro-container',
    activeRule: '/app/orders',
    props: {
      routerBase: '/app/orders',
    },
  },
]);

start({
  prefetch: 'all',  // 预加载子应用
});
```

### 4.3 子应用路由适配

```typescript
// 子应用路由配置
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// 接收主应用传递的路由前缀
function SubApp({ routerBase }: { routerBase: string }) {
  const router = createBrowserRouter(
    [
      { path: '/', element: <UserListPage /> },
      { path: '/:id', element: <UserProfilePage /> },
      { path: '/:id/edit', element: <UserEditPage /> },
    ],
    { basename: routerBase }  // 设置路由前缀
  );

  return <RouterProvider router={router} />;
}
```

### 4.4 Module Federation 路由共享

```typescript
// 主应用 webpack.config.ts
new ModuleFederationPlugin({
  name: 'host',
  remotes: {
    userApp: 'userApp@//localhost:3001/remoteEntry.js',
    orderApp: 'orderApp@//localhost:3002/remoteEntry.js',
  },
});

// 动态加载子应用路由
const UserAppRoutes = React.lazy(() => import('userApp/routes'));
const OrderAppRoutes = React.lazy(() => import('orderApp/routes'));

// 路由配置
const routes = [
  {
    path: '/app/users/*',
    element: (
      <Suspense fallback={<Loading />}>
        <UserAppRoutes />
      </Suspense>
    ),
  },
  {
    path: '/app/orders/*',
    element: (
      <Suspense fallback={<Loading />}>
        <OrderAppRoutes />
      </Suspense>
    ),
  },
];
```

## 五、路由性能优化

### 5.1 路由懒加载

```typescript
// 路由级别的代码分割
const DashboardPage = lazy(() => import('@/pages/Dashboard'));
const UserPage = lazy(() => import('@/pages/User'));
const SettingsPage = lazy(() => import('@/pages/Settings'));

// 带预加载的懒加载
function preloadRoute(importFn: () => Promise<any>) {
  const Component = lazy(importFn);
  Component.preload = importFn;
  return Component;
}

const DashboardPage = preloadRoute(() => import('@/pages/Dashboard'));

// 鼠标悬停时预加载
<Link
  to="/dashboard"
  onMouseEnter={() => DashboardPage.preload()}
>
  仪表盘
</Link>
```

### 5.2 路由缓存

```typescript
// 使用 React Keep Alive 保持路由状态
import { KeepAlive, useOutlet, useLocation } from 'react-router-dom';

function KeepAliveLayout() {
  const outlet = useOutlet();
  const location = useLocation();

  return (
    <KeepAlive
      include={['Dashboard', 'UserList']}  // 需要缓存的页面
      activeKey={location.pathname}
    >
      {outlet}
    </KeepAlive>
  );
}
```

### 5.3 路由过渡动画

```tsx
import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

function AnimatedRoutes() {
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.2 }}
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}
```

## 面试要点

### 常见面试问题

1. **嵌套路由的实现原理是什么？**
   - React Router 使用 Outlet 组件作为子路由渲染位置
   - 路由匹配时会渲染所有匹配的嵌套组件
   - 布局组件通过 Outlet 保持状态

2. **如何实现前端权限路由？**
   - 路由守卫组件：统一的权限检查逻辑
   - 动态路由：根据后端权限动态生成路由配置
   - 路由配置化：集中管理路由和权限

3. **微前端路由如何协调？**
   - 主应用负责一级路由和布局
   - 子应用负责业务页面和内部路由
   - 通过 basename 隔离路由命名空间

4. **路由性能优化有哪些手段？**
   - 路由懒加载：按需加载页面代码
   - 路由预加载：鼠标悬停时预加载
   - 路由缓存：KeepAlive 保持页面状态

### 关键要点

- **路由配置化**：集中管理路由、权限、布局
- **嵌套路由**：Outlet 组件、布局复用
- **权限路由**：路由守卫、动态路由生成
- **微前端路由**：basename 隔离、路由协调
- **性能优化**：懒加载、预加载、缓存
