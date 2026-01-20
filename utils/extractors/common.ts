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
import { ExportFormat } from '../export-core';

export interface RawExtractResult {
    success: boolean;
    data?: any;
    error?: string;
    frameUrl?: string;
}

export const extractNotebookLmPayload = async (tabId: number, format: ExportFormat): Promise<RawExtractResult | null> => {
    try {
        const results = await browser.scripting.executeScript({
            target: { tabId, allFrames: true },
            args: [format],
            func: (formatArg: ExportFormat) => {
                try {
                    const decodeDataAttribute = (raw: string) => {
                        const txt = document.createElement('textarea');
                        txt.innerHTML = raw;
                        return txt.value;
                    };

                    const tryExtractFromDocument = (doc: Document, depth: number): any => {
                        if (!doc || depth > 4) return null;

                        if (formatArg === 'CSV' || formatArg === 'JSON' || formatArg === 'HTML' || formatArg === 'Anki') {
                            const dataElement = doc.querySelector('[data-app-data]');
                            if (dataElement) {
                                const rawData = dataElement.getAttribute('data-app-data');
                                if (!rawData) {
                                    return { success: false, error: 'empty_data', frameUrl: doc.URL };
                                }

                                const jsonString = decodeDataAttribute(rawData);
                                try {
                                    const jsonData = JSON.parse(jsonString);
                                    return { success: true, data: jsonData, frameUrl: doc.URL };
                                } catch (parseErr) {
                                    return { success: false, error: 'parse_error', frameUrl: doc.URL };
                                }
                            }
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

                    if (formatArg === 'CSV' || formatArg === 'JSON' || formatArg === 'HTML' || formatArg === 'Anki') {
                        const result = tryExtractFromDocument(document, 0);
                        if (result) return result;
                        return { success: false, error: 'not_found', frameUrl: window.location.href };
                    }

                    const content = document.body.innerText;
                    if (content.length > 500) {
                        return { success: true, data: content.substring(0, 100) + '...', frameUrl: window.location.href };
                    }

                    return { success: false, error: 'not_found', frameUrl: window.location.href };
                } catch (error) {
                    return { success: false, error: 'script_error', frameUrl: window.location.href };
                }
            }
        });

        const success = results.find((result) => result.result?.success);
        if (success?.result?.success) {
            return success.result;
        }

        return results.find((result) => result.result)?.result ?? null;
    } catch (error) {
        return null;
    }
};

