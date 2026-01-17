import { ExportFormat, ExportOptions, ExportResult, NoteBlock } from './export-core';
import { exportNote } from './note-export';

export const exportReport = async (
    blocks: NoteBlock[],
    format: ExportFormat,
    tabTitle: string,
    timestamp: string,
    reportTitle?: string,
    options?: ExportOptions
): Promise<ExportResult> => {
    return exportNote(blocks, format, tabTitle, timestamp, reportTitle, options, 'notebooklm_report');
};
