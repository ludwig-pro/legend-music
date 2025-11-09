import { use$ } from "@legendapp/state/react";
import { useEffect } from "react";
import { Dimensions } from "react-native";

import { useWindowManager, WindowStyleMask } from "@/native-modules/WindowManager";
import { settings$ } from "@/systems/Settings";
import { perfCount, perfLog } from "@/utils/perfLogger";
import { WindowsNavigator } from "@/windows";

import {
    DEFAULT_OVERLAY_WINDOW_HEIGHT,
    cancelCurrentSongOverlay,
    currentSongOverlay$,
    finalizeCurrentSongOverlayDismissal,
} from "./CurrentSongOverlayState";

const OVERLAY_WINDOW_KEY = "CurrentSongOverlayWindow" as const;
const OVERLAY_WINDOW_ID = WindowsNavigator.getIdentifier(OVERLAY_WINDOW_KEY);
const DEFAULT_WIDTH = 400;
const DEFAULT_HEIGHT = DEFAULT_OVERLAY_WINDOW_HEIGHT;
const TOP_MARGIN = 48;
const HORIZONTAL_MARGIN = 0;
const BOTTOM_MARGIN = 0;

export const CurrentSongOverlayWindowManager = () => {
    perfCount("CurrentSongOverlayWindowManager.render");
    const windowManager = useWindowManager();
    const isWindowOpen = use$(currentSongOverlay$.isWindowOpen);
    const overlayPosition = use$(settings$.overlay.position);
    const windowHeight = use$(currentSongOverlay$.windowHeight) ?? DEFAULT_OVERLAY_WINDOW_HEIGHT;
    const horizontalPosition = overlayPosition?.horizontal ?? "center";
    const verticalPosition = overlayPosition?.vertical ?? "top";

    useEffect(() => {
        const subscription = windowManager.onWindowClosed(({ identifier }) => {
            if (identifier === OVERLAY_WINDOW_ID) {
                finalizeCurrentSongOverlayDismissal();
            }
        });

        return () => {
            subscription.remove();
        };
    }, [windowManager]);

    useEffect(() => {
        perfLog("CurrentSongOverlayWindowManager.isOpenEffect", { isWindowOpen });
        if (!isWindowOpen) {
            void (async () => {
                try {
                    perfLog("CurrentSongOverlayWindowManager.closeWindow.start");
                    await WindowsNavigator.close(OVERLAY_WINDOW_KEY);
                } catch (error) {
                    console.error("Failed to close current song overlay window:", error);
                    perfLog("CurrentSongOverlayWindowManager.closeWindow.error", error);
                }
            })();
            return;
        }

        void (async () => {
            try {
                perfLog("CurrentSongOverlayWindowManager.openWindow.start");
                const screen = Dimensions.get("screen");
                const windowDims = Dimensions.get("window");
                const screenWidth =
                    typeof screen?.width === "number"
                        ? screen.width
                        : typeof windowDims?.width === "number"
                          ? windowDims.width
                          : DEFAULT_WIDTH;
                const screenHeight =
                    typeof screen?.height === "number"
                        ? screen.height
                        : typeof windowDims?.height === "number"
                          ? windowDims.height
                          : DEFAULT_HEIGHT;

                let x = Math.max(Math.round((screenWidth - DEFAULT_WIDTH) / 2), 0);
                if (horizontalPosition === "left") {
                    x = HORIZONTAL_MARGIN;
                } else if (horizontalPosition === "right") {
                    x = Math.max(screenWidth - DEFAULT_WIDTH - HORIZONTAL_MARGIN, 0);
                }

                const maxY = Math.max(screenHeight - windowHeight, 0);
                const clampY = (value: number) => Math.min(Math.max(value, 0), maxY);

                let y = clampY(maxY - TOP_MARGIN);
                if (verticalPosition === "middle") {
                    y = clampY(Math.round(maxY / 2));
                } else if (verticalPosition === "bottom") {
                    y = clampY(BOTTOM_MARGIN);
                }

                await WindowsNavigator.open(OVERLAY_WINDOW_KEY, {
                    x,
                    y,
                    windowStyle: {
                        width: DEFAULT_WIDTH,
                        height: windowHeight,
                        mask: [
                            WindowStyleMask.Borderless,
                            WindowStyleMask.NonactivatingPanel,
                            WindowStyleMask.FullSizeContentView,
                        ],
                    },
                });
            } catch (error) {
                console.error("Failed to open current song overlay window:", error);
                perfLog("CurrentSongOverlayWindowManager.openWindow.error", error);
            }
        })();
    }, [isWindowOpen, horizontalPosition, verticalPosition, windowHeight]);

    return null;
};

export const ensureOverlayWindowClosed = () => {
    cancelCurrentSongOverlay();
};
