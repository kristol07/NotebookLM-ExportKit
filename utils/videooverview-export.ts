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
const PREVIEW_WIDTH = 48;
const PREVIEW_HEIGHT = 27;
const MAX_CANDIDATE_SAMPLES = 240;
const MAX_EXTRACTED_FRAMES = 96;

type ExtractedFrame = {
    index: number;
    timeSeconds: number;
    blob: Blob;
};

type TranscriptEntry = {
    start: number;
    end?: number;
    text: string;
    source: 'caption' | 'speech-segment' | 'fallback';
};

const pad = (value: number) => String(Math.max(0, Math.floor(value))).padStart(2, '0');

const formatTimestamp = (value: number) => {
    const totalSeconds = Math.max(0, Math.floor(value));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
};

const sanitizeLine = (value: string) => value.replace(/\s+/g, ' ').trim();

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
        const isFirst = frames.length === 0;
        const isLastSample = i === sampleTimes.length - 1;
        const dueToGap = time - lastKeptTime >= forcedGap;
        const dueToChange = diff >= 0.09;
        const shouldKeep = isFirst || isLastSample || dueToGap || dueToChange;
        if (!shouldKeep) {
            continue;
        }
        frameCtx.drawImage(video, 0, 0, frameCanvas.width, frameCanvas.height);
        const blob = await toBlob(frameCanvas);
        frames.push({
            index: frames.length + 1,
            timeSeconds: time,
            blob
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
        frames.push({ index: 1, timeSeconds: 0, blob: await toBlob(frameCanvas) });
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
        const audioBuffer = await context.decodeAudioData(arrayBuffer.slice(0));
        return audioBuffer;
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

const detectSpeechSegments = (audioBuffer: AudioBuffer) => {
    const sampleRate = audioBuffer.sampleRate;
    const windowSeconds = 0.5;
    const windowSize = Math.max(1, Math.floor(sampleRate * windowSeconds));
    const channelCount = audioBuffer.numberOfChannels;
    const channels = Array.from({ length: channelCount }, (_, index) => audioBuffer.getChannelData(index));
    const windows: Array<{ start: number; end: number; rms: number }> = [];
    for (let start = 0; start < audioBuffer.length; start += windowSize) {
        const end = Math.min(audioBuffer.length, start + windowSize);
        let sumSquares = 0;
        const frameCount = Math.max(1, end - start);
        for (let i = start; i < end; i += 1) {
            let mixed = 0;
            for (let ch = 0; ch < channels.length; ch += 1) {
                mixed += channels[ch][i] || 0;
            }
            mixed /= channelCount;
            sumSquares += mixed * mixed;
        }
        const rms = Math.sqrt(sumSquares / frameCount);
        windows.push({
            start: start / sampleRate,
            end: end / sampleRate,
            rms
        });
    }
    if (windows.length === 0) {
        return [] as Array<{ start: number; end: number }>;
    }
    const sortedRms = windows.map((item) => item.rms).sort((a, b) => a - b);
    const floor = sortedRms[Math.floor(sortedRms.length * 0.35)] || 0;
    const threshold = Math.max(0.008, floor * 2.2);

    const segments: Array<{ start: number; end: number }> = [];
    let active: { start: number; end: number } | null = null;
    windows.forEach((window) => {
        if (window.rms >= threshold) {
            if (!active) {
                active = { start: window.start, end: window.end };
            } else {
                active.end = window.end;
            }
            return;
        }
        if (active) {
            segments.push(active);
            active = null;
        }
    });
    if (active) {
        segments.push(active);
    }

    const merged: Array<{ start: number; end: number }> = [];
    segments.forEach((segment) => {
        const previous = merged[merged.length - 1];
        if (previous && segment.start - previous.end <= 1) {
            previous.end = segment.end;
            return;
        }
        merged.push({ ...segment });
    });

    return merged.filter((segment) => segment.end - segment.start >= 1);
};

const readCaptionTracks = (video: HTMLVideoElement) => {
    const entries: TranscriptEntry[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < video.textTracks.length; i += 1) {
        const track = video.textTracks[i];
        track.mode = 'hidden';
        const cues = track.cues;
        if (!cues) {
            continue;
        }
        for (let cueIndex = 0; cueIndex < cues.length; cueIndex += 1) {
            const cue = cues[cueIndex] as TextTrackCue;
            const text = sanitizeLine((cue as any).text || '');
            if (!text) {
                continue;
            }
            const key = `${cue.startTime}:${cue.endTime}:${text}`;
            if (seen.has(key)) {
                continue;
            }
            seen.add(key);
            entries.push({
                start: cue.startTime,
                end: cue.endTime,
                text,
                source: 'caption'
            });
        }
    }
    entries.sort((a, b) => a.start - b.start);
    return entries;
};

const buildTranscript = (
    captionEntries: TranscriptEntry[],
    speechSegments: Array<{ start: number; end: number }>
) => {
    if (captionEntries.length > 0) {
        const txt = captionEntries
            .map((entry) => `[${formatTimestamp(entry.start)}] ${entry.text}`)
            .join('\n');
        return { entries: captionEntries, txt };
    }

    if (speechSegments.length > 0) {
        const entries = speechSegments.map((segment) => ({
            start: segment.start,
            end: segment.end,
            text: '(Speech detected; text transcript unavailable in this browser session.)',
            source: 'speech-segment' as const
        }));
        const txt = entries
            .map((entry) => `[${formatTimestamp(entry.start)} - ${formatTimestamp(entry.end || entry.start)}] ${entry.text}`)
            .join('\n');
        return { entries, txt };
    }

    const fallbackEntry: TranscriptEntry = {
        start: 0,
        text: 'No captions or speech segments could be extracted from this video in-browser.',
        source: 'fallback'
    };
    return { entries: [fallbackEntry], txt: fallbackEntry.text };
};

const fetchVideoBlobViaBackground = async (videoUrl: string) => {
    const response = await browser.runtime.sendMessage({
        type: 'fetch-binary-blob',
        url: videoUrl
    });
    if (!response?.success || !(response.arrayBuffer instanceof ArrayBuffer)) {
        throw new Error(`Background fetch failed: ${response?.error || 'unknown_error'}`);
    }
    return new Blob([response.arrayBuffer], { type: response.mimeType || 'video/mp4' });
};

const fetchVideoBlob = async (videoUrl: string) => {
    try {
        const response = await fetch(videoUrl, {
            method: 'GET',
            credentials: 'include',
            redirect: 'follow',
            cache: 'no-store'
        });
        if (response.ok) {
            return await response.blob();
        }
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

const exportVideoOverviewZip = async (item: VideoOverviewItem, title: string, timestamp: string) => {
    const videoBlob = await fetchVideoBlob(item.videoUrl);
    const { video, objectUrl } = await loadVideoElement(videoBlob);
    try {
        const frames = await extractFramesSmart(video);
        const captions = readCaptionTracks(video);
        const decodedAudio = await decodeAudioBuffer(videoBlob);
        const speechSegments = decodedAudio ? detectSpeechSegments(decodedAudio) : [];
        const transcript = buildTranscript(captions, speechSegments);

        const zip = new JSZip();
        zip.file('video.mp4', videoBlob);
        const framesFolder = zip.folder('frames');
        if (framesFolder) {
            frames.forEach((frame) => {
                framesFolder.file(`frame_${String(frame.index).padStart(4, '0')}.jpg`, frame.blob);
            });
        }
        if (decodedAudio) {
            zip.file('audio.wav', audioBufferToWavBlob(decodedAudio));
        } else {
            zip.file('audio.txt', 'Audio extraction failed in this browser session.');
        }
        zip.file('transcript.txt', transcript.txt);
        zip.file('transcript.json', JSON.stringify(transcript.entries, null, 2));
        zip.file('manifest.json', JSON.stringify({
            title,
            sourceVideoUrl: item.videoUrl,
            durationSeconds: Number.isFinite(video.duration) ? video.duration : null,
            generatedAt: new Date().toISOString(),
            frameCount: frames.length,
            transcriptSource: transcript.entries[0]?.source || 'fallback'
        }, null, 2));
        const blob = await zip.generateAsync({ type: 'blob' });
        return {
            blob,
            count: frames.length
        };
    } finally {
        video.pause();
        video.removeAttribute('src');
        video.load();
        URL.revokeObjectURL(objectUrl);
    }
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
            const blob = await fetchVideoBlob(item.videoUrl);
            const filename = `notebooklm_video_overview_${tabTitle}_${timestamp}.mp4`;
            return {
                success: true,
                count: 1,
                filename,
                mimeType: 'video/mp4',
                blob
            };
        } catch (error) {
            console.error(`${EXPORT_LOG} mp4_export_failed`, error);
            return { success: false, error: 'Failed to download video MP4.' };
        }
    }

    if (format === 'ZIP') {
        try {
            const title = item.title?.trim() || tabTitle || 'video_overview';
            const bundle = await exportVideoOverviewZip(item, title, timestamp);
            const filename = `notebooklm_video_overview_bundle_${tabTitle}_${timestamp}.zip`;
            return {
                success: true,
                count: bundle.count,
                filename,
                mimeType: 'application/zip',
                blob: bundle.blob
            };
        } catch (error) {
            console.error(`${EXPORT_LOG} zip_export_failed`, error);
            return { success: false, error: 'Failed to build video overview bundle.' };
        }
    }

    return { success: false, error: 'Unsupported format' };
};
