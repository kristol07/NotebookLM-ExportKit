import { downloadBlob, ExportFormat, ExportResult, NoteBlock, NoteInline } from './export-core';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from 'docx';

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
    return new Paragraph({ children });
};

const buildDocxTable = (
    rows: NoteInline[][][],
    references: Map<string, string>,
    referenceOrder: string[]
) => {
    const tableRows = rows.map((row) => {
        const cells = row.map((cell) => {
            const paragraph = buildDocxParagraph(cell, references, referenceOrder);
            return new TableCell({ children: [paragraph] });
        });
        return new TableRow({ children: cells });
    });
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows
    });
};

const generateLegacyDocHtml = (title: string, blocks: NoteBlock[]) => {
    const body = blocks
        .map((block) => {
            if (block.type === 'paragraph') {
                return renderParagraphHtml(block.inlines);
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
                children: [new TextRun({ text: title, bold: true })]
            }),
            ...blocks.map((block) => {
                if (block.type === 'paragraph') {
                    return buildDocxParagraph(block.inlines, references, referenceOrder);
                }
                return buildDocxTable(block.rows, references, referenceOrder);
            })
        ];

        if (referenceOrder.length > 0) {
            children.push(new Paragraph({ children: [] }));
            children.push(new Paragraph({ children: [new TextRun({ text: 'References', bold: true })] }));
            referenceOrder.forEach((key) => {
                const source = references.get(key) || '';
                children.push(new Paragraph({ children: [new TextRun({ text: `[${key}] ${source}` })] }));
            });
        }

        const doc = new Document({
            sections: [{ children }]
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
