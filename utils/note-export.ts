import { downloadBlob, ExportFormat, ExportResult, NoteBlock, NoteInline } from './export-core';
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

const renderInlineHtml = (inline: NoteInline) => {
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

const renderParagraphHtml = (inlines: NoteInline[]) => {
    const content = inlines.map((inline) => renderInlineHtml(inline)).join('');
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

const renderTableHtml = (rows: NoteInline[][][]) => {
    const bodyRows = rows
        .map((row) => {
            const cells = row
                .map((cell) => `<td>${cell.map((inline) => renderInlineHtml(inline)).join('').trim()}</td>`)
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

const generateLegacyDocHtml = (title: string, blocks: NoteBlock[]) => {
    const body = blocks
        .map((block) => {
            if (block.type === 'paragraph') {
                return renderParagraphHtml(block.inlines);
            }
            if (block.type === 'code') {
                return renderCodeHtml(block.text);
            }
            return renderTableHtml(block.rows);
        })
        .filter((line) => line.length > 0)
        .join('');
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>${escapeHtml(title)}</title>
    <style>
        body { font-family: "Times New Roman", serif; font-size: 12pt; line-height: 1.5; }
        h1 { font-size: 18pt; margin-bottom: 12pt; }
        table { border-collapse: collapse; width: 100%; margin: 12pt 0; }
        td { border: 1px solid #333; padding: 6pt; vertical-align: top; }
    </style>
</head>
<body>
    <h1>${escapeHtml(title)}</h1>
    ${body}
</body>
</html>`;
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
