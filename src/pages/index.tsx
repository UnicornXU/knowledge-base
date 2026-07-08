import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

/* ========== 统计数据 ========== */
const stats = [
  {label: '知识点', value: '238', suffix: '+', icon: '📚', color: '#6366f1'},
  {label: '面试题', value: '3000', suffix: '+', icon: '📝', color: '#10b981'},
  {label: '学习时长', value: '128', suffix: 'h', icon: '⏱️', color: '#f59e0b'},
  {label: '文档分类', value: '40', suffix: '+', icon: '📂', color: '#8b5cf6'},
];

/* ========== 最新面试题 ========== */
const latestQuestions = [
  {title: '说说你对 JavaScript 原型链的理解？', tag: 'JavaScript', difficulty: '中等', answers: '1.2k', date: '2026-07-07'},
  {title: 'Vue3 中的响应式原理是如何实现的？', tag: 'Vue.js', difficulty: '困难', answers: '856', date: '2026-07-06'},
  {title: '谈谈浏览器的重排和重绘？', tag: '浏览器原理', difficulty: '中等', answers: '2.1k', date: '2026-07-05'},
  {title: 'React 中 useEffect 的执行时机？', tag: 'React', difficulty: '简单', answers: '643', date: '2026-07-04'},
  {title: 'TypeScript 泛型的使用场景有哪些？', tag: 'TypeScript', difficulty: '中等', answers: '978', date: '2026-07-03'},
];

/* ========== 推荐学习路线 ========== */
const learningPaths = [
  {title: '前端基础工程师', desc: '适合初学者，共 120 个知识点', progress: 32, icon: '🌱'},
  {title: '中级前端工程师', desc: '适合有 1-3 年经验，共 180 个知识点', progress: 45, icon: '🌿'},
  {title: '高级前端工程师', desc: '适合有 3-5 年经验，共 200 个知识点', progress: 28, icon: '🌳'},
];

/* ========== 热门文章 ========== */
const hotArticles = [
  {title: '2026 前端面试趋势分析', reads: '2.3k', date: '2026-07-01'},
  {title: 'JavaScript 作用域详解', reads: '1.8k', date: '2026-06-28'},
  {title: 'Vue3 新特性全面解析', reads: '1.5k', date: '2026-06-25'},
  {title: '前端性能优化实战指南', reads: '1.2k', date: '2026-06-20'},
  {title: 'TypeScript 最佳实践', reads: '956', date: '2026-06-15'},
];

/* ========== Hero 区域 ========== */
function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>系统学习，轻松拿下前端 Offer</h1>
          <p className={styles.heroSubtitle}>
            覆盖前端核心知识点，包含 3000+ 面试题与详细解析
          </p>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="搜索面试题、知识点或关键词..."
              className={styles.searchInput}
            />
            <button className={styles.searchBtn}>搜索</button>
          </div>
        </div>
        <div className={styles.heroIllustration}>
          <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* 背景圆形 */}
            <circle cx="200" cy="150" r="120" fill="url(#heroGrad)" opacity="0.1"/>
            {/* 代码窗口 */}
            <rect x="80" y="60" width="240" height="160" rx="12" fill="white" stroke="#e2e8f0" strokeWidth="2"/>
            <rect x="80" y="60" width="240" height="32" rx="12" fill="#f1f5f9"/>
            <rect x="80" y="80" width="240" height="12" fill="#f1f5f9"/>
            <circle cx="96" cy="76" r="5" fill="#ef4444"/>
            <circle cx="112" cy="76" r="5" fill="#f59e0b"/>
            <circle cx="128" cy="76" r="5" fill="#10b981"/>
            {/* 代码行 */}
            <rect x="100" y="108" width="80" height="8" rx="2" fill="#6366f1" opacity="0.7"/>
            <rect x="100" y="124" width="120" height="8" rx="2" fill="#10b981" opacity="0.7"/>
            <rect x="100" y="140" width="60" height="8" rx="2" fill="#f59e0b" opacity="0.7"/>
            <rect x="100" y="156" width="100" height="8" rx="2" fill="#8b5cf6" opacity="0.7"/>
            <rect x="100" y="172" width="140" height="8" rx="2" fill="#6366f1" opacity="0.5"/>
            {/* 装饰元素 */}
            <circle cx="320" cy="80" r="20" fill="#6366f1" opacity="0.15"/>
            <circle cx="80" cy="220" r="15" fill="#10b981" opacity="0.15"/>
            <rect x="300" y="180" width="40" height="40" rx="8" fill="#f59e0b" opacity="0.15" transform="rotate(15 320 200)"/>
            <defs>
              <linearGradient id="heroGrad" x1="80" y1="30" x2="320" y2="270">
                <stop offset="0%" stopColor="#6366f1"/>
                <stop offset="100%" stopColor="#8b5cf6"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </section>
  );
}

/* ========== 统计卡片 ========== */
function StatsSection() {
  return (
    <section className={styles.statsSection}>
      <div className={styles.statsGrid}>
        {stats.map((stat, idx) => (
          <div key={idx} className={styles.statCard} style={{'--stat-color': stat.color} as any}>
            <div className={styles.statIcon}>{stat.icon}</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>
                {stat.value}<small>{stat.suffix}</small>
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
function LatestQuestions() {
  const difficultyColor: Record<string, string> = {
    '简单': '#10b981',
    '中等': '#f59e0b',
    '困难': '#ef4444',
  };

  return (
    <section className={styles.questionsSection}>
      <div className={styles.sectionHeader}>
        <Heading as="h2" className={styles.sectionTitle}>最新面试题</Heading>
        <div className={styles.tabBar}>
          <span className={clsx(styles.tab, styles.tabActive)}>全部</span>
          <span className={styles.tab}>JavaScript</span>
          <span className={styles.tab}>Vue.js</span>
          <span className={styles.tab}>React</span>
          <span className={styles.tab}>计算机基础</span>
        </div>
        <Link to="/intro" className={styles.viewAll}>查看全部 ›</Link>
      </div>
      <div className={styles.questionList}>
        {latestQuestions.map((q, idx) => (
          <div key={idx} className={styles.questionItem}>
            <span className={styles.questionIcon}>📋</span>
            <div className={styles.questionContent}>
              <span className={styles.questionTitle}>{q.title}</span>
              <div className={styles.questionMeta}>
                <span className={styles.questionTag}>{q.tag}</span>
                <span className={styles.questionDifficulty} style={{color: difficultyColor[q.difficulty]}}>
                  {q.difficulty}
                </span>
                <span className={styles.questionAnswers}>💬 {q.answers} 人回答</span>
              </div>
            </div>
            <span className={styles.questionDate}>{q.date}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ========== 右侧信息面板 ========== */
function RightSidebar() {
  return (
    <aside className={styles.rightSidebar}>
      {/* 学习进度 */}
      <div className={styles.sidebarCard}>
        <h3 className={styles.sidebarTitle}>学习进度</h3>
        <div className={styles.progressInfo}>
          <div className={styles.progressHeader}>
            <span>本周学习目标</span>
            <span className={styles.progressGoal}>12 / 20 小时</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{width: '60%'}}/>
          </div>
          <span className={styles.progressPercent}>60%</span>
        </div>
        <div className={styles.streakInfo}>
          <span className={styles.streakLabel}>连续学习</span>
          <span className={styles.streakValue}>7 天</span>
          <span className={styles.streakNote}>最长连续学习 15 天</span>
        </div>
      </div>

      {/* 推荐学习路线 */}
      <div className={styles.sidebarCard}>
        <div className={styles.sidebarHeader}>
          <h3 className={styles.sidebarTitle}>推荐学习路线</h3>
          <Link to="/intro" className={styles.viewAllSmall}>查看全部 ›</Link>
        </div>
        <div className={styles.pathList}>
          {learningPaths.map((path, idx) => (
            <div key={idx} className={styles.pathItem}>
              <span className={styles.pathIcon}>{path.icon}</span>
              <div className={styles.pathInfo}>
                <span className={styles.pathTitle}>{path.title}</span>
                <span className={styles.pathDesc}>{path.desc}</span>
                <div className={styles.pathProgress}>
                  <div className={styles.pathProgressBar}>
                    <div className={styles.pathProgressFill} style={{width: `${path.progress}%`}}/>
                  </div>
                  <span className={styles.pathPercent}>{path.progress}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 热门文章 */}
      <div className={styles.sidebarCard}>
        <div className={styles.sidebarHeader}>
          <h3 className={styles.sidebarTitle}>热门文章</h3>
          <Link to="/intro" className={styles.viewAllSmall}>查看全部 ›</Link>
        </div>
        <div className={styles.articleList}>
          {hotArticles.map((article, idx) => (
            <div key={idx} className={styles.articleItem}>
              <span className={styles.articleTitle}>{article.title}</span>
              <div className={styles.articleMeta}>
                <span>阅读 {article.reads}</span>
                <span>·</span>
                <span>{article.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

/* ========== 主页 ========== */
export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="首页"
      description="前端面试题知识库，涵盖 JavaScript、TypeScript、React、Vue、AI 应用开发等">
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
