import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <div className={styles.badge}>
          <span className={styles.badgeIcon}>🚀</span>
          <span>2024 最新版</span>
        </div>
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <p className={styles.description}>
          涵盖 JavaScript、TypeScript、React、Vue、AI 应用开发等核心知识点，
          助你系统备战前端面试，斩获心仪 Offer！
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/intro">
            🎯 开始刷题
          </Link>
          <Link
            className="button button--outline button--lg"
            to="/ai">
            🤖 AI 专题
          </Link>
        </div>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>50+</span>
            <span className={styles.statLabel}>精选面试题</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>6</span>
            <span className={styles.statLabel}>核心分类</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>AI</span>
            <span className={styles.statLabel}>前沿专题</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>📝</span>
            <span className={styles.statLabel}>源码解析</span>
          </div>
        </div>
        <div className={styles.features}>
          <div className={styles.featureTag}>
            <span>✅</span> 真实面试题
          </div>
          <div className={styles.featureTag}>
            <span>✅</span> 详细解答
          </div>
          <div className={styles.featureTag}>
            <span>✅</span> 代码示例
          </div>
          <div className={styles.featureTag}>
            <span>✅</span> 难度分级
          </div>
        </div>
      </div>
    </header>
  );
}

function TechStack() {
  const technologies = [
    { name: 'JavaScript', icon: '🟨', color: '#f7df1e' },
    { name: 'TypeScript', icon: '🟦', color: '#3178c6' },
    { name: 'React', icon: '⚛️', color: '#61dafb' },
    { name: 'Vue', icon: '💚', color: '#42b883' },
    { name: 'Node.js', icon: '🟩', color: '#339933' },
    { name: 'AI/LLM', icon: '🤖', color: '#ff6b6b' },
  ];

  return (
    <section className={styles.techStack}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          技术栈覆盖
        </Heading>
        <p className={styles.sectionSubtitle}>
          涵盖前端开发全栈技术，从基础到进阶
        </p>
        <div className={styles.techGrid}>
          {technologies.map((tech, idx) => (
            <div key={idx} className={styles.techItem} style={{'--tech-color': tech.color} as any}>
              <span className={styles.techIcon}>{tech.icon}</span>
              <span className={styles.techName}>{tech.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className={styles.cta}>
      <div className="container">
        <div className={styles.ctaContent}>
          <Heading as="h2">准备好了吗？</Heading>
          <p>开始你的前端面试准备之旅，每天进步一点点</p>
          <div className={styles.ctaButtons}>
            <Link
              className="button button--secondary button--lg"
              to="/intro">
              🚀 立即开始
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="首页"
      description="前端面试题知识库，涵盖 JavaScript、TypeScript、React、Vue、AI 应用开发等">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <TechStack />
        <CTASection />
      </main>
    </Layout>
  );
}
