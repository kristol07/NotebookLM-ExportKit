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
import JSZip from 'jszip';
import { browser } from 'wxt/browser';
import { ExportFormat, ExportResult, VideoOverviewItem } from './export-core';

const EXPORT_LOG = '[VIDEO_OVERVIEW_EXPORT]';
const now = () => Math.round(performance.now());
const PREVIEW_WIDTH = 48;
const PREVIEW_HEIGHT = 27;
const MAX_CANDIDATE_SAMPLES = 240;
const MAX_EXTRACTED_FRAMES = 96;

type ExtractedFrame = {
    index: number;
    blob: Blob;
};

const toBlob = (canvas: HTMLCanvasElement, quality = 0.86) =>
    new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error('Failed to serialize canvas.'));
                    return;
                }
                resolve(blob);
            },
            'image/jpeg',
            quality
        );
    });

const seekVideo = (video: HTMLVideoElement, timeSeconds: number) =>
    new Promise<void>((resolve, reject) => {
        let timeoutId: number | undefined;
        const clear = () => {
            video.removeEventListener('seeked', onSeeked);
            video.removeEventListener('error', onError);
            if (timeoutId !== undefined) {
                window.clearTimeout(timeoutId);
            }
        };
        const onSeeked = () => {
            clear();
            resolve();
        };
        const onError = () => {
            clear();
            reject(new Error('Video seek failed.'));
        };
        timeoutId = window.setTimeout(() => {
            clear();
            reject(new Error('Video seek timed out.'));
        }, 12000);
        video.addEventListener('seeked', onSeeked, { once: true });
        video.addEventListener('error', onError, { once: true });
        video.currentTime = Math.max(0, Math.min(timeSeconds, Math.max(0, video.duration - 0.01)));
    });

const buildSampleTimes = (durationSeconds: number) => {
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
        return [0];
    }
    const minStep = 0.9;
    const step = Math.max(minStep, durationSeconds / MAX_CANDIDATE_SAMPLES);
    const times: number[] = [];
    for (let time = 0; time < durationSeconds; time += step) {
        times.push(Number(time.toFixed(3)));
    }
    const finalTime = Math.max(0, durationSeconds - 0.05);
    if (times.length === 0 || Math.abs(times[times.length - 1] - finalTime) > 0.2) {
        times.push(Number(finalTime.toFixed(3)));
    }
    return times;
};

const fingerprintDiff = (a: Uint8Array, b: Uint8Array) => {
    const len = Math.min(a.length, b.length);
    if (len === 0) {
        return 1;
    }
    let total = 0;
    for (let i = 0; i < len; i += 1) {
        total += Math.abs(a[i] - b[i]);
    }
    return total / (len * 255);
};

const getCanvasContext = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
        throw new Error('Canvas context unavailable.');
    }
    return ctx;
};

const buildFingerprint = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const out = new Uint8Array(canvas.width * canvas.height);
    for (let i = 0; i < out.length; i += 1) {
        const pixelIndex = i * 4;
        const r = imageData[pixelIndex];
        const g = imageData[pixelIndex + 1];
        const b = imageData[pixelIndex + 2];
        out[i] = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
    }
    return out;
};

const extractFramesSmart = async (video: HTMLVideoElement) => {
    const sampleTimes = buildSampleTimes(video.duration);
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = PREVIEW_WIDTH;
    previewCanvas.height = PREVIEW_HEIGHT;
    const previewCtx = getCanvasContext(previewCanvas);

    const sourceWidth = Math.max(1, video.videoWidth || 1280);
    const sourceHeight = Math.max(1, video.videoHeight || 720);
    const targetLongEdge = 1280;
    const scale = sourceWidth >= sourceHeight
        ? Math.min(1, targetLongEdge / sourceWidth)
        : Math.min(1, targetLongEdge / sourceHeight);
    const outputWidth = Math.max(1, Math.round(sourceWidth * scale));
    const outputHeight = Math.max(1, Math.round(sourceHeight * scale));
    const frameCanvas = document.createElement('canvas');
    frameCanvas.width = outputWidth;
    frameCanvas.height = outputHeight;
    const frameCtx = getCanvasContext(frameCanvas);

    const forcedGap = Math.max(10, (video.duration || 0) / 18);
    let lastKeptFingerprint: Uint8Array | null = null;
    let lastKeptTime = -Number.MAX_VALUE;
    const frames: ExtractedFrame[] = [];

    for (let i = 0; i < sampleTimes.length; i += 1) {
        const time = sampleTimes[i];
        try {
            await seekVideo(video, time);
        } catch (error) {
            console.warn(`${EXPORT_LOG} frame_seek_failed`, { time, error });
            continue;
        }

        previewCtx.drawImage(video, 0, 0, previewCanvas.width, previewCanvas.height);
        const fingerprint = buildFingerprint(previewCtx, previewCanvas);
        const diff = lastKeptFingerprint ? fingerprintDiff(fingerprint, lastKeptFingerprint) : 1;
        const shouldKeep =
            frames.length === 0
            || i === sampleTimes.length - 1
            || time - lastKeptTime >= forcedGap
            || diff >= 0.09;
        if (!shouldKeep) {
            continue;
        }

        frameCtx.drawImage(video, 0, 0, frameCanvas.width, frameCanvas.height);
        frames.push({
            index: frames.length + 1,
            blob: await toBlob(frameCanvas)
        });
        lastKeptFingerprint = fingerprint;
        lastKeptTime = time;
        if (frames.length >= MAX_EXTRACTED_FRAMES) {
            break;
        }
    }

    if (frames.length === 0) {
        await seekVideo(video, 0);
        frameCtx.drawImage(video, 0, 0, frameCanvas.width, frameCanvas.height);
        frames.push({ index: 1, blob: await toBlob(frameCanvas) });
    }
    return frames;
};

const decodeAudioBuffer = async (videoBlob: Blob) => {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) {
        return null;
    }
    const context = new AudioCtx();
    try {
        const arrayBuffer = await videoBlob.arrayBuffer();
        return await context.decodeAudioData(arrayBuffer.slice(0));
    } catch (error) {
        console.warn(`${EXPORT_LOG} decode_audio_failed`, { error });
        return null;
    } finally {
        await context.close();
    }
};

const audioBufferToWavBlob = (audioBuffer: AudioBuffer) => {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    const bytesPerSample = 2;
    const blockAlign = numChannels * bytesPerSample;
    const dataSize = length * blockAlign;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    const writeString = (offset: number, value: string) => {
        for (let i = 0; i < value.length; i += 1) {
            view.setUint8(offset + i, value.charCodeAt(i));
        }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (let sampleIndex = 0; sampleIndex < length; sampleIndex += 1) {
        for (let channel = 0; channel < numChannels; channel += 1) {
            const channelData = audioBuffer.getChannelData(channel);
            const clamped = Math.max(-1, Math.min(1, channelData[sampleIndex]));
            const int16 = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF;
            view.setInt16(offset, int16, true);
            offset += 2;
        }
    }

    return new Blob([buffer], { type: 'audio/wav' });
};

const fetchVideoBlobViaBackground = async (videoUrl: string) => {
    const start = now();
    const response = await browser.runtime.sendMessage({
        type: 'fetch-binary-blob',
        url: videoUrl
    });
    if (!response?.success || !(response.arrayBuffer instanceof ArrayBuffer)) {
        throw new Error(`Background fetch failed: ${response?.error || 'unknown_error'}`);
    }
    console.info(`${EXPORT_LOG} fetch_background_ok`, {
        elapsedMs: now() - start,
        bytes: response.bytes
    });
    return new Blob([response.arrayBuffer], { type: response.mimeType || 'video/mp4' });
};

const fetchVideoBlob = async (videoUrl: string) => {
    const directStart = now();
    try {
        const response = await fetch(videoUrl, {
            method: 'GET',
            credentials: 'include',
            redirect: 'follow',
            cache: 'no-store'
        });
        if (response.ok) {
            const blob = await response.blob();
            console.info(`${EXPORT_LOG} fetch_direct_ok`, {
                elapsedMs: now() - directStart,
                bytes: blob.size,
                status: response.status
            });
            return blob;
        }
        console.warn(`${EXPORT_LOG} fetch_direct_http_error`, {
            elapsedMs: now() - directStart,
            status: response.status
        });
    } catch (error) {
        console.warn(`${EXPORT_LOG} direct_fetch_failed`, { videoUrl, error });
    }
    return fetchVideoBlobViaBackground(videoUrl);
};

const loadVideoElement = (videoBlob: Blob) =>
    new Promise<{ video: HTMLVideoElement; objectUrl: string }>((resolve, reject) => {
        const objectUrl = URL.createObjectURL(videoBlob);
        const video = document.createElement('video');
        video.preload = 'auto';
        video.muted = true;
        video.crossOrigin = 'anonymous';
        video.src = objectUrl;
        const onLoaded = () => {
            cleanup();
            resolve({ video, objectUrl });
        };
        const onError = () => {
            cleanup();
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to decode video.'));
        };
        const cleanup = () => {
            video.removeEventListener('loadedmetadata', onLoaded);
            video.removeEventListener('error', onError);
        };
        video.addEventListener('loadedmetadata', onLoaded, { once: true });
        video.addEventListener('error', onError, { once: true });
    });

const exportFramesZip = async (videoBlob: Blob) => {
    const { video, objectUrl } = await loadVideoElement(videoBlob);
    try {
        const framesStart = now();
        const frames = await extractFramesSmart(video);
        console.info(`${EXPORT_LOG} extract_frames_complete`, {
            elapsedMs: now() - framesStart,
            count: frames.length
        });
        const zip = new JSZip();
        const framesFolder = zip.folder('frames');
        if (framesFolder) {
            frames.forEach((frame) => {
                framesFolder.file(`frame_${String(frame.index).padStart(4, '0')}.jpg`, frame.blob);
            });
        }
        const zipStart = now();
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        console.info(`${EXPORT_LOG} zip_generate_complete`, {
            elapsedMs: now() - zipStart,
            bytes: zipBlob.size
        });
        return {
            blob: zipBlob,
            count: frames.length
        };
    } finally {
        video.pause();
        video.removeAttribute('src');
        video.load();
        URL.revokeObjectURL(objectUrl);
    }
};

const exportAudioWav = async (videoBlob: Blob) => {
    const decodeStart = now();
    const audioBuffer = await decodeAudioBuffer(videoBlob);
    if (!audioBuffer) {
        throw new Error('Failed to decode audio stream.');
    }
    console.info(`${EXPORT_LOG} decode_audio_complete`, { elapsedMs: now() - decodeStart });
    const wavStart = now();
    const wavBlob = audioBufferToWavBlob(audioBuffer);
    console.info(`${EXPORT_LOG} wav_encode_complete`, { elapsedMs: now() - wavStart, bytes: wavBlob.size });
    return wavBlob;
};

export const exportVideoOverview = async (
    items: VideoOverviewItem[],
    format: ExportFormat,
    tabTitle: string,
    timestamp: string
): Promise<ExportResult> => {
    if (items.length === 0) {
        return { success: false, error: 'No video overview content found to export.' };
    }
    const item = items[0];
    if (!item.videoUrl?.trim()) {
        return { success: false, error: 'Video URL is missing from the video overview.' };
    }

    if (format === 'MP4') {
        try {
            const fetchStart = now();
            const blob = await fetchVideoBlob(item.videoUrl);
            console.info(`${EXPORT_LOG} mp4_blob_ready`, { elapsedMs: now() - fetchStart, bytes: blob.size });
            return {
                success: true,
                count: 1,
                filename: `notebooklm_video_overview_${tabTitle}_${timestamp}.mp4`,
                mimeType: 'video/mp4',
                blob
            };
        } catch (error) {
            console.error(`${EXPORT_LOG} mp4_export_failed`, error);
            return { success: false, error: 'Failed to download video MP4.' };
        }
    }

    const videoBlob = await fetchVideoBlob(item.videoUrl);

    if (format === 'WAV') {
        try {
            const audioBlob = await exportAudioWav(videoBlob);
            return {
                success: true,
                count: 1,
                filename: `notebooklm_video_overview_audio_${tabTitle}_${timestamp}.wav`,
                mimeType: 'audio/wav',
                blob: audioBlob
            };
        } catch (error) {
            console.error(`${EXPORT_LOG} wav_export_failed`, error);
            return { success: false, error: 'Failed to export audio WAV.' };
        }
    }

    if (format === 'ZIP') {
        try {
            const frames = await exportFramesZip(videoBlob);
            return {
                success: true,
                count: frames.count,
                filename: `notebooklm_video_overview_frames_${tabTitle}_${timestamp}.zip`,
                mimeType: 'application/zip',
                blob: frames.blob
            };
        } catch (error) {
            console.error(`${EXPORT_LOG} zip_export_failed`, error);
            return { success: false, error: 'Failed to export frame ZIP.' };
        }
    }

    return { success: false, error: 'Unsupported format' };
};
