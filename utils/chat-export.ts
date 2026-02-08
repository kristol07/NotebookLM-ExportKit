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
import { ExportFormat, ExportOptions, ExportResult, ChatInline, ChatMessage, ChatMessageChunk, PdfQualityPreference } from './export-core';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
    AlignmentType,
    BorderStyle,
    Document,
    HeadingLevel,
    LineRuleType,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType
} from 'docx';

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const escapeMarkdown = (value: string, forTable: boolean) => {
    let text = value
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\*/g, '\\*')
        .replace(/_/g, '\\_');
    if (forTable) {
        text = text.replace(/\|/g, '\\|');
    }
    return text;
};

const DOCX_BODY_RUN = { font: 'Times New Roman', size: 24 };
const DOCX_HEADING_RUN = { font: 'Times New Roman', size: 26, bold: true };
const DOCX_ROLE_RUN = { font: 'Times New Roman', size: 24, bold: true };
const DOCX_PARAGRAPH_SPACING = { after: 160, line: 276, lineRule: LineRuleType.AUTO };
const DOCX_TABLE_BORDERS = {
    top: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
    left: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
    right: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '999999' }
};
const DOCX_TABLE_MARGINS = {
    marginUnitType: WidthType.DXA,
    top: 80,
    bottom: 80,
    left: 120,
    right: 120
};

const PDF_PAGE_WIDTH_PX = 794;
const PDF_PAGE_HEIGHT_PX = 1123;
const PDF_MARGIN_PX = 48;
const PDF_PRESETS: Record<PdfQualityPreference, { scale: number; format: 'PNG' | 'JPEG'; quality: number }> = {
    size: { scale: 1.5, format: 'PNG', quality: 0.8 },
    clarity: { scale: 3.5, format: 'PNG', quality: 0.95 }
};

const renderInlineHtml = (
    inline: ChatInline,
    references: Map<string, string>,
    referenceOrder: string[]
) => {
    if (inline.citation) {
        const key = inline.citation.id;
        if (!references.has(key)) {
            references.set(key, inline.citation.source);
            referenceOrder.push(key);
        }
        return `<sup class="chat-citation">[${escapeHtml(key)}]</sup>`;
    }
    let content = escapeHtml(inline.text);
    if (inline.bold && inline.italic) {
        content = `<strong><em>${content}</em></strong>`;
    } else if (inline.bold) {
        content = `<strong>${content}</strong>`;
    } else if (inline.italic) {
        content = `<em>${content}</em>`;
    }
    return content;
};

const renderInlineMarkdown = (
    inline: ChatInline,
    forTable: boolean,
    footnotes: Map<string, string>,
    footnoteOrder: string[]
) => {
    if (inline.citation) {
        const key = inline.citation.id;
        if (!footnotes.has(key)) {
            footnotes.set(key, inline.citation.source);
            footnoteOrder.push(key);
        }
        return `[^${key}]`;
    }
    let content = escapeMarkdown(inline.text, forTable);
    if (inline.bold && inline.italic) {
        content = `***${content}***`;
    } else if (inline.bold) {
        content = `**${content}**`;
    } else if (inline.italic) {
        content = `*${content}*`;
    }
    return content;
};

const renderParagraphMarkdown = (
    inlines: ChatInline[],
    footnotes: Map<string, string>,
    footnoteOrder: string[]
) => {
    const content = inlines.map((inline) => renderInlineMarkdown(inline, false, footnotes, footnoteOrder)).join('');
    return content.trim().length > 0 ? content.trim() : '';
};

const renderParagraphHtml = (
    inlines: ChatInline[],
    references: Map<string, string>,
    referenceOrder: string[]
) => {
    const content = inlines.map((inline) => renderInlineHtml(inline, references, referenceOrder)).join('');
    return content.trim().length > 0 ? `<p>${content.trim()}</p>` : '';
};

const renderTableMarkdown = (
    rows: ChatInline[][][],
    footnotes: Map<string, string>,
    footnoteOrder: string[]
) => {
    if (rows.length === 0) return '';
    const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0);
    const normalizeRow = (row: ChatInline[][]) => {
        const cells = row.slice();
        while (cells.length < columnCount) {
            cells.push([]);
        }
        return cells;
    };

    const renderRow = (row: ChatInline[][]) =>
        `| ${normalizeRow(row).map((cell) => cell.map((inline) => renderInlineMarkdown(inline, true, footnotes, footnoteOrder)).join('').trim()).join(' | ')} |`;

    const header = renderRow(rows[0]);
    const separator = `| ${Array.from({ length: columnCount }).map(() => '---').join(' | ')} |`;
    const body = rows.slice(1).map(renderRow);
    return [header, separator, ...body].join('\n');
};

const renderTableHtml = (
    rows: ChatInline[][][],
    references: Map<string, string>,
    referenceOrder: string[]
) => {
    const bodyRows = rows
        .map((row) => {
            const cells = row
                .map(
                    (cell) =>
                        `<td>${cell.map((inline) => renderInlineHtml(inline, references, referenceOrder)).join('').trim()}</td>`
                )
                .join('');
            return `<tr>${cells}</tr>`;
        })
        .join('');
    return `<table><tbody>${bodyRows}</tbody></table>`;
};

const renderCodeMarkdown = (text: string) => {
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n+$/, '');
    return `\`\`\`\n${normalized}\n\`\`\``;
};

const renderCodeHtml = (text: string) => {
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    return `<pre><code>${escapeHtml(normalized)}</code></pre>`;
};

const renderMessageChunkHtml = (
    chunk: ChatMessageChunk,
    references: Map<string, string>,
    referenceOrder: string[]
) => {
    if (chunk.type === 'paragraph') {
        return renderParagraphHtml(chunk.inlines, references, referenceOrder);
    }
    if (chunk.type === 'code') {
        return renderCodeHtml(chunk.text);
    }
    return renderTableHtml(chunk.rows, references, referenceOrder);
};

const renderMessageMarkdown = (
    message: ChatMessage,
    footnotes: Map<string, string>,
    footnoteOrder: string[]
) => {
    const body = message.chunks
        .map((chunk) => {
            if (chunk.type === 'paragraph') {
                return renderParagraphMarkdown(chunk.inlines, footnotes, footnoteOrder);
            }
            if (chunk.type === 'code') {
                return renderCodeMarkdown(chunk.text);
            }
            return renderTableMarkdown(chunk.rows, footnotes, footnoteOrder);
        })
        .filter((line) => line.length > 0)
        .join('\n\n');
    const roleLabel = PDF_ROLE_LABELS[message.role];
    if (body.length === 0) {
        return `## ${roleLabel}`;
    }
    return `## ${roleLabel}\n\n${body}`;
};

const renderReferencesHtml = (references: Map<string, string>, referenceOrder: string[]) => {
    if (referenceOrder.length === 0) {
        return '';
    }
    const items = referenceOrder
        .map((key) => {
            const source = references.get(key) || '';
            return `<li>[${escapeHtml(key)}] ${escapeHtml(source)}</li>`;
        })
        .join('');
    return `<h2>References</h2><ol class="chat-references">${items}</ol>`;
};

const buildReferenceBlocks = (references: Map<string, string>, referenceOrder: string[]): PdfRenderBlock[] => {
    if (referenceOrder.length === 0) {
        return [];
    }
    return [
        { type: 'html', html: '<h2>References</h2>' },
        ...referenceOrder.map((key) => {
            const source = references.get(key) || '';
            return {
                type: 'html',
                html: `<div class="chat-reference-item">[${escapeHtml(key)}] ${escapeHtml(source)}</div>`
            } as PdfRenderBlock;
        })
    ];
};

const collectReferences = (messages: ChatMessage[]) => {
    const references = new Map<string, string>();
    const referenceOrder: string[] = [];
    const collectInline = (inline: ChatInline) => {
        if (!inline.citation) {
            return;
        }
        const key = inline.citation.id;
        if (!references.has(key)) {
            references.set(key, inline.citation.source);
            referenceOrder.push(key);
        }
    };

    messages.forEach((message) => {
        message.chunks.forEach((chunk) => {
            if (chunk.type === 'paragraph') {
                chunk.inlines.forEach(collectInline);
                return;
            }
            if (chunk.type === 'table') {
                chunk.rows.forEach((row) => row.forEach((cell) => cell.forEach(collectInline)));
            }
        });
    });

    return { references, referenceOrder };
};

const buildDocxParagraph = (
    inlines: ChatInline[],
    references: Map<string, string>,
    referenceOrder: string[]
) => {
    const children: TextRun[] = [];
    for (const inline of inlines) {
        if (inline.citation) {
            const key = inline.citation.id;
            if (!references.has(key)) {
                references.set(key, inline.citation.source);
                referenceOrder.push(key);
            }
            children.push(new TextRun({ text: `[${key}]` }));
            continue;
        }
        if (inline.text.length === 0) {
            continue;
        }
        children.push(
            new TextRun({
                text: inline.text,
                bold: inline.bold,
                italics: inline.italic
            })
        );
    }
    return new Paragraph({
        children,
        spacing: DOCX_PARAGRAPH_SPACING,
        run: DOCX_BODY_RUN
    });
};

const buildDocxTable = (
    rows: ChatInline[][][],
    references: Map<string, string>,
    referenceOrder: string[]
) => {
    const tableRows = rows.map((row) => {
        const cells = row.map((cell) => {
            const paragraph = buildDocxParagraph(cell, references, referenceOrder);
            return new TableCell({ children: [paragraph], margins: DOCX_TABLE_MARGINS });
        });
        return new TableRow({ children: cells });
    });
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows,
        borders: DOCX_TABLE_BORDERS,
        margins: DOCX_TABLE_MARGINS
    });
};

const buildDocxCodeBlock = (text: string) => {
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n+$/, '');
    const lines = normalized.split('\n');
    const children = lines.map((line, index) =>
        new TextRun({
            text: line,
            break: index === 0 ? undefined : 1
        })
    );
    return new Paragraph({
        children,
        spacing: DOCX_PARAGRAPH_SPACING,
        run: { font: 'Consolas', size: 22 }
    });
};

const PDF_ROLE_LABELS: Record<ChatMessage['role'], string> = {
    user: 'User',
    assistant: 'Assistant'
};

const createPdfStyleElement = () => {
    const style = document.createElement('style');
    style.textContent = `
        .chat-export, .chat-export * { box-sizing: border-box; }
        .chat-export { font-family: "Times New Roman", serif; font-size: 12pt; line-height: 1.6; color: #1a1a1a; }
        .chat-export h1 { font-size: 20pt; margin: 0 0 16pt; }
        .chat-export h2 { font-size: 14pt; margin: 18pt 0 10pt; }
        .chat-message { border: 1px solid #c9c9c9; border-radius: 10pt; padding: 12pt 14pt; margin: 0 0 8pt; }
        .chat-message.user { background: #f5f1ff; border-color: #d6c9ff; }
        .chat-message.assistant { background: #f3f7f5; border-color: #bfd9d1; }
        .chat-message.segment-start { border-bottom: none; border-bottom-left-radius: 0; border-bottom-right-radius: 0; margin-bottom: 2pt; padding-bottom: 12pt; }
        .chat-message.segment-middle { border-top: none; border-bottom: none; border-radius: 0; margin: 0 0 2pt; padding-top: 12pt; padding-bottom: 12pt; }
        .chat-message.segment-end { border-top: none; border-top-left-radius: 0; border-top-right-radius: 0; margin-top: 0; padding-top: 12pt; }
        .chat-role { font-weight: 700; margin: 0 0 8pt; }
        .chat-export p { margin: 0 0 6pt; }
        .chat-export table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
        .chat-export td, .chat-export th { border: 1px solid #999; padding: 6pt; vertical-align: top; }
        .chat-export pre { background: #f5f5f5; border: 1px solid #ddd; padding: 10pt; border-radius: 4pt; font-family: "Consolas", "Courier New", monospace; font-size: 10.5pt; white-space: pre-wrap; margin: 0 0 8pt; }
        .chat-export code { font-family: "Consolas", "Courier New", monospace; }
        .chat-message > :last-child { margin-bottom: 0; }
        .chat-citation { font-size: 9pt; vertical-align: super; }
        .chat-references { margin: 0; padding-left: 18pt; }
        .chat-references li { margin: 0 0 6pt; }
        .chat-reference-item { margin: 0 0 6pt; padding-left: 18pt; text-indent: -18pt; }
        .chat-block { padding-top: 0; padding-bottom: 0; }
    `;
    return style;
};

type PdfRenderBlock =
    | { type: 'message'; role: ChatMessage['role']; chunks: ChatMessageChunk[]; showRole: boolean; segment: 'single' | 'start' | 'middle' | 'end' }
    | { type: 'html'; html: string };
type PdfMessageRenderBlock = Extract<PdfRenderBlock, { type: 'message' }>;

const renderMessageHtml = (
    role: ChatMessage['role'],
    chunks: ChatMessageChunk[],
    references: Map<string, string>,
    referenceOrder: string[],
    showRole: boolean,
    segment: 'single' | 'start' | 'middle' | 'end'
) => {
    const body = chunks.map((chunk) => renderMessageChunkHtml(chunk, references, referenceOrder)).join('');
    const roleHtml = showRole ? `<div class="chat-role">${PDF_ROLE_LABELS[role]}</div>` : '';
    return `<div class="chat-message ${role} segment-${segment}">${roleHtml}${body}</div>`;
};

const renderBlockElement = (
    block: PdfRenderBlock,
    references: Map<string, string>,
    referenceOrder: string[]
) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-block';
    if (block.type === 'message') {
        wrapper.innerHTML = renderMessageHtml(
            block.role,
            block.chunks,
            references,
            referenceOrder,
            block.showRole,
            block.segment
        );
        return wrapper;
    }
    wrapper.innerHTML = block.html;
    return wrapper;
};

const createPdfMeasureContainer = () => {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-10000px';
    container.style.top = '0';
    container.style.width = `${PDF_PAGE_WIDTH_PX - PDF_MARGIN_PX * 2}px`;
    const style = createPdfStyleElement();
    const content = document.createElement('div');
    content.className = 'chat-export';
    container.append(style, content);
    document.body.appendChild(container);
    return {
        element: container,
        content,
        cleanup: () => {
            container.remove();
        }
    };
};

const createPdfPageElement = (
    blocks: PdfRenderBlock[],
    references: Map<string, string>,
    referenceOrder: string[]
) => {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-10000px';
    container.style.top = '0';
    container.style.width = `${PDF_PAGE_WIDTH_PX}px`;
    container.style.height = `${PDF_PAGE_HEIGHT_PX}px`;
    container.style.background = '#ffffff';
    container.style.padding = `${PDF_MARGIN_PX}px`;
    const style = createPdfStyleElement();
    const content = document.createElement('div');
    content.className = 'chat-export';
    content.style.width = `${PDF_PAGE_WIDTH_PX - PDF_MARGIN_PX * 2}px`;
    blocks.forEach((block) => {
        content.appendChild(renderBlockElement(block, references, referenceOrder));
    });
    container.append(style, content);
    document.body.appendChild(container);
    return {
        element: container,
        cleanup: () => {
            container.remove();
        }
    };
};

const paginatePdfBlocks = (
    blocks: PdfRenderBlock[],
    references: Map<string, string>,
    referenceOrder: string[]
) => {
    const contentHeight = PDF_PAGE_HEIGHT_PX - PDF_MARGIN_PX * 2;
    const pages: PdfRenderBlock[][] = [];
    let current: PdfRenderBlock[] = [];
    let currentHeight = 0;

    const { element, content, cleanup } = createPdfMeasureContainer();
    void element;

    const measureBlockHeight = (block: PdfRenderBlock) => {
        const node = renderBlockElement(block, references, referenceOrder);
        content.appendChild(node);
        const height = node.offsetHeight;
        node.remove();
        return height;
    };

    const commitPage = () => {
        if (current.length > 0) {
            pages.push(current);
        }
        current = [];
        currentHeight = 0;
    };

    const tryAddBlock = (block: PdfRenderBlock, height: number) => {
        if (currentHeight + height <= contentHeight || current.length === 0) {
            current.push(block);
            currentHeight += height;
            return true;
        }
        return false;
    };

    const splitInlineText = (inline: ChatInline) => {
        if (inline.citation) {
            return [inline];
        }
        const text = inline.text || '';
        if (text.length === 0) {
            return [];
        }
        const parts = text.split(/(\s+)/).filter((part) => part.length > 0);
        const tokens: ChatInline[] = [];
        const maxTokenLength = 80;
        parts.forEach((part) => {
            if (part.length <= maxTokenLength) {
                tokens.push({ ...inline, text: part });
                return;
            }
            for (let i = 0; i < part.length; i += maxTokenLength) {
                tokens.push({ ...inline, text: part.slice(i, i + maxTokenLength) });
            }
        });
        return tokens;
    };

    const normalizeInlineSlice = (inlines: ChatInline[]) => {
        if (inlines.length === 0) {
            return inlines;
        }
        const normalized = inlines.map((inline) => ({ ...inline }));
        if (normalized[0].text) {
            normalized[0].text = normalized[0].text.replace(/^\s+/, '');
        }
        const last = normalized[normalized.length - 1];
        if (last?.text) {
            last.text = last.text.replace(/\s+$/, '');
        }
        return normalized.filter((inline) => inline.text.length > 0 || inline.citation);
    };

    const buildMessageBlock = (
        role: ChatMessage['role'],
        chunks: ChatMessageChunk[],
        showRole: boolean,
        segment: 'single' | 'start' | 'middle' | 'end' = 'middle'
    ): PdfMessageRenderBlock => ({
        type: 'message',
        role,
        chunks,
        showRole,
        segment
    });

    const placeMessageChunk = (
        role: ChatMessage['role'],
        chunk: ChatMessageChunk,
        showRole: boolean
    ) => {
        const block = buildMessageBlock(role, [chunk], showRole);
        const height = measureBlockHeight(block);
        if (!tryAddBlock(block, height)) {
            commitPage();
            const retryBlock = buildMessageBlock(role, [chunk], true);
            const retryHeight = measureBlockHeight(retryBlock);
            tryAddBlock(retryBlock, retryHeight);
            return retryBlock;
        }
        return block;
    };

    const getTableChunkRowCount = (
        role: ChatMessage['role'],
        rows: ChatInline[][][],
        startIndex: number,
        maxHeight: number,
        showRole: boolean
    ) => {
        const header = rows[0];
        const remaining = rows.length - startIndex;
        let low = 1;
        let high = remaining;
        let best = 0;
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const candidateRows = [header, ...rows.slice(startIndex, startIndex + mid)];
            const height = measureBlockHeight(
                buildMessageBlock(role, [{ type: 'table', rows: candidateRows }], showRole)
            );
            if (height <= maxHeight) {
                best = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        return best;
    };

    const getCodeChunkLineCount = (
        role: ChatMessage['role'],
        lines: string[],
        startIndex: number,
        maxHeight: number,
        showRole: boolean
    ) => {
        const remaining = lines.length - startIndex;
        let low = 1;
        let high = remaining;
        let best = 0;
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const candidate = lines.slice(startIndex, startIndex + mid).join('\n');
            const height = measureBlockHeight(
                buildMessageBlock(role, [{ type: 'code', text: candidate }], showRole)
            );
            if (height <= maxHeight) {
                best = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        return best;
    };

    const getParagraphInlineCount = (
        role: ChatMessage['role'],
        inlines: ChatInline[],
        startIndex: number,
        maxHeight: number,
        showRole: boolean
    ) => {
        const remaining = inlines.length - startIndex;
        let low = 1;
        let high = remaining;
        let best = 0;
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const candidate = normalizeInlineSlice(inlines.slice(startIndex, startIndex + mid));
            if (candidate.length === 0) {
                high = mid - 1;
                continue;
            }
            const height = measureBlockHeight(
                buildMessageBlock(role, [{ type: 'paragraph', inlines: candidate }], showRole)
            );
            if (height <= maxHeight) {
                best = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        return best;
    };

    blocks.forEach((block) => {
        if (block.type !== 'message') {
            const height = measureBlockHeight(block);
            if (!tryAddBlock(block, height)) {
                commitPage();
                tryAddBlock(block, height);
            }
            return;
        }

        let isFirstChunk = true;
        const messageSegments: PdfMessageRenderBlock[] = [];
        block.chunks.forEach((chunk) => {
            if (chunk.type === 'table') {
                if (chunk.rows.length <= 1) {
                    const showRole = isFirstChunk || currentHeight === 0;
                    const segment = placeMessageChunk(block.role, chunk, showRole);
                    if (segment) {
                        messageSegments.push(segment);
                    }
                    isFirstChunk = false;
                    return;
                }
                const header = chunk.rows[0];
                let start = 1;
                while (start < chunk.rows.length) {
                    let remainingHeight = contentHeight - currentHeight;
                    if (remainingHeight <= 0) {
                        commitPage();
                        remainingHeight = contentHeight;
                    }
                    const showRole = isFirstChunk || currentHeight === 0;
                    let rowCount = getTableChunkRowCount(
                        block.role,
                        chunk.rows,
                        start,
                        remainingHeight,
                        showRole
                    );
                    if (rowCount === 0 && current.length > 0) {
                        commitPage();
                        rowCount = getTableChunkRowCount(
                            block.role,
                            chunk.rows,
                            start,
                            contentHeight,
                            true
                        );
                    }
                    if (rowCount === 0) {
                        rowCount = 1;
                    }
                    const rows = [header, ...chunk.rows.slice(start, start + rowCount)];
                    const segment = placeMessageChunk(block.role, { type: 'table', rows }, showRole);
                    if (segment) {
                        messageSegments.push(segment);
                    }
                    isFirstChunk = false;
                    start += rowCount;
                }
                return;
            }

            if (chunk.type === 'code') {
                const normalized = chunk.text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n+$/, '');
                const lines = normalized.length > 0 ? normalized.split('\n') : [''];
                let start = 0;
                while (start < lines.length) {
                    let remainingHeight = contentHeight - currentHeight;
                    if (remainingHeight <= 0) {
                        commitPage();
                        remainingHeight = contentHeight;
                    }
                    const showRole = isFirstChunk || currentHeight === 0;
                    let lineCount = getCodeChunkLineCount(
                        block.role,
                        lines,
                        start,
                        remainingHeight,
                        showRole
                    );
                    if (lineCount === 0 && current.length > 0) {
                        commitPage();
                        lineCount = getCodeChunkLineCount(
                            block.role,
                            lines,
                            start,
                            contentHeight,
                            true
                        );
                    }
                    if (lineCount === 0) {
                        lineCount = 1;
                    }
                    const text = lines.slice(start, start + lineCount).join('\n');
                    const segment = placeMessageChunk(block.role, { type: 'code', text }, showRole);
                    if (segment) {
                        messageSegments.push(segment);
                    }
                    isFirstChunk = false;
                    start += lineCount;
                }
                return;
            }

            const tokenized = chunk.inlines.flatMap(splitInlineText);
            if (tokenized.length === 0) {
                return;
            }
            let start = 0;
            while (start < tokenized.length) {
                let remainingHeight = contentHeight - currentHeight;
                if (remainingHeight <= 0) {
                    commitPage();
                    remainingHeight = contentHeight;
                }
                const showRole = isFirstChunk || currentHeight === 0;
                let inlineCount = getParagraphInlineCount(
                    block.role,
                    tokenized,
                    start,
                    remainingHeight,
                    showRole
                );
                if (inlineCount === 0 && current.length > 0) {
                    commitPage();
                    inlineCount = getParagraphInlineCount(
                        block.role,
                        tokenized,
                        start,
                        contentHeight,
                        true
                    );
                }
                if (inlineCount === 0) {
                    inlineCount = 1;
                }
                const inlines = normalizeInlineSlice(tokenized.slice(start, start + inlineCount));
                if (inlines.length > 0) {
                    const segment = placeMessageChunk(block.role, { type: 'paragraph', inlines }, showRole);
                    if (segment) {
                        messageSegments.push(segment);
                    }
                    isFirstChunk = false;
                }
                start += inlineCount;
            }
        });

        if (messageSegments.length > 0) {
            if (messageSegments.length === 1) {
                messageSegments[0].segment = 'single';
            } else {
                messageSegments[0].segment = 'start';
                messageSegments[messageSegments.length - 1].segment = 'end';
                if (messageSegments.length > 2) {
                    messageSegments.slice(1, -1).forEach((segment) => {
                        segment.segment = 'middle';
                    });
                }
            }
        }
    });

    cleanup();

    if (current.length > 0) {
        pages.push(current);
    }

    return pages;
};

const exportChatPdf = async (title: string, messages: ChatMessage[], pdfQuality: PdfQualityPreference = 'size') => {
    const { references, referenceOrder } = collectReferences(messages);
    const preset = PDF_PRESETS[pdfQuality] || PDF_PRESETS.size;
    const pdfBlocks: PdfRenderBlock[] = [
        { type: 'html', html: `<h1 class="chat-title">${escapeHtml(title)}</h1>` },
        ...messages.map((message): PdfMessageRenderBlock => ({
            type: 'message',
            role: message.role,
            chunks: message.chunks,
            showRole: true,
            segment: 'single'
        }))
    ];
    const referenceBlocks = buildReferenceBlocks(references, referenceOrder);
    if (referenceBlocks.length > 0) {
        pdfBlocks.push(...referenceBlocks);
    }
    const pages = paginatePdfBlocks(pdfBlocks, references, referenceOrder);
    const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4', compress: true });
    for (let index = 0; index < pages.length; index += 1) {
        const { element, cleanup } = createPdfPageElement(pages[index], references, referenceOrder);
        const canvas = await html2canvas(element, {
            scale: preset.scale,
            useCORS: true,
            backgroundColor: '#ffffff'
        });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imageHeight = (canvas.height * pageWidth) / canvas.width;
        if (index > 0) {
            pdf.addPage();
        }
        const imgData = preset.format === 'JPEG'
            ? canvas.toDataURL('image/jpeg', preset.quality)
            : canvas.toDataURL('image/png');
        pdf.addImage(imgData, preset.format, 0, 0, pageWidth, Math.min(pageHeight, imageHeight));
        cleanup();
    }
    return pdf.output('blob');
};

const buildDocxMessage = (
    message: ChatMessage,
    references: Map<string, string>,
    referenceOrder: string[]
) => {
    const roleLabel = message.role === 'user' ? 'User' : 'Assistant';
    const children: (Paragraph | Table)[] = [
        new Paragraph({
            children: [new TextRun({ text: roleLabel, ...DOCX_ROLE_RUN })],
            spacing: { after: 120 }
        })
    ];

    message.chunks.forEach((chunk) => {
        if (chunk.type === 'paragraph') {
            children.push(buildDocxParagraph(chunk.inlines, references, referenceOrder));
            return;
        }
        if (chunk.type === 'code') {
            children.push(buildDocxCodeBlock(chunk.text));
            return;
        }
        children.push(buildDocxTable(chunk.rows, references, referenceOrder));
    });

    children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
    return children;
};

export const exportChat = async (
    messages: ChatMessage[],
    format: ExportFormat,
    tabTitle: string,
    timestamp: string,
    options?: ExportOptions
): Promise<ExportResult> => {
    const title = tabTitle;

    if (format === 'JSON') {
        const payload = {
            chat: {
                title,
                messages: messages.map((message) => ({
                    type: message.role,
                    content: message.content,
                    chunks: message.chunks.map((chunk) => {
                        if (chunk.type === 'paragraph') {
                            return {
                                type: 'paragraph',
                                inlines: chunk.inlines.map((inline) => ({
                                    text: inline.text,
                                    bold: inline.bold,
                                    italic: inline.italic,
                                    citation: inline.citation
                                        ? { id: inline.citation.id, source: inline.citation.source }
                                        : undefined
                                }))
                            };
                        }
                        if (chunk.type === 'code') {
                            return { type: 'code', text: chunk.text };
                        }
                        return {
                            type: 'table',
                            rows: chunk.rows.map((row) =>
                                row.map((cell) =>
                                    cell.map((inline) => ({
                                        text: inline.text,
                                        bold: inline.bold,
                                        italic: inline.italic,
                                        citation: inline.citation
                                            ? { id: inline.citation.id, source: inline.citation.source }
                                            : undefined
                                    }))
                                )
                            )
                        };
                    })
                }))
            }
        };
        const filename = `notebooklm_chat_${tabTitle}_${timestamp}.json`;
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        return { success: true, count: messages.length, filename, mimeType: blob.type, blob };
    }

    if (format === 'Markdown') {
        const footnotes = new Map<string, string>();
        const footnoteOrder: string[] = [];
        const messageBlocks = messages
            .map((message) => renderMessageMarkdown(message, footnotes, footnoteOrder))
            .filter((block) => block.length > 0);
        const body = messageBlocks.join('\n\n');
        const footnoteLines = footnoteOrder.map((key) => `[^${key}]: ${footnotes.get(key) || ''}`);
        const parts = [`# ${title}`, '', body];
        if (footnoteLines.length > 0) {
            parts.push('', ...footnoteLines);
        }
        const content = parts.join('\n');
        const filename = `notebooklm_chat_${tabTitle}_${timestamp}.md`;
        const blob = new Blob([content], { type: 'text/markdown' });
        return { success: true, count: messages.length, filename, mimeType: blob.type, blob };
    }

    if (format === 'PDF') {
        try {
            const blob = await exportChatPdf(title, messages, options?.pdfQuality);
            const filename = `notebooklm_chat_${tabTitle}_${timestamp}.pdf`;
            return { success: true, count: messages.length, filename, mimeType: 'application/pdf', blob };
        } catch (err) {
            console.error(err);
            return { success: false, error: 'Failed to build PDF export.' };
        }
    }

    if (format === 'Word') {
        const references = new Map<string, string>();
        const referenceOrder: string[] = [];
        const children: (Paragraph | Table)[] = [
            new Paragraph({
                children: [new TextRun({ text: title, ...DOCX_HEADING_RUN })],
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.LEFT,
                spacing: { after: 240 }
            }),
            ...messages.flatMap((message) => buildDocxMessage(message, references, referenceOrder))
        ];

        if (referenceOrder.length > 0) {
            children.push(
                new Paragraph({
                    children: [new TextRun({ text: 'References', ...DOCX_HEADING_RUN })],
                    heading: HeadingLevel.HEADING_2,
                    spacing: { after: 160 }
                })
            );
            referenceOrder.forEach((key) => {
                const source = references.get(key) || '';
                children.push(
                    new Paragraph({
                        children: [new TextRun({ text: `[${key}] ${source}` })],
                        spacing: DOCX_PARAGRAPH_SPACING,
                        run: DOCX_BODY_RUN
                    })
                );
            });
        }

        const doc = new Document({
            sections: [{ children }],
            styles: {
                default: {
                    document: {
                        run: DOCX_BODY_RUN,
                        paragraph: { spacing: DOCX_PARAGRAPH_SPACING }
                    }
                }
            }
        });

        const filename = `notebooklm_chat_${tabTitle}_${timestamp}.docx`;
        try {
            const blob = await Packer.toBlob(doc);
            return {
                success: true,
                count: messages.length,
                filename,
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                blob
            };
        } catch (err) {
            console.error(err);
            return { success: false, error: 'Failed to build Word export.' };
        }
    }

    return { success: false, error: 'Unsupported format' };
};

