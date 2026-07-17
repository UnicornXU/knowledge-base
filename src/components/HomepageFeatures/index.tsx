import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  emoji: string;
  description: string;
  link: string;
  progress: number;
  gradient: string;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'JavaScript 闭包',
    emoji: '📦',
    description: '闭包是 JavaScript 的核心概念之一，理解闭包的工作原理…',
    link: '/javascript/closure-scope',
    progress: 87,
    gradient: 'linear-gradient(135deg, #f59e0b, #f97316)',
  },
  {
    title: 'Vue3 响应式原理',
    emoji: '💚',
    description: 'Vue3 使用 Proxy 实现响应式，相比 Vue2 的 defineProperty…',
    link: '/vue/reactivity-system',
    progress: 92,
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
  },
  {
    title: '浏览器渲染机制',
    emoji: '🌐',
    description: '浏览器如何将 HTML、CSS 和 JavaScript 转换成用户看到的…',
    link: '/browser/rendering',
    progress: 78,
    gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
  },
  {
    title: 'HTTP 缓存机制',
    emoji: '🌍',
    description: '理解 HTTP 缓存机制对于优化网页性能至关重要，包括强缓存…',
    link: '/network/cache',
    progress: 83,
    gradient: 'linear-gradient(135deg, #14b8a6, #0ea5e9)',
  },
  {
    title: 'React Hooks',
    emoji: '⚛️',
    description: 'Hooks 是 React 16.8 引入的新特性，让函数组件也能使用状…',
    link: '/react/hooks-deep',
    progress: 89,
    gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
  },
  {
    title: 'TypeScript 泛型',
    emoji: '🔷',
    description: '泛型是 TypeScript 中非常强大的特性，提供了类型安全的…',
    link: '/typescript/type-generics',
    progress: 76,
    gradient: 'linear-gradient(135deg, #6366f1, #3b82f6)',
  },
  {
    title: '前端工程化',
    emoji: '🔧',
    description: '现代前端工程化包括构建工具、代码规范、自动化部署等…',
    link: '/engineering',
    progress: 81,
    gradient: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
  },
  {
    title: 'Web 安全',
    emoji: '🔒',
    description: '了解常见的 Web 安全漏洞及防范措施，如 XSS、CSRF、SQL…',
    link: '/network/web-security',
    progress: 73,
    gradient: 'linear-gradient(135deg, #ef4444, #ec4899)',
  },
];

function Feature ({title, emoji, description, link, progress, gradient}: FeatureItem) {
  const progressColor = progress >= 85 ? '#10b981' : progress >= 70 ? '#6366f1' : '#f59e0b';

  return (
    <Link to={link} className={styles.featureCard}>
      <div className={styles.featureHeader}>
        <div
          className={styles.featureIcon}
          style={{background: gradient}}
        >
          {emoji}
        </div>
        <span className={styles.featureProgress}>{progress}%</span>
      </div>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDesc}>{description}</p>
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${progressColor}, ${progressColor}cc)`,
            boxShadow: `0 0 8px ${progressColor}80`,
          }}
        />
      </div>
    </Link>
  );
}

export default function HomepageFeatures (): ReactNode {
  return (
    <section className={styles.features}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>热门知识点</h2>
        <Link to="/intro" className={styles.viewAll}>
          查看全部 ›
        </Link>
      </div>
      <div className={styles.featureGrid}>
        {FeatureList.map((props) => (
          <Feature key={props.link} {...props} />
        ))}
      </div>
    </section>
  );
}
