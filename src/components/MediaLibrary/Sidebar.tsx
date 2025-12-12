import { useValue } from "@legendapp/state/react";
import { useCallback, useRef } from "react";
import { ScrollView, Text, View } from "react-native";

import { Button } from "@/components/Button";
import type { TextInputSearchRef } from "@/components/TextInputSearch";
import { useListItemStyles } from "@/hooks/useListItemStyles";
import { SUPPORT_PLAYLISTS } from "@/systems/constants";
import { libraryUI$, selectLibraryView, type LibraryView } from "@/systems/LibraryState";
import { localMusicState$ } from "@/systems/LocalMusicState";
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

    const handleSelectView = useCallback(
        (view: LibraryView) => {
            selectLibraryView(view);
        },
        [],
    );

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
                                disabled
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
                                return (
                                    <Button
                                        key={playlist.id}
                                        className={listItemStyles.getRowClassName({
                                            variant: "compact",
                                            isSelected,
                                        })}
                                        onClick={() => {
                                            libraryUI$.selectedView.set("playlist");
                                            libraryUI$.selectedPlaylistId.set(playlist.id);
                                        }}
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

