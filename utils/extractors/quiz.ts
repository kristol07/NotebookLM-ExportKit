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

const SHUFFLE_QUIZ_ANSWERS = true;
const SHUFFLE_QUIZ_DETERMINISTIC = false;

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

    const shuffleArray = <T,>(items: T[], seed?: number): T[] => {
        const arr = items.slice();
        const random = seed !== undefined
            ? (() => {
                let state = seed >>> 0;
                return () => {
                    state = (1664525 * state + 1013904223) >>> 0;
                    return state / 0x100000000;
                };
            })()
            : Math.random;
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    };

    const hashString = (value: string): number => {
        let hash = 2166136261;
        for (let i = 0; i < value.length; i++) {
            hash ^= value.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return hash >>> 0;
    };

    const baseQuiz = raw.data.quiz as QuizItem[];
    const shuffledQuiz = SHUFFLE_QUIZ_ANSWERS
        ? baseQuiz.map((item) => ({
            ...item,
            answerOptions: item.answerOptions.length > 1
                ? shuffleArray(
                    item.answerOptions,
                    SHUFFLE_QUIZ_DETERMINISTIC ? hashString(item.question) : undefined
                )
                : item.answerOptions
        }))
        : baseQuiz;

    return {
        success: true,
        payload: {
            type: 'quiz',
            items: shuffledQuiz,
            source: 'notebooklm'
        },
        raw
    };
};

