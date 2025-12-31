import { browser } from 'wxt/browser';
import { ExportFormat, NormalizedExportPayload, NoteBlock, validateNoteBlocks } from '../export-core';
import { RawExtractResult } from './common';

export interface TypeExtractResult {
    success: boolean;
    payload?: NormalizedExportPayload<NoteBlock>;
    error?: string;
    raw?: RawExtractResult;
}

export const extractNote = async (tabId: number, format: ExportFormat): Promise<TypeExtractResult> => {
    try {
        const results = await browser.scripting.executeScript({
            target: { tabId, allFrames: true },
            args: [format],
            func: (formatArg: ExportFormat) => {
                try {
                    if (formatArg !== 'Markdown' && formatArg !== 'Word' && formatArg !== 'PDF') {
                        return { success: false, error: 'unsupported_format', frameUrl: window.location.href };
                    }

                    const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ');

                    const trimInlines = (inlines: { text: string; bold?: boolean; italic?: boolean; citation?: { id: string; source: string } }[]) => {
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

                    const root =
                        document.querySelector('note-editor') ||
                        document.querySelector('labs-tailwind-doc-viewer') ||
                        document.body;

                    if (!root) {
                        return { success: false, error: 'note_not_found', frameUrl: window.location.href };
                    }

                    const titleInput = root.querySelector('input[aria-label="note title editable"]') as
                        | HTMLInputElement
                        | null;
                    const title = titleInput?.value?.trim() || '';

                    const elements = Array.from(root.querySelectorAll('div.paragraph, table, pre'));
                    const blocks: NoteBlock[] = [];

                    for (const element of elements) {
                        if (element.tagName === 'TABLE') {
                            const rows = Array.from(element.querySelectorAll('tr'))
                                .map((row) => {
                                    const cells = Array.from(row.querySelectorAll('th, td')).map((cell) => collectInlines(cell));
                                    return cells;
                                })
                                .filter((row) => row.some((cell) => cell.length > 0));
                            if (rows.length > 0) {
                                blocks.push({ type: 'table', rows });
                            }
                            continue;
                        }

                        if (element.tagName === 'PRE') {
                            if (element.closest('table')) {
                                continue;
                            }
                            const text = collectCodeText(element);
                            if (text.length > 0) {
                                blocks.push({ type: 'code', text });
                            }
                            continue;
                        }

                        if (element.closest('table')) {
                            continue;
                        }

                        const inlines = collectInlines(element);
                        if (inlines.length > 0) {
                            blocks.push({ type: 'paragraph', inlines });
                        }
                    }

                    if (blocks.length === 0) {
                        return { success: false, error: 'note_not_found', frameUrl: window.location.href };
                    }

                    return {
                        success: true,
                        data: {
                            note: {
                                title,
                                blocks
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
            if (!raw.data?.note || !Array.isArray(raw.data.note.blocks)) {
                return { success: false, error: 'note_not_found', raw };
            }

            const items = raw.data.note.blocks as NoteBlock[];
            const validation = validateNoteBlocks(items);
            if (!validation.valid) {
                return {
                    success: false,
                    error: `Invalid note data: ${validation.errors.join('; ')}`,
                    raw
                };
            }

            return {
                success: true,
                payload: {
                    type: 'note',
                    items,
                    source: 'notebooklm',
                    meta: {
                        title: typeof raw.data.note.title === 'string' ? raw.data.note.title : undefined
                    }
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
