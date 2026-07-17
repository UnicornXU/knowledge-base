import type {CSSProperties, ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';
import siteStats from '@site/src/data/site-stats.json';

import styles from './index.module.css';

/* ========== 统计数据 ========== */
const stats = [
  {label: '知识文档', value: String(siteStats.documents), suffix: '', icon: '📚', color: '#6366f1'},
  {label: '测验题目', value: String(siteStats.questions), suffix: '', icon: '📝', color: '#10b981'},
  {label: '内容分类', value: String(siteStats.categories), suffix: '', icon: '📂', color: '#8b5cf6'},
];

/* ========== 最新面试题 ========== */
const latestQuestions = [
  {
    title: '说说你对 JavaScript 原型链的理解？',
    tag: 'JavaScript',
    difficulty: '中等',
    to: '/javascript/prototype-chain',
  },
  {
    title: 'Vue3 中的响应式原理是如何实现的？',
    tag: 'Vue.js',
    difficulty: '困难',
    to: '/vue/reactivity-system',
  },
  {title: '谈谈浏览器的重排和重绘？', tag: '浏览器原理', difficulty: '中等', to: '/browser/rendering'},
  {title: 'React 中 useEffect 的执行时机？', tag: 'React', difficulty: '简单', to: '/react/hooks-deep'},
  {
    title: 'TypeScript 泛型的使用场景有哪些？',
    tag: 'TypeScript',
    difficulty: '中等',
    to: '/typescript/type-generics',
  },
];

/* ========== 推荐学习路线 ========== */
const learningPaths = [
  {title: '前端基础工程师', desc: '从 JavaScript、CSS 与浏览器基础开始', icon: '🌱', to: '/javascript'},
  {title: '中级前端工程师', desc: '深入框架、工程化与性能优化', icon: '🌿', to: '/engineering'},
  {title: '高级前端工程师', desc: '进阶架构、源码与跨端能力', icon: '🌳', to: '/architecture'},
];

/* ========== 热门文章 ========== */
const hotArticles = [
  {title: 'JavaScript 作用域与闭包详解', to: '/javascript/closure-scope', category: 'JavaScript'},
  {title: 'Vue3 响应式原理', to: '/vue/reactivity-system', category: 'Vue.js'},
  {title: '前端性能优化实战指南', to: '/performance', category: '性能优化'},
  {title: 'TypeScript 泛型最佳实践', to: '/typescript/type-generics', category: 'TypeScript'},
];

/* ========== Hero 区域 ========== */
function HeroSection () {
  const handleSearch = () => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: !navigator.userAgent.includes('Mac'),
        metaKey: navigator.userAgent.includes('Mac'),
        bubbles: true,
      }),
    );
  };

  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>系统学习，轻松拿下前端 Offer</h1>
          <p className={styles.heroSubtitle}>
            覆盖前端核心知识点，包含 {siteStats.questions} 道测验题与详细解析
          </p>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <span className={styles.searchInput}>搜索面试题、知识点或关键词...</span>
            <span className={styles.searchShortcut}>Ctrl K</span>
            <button
              className={styles.searchBtn}
              type="button"
              onClick={handleSearch}
              aria-label="打开站内搜索"
            >
              搜索
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========== 统计卡片 ========== */
function StatsSection () {
  return (
    <section className={styles.statsSection}>
      <div className={styles.statsGrid}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={styles.statCard}
            style={{'--stat-color': stat.color} as CSSProperties}
          >
            <div className={styles.statIcon}>{stat.icon}</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>
                {stat.value}
                <small>{stat.suffix}</small>
              </span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ========== 最新面试题 ========== */
function LatestQuestions () {
  const difficultyColor: Record<string, string> = {
    简单: '#10b981',
    中等: '#f59e0b',
    困难: '#ef4444',
  };

  return (
    <section className={styles.questionsSection}>
      <div className={styles.sectionHeader}>
        <Heading as="h2" className={styles.sectionTitle}>
          最新面试题
        </Heading>
        <div className={styles.tabBar}>
          <span className={clsx(styles.tab, styles.tabActive)}>全部</span>
          <span className={styles.tab}>JavaScript</span>
          <span className={styles.tab}>Vue.js</span>
          <span className={styles.tab}>React</span>
          <span className={styles.tab}>计算机基础</span>
        </div>
        <Link to="/intro" className={styles.viewAll}>
          查看全部 ›
        </Link>
      </div>
      <div className={styles.questionList}>
        {latestQuestions.map((q) => (
          <Link key={q.to} to={q.to} className={styles.questionItem}>
            <span className={styles.questionIcon}>📋</span>
            <div className={styles.questionContent}>
              <span className={styles.questionTitle}>{q.title}</span>
              <div className={styles.questionMeta}>
                <span className={styles.questionTag}>{q.tag}</span>
                <span className={styles.questionDifficulty} style={{color: difficultyColor[q.difficulty]}}>
                  {q.difficulty}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ========== 右侧信息面板 ========== */
function RightSidebar () {
  return (
    <aside className={styles.rightSidebar}>
      <div className={styles.sidebarCard}>
        <h3 className={styles.sidebarTitle}>内容概览</h3>
        <div className={styles.streakInfo}>
          <span className={styles.streakLabel}>持续维护的知识库</span>
          <span className={styles.streakValue}>{siteStats.documents} 篇</span>
          <span className={styles.streakNote}>覆盖 {siteStats.categories} 个前端与面试分类</span>
        </div>
      </div>

      <div className={styles.sidebarCard}>
        <div className={styles.sidebarHeader}>
          <h3 className={styles.sidebarTitle}>推荐学习路线</h3>
          <Link to="/intro" className={styles.viewAllSmall}>
            查看全部 ›
          </Link>
        </div>
        <div className={styles.pathList}>
          {learningPaths.map((path) => (
            <Link key={path.to} to={path.to} className={styles.pathItem}>
              <span className={styles.pathIcon}>{path.icon}</span>
              <span className={styles.pathInfo}>
                <span className={styles.pathTitle}>{path.title}</span>
                <span className={styles.pathDesc}>{path.desc}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className={styles.sidebarCard}>
        <div className={styles.sidebarHeader}>
          <h3 className={styles.sidebarTitle}>精选文章</h3>
          <Link to="/intro" className={styles.viewAllSmall}>
            查看全部 ›
          </Link>
        </div>
        <div className={styles.articleList}>
          {hotArticles.map((article) => (
            <Link key={article.to} to={article.to} className={styles.articleItem}>
              <span className={styles.articleTitle}>{article.title}</span>
              <span className={styles.articleMeta}>{article.category}</span>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}

/* ========== 主页 ========== */
export default function Home (): ReactNode {
  return (
    <Layout
      title="首页"
      description="前端面试题知识库，涵盖 JavaScript、TypeScript、React、Vue、AI 应用开发等"
    >
      <HeroSection />
      <StatsSection />
      <main className={styles.mainLayout}>
        <div className={styles.mainContent}>
          <HomepageFeatures />
          <LatestQuestions />
        </div>
        <RightSidebar />
      </main>
    </Layout>
  );
}
