import { observer } from "@legendapp/state/react";
import { Text, View } from "react-native";

import { Checkbox } from "@/components/Checkbox";
import { settings$ } from "@/systems/Settings";

export const YouTubeMusicSettings = observer(function YouTubeMusicSettings() {
    return (
        <View className="p-6">
            <Text className="text-2xl font-bold text-white mb-6">YouTube Music Settings</Text>

            {/* YouTube Music Enable/Disable */}
            <View className="mb-6">
                <Text className="text-lg font-semibold text-white mb-3">Integration</Text>
                
                <View className="flex-row items-center">
                    <Checkbox
                        $checked={settings$.youtubeMusic.enabled}
                        label="Enabled"
                        labelClassName="text-white text-base ml-3"
                    />
                </View>
                
                <Text className="text-white/60 text-sm mt-2 ml-6">
                    Enable YouTube Music integration for streaming and playlist management
                </Text>
            </View>
        </View>
    );
});