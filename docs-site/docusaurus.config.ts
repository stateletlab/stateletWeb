import type {PrismTheme} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

/**
 * Warm dark code theme, matching the code blocks on the main site
 * (#2a2521 ground, #ede6dc ink). Hues are warm-shifted so samples sit in the
 * same palette as the surrounding page instead of reading as a pasted-in
 * editor screenshot.
 */
const warmCodeTheme: PrismTheme = {
  plain: {color: '#ede6dc', backgroundColor: '#2a2521'},
  styles: [
    {
      types: ['comment', 'prolog', 'doctype', 'cdata'],
      style: {color: '#8a7f75', fontStyle: 'italic'},
    },
    {types: ['punctuation', 'operator'], style: {color: '#b3a89e'}},
    {types: ['keyword', 'tag', 'selector', 'important'], style: {color: '#e08b5f'}},
    {types: ['string', 'char', 'attr-value', 'inserted'], style: {color: '#a8b98a'}},
    {types: ['function', 'class-name', 'function-variable'], style: {color: '#e8c07d'}},
    {types: ['number', 'boolean', 'constant', 'symbol'], style: {color: '#d4a373'}},
    {types: ['attr-name', 'property', 'variable'], style: {color: '#dcc9b6'}},
    {types: ['builtin', 'namespace'], style: {color: '#c8a98c'}},
    {types: ['deleted'], style: {color: '#d47b6a'}},
    {types: ['url', 'entity'], style: {color: '#a8b98a'}},
  ],
};

const config: Config = {
  title: 'Statelet',
  tagline: 'Agent Runtime Data Layer for AI Agents',
  favicon: 'img/favicon.svg',

  future: {
    v4: true,
  },

  url: 'https://statelet.ai',
  baseUrl: '/docs/',

  organizationName: 'stateletlab',
  projectName: 'statelet',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/stateletlab/statelet-longmemeval/tree/main/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/og-image.png',
    colorMode: {
      defaultMode: 'light',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'Statelet',
      logo: {
        alt: 'Statelet',
        src: 'img/favicon.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://statelet.ai',
          label: 'Home',
          position: 'left',
        },
        {
          href: 'https://github.com/stateletlab/statelet-longmemeval',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: 'Documentation',
          items: [
            { label: 'Getting Started', to: '/getting-started/installation' },
            { label: 'Core Concepts', to: '/concepts/causal-graph' },
            { label: 'API Reference', to: '/api/kv-operations' },
          ],
        },
        {
          title: 'SDKs',
          items: [
            { label: 'Python', to: '/sdks/python' },
            { label: 'Node.js', to: '/sdks/nodejs' },
            { label: 'Go', to: '/sdks/go' },
            { label: 'Rust', to: '/sdks/rust' },
            { label: 'Java', to: '/sdks/java' },
            { label: 'C++', to: '/sdks/cpp' },
          ],
        },
        {
          title: 'More',
          items: [
            { label: 'GitHub', href: 'https://github.com/stateletlab/statelet-longmemeval' },
            { label: 'Home', href: 'https://statelet.ai' },
          ],
        },
      ],
      copyright: `Open-core — Statelet`,
    },
    prism: {
      theme: warmCodeTheme,
      darkTheme: warmCodeTheme,
      additionalLanguages: ['rust', 'java', 'toml', 'bash', 'yaml', 'protobuf', 'cypher'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
