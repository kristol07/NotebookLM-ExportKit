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
import { jsPDF } from 'jspdf';
import PptxGenJS from 'pptxgenjs';
import { browser } from 'wxt/browser';
import { ExportFormat, ExportResult, VideoOverviewItem } from './export-core';

const EXPORT_LOG = '[VIDEO_OVERVIEW_EXPORT]';
const now = () => Math.round(performance.now());
const PREVIEW_WIDTH = 48;
const PREVIEW_HEIGHT = 27;
const MAX_CANDIDATE_SAMPLES = 240;
const MAX_EXTRACTED_FRAMES = 96;
const MAX_FRAME_CACHE_ENTRIES = 4;

type ExtractedFrame = {
    index: number;
    blob: Blob;
};

export type VideoOverviewExtractedFrame = ExtractedFrame;

type FrameExportResult = {
    blob: Blob;
    count: number;
};

type CachedFramesEntry = {
    promise: Promise<ExtractedFrame[]>;
    updatedAt: number;
};

const extractedFramesCache = new Map<string, CachedFramesEntry>();

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

const blobToDataUrl = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result !== 'string') {
                reject(new Error('Failed to convert blob to data URL.'));
                return;
            }
            resolve(reader.result);
        };
        reader.onerror = () => reject(new Error('Failed to read blob.'));
        reader.readAsDataURL(blob);
    });

const getImageDimensions = (dataUrl: string): Promise<{ width: number; height: number }> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
        image.onerror = () => reject(new Error('Failed to read image dimensions.'));
        image.src = dataUrl;
    });

const fitToBox = (width: number, height: number, boxWidth: number, boxHeight: number) => {
    const scale = Math.min(boxWidth / width, boxHeight / height);
    const targetWidth = width * scale;
    const targetHeight = height * scale;
    return {
        width: targetWidth,
        height: targetHeight,
        x: (boxWidth - targetWidth) / 2,
        y: (boxHeight - targetHeight) / 2
    };
};

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

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
        return await context.decodeAudioData(arrayBuffer);
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
    const channelData = Array.from({ length: numChannels }, (_, channelIndex) =>
        audioBuffer.getChannelData(channelIndex)
    );
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
            const sample = channelData[channel]?.[sampleIndex] || 0;
            const clamped = Math.max(-1, Math.min(1, sample));
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

const pruneExtractedFramesCache = () => {
    if (extractedFramesCache.size <= MAX_FRAME_CACHE_ENTRIES) {
        return;
    }
    const sorted = Array.from(extractedFramesCache.entries())
        .sort((a, b) => a[1].updatedAt - b[1].updatedAt);
    while (sorted.length > MAX_FRAME_CACHE_ENTRIES) {
        const oldest = sorted.shift();
        if (!oldest) {
            break;
        }
        extractedFramesCache.delete(oldest[0]);
    }
};

const extractFramesFromVideoBlob = async (videoBlob: Blob) => {
    const { video, objectUrl } = await loadVideoElement(videoBlob);
    try {
        const framesStart = now();
        const frames = await extractFramesSmart(video);
        console.info(`${EXPORT_LOG} extract_frames_complete`, {
            elapsedMs: now() - framesStart,
            count: frames.length
        });
        return frames;
    } finally {
        video.pause();
        video.removeAttribute('src');
        video.load();
        URL.revokeObjectURL(objectUrl);
    }
};

const getOrExtractFrames = (videoBlob: Blob, cacheKey: string) => {
    const existing = extractedFramesCache.get(cacheKey);
    if (existing) {
        existing.updatedAt = Date.now();
        return existing.promise;
    }

    const promise = extractFramesFromVideoBlob(videoBlob)
        .catch((error) => {
            extractedFramesCache.delete(cacheKey);
            throw error;
        });

    extractedFramesCache.set(cacheKey, {
        promise,
        updatedAt: Date.now()
    });
    pruneExtractedFramesCache();
    return promise;
};

const pickFramesEvenly = <T>(items: T[], maxItems: number) => {
    if (maxItems <= 0 || items.length <= maxItems) {
        return items;
    }
    const picked: T[] = [];
    const lastIndex = items.length - 1;
    for (let i = 0; i < maxItems; i += 1) {
        const index = Math.round((i / (maxItems - 1 || 1)) * lastIndex);
        const item = items[index];
        if (item) {
            picked.push(item);
        }
    }
    return picked;
};

export const extractVideoOverviewFrames = async (
    videoBlob: Blob,
    options?: { cacheKey?: string; maxFrames?: number }
): Promise<VideoOverviewExtractedFrame[]> => {
    const cacheKey = options?.cacheKey
        || `videooverview:${videoBlob.size}:${videoBlob.type || 'video/mp4'}`;
    const maxFrames = Number.isFinite(options?.maxFrames)
        ? Math.max(1, Math.floor(options?.maxFrames as number))
        : MAX_EXTRACTED_FRAMES;
    const frames = await getOrExtractFrames(videoBlob, cacheKey);
    return pickFramesEvenly(frames, maxFrames);
};

const exportFramesZip = async (videoBlob: Blob, cacheKey: string): Promise<FrameExportResult> => {
    const frames = await extractVideoOverviewFrames(videoBlob, { cacheKey });
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
};

const exportFramesPdf = async (videoBlob: Blob, cacheKey: string): Promise<FrameExportResult> => {
    const frames = await extractVideoOverviewFrames(videoBlob, { cacheKey });
    const firstFrameDataUrl = await blobToDataUrl(frames[0].blob);
    const firstSize = await getImageDimensions(firstFrameDataUrl);
    const orientation = firstSize.width >= firstSize.height ? 'landscape' : 'portrait';
    const longEdge = 1280;
    const pageWidth = orientation === 'landscape'
        ? longEdge
        : Math.max(720, Math.round(longEdge * (firstSize.width / firstSize.height)));
    const pageHeight = orientation === 'landscape'
        ? Math.max(720, Math.round(longEdge * (firstSize.height / firstSize.width)))
        : longEdge;

    const pdf = new jsPDF({
        orientation,
        unit: 'pt',
        format: [pageWidth, pageHeight]
    });

    for (let i = 0; i < frames.length; i += 1) {
        if (i > 0) {
            pdf.addPage([pageWidth, pageHeight], orientation);
        }
        const dataUrl = i === 0 ? firstFrameDataUrl : await blobToDataUrl(frames[i].blob);
        const size = i === 0 ? firstSize : await getImageDimensions(dataUrl);
        const fit = fitToBox(size.width, size.height, pageWidth, pageHeight);
        pdf.addImage(dataUrl, 'JPEG', fit.x, fit.y, fit.width, fit.height);
    }

    return {
        blob: pdf.output('blob'),
        count: frames.length
    };
};

const exportFramesPptx = async (videoBlob: Blob, cacheKey: string): Promise<FrameExportResult> => {
    const frames = await extractVideoOverviewFrames(videoBlob, { cacheKey });
    const firstFrameDataUrl = await blobToDataUrl(frames[0].blob);
    const firstSize = await getImageDimensions(firstFrameDataUrl);
    const ratio = firstSize.width / firstSize.height;
    const slideWidth = 13.333;
    const slideHeight = slideWidth / ratio;

    const pptx = new PptxGenJS();
    pptx.defineLayout({
        name: 'VIDEO_OVERVIEW_FRAMES',
        width: slideWidth,
        height: slideHeight
    });
    pptx.layout = 'VIDEO_OVERVIEW_FRAMES';

    for (let i = 0; i < frames.length; i += 1) {
        const slide = pptx.addSlide();
        const dataUrl = i === 0 ? firstFrameDataUrl : await blobToDataUrl(frames[i].blob);
        slide.addImage({
            data: dataUrl,
            x: 0,
            y: 0,
            w: slideWidth,
            h: slideHeight
        });
    }

    return {
        blob: await pptx.write({ outputType: 'blob' }) as Blob,
        count: frames.length
    };
};

const buildFramesHtml = async (frames: ExtractedFrame[], title: string) => {
    const frameItems = await Promise.all(
        frames.map(async (frame) => {
            const dataUrl = await blobToDataUrl(frame.blob);
            return `<figure class="frame">
  <img src="${dataUrl}" alt="Frame ${frame.index}" loading="lazy" />
  <figcaption>Frame ${frame.index}</figcaption>
</figure>`;
        })
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f4f6fb;
      --card: #ffffff;
      --text: #172037;
      --muted: #53607a;
      --border: #d9e1f1;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", Arial, sans-serif;
      background: radial-gradient(circle at top right, #e6ecfa 0%, var(--bg) 45%, #eef2fb 100%);
      color: var(--text);
      padding: 24px;
    }
    .wrap { max-width: 1080px; margin: 0 auto; }
    h1 { margin: 0 0 20px; font-size: 28px; }
    .frames { display: grid; gap: 20px; }
    .frame {
      margin: 0;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(17, 33, 78, 0.07);
    }
    .frame img {
      width: 100%;
      display: block;
      background: #e9edf8;
    }
    .frame figcaption {
      padding: 12px 16px;
      color: var(--muted);
      font-size: 14px;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>${escapeHtml(title)}</h1>
    <section class="frames">
      ${frameItems.join('\n')}
    </section>
  </div>
</body>
</html>`;
};

const exportFramesHtml = async (videoBlob: Blob, cacheKey: string, title: string): Promise<FrameExportResult> => {
    const frames = await extractVideoOverviewFrames(videoBlob, { cacheKey });
    const html = await buildFramesHtml(frames, title);
    return {
        blob: new Blob([html], { type: 'text/html' }),
        count: frames.length
    };
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

    const frameCacheKey = `videooverview:${item.videoUrl.trim()}`;

    if (format === 'ZIP') {
        try {
            const frames = await exportFramesZip(videoBlob, frameCacheKey);
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

    if (format === 'PDF') {
        try {
            const frames = await exportFramesPdf(videoBlob, frameCacheKey);
            return {
                success: true,
                count: frames.count,
                filename: `notebooklm_video_overview_frames_${tabTitle}_${timestamp}.pdf`,
                mimeType: 'application/pdf',
                blob: frames.blob
            };
        } catch (error) {
            console.error(`${EXPORT_LOG} pdf_export_failed`, error);
            return { success: false, error: 'Failed to export frame PDF.' };
        }
    }

    if (format === 'PPTX') {
        try {
            const frames = await exportFramesPptx(videoBlob, frameCacheKey);
            return {
                success: true,
                count: frames.count,
                filename: `notebooklm_video_overview_frames_${tabTitle}_${timestamp}.pptx`,
                mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                blob: frames.blob
            };
        } catch (error) {
            console.error(`${EXPORT_LOG} pptx_export_failed`, error);
            return { success: false, error: 'Failed to export frame PowerPoint.' };
        }
    }

    if (format === 'HTML') {
        try {
            const frames = await exportFramesHtml(videoBlob, frameCacheKey, tabTitle || 'video_overview_frames');
            return {
                success: true,
                count: frames.count,
                filename: `notebooklm_video_overview_frames_${tabTitle}_${timestamp}.html`,
                mimeType: 'text/html',
                blob: frames.blob
            };
        } catch (error) {
            console.error(`${EXPORT_LOG} html_export_failed`, error);
            return { success: false, error: 'Failed to export frame HTML.' };
        }
    }

    return { success: false, error: 'Unsupported format' };
};
