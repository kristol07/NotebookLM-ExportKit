import { ContentType, DataTableRow, ExportFormat, ExportResult, FlashcardItem, MindmapNode, QuizItem } from './export-core';
import { exportDatatable } from './datatable-export';
import { exportFlashcards } from './flashcard-export';
import { exportMindmap } from './mindmap-export';
import { exportQuiz } from './quiz-export';

export const supportedFormatsByType: Record<ContentType, ExportFormat[]> = {
    quiz: ['CSV', 'JSON', 'HTML', 'Anki'],
    flashcards: ['CSV', 'JSON', 'HTML', 'Anki'],
    mindmap: ['OPML', 'JSONCanvas', 'SVG', 'Markdown'],
    datatable: ['CSV', 'Markdown']
};

export const exportByType = (
    type: ContentType,
    items: QuizItem[] | FlashcardItem[] | MindmapNode[] | DataTableRow[],
    format: ExportFormat,
    tabTitle: string,
    timestamp: string,
    meta?: { svg?: string }
): ExportResult => {
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

    return exportDatatable(items as DataTableRow[], format, tabTitle, timestamp);
};
