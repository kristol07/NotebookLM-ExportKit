import { ContentType, ExportFormat, NormalizedExportPayload, QuizItem, FlashcardItem, MindmapNode, DataTableRow } from '../export-core';
import { extractQuiz } from './quiz';
import { extractFlashcards } from './flashcards';
import { extractMindmap } from './mindmap';
import { extractDatatable } from './datatable';

type ExtractPayload =
    | NormalizedExportPayload<QuizItem>
    | NormalizedExportPayload<FlashcardItem>
    | NormalizedExportPayload<MindmapNode>
    | NormalizedExportPayload<DataTableRow>;

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
            : type === 'mindmap'
            ? await extractMindmap(tabId, format)
            : await extractDatatable(tabId, format);
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

    const datatableResult = await extractDatatable(tabId, format);
    if (datatableResult.success && datatableResult.payload) {
        return { success: true, payload: datatableResult.payload };
    }

    return { success: false, error: datatableResult.error || mindmapResult.error || flashcardResult.error || quizResult.error };
};
