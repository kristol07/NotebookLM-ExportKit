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
import { ExportFormat, InfographicItem, NormalizedExportPayload, validateInfographicItems } from '../export-core';
import { RawExtractResult } from './common';

export interface TypeExtractResult {
    success: boolean;
    payload?: NormalizedExportPayload<InfographicItem>;
    error?: string;
    raw?: RawExtractResult;
}

export const extractInfographic = async (tabId: number, format: ExportFormat): Promise<TypeExtractResult> => {
    try {
        const results = await browser.scripting.executeScript({
            target: { tabId, allFrames: true },
            args: [format],
            func: async (formatArg: ExportFormat) => {
                try {
                    const LOG = '[INFOGRAPHIC_EXTRACT]';
                    if (formatArg !== 'PNG' && formatArg !== 'HTML' && formatArg !== 'PDF') {
                        return { success: false, error: 'unsupported_format', frameUrl: window.location.href };
                    }

                    const tryExtractFromDocument = async (doc: Document, depth: number): Promise<any> => {
                        if (!doc || depth > 4) {
                            return null;
                        }

                        const viewer = doc.querySelector('infographic-viewer');
                        if (viewer) {
                            const imageNodes = Array.from(viewer.querySelectorAll('img'));
                            if (imageNodes.length === 0) {
                                return { success: false, error: 'infographic_not_found', frameUrl: doc.URL };
                            }

                            const items = [];
                            for (let index = 0; index < imageNodes.length; index += 1) {
                                const image = imageNodes[index] as HTMLImageElement;
                                const imageUrl = (image.getAttribute('src') || '').trim();
                                if (!imageUrl) {
                                    continue;
                                }
                                items.push({
                                    imageUrl,
                                    altText: (image.getAttribute('alt') || '').trim() || undefined,
                                    description: (image.getAttribute('aria-description') || '').trim() || undefined,
                                    index
                                });
                            }

                            const runtime = (globalThis as any).chrome?.runtime;
                            if (runtime?.sendMessage) {
                                const prefetchedItems = await Promise.all(
                                    items.map(async (item) => {
                                        try {
                                            const response = await new Promise<any>((resolve) => {
                                                runtime.sendMessage(
                                                    { type: 'fetch-image-data-url', url: item.imageUrl },
                                                    (result: any) => {
                                                        const lastError = runtime.lastError;
                                                        if (lastError) {
                                                            resolve({
                                                                success: false,
                                                                error: String(lastError.message || 'runtime_last_error')
                                                            });
                                                            return;
                                                        }
                                                        resolve(result);
                                                    }
                                                );
                                            });
                                            if (response?.success && typeof response?.dataUrl === 'string') {
                                                return {
                                                    ...item,
                                                    imageDataUrl: response.dataUrl
                                                };
                                            }
                                            console.warn(`${LOG} prefetch_failed`, {
                                                index: item.index,
                                                imageUrl: item.imageUrl,
                                                error: response?.error,
                                                finalUrl: response?.finalUrl
                                            });
                                        } catch (prefetchError) {
                                            console.warn(`${LOG} prefetch_exception`, {
                                                index: item.index,
                                                imageUrl: item.imageUrl,
                                                error: prefetchError
                                            });
                                        }
                                        return item;
                                    })
                                );
                                items.splice(0, items.length, ...prefetchedItems);
                            }

                            if (items.length === 0) {
                                return { success: false, error: 'infographic_not_found', frameUrl: doc.URL };
                            }

                            return {
                                success: true,
                                data: {
                                    infographic: {
                                        title: (doc.title || '').trim(),
                                        items
                                    }
                                },
                                frameUrl: doc.URL
                            };
                        }

                        const iframes = Array.from(doc.querySelectorAll('iframe'));
                        for (const frame of iframes) {
                            try {
                                const frameDoc = frame.contentDocument || frame.contentWindow?.document;
                                if (!frameDoc) continue;
                                const nestedResult = await tryExtractFromDocument(frameDoc, depth + 1);
                                if (nestedResult?.success) return nestedResult;
                            } catch (innerErr) {
                                // Cross-origin or inaccessible frame; ignore.
                            }
                        }

                        return null;
                    };

                    const result = await tryExtractFromDocument(document, 0);
                    if (result) {
                        return result;
                    }
                    return { success: false, error: 'infographic_not_found', frameUrl: window.location.href };
                } catch (error) {
                    return { success: false, error: 'script_error', frameUrl: window.location.href };
                }
            }
        });

        const success = results.find((result) => result.result?.success);
        if (success?.result?.success) {
            const raw: RawExtractResult = success.result;
            const items = raw.data?.infographic?.items;
            if (!Array.isArray(items)) {
                return { success: false, error: 'infographic_not_found', raw };
            }

            const validation = validateInfographicItems(items);
            if (!validation.valid) {
                return {
                    success: false,
                    error: `Invalid infographic data: ${validation.errors.join('; ')}`,
                    raw
                };
            }

            return {
                success: true,
                payload: {
                    type: 'infographic',
                    items: items as InfographicItem[],
                    source: 'notebooklm',
                    meta: {
                        title: typeof raw.data?.infographic?.title === 'string' ? raw.data.infographic.title : undefined
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
