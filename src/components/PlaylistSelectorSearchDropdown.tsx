import { use$, useObservable } from "@legendapp/state/react";
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    type NativeSyntheticEvent,
    Text,
    type TextInputKeyPressEventData,
    type TextInput as TextInputNative,
    View,
} from "react-native";

import { Button } from "@/components/Button";
import { DropdownMenu, type DropdownMenuRootRef } from "@/components/DropdownMenu";
import { StyledInput } from "@/components/StyledInput";
import { TrackItem } from "@/components/TrackItem";
import KeyboardManager, { KeyCodes } from "@/systems/keyboard/KeyboardManager";
import type { LocalTrack } from "@/systems/LocalMusicState";
import { cn } from "@/utils/cn";

interface PlaylistSelectorSearchDropdownProps {
    tracks: LocalTrack[];
    onSelectTrack: (track: LocalTrack) => void;
    onOpenChange?: (open: boolean) => void;
}

export const PlaylistSelectorSearchDropdown = forwardRef<DropdownMenuRootRef, PlaylistSelectorSearchDropdownProps>(
    function PlaylistSelectorSearchDropdown({ tracks, onSelectTrack, onOpenChange }, ref) {
        const searchQuery$ = useObservable("");
        const searchQuery = use$(searchQuery$);
        const searchInputRef = useRef<TextInputNative>(null);
        const isOpen$ = useObservable(false);
        const isOpen = use$(isOpen$);
        const [highlightedIndex, setHighlightedIndex] = useState(-1);

        const trimmedQuery = searchQuery.trim();

        const searchResults = useMemo(() => {
            if (!trimmedQuery) {
                return [] as LocalTrack[];
            }

            const lowerQuery = trimmedQuery.toLowerCase();

            return tracks
                .filter(
                    (track) =>
                        track.title.toLowerCase().includes(lowerQuery) ||
                        track.artist.toLowerCase().includes(lowerQuery),
                )
                .slice(0, 10);
        }, [tracks, trimmedQuery]);

        useEffect(() => {
            if (!isOpen) {
                setHighlightedIndex(-1);
                return;
            }

            if (searchResults.length === 0) {
                setHighlightedIndex(-1);
                return;
            }

            setHighlightedIndex((prev) => {
                if (prev < 0 || prev >= searchResults.length) {
                    return 0;
                }
                return prev;
            });
        }, [isOpen, searchResults]);

        const handleTrackSelect = useCallback(
            (track: LocalTrack) => {
                onSelectTrack(track);
                searchQuery$.set("");
            },
            [onSelectTrack, searchQuery$],
        );

        useEffect(() => {
            const removeKeyDown = KeyboardManager.addKeyDownListener((event) => {
                if (!isOpen || searchResults.length === 0) {
                    return false;
                }

                if (event.keyCode === KeyCodes.KEY_DOWN) {
                    setHighlightedIndex((prev) => {
                        if (prev < 0) {
                            return 0;
                        }
                        return (prev + 1) % searchResults.length;
                    });
                    return true;
                }

                if (event.keyCode === KeyCodes.KEY_UP) {
                    setHighlightedIndex((prev) => {
                        if (prev < 0) {
                            return searchResults.length - 1;
                        }
                        return (prev - 1 + searchResults.length) % searchResults.length;
                    });
                    return true;
                }

                if (
                    event.keyCode === KeyCodes.KEY_RETURN &&
                    highlightedIndex >= 0 &&
                    highlightedIndex < searchResults.length
                ) {
                    handleTrackSelect(searchResults[highlightedIndex]);
                    handleOpenChange(false);
                    return true;
                }

                return false;
            });

            return removeKeyDown;
        }, [handleTrackSelect, highlightedIndex, isOpen, searchResults]);

        const handleOpenChange = useCallback(
            (open: boolean) => {
                isOpen$.set(open);
                if (!open) {
                    searchQuery$.set("");
                }
                onOpenChange?.(open);
            },
            [onOpenChange, searchQuery$],
        );

        const handleKeyPress = useCallback((event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
            event.preventDefault();
        }, []);

        return (
            <DropdownMenu.Root ref={ref} isOpen$={isOpen$} onOpenChange={handleOpenChange}>
                <DropdownMenu.Trigger asChild>
                    <Button icon="magnifyingglass" variant="icon" size="small" className="ml-2 hover:bg-white/10" />
                </DropdownMenu.Trigger>
                <DropdownMenu.Content
                    directionalHint="topCenter"
                    setInitialFocus
                    variant="unstyled"
                    className="max-w-5xl"
                >
                    <StyledInput
                        ref={searchInputRef}
                        value$={searchQuery$}
                        placeholder="Search tracks..."
                        ignoreDropdownState={true}
                        autoFocus
                        onKeyPress={handleKeyPress}
                    />
                    {trimmedQuery && (
                        <View>
                            {searchResults.length > 0 && (
                                <View className="max-h-64">
                                    {searchResults.map((track, index) => (
                                        <DropdownMenu.Item
                                            key={track.id}
                                            onSelect={() => handleTrackSelect(track)}
                                            variant="unstyled"
                                            className={cn(
                                                "hover:bg-white/10 rounded-md",
                                                highlightedIndex === index && "bg-white/20",
                                            )}
                                        >
                                            <TrackItem
                                                track={track}
                                                index={index}
                                                onTrackClick={() => handleTrackSelect(track)}
                                            />
                                        </DropdownMenu.Item>
                                    ))}
                                </View>
                            )}
                            {trimmedQuery && searchResults.length === 0 && (
                                <Text className="text-white/60 text-sm p-2">No tracks found</Text>
                            )}
                        </View>
                    )}
                </DropdownMenu.Content>
            </DropdownMenu.Root>
        );
    },
);
