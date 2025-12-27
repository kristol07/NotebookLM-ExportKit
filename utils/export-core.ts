export type ExportFormat = 'PDF' | 'CSV' | 'PPTX' | 'JSON' | 'HTML' | 'Anki' | 'OPML' | 'JSONCanvas' | 'SVG';
export type ContentType = 'quiz' | 'flashcards' | 'mindmap';
export type ContentSource = 'notebooklm' | 'user';

export interface QuizAnswerOption {
    text: string;
    isCorrect: boolean;
    rationale?: string;
}

export interface QuizItem {
    question: string;
    answerOptions: QuizAnswerOption[];
    hint?: string;
}

export interface FlashcardItem {
    f: string;
    b: string;
}

export interface MindmapNode {
    id?: string;
    title: string;
    children?: MindmapNode[];
}

export interface NormalizedExportPayload<TItems> {
    type: ContentType;
    items: TItems[];
    source: ContentSource;
    meta?: {
        svg?: string;
    };
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

export type ExportResult =
    | { success: true; count: number }
    | { success: false; error: string };

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isNonEmptyString = (value: unknown): value is string => {
    return typeof value === 'string' && value.trim().length > 0;
};

export const validateQuizItems = (items: unknown): ValidationResult => {
    const errors: string[] = [];
    if (!Array.isArray(items)) {
        return { valid: false, errors: ['quiz.items must be an array'] };
    }

    items.forEach((item, index) => {
        if (!isRecord(item)) {
            errors.push(`quiz.items[${index}] must be an object`);
            return;
        }

        if (!isNonEmptyString(item.question)) {
            errors.push(`quiz.items[${index}].question must be a non-empty string`);
        }

        if (!Array.isArray(item.answerOptions)) {
            errors.push(`quiz.items[${index}].answerOptions must be an array`);
            return;
        }

        item.answerOptions.forEach((opt, optIndex) => {
            if (!isRecord(opt)) {
                errors.push(`quiz.items[${index}].answerOptions[${optIndex}] must be an object`);
                return;
            }
            if (!isNonEmptyString(opt.text)) {
                errors.push(`quiz.items[${index}].answerOptions[${optIndex}].text must be a non-empty string`);
            }
            if (typeof opt.isCorrect !== 'boolean') {
                errors.push(`quiz.items[${index}].answerOptions[${optIndex}].isCorrect must be a boolean`);
            }
            if (opt.rationale !== undefined && typeof opt.rationale !== 'string') {
                errors.push(`quiz.items[${index}].answerOptions[${optIndex}].rationale must be a string`);
            }
        });

        if (item.hint !== undefined && typeof item.hint !== 'string') {
            errors.push(`quiz.items[${index}].hint must be a string`);
        }
    });

    return { valid: errors.length === 0, errors };
};

export const validateFlashcardItems = (items: unknown): ValidationResult => {
    const errors: string[] = [];
    if (!Array.isArray(items)) {
        return { valid: false, errors: ['flashcards.items must be an array'] };
    }

    items.forEach((item, index) => {
        if (!isRecord(item)) {
            errors.push(`flashcards.items[${index}] must be an object`);
            return;
        }
        if (!isNonEmptyString(item.f)) {
            errors.push(`flashcards.items[${index}].f must be a non-empty string`);
        }
        if (!isNonEmptyString(item.b)) {
            errors.push(`flashcards.items[${index}].b must be a non-empty string`);
        }
    });

    return { valid: errors.length === 0, errors };
};

export const validateMindmapItems = (items: unknown): ValidationResult => {
    const errors: string[] = [];
    if (!Array.isArray(items)) {
        return { valid: false, errors: ['mindmap.items must be an array'] };
    }

    const validateNode = (node: unknown, path: string) => {
        if (!isRecord(node)) {
            errors.push(`${path} must be an object`);
            return;
        }

        if (!isNonEmptyString(node.title)) {
            errors.push(`${path}.title must be a non-empty string`);
        }

        if (node.id !== undefined && typeof node.id !== 'string') {
            errors.push(`${path}.id must be a string`);
        }

        if (node.children !== undefined) {
            if (!Array.isArray(node.children)) {
                errors.push(`${path}.children must be an array`);
                return;
            }
            node.children.forEach((child, index) => validateNode(child, `${path}.children[${index}]`));
        }
    };

    items.forEach((item, index) => validateNode(item, `mindmap.items[${index}]`));
    return { valid: errors.length === 0, errors };
};

export const downloadBlob = (content: string | Blob, filename: string, contentType: string) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

export const normalizeNotebookLmPayload = (
    payload: any
): { payload: NormalizedExportPayload<QuizItem | FlashcardItem | MindmapNode> | null; error?: string } => {
    if (!payload || typeof payload !== 'object') {
        return { payload: null, error: 'Invalid payload' };
    }

    if (Array.isArray(payload.quiz)) {
        const validation = validateQuizItems(payload.quiz);
        if (!validation.valid) {
            return {
                payload: null,
                error: `Invalid quiz data: ${validation.errors.join('; ')}`
            };
        }
        return {
            payload: {
                type: 'quiz',
                items: payload.quiz as QuizItem[],
                source: 'notebooklm',
            }
        };
    }

    if (Array.isArray(payload.flashcards)) {
        const validation = validateFlashcardItems(payload.flashcards);
        if (!validation.valid) {
            return {
                payload: null,
                error: `Invalid flashcards data: ${validation.errors.join('; ')}`
            };
        }
        return {
            payload: {
                type: 'flashcards',
                items: payload.flashcards as FlashcardItem[],
                source: 'notebooklm',
            }
        };
    }

    if (Array.isArray(payload.mindmap)) {
        const validation = validateMindmapItems(payload.mindmap);
        if (!validation.valid) {
            return {
                payload: null,
                error: `Invalid mindmap data: ${validation.errors.join('; ')}`
            };
        }
        return {
            payload: {
                type: 'mindmap',
                items: payload.mindmap as MindmapNode[],
                source: 'notebooklm',
            }
        };
    }

    return { payload: null };
};
