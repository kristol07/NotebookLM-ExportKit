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
import { ContentType, ExportFormat, NormalizedExportPayload, QuizItem, FlashcardItem, MindmapNode, DataTableRow, NoteBlock, ChatMessage, SourceItem, SlideDeckItem, InfographicItem } from '../export-core';
import { extractQuiz } from './quiz';
import { extractFlashcards } from './flashcards';
import { extractMindmap } from './mindmap';
import { extractDatatable } from './datatable';
import { extractNote } from './note';
import { extractReport } from './report';
import { extractChat } from './chat';
import { extractSource } from './source';
import { extractSlideDeck } from './slidedeck';
import { extractInfographic } from './infographic';

type ExtractPayload =
    | NormalizedExportPayload<QuizItem>
    | NormalizedExportPayload<FlashcardItem>
    | NormalizedExportPayload<MindmapNode>
    | NormalizedExportPayload<DataTableRow>
    | NormalizedExportPayload<NoteBlock>
    | NormalizedExportPayload<ChatMessage>
    | NormalizedExportPayload<SourceItem>
    | NormalizedExportPayload<SlideDeckItem>
    | NormalizedExportPayload<InfographicItem>;

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
            : type === 'note'
            ? await extractNote(tabId, format)
            : type === 'report'
            ? await extractReport(tabId, format)
            : type === 'chat'
            ? await extractChat(tabId, format)
            : type === 'source'
            ? await extractSource(tabId, format)
            : type === 'slidedeck'
            ? await extractSlideDeck(tabId, format)
            : type === 'infographic'
            ? await extractInfographic(tabId, format)
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

    const reportResult = await extractReport(tabId, format);
    if (reportResult.success && reportResult.payload) {
        return { success: true, payload: reportResult.payload };
    }

    const noteResult = await extractNote(tabId, format);
    if (noteResult.success && noteResult.payload) {
        return { success: true, payload: noteResult.payload };
    }

    const chatResult = await extractChat(tabId, format);
    if (chatResult.success && chatResult.payload) {
        return { success: true, payload: chatResult.payload };
    }

    const sourceResult = await extractSource(tabId, format);
    if (sourceResult.success && sourceResult.payload) {
        return { success: true, payload: sourceResult.payload };
    }

    const slideDeckResult = await extractSlideDeck(tabId, format);
    if (slideDeckResult.success && slideDeckResult.payload) {
        return { success: true, payload: slideDeckResult.payload };
    }

    const infographicResult = await extractInfographic(tabId, format);
    if (infographicResult.success && infographicResult.payload) {
        return { success: true, payload: infographicResult.payload };
    }

    const datatableResult = await extractDatatable(tabId, format);
    if (datatableResult.success && datatableResult.payload) {
        return { success: true, payload: datatableResult.payload };
    }

    return {
        success: false,
        error:
            chatResult.error ||
            reportResult.error ||
            sourceResult.error ||
            slideDeckResult.error ||
            infographicResult.error ||
            noteResult.error ||
            datatableResult.error ||
            mindmapResult.error ||
            flashcardResult.error ||
            quizResult.error
    };
};

