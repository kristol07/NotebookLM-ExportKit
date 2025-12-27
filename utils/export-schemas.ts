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
