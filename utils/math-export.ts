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
import html2canvas from 'html2canvas';
import katexCss from 'katex/dist/katex.min.css?inline';
import { ImageRun } from 'docx';
import type { MathExpression } from './export-core';

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

export const MATH_EXPORT_CSS = `
${katexCss}
.export-math {
    color: inherit;
    max-width: 100%;
}
.export-math-inline {
    display: inline-block;
    line-height: 1.2;
    margin: 0 0.08em;
    vertical-align: -0.18em;
}
.export-math-display {
    display: block;
    margin: 0.7em 0;
    overflow: visible;
    text-align: center;
}
.export-math-display > .katex-display {
    margin: 0;
}
.export-math .katex {
    max-width: 100%;
    white-space: nowrap;
}
.export-math-fallback {
    font-family: "Cambria Math", "Times New Roman", serif;
    white-space: pre-wrap;
}
`;

export const renderMathHtml = (math: MathExpression) => {
    const rendered = math.html?.trim() || `<span class="export-math-fallback">${escapeHtml(math.latex)}</span>`;
    const modeClass = math.display ? 'export-math-display' : 'export-math-inline';
    return `<span class="export-math ${modeClass}" data-latex="${escapeHtml(math.latex)}">${rendered}</span>`;
};

export const renderMathMarkdown = (
    math: MathExpression,
    options?: { allowDisplay?: boolean; forTable?: boolean }
) => {
    let latex = math.latex.trim();
    if (options?.forTable) {
        latex = latex.replace(/(^|[^\\])\|/g, '$1\\vert ');
    }
    if (math.display && options?.allowDisplay !== false && !options?.forTable) {
        return `\n\n$$\n${latex}\n$$\n\n`;
    }
    return `$${latex}$`;
};

export const renderMathPlainText = (math: MathExpression) =>
    math.display ? `\n${math.latex}\n` : math.latex;

export const waitForMathFonts = async () => {
    if (typeof document !== 'undefined' && document.fonts?.ready) {
        await document.fonts.ready;
    }
};

type RenderedMathImage = {
    data: string;
    width: number;
    height: number;
};

const mathImageCache = new Map<string, Promise<RenderedMathImage>>();

const renderMathImage = async (math: MathExpression): Promise<RenderedMathImage> => {
    const cacheKey = `${math.display ? 'display' : 'inline'}:${math.html || math.latex}`;
    const cached = mathImageCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    const pending = (async () => {
        const container = document.createElement('span');
        container.style.position = 'fixed';
        container.style.left = '-10000px';
        container.style.top = '0';
        container.style.display = 'inline-block';
        container.style.padding = math.display ? '4px' : '1px 0';
        container.style.background = 'transparent';
        container.style.color = '#1a1a1a';
        container.style.fontSize = math.display ? '16px' : '13.2px';
        container.style.lineHeight = math.display ? '1.2' : '1';

        const style = document.createElement('style');
        style.textContent = `
${MATH_EXPORT_CSS}
.docx-math-capture .export-math,
.docx-math-capture .export-math-display,
.docx-math-capture .katex-display {
    display: inline-block;
    margin: 0;
    text-align: left;
}
`;
        const content = document.createElement('span');
        content.className = 'docx-math-capture';
        content.innerHTML = renderMathHtml(math);
        container.append(style, content);
        document.body.appendChild(container);

        try {
            await waitForMathFonts();
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
            const scale = 3;
            const canvas = await html2canvas(container, {
                scale,
                useCORS: true,
                backgroundColor: null,
                logging: false
            });
            const rawWidth = Math.max(1, Math.ceil(canvas.width / scale));
            const rawHeight = Math.max(1, Math.ceil(canvas.height / scale));
            const maxWidth = math.display ? 620 : 560;
            const ratio = Math.min(1, maxWidth / rawWidth);
            return {
                data: canvas.toDataURL('image/png'),
                width: Math.max(1, Math.round(rawWidth * ratio)),
                height: Math.max(1, Math.round(rawHeight * ratio))
            };
        } finally {
            container.remove();
        }
    })();

    mathImageCache.set(cacheKey, pending);
    try {
        return await pending;
    } catch (error) {
        mathImageCache.delete(cacheKey);
        throw error;
    }
};

export const createDocxMathImageRun = async (math: MathExpression) => {
    const image = await renderMathImage(math);
    return new ImageRun({
        data: image.data,
        transformation: {
            width: image.width,
            height: image.height
        },
        altText: {
            name: 'Equation',
            title: 'Equation',
            description: math.latex
        }
    });
};
