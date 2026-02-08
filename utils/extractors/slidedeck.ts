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
import { ExportFormat, NormalizedExportPayload, SlideDeckItem, validateSlideDeckItems } from '../export-core';
import { RawExtractResult } from './common';

export interface TypeExtractResult {
    success: boolean;
    payload?: NormalizedExportPayload<SlideDeckItem>;
    error?: string;
    raw?: RawExtractResult;
}

export const extractSlideDeck = async (tabId: number, format: ExportFormat): Promise<TypeExtractResult> => {
    try {
        const results = await browser.scripting.executeScript({
            target: { tabId, allFrames: true },
            args: [format],
            func: async (formatArg: ExportFormat) => {
                try {
                    const LOG = '[SLIDE_EXTRACT]';
                    if (formatArg !== 'PDF' && formatArg !== 'PPTX' && formatArg !== 'HTML' && formatArg !== 'ZIP') {
                        return { success: false, error: 'unsupported_format', frameUrl: window.location.href };
                    }

                    const parseAspectRatio = (raw?: string | null) => {
                        if (!raw) {
                            return undefined;
                        }
                        const ratioMatch = raw.match(/--aspect-ratio:\s*([0-9.]+)\s*\/\s*([0-9.]+)/);
                        if (!ratioMatch) {
                            return undefined;
                        }
                        const width = parseFloat(ratioMatch[1]);
                        const height = parseFloat(ratioMatch[2]);
                        if (!Number.isFinite(width) || !Number.isFinite(height) || height <= 0) {
                            return undefined;
                        }
                        return width / height;
                    };

                    const tryExtractFromDocument = async (doc: Document, depth: number): Promise<any> => {
                        if (!doc || depth > 4) {
                            return null;
                        }

                        const viewer = doc.querySelector('slide-deck-viewer');
                        if (viewer) {
                            const imageNodes = Array.from(viewer.querySelectorAll('.scrollable-list-item img'));
                            if (imageNodes.length === 0) {
                                return { success: false, error: 'slidedeck_not_found', frameUrl: doc.URL };
                            }

                            const slides = [];
                            for (let index = 0; index < imageNodes.length; index += 1) {
                                const image = imageNodes[index] as HTMLImageElement;
                                const imageUrl = (image.getAttribute('src') || '').trim();
                                if (!imageUrl) {
                                    continue;
                                }
                                const parentElement = image.closest('.scrollable-list-item');
                                slides.push({
                                    imageUrl,
                                    altText: (image.getAttribute('alt') || '').trim() || undefined,
                                    description: (image.getAttribute('aria-description') || '').trim() || undefined,
                                    index,
                                    aspectRatio: parseAspectRatio(parentElement?.getAttribute('style') || undefined)
                                });
                            }

                            const runtime = (globalThis as any).chrome?.runtime;
                            if (runtime?.sendMessage) {
                                const prefetchedSlides = await Promise.all(
                                    slides.map(async (slide) => {
                                        try {
                                            const response = await new Promise<any>((resolve) => {
                                                runtime.sendMessage(
                                                    { type: 'fetch-image-data-url', url: slide.imageUrl },
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
                                                    ...slide,
                                                    imageDataUrl: response.dataUrl
                                                };
                                            }
                                            console.warn(`${LOG} prefetch_failed`, {
                                                index: slide.index,
                                                imageUrl: slide.imageUrl,
                                                error: response?.error,
                                                finalUrl: response?.finalUrl
                                            });
                                        } catch (prefetchError) {
                                            console.warn(`${LOG} prefetch_exception`, {
                                                index: slide.index,
                                                imageUrl: slide.imageUrl,
                                                error: prefetchError
                                            });
                                        }
                                        return slide;
                                    })
                                );
                                slides.splice(0, slides.length, ...prefetchedSlides);
                            }

                            if (slides.length === 0) {
                                return { success: false, error: 'slidedeck_not_found', frameUrl: doc.URL };
                            }

                            return {
                                success: true,
                                data: {
                                    slidedeck: {
                                        title: (doc.title || '').trim(),
                                        slides
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
                    return { success: false, error: 'slidedeck_not_found', frameUrl: window.location.href };
                } catch (error) {
                    console.warn('[SLIDE_EXTRACT] script_error', { error });
                    return { success: false, error: 'script_error', frameUrl: window.location.href };
                }
            }
        });

        const success = results.find((result) => result.result?.success);
        if (success?.result?.success) {
            const raw: RawExtractResult = success.result;
            const items = raw.data?.slidedeck?.slides;
            if (!Array.isArray(items)) {
                return { success: false, error: 'slidedeck_not_found', raw };
            }

            const validation = validateSlideDeckItems(items);
            if (!validation.valid) {
                return {
                    success: false,
                    error: `Invalid slide deck data: ${validation.errors.join('; ')}`,
                    raw
                };
            }

            return {
                success: true,
                payload: {
                    type: 'slidedeck',
                    items: items as SlideDeckItem[],
                    source: 'notebooklm',
                    meta: {
                        title: typeof raw.data?.slidedeck?.title === 'string' ? raw.data.slidedeck.title : undefined
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
