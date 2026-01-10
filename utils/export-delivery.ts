import { downloadBlob, ExportResult, ExportTarget } from './export-core';
import { UploadProgressCallback, uploadToDrive } from './google-drive';

export const deliverExport = async (
    target: ExportTarget,
    result: ExportResult,
    session: any,
    onProgress?: UploadProgressCallback
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

    return { success: false, error: 'Unsupported export destination.' };
};
