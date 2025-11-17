import { deleteCacheFiles } from "@/utils/cacheDirectories";
import { createJSONManager } from "@/utils/JSONManager";

export interface PersistedLibraryTrack {
    rootIndex: number;
    relativePath: string;
    fileName: string;
    title: string;
    artist: string;
    album?: string;
    duration: string;
    thumbnail?: string;
    thumbnailKey?: string;
}

export interface LibrarySnapshot {
    version: number;
    updatedAt: number;
    tracks: PersistedLibraryTrack[];
    isScanning: boolean;
    lastScanTime: number | null;
    roots: string[];
}

const LIBRARY_CACHE_VERSION = 3;

const defaultSnapshot: LibrarySnapshot = {
    version: LIBRARY_CACHE_VERSION,
    updatedAt: 0,
    tracks: [],
    isScanning: false,
    lastScanTime: null,
    roots: [],
};

const libraryCache$ = createJSONManager<LibrarySnapshot>({
    filename: "libraryCache",
    initialValue: defaultSnapshot,
    format: "msgpack",
    saveTimeout: 0,
    preload: false,
});

deleteCacheFiles("data", ["libraryCache.json"]);

type RawLibraryTrack = Partial<PersistedLibraryTrack>;

type RawLibrarySnapshot = Partial<LibrarySnapshot> & {
    artists?: unknown;
    albums?: unknown;
    playlists?: unknown;
    tracks?: RawLibraryTrack[] | PersistedLibraryTrack[];
    roots?: unknown;
};

const normalizeRootPath = (path: string): string => {
    if (!path) {
        return "";
    }

    const withoutPrefix = path.startsWith("file://") ? path.replace("file://", "") : path;
    const trimmed = withoutPrefix.replace(/\/+$/, "");
    return trimmed.length > 0 ? trimmed : withoutPrefix;
};

const fileNameFromPath = (path: string): string => {
    const lastSlash = path.lastIndexOf("/");
    return lastSlash === -1 ? path : path.slice(lastSlash + 1);
};

const deriveThumbnailKey = (thumbnail: unknown): string | undefined => {
    if (typeof thumbnail !== "string" || thumbnail.length === 0) {
        return undefined;
    }

    const lastSlash = thumbnail.lastIndexOf("/");
    const fileName = lastSlash === -1 ? thumbnail : thumbnail.slice(lastSlash + 1);
    const [baseName] = fileName.split(".");
    return baseName && baseName.length > 0 ? baseName : undefined;
};

const sanitizeTrack = (
    track: RawLibraryTrack | PersistedLibraryTrack,
    roots: string[],
): PersistedLibraryTrack | null => {
    const rootIndex =
        typeof track.rootIndex === "number" && track.rootIndex >= 0 && track.rootIndex < roots.length
            ? track.rootIndex
            : 0;

    const relativePath =
        typeof track.relativePath === "string" && track.relativePath.length > 0 ? track.relativePath : "";

    if (relativePath.length === 0) {
        return null;
    }

    const fileName =
        typeof track.fileName === "string" && track.fileName.length > 0
            ? track.fileName
            : fileNameFromPath(relativePath);

    const thumbnailKey =
        typeof track.thumbnailKey === "string" && track.thumbnailKey.length > 0
            ? track.thumbnailKey
            : deriveThumbnailKey(track.thumbnail);
    const thumbnail =
        thumbnailKey === undefined && typeof track.thumbnail === "string" && track.thumbnail.length > 0
            ? track.thumbnail
            : undefined;

    return {
        rootIndex: rootIndex >= 0 ? rootIndex : 0,
        relativePath,
        fileName,
        title: typeof track.title === "string" && track.title.length > 0 ? track.title : fileName,
        artist: typeof track.artist === "string" && track.artist.length > 0 ? track.artist : "Unknown Artist",
        album: typeof track.album === "string" && track.album.length > 0 ? track.album : undefined,
        duration: typeof track.duration === "string" && track.duration.length > 0 ? track.duration : "0:00",
        thumbnail,
        thumbnailKey,
    };
};

const sanitizeSnapshot = (input: RawLibrarySnapshot): LibrarySnapshot => {
    const roots = Array.isArray(input.roots)
        ? input.roots
              .map((root) => (typeof root === "string" ? normalizeRootPath(root) : ""))
              .filter((root): root is string => root.length > 0)
        : [];

    const tracks = Array.isArray(input.tracks)
        ? input.tracks
              .map((track) => sanitizeTrack(track, roots))
              .filter((track): track is PersistedLibraryTrack => Boolean(track))
        : [];

    return {
        version: LIBRARY_CACHE_VERSION,
        updatedAt: typeof input.updatedAt === "number" ? input.updatedAt : Date.now(),
        tracks,
        isScanning: Boolean(input.isScanning),
        lastScanTime: typeof input.lastScanTime === "number" ? input.lastScanTime : null,
        roots,
    };
};

export const getLibrarySnapshot = (): LibrarySnapshot => {
    const snapshot = libraryCache$.get();
    if (!snapshot) {
        return defaultSnapshot;
    }

    return sanitizeSnapshot(snapshot);
};

export const persistLibrarySnapshot = (
    snapshot: Omit<LibrarySnapshot, "version" | "updatedAt"> & Partial<Pick<LibrarySnapshot, "updatedAt">>,
) => {
    const sanitized = sanitizeSnapshot({
        ...snapshot,
        updatedAt: snapshot.updatedAt ?? Date.now(),
    });

    libraryCache$.set(sanitized);
};

export const hasCachedLibraryData = (): boolean => getLibrarySnapshot().tracks.length > 0;

export const clearLibraryCache = (): void => {
    libraryCache$.set({
        ...defaultSnapshot,
        updatedAt: Date.now(),
    });
};
