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
import PptxGenJS from 'pptxgenjs';
import JSZip from 'jszip';
import { browser } from 'wxt/browser';
import { ExportFormat, ExportResult, SlideDeckItem } from './export-core';

const EXPORT_LOG = '[SLIDE_EXPORT]';

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const escapeMarkdown = (value: string) =>
    value
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\*/g, '\\*')
        .replace(/_/g, '\\_')
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]');

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

const getImageExtension = (url: string, contentType?: string | null) => {
    if (contentType) {
        if (contentType.includes('png')) return 'png';
        if (contentType.includes('webp')) return 'webp';
        if (contentType.includes('gif')) return 'gif';
        if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
    }
    const withoutQuery = url.split('?')[0];
    const extMatch = withoutQuery.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch?.[1]?.toLowerCase();
    if (ext === 'png' || ext === 'webp' || ext === 'gif' || ext === 'jpg' || ext === 'jpeg') {
        return ext === 'jpeg' ? 'jpg' : ext;
    }
    return 'jpg';
};

const getImageExtensionFromDataUrl = (dataUrl?: string) => {
    if (!dataUrl) {
        return null;
    }
    const match = dataUrl.match(/^data:([^;]+);base64,/);
    const mimeType = match?.[1] || '';
    if (mimeType.includes('png')) return 'png';
    if (mimeType.includes('webp')) return 'webp';
    if (mimeType.includes('gif')) return 'gif';
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
    return null;
};

const getMimeFromDataUrl = (dataUrl: string) => {
    const match = dataUrl.match(/^data:([^;]+);base64,/);
    return match?.[1]?.toLowerCase() || 'application/octet-stream';
};

const convertDataUrlToJpeg = (dataUrl: string, quality = 0.92): Promise<string> =>
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
                resolve(canvas.toDataURL('image/jpeg', quality));
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

const resolveSlideImage = async (slide: SlideDeckItem) => {
    const sourceDataUrl = slide.imageDataUrl?.startsWith('data:')
        ? slide.imageDataUrl
        : await fetchImageDataUrlViaBackground(slide.imageUrl);

    if (sourceDataUrl?.startsWith('data:')) {
        const originalExt = getImageExtensionFromDataUrl(sourceDataUrl) || getImageExtension(slide.imageUrl);
        const mime = getMimeFromDataUrl(sourceDataUrl);
        const isPdfOrPptFriendly = mime.includes('jpeg') || mime.includes('jpg') || mime.includes('png');
        const normalizedDataUrl = isPdfOrPptFriendly
            ? sourceDataUrl
            : await convertDataUrlToJpeg(sourceDataUrl);
        const ext = isPdfOrPptFriendly ? originalExt : 'jpg';
        return {
            dataUrl: normalizedDataUrl,
            blob: dataUrlToBlob(normalizedDataUrl),
            ext
        };
    }
    throw new Error('Image data is unavailable.');
};

const getImageDimensions = (dataUrl: string): Promise<{ width: number; height: number }> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
        image.onerror = () => reject(new Error('Failed to read image dimensions.'));
        image.src = dataUrl;
    });

const getDeckAspectRatio = (slides: SlideDeckItem[]) => {
    const fromMeta = slides.find((slide) => typeof slide.aspectRatio === 'number' && slide.aspectRatio > 0)?.aspectRatio;
    if (fromMeta) {
        return fromMeta;
    }
    return 16 / 9;
};

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

const buildAltTextLabel = (slide: SlideDeckItem, index: number) => {
    const alt = slide.altText?.trim() || `Slide ${index + 1}`;
    return `${alt}`;
};

const buildPptSpeakerNotes = (slide: SlideDeckItem, index: number) => {
    const lines: string[] = [buildAltTextLabel(slide, index)];
    const description = slide.description?.trim();
    if (description) {
        lines.push('', 'Description:', ` ${description}`);
    }
    return lines.join('\n');
};

const buildSlideDeckHtml = (slides: SlideDeckItem[], title: string) => {
    const figures = slides.map((slide, index) => {
        const alt = slide.altText?.trim() || `Slide ${index + 1}`;
        const altLabel = buildAltTextLabel(slide, index);
        const description = slide.description?.trim() || '';
        const src = slide.imageDataUrl?.startsWith('data:') ? slide.imageDataUrl : slide.imageUrl;
        return `<figure class="slide">
  <img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" />
  <figcaption>
    <strong>Slide ${index + 1}</strong> <span class="alt-label">${escapeHtml(altLabel)}</span>
    ${description ? `<details><summary>notes</summary><p>${escapeHtml(description)}</p></details>` : ''}
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
      --bg: #f4f6fb;
      --card: #ffffff;
      --text: #172037;
      --muted: #53607a;
      --border: #d9e1f1;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", Arial, sans-serif;
      background: radial-gradient(circle at top right, #e6ecfa 0%, var(--bg) 45%, #eef2fb 100%);
      color: var(--text);
      padding: 24px;
    }
    .wrap { max-width: 1080px; margin: 0 auto; }
    h1 { margin: 0 0 20px; font-size: 28px; }
    .slides { display: grid; gap: 20px; }
    .slide {
      margin: 0;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(17, 33, 78, 0.07);
    }
    .slide img {
      width: 100%;
      display: block;
      background: #e9edf8;
    }
    .slide figcaption {
      padding: 14px 16px 16px;
      color: var(--muted);
      font-size: 14px;
      line-height: 1.5;
    }
    .slide .alt-label { margin-left: 8px; color: var(--text); }
    .slide details { margin-top: 8px; }
    .slide summary { cursor: pointer; color: var(--text); font-weight: 600; }
    .slide p { margin: 8px 0 0; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>${escapeHtml(title)}</h1>
    <section class="slides">
      ${figures}
    </section>
  </div>
</body>
</html>`;
};

const exportSlideDeckPdf = async (slides: SlideDeckItem[]) => {
    const ratio = getDeckAspectRatio(slides);
    const basePageWidth = 1280;
    const rawPageHeight = Math.round(basePageWidth / ratio);
    const pageWidth = Math.max(basePageWidth, rawPageHeight);
    const pageHeight = Math.min(basePageWidth, rawPageHeight);
    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: [pageWidth, pageHeight]
    });

    for (let i = 0; i < slides.length; i += 1) {
        const slide = slides[i];
        if (i > 0) {
            pdf.addPage([pageWidth, pageHeight], 'landscape');
        }
        try {
            const image = await resolveSlideImage(slide);
            const dataUrl = image.dataUrl;
            const size = await getImageDimensions(dataUrl);
            const fit = fitToBox(size.width, size.height, pageWidth, pageHeight);
            pdf.addImage(dataUrl, 'JPEG', fit.x, fit.y, fit.width, fit.height);
        } catch (error) {
            console.warn(`${EXPORT_LOG} pdf_slide_image_failed`, { index: i, sourceUrl: slide.imageUrl, error });
            pdf.setFontSize(24);
            pdf.text(`Slide ${i + 1}`, 48, 72);
            pdf.setFontSize(12);
            pdf.text(slide.altText?.trim() || 'Image could not be loaded.', 48, 102, { maxWidth: pageWidth - 96 });
            pdf.text(slide.imageUrl, 48, 126, { maxWidth: pageWidth - 96 });
        }
    }

    return pdf.output('blob');
};

const exportSlideDeckPptx = async (slides: SlideDeckItem[]) => {
    const ratio = getDeckAspectRatio(slides);
    const baseWidth = 13.333;
    const slideWidth = baseWidth;
    const slideHeight = baseWidth / ratio;

    const pptx = new PptxGenJS();
    pptx.defineLayout({
        name: 'SLIDE_DECK_CUSTOM',
        width: slideWidth,
        height: slideHeight
    });
    pptx.layout = 'SLIDE_DECK_CUSTOM';

    for (let i = 0; i < slides.length; i += 1) {
        const slideData = slides[i];
        const slide = pptx.addSlide();
        slide.addNotes(buildPptSpeakerNotes(slideData, i));
        try {
            const image = await resolveSlideImage(slideData);
            const dataUrl = image.dataUrl;
            slide.addImage({
                data: dataUrl,
                x: 0,
                y: 0,
                w: slideWidth,
                h: slideHeight
            });
        } catch (error) {
            console.warn(`${EXPORT_LOG} pptx_slide_image_failed`, { index: i, sourceUrl: slideData.imageUrl, error });
            slide.addText(`Slide ${i + 1}`, {
                x: 0.5,
                y: 0.5,
                w: slideWidth - 1,
                h: 0.5,
                bold: true,
                fontSize: 20
            });
            slide.addText(slideData.altText?.trim() || 'Image could not be loaded.', {
                x: 0.5,
                y: 1.2,
                w: slideWidth - 1,
                h: 0.8,
                fontSize: 14
            });
            slide.addText(slideData.imageUrl, {
                x: 0.5,
                y: 2.1,
                w: slideWidth - 1,
                h: 1.2,
                fontSize: 10,
                color: '3A4B6D'
            });
        }
    }

    return pptx.write({ outputType: 'blob' }) as Promise<Blob>;
};

const exportSlideDeckZip = async (slides: SlideDeckItem[], title: string) => {
    const zip = new JSZip();
    const imagesFolder = zip.folder('images');
    if (!imagesFolder) {
        throw new Error('Failed to create zip image folder.');
    }

    const markdownLines: string[] = [`# ${title}`, ''];
    for (let i = 0; i < slides.length; i += 1) {
        const slide = slides[i];
        const index = i + 1;
        const baseName = `slide-${String(index).padStart(2, '0')}`;
        let imageName = `${baseName}.jpg`;
        try {
            const image = await resolveSlideImage(slide);
            const ext = image.ext;
            imageName = `${baseName}.${ext}`;
            imagesFolder.file(imageName, image.blob);
            markdownLines.push(`## Slide ${index}`);
            markdownLines.push('');
            markdownLines.push(`![${escapeMarkdown(slide.altText?.trim() || `Slide ${index}`)}](images/${imageName})`);
            markdownLines.push('');
            markdownLines.push(`${escapeMarkdown(buildAltTextLabel(slide, i))}`);
        } catch (error) {
            console.warn(`${EXPORT_LOG} zip_slide_image_failed`, { index: i, sourceUrl: slide.imageUrl, error });
            markdownLines.push(`## Slide ${index}`);
            markdownLines.push('');
            markdownLines.push(`![${escapeMarkdown(slide.altText?.trim() || `Slide ${index}`)}](${slide.imageUrl})`);
            markdownLines.push('');
            markdownLines.push(`${escapeMarkdown(buildAltTextLabel(slide, i))}`);
            markdownLines.push('');
            markdownLines.push(`_Local image file unavailable due cross-origin restrictions. Source URL kept above._`);
        }
        if (slide.description?.trim()) {
            markdownLines.push('');
            markdownLines.push('<details>');
            markdownLines.push('<summary>notes</summary>');
            markdownLines.push('');
            markdownLines.push(slide.description.trim());
            markdownLines.push('');
            markdownLines.push('</details>');
        }
        markdownLines.push('');
    }

    zip.file('slide-deck.md', markdownLines.join('\n').trimEnd());
    return zip.generateAsync({ type: 'blob' });
};

export const exportSlideDeck = async (
    slides: SlideDeckItem[],
    format: ExportFormat,
    tabTitle: string,
    timestamp: string
): Promise<ExportResult> => {
    if (slides.length === 0) {
        return { success: false, error: 'No slide deck content found to export.' };
    }

    const title = tabTitle || 'slide_deck';

    if (format === 'HTML') {
        const html = buildSlideDeckHtml(slides, title);
        const filename = `notebooklm_slidedeck_${tabTitle}_${timestamp}.html`;
        const blob = new Blob([html], { type: 'text/html' });
        return { success: true, count: slides.length, filename, mimeType: blob.type, blob };
    }

    if (format === 'PDF') {
        try {
            const blob = await exportSlideDeckPdf(slides);
            const filename = `notebooklm_slidedeck_${tabTitle}_${timestamp}.pdf`;
            return { success: true, count: slides.length, filename, mimeType: 'application/pdf', blob };
        } catch (error) {
            console.error(error);
            return { success: false, error: 'Failed to build slide deck PDF export.' };
        }
    }

    if (format === 'PPTX') {
        try {
            const blob = await exportSlideDeckPptx(slides);
            const filename = `notebooklm_slidedeck_${tabTitle}_${timestamp}.pptx`;
            return {
                success: true,
                count: slides.length,
                filename,
                mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                blob
            };
        } catch (error) {
            console.error(error);
            return { success: false, error: 'Failed to build slide deck PPTX export.' };
        }
    }

    if (format === 'ZIP') {
        try {
            const blob = await exportSlideDeckZip(slides, title);
            const filename = `notebooklm_slidedeck_${tabTitle}_${timestamp}.zip`;
            return { success: true, count: slides.length, filename, mimeType: 'application/zip', blob };
        } catch (error) {
            console.error(error);
            return { success: false, error: 'Failed to build slide deck ZIP export.' };
        }
    }

    return { success: false, error: 'Unsupported format' };
};
