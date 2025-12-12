import { useValue } from "@legendapp/state/react";
import { useCallback, useRef, useState } from "react";
import { Platform, ScrollView, Text, TextInput, View } from "react-native";

import { Button } from "@/components/Button";
import {
    DroppableZone,
    MEDIA_LIBRARY_DRAG_ZONE_ID,
    type DraggedItem,
    type MediaLibraryDragData,
} from "@/components/dnd";
import type { TextInputSearchRef } from "@/components/TextInputSearch";
import { showToast } from "@/components/Toast";
import { useListItemStyles } from "@/hooks/useListItemStyles";
import { DragDropView } from "@/native-modules/DragDropView";
import { SUPPORT_PLAYLISTS } from "@/systems/constants";
import {
    libraryUI$,
    selectLibraryPlaylist,
    selectLibraryView,
    type LibraryView,
} from "@/systems/LibraryState";
import { addTracksToPlaylist } from "@/systems/LocalPlaylists";
import { createLocalPlaylist, localMusicState$ } from "@/systems/LocalMusicState";
import { cn } from "@/utils/cn";
import { perfCount } from "@/utils/perfLogger";
import { MediaLibrarySearchBar } from "./SearchBar";

const LIBRARY_VIEWS: { id: LibraryView; label: string; disabled?: boolean }[] = [
    { id: "songs", label: "Songs" },
    { id: "artists", label: "Artists" },
    { id: "albums", label: "Albums" },
    { id: "starred", label: "Starred", disabled: true },
];

export function MediaLibrarySidebar() {
    perfCount("MediaLibrary.Sidebar.render");
    const selectedView = useValue(libraryUI$.selectedView);
    const selectedPlaylistId = useValue(libraryUI$.selectedPlaylistId);
    const searchQuery = useValue(libraryUI$.searchQuery);
    const playlists = useValue(localMusicState$.playlists);
    const listItemStyles = useListItemStyles();
    const searchInputRef = useRef<TextInputSearchRef | null>(null);
    const [tempPlaylistId, setTempPlaylistId] = useState<string | null>(null);
    const [tempPlaylistName, setTempPlaylistName] = useState("");
    const [activeNativeDropPlaylistId, setActiveNativeDropPlaylistId] = useState<string | null>(null);

    const handleSelectView = useCallback(
        (view: LibraryView) => {
            selectLibraryView(view);
        },
        [],
    );

    const handleAddPlaylist = useCallback(() => {
        if (tempPlaylistId) {
            return;
        }

        const id = `pl-temp-${Date.now()}`;
        const defaultName = "New Playlist";
        localMusicState$.playlists.push({
            id,
            name: defaultName,
            filePath: "",
            trackPaths: [],
            trackCount: 0,
            source: "cache",
        });
        setTempPlaylistId(id);
        setTempPlaylistName(defaultName);
        selectLibraryPlaylist(id);
    }, [tempPlaylistId]);

    const finalizeTempPlaylist = useCallback(async () => {
        if (!tempPlaylistId) {
            return;
        }

        const name = tempPlaylistName.trim();
        const currentPlaylists = localMusicState$.playlists.peek();
        localMusicState$.playlists.set(currentPlaylists.filter((pl) => pl.id !== tempPlaylistId));

        setTempPlaylistId(null);
        setTempPlaylistName("");

        if (!name) {
            selectLibraryView("songs");
            return;
        }

        try {
            const playlist = await createLocalPlaylist(name);
            selectLibraryPlaylist(playlist.id);
        } catch (error) {
            console.error("Failed to create playlist:", error);
            selectLibraryView("songs");
        }
    }, [tempPlaylistId, tempPlaylistName]);

    const handleAddTracks = useCallback(async (playlistId: string, trackPaths: string[]) => {
        try {
            const { addedPaths, playlist } = await addTracksToPlaylist(playlistId, trackPaths);
            const addedCount = addedPaths.length;
            if (addedCount > 0) {
                showToast(`Added ${addedCount} ${addedCount === 1 ? "track" : "tracks"} to ${playlist.name}`, "info");
            } else {
                showToast("No new tracks to add", "info");
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to add tracks to playlist";
            showToast(message, "error");
        }
    }, []);

    return (
        <View className="flex-1 min-h-0">
            <MediaLibrarySearchBar searchInputRef={searchInputRef} query={searchQuery} />
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="pb-3">
                    <Text className="px-3 pt-2 pb-1 text-xs font-semibold text-white/40 uppercase tracking-wider">
                        Library
                    </Text>
                    {LIBRARY_VIEWS.map((view) => {
                        const isSelected = selectedView === view.id;
                        return (
                            <Button
                                key={view.id}
                                disabled={view.disabled}
                                className={listItemStyles.getRowClassName({
                                    variant: "compact",
                                    isSelected,
                                    isInteractive: !view.disabled,
                                })}
                                onClick={() => handleSelectView(view.id)}
                            >
                                <Text
                                    className={cn(
                                        "text-sm truncate flex-1 pr-4",
                                        isSelected ? listItemStyles.text.primary : listItemStyles.text.secondary,
                                        view.disabled ? "opacity-40" : "",
                                    )}
                                    numberOfLines={1}
                                >
                                    {view.label}
                                </Text>
                            </Button>
                        );
                    })}
                </View>

                {SUPPORT_PLAYLISTS ? (
                    <View className="pb-3">
                        <View className="flex-row items-center justify-between px-3 pt-2 pb-1">
                            <Text className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                                Playlists
                            </Text>
                            <Button
                                icon="plus"
                                variant="icon"
                                size="small"
                                accessibilityLabel="Add playlist"
                                disabled={Boolean(tempPlaylistId)}
                                onClick={handleAddPlaylist}
                                className="bg-transparent hover:bg-white/10"
                            />
                        </View>
                        {playlists.length === 0 ? (
                            <View className="px-3 py-1">
                                <Text className="text-sm text-white/40">No playlists yet</Text>
                            </View>
                        ) : (
                            playlists.map((playlist) => {
                                const isSelected =
                                    selectedView === "playlist" && selectedPlaylistId === playlist.id;
                                const isTemp = playlist.id === tempPlaylistId;
                                const isDroppable = playlist.source === "cache" && Boolean(playlist.filePath);
                                const isNativeDropActive =
                                    Platform.OS === "macos" && isDroppable && activeNativeDropPlaylistId === playlist.id;

                                if (isTemp) {
                                    return (
                                        <View
                                            key={playlist.id}
                                            className={listItemStyles.getRowClassName({
                                                variant: "compact",
                                                isSelected: true,
                                                isInteractive: false,
                                            })}
                                        >
                                            <TextInput
                                                value={tempPlaylistName}
                                                onChangeText={setTempPlaylistName}
                                                onSubmitEditing={finalizeTempPlaylist}
                                                onBlur={finalizeTempPlaylist}
                                                autoFocus
                                                selectTextOnFocus
                                                placeholder="New Playlist"
                                                className="flex-1 text-sm text-text-primary"
                                            />
                                        </View>
                                    );
                                }

                                const renderRow = (className?: string) => (
                                    <Button
                                        className={cn(
                                            listItemStyles.getRowClassName({
                                                variant: "compact",
                                                isSelected,
                                            }),
                                            className,
                                        )}
                                        onClick={() => selectLibraryPlaylist(playlist.id)}
                                    >
                                        <View className="flex-1 flex-row items-center justify-between overflow-hidden">
                                            <Text
                                                className={cn(
                                                    "text-sm truncate flex-1 pr-2",
                                                    isSelected
                                                        ? listItemStyles.text.primary
                                                        : listItemStyles.text.secondary,
                                                )}
                                                numberOfLines={1}
                                            >
                                                {playlist.name}
                                            </Text>
                                            <Text className={listItemStyles.getMetaClassName()}>
                                                {playlist.trackCount}
                                            </Text>
                                        </View>
                                    </Button>
                                );

                                if (Platform.OS === "macos") {
                                    return (
                                        <DragDropView
                                            key={playlist.id}
                                            className={cn(
                                                "relative",
                                                isNativeDropActive ? "bg-blue-500/15 border border-blue-400/50" : "",
                                            )}
                                            onTrackDragEnter={() => {
                                                if (isDroppable) {
                                                    setActiveNativeDropPlaylistId(playlist.id);
                                                }
                                            }}
                                            onTrackDragLeave={() => {
                                                setActiveNativeDropPlaylistId((prev) =>
                                                    prev === playlist.id ? null : prev,
                                                );
                                            }}
                                            onTrackDrop={(event) => {
                                                setActiveNativeDropPlaylistId((prev) =>
                                                    prev === playlist.id ? null : prev,
                                                );
                                                const tracks = event.nativeEvent.tracks ?? [];
                                                const trackPaths = tracks
                                                    .map((track) => track.filePath ?? track.id)
                                                    .filter((path): path is string => Boolean(path));
                                                if (isDroppable && trackPaths.length > 0) {
                                                    void handleAddTracks(playlist.id, trackPaths);
                                                }
                                            }}
                                        >
                                            {renderRow()}
                                        </DragDropView>
                                    );
                                }

                                if (!isDroppable) {
                                    return <View key={playlist.id}>{renderRow()}</View>;
                                }

                                return (
                                    <View key={playlist.id} className="relative">
                                        <DroppableZone
                                            id={`library-playlist-drop-${playlist.id}`}
                                            className="absolute inset-0"
                                            allowDrop={(item: DraggedItem) => {
                                                if (item.sourceZoneId !== MEDIA_LIBRARY_DRAG_ZONE_ID) {
                                                    return false;
                                                }

                                                const data = item.data as MediaLibraryDragData;
                                                return data?.type === "media-library-tracks" && data.tracks.length > 0;
                                            }}
                                            onDrop={(item: DraggedItem) => {
                                                const data = item.data as MediaLibraryDragData;
                                                if (data?.type !== "media-library-tracks") {
                                                    return;
                                                }

                                                const trackPaths = data.tracks
                                                    .map((track) => track.filePath)
                                                    .filter((path): path is string => Boolean(path));
                                                if (trackPaths.length === 0) {
                                                    return;
                                                }

                                                void handleAddTracks(playlist.id, trackPaths);
                                            }}
                                        >
                                            {(isActive) =>
                                                isActive ? (
                                                    <View className="absolute inset-0 rounded-md bg-blue-500/15 border border-blue-400/50" />
                                                ) : null
                                            }
                                        </DroppableZone>
                                        {renderRow()}
                                    </View>
                                );
                            })
                        )}
                    </View>
                ) : null}

                <View className="pb-6">
                    <Text className="px-3 pt-2 pb-1 text-xs font-semibold text-white/40 uppercase tracking-wider">
                        Sources
                    </Text>
                    <View className="px-3 py-1">
                        <Text className="text-sm text-white/70">✓ Local Music</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
