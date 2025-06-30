import { use$ } from "@legendapp/state/react";
import { Text, View } from "react-native";
import { Playlist } from "@/components/Playlist";
import { Select } from "@/components/Select";
import type { YTMusicPlaylist } from "@/components/YouTubeMusicPlayer";
import { localMusicState$, setCurrentPlaylist } from "@/systems/LocalMusicState";
import { playlistsData$ } from "@/systems/Playlists";
import { stateSaved$ } from "@/systems/State";

export function PlaylistSelector() {
    const localMusicState = use$(localMusicState$);
    const playlistsObj = use$(playlistsData$.playlistsYtm);
    const playlistsArr = Object.values(playlistsObj).sort((a, b) => a.index! - b.index!);

    // Create local files playlist
    const localFilesPlaylist: YTMusicPlaylist = {
        id: "LOCAL_FILES",
        name: "Local Files",
        thumbnail: "",
        count: localMusicState.tracks.length,
        creator: "Local Library",
        path: "",
        type: "file",
        order: -1,
    };

    // Combine YouTube Music playlists with local files
    const availablePlaylists = [localFilesPlaylist, ...playlistsArr];
    const availablePlaylistIds = availablePlaylists.map((playlist) => playlist.id);

    const selectedPlaylist$ = stateSaved$.playlist;

    const handlePlaylistSelect = (playlistId: string) => {
        console.log("Navigating to playlist:", playlistId);
        setCurrentPlaylist(playlistId, playlistId === "LOCAL_FILES" ? "file" : "ytm");

        if (playlistId === "LOCAL_FILES") {
            // Handle local files selection
            console.log("Selected local files playlist");
        }
    };

    return (
        <View className="flex-1">
            {/* Title bar area for playlist */}
            <View className="px-2 py-1 border-t border-white/10">
                <Select
                    items={availablePlaylistIds}
                    selected$={selectedPlaylist$}
                    placeholder="Local Files"
                    onSelectItem={handlePlaylistSelect}
                    getItemKey={(playlist) => playlist}
                    renderItem={(playlistId, mode) => {
                        if (!playlistId) return <Text>Null</Text>;
                        const playlist = playlistId === "LOCAL_FILES" ? localFilesPlaylist : playlistsObj[playlistId];

                        if (mode === "preview") {
                            return (
                                <Text className="text-white/90 group-hover:text-white text-base font-semibold">
                                    {playlist.name}
                                </Text>
                            );
                        }
                        return (
                            <View className="flex-row items-center">
                                <Text className="text-white text-base font-medium flex-1">{playlist.name}</Text>
                            </View>
                        );
                    }}
                    unstyled={true}
                    showCaret={true}
                    caretPosition="right"
                    triggerClassName="hover:bg-white/10 rounded-md h-8 px-2"
                    caretClassName="text-white/70 hover:text-white"
                    maxWidthMatchTrigger={true}
                />
            </View>

            {/* Playlist content */}
            <View className="flex-1">
                <Playlist />
            </View>
        </View>
    );
}
