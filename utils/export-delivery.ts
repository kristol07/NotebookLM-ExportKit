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
import { downloadBlob, ExportFormat, ExportResult, ExportTarget, ContentType } from './export-core';
import { UploadProgressCallback, uploadToDrive } from './google-drive';
import { uploadToNotion, NotionExportContext } from './notion';

export const deliverExport = async (
    target: ExportTarget,
    result: ExportResult,
    session: any,
    onProgress?: UploadProgressCallback,
    context?: NotionExportContext
) => {
    if (!result.success) {
        return result;
    }

    if (target === 'download') {
        downloadBlob(result.blob, result.filename, result.mimeType);
        return result;
    }

    if (target === 'drive') {
        const driveResult = await uploadToDrive(session, result, onProgress);
        if (driveResult.success) {
            return result;
        }
        return { success: false, error: driveResult.error };
    }

    if (target === 'notion') {
        const notionResult = await uploadToNotion(result, context);
        if (notionResult.success) {
            return result;
        }
        return { success: false, error: notionResult.error };
    }

    return { success: false, error: 'Unsupported export destination.' };
};

