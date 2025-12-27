import { ContentType, ExportFormat, ExportResult, FlashcardItem, QuizItem } from './export-core';
import { exportFlashcards } from './flashcard-export';
import { exportQuiz } from './quiz-export';

export const supportedFormatsByType: Record<ContentType, ExportFormat[]> = {
    quiz: ['CSV', 'JSON', 'HTML', 'Anki'],
    flashcards: ['CSV', 'JSON', 'HTML', 'Anki']
};

export const exportByType = (
    type: ContentType,
    items: QuizItem[] | FlashcardItem[],
    format: ExportFormat,
    tabTitle: string,
    timestamp: string
): ExportResult => {
    const supported = supportedFormatsByType[type] || [];
    if (!supported.includes(format)) {
        return { success: false, error: `Format ${format} is not supported for ${type}.` };
    }

    if (type === 'quiz') {
        return exportQuiz(items as QuizItem[], format, tabTitle, timestamp);
    }

    return exportFlashcards(items as FlashcardItem[], format, tabTitle, timestamp);
};
