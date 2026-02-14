import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Oikos 文档',
  description: '可插件化的 LaMAS 多智能体实验运行系统',
  lang: 'zh-CN',

  // Clean URLs (no .html suffix)
  cleanUrls: true,

  // Ignore dead links (we'll fix them later)
  ignoreDeadLinks: true,

  // Theme configuration
  themeConfig: {
    logo: '/logo.svg', // Optional: add later if needed

    nav: [
      { text: '首页', link: '/' },
      { text: '快速开始', link: '/01-getting-started/00-overview' },
      { text: '用户指南', link: '/02-user-guide/01-running-experiments' },
      { text: '系统架构', link: '/03-architecture/01-system-overview' },
      { text: 'API 参考', link: '/06-api-reference/00-api-overview' }
    ],

    sidebar: {
      '/01-getting-started/': [
        {
          text: '快速开始',
          items: [
            { text: '系统概述', link: '/01-getting-started/00-overview' },
            { text: '安装指南', link: '/01-getting-started/01-installation' },
            { text: '5分钟快速上手', link: '/01-getting-started/02-quick-start' },
            { text: '第一个完整实验', link: '/01-getting-started/03-first-experiment' },
            { text: '理解输出结果', link: '/01-getting-started/04-understanding-outputs' }
          ]
        }
      ],

      '/02-user-guide/': [
        {
          text: '用户指南',
          items: [
            { text: '运行实验详解', link: '/02-user-guide/01-running-experiments' },
            { text: '数据集准备指南', link: '/02-user-guide/02-dataset-preparation' },
            { text: '配置文件详解', link: '/02-user-guide/03-configuration-guide' },
            { text: '实验模式', link: '/02-user-guide/04-experiment-modes' },
            { text: '输出结果解读', link: '/02-user-guide/05-output-interpretation' },
            { text: '指标与数据分析', link: '/02-user-guide/06-metrics-and-analysis' },
            { text: '经济机制选择', link: '/02-user-guide/07-economic-mechanisms' },
            { text: '常见问题排查', link: '/02-user-guide/08-troubleshooting' },
            { text: '最佳实践', link: '/02-user-guide/09-best-practices' }
          ]
        }
      ],

      '/03-architecture/': [
        {
          text: '系统架构',
          items: [
            { text: '系统整体架构', link: '/03-architecture/01-system-overview' },
            { text: '设计理念', link: '/03-architecture/02-design-philosophy' },
            { text: '七阶段管道详解', link: '/03-architecture/03-seven-phase-pipeline' },
            { text: '插件系统架构', link: '/03-architecture/04-plugin-system' },
            { text: '数据流动路径', link: '/03-architecture/05-data-flow' },
            { text: '抽象层与实现层', link: '/03-architecture/06-abstraction-implementation' },
            { text: '状态管理机制', link: '/03-architecture/07-state-management' },
            { text: '数据采集实现', link: '/03-architecture/08-telemetry-collection' }
          ]
        }
      ],

      '/04-phase-modules/': [
        {
          text: '阶段模块详解',
          items: [
            { text: '模块系统总览', link: '/04-phase-modules/00-module-overview' },
            { text: 'Phase 1: 沙盒初始化', link: '/04-phase-modules/phase1-initialization' },
            { text: 'Phase 2: 任务创建', link: '/04-phase-modules/phase2-creation' },
            { text: 'Phase 3: 任务分配', link: '/04-phase-modules/phase3-allocation' },
            { text: 'Phase 4: 任务执行', link: '/04-phase-modules/phase4-execution' },
            { text: 'Phase 5: 清结算', link: '/04-phase-modules/phase5-settlement' },
            { text: 'Phase 6: 反馈与排名', link: '/04-phase-modules/phase6-feedback' },
            { text: 'Phase 7: 资金池管理', link: '/04-phase-modules/phase7-pool-management' }
          ]
        }
      ],

      '/05-developer-guide/': [
        {
          text: '开发者指南',
          items: [
            { text: '开发指南概览', link: '/05-developer-guide/00-overview' },
            { text: '开发环境搭建', link: '/05-developer-guide/01-development-setup' },
            { text: '代码组织结构', link: '/05-developer-guide/02-code-structure' },
            { text: '创建自定义插件', link: '/05-developer-guide/03-creating-plugins' },
            { text: '调试技巧', link: '/05-developer-guide/04-debugging' },
            { text: '测试指南', link: '/05-developer-guide/05-testing' },
            { text: '贡献指南', link: '/05-developer-guide/06-contributing' }
          ]
        }
      ],

      '/06-api-reference/': [
        {
          text: 'API 参考文档',
          items: [
            { text: 'API 文档总览', link: '/06-api-reference/00-api-overview' },
            { text: '核心 API', link: '/06-api-reference/core-api' },
            { text: 'Phase 1-4 接口', link: '/06-api-reference/phase1-4-api' },
            { text: 'Phase 5 接口', link: '/06-api-reference/phase5-api' },
            { text: 'Phase 6 接口', link: '/06-api-reference/phase6-api' },
            { text: 'Phase 7 接口', link: '/06-api-reference/phase7-api' },
            { text: '公共类型定义', link: '/06-api-reference/common-types' },
            { text: '配置文件 Schema', link: '/06-api-reference/configuration-schema' }
          ]
        }
      ],

      '/07-demos-and-tutorials/': [
        {
          text: '演示与教程',
          items: [
            { text: '官方 Demo 运行指南', link: '/07-demos-and-tutorials/01-official-demo' }
          ]
        }
      ]
    },

    // Social links
    socialLinks: [
      { icon: 'github', link: 'https://github.com/zicheng1744/Oikos-docs' }
    ],

    // Footer
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Oikos Team'
    },

    // Search (built-in local search)
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档'
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭'
            }
          }
        }
      }
    },

    // Outline
    outline: {
      level: [2, 3],
      label: '页面导航'
    },

    // Doc footer text
    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    // Last updated
    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'short'
      }
    }
  },

  // Head tags
  head: [
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }]
  ]
})
