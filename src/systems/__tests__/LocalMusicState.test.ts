import type { LocalTrack } from "@/systems/LocalMusicState";
import { initializeLocalMusic, localMusicSettings$, localMusicState$, scanLocalMusic } from "@/systems/LocalMusicState";
import { clearLibraryCache } from "@/systems/LibraryCache";

jest.mock("expo-file-system/next", () => {
    const mockFs = new Map<string, { files: string[]; directories: string[] }>();

    const normalizePath = (input: string): string => {
        if (!input) {
            return "/";
        }
        const withoutProtocol = input.startsWith("file://") ? input.replace("file://", "") : input;
        const collapsed = withoutProtocol.replace(/\/+/g, "/");
        if (collapsed === "/") {
            return "/";
        }
        const trimmed = collapsed.endsWith("/") ? collapsed.slice(0, -1) : collapsed;
        return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    };

    const resolvePath = (segments: Array<string | MockDirectory | MockFile>): string => {
        if (segments.length === 0) {
            return "/";
        }

        let resolved = "/";

        for (const segment of segments) {
            if (!segment) {
                continue;
            }

            let value: string;
            if (segment instanceof MockDirectory || segment instanceof MockFile) {
                value = segment.path;
            } else {
                value = String(segment);
            }

            const normalized = normalizePath(value);

            if (normalized.startsWith("/")) {
                resolved = normalized;
            } else {
                resolved = normalizePath(resolved === "/" ? `/${normalized}` : `${resolved}/${normalized}`);
            }
        }

        return resolved || "/";
    };

    class MockFile {
        public readonly name: string;
        public readonly uri: string;
        public readonly path: string;
        public exists = true;

        constructor(...segments: Array<string | MockDirectory | MockFile>) {
            this.path = resolvePath(segments);
            this.name = this.path.split("/").pop() ?? this.path;
            this.uri = `file://${this.path}`;
        }

        create(): void {
            const directoryPath = this.path.split("/").slice(0, -1).join("/") || "/";
            const entry = mockFs.get(directoryPath) ?? { directories: [], files: [] };
            if (!entry.files.includes(this.name)) {
                entry.files.push(this.name);
            }
            mockFs.set(directoryPath, entry);
            this.exists = true;
        }

        write(): void {
            // no-op for tests
        }

        text(): string {
            return "";
        }

        bytes(): Uint8Array {
            return new Uint8Array();
        }
    }

    class MockDirectory {
        public readonly name: string;
        public readonly uri: string;
        public exists: boolean;

        public readonly path: string;

        constructor(...segments: Array<string | MockDirectory | MockFile>) {
            this.path = resolvePath(segments);
            this.name = this.path === "/" ? "/" : this.path.split("/").pop() ?? this.path;
            this.exists = mockFs.has(this.path);
            this.uri = `file://${this.path}`;
        }

        list(): (MockDirectory | MockFile)[] {
            const entry = mockFs.get(this.path);
            if (!entry) {
                return [];
            }

            const directories = entry.directories.map(
                (dir) => new MockDirectory(this, dir),
            );
            const files = entry.files.map((file) => new MockFile(this, file));
            return [...directories, ...files];
        }

        create(): void {
            if (!mockFs.has(this.path)) {
                mockFs.set(this.path, { directories: [], files: [] });
            }
            this.exists = true;
        }
    }

    const cacheDirectory = new MockDirectory("/tmp/cache");

    const moduleExports = {
        Directory: MockDirectory,
        File: MockFile,
        Paths: {
            get cache() {
                return cacheDirectory;
            },
            get document() {
                return cacheDirectory;
            },
        },
        __setMockFileSystem(data: Record<string, { files: string[]; directories: string[] }>) {
            mockFs.clear();
            for (const [rawPath, entry] of Object.entries(data)) {
                mockFs.set(normalizePath(rawPath), {
                    directories: [...entry.directories],
                    files: [...entry.files],
                });
            }
        },
    };
    return moduleExports;
});

jest.mock("@/utils/cacheDirectories", () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-var-requires
    const FileSystem = require("expo-file-system/next");

    return {
        getCacheDirectory(subdirectory: string) {
            return new FileSystem.Directory("/tmp/cache", "LegendMusic", subdirectory);
        },
        ensureCacheDirectory: jest.fn(),
        deleteCacheFiles: jest.fn(),
    };
});

jest.mock("@/utils/ExpoFSPersistPlugin", () => {
    const tables: Record<string, any> = {};
    const plugin = {
        initialize: jest.fn(),
        getTable: (table: string, init: object) => tables[table] ?? init ?? {},
        getMetadata: (table: string) => tables[`${table}__m`] ?? {},
        set: jest.fn(async (table: string) => {
            tables[table] = tables[table] ?? {};
        }),
        setMetadata: jest.fn(async (table: string, value: any) => {
            tables[`${table}__m`] = value;
        }),
        deleteTable: jest.fn((table: string) => {
            delete tables[table];
        }),
        deleteMetadata: jest.fn((table: string) => {
            delete tables[`${table}__m`];
        }),
    };

    return {
        __esModule: true,
        observablePersistExpoFS: jest.fn(() => plugin),
    };
});

jest.mock("@/native-modules/AudioPlayer", () => ({
    __esModule: true,
    default: {
        getMediaTags: jest.fn().mockResolvedValue({ durationSeconds: 180 }),
    },
}));

jest.mock("@/native-modules/FileSystemWatcher", () => ({
    addChangeListener: jest.fn(() => jest.fn()),
    setWatchedDirectories: jest.fn(),
}));

jest.mock("@/systems/LibraryCache", () => ({
    __esModule: true,
    clearLibraryCache: jest.fn(),
    hasCachedLibraryData: jest.fn(() => false),
}));

jest.mock("@shopify/react-native-skia", () => ({
    Skia: {
        Image: {
            MakeImageFromEncoded: jest.fn(() => null),
        },
        Surface: {
            Make: jest.fn(() => null),
        },
        Data: {
            fromBytes: jest.fn(() => null),
        },
        XYWHRect: jest.fn(() => ({})),
        Paint: jest.fn(),
    },
}));

describe("scanLocalMusic", () => {
    const getMockFsSetter = () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-explicit-any
        const module: any = require("expo-file-system/next");
        return module.__setMockFileSystem as (data: Record<string, { files: string[]; directories: string[] }>) => void;
    };

    beforeEach(() => {
        jest.useFakeTimers();
        getMockFsSetter()({
            "/music": {
                files: ["root.mp3", "ignore.txt"],
                directories: ["sub"],
            },
            "/music/sub": {
                files: ["nested.mp3"],
                directories: ["deeper"],
            },
            "/music/sub/deeper": {
                files: ["deep.mp3"],
                directories: [],
            },
        });

        localMusicSettings$.libraryPaths.set(() => ["/music"]);
        localMusicState$.tracks.set([]);
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    it("discovers mp3 files in nested directories", async () => {
        await scanLocalMusic();
        jest.runOnlyPendingTimers();
        await Promise.resolve();

        const tracks: LocalTrack[] = localMusicState$.tracks.get();
        const filePaths = tracks.map((track) => track.filePath);

        expect(filePaths).toEqual(expect.arrayContaining(["/music/root.mp3", "/music/sub/nested.mp3", "/music/sub/deeper/deep.mp3"]));
        expect(filePaths).not.toContain("/music/ignore.txt");
        expect(tracks).toHaveLength(3);
    });

    it("clears cached library data when a library path is removed", () => {
        const clearLibraryCacheMock = clearLibraryCache as jest.Mock;
        initializeLocalMusic();

        localMusicState$.tracks.set([
            {
                id: "/music/root.mp3",
                title: "Root",
                artist: "Artist",
                duration: "0:00",
                filePath: "/music/root.mp3",
                fileName: "root.mp3",
            },
        ]);
        localMusicSettings$.lastScanTime.set(123);

        localMusicSettings$.libraryPaths.set(() => []);

        expect(clearLibraryCacheMock).toHaveBeenCalledTimes(1);
        expect(localMusicState$.tracks.get()).toEqual([]);
        expect(localMusicSettings$.lastScanTime.get()).toBe(0);
    });
});
