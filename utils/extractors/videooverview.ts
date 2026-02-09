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
import {
    ExportFormat,
    NormalizedExportPayload,
    validateVideoOverviewItems,
    VideoOverviewItem
} from '../export-core';
import { RawExtractResult } from './common';

export interface TypeExtractResult {
    success: boolean;
    payload?: NormalizedExportPayload<VideoOverviewItem>;
    error?: string;
    raw?: RawExtractResult;
}

export const extractVideoOverview = async (tabId: number, format: ExportFormat): Promise<TypeExtractResult> => {
    try {
        const results = await browser.scripting.executeScript({
            target: { tabId, allFrames: true },
            args: [format],
            func: (formatArg: ExportFormat) => {
                try {
                    if (
                        formatArg !== 'MP4'
                        && formatArg !== 'WAV'
                        && formatArg !== 'ZIP'
                        && formatArg !== 'PDF'
                        && formatArg !== 'PPTX'
                        && formatArg !== 'HTML'
                    ) {
                        return { success: false, error: 'unsupported_format', frameUrl: window.location.href };
                    }

                    const isLikelyVideoUrl = (value?: string | null) => {
                        if (!value) {
                            return false;
                        }
                        const url = value.trim();
                        if (!url) {
                            return false;
                        }
                        return url.includes('googleusercontent.com/notebooklm/')
                            || /[?&](mime|format)=video/i.test(url)
                            || /(m22|m18)(?:[?&]|$)/i.test(url)
                            || /\.(mp4|webm|mov)(?:[?&]|$)/i.test(url);
                    };

                    const getDurationMeta = (doc: Document) => {
                        const input = doc.querySelector('input[aria-label="Video progress"]') as HTMLInputElement | null;
                        const max = input?.getAttribute('max') || '';
                        const durationSeconds = Number.parseFloat(max);
                        const durationLabel = (doc.querySelector('.duration')?.textContent || '').trim();
                        return {
                            durationSeconds: Number.isFinite(durationSeconds) && durationSeconds >= 0 ? durationSeconds : undefined,
                            durationLabel: durationLabel || undefined
                        };
                    };

                    const extractFromDocument = (doc: Document, depth: number): any => {
                        if (!doc || depth > 4) {
                            return null;
                        }

                        const player = doc.querySelector('video-player');
                        if (player) {
                            const videoElement = player.querySelector('video');
                            const srcCandidates = [
                                videoElement?.getAttribute('src'),
                                videoElement?.getAttribute('data-src'),
                                videoElement?.currentSrc,
                                videoElement?.src
                            ]
                                .filter((value): value is string => typeof value === 'string')
                                .map((value) => value.trim())
                                .filter(Boolean);

                            let videoUrl = srcCandidates.find((value) => isLikelyVideoUrl(value)) || srcCandidates[0] || '';

                            if (!videoUrl) {
                                const html = player.outerHTML || '';
                                const match = html.match(/https?:\/\/[^"'<>\\\s]+/g) || [];
                                videoUrl = match.find((url) => isLikelyVideoUrl(url)) || '';
                            }

                            if (!videoUrl) {
                                return { success: false, error: 'video_not_found', frameUrl: doc.URL };
                            }

                            const durationMeta = getDurationMeta(doc);
                            return {
                                success: true,
                                data: {
                                    videooverview: {
                                        title: (doc.title || '').trim(),
                                        items: [{
                                            videoUrl,
                                            title: (doc.title || '').trim() || undefined,
                                            durationSeconds: durationMeta.durationSeconds,
                                            durationLabel: durationMeta.durationLabel
                                        }]
                                    }
                                },
                                frameUrl: doc.URL
                            };
                        }

                        const scriptText = Array.from(doc.querySelectorAll('script'))
                            .map((script) => script.textContent || '')
                            .join('\n');
                        const scriptUrls = scriptText.match(/https?:\/\/[^"'<>\\\s]+/g) || [];
                        const scriptedVideoUrl = scriptUrls.find((url) => isLikelyVideoUrl(url));
                        if (scriptedVideoUrl) {
                            return {
                                success: true,
                                data: {
                                    videooverview: {
                                        title: (doc.title || '').trim(),
                                        items: [{
                                            videoUrl: scriptedVideoUrl,
                                            title: (doc.title || '').trim() || undefined
                                        }]
                                    }
                                },
                                frameUrl: doc.URL
                            };
                        }

                        const iframes = Array.from(doc.querySelectorAll('iframe'));
                        for (const frame of iframes) {
                            try {
                                const frameDoc = frame.contentDocument || frame.contentWindow?.document;
                                if (!frameDoc) {
                                    continue;
                                }
                                const nestedResult = extractFromDocument(frameDoc, depth + 1);
                                if (nestedResult?.success) {
                                    return nestedResult;
                                }
                            } catch {
                                // Cross-origin frame.
                            }
                        }

                        return null;
                    };

                    const result = extractFromDocument(document, 0);
                    if (result) {
                        return result;
                    }
                    return { success: false, error: 'video_not_found', frameUrl: window.location.href };
                } catch {
                    return { success: false, error: 'script_error', frameUrl: window.location.href };
                }
            }
        });

        const success = results.find((result) => result.result?.success);
        if (success?.result?.success) {
            const raw: RawExtractResult = success.result;
            const items = raw.data?.videooverview?.items;
            if (!Array.isArray(items)) {
                return { success: false, error: 'video_not_found', raw };
            }
            const validation = validateVideoOverviewItems(items);
            if (!validation.valid) {
                return {
                    success: false,
                    error: `Invalid video overview data: ${validation.errors.join('; ')}`,
                    raw
                };
            }

            return {
                success: true,
                payload: {
                    type: 'videooverview',
                    items: items as VideoOverviewItem[],
                    source: 'notebooklm',
                    meta: {
                        title: typeof raw.data?.videooverview?.title === 'string'
                            ? raw.data.videooverview.title
                            : undefined
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
