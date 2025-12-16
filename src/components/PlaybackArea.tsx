import { useValue } from "@legendapp/state/react";
import { useCallback, useEffect, useState } from "react";
import { type LayoutChangeEvent, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { AlbumArt } from "@/components/AlbumArt";
import { Button } from "@/components/Button";
import { localAudioControls, localPlayerState$ } from "@/components/LocalAudioPlayer";
import { PlaybackTimeline } from "@/components/PlaybackTimeline";
import { PlaylistSelector } from "@/components/PlaylistSelector";
import { usePlaybackControlLayout } from "@/hooks/useUIControls";
import {
    OVERLAY_CONTENT_SPRING_DAMPING,
    OVERLAY_CONTENT_SPRING_MASS,
    OVERLAY_CONTENT_SPRING_REST_DISPLACEMENT,
    OVERLAY_CONTENT_SPRING_REST_SPEED,
    OVERLAY_CONTENT_SPRING_STIFFNESS,
    OVERLAY_WINDOW_WIDTH_COMPACT,
} from "@/overlay/OverlayConstants";
import { localMusicState$ } from "@/systems/LocalMusicState";
import { setIsScrubbing } from "@/systems/PlaybackInteractionState";
import { type PlaybackControlId, settings$ } from "@/systems/Settings";
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

const DEFAULT_PLAYBACK_BUTTONS: PlaybackControlId[] = ["playPause", "next"];

export function PlaybackArea({ showBorder = true, overlayMode }: PlaybackAreaProps = {}) {
    perfCount("PlaybackArea.render");
    const currentTrack = useValue(localPlayerState$.currentTrack);
    const isPlaying = useValue(localPlayerState$.isPlaying);
    const currentLocalTime$ = localPlayerState$.currentTime;
    const playbackControlsLayout = usePlaybackControlLayout();
    const thumbnailVersion = useValue(localMusicState$.thumbnailVersion);
    const shuffleEnabled = useValue(settings$.playback.shuffle);
    const repeatMode = useValue(settings$.playback.repeatMode);
    const handleSlidingStart = useCallback(() => setIsScrubbing(true), []);
    const handleSlidingEnd = useCallback(() => setIsScrubbing(false), []);
    const overlayModeEnabled = false; //overlayMode?.enabled ?? false;
    const overlayControlsVisible = overlayModeEnabled ? (overlayMode?.showControls ?? false) : true;
    const overlayControlsProgress = useSharedValue(overlayControlsVisible ? 1 : 0);
    const sliderRowHeight = useSharedValue(0);
    const [isHovered, setIsHovered] = useState(false);
    const handleHoverIn = useCallback(() => setIsHovered(true), []);
    const handleHoverOut = useCallback(() => setIsHovered(false), []);
    const isWindowHovered = useValue(state$.isWindowHovered);

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

    const playbackControlsNode = (
        <View className="flex-row justify-center items-center gap-x-1">
            {(
                (playbackControlsLayout?.shown?.length
                    ? playbackControlsLayout.shown
                    : DEFAULT_PLAYBACK_BUTTONS) as PlaybackControlId[]
            ) // Ensure default buttons when no layout present
                .filter((controlId, index, array) => array.indexOf(controlId) === index)
                .map((controlId) => {
                    switch (controlId) {
                        case "previous":
                            return (
                                <Button
                                    key="previous"
                                    icon="backward.end.fill"
                                    variant="icon-hover"
                                    iconSize={14}
                                    size="xs"
                                    onClick={localAudioControls.playPrevious}
                                    tooltip="Previous"
                                />
                            );
                        case "playPause":
                            return (
                                <Button
                                    key="playPause"
                                    icon={isPlaying ? "pause.fill" : "play.fill"}
                                    variant="icon-hover"
                                    iconSize={14}
                                    size="xs"
                                    onClick={localAudioControls.togglePlayPause}
                                    tooltip={isPlaying ? "Pause" : "Play"}
                                />
                            );
                        case "next":
                            return (
                                <Button
                                    key="next"
                                    icon="forward.end.fill"
                                    variant="icon-hover"
                                    iconSize={14}
                                    size="xs"
                                    onClick={localAudioControls.playNext}
                                    tooltip="Next"
                                />
                            );
                        case "shuffle": {
                            const shuffleIcon = shuffleEnabled ? "shuffle.circle.fill" : "shuffle";
                            const shuffleSize = shuffleEnabled ? 23 : 16;

                            return (
                                <Button
                                    key="shuffle"
                                    icon={shuffleIcon}
                                    variant="icon-hover"
                                    iconSize={shuffleSize}
                                    size="xs"
                                    onClick={localAudioControls.toggleShuffle}
                                    tooltip={shuffleEnabled ? "Disable shuffle" : "Enable shuffle"}
                                    active={shuffleEnabled}
                                />
                            );
                        }
                        case "repeat": {
                            const repeatIcon =
                                repeatMode === "off"
                                    ? "repeat"
                                    : repeatMode === "one"
                                      ? "repeat.1.circle.fill"
                                      : "repeat.circle.fill";
                            const repeatSize = repeatMode === "off" ? 16 : 23;
                            const repeatTooltip =
                                repeatMode === "off"
                                    ? "Enable repeat"
                                    : repeatMode === "all"
                                      ? "Repeat all tracks"
                                      : "Repeat current track";

                            return (
                                <Button
                                    key="repeat"
                                    icon={repeatIcon}
                                    variant="icon-hover"
                                    iconSize={repeatSize}
                                    size="xs"
                                    onClick={localAudioControls.cycleRepeatMode}
                                    tooltip={repeatTooltip}
                                    active={repeatMode !== "off"}
                                />
                            );
                        }
                        default:
                            return null;
                    }
                })}
        </View>
    );

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
            className={cn("relative px-3", showBorder ? "pt-3" : "py-3")}
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
            <View className="w-full pt-1 flex-row">
                {hoverContentVisible ? (
                    <Animated.View
                        className="flex-row justify-between flex-1 pt-0.5 -mx-1"
                        pointerEvents="box-none"
                        style={controlsAnimatedStyle}
                    >
                        {playbackControlsNode}
                        <PlaylistSelector variant="overlay" />
                    </Animated.View>
                ) : null}
            </View>
        </View>
    );
}
