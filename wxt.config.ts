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
  },
});
