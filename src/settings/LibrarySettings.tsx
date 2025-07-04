import { observer, use$ } from "@legendapp/state/react";
import { Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { localMusicSettings$, scanLocalMusic } from "@/systems/LocalMusicState";

export const LibrarySettings = observer(function LibrarySettings() {
    const localMusicSettings = use$(localMusicSettings$);

    const handleRescanLibrary = () => {
        scanLocalMusic();
    };

    return (
        <View className="p-6">
            <Text className="text-2xl font-bold text-white mb-6">Library Settings</Text>

            {/* Auto Scan Settings */}
            <View className="mb-6">
                <Text className="text-lg font-semibold text-white mb-3">Scanning</Text>
                
                <View className="flex-row items-center mb-4">
                    <Checkbox
                        $checked={localMusicSettings$.autoScanOnStart}
                        label="Auto-scan on startup"
                        labelClassName="text-white text-base ml-3"
                    />
                </View>
                
                <Text className="text-white/60 text-sm mb-4 ml-6">
                    Automatically scan for new music files when the app starts
                </Text>

                <Button
                    variant="primary"
                    onPress={handleRescanLibrary}
                    className="w-fit"
                >
                    <Text className="text-white font-medium">Rescan Library Now</Text>
                </Button>
            </View>

            {/* Library Paths */}
            <View className="mb-6">
                <Text className="text-lg font-semibold text-white mb-3">Library Paths</Text>
                
                <View className="bg-white/10 rounded-lg p-4 border border-white/20">
                    {localMusicSettings.libraryPaths.length > 0 ? (
                        localMusicSettings.libraryPaths.map((path, index) => (
                            <View
                                key={index}
                                className="flex-row items-center justify-between py-2"
                            >
                                <Text className="text-white text-sm font-mono">{path}</Text>
                            </View>
                        ))
                    ) : (
                        <Text className="text-white/60 text-sm text-center">No library paths configured</Text>
                    )}
                </View>
                
                <Text className="text-white/60 text-sm mt-2">
                    Currently configured library paths for local music scanning
                </Text>
            </View>

            {/* Last Scan Info */}
            {localMusicSettings.lastScanTime > 0 && (
                <View className="mb-6">
                    <Text className="text-lg font-semibold text-white mb-3">Last Scan</Text>
                    <Text className="text-white/60 text-sm">
                        {new Date(localMusicSettings.lastScanTime).toLocaleString()}
                    </Text>
                </View>
            )}
        </View>
    );
});
