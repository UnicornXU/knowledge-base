import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: '前端面试知识库',
  tagline: '前端面试题 & AI 开发面试指南',
  favicon: 'img/favicon.ico',

  url: 'https://frontend-interview.netlify.app',
  baseUrl: '/',

  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',

  headTags: [
    {
      tagName: 'meta',
      attributes: {
        name: 'description',
        content:
          '前端面试知识库 — 涵盖 JavaScript、TypeScript、React、Vue、AI 应用开发等核心知识点，255 道精选测验题，助你斩获心仪 Offer！',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        property: 'og:title',
        content: '前端面试知识库',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        property: 'og:description',
        content: '前端面试题与 AI 开发面试指南，238 篇文档、255 道测验题和在线练习系统',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        property: 'og:type',
        content: 'website',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
    },
  ],

  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  plugins: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        language: ['zh', 'en'],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
        indexDocs: true,
        indexBlog: false,
        indexPages: true,
      },
    ],
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
        },
        blog: false,
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: '前端面试知识库',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'interviewSidebar',
          position: 'left',
          label: '面试题库',
        },
        {
          to: '/quiz',
          label: '📝 随堂测验',
          position: 'left',
        },
        {
          to: '/about',
          label: '关于',
          position: 'left',
        },
        {
          href: 'https://github.com/frontend-interview/knowledge-base',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '题库分类',
          items: [
            {label: 'JavaScript', to: '/javascript'},
            {label: 'TypeScript', to: '/typescript'},
            {label: 'React', to: '/react'},
            {label: 'Vue', to: '/vue'},
          ],
        },
        {
          title: '进阶方向',
          items: [
            {label: 'AI 应用开发', to: '/ai'},
            {label: '工程化', to: '/engineering'},
            {label: '数据结构与算法', to: '/algorithms'},
            {label: '计算机基础', to: '/computer-basics'},
            {label: '前端架构设计', to: '/architecture'},
            {label: '微前端架构', to: '/micro-frontend'},
          ],
        },
        {
          title: '底层原理',
          items: [
            {label: '浏览器原理', to: '/browser'},
            {label: '计算机网络', to: '/network'},
            {label: '前端性能优化', to: '/performance'},
            {label: '前端监控', to: '/monitoring'},
            {label: 'Web 安全', to: '/network/xss-attacks'},
          ],
        },
        {
          title: '扩展方向',
          items: [
            {label: 'Node.js / SSR', to: '/nodejs'},
            {label: '跨端开发', to: '/cross-platform'},
            {label: 'WebAssembly', to: '/wasm'},
            {label: '低代码平台', to: '/lowcode'},
            {label: '前端可视化', to: '/visualization'},
            {label: '无障碍访问', to: '/accessibility'},
            {label: '国际化 i18n', to: '/i18n'},
            {label: 'SEO 优化', to: '/seo'},
            {label: 'Serverless', to: '/serverless'},
          ],
        },
        {
          title: '互动学习',
          items: [
            {label: '📝 随堂测验', to: '/quiz'},
            {label: '关于本库', to: '/about'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} 前端面试知识库`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'typescript', 'css', 'markup', 'jsx', 'tsx'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
