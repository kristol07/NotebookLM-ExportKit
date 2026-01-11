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
  vite: () => ({
    plugins: [replacePdfObjectCdn()],
  }),
  manifest: {
    key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA6M+BovxqB3FYHfdK3Icy4aMGog3cJba3luDcJoO9LyRfNDuG4cbBr68meSVTuzK0iLdwUL1krA84Cj+S+9zp5cMQxF6K3CW4VmbD0aq3X7r+7Q0VdRIVhyRAn6o2z942q5fkuQY4ED7hTHw+nMynjqii1wGVNNyBjgEy4qZyCi4tX6+pqPo1swDhFG0nPDG37iO/tVILe1iWybuTP9Tac2+YhKcyDXCC81tUsiaZ0EiC/AFRbkXmYMMzSylfH107bfsLN8kxbaGLsHPnN4A0GVo3RJXrmdSX4UoY9Z11OplmReBfcXUhHDYkyZKljKVTgujni5khyZE7KCWarcvWLQIDAQAB',
    permissions: ['activeTab', 'scripting', 'identity'],
    oauth2: {
      client_id: process.env.VITE_GOOGLE_DRIVE_CLIENT_ID ?? 'required for Google Drive integration',
      scopes: [
        'https://www.googleapis.com/auth/drive.file'
      ]
    },
    host_permissions: [
      'https://notebooklm.google.com/*',
      'https://*.usercontent.goog/*',
      'https://www.googleapis.com/*'
    ],
    name: 'NotebookLM ExportKit - export NotebookLM content to any format',
    description: 'Export NotebookLM chats, quizzes, flashcards, mindmaps, notes, and tables to multiple formats, with Google Drive delivery.',
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
