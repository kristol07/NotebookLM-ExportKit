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
import { browser } from 'wxt/browser';
import { ExportResult } from './export-core';
import { clearDriveAuth, getDriveAccessToken, getDriveAccountEmail } from './google-drive-auth';

const DRIVE_FOLDER_NAME = 'NotebookLM ExportKit';
const DRIVE_FOLDER_STORAGE_KEY = 'exportkitDriveFolderId';
const RESUMABLE_UPLOAD_THRESHOLD_BYTES = 10 * 1024 * 1024;
type UploadProgress = { loaded: number; total: number; percent: number };
export type UploadProgressCallback = (progress: UploadProgress) => void;
const getFolderStorageKey = (email?: string | null) => (
    email ? `${DRIVE_FOLDER_STORAGE_KEY}:${email}` : DRIVE_FOLDER_STORAGE_KEY
);
const getStorageValue = async (key: string) => {
    const result = await browser.storage.local.get(key);
    const value = result[key];
    return typeof value === 'string' ? value : null;
};
const setStorageValue = async (key: string, value: string) => {
    await browser.storage.local.set({ [key]: value });
};
const removeStorageValue = async (key: string) => {
    await browser.storage.local.remove(key);
};

const getStoredFolderId = (email?: string | null) => getStorageValue(getFolderStorageKey(email));
const setStoredFolderId = async (id: string, email?: string | null) => {
    await setStorageValue(getFolderStorageKey(email), id);
};
const clearStoredFolderId = async (email?: string | null) => {
    if (email) {
        await removeStorageValue(getFolderStorageKey(email));
    }
    await removeStorageValue(DRIVE_FOLDER_STORAGE_KEY);
};
const clearDriveConnection = async () => {
    const email = await getDriveAccountEmail();
    await clearStoredFolderId(email);
    await clearDriveAuth();
};

export const resetDriveConnection = async () => {
    await clearDriveConnection();
};

const fetchDrive = async (accessToken: string, url: string, init?: RequestInit) => {
    const response = await fetch(url, {
        ...init,
        headers: {
            ...(init?.headers || {}),
            Authorization: `Bearer ${accessToken}`
        }
    });
    return response;
};

const buildProgress = (loaded: number, total: number) => {
    const safeTotal = total > 0 ? total : 0;
    const percent = safeTotal ? Math.min(100, Math.round((loaded / safeTotal) * 100)) : 0;
    return { loaded, total: safeTotal, percent };
};

const parseXhrHeaders = (value: string) => {
    const headers = new Headers();
    const lines = value.trim().split(/[\r\n]+/);
    lines.forEach((line) => {
        const index = line.indexOf(':');
        if (index === -1) {
            return;
        }
        const key = line.slice(0, index).trim();
        const headerValue = line.slice(index + 1).trim();
        if (key) {
            headers.append(key, headerValue);
        }
    });
    return headers;
};

const xhrUpload = (
    url: string,
    method: 'POST' | 'PUT',
    body: BodyInit,
    headers: Record<string, string>,
    onProgress?: UploadProgressCallback,
    fallbackTotal?: number
) => {
    return new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        Object.entries(headers).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value);
        });
        xhr.upload.onprogress = (event) => {
            if (!onProgress) {
                return;
            }
            const total = event.total || fallbackTotal || 0;
            onProgress(buildProgress(event.loaded, total));
        };
        xhr.onerror = () => reject(new Error('Upload failed due to a network error.'));
        xhr.onabort = () => reject(new Error('Upload was aborted.'));
        xhr.onload = () => {
            const rawHeaders = xhr.getAllResponseHeaders();
            const headers = parseXhrHeaders(rawHeaders);
            resolve(new Response(xhr.responseText, {
                status: xhr.status,
                statusText: xhr.statusText,
                headers
            }));
        };
        xhr.send(body);
    });
};

const findDriveFolder = async (accessToken: string) => {
    const query = encodeURIComponent(
        `name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
    );
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;
    const response = await fetchDrive(accessToken, url);
    if (!response.ok) {
        return null;
    }
    const data = await response.json();
    const folder = Array.isArray(data.files) ? data.files[0] : null;
    return folder?.id || null;
};

const createDriveFolder = async (accessToken: string) => {
    const response = await fetchDrive(accessToken, 'https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: DRIVE_FOLDER_NAME,
            mimeType: 'application/vnd.google-apps.folder'
        })
    });
    if (!response.ok) {
        return null;
    }
    const data = await response.json();
    return data?.id || null;
};

const ensureDriveFolder = async (accessToken: string) => {
    const email = await getDriveAccountEmail();
    const cachedId = await getStoredFolderId(email);
    if (cachedId) {
        return cachedId;
    }
    const existingId = await findDriveFolder(accessToken);
    if (existingId) {
        await setStoredFolderId(existingId, email);
        return existingId;
    }
    const createdId = await createDriveFolder(accessToken);
    if (createdId) {
        await setStoredFolderId(createdId, email);
    }
    return createdId;
};

const performUpload = async (
    accessToken: string,
    exportResult: ExportResult,
    folderId: string,
    onProgress?: UploadProgressCallback
) => {
    const metadata = {
        name: exportResult.filename,
        parents: [folderId]
    };
    const file = new File([exportResult.blob], exportResult.filename, { type: exportResult.mimeType });
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    return xhrUpload(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name',
        'POST',
        form,
        { Authorization: `Bearer ${accessToken}` },
        onProgress,
        exportResult.blob.size
    );
};

const performResumableUpload = async (
    accessToken: string,
    exportResult: ExportResult,
    folderId: string,
    onProgress?: UploadProgressCallback
) => {
    const metadata = {
        name: exportResult.filename,
        parents: [folderId]
    };
    const startResponse = await fetchDrive(
        accessToken,
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
                'X-Upload-Content-Type': exportResult.mimeType,
                'X-Upload-Content-Length': String(exportResult.blob.size)
            },
            body: JSON.stringify(metadata)
        }
    );
    if (!startResponse.ok) {
        return startResponse;
    }
    const uploadUrl = startResponse.headers.get('Location');
    if (!uploadUrl) {
        return new Response('Missing resumable upload URL.', { status: 500 });
    }
    return xhrUpload(
        uploadUrl,
        'PUT',
        exportResult.blob,
        {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': exportResult.mimeType,
            'Content-Length': String(exportResult.blob.size)
        },
        onProgress,
        exportResult.blob.size
    );
};

const performUploadWithMode = async (
    accessToken: string,
    exportResult: ExportResult,
    folderId: string,
    onProgress?: UploadProgressCallback
) => {
    if (exportResult.blob.size >= RESUMABLE_UPLOAD_THRESHOLD_BYTES) {
        return performResumableUpload(accessToken, exportResult, folderId, onProgress);
    }
    return performUpload(accessToken, exportResult, folderId, onProgress);
};

export const uploadToDrive = async (
    session: any,
    exportResult: ExportResult,
    onProgress?: UploadProgressCallback
) => {
    if (!exportResult.success) {
        return exportResult;
    }
    const accessToken = await getDriveAccessToken();
    if (!accessToken) {
        return { success: false, error: 'Connect Google Drive to continue.' };
    }
    const folderId = await ensureDriveFolder(accessToken);
    if (!folderId) {
        return { success: false, error: 'Unable to access the Google Drive folder.' };
    }

    let response: Response;
    try {
        response = await performUploadWithMode(accessToken, exportResult, folderId, onProgress);
    } catch (error) {
        console.error('Drive upload failed:', error);
        return { success: false, error: 'Drive upload failed.' };
    }

    if (response.status === 404) {
        await clearStoredFolderId(await getDriveAccountEmail());
        const refreshedFolderId = await ensureDriveFolder(accessToken);
        if (!refreshedFolderId) {
            return { success: false, error: 'Unable to access the Google Drive folder.' };
        }
        try {
            response = await performUploadWithMode(accessToken, exportResult, refreshedFolderId, onProgress);
        } catch (error) {
            console.error('Drive upload failed:', error);
            return { success: false, error: 'Drive upload failed.' };
        }
    }

    if (!response.ok) {
        const detail = await response.text();
        if (response.status === 401 || response.status === 403) {
            await clearDriveConnection();
        }
        const message = response.status === 401 || response.status === 403
            ? 'Google Drive access expired or missing. Reconnect to continue.'
            : 'Drive upload failed.';
        console.error('Drive upload failed:', detail);
        return { success: false, error: message };
    }

    return { success: true };
};

