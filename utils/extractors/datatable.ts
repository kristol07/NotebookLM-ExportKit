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
import { DataTableRow, ExportFormat, NormalizedExportPayload, validateDataTableItems } from '../export-core';
import { RawExtractResult } from './common';

export interface TypeExtractResult {
    success: boolean;
    payload?: NormalizedExportPayload<DataTableRow>;
    error?: string;
    raw?: RawExtractResult;
}

export const extractDatatable = async (tabId: number, format: ExportFormat): Promise<TypeExtractResult> => {
    try {
        const results = await browser.scripting.executeScript({
            target: { tabId, allFrames: true },
            args: [format],
            func: (formatArg: ExportFormat) => {
                try {
                    const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();

                    const parseTable = (table: HTMLTableElement) => {
                        const rows = Array.from(table.querySelectorAll('tr'))
                            .map((row) => {
                                const cells = Array.from(row.querySelectorAll('th, td'))
                                    .map((cell) => normalize(cell.textContent || ''));
                                return cells;
                            })
                            .filter((cells) => cells.some((cell) => cell.length > 0));
                        return rows;
                    };

                    const pickBestTable = (tables: HTMLTableElement[]) => {
                        let best: { rows: string[][]; score: number } | null = null;
                        for (const table of tables) {
                            const rows = parseTable(table);
                            if (rows.length === 0) continue;
                            const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0);
                            const score = rows.length * Math.max(columnCount, 1);
                            if (!best || score > best.score) {
                                best = { rows, score };
                            }
                        }
                        return best?.rows ?? [];
                    };

                    const tryExtractFromDocument = (doc: Document, depth: number): any => {
                        if (!doc || depth > 4) return null;

                        if (formatArg === 'CSV' || formatArg === 'Markdown') {
                            const viewerTable = doc.querySelector('table-viewer table') as HTMLTableElement | null;
                            if (viewerTable) {
                                const rows = parseTable(viewerTable);
                                if (rows.length > 0) {
                                    return { success: true, data: { datatable: rows }, frameUrl: doc.URL };
                                }
                            }

                            const tables = Array.from(doc.querySelectorAll('table')) as HTMLTableElement[];
                            if (tables.length > 0) {
                                const rows = pickBestTable(tables);
                                if (rows.length > 0) {
                                    return { success: true, data: { datatable: rows }, frameUrl: doc.URL };
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

                    if (formatArg === 'CSV' || formatArg === 'Markdown') {
                        const result = tryExtractFromDocument(document, 0);
                        if (result) return result;
                        return { success: false, error: 'datatable_not_found', frameUrl: window.location.href };
                    }

                    return { success: false, error: 'unsupported_format', frameUrl: window.location.href };
                } catch (error) {
                    return { success: false, error: 'script_error', frameUrl: window.location.href };
                }
            }
        });

        const success = results.find((result) => result.result?.success);
        if (success?.result?.success) {
            const raw: RawExtractResult = success.result;
            if (!raw.data || !Array.isArray(raw.data.datatable)) {
                return { success: false, error: 'datatable_not_found', raw };
            }

            const items = raw.data.datatable.map((cells: string[]) => ({ cells }));
            const validation = validateDataTableItems(items);
            if (!validation.valid) {
                return {
                    success: false,
                    error: `Invalid datatable data: ${validation.errors.join('; ')}`,
                    raw
                };
            }

            return {
                success: true,
                payload: {
                    type: 'datatable',
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

