import type { LocalTrack } from "@/systems/LocalMusicState";

export type PlaylistDragData = {
    type: "playlist-track";
    queueEntryId: string;
};

export type MediaLibraryDragData = {
    type: "media-library-tracks";
    tracks: LocalTrack[];
};

export type DragData = PlaylistDragData | MediaLibraryDragData;

export const PLAYLIST_DRAG_ZONE_ID = "playlist-tracks";
export const MEDIA_LIBRARY_DRAG_ZONE_ID = "media-library-tracks";
