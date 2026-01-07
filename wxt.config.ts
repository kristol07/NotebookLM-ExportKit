import { defineConfig } from 'wxt';

const PDFOBJECT_CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdfobject/2.1.1/pdfobject.min.js';
const PDFOBJECT_LOCAL_URL = '/pdfobject/pdfobject.min.js';

const replacePdfObjectCdn = () => ({
  name: 'replace-pdfobject-cdn',
  enforce: 'pre' as const,
  transform(code: string) {
    if (!code.includes(PDFOBJECT_CDN_URL)) {
      return null;
    }
    return code.split(PDFOBJECT_CDN_URL).join(PDFOBJECT_LOCAL_URL);
  },
});

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: {
    plugins: [replacePdfObjectCdn()],
  },
  manifest: {
    permissions: ['activeTab', 'scripting'],
    host_permissions: [
      'https://notebooklm.google.com/*',
      'https://*.usercontent.goog/*'
    ],
    name: 'NotebookLM ExportKit',
    description: 'Export NotebookLM quizzes, flashcards, mindmaps, notes, and tables to multiple formats (varies by type).',
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
