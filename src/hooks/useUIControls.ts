import { useValue } from "@legendapp/state/react";
import type { BottomBarControlId, PlaybackControlId, UIControlLayout } from "@/systems/Settings";
import { settings$ } from "@/systems/Settings";

export function usePlaybackControlLayout(): UIControlLayout<PlaybackControlId> {
    return useValue(settings$.ui.playback) ?? ({ shown: [] } as UIControlLayout<PlaybackControlId>);
}

export function useBottomBarControlLayout(): UIControlLayout<BottomBarControlId> {
    return useValue(settings$.ui.bottomBar) ?? ({ shown: [] } as UIControlLayout<BottomBarControlId>);
}
