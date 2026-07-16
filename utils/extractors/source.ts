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
import { ExportFormat, NormalizedExportPayload, NoteBlock, SourceItem, validateSourceItems } from '../export-core';
import { RawExtractResult } from './common';
import { injectRichTextExtractor } from './rich-text';

export interface TypeExtractResult {
    success: boolean;
    payload?: NormalizedExportPayload<SourceItem>;
    error?: string;
    raw?: RawExtractResult;
}

export const extractSource = async (tabId: number, format: ExportFormat): Promise<TypeExtractResult> => {
    try {
        await injectRichTextExtractor(tabId);
        const results = await browser.scripting.executeScript({
            target: { tabId, allFrames: true },
            args: [format],
            func: (formatArg: ExportFormat) => {
                try {
                    if (formatArg !== 'Markdown' && formatArg !== 'Word' && formatArg !== 'PDF') {
                        return { success: false, error: 'unsupported_format', frameUrl: window.location.href };
                    }

                    const richText = (globalThis as any).__NOTEBOOKLM_EXPORT_RICH_TEXT__;
                    if (!richText) {
                        return { success: false, error: 'rich_text_helper_missing', frameUrl: window.location.href };
                    }
                    const {
                        collectCodeText,
                        collectInlines: collectRichInlines,
                        isSeparator,
                        normalizeWhitespace
                    } = richText;
                    const collectInlines = (element: Element) =>
                        collectRichInlines(element, { includeCitations: true, skipLineNumbers: true });

                    const extractSourceDetail = (doc: Document) => {
                        const viewer = doc.querySelector('source-viewer');
                        if (!viewer) {
                            return null;
                        }

                        const titleNode = viewer.querySelector('#source-title, .source-title');
                        let title = titleNode?.textContent?.trim() || doc.title?.trim() || '';

                        const summaryBlocks: NoteBlock[] = [];
                        const summaryRoot =
                            viewer.querySelector('.summary-container .summary') || viewer.querySelector('.summary');
                        if (summaryRoot) {
                            const summaryParagraphs = Array.from(summaryRoot.querySelectorAll('p'));
                            if (summaryParagraphs.length > 0) {
                                summaryParagraphs.forEach((paragraph) => {
                                    const inlines = collectInlines(paragraph);
                                    if (inlines.length > 0) {
                                        summaryBlocks.push({ type: 'paragraph', inlines });
                                    }
                                });
                            } else {
                                const inlines = collectInlines(summaryRoot);
                                if (inlines.length > 0) {
                                    summaryBlocks.push({ type: 'paragraph', inlines });
                                }
                            }
                        }

                        const keyTopics: string[] = [];
                        const keyTopicNodes = Array.from(
                            viewer.querySelectorAll('.key-topics-container .key-topics-text, .key-topics-container mat-chip-option')
                        );
                        const seenTopics = new Set<string>();
                        keyTopicNodes.forEach((node) => {
                            const text = normalizeWhitespace(node.textContent || '').trim();
                            if (!text || seenTopics.has(text)) {
                                return;
                            }
                            seenTopics.add(text);
                            keyTopics.push(text);
                        });

                        const contentBlocks: NoteBlock[] = [];
                        const contentRoot =
                            viewer.querySelector('.elements-container') ||
                            viewer.querySelector('labs-tailwind-doc-viewer') ||
                            viewer;
                        const elements = Array.from(contentRoot.querySelectorAll('.paragraph, table, pre'));

                        for (const element of elements) {
                            if (element.tagName === 'TABLE') {
                                const rows = Array.from(element.querySelectorAll('tr'))
                                    .map((row) => {
                                        const cells = Array.from(row.querySelectorAll('th, td')).map((cell) => collectInlines(cell));
                                        return cells;
                                    })
                                    .filter((row) => row.some((cell) => cell.length > 0));
                                if (rows.length > 0) {
                                    contentBlocks.push({ type: 'table', rows });
                                }
                                continue;
                            }

                            if (element.tagName === 'PRE') {
                                if (element.closest('table')) {
                                    continue;
                                }
                                const text = collectCodeText(element);
                                if (text.length > 0) {
                                    contentBlocks.push({ type: 'code', text });
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
                                contentBlocks.push({ type: 'heading', level, inlines });
                                continue;
                            }

                            contentBlocks.push({ type: 'paragraph', inlines });
                        }

                        if (!title && (summaryBlocks.length > 0 || keyTopics.length > 0 || contentBlocks.length > 0)) {
                            title = 'Source';
                        }

                        if (!title && summaryBlocks.length === 0 && keyTopics.length === 0 && contentBlocks.length === 0) {
                            return null;
                        }

                        return {
                            success: true,
                            data: {
                                source: [
                                    {
                                        title,
                                        summary: summaryBlocks.length > 0 ? summaryBlocks : undefined,
                                        keyTopics: keyTopics.length > 0 ? keyTopics : undefined,
                                        content: contentBlocks.length > 0 ? contentBlocks : undefined
                                    }
                                ]
                            },
                            frameUrl: doc.URL
                        };
                    };

                    const tryExtractFromDocument = (doc: Document, depth: number): any => {
                        if (!doc || depth > 4) return null;

                        const result = extractSourceDetail(doc);
                        if (result?.success) {
                            return result;
                        }

                        const iframes = Array.from(doc.querySelectorAll('iframe'));
                        for (const frame of iframes) {
                            try {
                                const frameDoc = frame.contentDocument || frame.contentWindow?.document;
                                if (!frameDoc) continue;
                                const nestedResult = tryExtractFromDocument(frameDoc, depth + 1);
                                if (nestedResult?.success) return nestedResult;
                            } catch (innerErr) {
                                // Cross-origin or inaccessible frame; ignore.
                            }
                        }

                        return null;
                    };

                    const result = tryExtractFromDocument(document, 0);
                    if (result) return result;
                    return { success: false, error: 'source_not_found', frameUrl: window.location.href };
                } catch (error) {
                    return { success: false, error: 'script_error', frameUrl: window.location.href };
                }
            }
        });

        const success = results.find((result) => result.result?.success);
        if (success?.result?.success) {
            const raw: RawExtractResult = success.result;
            const items = raw.data?.source;
            if (!Array.isArray(items)) {
                return { success: false, error: 'source_not_found', raw };
            }

            const validation = validateSourceItems(items);
            if (!validation.valid) {
                return {
                    success: false,
                    error: `Invalid source data: ${validation.errors.join('; ')}`,
                    raw
                };
            }

            return {
                success: true,
                payload: {
                    type: 'source',
                    items,
                    source: 'notebooklm'
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

