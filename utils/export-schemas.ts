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
export const quizExportSchema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    required: ['type', 'items'],
    additionalProperties: false,
    properties: {
        type: { const: 'quiz' },
        items: {
            type: 'array',
            items: {
                type: 'object',
                required: ['question', 'answerOptions'],
                additionalProperties: false,
                properties: {
                    question: { type: 'string' },
                    hint: { type: 'string' },
                    answerOptions: {
                        type: 'array',
                        items: {
                            type: 'object',
                            required: ['text', 'isCorrect'],
                            additionalProperties: false,
                            properties: {
                                text: { type: 'string' },
                                isCorrect: { type: 'boolean' },
                                rationale: { type: 'string' }
                            }
                        }
                    }
                }
            }
        }
    }
} as const;

export const flashcardsExportSchema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    required: ['type', 'items'],
    additionalProperties: false,
    properties: {
        type: { const: 'flashcards' },
        items: {
            type: 'array',
            items: {
                type: 'object',
                required: ['f', 'b'],
                additionalProperties: false,
                properties: {
                    f: { type: 'string' },
                    b: { type: 'string' }
                }
            }
        }
    }
} as const;

export const mindmapExportSchema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    required: ['type', 'items'],
    additionalProperties: false,
    properties: {
        type: { const: 'mindmap' },
        items: {
            type: 'array',
            items: {
                type: 'object',
                required: ['title'],
                additionalProperties: false,
                properties: {
                    id: { type: 'string' },
                    title: { type: 'string' },
                    children: { $ref: '#/$defs/mindmapNodes' }
                }
            }
        }
    },
    $defs: {
        mindmapNodes: {
            type: 'array',
            items: {
                type: 'object',
                required: ['title'],
                additionalProperties: false,
                properties: {
                    id: { type: 'string' },
                    title: { type: 'string' },
                    children: { $ref: '#/$defs/mindmapNodes' }
                }
            }
        }
    }
} as const;

