import { useMountOnce } from "@legendapp/state/react";

import { useWindowManager, type WindowOptions } from "@/native-modules/WindowManager";
import { state$ } from "@/systems/State";

const SETTINGS_WINDOW_ID = "settings";

export const SettingsWindowManager = () => {
    const windowManager = useWindowManager();

    useMountOnce(() => {
        state$.showSettings.onChange(async ({ value }) => {
            if (value) {
                try {
                    const options: WindowOptions = {
                        identifier: SETTINGS_WINDOW_ID,
                        moduleName: "SettingsWindow",
                        title: "Settings",
                        width: 800,
                        height: 800,
                    };

                    await windowManager.openWindow(options);
                } catch (error) {
                    console.error("Failed to open window:", error);
                }
            } else {
                try {
                    await windowManager.closeWindow(SETTINGS_WINDOW_ID);
                } catch (error) {
                    console.error("Failed to close settings window:", error);
                }
            }
        });

        const subscription = windowManager.onWindowClosed(({ identifier }) => {
            if (identifier !== SETTINGS_WINDOW_ID) {
                return;
            }

            state$.assign({
                showSettings: false,
                showSettingsPage: undefined,
            });
        });

        return () => {
            subscription.remove();
        };
    });

    return null;
};
