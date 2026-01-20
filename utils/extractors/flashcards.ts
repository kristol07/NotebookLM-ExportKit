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
import { ExportFormat, FlashcardItem, NormalizedExportPayload, validateFlashcardItems } from '../export-core';
import { extractNotebookLmPayload, RawExtractResult } from './common';

export interface TypeExtractResult {
    success: boolean;
    payload?: NormalizedExportPayload<FlashcardItem>;
    error?: string;
    raw?: RawExtractResult;
}

export const extractFlashcards = async (tabId: number, format: ExportFormat): Promise<TypeExtractResult> => {
    const raw = await extractNotebookLmPayload(tabId, format);
    if (!raw) {
        return { success: false, error: 'script_error' };
    }

    if (!raw.success) {
        return { success: false, error: raw.error, raw };
    }

    if (!raw.data || !Array.isArray(raw.data.flashcards)) {
        return { success: false, error: 'flashcards_not_found', raw };
    }

    const validation = validateFlashcardItems(raw.data.flashcards);
    if (!validation.valid) {
        return { success: false, error: `Invalid flashcards data: ${validation.errors.join('; ')}`, raw };
    }

    return {
        success: true,
        payload: {
            type: 'flashcards',
            items: raw.data.flashcards as FlashcardItem[],
            source: 'notebooklm'
        },
        raw
    };
};

