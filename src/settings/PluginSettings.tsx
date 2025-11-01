import { Text, View } from "react-native";

import { SettingsPage } from "@/settings/components";

export const PluginSettings = () => (
    <SettingsPage title="Plugin Settings">
        <View className="gap-2">
            <Text className="text-text-tertiary">
                Add your plugin settings controls here when the feature is ready.
            </Text>
        </View>
    </SettingsPage>
);
