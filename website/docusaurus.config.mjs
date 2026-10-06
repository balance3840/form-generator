// @ts-check
import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Form generator',
  tagline: 'Themeable, validated forms from a JSON schema',
  favicon: 'img/favicon.png',

  // GitHub Pages: https://balance3840.github.io/form-generator/
  url: 'https://balance3840.github.io',
  baseUrl: '/form-generator/',
  organizationName: 'balance3840',
  projectName: 'form-generator',
  trailingSlash: false,
  onBrokenLinks: 'warn',
  // .md files are plain CommonMark (the v1 pages were converted from HTML and are full of braces and angle brackets)
  markdown: { format: 'detect', hooks: { onBrokenMarkdownLinks: 'warn' } },

  i18n: { defaultLocale: 'en', locales: ['en'] },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/', // docs only: the site opens on the documentation
          sidebarPath: './sidebars.mjs',
          editUrl: 'https://github.com/balance3840/form-generator/tree/main/website/',
          // The version people land on. `current` is the docs folder, which is v2.
          lastVersion: 'current',
          versions: {
            current: { label: 'v2', path: '/', banner: 'none' },
            '1.0': { label: 'v1', path: 'v1', banner: 'unmaintained' },
          },
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      }),
    ],
  ],

  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      /** @type {import('@easyops-cn/docusaurus-search-local').PluginOptions} */
      ({ hashed: true, docsRouteBasePath: '/', indexBlog: false, explicitSearchResultPath: true }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'Form generator',
        items: [
          { type: 'docSidebar', sidebarId: 'docs', position: 'left', label: 'Documentation' },
          { type: 'docsVersionDropdown', position: 'right', dropdownActiveClassDisabled: true },
          { href: 'https://github.com/balance3840/form-generator', label: 'GitHub', position: 'right' },
        ],
      },
      footer: { style: 'dark', copyright: 'MIT License' },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['json', 'bash'],
      },
    }),
};

export default config;
