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
import { ExportFormat, NormalizedExportPayload, QuizItem, validateQuizItems } from '../export-core';
import { extractNotebookLmPayload, RawExtractResult } from './common';

export interface TypeExtractResult {
    success: boolean;
    payload?: NormalizedExportPayload<QuizItem>;
    error?: string;
    raw?: RawExtractResult;
}

export const extractQuiz = async (tabId: number, format: ExportFormat): Promise<TypeExtractResult> => {
    const raw = await extractNotebookLmPayload(tabId, format);
    if (!raw) {
        return { success: false, error: 'script_error' };
    }

    if (!raw.success) {
        return { success: false, error: raw.error, raw };
    }

    if (!raw.data || !Array.isArray(raw.data.quiz)) {
        return { success: false, error: 'quiz_not_found', raw };
    }

    const validation = validateQuizItems(raw.data.quiz);
    if (!validation.valid) {
        return { success: false, error: `Invalid quiz data: ${validation.errors.join('; ')}`, raw };
    }

    return {
        success: true,
        payload: {
            type: 'quiz',
            items: raw.data.quiz as QuizItem[],
            source: 'notebooklm'
        },
        raw
    };
};

