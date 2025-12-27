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
