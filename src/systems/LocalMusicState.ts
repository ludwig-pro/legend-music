import { observable } from "@legendapp/state";
import { FileSystemNext } from "expo-file-system/next";

import { createJSONManager } from "@/utils/JSONManager";

export interface LocalTrack {
    id: string;
    title: string;
    artist: string;
    duration: string;
    filePath: string;
    fileName: string;
    thumbnail?: string;
}

export interface LocalMusicSettings {
    libraryPaths: string[];
    autoScanOnStart: boolean;
    lastScanTime: number;
}

export interface LocalMusicState {
    tracks: LocalTrack[];
    isScanning: boolean;
    scanProgress: number;
    scanTotal: number;
    error: string | null;
}

// Settings persistence
export const localMusicSettings$ = createJSONManager<LocalMusicSettings>({
    filename: "localMusicSettings",
    initialValue: {
        libraryPaths: ["/Users/jay/Downloads/mp3"],
        autoScanOnStart: true,
        lastScanTime: 0,
    },
});

// Runtime state
export const localMusicState$ = observable<LocalMusicState>({
    tracks: [],
    isScanning: false,
    scanProgress: 0,
    scanTotal: 0,
    error: null,
});

// Extract metadata from filename
function parseFilename(fileName: string): { title: string; artist: string } {
    // Remove extension
    const name = fileName.replace(/\.mp3$/i, "");
    
    // Try to parse "Artist - Title" format
    if (name.includes(" - ")) {
        const [artist, title] = name.split(" - ", 2);
        return {
            title: title.trim(),
            artist: artist.trim(),
        };
    }
    
    // If no artist separator, use filename as title
    return {
        title: name.trim(),
        artist: "Unknown Artist",
    };
}

// Generate unique ID for track
function generateTrackId(filePath: string): string {
    return `local_${filePath.replace(/[^a-zA-Z0-9]/g, "_")}`;
}

// Scan directory for MP3 files
async function scanDirectory(directoryPath: string): Promise<LocalTrack[]> {
    const tracks: LocalTrack[] = [];
    
    try {
        const directory = FileSystemNext.Directory.create(directoryPath);
        
        if (!(await directory.exists())) {
            console.warn(`Directory does not exist: ${directoryPath}`);
            return tracks;
        }
        
        const items = await directory.list();
        
        for (const item of items) {
            if (item.isFile && item.name.toLowerCase().endsWith('.mp3')) {
                const filePath = `${directoryPath}/${item.name}`;
                const { title, artist } = parseFilename(item.name);
                
                const track: LocalTrack = {
                    id: generateTrackId(filePath),
                    title,
                    artist,
                    duration: "0:00", // Will be populated when loading
                    filePath,
                    fileName: item.name,
                };
                
                tracks.push(track);
            }
        }
        
        console.log(`Found ${tracks.length} MP3 files in ${directoryPath}`);
        return tracks;
    } catch (error) {
        console.error(`Error scanning directory ${directoryPath}:`, error);
        throw error;
    }
}

// Scan all configured library paths
export async function scanLocalMusic(): Promise<void> {
    const paths = localMusicSettings$.libraryPaths.get();
    
    if (paths.length === 0) {
        localMusicState$.error.set("No library paths configured");
        return;
    }
    
    localMusicState$.isScanning.set(true);
    localMusicState$.error.set(null);
    localMusicState$.scanProgress.set(0);
    localMusicState$.scanTotal.set(paths.length);
    
    const allTracks: LocalTrack[] = [];
    
    try {
        for (let i = 0; i < paths.length; i++) {
            const path = paths[i];
            console.log(`Scanning directory: ${path}`);
            
            try {
                const tracks = await scanDirectory(path);
                allTracks.push(...tracks);
            } catch (error) {
                console.error(`Failed to scan ${path}:`, error);
                // Continue with other directories
            }
            
            localMusicState$.scanProgress.set(i + 1);
        }
        
        // Sort tracks by artist then title
        allTracks.sort((a, b) => {
            const artistCompare = a.artist.localeCompare(b.artist);
            if (artistCompare !== 0) return artistCompare;
            return a.title.localeCompare(b.title);
        });
        
        localMusicState$.tracks.set(allTracks);
        localMusicSettings$.lastScanTime.set(Date.now());
        
        console.log(`Scan complete: Found ${allTracks.length} total MP3 files`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        localMusicState$.error.set(`Scan failed: ${errorMessage}`);
        console.error("Local music scan failed:", error);
    } finally {
        localMusicState$.isScanning.set(false);
    }
}

// Initialize and scan on app start
export function initializeLocalMusic(): void {
    const settings = localMusicSettings$.get();
    
    if (settings.autoScanOnStart) {
        console.log("Auto-scanning local music on startup...");
        scanLocalMusic().catch(error => {
            console.error("Failed to auto-scan local music:", error);
        });
    }
}