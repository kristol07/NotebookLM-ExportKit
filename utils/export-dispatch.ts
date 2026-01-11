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
import { exportQuiz } from './quiz-export';
import { exportChat } from './chat-export';
import { exportSources } from './source-export';

export const supportedFormatsByType: Record<ContentType, ExportFormat[]> = {
    quiz: ['CSV', 'JSON', 'HTML', 'Anki'],
    flashcards: ['CSV', 'JSON', 'HTML', 'Anki'],
    mindmap: ['HTML', 'OPML', 'FreeMind', 'JSONCanvas', 'SVG', 'Markdown'],
    datatable: ['CSV', 'Markdown'],
    note: ['Word', 'Markdown', 'PDF'],
    chat: ['PDF', 'Word', 'JSON', 'Markdown'],
    source: ['Markdown']
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

    if (type === 'chat') {
        return exportChat(items as ChatMessage[], format, tabTitle, timestamp, options);
    }

    if (type === 'source') {
        return exportSources(items as SourceItem[], format, tabTitle, timestamp);
    }

    return exportDatatable(items as DataTableRow[], format, tabTitle, timestamp);
};
