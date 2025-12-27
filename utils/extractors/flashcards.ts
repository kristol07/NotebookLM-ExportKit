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
