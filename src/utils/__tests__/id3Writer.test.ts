import { Platform } from "react-native";
import { isNativeID3WriterAvailable, writeNativeID3Tags } from "@/utils/id3Writer";

const mockWriteMediaTags = jest.fn();

jest.mock("@/native-modules/AudioPlayer", () => ({
    __esModule: true,
    default: {
        writeMediaTags: mockWriteMediaTags,
    },
}));

describe("id3Writer helper", () => {
    let platformSpy: jest.SpyInstance;

    beforeEach(() => {
        platformSpy?.mockRestore();
        jest.clearAllMocks();
    });

    afterAll(() => {
        platformSpy?.mockRestore();
    });

    const setPlatform = (os: typeof Platform.OS) => {
        platformSpy = jest.spyOn(Platform, "OS", "get").mockReturnValue(os);
    };

    it("guards when native writer is unavailable", async () => {
        setPlatform("ios");
        const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

        const result = await writeNativeID3Tags("/tmp/song.mp3", {});

        expect(isNativeID3WriterAvailable).toBe(false);
        expect(result).toEqual({ success: false });
        expect(mockWriteMediaTags).not.toHaveBeenCalled();

        warnSpy.mockRestore();
    });

    it("delegates to the native writer on macOS", async () => {
        setPlatform("macos");
        mockWriteMediaTags.mockResolvedValue({ success: true });

        const result = await writeNativeID3Tags("/tmp/song.mp3", { title: "Track" });

        expect(isNativeID3WriterAvailable).toBe(true);
        expect(mockWriteMediaTags).toHaveBeenCalledWith("/tmp/song.mp3", { title: "Track" });
        expect(result).toEqual({ success: true });
    });
});
