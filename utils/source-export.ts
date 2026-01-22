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
import { ExportFormat, ExportOptions, ExportResult, NoteBlock, SourceItem } from './export-core';
import { exportNote } from './note-export';
import { sanitizeFilename } from './common';

const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim();

const buildHeading = (text: string, level: 1 | 2 | 3 = 2): NoteBlock => ({
    type: 'heading',
    level,
    inlines: [{ text }]
});

const buildParagraph = (text: string): NoteBlock => ({
    type: 'paragraph',
    inlines: [{ text }]
});

const buildSourceBlocks = (item: SourceItem, includeTitle: boolean) => {
    const blocks: NoteBlock[] = [];
    if (includeTitle) {
        const title = normalizeText(item.title) || 'Source';
        blocks.push(buildHeading(title, 1));
    }

    if (item.summary && item.summary.length > 0) {
        blocks.push(buildHeading('Summary', 2));
        blocks.push(...item.summary);
    }

    if (item.keyTopics && item.keyTopics.length > 0) {
        blocks.push(buildHeading('Key topics', 2));
        item.keyTopics.forEach((topic) => {
            const cleaned = normalizeText(topic);
            if (cleaned) {
                blocks.push(buildParagraph(`- ${cleaned}`));
            }
        });
    }

    if (item.content && item.content.length > 0) {
        blocks.push(buildHeading('Source content', 2));
        blocks.push(...item.content);
    }

    return blocks;
};

export const exportSources = async (
    items: SourceItem[],
    format: ExportFormat,
    tabTitle: string,
    timestamp: string,
    options?: ExportOptions
): Promise<ExportResult> => {
    if (format !== 'Markdown' && format !== 'Word' && format !== 'PDF') {
        return { success: false, error: `Format ${format} is not supported for source.` };
    }

    if (items.length === 0) {
        return { success: false, error: 'No source content found to export.' };
    }

    const isMulti = items.length > 1;
    const primaryTitle = normalizeText(items[0]?.title || '') || tabTitle;
    const docTitle = isMulti ? tabTitle : primaryTitle;
    const filenameTitle = sanitizeFilename(primaryTitle || tabTitle);

    const blocks: NoteBlock[] = [];
    items.forEach((item) => {
        const includeTitle = isMulti;
        const sectionBlocks = buildSourceBlocks(item, includeTitle);
        if (sectionBlocks.length === 0) {
            return;
        }
        blocks.push(...sectionBlocks);
    });

    if (blocks.length === 0) {
        return { success: false, error: 'No source content found to export.' };
    }

    return exportNote(blocks, format, filenameTitle, timestamp, docTitle, options, 'notebooklm_source');
};

