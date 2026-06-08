import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: '前端面试知识库',
  tagline: '前端面试题 & AI 开发面试指南',
  favicon: 'img/favicon.ico',

  url: 'https://your-site.example.com',
  baseUrl: '/',

  onBrokenLinks: 'warn',

  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
        },
        blog: false,
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
          href: 'https://github.com',
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
            {label: '前端性能优化', to: '/performance'},
          ],
        },
        {
          title: '互动学习',
          items: [
            {label: '📝 随堂测验', to: '/quiz'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} 前端面试知识库`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'typescript'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
