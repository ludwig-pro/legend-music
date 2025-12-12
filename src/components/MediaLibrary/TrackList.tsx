import { LegendList } from "@legendapp/list";
import type { Observable } from "@legendapp/state";
import { useCallback } from "react";
import { Platform, Text, View } from "react-native";
import type { NativeMouseEvent } from "react-native-macos";
import { DraggableItem, MEDIA_LIBRARY_DRAG_ZONE_ID, type MediaLibraryDragData } from "@/components/dnd";
import { type TrackData, TrackItem } from "@/components/TrackItem";
import { type NativeDragTrack, TrackDragSource } from "@/native-modules/TrackDragSource";
import { useLibraryTrackList } from "./useLibraryTrackList";

interface TrackListProps {
}

function getFixedItemSize() {
    return 32;
}

export function TrackList(_props: TrackListProps) {
    const {
        tracks,
        selectedIndices$,
        handleTrackClick,
        handleTrackDoubleClick,
        handleTrackContextMenu,
        handleNativeDragStart,
        buildDragData,
        keyExtractor,
    } = useLibraryTrackList();

    const renderTrack = useCallback(
        ({ item, index }: { item: TrackData; index: number }) => (
            <LibraryTrackRow
                track={item}
                index={index}
                onClick={handleTrackClick}
                onDoubleClick={handleTrackDoubleClick}
                onRightClick={handleTrackContextMenu}
                selectedIndices$={selectedIndices$}
                buildDragData={buildDragData}
                onNativeDragStart={handleNativeDragStart}
            />
        ),
        [
            buildDragData,
            handleTrackClick,
            handleTrackDoubleClick,
            handleTrackContextMenu,
            handleNativeDragStart,
            selectedIndices$,
        ],
    );

    return (
        <View className="flex-1 min-h-0">
            <LegendList
                data={tracks}
                keyExtractor={keyExtractor}
                renderItem={renderTrack}
                getFixedItemSize={getFixedItemSize}
                style={{ flex: 1 }}
                contentContainerStyle={
                    tracks.length
                        ? undefined
                        : {
                              flexGrow: 1,
                              justifyContent: "center",
                              alignItems: "flex-start",
                              paddingVertical: 16,
                              paddingHorizontal: 10,
                          }
                }
                waitForInitialLayout={false}
                estimatedItemSize={64}
                recycleItems
                ListEmptyComponent={
                    <View className="items-start justify-center py-4 px-2.5">
                        <Text className="text-sm text-white/60 text-left">No tracks found</Text>
                    </View>
                }
            />
        </View>
    );
}

interface LibraryTrackRowProps {
    track: TrackData;
    index: number;
    onClick: (index: number, event?: NativeMouseEvent) => void;
    onDoubleClick: (index: number, event?: NativeMouseEvent) => void;
    onRightClick: (index: number, event: NativeMouseEvent) => void;
    selectedIndices$: Observable<Set<number>>;
    buildDragData: (activeIndex: number) => MediaLibraryDragData;
    onNativeDragStart: () => void;
}

function LibraryTrackRow({
    track,
    index,
    onClick,
    onDoubleClick,
    onRightClick,
    selectedIndices$,
    buildDragData,
    onNativeDragStart,
}: LibraryTrackRowProps) {
    const dragData = buildDragData(index);

    if (Platform.OS === "macos") {
        return (
            <TrackDragSource
                tracks={dragData.tracks as NativeDragTrack[]}
                onDragStart={onNativeDragStart}
                className="flex-1"
            >
                <TrackItem
                    track={track}
                    index={index}
                    onClick={onClick}
                    onDoubleClick={onDoubleClick}
                    onRightClick={onRightClick}
                    showIndex={false}
                    showAlbumArt={false}
                    selectedIndices$={selectedIndices$}
                    suppressActiveState
                />
            </TrackDragSource>
        );
    }

    return (
        <DraggableItem
            id={`library-track-${track.id}`}
            zoneId={MEDIA_LIBRARY_DRAG_ZONE_ID}
            data={() => dragData}
            className="flex-1"
        >
            <TrackItem
                track={track}
                index={index}
                onClick={onClick}
                onDoubleClick={onDoubleClick}
                onRightClick={onRightClick}
                showIndex={false}
                showAlbumArt={false}
                selectedIndices$={selectedIndices$}
                suppressActiveState
            />
        </DraggableItem>
    );
}
