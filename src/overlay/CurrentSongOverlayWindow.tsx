import "@/../global.css";
import { VibrancyView } from "@fluentui-react-native/vibrancy-view";
import { PortalProvider } from "@gorhom/portal";
import { use$ } from "@legendapp/state/react";
import { useCallback, useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { PlaybackArea } from "@/components/PlaybackArea";
import { TooltipProvider } from "@/components/TooltipProvider";
import { setWindowBlur } from "@/native-modules/WindowManager";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { withWindowProvider } from "@/windows";

import { currentSongOverlay$, finalizeCurrentSongOverlayDismissal } from "./CurrentSongOverlayState";

const WINDOW_ID = "current-song-overlay";
const SHOW_DURATION_MS = 400;
const HIDE_DURATION_MS = 300;
const MAX_BLUR_RADIUS = 8;

const styles = StyleSheet.create({
    root: {
        alignSelf: "stretch",
        flex: 1,
        paddingTop: 22,
        paddingHorizontal: 30,
        paddingBottom: 36,
        backgroundColor: "transparent",
    },
    shadowContainer: {
        flex: 1,
        borderRadius: 20,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        backgroundColor: "transparent",
        overflow: "hidden",
    },
    overlaySurface: {
        flex: 1,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#464747",
        overflow: "hidden",
    },
});

function CurrentSongOverlayWindow() {
    const presentationId = use$(currentSongOverlay$.presentationId);
    const isExiting = use$(currentSongOverlay$.isExiting);

    const opacity = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const handleExitComplete = useCallback(() => {
        finalizeCurrentSongOverlayDismissal();
    }, []);

    useEffect(() => {
        opacity.value = 0;

        opacity.value = withTiming(1, {
            duration: SHOW_DURATION_MS,
            easing: Easing.out(Easing.cubic),
        });

        if (Platform.OS === "macos") {
            void (async () => {
                try {
                    await setWindowBlur(WINDOW_ID, MAX_BLUR_RADIUS, 0);
                    await setWindowBlur(WINDOW_ID, 0, SHOW_DURATION_MS);
                } catch (error) {
                    console.error("Failed to animate overlay blur on show:", error);
                }
            })();
        }
    }, [presentationId, opacity]);

    useEffect(() => {
        if (!isExiting) {
            return;
        }

        if (Platform.OS === "macos") {
            void (async () => {
                try {
                    await setWindowBlur(WINDOW_ID, MAX_BLUR_RADIUS, HIDE_DURATION_MS);
                } catch (error) {
                    console.error("Failed to animate overlay blur on hide:", error);
                }
            })();
        }

        opacity.value = withTiming(
            0,
            {
                duration: HIDE_DURATION_MS,
                easing: Easing.in(Easing.cubic),
            },
            (finished) => {
                if (finished) {
                    runOnJS(handleExitComplete)();
                }
            },
        );
    }, [isExiting, opacity, handleExitComplete]);

    return (
        <Animated.View style={[styles.root, animatedStyle]}>
            <View style={styles.shadowContainer}>
                <VibrancyView
                    blendingMode="behindWindow"
                    material="hudWindow"
                    state="active"
                    style={styles.overlaySurface}
                >
                    <View className="flex-1 bg-background-primary/40">
                        <ThemeProvider>
                            <PortalProvider>
                                <TooltipProvider>
                                    <PlaybackArea showBorder={false} />
                                </TooltipProvider>
                            </PortalProvider>
                        </ThemeProvider>
                    </View>
                </VibrancyView>
            </View>
        </Animated.View>
    );
}

export default withWindowProvider(CurrentSongOverlayWindow, WINDOW_ID);
