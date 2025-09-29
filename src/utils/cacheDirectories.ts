import * as FileSystem from "expo-file-system/next";

/**
 * Gets a cache directory for the LegendMusic app
 * All cache directories will be under cache/LegendMusic/
 */
export function getCacheDirectory(subdirectory: string): FileSystem.Directory {
    const legendMusicCacheDir = new FileSystem.Directory(FileSystem.Paths.cache, "LegendMusic");
    return new FileSystem.Directory(legendMusicCacheDir, subdirectory);
}

/**
 * Ensures a cache directory exists, creating it if necessary
 */
export function ensureCacheDirectory(cacheDir: FileSystem.Directory): void {
    try {
        if (!cacheDir.exists) {
            cacheDir.create();
        }
    } catch (error) {
        console.warn(`Failed to create cache directory ${cacheDir.uri}:`, error);
    }
}
