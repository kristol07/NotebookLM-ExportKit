import { ExportFormat, ExportResult, SourceItem } from './export-core';

const normalizeTitle = (value: string) => value.replace(/\s+/g, ' ').trim();

export const exportSources = (
    items: SourceItem[],
    format: ExportFormat,
    tabTitle: string,
    timestamp: string
): ExportResult => {
    if (format !== 'Markdown') {
        return { success: false, error: `Format ${format} is not supported for source.` };
    }

    const content = items.map((item) => `- ${normalizeTitle(item.title)}`).join('\n');
    const filename = `notebooklm_sources_${tabTitle}_${timestamp}.md`;
    const blob = new Blob([content], { type: 'text/markdown' });
    return { success: true, count: items.length, filename, mimeType: blob.type, blob };
};
