import { observer, use$ } from "@legendapp/state/react";
import { Text, View } from "react-native";

import { Select } from "@/components/Select";
import { settings$ } from "@/systems/Settings";

export const GeneralSettings = observer(function GeneralSettings() {
    const playlistStyleOptions = [
        { id: "compact", label: "Compact" },
        { id: "comfortable", label: "Comfortable" },
    ] as const;

    return (
        <View className="p-6">
            <Text className="text-2xl font-bold text-white mb-6">General Settings</Text>

            {/* Playlist Style Settings */}
            <View className="mb-6">
                <Text className="text-lg font-semibold text-white mb-3">Appearance</Text>
                
                <View className="flex-row items-center justify-between">
                    <Text className="text-white text-base">Playlist Style</Text>
                    <View className="w-48">
                        <Select
                            selected$={settings$.general.playlistStyle}
                            items={playlistStyleOptions}
                            getItemKey={(item) => item.id}
                            renderItem={(item, mode) => (
                                <Text className="text-white text-sm">{item.label}</Text>
                            )}
                            placeholder="Select style..."
                            className="bg-white/10 border border-white/20 rounded-md"
                            triggerClassName="px-3 py-2"
                        />
                    </View>
                </View>
            </View>
        </View>
    );
});
