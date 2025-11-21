import { createJSONManager } from "@/utils/JSONManager";
import { ensureCacheDirectory, getCacheDirectory } from "@/utils/cacheDirectories";

export interface PersistedQueuedTrack {
    filePath: string;
    title: string;
    artist: string;
    album?: string;
    duration: string;
    thumbnail?: string;
    thumbnailKey?: string;
}

export interface PlaylistSnapshot {
    version: number;
    updatedAt: number;
    queue: PersistedQueuedTrack[];
    currentIndex: number;
    isPlaying: boolean;
}

const PLAYLIST_CACHE_VERSION = 3;

const defaultSnapshot: PlaylistSnapshot = {
    version: PLAYLIST_CACHE_VERSION,
    updatedAt: 0,
    queue: [],
    currentIndex: -1,
    isPlaying: false,
};

const playlistCache$ = createJSONManager<PlaylistSnapshot>({
    filename: "playlistCache",
    initialValue: defaultSnapshot,
    format: "json",
    saveTimeout: 0,
    preload: false,
});

type LegacyQueuedTrack = {
    id?: string;
    title?: string;
    artist?: string;
    album?: string;
    duration?: string;
    filePath?: string;
    fileName?: string;
    queueEntryId?: string;
    thumbnail?: string;
    thumbnailKey?: string;
    thumb?: string;
};

const getFileName = (filePath: string): string => {
    const lastSlash = filePath.lastIndexOf("/");
    return lastSlash === -1 ? filePath : filePath.slice(lastSlash + 1);
};

const thumbnailsDir = getCacheDirectory("thumbnails");
ensureCacheDirectory(thumbnailsDir);
const thumbnailsDirUri = thumbnailsDir.uri;

const buildThumbnailUri = (key?: string): string | undefined => {
    if (!key) {
        return undefined;
    }

    const normalizedBase = thumbnailsDirUri.endsWith("/") ? thumbnailsDirUri.slice(0, -1) : thumbnailsDirUri;
    return `${normalizedBase}/${key}.png`;
};

const deriveThumbnailKey = (value?: string): string | undefined => {
    if (!value || typeof value !== "string" || value.length === 0) {
        return undefined;
    }

    const fileName = value.split("/").pop() ?? value;
    const [baseName] = fileName.split(".");
    return baseName && baseName.length > 0 ? baseName : undefined;
};

const sanitizeTrack = (input: LegacyQueuedTrack | PersistedQueuedTrack): PersistedQueuedTrack | null => {
    const legacyInput = input as LegacyQueuedTrack;
    const filePath =
        typeof legacyInput.filePath === "string" && legacyInput.filePath
            ? legacyInput.filePath
            : "id" in legacyInput && typeof legacyInput.id === "string"
              ? legacyInput.id
              : "";

    if (!filePath) {
        return null;
    }

    return {
        filePath,
        title: typeof input.title === "string" && input.title.length > 0 ? input.title : getFileName(filePath),
        artist: typeof input.artist === "string" && input.artist.length > 0 ? input.artist : "Unknown Artist",
        album: typeof input.album === "string" && input.album.length > 0 ? input.album : undefined,
        duration: typeof input.duration === "string" && input.duration.length > 0 ? input.duration : "0:00",
        thumbnail:
            typeof input.thumbnail === "string" && input.thumbnail.length > 0
                ? input.thumbnail
                : buildThumbnailUri(
                      deriveThumbnailKey(
                          typeof legacyInput.thumbnailKey === "string" && legacyInput.thumbnailKey.length > 0
                              ? legacyInput.thumbnailKey
                              : typeof legacyInput.thumb === "string" && legacyInput.thumb.length > 0
                                ? legacyInput.thumb
                                : legacyInput.thumbnail,
                      ),
                  ),
        thumbnailKey:
            typeof legacyInput.thumbnailKey === "string" && legacyInput.thumbnailKey.length > 0
                ? legacyInput.thumbnailKey
                : typeof legacyInput.thumb === "string" && legacyInput.thumb.length > 0
                  ? legacyInput.thumb
                  : deriveThumbnailKey(legacyInput.thumbnail),
    };
};

const sanitizeSnapshot = (input: Partial<PlaylistSnapshot>): PlaylistSnapshot => {
    const queue = Array.isArray(input.queue)
        ? input.queue
              .map((track) => sanitizeTrack(track))
              .filter((track): track is PersistedQueuedTrack => Boolean(track))
        : [];
    const hasQueue = queue.length > 0;

    const currentIndex =
        typeof input.currentIndex === "number" && input.currentIndex >= 0 && input.currentIndex < queue.length
            ? input.currentIndex
            : hasQueue
              ? Math.min(Math.max(input.currentIndex ?? 0, 0), queue.length - 1)
              : -1;

    return {
        version: PLAYLIST_CACHE_VERSION,
        updatedAt: typeof input.updatedAt === "number" ? input.updatedAt : Date.now(),
        queue,
        currentIndex,
        isPlaying: Boolean(input.isPlaying && hasQueue),
    };
};

export const getPlaylistCacheSnapshot = (): PlaylistSnapshot => {
    try {
        const snapshot = playlistCache$.get();
        if (!snapshot) {
            return defaultSnapshot;
        }

        return sanitizeSnapshot(snapshot);
    } catch (error) {
        console.error("Failed to read playlist cache; resetting to defaults", error);
        playlistCache$.set(defaultSnapshot);
        return defaultSnapshot;
    }
};

export const persistPlaylistSnapshot = (snapshot: Omit<PlaylistSnapshot, "version" | "updatedAt">) => {
    const sanitized = sanitizeSnapshot({
        ...snapshot,
        updatedAt: Date.now(),
    });

    playlistCache$.set(sanitized);
};

export const hasCachedPlaylistData = (): boolean => getPlaylistCacheSnapshot().queue.length > 0;

export const clearPlaylistCache = (): void => {
    playlistCache$.set({
        ...defaultSnapshot,
        updatedAt: Date.now(),
    });
};
