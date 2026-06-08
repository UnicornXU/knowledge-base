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
    title: '工程化',
    emoji: '🔧',
    description: (
      <>
        构建工具（Webpack/Vite）、CI/CD 流程。工程化能力决定项目的可维护性。
      </>
    ),
    link: '/engineering',
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
