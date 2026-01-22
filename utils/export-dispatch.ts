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
import {
    ContentType,
    DataTableRow,
    ExportFormat,
    ExportOptions,
    ExportResult,
    FlashcardItem,
    ChatMessage,
    MindmapNode,
    NoteBlock,
    QuizItem,
    SourceItem
} from './export-core';
import { exportDatatable } from './datatable-export';
import { exportFlashcards } from './flashcard-export';
import { exportMindmap } from './mindmap-export';
import { exportNote } from './note-export';
import { exportReport } from './report-export';
import { exportQuiz } from './quiz-export';
import { exportChat } from './chat-export';
import { exportSources } from './source-export';

export const supportedFormatsByType: Record<ContentType, ExportFormat[]> = {
    quiz: ['CSV', 'JSON', 'HTML', 'Anki'],
    flashcards: ['CSV', 'JSON', 'HTML', 'Anki'],
    mindmap: ['HTML', 'OPML', 'FreeMind', 'JSONCanvas', 'SVG', 'Markdown'],
    datatable: ['CSV', 'Markdown'],
    note: ['Word', 'Markdown', 'PDF'],
    report: ['Word', 'Markdown', 'PDF'],
    chat: ['PDF', 'Word', 'JSON', 'Markdown'],
    source: ['Word', 'Markdown', 'PDF']
};

export const exportByType = async (
    type: ContentType,
    items: QuizItem[] | FlashcardItem[] | MindmapNode[] | DataTableRow[] | NoteBlock[] | ChatMessage[] | SourceItem[],
    format: ExportFormat,
    tabTitle: string,
    timestamp: string,
    meta?: { svg?: string; title?: string },
    options?: ExportOptions
): Promise<ExportResult> => {
    const supported = supportedFormatsByType[type] || [];
    if (!supported.includes(format)) {
        return { success: false, error: `Format ${format} is not supported for ${type}.` };
    }

    if (type === 'quiz') {
        return exportQuiz(items as QuizItem[], format, tabTitle, timestamp);
    }

    if (type === 'flashcards') {
        return exportFlashcards(items as FlashcardItem[], format, tabTitle, timestamp);
    }

    if (type === 'mindmap') {
        return exportMindmap(items as MindmapNode[], format, tabTitle, timestamp, meta?.svg);
    }

    if (type === 'note') {
        return exportNote(items as NoteBlock[], format, tabTitle, timestamp, meta?.title, options);
    }

    if (type === 'report') {
        return exportReport(items as NoteBlock[], format, tabTitle, timestamp, meta?.title, options);
    }

    if (type === 'chat') {
        return exportChat(items as ChatMessage[], format, tabTitle, timestamp, options);
    }

    if (type === 'source') {
        return exportSources(items as SourceItem[], format, tabTitle, timestamp, options);
    }

    return exportDatatable(items as DataTableRow[], format, tabTitle, timestamp);
};

