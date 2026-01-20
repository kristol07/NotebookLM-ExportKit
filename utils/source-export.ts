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

