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
import { injectRichTextExtractor } from './rich-text';

export interface TypeExtractResult {
    success: boolean;
    payload?: NormalizedExportPayload<NoteBlock>;
    error?: string;
    raw?: RawExtractResult;
}

export const extractReport = async (tabId: number, format: ExportFormat): Promise<TypeExtractResult> => {
    try {
        await injectRichTextExtractor(tabId);
        const results = await browser.scripting.executeScript({
            target: { tabId, allFrames: true },
            args: [format],
            func: (formatArg: ExportFormat) => {
                try {
                    if (formatArg !== 'Markdown' && formatArg !== 'Word' && formatArg !== 'PDF' && formatArg !== 'HTML') {
                        return { success: false, error: 'unsupported_format', frameUrl: window.location.href };
                    }

                    const richText = (globalThis as any).__NOTEBOOKLM_EXPORT_RICH_TEXT__;
                    if (!richText) {
                        return { success: false, error: 'rich_text_helper_missing', frameUrl: window.location.href };
                    }
                    const { collectCodeText, collectInlines, inlineToText, isSeparator } = richText;

                    const reportRoot = document.querySelector('report-viewer');
                    const root = reportRoot?.querySelector('labs-tailwind-doc-viewer') || reportRoot;

                    if (!root) {
                        return { success: false, error: 'report_not_found', frameUrl: window.location.href };
                    }

                    const elements = Array.from(root.querySelectorAll('.paragraph, table, pre'));
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
                            const headingText = inlines.map((inline: any) => inlineToText(inline)).join('').trim();
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

