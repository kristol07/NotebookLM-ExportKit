import * as XLSX from 'xlsx';
import { DataTableRow, downloadBlob, ExportFormat, ExportResult } from './export-core';

const normalizeRows = (rows: DataTableRow[]) => {
    const normalized = rows.map((row) => row.cells.map((cell) => cell ?? ''));
    const columnCount = normalized.reduce((max, row) => Math.max(max, row.length), 0);
    if (columnCount === 0) {
        return { rows: [], columnCount: 0 };
    }
    const padded = normalized.map((row) =>
        Array.from({ length: columnCount }, (_, index) => row[index] ?? '')
    );
    return { rows: padded, columnCount };
};

const escapeMarkdownCell = (value: string) => {
    return value.replace(/\r?\n/g, ' ').replace(/\|/g, '\\|');
};

export const exportDatatable = (
    rows: DataTableRow[],
    format: ExportFormat,
    tabTitle: string,
    timestamp: string
): ExportResult => {
    if (rows.length === 0) {
        return { success: false, error: 'No data table rows found.' };
    }

    const { rows: normalizedRows, columnCount } = normalizeRows(rows);
    if (normalizedRows.length === 0 || columnCount === 0) {
        return { success: false, error: 'No data table rows found.' };
    }

    if (format === 'CSV') {
        const ws = XLSX.utils.aoa_to_sheet(normalizedRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data Table');
        const filename = `notebooklm_datatable_${tabTitle}_${timestamp}.xlsx`;
        XLSX.writeFile(wb, filename);
        return { success: true, count: normalizedRows.length };
    }

    if (format === 'Markdown') {
        const [headerRow, ...bodyRows] = normalizedRows;
        const header = headerRow.map(escapeMarkdownCell);
        const separator = Array.from({ length: columnCount }, () => '---');
        const body = bodyRows.map((row) => row.map(escapeMarkdownCell));
        const toLine = (cells: string[]) => `| ${cells.join(' | ')} |`;
        const markdown = [toLine(header), toLine(separator), ...body.map(toLine)].join('\n');
        const filename = `notebooklm_datatable_${tabTitle}_${timestamp}.md`;
        downloadBlob(markdown, filename, 'text/markdown');
        return { success: true, count: normalizedRows.length };
    }

    return { success: false, error: 'Unsupported format' };
};
