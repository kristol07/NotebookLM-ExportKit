/*
 * Copyright (C) 2026 kristol07
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
export default defineBackground(() => {
  const BG_LOG = '[SLIDE_BG_FETCH]';
  const sidePanel = (browser as any).sidePanel;

  if (sidePanel?.setPanelBehavior) {
    sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  }

  if (browser.action?.onClicked && sidePanel?.open) {
    browser.action.onClicked.addListener(async (tab) => {
      try {
        await sidePanel.open({ tabId: tab.id });
      } catch {
        // Ignore failures if side panels are unavailable.
      }
    });
  }

  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== 'fetch-image-data-url' || typeof message?.url !== 'string') {
      return undefined;
    }

    const run = async () => {
      try {
        const url = message.url as string;
        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          redirect: 'follow',
          cache: 'no-store',
        });

        const finalUrl = response.url || url;
        if (!response.ok) {
          console.warn(`${BG_LOG} http_error`, { url, finalUrl, status: response.status });
          sendResponse({ success: false, error: `http_${response.status}`, finalUrl });
          return;
        }
        if (finalUrl.includes('accounts.google.com/ServiceLogin')) {
          console.warn(`${BG_LOG} auth_redirect`, { url, finalUrl });
          sendResponse({ success: false, error: 'auth_redirect', finalUrl });
          return;
        }

        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = String(reader.result || '');
          sendResponse({ success: true, dataUrl, mimeType: blob.type, finalUrl, bytes: blob.size });
        };
        reader.onerror = () => {
          console.warn(`${BG_LOG} file_reader_error`, { url, finalUrl });
          sendResponse({ success: false, error: 'file_reader_error', finalUrl });
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.warn(`${BG_LOG} exception`, { error });
        sendResponse({ success: false, error: 'fetch_failed' });
      }
    };

    run();
    return true;
  });
});

