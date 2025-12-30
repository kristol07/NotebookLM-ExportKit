import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    permissions: ['activeTab', 'scripting'],
    host_permissions: [
      'https://notebooklm.google.com/*',
      'https://*.usercontent.goog/*'
    ],
    name: 'NotebookLM ExportKit',
    description: 'Export NotebookLM quizzes, flashcards, and mindmaps to CSV, JSON, HTML, Anki, OPML, SVG, and Markdown, with more content types and formats coming.',
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      96: 'icon/96.png',
      128: 'icon/128.png',
    },
    action: {
      default_icon: {
        16: 'icon/16.png',
        32: 'icon/32.png',
        48: 'icon/48.png',
        96: 'icon/96.png',
        128: 'icon/128.png',
      },
    },
  },
});
