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
export type ExportFormat =
    | 'PDF'
    | 'PNG'
    | 'MP4'
    | 'CSV'
    | 'PPTX'
    | 'JSON'
    | 'HTML'
    | 'Anki'
    | 'OPML'
    | 'FreeMind'
    | 'JSONCanvas'
    | 'SVG'
    | 'Markdown'
    | 'Word'
    | 'ZIP';
export type ExportTarget = 'download' | 'drive' | 'notion';
export type ContentType =
    | 'quiz'
    | 'flashcards'
    | 'mindmap'
    | 'datatable'
    | 'note'
    | 'report'
    | 'chat'
    | 'source'
    | 'slidedeck'
    | 'infographic'
    | 'videooverview';
export type ContentSource = 'notebooklm' | 'user';
export type PdfQualityPreference = 'size' | 'clarity';

export interface ExportOptions {
    pdfQuality?: PdfQualityPreference;
}

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

export interface DataTableRow {
    cells: string[];
}

export interface SourceItem {
    title: string;
    summary?: NoteBlock[];
    keyTopics?: string[];
    content?: NoteBlock[];
}

export interface SlideDeckItem {
    imageUrl: string;
    imageDataUrl?: string;
    altText?: string;
    description?: string;
    index: number;
    aspectRatio?: number;
}

export interface InfographicItem {
    imageUrl: string;
    imageDataUrl?: string;
    altText?: string;
    description?: string;
    index: number;
}

export interface VideoOverviewItem {
    videoUrl: string;
    title?: string;
    durationSeconds?: number;
    durationLabel?: string;
}

export interface NoteInline {
    text: string;
    bold?: boolean;
    italic?: boolean;
    citation?: {
        id: string;
        source: string;
    };
}

export interface NoteParagraphBlock {
    type: 'paragraph';
    inlines: NoteInline[];
}

export interface NoteHeadingBlock {
    type: 'heading';
    level: 1 | 2 | 3;
    inlines: NoteInline[];
}

export interface NoteTableBlock {
    type: 'table';
    rows: NoteInline[][][];
}

export interface NoteCodeBlock {
    type: 'code';
    text: string;
}

export type NoteBlock = NoteParagraphBlock | NoteHeadingBlock | NoteTableBlock | NoteCodeBlock;

export type ChatRole = 'user' | 'assistant';

export interface ChatInline {
    text: string;
    bold?: boolean;
    italic?: boolean;
    citation?: {
        id: string;
        source: string;
    };
}

export interface ChatParagraphChunk {
    type: 'paragraph';
    inlines: ChatInline[];
}

export interface ChatTableChunk {
    type: 'table';
    rows: ChatInline[][][];
}

export interface ChatCodeChunk {
    type: 'code';
    text: string;
}

export type ChatMessageChunk = ChatParagraphChunk | ChatTableChunk | ChatCodeChunk;

export interface ChatMessage {
    role: ChatRole;
    content: string;
    chunks: ChatMessageChunk[];
}

export interface NormalizedExportPayload<TItems> {
    type: ContentType;
    items: TItems[];
    source: ContentSource;
    meta?: {
        svg?: string;
        title?: string;
        sources?: string[];
    };
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

export type ExportResult =
    | { success: true; count: number; filename: string; mimeType: string; blob: Blob }
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

export const validateDataTableItems = (items: unknown): ValidationResult => {
    const errors: string[] = [];
    if (!Array.isArray(items)) {
        return { valid: false, errors: ['datatable.items must be an array'] };
    }

    items.forEach((item, index) => {
        if (!isRecord(item)) {
            errors.push(`datatable.items[${index}] must be an object`);
            return;
        }
        if (!Array.isArray(item.cells)) {
            errors.push(`datatable.items[${index}].cells must be an array`);
            return;
        }
        item.cells.forEach((cell, cellIndex) => {
            if (typeof cell !== 'string') {
                errors.push(`datatable.items[${index}].cells[${cellIndex}] must be a string`);
            }
        });
    });

    return { valid: errors.length === 0, errors };
};

export const validateSourceItems = (items: unknown): ValidationResult => {
    const errors: string[] = [];
    if (!Array.isArray(items)) {
        return { valid: false, errors: ['source.items must be an array'] };
    }

    items.forEach((item, index) => {
        if (!isRecord(item)) {
            errors.push(`source.items[${index}] must be an object`);
            return;
        }
        if (!isNonEmptyString(item.title)) {
            errors.push(`source.items[${index}].title must be a non-empty string`);
        }
        if (item.summary !== undefined) {
            if (!Array.isArray(item.summary)) {
                errors.push(`source.items[${index}].summary must be an array`);
            } else {
                const summaryValidation = validateNoteBlocks(item.summary);
                if (!summaryValidation.valid) {
                    errors.push(`source.items[${index}].summary invalid: ${summaryValidation.errors.join('; ')}`);
                }
            }
        }
        if (item.keyTopics !== undefined) {
            if (!Array.isArray(item.keyTopics)) {
                errors.push(`source.items[${index}].keyTopics must be an array`);
            } else {
                (item.keyTopics as unknown[]).forEach((topic, topicIndex) => {
                    if (!isNonEmptyString(topic)) {
                        errors.push(`source.items[${index}].keyTopics[${topicIndex}] must be a non-empty string`);
                    }
                });
            }
        }
        if (item.content !== undefined) {
            if (!Array.isArray(item.content)) {
                errors.push(`source.items[${index}].content must be an array`);
            } else {
                const contentValidation = validateNoteBlocks(item.content);
                if (!contentValidation.valid) {
                    errors.push(`source.items[${index}].content invalid: ${contentValidation.errors.join('; ')}`);
                }
            }
        }
    });

    return { valid: errors.length === 0, errors };
};

export const validateSlideDeckItems = (items: unknown): ValidationResult => {
    const errors: string[] = [];
    if (!Array.isArray(items)) {
        return { valid: false, errors: ['slidedeck.items must be an array'] };
    }

    items.forEach((item, index) => {
        if (!isRecord(item)) {
            errors.push(`slidedeck.items[${index}] must be an object`);
            return;
        }
        if (!isNonEmptyString(item.imageUrl)) {
            errors.push(`slidedeck.items[${index}].imageUrl must be a non-empty string`);
        }
        if (item.imageDataUrl !== undefined && typeof item.imageDataUrl !== 'string') {
            errors.push(`slidedeck.items[${index}].imageDataUrl must be a string`);
        }
        if (item.altText !== undefined && typeof item.altText !== 'string') {
            errors.push(`slidedeck.items[${index}].altText must be a string`);
        }
        if (item.description !== undefined && typeof item.description !== 'string') {
            errors.push(`slidedeck.items[${index}].description must be a string`);
        }
        if (typeof item.index !== 'number' || !Number.isFinite(item.index)) {
            errors.push(`slidedeck.items[${index}].index must be a number`);
        }
        if (
            item.aspectRatio !== undefined
            && (typeof item.aspectRatio !== 'number' || !Number.isFinite(item.aspectRatio) || item.aspectRatio <= 0)
        ) {
            errors.push(`slidedeck.items[${index}].aspectRatio must be a positive number`);
        }
    });

    return { valid: errors.length === 0, errors };
};

export const validateInfographicItems = (items: unknown): ValidationResult => {
    const errors: string[] = [];
    if (!Array.isArray(items)) {
        return { valid: false, errors: ['infographic.items must be an array'] };
    }

    items.forEach((item, index) => {
        if (!isRecord(item)) {
            errors.push(`infographic.items[${index}] must be an object`);
            return;
        }
        if (!isNonEmptyString(item.imageUrl)) {
            errors.push(`infographic.items[${index}].imageUrl must be a non-empty string`);
        }
        if (item.imageDataUrl !== undefined && typeof item.imageDataUrl !== 'string') {
            errors.push(`infographic.items[${index}].imageDataUrl must be a string`);
        }
        if (item.altText !== undefined && typeof item.altText !== 'string') {
            errors.push(`infographic.items[${index}].altText must be a string`);
        }
        if (item.description !== undefined && typeof item.description !== 'string') {
            errors.push(`infographic.items[${index}].description must be a string`);
        }
        if (typeof item.index !== 'number' || !Number.isFinite(item.index)) {
            errors.push(`infographic.items[${index}].index must be a number`);
        }
    });

    return { valid: errors.length === 0, errors };
};

export const validateVideoOverviewItems = (items: unknown): ValidationResult => {
    const errors: string[] = [];
    if (!Array.isArray(items)) {
        return { valid: false, errors: ['videooverview.items must be an array'] };
    }

    items.forEach((item, index) => {
        if (!isRecord(item)) {
            errors.push(`videooverview.items[${index}] must be an object`);
            return;
        }
        if (!isNonEmptyString(item.videoUrl)) {
            errors.push(`videooverview.items[${index}].videoUrl must be a non-empty string`);
        }
        if (item.title !== undefined && typeof item.title !== 'string') {
            errors.push(`videooverview.items[${index}].title must be a string`);
        }
        if (
            item.durationSeconds !== undefined
            && (typeof item.durationSeconds !== 'number' || !Number.isFinite(item.durationSeconds) || item.durationSeconds < 0)
        ) {
            errors.push(`videooverview.items[${index}].durationSeconds must be a non-negative number`);
        }
        if (item.durationLabel !== undefined && typeof item.durationLabel !== 'string') {
            errors.push(`videooverview.items[${index}].durationLabel must be a string`);
        }
    });

    return { valid: errors.length === 0, errors };
};

export const validateNoteBlocks = (items: unknown): ValidationResult => {
    const errors: string[] = [];
    if (!Array.isArray(items)) {
        return { valid: false, errors: ['note.items must be an array'] };
    }

    const validateInline = (inline: unknown, path: string) => {
        if (!isRecord(inline)) {
            errors.push(`${path} must be an object`);
            return;
        }
        if (typeof inline.text !== 'string') {
            errors.push(`${path}.text must be a string`);
        }
        if (inline.bold !== undefined && typeof inline.bold !== 'boolean') {
            errors.push(`${path}.bold must be a boolean`);
        }
        if (inline.italic !== undefined && typeof inline.italic !== 'boolean') {
            errors.push(`${path}.italic must be a boolean`);
        }
        if (inline.citation !== undefined) {
            if (!isRecord(inline.citation)) {
                errors.push(`${path}.citation must be an object`);
            } else {
                if (typeof inline.citation.id !== 'string') {
                    errors.push(`${path}.citation.id must be a string`);
                }
                if (typeof inline.citation.source !== 'string') {
                    errors.push(`${path}.citation.source must be a string`);
                }
            }
        }
    };

    const validateParagraph = (block: Record<string, unknown>, path: string) => {
        if (!Array.isArray(block.inlines)) {
            errors.push(`${path}.inlines must be an array`);
            return;
        }
        (block.inlines as unknown[]).forEach((inline, index) => validateInline(inline, `${path}.inlines[${index}]`));
    };

    const validateTable = (block: Record<string, unknown>, path: string) => {
        if (!Array.isArray(block.rows)) {
            errors.push(`${path}.rows must be an array`);
            return;
        }
        (block.rows as unknown[]).forEach((row, rowIndex) => {
            if (!Array.isArray(row)) {
                errors.push(`${path}.rows[${rowIndex}] must be an array`);
                return;
            }
            (row as unknown[]).forEach((cell, cellIndex) => {
                if (!Array.isArray(cell)) {
                    errors.push(`${path}.rows[${rowIndex}][${cellIndex}] must be an array`);
                    return;
                }
                (cell as unknown[]).forEach((inline, inlineIndex) =>
                    validateInline(inline, `${path}.rows[${rowIndex}][${cellIndex}][${inlineIndex}]`)
                );
            });
        });
    };

    const validateCode = (block: Record<string, unknown>, path: string) => {
        if (typeof block.text !== 'string') {
            errors.push(`${path}.text must be a string`);
        }
    };

    items.forEach((item, index) => {
        if (!isRecord(item)) {
            errors.push(`note.items[${index}] must be an object`);
            return;
        }
        if (item.type !== 'paragraph' && item.type !== 'heading' && item.type !== 'table' && item.type !== 'code') {
            errors.push(`note.items[${index}].type must be paragraph, heading, table, or code`);
            return;
        }
        if (item.type === 'paragraph') {
            validateParagraph(item, `note.items[${index}]`);
            return;
        }
        if (item.type === 'heading') {
            if (item.level !== 1 && item.level !== 2 && item.level !== 3) {
                errors.push(`note.items[${index}].level must be 1, 2, or 3`);
                return;
            }
            validateParagraph(item, `note.items[${index}]`);
            return;
        }
        if (item.type === 'code') {
            validateCode(item, `note.items[${index}]`);
            return;
        }
        validateTable(item, `note.items[${index}]`);
    });

    return { valid: errors.length === 0, errors };
};

export const validateChatMessages = (items: unknown): ValidationResult => {
    const errors: string[] = [];
    if (!Array.isArray(items)) {
        return { valid: false, errors: ['chat.items must be an array'] };
    }

    const validateInline = (inline: unknown, path: string) => {
        if (!isRecord(inline)) {
            errors.push(`${path} must be an object`);
            return;
        }
        if (typeof inline.text !== 'string') {
            errors.push(`${path}.text must be a string`);
        }
        if (inline.bold !== undefined && typeof inline.bold !== 'boolean') {
            errors.push(`${path}.bold must be a boolean`);
        }
        if (inline.italic !== undefined && typeof inline.italic !== 'boolean') {
            errors.push(`${path}.italic must be a boolean`);
        }
        if (inline.citation !== undefined) {
            if (!isRecord(inline.citation)) {
                errors.push(`${path}.citation must be an object`);
            } else {
                if (typeof inline.citation.id !== 'string') {
                    errors.push(`${path}.citation.id must be a string`);
                }
                if (typeof inline.citation.source !== 'string') {
                    errors.push(`${path}.citation.source must be a string`);
                }
            }
        }
    };

    const validateChunk = (chunk: unknown, path: string) => {
        if (!isRecord(chunk)) {
            errors.push(`${path} must be an object`);
            return;
        }
        if (chunk.type !== 'paragraph' && chunk.type !== 'table' && chunk.type !== 'code') {
            errors.push(`${path}.type must be paragraph, table, or code`);
            return;
        }
        if (chunk.type === 'paragraph') {
            if (!Array.isArray(chunk.inlines)) {
                errors.push(`${path}.inlines must be an array`);
                return;
            }
            (chunk.inlines as unknown[]).forEach((inline, index) =>
                validateInline(inline, `${path}.inlines[${index}]`)
            );
            return;
        }
        if (chunk.type === 'code') {
            if (typeof chunk.text !== 'string') {
                errors.push(`${path}.text must be a string`);
            }
            return;
        }
        if (!Array.isArray(chunk.rows)) {
            errors.push(`${path}.rows must be an array`);
            return;
        }
        (chunk.rows as unknown[]).forEach((row, rowIndex) => {
            if (!Array.isArray(row)) {
                errors.push(`${path}.rows[${rowIndex}] must be an array`);
                return;
            }
            (row as unknown[]).forEach((cell, cellIndex) => {
                if (!Array.isArray(cell)) {
                    errors.push(`${path}.rows[${rowIndex}][${cellIndex}] must be an array`);
                    return;
                }
                (cell as unknown[]).forEach((inline, inlineIndex) =>
                    validateInline(
                        inline,
                        `${path}.rows[${rowIndex}][${cellIndex}][${inlineIndex}]`
                    )
                );
            });
        });
    };

    items.forEach((item, index) => {
        if (!isRecord(item)) {
            errors.push(`chat.items[${index}] must be an object`);
            return;
        }
        if (item.role !== 'user' && item.role !== 'assistant') {
            errors.push(`chat.items[${index}].role must be user or assistant`);
        }
        if (typeof item.content !== 'string') {
            errors.push(`chat.items[${index}].content must be a string`);
        }
        if (!Array.isArray(item.chunks)) {
            errors.push(`chat.items[${index}].chunks must be an array`);
            return;
        }
        (item.chunks as unknown[]).forEach((chunk, chunkIndex) =>
            validateChunk(chunk, `chat.items[${index}].chunks[${chunkIndex}]`)
        );
    });

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

