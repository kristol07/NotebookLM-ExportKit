import { ExportFormat, NormalizedExportPayload, QuizItem, FlashcardItem } from '../export-core';
import { extractQuiz } from './quiz';
import { extractFlashcards } from './flashcards';

type ExtractPayload =
    | NormalizedExportPayload<QuizItem>
    | NormalizedExportPayload<FlashcardItem>;

export type AnyExtractResult = {
    success: boolean;
    payload?: ExtractPayload;
    error?: string;
};

export const extractByType = async (
    type: 'quiz' | 'flashcards',
    tabId: number,
    format: ExportFormat
): Promise<AnyExtractResult> => {
    const result = type === 'quiz' ? await extractQuiz(tabId, format) : await extractFlashcards(tabId, format);
    if (result.success && result.payload) {
        return { success: true, payload: result.payload };
    }
    return { success: false, error: result.error };
};

export const extractByAnyType = async (tabId: number, format: ExportFormat): Promise<AnyExtractResult> => {
    const quizResult = await extractQuiz(tabId, format);
    if (quizResult.success && quizResult.payload) {
        return { success: true, payload: quizResult.payload };
    }

    const flashcardResult = await extractFlashcards(tabId, format);
    if (flashcardResult.success && flashcardResult.payload) {
        return { success: true, payload: flashcardResult.payload };
    }

    return { success: false, error: flashcardResult.error || quizResult.error };
};
