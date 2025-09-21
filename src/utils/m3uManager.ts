import { File } from "expo-file-system/next";
import type { LocalTrack } from "@/systems/LocalMusicState";

const QUEUE_FILE_PATH = "queue.m3u";

export interface M3UEntry {
    duration: number;
    title: string;
    artist: string;
    filePath: string;
}

/**
 * Parses M3U playlist content into track entries
 */
function parseM3U(content: string): M3UEntry[] {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const entries: M3UEntry[] = [];

    let currentEntry: Partial<M3UEntry> = {};

    for (const line of lines) {
        if (line.startsWith('#EXTM3U')) {
        } else if (line.startsWith('#EXTINF:')) {
            // Parse track info: #EXTINF:duration,artist - title
            const match = line.match(/^#EXTINF:([^,]+),(.+)$/);
            if (match) {
                const duration = Number.parseFloat(match[1]) || 0;
                const titleInfo = match[2];

                // Try to parse "artist - title" format
                const artistTitleMatch = titleInfo.match(/^(.+?)\s*-\s*(.+)$/);
                if (artistTitleMatch) {
                    currentEntry.artist = artistTitleMatch[1];
                    currentEntry.title = artistTitleMatch[2];
                } else {
                    currentEntry.artist = "Unknown Artist";
                    currentEntry.title = titleInfo;
                }

                currentEntry.duration = duration;
            }
        } else if (!line.startsWith('#')) {
            // File path
            currentEntry.filePath = line;

            // Complete the entry if we have all required fields
            if (currentEntry.filePath && currentEntry.title && currentEntry.artist !== undefined) {
                entries.push({
                    duration: currentEntry.duration || 0,
                    title: currentEntry.title,
                    artist: currentEntry.artist,
                    filePath: currentEntry.filePath
                });
            }

            // Reset for next entry
            currentEntry = {};
        }
    }

    return entries;
}

/**
 * Converts track entries to M3U playlist content
 */
function createM3U(entries: M3UEntry[]): string {
    const lines = ['#EXTM3U'];

    for (const entry of entries) {
        // Convert duration from "mm:ss" format to seconds if needed
        let durationSeconds = entry.duration;
        if (typeof entry.duration === 'string' && entry.duration.includes(':')) {
            const parts = entry.duration.split(':');
            durationSeconds = Number.parseInt(parts[0]) * 60 + Number.parseInt(parts[1]);
        }

        lines.push(`#EXTINF:${durationSeconds},${entry.artist} - ${entry.title}`);
        lines.push(entry.filePath);
    }

    return lines.join('\n');
}

/**
 * Converts LocalTrack to M3U entry
 */
function localTrackToM3UEntry(track: LocalTrack): M3UEntry {
    // Convert duration from "mm:ss" format to seconds
    let durationSeconds = 0;
    if (track.duration && typeof track.duration === 'string' && track.duration.includes(':')) {
        const parts = track.duration.split(':');
        durationSeconds = Number.parseInt(parts[0]) * 60 + Number.parseInt(parts[1]);
    }

    return {
        duration: durationSeconds,
        title: track.title,
        artist: track.artist,
        filePath: track.filePath
    };
}

/**
 * Converts M3U entry to LocalTrack
 */
function m3uEntryToLocalTrack(entry: M3UEntry): LocalTrack {
    // Convert duration from seconds to "mm:ss" format
    const minutes = Math.floor(entry.duration / 60);
    const seconds = Math.floor(entry.duration % 60);
    const durationString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Extract filename from path
    const fileName = entry.filePath.split('/').pop() || entry.filePath;

    return {
        id: entry.filePath,
        title: entry.title,
        artist: entry.artist,
        duration: durationString,
        filePath: entry.filePath,
        fileName
    };
}

/**
 * Saves tracks to queue.m3u file
 */
export async function saveQueueToM3U(tracks: LocalTrack[]): Promise<void> {
    try {
        const entries = tracks.map(localTrackToM3UEntry);
        const m3uContent = createM3U(entries);

        const file = new File(QUEUE_FILE_PATH);
        file.write(m3uContent);
        console.log(`Saved queue with ${tracks.length} tracks to ${QUEUE_FILE_PATH}`);
    } catch (error) {
        console.error('Failed to save queue to M3U:', error);
    }
}

/**
 * Loads tracks from queue.m3u file
 */
export async function loadQueueFromM3U(): Promise<LocalTrack[]> {
    try {
        const file = new File(QUEUE_FILE_PATH);

        if (!file.exists) {
            console.log('No queue.m3u file found, starting with empty queue');
            return [];
        }

        const content = file.text();
        const entries = parseM3U(content);
        const tracks = entries.map(m3uEntryToLocalTrack);

        console.log(`Loaded queue with ${tracks.length} tracks from ${QUEUE_FILE_PATH}`);
        return tracks;
    } catch (error) {
        console.error('Failed to load queue from M3U:', error);
        return [];
    }
}

/**
 * Deletes the queue.m3u file
 */
export async function clearQueueM3U(): Promise<void> {
    try {
        const file = new File(QUEUE_FILE_PATH);
        if (file.exists) {
            file.delete();
            console.log('Cleared queue.m3u file');
        }
    } catch (error) {
        console.error('Failed to clear queue M3U:', error);
    }
}