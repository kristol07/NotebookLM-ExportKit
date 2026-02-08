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
import { jsPDF } from 'jspdf';
import { browser } from 'wxt/browser';
import { ExportFormat, ExportResult, InfographicItem } from './export-core';

const EXPORT_LOG = '[INFOGRAPHIC_EXPORT]';

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const dataUrlToBlob = (dataUrl: string) => {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
        throw new Error('Invalid data URL');
    }
    const mimeType = match[1];
    const base64 = match[2];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
};

const getMimeFromDataUrl = (dataUrl: string) => {
    const match = dataUrl.match(/^data:([^;]+);base64,/);
    return match?.[1]?.toLowerCase() || 'application/octet-stream';
};

const convertDataUrlToPng = (dataUrl: string): Promise<string> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = image.naturalWidth;
                canvas.height = image.naturalHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context unavailable.'));
                    return;
                }
                ctx.drawImage(image, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            } catch (error) {
                reject(error);
            }
        };
        image.onerror = () => reject(new Error('Failed to decode data URL image.'));
        image.src = dataUrl;
    });

const fetchImageDataUrlViaBackground = async (url: string): Promise<string | null> => {
    try {
        const response = await browser.runtime.sendMessage({ type: 'fetch-image-data-url', url });
        if (response?.success && typeof response?.dataUrl === 'string') {
            return response.dataUrl;
        }
        console.warn(`${EXPORT_LOG} bg_fetch_failed`, {
            url,
            error: response?.error,
            finalUrl: response?.finalUrl
        });
        return null;
    } catch (error) {
        console.warn(`${EXPORT_LOG} bg_fetch_exception`, { url, error });
        return null;
    }
};

const resolveInfographicImage = async (item: InfographicItem) => {
    const sourceDataUrl = item.imageDataUrl?.startsWith('data:')
        ? item.imageDataUrl
        : await fetchImageDataUrlViaBackground(item.imageUrl);

    if (!sourceDataUrl?.startsWith('data:')) {
        throw new Error('Image data is unavailable.');
    }

    const mime = getMimeFromDataUrl(sourceDataUrl);
    const pngDataUrl = mime.includes('png') ? sourceDataUrl : await convertDataUrlToPng(sourceDataUrl);
    return {
        dataUrl: pngDataUrl,
        blob: dataUrlToBlob(pngDataUrl)
    };
};

const getImageDimensions = (dataUrl: string): Promise<{ width: number; height: number }> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
        image.onerror = () => reject(new Error('Failed to read image dimensions.'));
        image.src = dataUrl;
    });

const fitToBox = (
    width: number,
    height: number,
    boxWidth: number,
    boxHeight: number
) => {
    const scale = Math.min(boxWidth / width, boxHeight / height);
    const targetWidth = width * scale;
    const targetHeight = height * scale;
    return {
        width: targetWidth,
        height: targetHeight,
        x: (boxWidth - targetWidth) / 2,
        y: (boxHeight - targetHeight) / 2
    };
};

const buildInfographicHtml = (items: InfographicItem[], title: string) => {
    const figures = items.map((item, index) => {
        const alt = item.altText?.trim() || `Infographic ${index + 1}`;
        const description = item.description?.trim() || '';
        const src = item.imageDataUrl?.startsWith('data:') ? item.imageDataUrl : item.imageUrl;
        return `<figure class="infographic">
  <img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" />
  <figcaption>
    <strong>Infographic ${index + 1}</strong>
    ${description ? `<details><summary>description</summary><p>${escapeHtml(description)}</p></details>` : ''}
  </figcaption>
</figure>`;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f5f7fc;
      --card: #ffffff;
      --text: #1a2338;
      --muted: #55617a;
      --border: #dbe3f3;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", Arial, sans-serif;
      background: radial-gradient(circle at top right, #e8eefb 0%, var(--bg) 45%, #edf2fb 100%);
      color: var(--text);
      padding: 24px;
    }
    .wrap { max-width: 1080px; margin: 0 auto; }
    h1 { margin: 0 0 20px; font-size: 28px; }
    .infographic {
      margin: 0;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(17, 33, 78, 0.07);
    }
    .infographic img {
      width: 100%;
      display: block;
      background: #e9edf8;
    }
    .infographic figcaption {
      padding: 14px 16px 16px;
      color: var(--muted);
      font-size: 14px;
      line-height: 1.5;
    }
    .infographic details { margin-top: 8px; }
    .infographic summary { cursor: pointer; color: var(--text); font-weight: 600; }
    .infographic p { margin: 8px 0 0; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>${escapeHtml(title)}</h1>
    ${figures}
  </div>
</body>
</html>`;
};

const exportInfographicPdf = async (items: InfographicItem[]) => {
    const firstImage = await resolveInfographicImage(items[0]);
    const size = await getImageDimensions(firstImage.dataUrl);
    const isLandscape = size.width >= size.height;
    const pageWidth = isLandscape ? 1280 : 960;
    const pageHeight = isLandscape ? 960 : 1280;

    const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'pt',
        format: [pageWidth, pageHeight]
    });

    const fit = fitToBox(size.width, size.height, pageWidth, pageHeight);
    pdf.addImage(firstImage.dataUrl, 'PNG', fit.x, fit.y, fit.width, fit.height);
    return pdf.output('blob');
};

const exportInfographicPng = async (items: InfographicItem[]) => {
    const image = await resolveInfographicImage(items[0]);
    return image.blob;
};

export const exportInfographic = async (
    items: InfographicItem[],
    format: ExportFormat,
    tabTitle: string,
    timestamp: string
): Promise<ExportResult> => {
    if (items.length === 0) {
        return { success: false, error: 'No infographic content found to export.' };
    }

    if (format === 'HTML') {
        const html = buildInfographicHtml(items, tabTitle || 'infographic');
        const filename = `notebooklm_infographic_${tabTitle}_${timestamp}.html`;
        const blob = new Blob([html], { type: 'text/html' });
        return { success: true, count: items.length, filename, mimeType: blob.type, blob };
    }

    if (format === 'PDF') {
        try {
            const blob = await exportInfographicPdf(items);
            const filename = `notebooklm_infographic_${tabTitle}_${timestamp}.pdf`;
            return { success: true, count: items.length, filename, mimeType: 'application/pdf', blob };
        } catch (error) {
            console.error(error);
            return { success: false, error: 'Failed to build infographic PDF export.' };
        }
    }

    if (format === 'PNG') {
        try {
            const blob = await exportInfographicPng(items);
            const filename = `notebooklm_infographic_${tabTitle}_${timestamp}.png`;
            return { success: true, count: items.length, filename, mimeType: 'image/png', blob };
        } catch (error) {
            console.error(error);
            return { success: false, error: 'Failed to build infographic PNG export.' };
        }
    }

    return { success: false, error: 'Unsupported format' };
};
