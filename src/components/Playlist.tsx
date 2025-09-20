import { LegendList } from "@legendapp/list";
import { use$ } from "@legendapp/state/react";
import { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { localAudioControls, localPlayerState$, queue$ } from "@/components/LocalAudioPlayer";
import { type TrackData, TrackItem } from "@/components/TrackItem";
import { localMusicState$ } from "@/systems/LocalMusicState";
import { settings$ } from "@/systems/Settings";
import { perfCount, perfLog } from "@/utils/perfLogger";

type PlaylistTrackWithSuggestions = TrackData & {
    queueEntryId: string;
    fromSuggestions?: true;
    isSeparator?: boolean;
};

export function Playlist() {
    perfCount("Playlist.render");
    const localMusicState = use$(localMusicState$);
    const queueTracks = use$(queue$.tracks);
    const currentTrackIndex = use$(localPlayerState$.currentIndex);
    const isPlayerActive = use$(localPlayerState$.isPlaying);
    const playlistStyle = use$(settings$.general.playlistStyle);

    // Render the active playback queue
    const playlist: PlaylistTrackWithSuggestions[] = useMemo(
        () =>
            queueTracks.map((track, index) => ({
                id: track.id,
                title: track.title,
                artist: track.artist,
                duration: track.duration,
                thumbnail: track.thumbnail || "",
                index,
                isPlaying: index === currentTrackIndex && isPlayerActive,
                queueEntryId: track.queueEntryId,
            })),
        [queueTracks, currentTrackIndex, isPlayerActive],
    );

    useEffect(() => {
        perfLog("Playlist.useMemo", {
            length: playlist.length,
            currentTrackIndex,
            isPlayerActive,
        });
    }, [playlist.length, currentTrackIndex, isPlayerActive, playlist]);

    const handleTrackClick = (index: number) => {
        const track = playlist[index];

        // Don't allow clicking on separator items
        if (track?.isSeparator) {
            return;
        }

        if (__DEV__) {
            console.log("Queue -> play index", index);
        }
        localAudioControls.playTrackAtIndex(index);
    };

    const msg =
        playlist.length === 0
            ? localMusicState.isScanning
                ? `Scanning... ${localMusicState.scanProgress}/${localMusicState.scanTotal}`
                : localMusicState.error
                  ? "Error scanning local files"
                  : "Queue is empty"
            : null;

    return (
        <View className="flex-1">
            {msg ? (
                <View className="flex-1 items-center justify-center">
                    <Text className="text-white/60 text-sm">{msg}</Text>
                </View>
            ) : (
                <LegendList
                    data={playlist}
                    keyExtractor={(item, index) => `queue-${item.queueEntryId ?? item.id ?? index}`}
                    contentContainerStyle={styles.container}
                    waitForInitialLayout={false}
                    estimatedItemSize={playlistStyle === "compact" ? 30 : 50}
                    recycleItems
                    renderItem={({ item: track, index }) => (
                        <TrackItem track={track} index={index} onTrackClick={handleTrackClick} />
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 2,
    },
});
