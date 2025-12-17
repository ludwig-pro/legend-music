import { useValue } from "@legendapp/state/react";
import { useCallback, useEffect, useState } from "react";
import { type LayoutChangeEvent, Platform, Pressable, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { AlbumArt } from "@/components/AlbumArt";
import { localAudioControls, localPlayerState$ } from "@/components/LocalAudioPlayer";
import { PlaybackControls } from "@/components/PlaybackControls";
import { PlaybackTimeline } from "@/components/PlaybackTimeline";
import {
    OVERLAY_CONTENT_SPRING_DAMPING,
    OVERLAY_CONTENT_SPRING_MASS,
    OVERLAY_CONTENT_SPRING_REST_DISPLACEMENT,
    OVERLAY_CONTENT_SPRING_REST_SPEED,
    OVERLAY_CONTENT_SPRING_STIFFNESS,
    OVERLAY_WINDOW_WIDTH_COMPACT,
} from "@/overlay/OverlayConstants";
import { Icon } from "@/systems/Icon";
import { localMusicState$ } from "@/systems/LocalMusicState";
import { setIsScrubbing } from "@/systems/PlaybackInteractionState";
import { settings$ } from "@/systems/Settings";
import { state$ } from "@/systems/State";
import { cn } from "@/utils/cn";
import { perfCount } from "@/utils/perfLogger";

export type OverlayPlaybackMode = {
    enabled: boolean;
    showControls: boolean;
};

type PlaybackAreaProps = {
    showBorder?: boolean;
    overlayMode?: OverlayPlaybackMode;
};

export function PlaybackArea({ showBorder = true, overlayMode }: PlaybackAreaProps = {}) {
    perfCount("PlaybackArea.render");
    const currentTrack = useValue(localPlayerState$.currentTrack);
    const isPlaying = useValue(localPlayerState$.isPlaying);
    const currentLocalTime$ = localPlayerState$.currentTime;
    const thumbnailVersion = useValue(localMusicState$.thumbnailVersion);
    const handleSlidingStart = useCallback(() => setIsScrubbing(true), []);
    const handleSlidingEnd = useCallback(() => setIsScrubbing(false), []);
    const overlayModeEnabled = false; //overlayMode?.enabled ?? false;
    const overlayControlsVisible = overlayModeEnabled ? (overlayMode?.showControls ?? false) : true;
    const overlayControlsProgress = useSharedValue(overlayControlsVisible ? 1 : 0);
    const sliderRowHeight = useSharedValue(0);
    const [isHovered, setIsHovered] = useState(false);
    const handleHoverIn = useCallback(() => setIsHovered(true), []);
    const handleHoverOut = useCallback(() => setIsHovered(false), []);
    const _isWindowHovered = useValue(state$.isWindowHovered);
    const playbackControlsEnabled = useValue(settings$.ui.playbackControlsEnabled) ?? true;

    const hoverContentVisible = true; // isHovered && overlayControlsVisible;
    // const hoverContentVisible = isWindowHovered && overlayControlsVisible;

    useEffect(() => {
        if (!overlayModeEnabled) {
            overlayControlsProgress.set(1);
            return;
        }

        overlayControlsProgress.set(
            withSpring(overlayControlsVisible ? 1 : 0, {
                damping: OVERLAY_CONTENT_SPRING_DAMPING,
                stiffness: OVERLAY_CONTENT_SPRING_STIFFNESS,
                mass: OVERLAY_CONTENT_SPRING_MASS,
                restDisplacementThreshold: OVERLAY_CONTENT_SPRING_REST_DISPLACEMENT,
                restSpeedThreshold: OVERLAY_CONTENT_SPRING_REST_SPEED,
            }),
        );
    }, [overlayControlsVisible, overlayModeEnabled, overlayControlsProgress]);

    const controlsAnimatedStyle = useAnimatedStyle(() => {
        const rawProgress = overlayModeEnabled ? overlayControlsProgress.value : 1;
        const clampedProgress = Math.min(Math.max(rawProgress * 1.1, 0), 1);
        return {
            opacity: clampedProgress,
        };
    });

    const sliderAnimatedStyle = useAnimatedStyle(() => {
        const rawProgress = overlayModeEnabled ? overlayControlsProgress.value : 1;
        const clampedProgress = Math.min(Math.max(rawProgress * 1.1, 0), 1);
        // const measuredHeight = sliderRowHeight.value;
        return {
            opacity: clampedProgress,
            // height: measuredHeight === 0 ? undefined : measuredHeight * clampedProgress,
        };
    });

    const handleSliderRowLayout = useCallback(
        (event: LayoutChangeEvent) => {
            sliderRowHeight.set(event.nativeEvent.layout.height);
        },
        [sliderRowHeight],
    );

    const sliderRowNode = (
        <PlaybackTimeline
            currentLocalTime$={currentLocalTime$}
            duration$={localPlayerState$.duration}
            disabled={!currentTrack}
            onLayout={handleSliderRowLayout}
            onSlidingStart={handleSlidingStart}
            onSlidingComplete={(value) => {
                localAudioControls.seek(value);
            }}
            onSlidingEnd={handleSlidingEnd}
            overlayMode={overlayMode}
        />
    );

    // perfLog("PlaybackArea.state", {
    //     track: currentTrack?.title,
    //     isLoading,
    //     isPlaying,
    //     currentTime: currentLocalTime$.peek?.(),
    // });

    return (
        <View
            className={cn("relative px-3", showBorder ? "pt-3" : "py-3", !playbackControlsEnabled && "py-3")}
            mouseDownCanMoveWindow
            onMouseEnter={handleHoverIn}
            onMouseLeave={handleHoverOut}
            data-hovered={isHovered ? "true" : undefined}
        >
            {/* {hoverContentVisible ? (
                <View className="absolute right-0 top-0" pointerEvents="box-none">
                    <PlaylistSelector variant="overlay" />
                </View>
            ) : null} */}
            <View className="flex-row items-start gap-3">
                {/* Album Art */}
                <View className="relative shrink-0">
                    <AlbumArt
                        uri={currentTrack?.thumbnail}
                        reloadKey={thumbnailVersion}
                        size="large"
                        fallbackIcon="♪"
                    />
                    <Pressable
                        className="absolute inset-0 opacity-0 hover:opacity-100 transition-all duration-300 items-center justify-center"
                        onPress={localAudioControls.togglePlayPause}
                    >
                        <Icon name={isPlaying ? "pause.fill" : "play.fill"} size={24} color="#fff" />
                    </Pressable>
                </View>

                {/* Song Info */}
                <View
                    className={cn("relative flex-1 flex-col overflow-hidden")}
                    style={{ maxWidth: overlayModeEnabled ? OVERLAY_WINDOW_WIDTH_COMPACT - 148 : undefined }}
                >
                    <View className="relative flex-col gap-0.5">
                        <Text className="text-white text-sm font-semibold" numberOfLines={1}>
                            {currentTrack?.title || " "}
                        </Text>
                        <Text className="text-white/70 text-sm" numberOfLines={1}>
                            {currentTrack?.artist || " "}
                        </Text>
                        {overlayModeEnabled ? (
                            <Animated.View
                                pointerEvents={overlayControlsVisible ? "auto" : "none"}
                                style={sliderAnimatedStyle}
                            >
                                {sliderRowNode}
                            </Animated.View>
                        ) : (
                            sliderRowNode
                        )}
                    </View>
                </View>
            </View>
            {playbackControlsEnabled ? <PlaybackControls className="pt-1 -mx-1 pb-1" /> : null}
        </View>
    );
}
