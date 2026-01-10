import { ExportResult } from './export-core';

const DRIVE_FOLDER_NAME = 'NotebookLM ExportKit';
const DRIVE_FOLDER_STORAGE_KEY = 'exportkitDriveFolderId';
const DRIVE_CONNECTED_STORAGE_KEY = 'exportkitDriveConnected';

const getStoredFolderId = () => localStorage.getItem(DRIVE_FOLDER_STORAGE_KEY);
const setStoredFolderId = (id: string) => localStorage.setItem(DRIVE_FOLDER_STORAGE_KEY, id);
const clearDriveConnection = () => {
    localStorage.removeItem(DRIVE_FOLDER_STORAGE_KEY);
    localStorage.removeItem(DRIVE_CONNECTED_STORAGE_KEY);
};

const getGoogleAccessToken = (session: any) => {
    return session?.provider_token || null;
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
    const cachedId = getStoredFolderId();
    if (cachedId) {
        return cachedId;
    }
    const existingId = await findDriveFolder(accessToken);
    if (existingId) {
        setStoredFolderId(existingId);
        return existingId;
    }
    const createdId = await createDriveFolder(accessToken);
    if (createdId) {
        setStoredFolderId(createdId);
    }
    return createdId;
};

export const uploadToDrive = async (session: any, exportResult: ExportResult) => {
    if (!exportResult.success) {
        return exportResult;
    }
    const accessToken = getGoogleAccessToken(session);
    if (!accessToken) {
        return { success: false, error: 'Connect Google Drive to continue.' };
    }
    const folderId = await ensureDriveFolder(accessToken);
    if (!folderId) {
        return { success: false, error: 'Unable to access the Google Drive folder.' };
    }

    const metadata = {
        name: exportResult.filename,
        parents: [folderId]
    };
    const file = new File([exportResult.blob], exportResult.filename, { type: exportResult.mimeType });
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const response = await fetchDrive(
        accessToken,
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name',
        {
            method: 'POST',
            body: form
        }
    );

    if (!response.ok) {
        const detail = await response.text();
        if (response.status === 401 || response.status === 403) {
            clearDriveConnection();
        }
        const message = response.status === 401 || response.status === 403
            ? 'Google Drive access expired or missing. Reconnect to continue.'
            : 'Drive upload failed.';
        console.error('Drive upload failed:', detail);
        return { success: false, error: message };
    }

    return { success: true };
};
