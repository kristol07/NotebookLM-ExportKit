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
    name: 'NotebookLM Export Pro',
    description: 'Export NotebookLM Notes, Quizzes, and Slides to PDF, Excel, and PowerPoint.',
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
