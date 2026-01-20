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
import { ExportFormat, NormalizedExportPayload, SourceItem, validateSourceItems } from '../export-core';
import { RawExtractResult } from './common';

export interface TypeExtractResult {
    success: boolean;
    payload?: NormalizedExportPayload<SourceItem>;
    error?: string;
    raw?: RawExtractResult;
}

export const extractSource = async (tabId: number, format: ExportFormat): Promise<TypeExtractResult> => {
    try {
        const results = await browser.scripting.executeScript({
            target: { tabId, allFrames: true },
            args: [format],
            func: (formatArg: ExportFormat) => {
                try {
                    if (formatArg !== 'Markdown') {
                        return { success: false, error: 'unsupported_format', frameUrl: window.location.href };
                    }

                    const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();

                    const collectSources = (doc: Document) => {
                        const items: { title: string }[] = [];
                        const seen = new Set<string>();
                        const addTitle = (value: string | null | undefined) => {
                            if (!value) return;
                            const title = normalize(value);
                            if (!title || seen.has(title)) return;
                            seen.add(title);
                            items.push({ title });
                        };

                        const titleNodes = Array.from(
                            doc.querySelectorAll('.single-source-container .source-title, .single-source-container [aria-label="Source title"]')
                        );
                        titleNodes.forEach((node) => addTitle(node.textContent));

                        if (items.length === 0) {
                            const ariaNodes = Array.from(
                                doc.querySelectorAll('.single-source-container button[aria-description]')
                            );
                            ariaNodes.forEach((node) => addTitle(node.getAttribute('aria-description')));
                        }

                        if (items.length === 0) {
                            const checkboxNodes = Array.from(
                                doc.querySelectorAll('.single-source-container input[type="checkbox"][aria-label]')
                            );
                            checkboxNodes.forEach((node) => addTitle(node.getAttribute('aria-label')));
                        }

                        return items;
                    };

                    const tryExtractFromDocument = (doc: Document, depth: number): any => {
                        if (!doc || depth > 4) return null;

                        const items = collectSources(doc);
                        if (items.length > 0) {
                            return { success: true, data: { source: items }, frameUrl: doc.URL };
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

