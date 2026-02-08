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
import { browser } from 'wxt/browser';
import { ExportFormat, NormalizedExportPayload, NoteBlock, validateNoteBlocks } from '../export-core';
import { RawExtractResult } from './common';

export interface TypeExtractResult {
    success: boolean;
    payload?: NormalizedExportPayload<NoteBlock>;
    error?: string;
    raw?: RawExtractResult;
}

export const extractReport = async (tabId: number, format: ExportFormat): Promise<TypeExtractResult> => {
    try {
        const results = await browser.scripting.executeScript({
            target: { tabId, allFrames: true },
            args: [format],
            func: (formatArg: ExportFormat) => {
                try {
                    if (formatArg !== 'Markdown' && formatArg !== 'Word' && formatArg !== 'PDF' && formatArg !== 'HTML') {
                        return { success: false, error: 'unsupported_format', frameUrl: window.location.href };
                    }

                    const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ');

                    const trimInlines = (inlines: { text: string; bold?: boolean; italic?: boolean; citation?: { id: string; source: string } }[]) => {
                        if (inlines.length === 0) return inlines;
                        inlines[0].text = inlines[0].text.replace(/^\s+/, '');
                        if (inlines.length > 0) {
                            inlines[inlines.length - 1].text = inlines[inlines.length - 1].text.replace(/\s+$/, '');
                        }
                        return inlines.filter((inline) => inline.text.length > 0 || inline.citation);
                    };

                    const formatCitation = (ariaLabel?: string | null, fallback?: string | null) => {
                        const label = ariaLabel?.trim();
                        if (label) {
                            const match = label.match(/^(\d+)\s*:\s*(.+)$/);
                            if (match) {
                                return { id: match[1], source: match[2] };
                            }
                            return { id: label, source: label };
                        }
                        const text = fallback?.trim();
                        if (text) {
                            return { id: text, source: text };
                        }
                        return null;
                    };

                    const pushInline = (
                        inlines: { text: string; bold?: boolean; italic?: boolean; citation?: { id: string; source: string } }[],
                        text: string,
                        style: { bold?: boolean; italic?: boolean }
                    ) => {
                        const normalized = normalizeWhitespace(text);
                        if (normalized.trim().length === 0) {
                            return;
                        }
                        const last = inlines[inlines.length - 1];
                        if (last && !last.citation && last.bold === style.bold && last.italic === style.italic) {
                            last.text += normalized;
                            return;
                        }
                        inlines.push({ text: normalized, bold: style.bold, italic: style.italic });
                    };

                    const collectInlines = (element: Element) => {
                        const inlines: { text: string; bold?: boolean; italic?: boolean; citation?: { id: string; source: string } }[] = [];
                        const walk = (node: Node, style: { bold?: boolean; italic?: boolean }) => {
                            if (node.nodeType === Node.TEXT_NODE) {
                                pushInline(inlines, node.textContent || '', style);
                                return;
                            }
                            if (node.nodeType !== Node.ELEMENT_NODE) {
                                return;
                            }
                            const el = node as HTMLElement;
                            if (el.matches('span[aria-label]')) {
                                const ariaLabel = el.getAttribute('aria-label');
                                if (ariaLabel && /^\d+\s*:/.test(ariaLabel)) {
                                    const citation = formatCitation(ariaLabel, el.textContent);
                                    if (citation) {
                                        inlines.push({ text: '', ...style, citation });
                                    }
                                    return;
                                }
                            }

                            const nextStyle = { ...style };
                            if (el.tagName === 'B' || el.tagName === 'STRONG') {
                                nextStyle.bold = true;
                            }
                            if (el.tagName === 'I' || el.tagName === 'EM') {
                                nextStyle.italic = true;
                            }
                            el.childNodes.forEach((child) => walk(child, nextStyle));
                        };

                        element.childNodes.forEach((child) => walk(child, {}));
                        return trimInlines(inlines);
                    };

                    const collectCodeText = (element: Element) => {
                        const codeElement = element.querySelector('code') || element;
                        const rawText = codeElement.textContent || '';
                        return rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n+$/, '');
                    };

                    const isSeparator = (inlines: { text: string }[]) => {
                        const raw = inlines.map((inline) => inline.text).join('');
                        const compact = raw.replace(/\s+/g, '');
                        return compact.length > 0 && /^-+$/.test(compact);
                    };

                    const reportRoot = document.querySelector('report-viewer');
                    const root = reportRoot?.querySelector('labs-tailwind-doc-viewer') || reportRoot;

                    if (!root) {
                        return { success: false, error: 'report_not_found', frameUrl: window.location.href };
                    }

                    const elements = Array.from(root.querySelectorAll('div.paragraph, table, pre'));
                    const blocks: NoteBlock[] = [];
                    let reportTitle = '';

                    for (const element of elements) {
                        if (element.tagName === 'TABLE') {
                            const rows = Array.from(element.querySelectorAll('tr'))
                                .map((row) => {
                                    const cells = Array.from(row.querySelectorAll('th, td')).map((cell) => collectInlines(cell));
                                    return cells;
                                })
                                .filter((row) => row.some((cell) => cell.length > 0));
                            if (rows.length > 0) {
                                blocks.push({ type: 'table', rows });
                            }
                            continue;
                        }

                        if (element.tagName === 'PRE') {
                            if (element.closest('table')) {
                                continue;
                            }
                            const text = collectCodeText(element);
                            if (text.length > 0) {
                                blocks.push({ type: 'code', text });
                            }
                            continue;
                        }

                        if (element.closest('table')) {
                            continue;
                        }

                        const inlines = collectInlines(element);
                        if (inlines.length === 0 || isSeparator(inlines)) {
                            continue;
                        }

                        const level = element.classList.contains('heading1')
                            ? 1
                            : element.classList.contains('heading2')
                            ? 2
                            : element.classList.contains('heading3')
                            ? 3
                            : null;

                        if (level) {
                            const headingText = inlines.map((inline) => inline.text).join('').trim();
                            if (!reportTitle && level === 1 && headingText) {
                                reportTitle = headingText;
                                continue;
                            }
                            blocks.push({ type: 'heading', level, inlines });
                            continue;
                        }

                        blocks.push({ type: 'paragraph', inlines });
                    }

                    if (blocks.length === 0) {
                        return { success: false, error: 'report_not_found', frameUrl: window.location.href };
                    }

                    return {
                        success: true,
                        data: {
                            report: {
                                title: reportTitle,
                                blocks
                            }
                        },
                        frameUrl: window.location.href
                    };
                } catch (error) {
                    return { success: false, error: 'script_error', frameUrl: window.location.href };
                }
            }
        });

        const success = results.find((result) => result.result?.success);
        if (success?.result?.success) {
            const raw: RawExtractResult = success.result;
            if (!raw.data?.report || !Array.isArray(raw.data.report.blocks)) {
                return { success: false, error: 'report_not_found', raw };
            }

            const items = raw.data.report.blocks as NoteBlock[];
            const validation = validateNoteBlocks(items);
            if (!validation.valid) {
                return {
                    success: false,
                    error: `Invalid report data: ${validation.errors.join('; ')}`,
                    raw
                };
            }

            return {
                success: true,
                payload: {
                    type: 'report',
                    items,
                    source: 'notebooklm',
                    meta: {
                        title: typeof raw.data.report.title === 'string' ? raw.data.report.title : undefined
                    }
                },
                raw
            };
        }

        const firstResult = results.find((result) => result.result)?.result;
        return {
            success: false,
            error: firstResult?.error || 'no_results',
            raw: firstResult
        };
    } catch (error) {
        return { success: false, error: 'script_error' };
    }
};

