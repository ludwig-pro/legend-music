import { LegendList } from "@legendapp/list";
import { use$ } from "@legendapp/state/react";
import { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { localAudioControls, localPlayerState$ } from "@/components/LocalAudioPlayer";
import { TrackItem, type TrackData } from "@/components/TrackItem";
import { localMusicState$ } from "@/systems/LocalMusicState";
import { settings$ } from "@/systems/Settings";
import { perfCount, perfLog } from "@/utils/perfLogger";

type PlaylistTrackWithSuggestions = TrackData & {
    fromSuggestions?: true;
    isSeparator?: boolean;
};

export function Playlist() {
    perfCount("Playlist.render");
    const localMusicState = use$(localMusicState$);
    const currentTrackIndex = use$(localPlayerState$.currentIndex);
    const isPlayerActive = use$(localPlayerState$.isPlaying);
    const playlistStyle = use$(settings$.general.playlistStyle);

    // Only show local files playlist
    const playlist: PlaylistTrackWithSuggestions[] = useMemo(
        () =>
            localMusicState.tracks.map((track, index) => ({
                id: track.id,
                title: track.title,
                artist: track.artist,
                duration: track.duration,
                thumbnail: track.thumbnail || "",
                index,
                isPlaying: index === currentTrackIndex && isPlayerActive,
            })),
        [localMusicState.tracks, currentTrackIndex, isPlayerActive],
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

        // Handle local file playback
        if (__DEV__) {
            console.log("Playing local file at index:", index);
        }
        const tracks = localMusicState.tracks;
        const localTrack = tracks[index];

        if (localTrack) {
            if (__DEV__) {
                console.log("Playing:", localTrack.title, "by", localTrack.artist);
            }
            // Load the entire playlist and start playing at the selected index
            localAudioControls.loadPlaylist(tracks, index);
        }
    };

    return (
        <View className="flex-1">
            {playlist.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <Text className="text-white/60 text-base">
                        {localMusicState.isScanning
                            ? `Scanning... ${localMusicState.scanProgress}/${localMusicState.scanTotal}`
                            : localMusicState.error
                              ? "Error scanning local files"
                              : "No local MP3 files found"}
                    </Text>
                    <Text className="text-white/40 text-sm mt-2">Add MP3 files to /Users/jay/Downloads/mp3</Text>
                </View>
            ) : (
                <LegendList
                    data={playlist}
                    keyExtractor={(item, index) => `track-${item.id ?? index}`}
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
        paddingVertical: 4,
    },
});
