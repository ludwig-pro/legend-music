import { use$, useObservable } from "@legendapp/state/react";
import { Text, View } from "react-native";

import { Select } from "@/components/Select";
import {
	controls,
	playerState$,
	type YTMusicPlaylist,
} from "@/components/YouTubeMusicPlayer";
import { localMusicState$, setCurrentPlaylist } from "@/systems/LocalMusicState";

export function PlaylistSelector() {
	const playerState = use$(playerState$);
	const localMusicState = use$(localMusicState$);
	const selectedPlaylist$ = useObservable<YTMusicPlaylist>(undefined);
	const selectedPlaylist = use$(selectedPlaylist$);

	// Create local files playlist
	const localFilesPlaylist: YTMusicPlaylist = {
		id: "LOCAL_FILES",
		title: "Local Files",
		thumbnail: "",
		trackCount: localMusicState.tracks.length,
		creator: "Local Library",
	};

	// Combine YouTube Music playlists with local files
	const availablePlaylists = [
		localFilesPlaylist,
		...playerState.availablePlaylists,
	];

	const handlePlaylistSelect = (playlist: YTMusicPlaylist) => {
		console.log("Navigating to playlist:", playlist.id);
		selectedPlaylist$.set(playlist);
		setCurrentPlaylist(playlist.id);
		
		if (playlist.id === "LOCAL_FILES") {
			// Handle local files selection
			console.log("Selected local files playlist");
		} else {
			// Handle YouTube Music playlists
			controls.navigateToPlaylist(playlist.id);
		}
	};

	return (
		<View className="mx-6 mt-4">
			{availablePlaylists.length > 0 ? (
				<Select
					items={availablePlaylists}
					selected$={selectedPlaylist$}
					placeholder="Select a playlist"
					onSelectItem={handlePlaylistSelect}
					getItemKey={(playlist) => playlist.id}
					renderItem={(playlist) => (
						<View className="flex-row items-center w-80">
							<Text className="text-white text-base font-medium flex-1">
								{playlist.title}
							</Text>
						</View>
					)}
					renderItemText={(playlist) => playlist.title}
					className="rounded-2xl"
					triggerClassName="px-6 py-4"
				/>
			) : (
				<View className="bg-white/20 rounded-2xl px-6 py-4 flex-row items-center justify-between">
					<Text className="text-white text-lg font-medium">
						{playerState.isLoading
							? "Loading playlists..."
							: "No playlists found"}
					</Text>
					<Text className="text-white/70 text-lg">⌄</Text>
				</View>
			)}
		</View>
	);
}
