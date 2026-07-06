import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  emoji: string;
  description: ReactNode;
  link: string;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'JavaScript 基础',
    emoji: '📦',
    description: (
      <>
        类型系统、闭包与作用域、异步编程、原型链、ES6+ 特性。
        扎实的 JS 基础是前端开发的根基。
      </>
    ),
    link: '/javascript',
  },
  {
    title: 'TypeScript',
    emoji: '🔷',
    description: (
      <>
        泛型、工具类型、类型体操。TypeScript 已成为现代前端开发的标配。
      </>
    ),
    link: '/typescript',
  },
  {
    title: 'React',
    emoji: '⚛️',
    description: (
      <>
        Hooks 深入、Fiber 架构、状态管理、性能优化。React 生态的面试重点。
      </>
    ),
    link: '/react',
  },
  {
    title: 'Vue',
    emoji: '💚',
    description: (
      <>
        响应式系统、组合式 API、虚拟 DOM 与 Diff 算法。Vue 核心原理必知必会。
      </>
    ),
    link: '/vue',
  },
  {
    title: 'AI 应用开发',
    emoji: '🤖',
    description: (
      <>
        前端集成 LLM、RAG 实现、流式响应处理、AI SDK 使用、AI 编程工具。
        掌握 AI 开发是前端工程师的新竞争力。
      </>
    ),
    link: '/ai',
  },
  {
    title: 'CSS',
    emoji: '🎨',
    description: (
      <>
        盒模型、Flexbox 与 Grid 布局、定位与层叠上下文、响应式设计、动画过渡、现代 CSS 新特性。
        CSS 是前端面试中容易被忽视但高频考察的领域。
      </>
    ),
    link: '/css',
  },
  {
    title: '浏览器原理',
    emoji: '🌐',
    description: (
      <>
        渲染流程、事件循环、V8 引擎与垃圾回收、浏览器存储与跨域、DevTools 性能调试。
        深入浏览器底层是高级前端工程师的必备知识。
      </>
    ),
    link: '/browser',
  },
  {
    title: '计算机网络',
    emoji: '🌍',
    description: (
      <>
        TCP 连接、HTTP 协议演进、缓存策略、WebSocket、DNS 解析与 Web 安全。
        网络知识是前后端协作和性能优化的基础。
      </>
    ),
    link: '/network',
  },
  {
    title: 'Git',
    emoji: '🌿',
    description: (
      <>
        Git 工作流对比（Git Flow / GitHub Flow / Trunk-Based）、分支管理策略、
        代码规范（ESLint + Prettier + Husky）。团队协作的必备技能。
      </>
    ),
    link: '/engineering/git-workflow',
  },
  {
    title: '性能优化',
    emoji: '⚡',
    description: (
      <>
        加载优化、渲染优化、网络优化、框架级优化、性能监控与分析。
        性能优化能力是高级工程师的核心竞争力。
      </>
    ),
    link: '/performance',
  },
  {
    title: '工程化',
    emoji: '🔧',
    description: (
      <>
        构建工具（Webpack/Vite）、CI/CD 流程、Monorepo、包管理。工程化能力决定项目的可维护性。
      </>
    ),
    link: '/engineering',
  },
  {
    title: '数据结构与算法',
    emoji: '🧮',
    description: (
      <>
        数组、链表、树、图、排序算法、动态规划、Diff 算法、LRU 缓存。
        算法能力是大厂面试的敲门砖。
      </>
    ),
    link: '/algorithms',
  },
  {
    title: '计算机基础',
    emoji: '🖥️',
    description: (
      <>
        操作系统（进程/线程/内存）、编译原理（AST/Babel）、设计模式、数据表示与编码。
        计算机基础决定了你的技术天花板。
      </>
    ),
    link: '/computer-basics',
  },
  {
    title: '小程序开发实战',
    emoji: '📱',
    description: (
      <>
        投票助手项目实战：微信登录、云开发、组件化、数据管理、分享海报、部署上线。
        从零到一掌握小程序全栈开发。
      </>
    ),
    link: '/miniapp',
  },
  {
    title: '手写题',
    emoji: '✍️',
    description: (
      <>
        防抖节流、深拷贝、Promise、call/apply/bind、EventEmitter、LRU 缓存。
        手写题是前端面试中区分度最高的题型。
      </>
    ),
    link: '/quiz',
  },
];

function Feature({title, emoji, description, link}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <a href={link} className={styles.featureCard}>
        <div className={styles.featureEmoji}>{emoji}</div>
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </a>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="text--center margin-bottom--lg">
          <Heading as="h2">题库分类</Heading>
          <p>覆盖前端面试核心知识点，助你系统备战</p>
        </div>
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
