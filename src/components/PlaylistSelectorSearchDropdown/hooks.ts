import type { Observable } from "@legendapp/state";
import { useObservable, useValue } from "@legendapp/state/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { playlistNavigationState$ } from "@/state/playlistNavigationState";
import KeyboardManager, { type KeyboardEvent, KeyCodes } from "@/systems/keyboard/KeyboardManager";
import type { LibraryItem } from "@/systems/LibraryState";
import type { LocalPlaylist, LocalTrack } from "@/systems/LocalMusicState";
import { getQueueAction, type QueueAction } from "@/utils/queueActions";

export type SearchResult =
    | { type: "track"; item: LocalTrack }
    | { type: "library"; item: LibraryItem }
    | { type: "playlist"; item: LocalPlaylist };

export interface UseSearchDropdownStateResult {
    searchQuery$: Observable<string>;
    searchQuery: string;
    isOpen$: Observable<boolean>;
    isOpen: boolean;
    handleOpenChange: (open: boolean) => void;
}

export function useSearchDropdownState(onOpenChange?: (open: boolean) => void): UseSearchDropdownStateResult {
    const searchQuery$ = useObservable("");
    const searchQuery = useValue(searchQuery$);
    const isOpen$ = useObservable(false);
    const isOpen = useValue(isOpen$);

    const handleOpenChange = useCallback(
        (open: boolean) => {
            isOpen$.set(open);
            playlistNavigationState$.isSearchDropdownOpen.set(open);
            if (!open) {
                searchQuery$.set("");
            }
            onOpenChange?.(open);
        },
        [isOpen$, onOpenChange, searchQuery$],
    );

    return { searchQuery$, searchQuery, isOpen$, isOpen, handleOpenChange };
}

interface BuildSearchResultsInput {
    query: string;
    tracks: LocalTrack[];
    playlists: LocalPlaylist[];
    albums: LibraryItem[];
    artists: LibraryItem[];
}

export function buildSearchResults({
    query,
    tracks,
    playlists,
    albums,
    artists,
}: BuildSearchResultsInput): SearchResult[] {
    const trimmed = query.trim();
    if (!trimmed) {
        return [];
    }

    const lowerQuery = trimmed.toLowerCase();
    const results: SearchResult[] = [];

    const matchingPlaylists = playlists
        .filter((playlist) => playlist.name.toLowerCase().includes(lowerQuery))
        .slice(0, 5)
        .map((playlist): SearchResult => ({ type: "playlist", item: playlist }));

    const matchingTracks = tracks
        .filter(
            (track) =>
                track.title.toLowerCase().includes(lowerQuery) ||
                track.artist.toLowerCase().includes(lowerQuery) ||
                track.album?.toLowerCase().includes(lowerQuery),
        )
        .slice(0, 6)
        .map((track): SearchResult => ({ type: "track", item: track }));

    const matchingAlbums = albums
        .filter((album) => album.name.toLowerCase().includes(lowerQuery))
        .slice(0, 3)
        .map((album): SearchResult => ({ type: "library", item: album }));

    const matchingArtists = artists
        .filter((artist) => artist.name.toLowerCase().includes(lowerQuery))
        .slice(0, 3)
        .map((artist): SearchResult => ({ type: "library", item: artist }));

    results.push(...matchingTracks, ...matchingPlaylists, ...matchingArtists, ...matchingAlbums);
    return results.slice(0, 20);
}

interface UsePlaylistSearchResultsOptions {
    tracks: LocalTrack[];
    playlists: LocalPlaylist[];
    albums: LibraryItem[];
    artists: LibraryItem[];
    query: string;
}

export function usePlaylistSearchResults({
    tracks,
    playlists,
    albums,
    artists,
    query,
}: UsePlaylistSearchResultsOptions) {
    return useMemo(
        () => buildSearchResults({ query, tracks, playlists, albums, artists }),
        [albums, artists, playlists, query, tracks],
    );
}

interface UseDropdownKeyboardNavigationOptions {
    isOpen: boolean;
    resultsLength: number;
    onSubmit: (index: number, action: QueueAction) => void;
}

const createDefaultModifierState = () => ({
    shift: false,
    option: false,
    alt: false,
    ctrl: false,
    meta: false,
});

export function useDropdownKeyboardNavigation({
    isOpen,
    resultsLength,
    onSubmit,
}: UseDropdownKeyboardNavigationOptions) {
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const modifierStateRef = useRef(createDefaultModifierState());

    const resetModifiers = useCallback(() => {
        modifierStateRef.current = createDefaultModifierState();
    }, []);

    const updateModifierState = useCallback((event: KeyboardEvent) => {
        modifierStateRef.current = {
            shift: KeyboardManager.hasModifier(event, KeyCodes.MODIFIER_SHIFT),
            option: KeyboardManager.hasModifier(event, KeyCodes.MODIFIER_OPTION),
            alt: KeyboardManager.hasModifier(event, KeyCodes.MODIFIER_OPTION),
            ctrl: KeyboardManager.hasModifier(event, KeyCodes.MODIFIER_CONTROL),
            meta: KeyboardManager.hasModifier(event, KeyCodes.MODIFIER_COMMAND),
        };
    }, []);

    useEffect(() => {
        if (!isOpen || resultsLength === 0) {
            setHighlightedIndex(-1);
            return;
        }

        setHighlightedIndex((prev) => {
            if (prev < 0 || prev >= resultsLength) {
                return 0;
            }
            return prev;
        });
    }, [isOpen, resultsLength]);

    useEffect(() => {
        const removeKeyDown = KeyboardManager.addKeyDownListener((event) => {
            updateModifierState(event);

            if (!isOpen || resultsLength === 0) {
                return false;
            }

            if (event.keyCode === KeyCodes.KEY_DOWN) {
                setHighlightedIndex((prev) => {
                    if (prev < 0) {
                        return 0;
                    }
                    return (prev + 1) % resultsLength;
                });
                return true;
            }

            if (event.keyCode === KeyCodes.KEY_UP) {
                setHighlightedIndex((prev) => {
                    if (prev < 0) {
                        return resultsLength - 1;
                    }
                    return (prev - 1 + resultsLength) % resultsLength;
                });
                return true;
            }

            if (event.keyCode === KeyCodes.KEY_RETURN && resultsLength > 0) {
                const action = getQueueAction({
                    modifierState: modifierStateRef.current,
                    fallbackAction: "play-now",
                });
                const index = highlightedIndex >= 0 ? highlightedIndex : 0;
                onSubmit(index, action);
                resetModifiers();
                return true;
            }

            return false;
        });

        const removeKeyUp = KeyboardManager.addKeyUpListener((event) => {
            updateModifierState(event);
            if (event.modifiers === 0) {
                resetModifiers();
            }
            return false;
        });

        return () => {
            removeKeyDown();
            removeKeyUp();
        };
    }, [highlightedIndex, isOpen, onSubmit, resetModifiers, resultsLength, updateModifierState]);

    return {
        highlightedIndex,
        setHighlightedIndex,
        modifierStateRef,
        resetModifiers,
    };
}
