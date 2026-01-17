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
