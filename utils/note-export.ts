import { downloadBlob, ExportFormat, ExportResult, NoteBlock, NoteInline } from './export-core';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
    AlignmentType,
    BorderStyle,
    Document,
    HeadingLevel,
    LineRuleType,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType
} from 'docx';

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const escapeMarkdown = (value: string, forTable: boolean) => {
    let text = value
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\*/g, '\\*')
        .replace(/_/g, '\\_');
    if (forTable) {
        text = text.replace(/\|/g, '\\|');
    }
    return text;
};

const renderInlineHtml = (
    inline: NoteInline,
    references: Map<string, string>,
    referenceOrder: string[]
) => {
    if (inline.citation) {
        const key = inline.citation.id;
        if (!references.has(key)) {
            references.set(key, inline.citation.source);
            referenceOrder.push(key);
        }
        return `<sup class="note-citation">[${escapeHtml(key)}]</sup>`;
    }
    let content = escapeHtml(inline.text);
    if (inline.bold && inline.italic) {
        content = `<strong><em>${content}</em></strong>`;
    } else if (inline.bold) {
        content = `<strong>${content}</strong>`;
    } else if (inline.italic) {
        content = `<em>${content}</em>`;
    }
    return content;
};

const renderInlineMarkdown = (
    inline: NoteInline,
    forTable: boolean,
    footnotes: Map<string, string>,
    footnoteOrder: string[]
) => {
    if (inline.citation) {
        const key = inline.citation.id;
        if (!footnotes.has(key)) {
            footnotes.set(key, inline.citation.source);
            footnoteOrder.push(key);
        }
        return `[^${key}]`;
    }
    let content = escapeMarkdown(inline.text, forTable);
    if (inline.bold && inline.italic) {
        content = `***${content}***`;
    } else if (inline.bold) {
        content = `**${content}**`;
    } else if (inline.italic) {
        content = `*${content}*`;
    }
    return content;
};

const renderParagraphMarkdown = (inlines: NoteInline[], footnotes: Map<string, string>, footnoteOrder: string[]) => {
    const content = inlines.map((inline) => renderInlineMarkdown(inline, false, footnotes, footnoteOrder)).join('');
    return content.trim().length > 0 ? content.trim() : '';
};

const renderParagraphHtml = (
    inlines: NoteInline[],
    references: Map<string, string>,
    referenceOrder: string[]
) => {
    const content = inlines.map((inline) => renderInlineHtml(inline, references, referenceOrder)).join('');
    return content.trim().length > 0 ? `<p>${content.trim()}</p>` : '';
};

const renderTableMarkdown = (rows: NoteInline[][][], footnotes: Map<string, string>, footnoteOrder: string[]) => {
    if (rows.length === 0) return '';
    const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0);
    const normalizeRow = (row: NoteInline[][]) => {
        const cells = row.slice();
        while (cells.length < columnCount) {
            cells.push([]);
        }
        return cells;
    };

    const renderRow = (row: NoteInline[][]) =>
        `| ${normalizeRow(row).map((cell) => cell.map((inline) => renderInlineMarkdown(inline, true, footnotes, footnoteOrder)).join('').trim()).join(' | ')} |`;

    const header = renderRow(rows[0]);
    const separator = `| ${Array.from({ length: columnCount }).map(() => '---').join(' | ')} |`;
    const body = rows.slice(1).map(renderRow);
    return [header, separator, ...body].join('\n');
};

const renderTableHtml = (rows: NoteInline[][][], references: Map<string, string>, referenceOrder: string[]) => {
    const bodyRows = rows
        .map((row) => {
            const cells = row
                .map(
                    (cell) =>
                        `<td>${cell.map((inline) => renderInlineHtml(inline, references, referenceOrder)).join('').trim()}</td>`
                )
                .join('');
            return `<tr>${cells}</tr>`;
        })
        .join('');
    return `<table><tbody>${bodyRows}</tbody></table>`;
};

const renderCodeMarkdown = (text: string) => {
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n+$/, '');
    return `\`\`\`\n${normalized}\n\`\`\``;
};

const renderCodeHtml = (text: string) => {
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    return `<pre><code>${escapeHtml(normalized)}</code></pre>`;
};

const DOCX_BODY_RUN = { font: 'Times New Roman', size: 24 };
const DOCX_TITLE_RUN = { font: 'Times New Roman', size: 32, bold: true };
const DOCX_HEADING_RUN = { font: 'Times New Roman', size: 26, bold: true };
const DOCX_CODE_RUN = { font: 'Consolas', size: 22 };
const DOCX_PARAGRAPH_SPACING = { after: 160, line: 276, lineRule: LineRuleType.AUTO };
const DOCX_CODE_SPACING = { after: 160, line: 240, lineRule: LineRuleType.AUTO };
const DOCX_TABLE_BORDERS = {
    top: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
    left: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
    right: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '999999' }
};
const DOCX_TABLE_MARGINS = {
    marginUnitType: WidthType.DXA,
    top: 80,
    bottom: 80,
    left: 120,
    right: 120
};

const PDF_PAGE_WIDTH_PX = 794;
const PDF_PAGE_HEIGHT_PX = 1123;
const PDF_MARGIN_PX = 48;

const createPdfStyleElement = () => {
    const style = document.createElement('style');
    style.textContent = `
        .note-export, .note-export * { box-sizing: border-box; }
        .note-export { font-family: "Times New Roman", serif; font-size: 12pt; line-height: 1.6; color: #1a1a1a; }
        .note-export h1 { font-size: 20pt; margin: 0 0 16pt; }
        .note-export h2 { font-size: 14pt; margin: 18pt 0 10pt; }
        .note-export p { margin: 0 0 10pt; }
        .note-export table { border-collapse: collapse; width: 100%; margin: 12pt 0; }
        .note-export td, .note-export th { border: 1px solid #999; padding: 6pt; vertical-align: top; }
        .note-export pre { background: #f5f5f5; border: 1px solid #ddd; padding: 10pt; border-radius: 4pt; font-family: "Consolas", "Courier New", monospace; font-size: 10.5pt; white-space: pre-wrap; }
        .note-export code { font-family: "Consolas", "Courier New", monospace; }
        .note-export .note-citation { font-size: 9pt; vertical-align: super; }
        .note-export .note-references { margin: 0; padding-left: 18pt; }
        .note-export .note-references li { margin: 0 0 6pt; }
        .note-block { padding-top: 0.1px; padding-bottom: 0.1px; }
    `;
    return style;
};

const collectReferences = (blocks: NoteBlock[]) => {
    const references = new Map<string, string>();
    const referenceOrder: string[] = [];
    const collectInline = (inline: NoteInline) => {
        if (!inline.citation) {
            return;
        }
        const key = inline.citation.id;
        if (!references.has(key)) {
            references.set(key, inline.citation.source);
            referenceOrder.push(key);
        }
    };

    blocks.forEach((block) => {
        if (block.type === 'paragraph') {
            block.inlines.forEach(collectInline);
            return;
        }
        if (block.type === 'table') {
            block.rows.forEach((row) => row.forEach((cell) => cell.forEach(collectInline)));
        }
    });

    return { references, referenceOrder };
};

const renderReferencesHtml = (references: Map<string, string>, referenceOrder: string[]) => {
    if (referenceOrder.length === 0) {
        return '';
    }
    const items = referenceOrder
        .map((key) => {
            const source = references.get(key) || '';
            return `<li>[${escapeHtml(key)}] ${escapeHtml(source)}</li>`;
        })
        .join('');
    return `<h2>References</h2><ol class="note-references">${items}</ol>`;
};

const buildDocxParagraph = (
    inlines: NoteInline[],
    references: Map<string, string>,
    referenceOrder: string[]
) => {
    const children: TextRun[] = [];
    for (const inline of inlines) {
        if (inline.citation) {
            const key = inline.citation.id;
            if (!references.has(key)) {
                references.set(key, inline.citation.source);
                referenceOrder.push(key);
            }
            children.push(
                new TextRun({
                    text: `[${key}]`
                })
            );
            continue;
        }
        if (inline.text.length === 0) {
            continue;
        }
        children.push(
            new TextRun({
                text: inline.text,
                bold: inline.bold,
                italics: inline.italic
            })
        );
    }
    return new Paragraph({
        children,
        spacing: DOCX_PARAGRAPH_SPACING,
        run: DOCX_BODY_RUN
    });
};

const buildDocxTable = (
    rows: NoteInline[][][],
    references: Map<string, string>,
    referenceOrder: string[]
) => {
    const tableRows = rows.map((row) => {
        const cells = row.map((cell) => {
            const paragraph = buildDocxParagraph(cell, references, referenceOrder);
            return new TableCell({ children: [paragraph], margins: DOCX_TABLE_MARGINS });
        });
        return new TableRow({ children: cells });
    });
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows,
        borders: DOCX_TABLE_BORDERS,
        margins: DOCX_TABLE_MARGINS
    });
};

const buildDocxCodeBlock = (text: string) => {
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n+$/, '');
    const lines = normalized.split('\n');
    const children = lines.map((line, index) =>
        new TextRun({
            text: line,
            break: index === 0 ? undefined : 1
        })
    );
    return new Paragraph({
        children,
        spacing: DOCX_CODE_SPACING,
        run: DOCX_CODE_RUN
    });
};

const buildNoteHtmlContent = (title: string, blocks: NoteBlock[]) => {
    const references = new Map<string, string>();
    const referenceOrder: string[] = [];
    const body = blocks
        .map((block) => {
            if (block.type === 'paragraph') {
                return renderParagraphHtml(block.inlines, references, referenceOrder);
            }
            if (block.type === 'code') {
                return renderCodeHtml(block.text);
            }
            return renderTableHtml(block.rows, references, referenceOrder);
        })
        .filter((line) => line.length > 0)
        .join('');
    const referencesHtml = renderReferencesHtml(references, referenceOrder);
    return `<h1 class="note-title">${escapeHtml(title)}</h1>${body}${referencesHtml}`;
};

const generateLegacyDocHtml = (title: string, blocks: NoteBlock[]) => {
    const body = buildNoteHtmlContent(title, blocks);
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>${escapeHtml(title)}</title>
    <style>
        body { font-family: "Times New Roman", serif; font-size: 12pt; line-height: 1.5; }
        h1 { font-size: 18pt; margin-bottom: 12pt; }
        h2 { font-size: 14pt; margin: 16pt 0 8pt; }
        table { border-collapse: collapse; width: 100%; margin: 12pt 0; }
        td { border: 1px solid #333; padding: 6pt; vertical-align: top; }
        pre { font-family: "Consolas", "Courier New", monospace; }
        .note-citation { font-size: 9pt; vertical-align: super; }
        .note-references { margin: 0; padding-left: 18pt; }
    </style>
</head>
<body>
    ${body}
</body>
</html>`;
};

type PdfRenderBlock =
    | { type: 'paragraph'; inlines: NoteInline[] }
    | { type: 'table'; rows: NoteInline[][][] }
    | { type: 'code'; text: string }
    | { type: 'html'; html: string };

const renderBlockElement = (
    block: PdfRenderBlock,
    references: Map<string, string>,
    referenceOrder: string[]
) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'note-block';
    if (block.type === 'paragraph') {
        wrapper.innerHTML = renderParagraphHtml(block.inlines, references, referenceOrder);
        return wrapper;
    }
    if (block.type === 'table') {
        wrapper.innerHTML = renderTableHtml(block.rows, references, referenceOrder);
        return wrapper;
    }
    if (block.type === 'code') {
        wrapper.innerHTML = renderCodeHtml(block.text);
        return wrapper;
    }
    wrapper.innerHTML = block.html;
    return wrapper;
};

const createPdfMeasureContainer = () => {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-10000px';
    container.style.top = '0';
    container.style.width = `${PDF_PAGE_WIDTH_PX - PDF_MARGIN_PX * 2}px`;
    const style = createPdfStyleElement();
    const content = document.createElement('div');
    content.className = 'note-export';
    container.append(style, content);
    document.body.appendChild(container);
    return {
        element: container,
        content,
        cleanup: () => {
            container.remove();
        }
    };
};

const createPdfPageElement = (
    blocks: PdfRenderBlock[],
    references: Map<string, string>,
    referenceOrder: string[]
) => {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-10000px';
    container.style.top = '0';
    container.style.width = `${PDF_PAGE_WIDTH_PX}px`;
    container.style.height = `${PDF_PAGE_HEIGHT_PX}px`;
    container.style.background = '#ffffff';
    container.style.padding = `${PDF_MARGIN_PX}px`;
    const style = createPdfStyleElement();
    const content = document.createElement('div');
    content.className = 'note-export';
    content.style.width = `${PDF_PAGE_WIDTH_PX - PDF_MARGIN_PX * 2}px`;
    blocks.forEach((block) => {
        content.appendChild(renderBlockElement(block, references, referenceOrder));
    });
    container.append(style, content);
    document.body.appendChild(container);
    return {
        element: container,
        cleanup: () => {
            container.remove();
        }
    };
};

const paginatePdfBlocks = (
    blocks: PdfRenderBlock[],
    references: Map<string, string>,
    referenceOrder: string[]
) => {
    const contentHeight = PDF_PAGE_HEIGHT_PX - PDF_MARGIN_PX * 2;
    const pages: PdfRenderBlock[][] = [];
    let current: PdfRenderBlock[] = [];
    let currentHeight = 0;

    const { element, content, cleanup } = createPdfMeasureContainer();
    void element;

    const measureBlockHeight = (block: PdfRenderBlock) => {
        const node = renderBlockElement(block, references, referenceOrder);
        content.appendChild(node);
        const height = node.offsetHeight;
        node.remove();
        return height;
    };

    const commitPage = () => {
        if (current.length > 0) {
            pages.push(current);
        }
        current = [];
        currentHeight = 0;
    };

    const tryAddBlock = (block: PdfRenderBlock, height: number) => {
        if (currentHeight + height <= contentHeight || current.length === 0) {
            current.push(block);
            currentHeight += height;
            return true;
        }
        return false;
    };

    const getTableChunkRowCount = (rows: NoteInline[][][], startIndex: number, maxHeight: number) => {
        const header = rows[0];
        const remaining = rows.length - startIndex;
        let low = 1;
        let high = remaining;
        let best = 0;
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const candidateRows = [header, ...rows.slice(startIndex, startIndex + mid)];
            const height = measureBlockHeight({ type: 'table', rows: candidateRows });
            if (height <= maxHeight) {
                best = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        return best;
    };

    const getCodeChunkLineCount = (lines: string[], startIndex: number, maxHeight: number) => {
        const remaining = lines.length - startIndex;
        let low = 1;
        let high = remaining;
        let best = 0;
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const candidate = lines.slice(startIndex, startIndex + mid).join('\n');
            const height = measureBlockHeight({ type: 'code', text: candidate });
            if (height <= maxHeight) {
                best = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        return best;
    };

    blocks.forEach((block) => {
        if (block.type === 'table') {
            if (block.rows.length <= 1) {
                const height = measureBlockHeight(block);
                if (!tryAddBlock(block, height)) {
                    commitPage();
                    tryAddBlock(block, height);
                }
                return;
            }
            const header = block.rows[0];
            let start = 1;
            while (start < block.rows.length) {
                let remainingHeight = contentHeight - currentHeight;
                if (remainingHeight <= 0) {
                    commitPage();
                    remainingHeight = contentHeight;
                }
                let rowCount = getTableChunkRowCount(block.rows, start, remainingHeight);
                if (rowCount === 0) {
                    if (current.length > 0) {
                        commitPage();
                        rowCount = getTableChunkRowCount(block.rows, start, contentHeight);
                    }
                }
                if (rowCount === 0) {
                    rowCount = 1;
                }
                const chunk: PdfRenderBlock = { type: 'table', rows: [header, ...block.rows.slice(start, start + rowCount)] };
                const height = measureBlockHeight(chunk);
                if (!tryAddBlock(chunk, height)) {
                    commitPage();
                    tryAddBlock(chunk, height);
                }
                start += rowCount;
            }
            return;
        }
        if (block.type === 'code') {
            const normalized = block.text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n+$/, '');
            const lines = normalized.length > 0 ? normalized.split('\n') : [''];
            let start = 0;
            while (start < lines.length) {
                let remainingHeight = contentHeight - currentHeight;
                if (remainingHeight <= 0) {
                    commitPage();
                    remainingHeight = contentHeight;
                }
                let lineCount = getCodeChunkLineCount(lines, start, remainingHeight);
                if (lineCount === 0) {
                    if (current.length > 0) {
                        commitPage();
                        lineCount = getCodeChunkLineCount(lines, start, contentHeight);
                    }
                }
                if (lineCount === 0) {
                    lineCount = 1;
                }
                const chunk: PdfRenderBlock = { type: 'code', text: lines.slice(start, start + lineCount).join('\n') };
                const height = measureBlockHeight(chunk);
                if (!tryAddBlock(chunk, height)) {
                    commitPage();
                    tryAddBlock(chunk, height);
                }
                start += lineCount;
            }
            return;
        }
        const height = measureBlockHeight(block);
        if (!tryAddBlock(block, height)) {
            commitPage();
            tryAddBlock(block, height);
        }
    });

    cleanup();

    if (current.length > 0) {
        pages.push(current);
    }

    return pages;
};

const exportNotePdf = async (title: string, blocks: NoteBlock[], tabTitle: string, timestamp: string) => {
    const filename = `notebooklm_note_${tabTitle}_${timestamp}.pdf`;
    const { references, referenceOrder } = collectReferences(blocks);
    const pdfBlocks: PdfRenderBlock[] = [
        { type: 'html', html: `<h1 class="note-title">${escapeHtml(title)}</h1>` },
        ...blocks.map((block) => {
            if (block.type === 'paragraph') {
                return { type: 'paragraph', inlines: block.inlines } as PdfRenderBlock;
            }
            if (block.type === 'code') {
                return { type: 'code', text: block.text } as PdfRenderBlock;
            }
            return { type: 'table', rows: block.rows } as PdfRenderBlock;
        })
    ];
    const referencesHtml = renderReferencesHtml(references, referenceOrder);
    if (referencesHtml) {
        pdfBlocks.push({ type: 'html', html: referencesHtml });
    }
    const pages = paginatePdfBlocks(pdfBlocks, references, referenceOrder);
    try {
        const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
        for (let index = 0; index < pages.length; index += 1) {
            const { element, cleanup } = createPdfPageElement(pages[index], references, referenceOrder);
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imageHeight = (canvas.height * pageWidth) / canvas.width;
            if (index > 0) {
                pdf.addPage();
            }
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, Math.min(pageHeight, imageHeight));
            cleanup();
        }
        pdf.save(filename);
    } catch (err) {
        console.error(err);
    }
};

export const exportNote = (
    blocks: NoteBlock[],
    format: ExportFormat,
    tabTitle: string,
    timestamp: string,
    noteTitle?: string
): ExportResult => {
    const title = noteTitle?.trim() || tabTitle;

    if (format === 'Markdown') {
        const footnotes = new Map<string, string>();
        const footnoteOrder: string[] = [];
        const body = blocks
            .map((block) => {
                if (block.type === 'paragraph') {
                    return renderParagraphMarkdown(block.inlines, footnotes, footnoteOrder);
                }
                if (block.type === 'code') {
                    return renderCodeMarkdown(block.text);
                }
                return renderTableMarkdown(block.rows, footnotes, footnoteOrder);
            })
            .filter((line) => line.length > 0)
            .join('\n\n');
        const footnoteLines = footnoteOrder.map((key) => `[^${key}]: ${footnotes.get(key) || ''}`);
        const parts = [`# ${title}`, '', body];
        if (footnoteLines.length > 0) {
            parts.push('', ...footnoteLines);
        }
        const content = parts.join('\n');
        const filename = `notebooklm_note_${tabTitle}_${timestamp}.md`;
        downloadBlob(content, filename, 'text/markdown');
        return { success: true, count: blocks.length };
    }

    if (format === 'PDF') {
        void exportNotePdf(title, blocks, tabTitle, timestamp);
        return { success: true, count: blocks.length };
    }

    if (format === 'Word') {
        const references = new Map<string, string>();
        const referenceOrder: string[] = [];
        const children: (Paragraph | Table)[] = [
            new Paragraph({
                children: [new TextRun({ text: title, ...DOCX_TITLE_RUN })],
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.LEFT,
                spacing: { after: 240 }
            }),
            ...blocks.flatMap((block) => {
                if (block.type === 'paragraph') {
                    return buildDocxParagraph(block.inlines, references, referenceOrder);
                }
                if (block.type === 'code') {
                    return buildDocxCodeBlock(block.text);
                }
                return buildDocxTable(block.rows, references, referenceOrder);
            })
        ];

        if (referenceOrder.length > 0) {
            children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
            children.push(
                new Paragraph({
                    children: [new TextRun({ text: 'References', ...DOCX_HEADING_RUN })],
                    heading: HeadingLevel.HEADING_2,
                    spacing: { after: 160 }
                })
            );
            referenceOrder.forEach((key) => {
                const source = references.get(key) || '';
                children.push(
                    new Paragraph({
                        children: [new TextRun({ text: `[${key}] ${source}` })],
                        spacing: DOCX_PARAGRAPH_SPACING,
                        run: DOCX_BODY_RUN
                    })
                );
            });
        }

        const doc = new Document({
            sections: [{ children }],
            styles: {
                default: {
                    document: {
                        run: DOCX_BODY_RUN,
                        paragraph: { spacing: DOCX_PARAGRAPH_SPACING }
                    }
                }
            }
        });

        const filename = `notebooklm_note_${tabTitle}_${timestamp}.docx`;
        void Packer.toBlob(doc)
            .then((blob) => downloadBlob(blob, filename, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'))
            .catch((err) => {
                console.error(err);
            });
        return { success: true, count: blocks.length };
    }

    return { success: false, error: 'Unsupported format' };
};
