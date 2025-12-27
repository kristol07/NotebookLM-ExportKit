import { ContentType, ExportFormat, NormalizedExportPayload, QuizItem, FlashcardItem, MindmapNode } from '../export-core';
import { extractQuiz } from './quiz';
import { extractFlashcards } from './flashcards';
import { extractMindmap } from './mindmap';

type ExtractPayload =
    | NormalizedExportPayload<QuizItem>
    | NormalizedExportPayload<FlashcardItem>
    | NormalizedExportPayload<MindmapNode>;

export type AnyExtractResult = {
    success: boolean;
    payload?: ExtractPayload;
    error?: string;
};

export const extractByType = async (
    type: ContentType,
    tabId: number,
    format: ExportFormat
): Promise<AnyExtractResult> => {
    const result =
        type === 'quiz'
            ? await extractQuiz(tabId, format)
            : type === 'flashcards'
            ? await extractFlashcards(tabId, format)
            : await extractMindmap(tabId, format);
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

    const mindmapResult = await extractMindmap(tabId, format);
    if (mindmapResult.success && mindmapResult.payload) {
        return { success: true, payload: mindmapResult.payload };
    }

    return { success: false, error: mindmapResult.error || flashcardResult.error || quizResult.error };
};
