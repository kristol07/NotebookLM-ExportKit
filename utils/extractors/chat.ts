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
import { browser } from 'wxt/browser';
import {
    ChatMessage,
    ChatMessageChunk,
    ExportFormat,
    NormalizedExportPayload,
    validateChatMessages
} from '../export-core';
import { RawExtractResult } from './common';

export interface TypeExtractResult {
    success: boolean;
    payload?: NormalizedExportPayload<ChatMessage>;
    error?: string;
    raw?: RawExtractResult;
}

export const extractChat = async (tabId: number, format: ExportFormat): Promise<TypeExtractResult> => {
    try {
        const results = await browser.scripting.executeScript({
            target: { tabId, allFrames: true },
            args: [format],
            func: (formatArg: ExportFormat) => {
                try {
                    if (formatArg !== 'JSON' && formatArg !== 'PDF' && formatArg !== 'Word' && formatArg !== 'Markdown') {
                        return { success: false, error: 'unsupported_format', frameUrl: window.location.href };
                    }

                    const chatRoot = document.querySelector('chat-panel') || document.querySelector('labs-tailwind-root');
                    if (!chatRoot) {
                        return { success: false, error: 'chat_not_found', frameUrl: window.location.href };
                    }

                    const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

                    const trimInlines = (
                        inlines: { text: string; bold?: boolean; italic?: boolean; citation?: { id: string; source: string } }[]
                    ) => {
                        if (inlines.length === 0) return inlines;
                        inlines[0].text = inlines[0].text.replace(/^\s+/, '');
                        if (inlines.length > 0) {
                            inlines[inlines.length - 1].text = inlines[inlines.length - 1].text.replace(/\s+$/, '');
                        }
                        return inlines.filter((inline) => inline.text.length > 0 || inline.citation);
                    };

                    const formatCitation = (ariaLabel?: string | null, fallback?: string | null) => {
                        const label = ariaLabel?.trim();
                        if (label) {
                            const match = label.match(/^(\d+)\s*:\s*(.+)$/);
                            if (match) {
                                return { id: match[1], source: match[2] };
                            }
                            return { id: label, source: label };
                        }
                        const text = fallback?.trim();
                        if (text) {
                            return { id: text, source: text };
                        }
                        return null;
                    };

                    const pushInline = (
                        inlines: { text: string; bold?: boolean; italic?: boolean; citation?: { id: string; source: string } }[],
                        text: string,
                        style: { bold?: boolean; italic?: boolean }
                    ) => {
                        const normalized = normalizeWhitespace(text);
                        if (normalized.trim().length === 0) {
                            return;
                        }
                        const last = inlines[inlines.length - 1];
                        if (last && !last.citation && last.bold === style.bold && last.italic === style.italic) {
                            last.text += normalized;
                            return;
                        }
                        inlines.push({ text: normalized, bold: style.bold, italic: style.italic });
                    };

                    const collectInlines = (element: Element) => {
                        const inlines: { text: string; bold?: boolean; italic?: boolean; citation?: { id: string; source: string } }[] = [];
                        const walk = (node: Node, style: { bold?: boolean; italic?: boolean }) => {
                            if (node.nodeType === Node.TEXT_NODE) {
                                pushInline(inlines, node.textContent || '', style);
                                return;
                            }
                            if (node.nodeType !== Node.ELEMENT_NODE) {
                                return;
                            }
                            const el = node as HTMLElement;
                            if (el.matches('span[aria-label]')) {
                                const ariaLabel = el.getAttribute('aria-label');
                                if (ariaLabel && /^\d+\s*:/.test(ariaLabel)) {
                                    const citation = formatCitation(ariaLabel, el.textContent);
                                    if (citation) {
                                        inlines.push({ text: '', ...style, citation });
                                    }
                                    return;
                                }
                            }

                            const nextStyle = { ...style };
                            if (el.tagName === 'B' || el.tagName === 'STRONG') {
                                nextStyle.bold = true;
                            }
                            if (el.tagName === 'I' || el.tagName === 'EM') {
                                nextStyle.italic = true;
                            }
                            el.childNodes.forEach((child) => walk(child, nextStyle));
                        };

                        element.childNodes.forEach((child) => walk(child, {}));
                        return trimInlines(inlines);
                    };

                    const collectCodeText = (element: Element) => {
                        const codeElement = element.querySelector('code') || element;
                        const rawText = codeElement.textContent || '';
                        return rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n+$/, '');
                    };

                    const inlineToText = (inline: { text: string; citation?: { id: string } }) =>
                        inline.citation ? `[${inline.citation.id}]` : inline.text;

                    const blockToText = (block: ChatMessageChunk) => {
                        if (block.type === 'paragraph') {
                            return block.inlines.map(inlineToText).join('');
                        }
                        if (block.type === 'code') {
                            return block.text;
                        }
                        return block.rows
                            .map((row) => row.map((cell) => cell.map(inlineToText).join('')).join(' | '))
                            .join('\n');
                    };

                    const isAssistantMessage = (message: Element) =>
                        Boolean(
                            message.querySelector(
                                '.to-user-container, .to-user-message-card-content, .to-user-message-inner-content'
                            )
                        );

                    const parseMessage = (message: Element): ChatMessage | null => {
                        const contentRoot =
                            message.querySelector('.message-text-content') ||
                            message.querySelector('mat-card-content') ||
                            message;

                        const elements = Array.from(
                            contentRoot.querySelectorAll('div.paragraph, table, pre, p')
                        );
                        const chunks: ChatMessageChunk[] = [];

                        for (const element of elements) {
                            if (element.tagName === 'TABLE') {
                                const rows = Array.from(element.querySelectorAll('tr'))
                                    .map((row) => {
                                        const cells = Array.from(row.querySelectorAll('th, td')).map((cell) =>
                                            collectInlines(cell)
                                        );
                                        return cells;
                                    })
                                    .filter((row) => row.some((cell) => cell.length > 0));
                                if (rows.length > 0) {
                                    chunks.push({ type: 'table', rows });
                                }
                                continue;
                            }

                            if (element.tagName === 'PRE') {
                                if (element.closest('table')) {
                                    continue;
                                }
                                const text = collectCodeText(element);
                                if (text.length > 0) {
                                    chunks.push({ type: 'code', text });
                                }
                                continue;
                            }

                            if (element.closest('table')) {
                                continue;
                            }

                            if (element.tagName === 'P' && element.closest('div.paragraph')) {
                                continue;
                            }

                            const inlines = collectInlines(element);
                            if (inlines.length > 0) {
                                chunks.push({ type: 'paragraph', inlines });
                            }
                        }

                        if (chunks.length === 0) {
                            const fallbackText = normalizeWhitespace(contentRoot.textContent || '');
                            if (fallbackText.length > 0) {
                                chunks.push({ type: 'paragraph', inlines: [{ text: fallbackText }] });
                            }
                        }

                        if (chunks.length === 0) {
                            return null;
                        }

                        const content = chunks.map((chunk) => blockToText(chunk)).filter(Boolean).join('\n\n');
                        return {
                            role: isAssistantMessage(message) ? 'assistant' : 'user',
                            content,
                            chunks
                        };
                    };

                    const messages = Array.from(document.querySelectorAll('chat-message'))
                        .map((message) => parseMessage(message))
                        .filter((message): message is ChatMessage => Boolean(message));

                    if (messages.length === 0) {
                        return { success: false, error: 'chat_not_found', frameUrl: window.location.href };
                    }

                    return {
                        success: true,
                        data: {
                            chat: {
                                messages
                            }
                        },
                        frameUrl: window.location.href
                    };
                } catch (error) {
                    return { success: false, error: 'script_error', frameUrl: window.location.href };
                }
            }
        });

        const success = results.find((result) => result.result?.success);
        if (success?.result?.success) {
            const raw: RawExtractResult = success.result;
            const messages = raw.data?.chat?.messages;
            if (!Array.isArray(messages)) {
                return { success: false, error: 'chat_not_found', raw };
            }

            const validation = validateChatMessages(messages);
            if (!validation.valid) {
                return {
                    success: false,
                    error: `Invalid chat data: ${validation.errors.join('; ')}`,
                    raw
                };
            }

            return {
                success: true,
                payload: {
                    type: 'chat',
                    items: messages,
                    source: 'notebooklm'
                },
                raw
            };
        }

        const firstResult = results.find((result) => result.result)?.result;
        return {
            success: false,
            error: firstResult?.error || 'no_results',
            raw: firstResult
        };
    } catch (error) {
        return { success: false, error: 'script_error' };
    }
};

