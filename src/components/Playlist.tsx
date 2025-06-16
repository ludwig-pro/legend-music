import { use$ } from "@legendapp/state/react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";

import { playerState$, controls } from "@/components/YouTubeMusicPlayer";

export function Playlist() {
    const playerState = use$(playerState$);
    const playlist = playerState.playlist;
    const currentTrackIndex = playerState.currentTrackIndex;

    return (
        <View className="flex-1">
            {playlist.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <Text className="text-white/60 text-base">
                        {playerState.isLoading ? "Loading playlist..." : "No playlist available"}
                    </Text>
                    <Text className="text-white/40 text-sm mt-2">
                        Navigate to YouTube Music and play a song
                    </Text>
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                    {playlist.map((track, index) => (
                        <TouchableOpacity
                            key={index}
                            className={`flex-row items-center px-6 py-4 ${
                                index === currentTrackIndex ? 'bg-white/10' : ''
                            }`}
                            onPress={() => controls.playTrackAtIndex(index)}
                        >
                            <Text className="text-white/60 text-base w-8">
                                {index + 1}
                            </Text>

                            {track.thumbnail ? (
                                <Image 
                                    source={{ uri: track.thumbnail }} 
                                    className="w-12 h-12 rounded-lg ml-4"
                                    resizeMode="cover"
                                />
                            ) : (
                                <View className="w-12 h-12 bg-white/20 rounded-lg ml-4 items-center justify-center">
                                    <Text className="text-white text-xs">♪</Text>
                                </View>
                            )}

                            <View className="flex-1 ml-4">
                                <Text className="text-white text-base font-medium mb-1">
                                    {track.title}
                                </Text>
                                <Text className="text-white/70 text-sm">
                                    {track.artist}
                                </Text>
                            </View>

                            <Text className="text-white/60 text-base">
                                {track.duration}
                            </Text>
                            
                            {index === currentTrackIndex && (
                                <View className="ml-2">
                                    <Text className="text-orange-400 text-sm">♪</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>
    );
}