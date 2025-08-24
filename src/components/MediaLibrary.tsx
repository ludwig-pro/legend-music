import { use$ } from '@legendapp/state/react'
import { useEffect } from 'react'
import { Text, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { Button } from '@/components/Button'
import { useOnHotkeys } from '@/systems/keyboard/Keyboard'
import { library$, libraryUI$ } from '@/systems/LibraryState'

const LIBRARY_HEIGHT = 250

export function MediaLibrary() {
    const isOpen = use$(libraryUI$.isOpen)
    const libraryHeight = useSharedValue(isOpen ? LIBRARY_HEIGHT : 0)

    const animatedStyle = useAnimatedStyle(() => ({
        height: libraryHeight.value,
        overflow: 'hidden'
    }))

    const toggleLibrary = () => {
        const newIsOpen = !isOpen
        libraryUI$.isOpen.set(newIsOpen)
        libraryHeight.value = withTiming(
            newIsOpen ? LIBRARY_HEIGHT : 0,
            { duration: 250 }
        )
    }

    // Keyboard shortcut support
    useOnHotkeys({
        ToggleLibrary: toggleLibrary,
    })

    // Sync animation with state on mount
    useEffect(() => {
        libraryHeight.value = isOpen ? LIBRARY_HEIGHT : 0
    }, [isOpen, libraryHeight])

    return (
        <View>
            {/* Library Toggle Button */}
            <View className="px-3 py-2 border-t border-white/10">
                <Button
                    icon={isOpen ? 'chevron.down' : 'chevron.up'}
                    iconSize={14}
                    variant="icon-text"
                    size="small"
                    onPress={toggleLibrary}
                    className="flex-row items-center justify-center hover:bg-white/10 active:bg-white/15 rounded py-2"
                >
                    <Text className="text-white/80 text-sm ml-1">
                        {isOpen ? 'Hide Library' : 'Show Library'}
                    </Text>
                </Button>
            </View>

            {/* Library Content */}
            <Animated.View style={animatedStyle}>
                <View className="border-t border-white/10 bg-black/10">
                    {/* Library Header */}
                    <View className="flex-row items-center justify-between px-3 py-2 bg-white/5">
                        <Text className="text-white text-sm font-medium">Library</Text>
                        <Button
                            icon="xmark"
                            iconSize={12}
                            variant="icon"
                            size="small"
                            onPress={() => {
                                libraryUI$.isOpen.set(false)
                                libraryHeight.value = withTiming(0, { duration: 250 })
                            }}
                            className="hover:bg-white/15 active:bg-white/25 rounded p-1"
                        />
                    </View>

                    {/* Library Content - Horizontal Split */}
                    <View className="flex-row flex-1" style={{ height: LIBRARY_HEIGHT - 40 }}>
                        {/* Library Tree (Left) */}
                        <View className="w-1/3 border-r border-white/10 bg-black/5">
                            <LibraryTree />
                        </View>

                        {/* Track List (Right) */}
                        <View className="flex-1 bg-black/5">
                            <TrackList />
                        </View>
                    </View>
                </View>
            </Animated.View>
        </View>
    )
}

function LibraryTree() {
    const selectedItem = use$(libraryUI$.selectedItem)
    const expandedNodes = use$(libraryUI$.expandedNodes)
    const artists = use$(library$.artists)
    const playlists = use$(library$.playlists)

    const toggleNode = (nodeId: string) => {
        const current = expandedNodes
        if (current.includes(nodeId)) {
            libraryUI$.expandedNodes.set(current.filter(id => id !== nodeId))
        } else {
            libraryUI$.expandedNodes.set([...current, nodeId])
        }
    }

    const selectItem = (item: any) => {
        libraryUI$.selectedItem.set(item)
    }

    return (
        <View className="p-2">
            <Text className="text-white/60 text-xs uppercase tracking-wider font-medium mb-2">Browse</Text>
            
            {/* Artists */}
            <Button
                icon={expandedNodes.includes('artists') ? 'chevron.down' : 'chevron.right'}
                iconSize={10}
                variant="icon-text"
                size="small"
                onPress={() => toggleNode('artists')}
                className="flex-row items-center mb-1 hover:bg-white/10 active:bg-white/15 rounded px-2 py-1"
            >
                <Text className="text-white/80 text-sm ml-1">Artists ({artists.length})</Text>
            </Button>

            {/* Show artists when expanded */}
            {expandedNodes.includes('artists') && (
                <View className="ml-4 mb-2">
                    {artists.map((artist) => (
                        <Button
                            key={artist.id}
                            variant="text"
                            size="small"
                            onPress={() => selectItem(artist)}
                            className={`flex-row items-center mb-1 rounded px-2 py-1 ${
                                selectedItem?.id === artist.id 
                                    ? 'bg-blue-500/20 border-blue-400/30' 
                                    : 'hover:bg-white/10 active:bg-white/15'
                            }`}
                        >
                            <Text className="text-white/70 text-xs">{artist.name}</Text>
                        </Button>
                    ))}
                </View>
            )}

            {/* All Songs */}
            <Button
                variant="text"
                size="small"
                onPress={() => selectItem({ id: 'all-songs', type: 'all', name: 'All Songs' })}
                className={`flex-row items-center mb-1 rounded px-2 py-1 ${
                    selectedItem?.id === 'all-songs' 
                        ? 'bg-blue-500/20 border-blue-400/30' 
                        : 'hover:bg-white/10 active:bg-white/15'
                }`}
            >
                <Text className="text-white/80 text-sm">All Songs</Text>
            </Button>

            {/* Playlists */}
            <Button
                icon={expandedNodes.includes('playlists') ? 'chevron.down' : 'chevron.right'}
                iconSize={10}
                variant="icon-text"
                size="small"
                onPress={() => toggleNode('playlists')}
                className="flex-row items-center mb-1 hover:bg-white/10 active:bg-white/15 rounded px-2 py-1"
            >
                <Text className="text-white/80 text-sm ml-1">Playlists ({playlists.length})</Text>
            </Button>

            {/* Show playlists when expanded */}
            {expandedNodes.includes('playlists') && (
                <View className="ml-4 mb-2">
                    {playlists.map((playlist) => (
                        <Button
                            key={playlist.id}
                            variant="text"
                            size="small"
                            onPress={() => selectItem(playlist)}
                            className={`flex-row items-center mb-1 rounded px-2 py-1 ${
                                selectedItem?.id === playlist.id 
                                    ? 'bg-blue-500/20 border-blue-400/30' 
                                    : 'hover:bg-white/10 active:bg-white/15'
                            }`}
                        >
                            <Text className="text-white/70 text-xs">{playlist.name}</Text>
                        </Button>
                    ))}
                </View>
            )}

            {/* Search */}
            <View className="mt-4">
                <Text className="text-white/40 text-xs">🔍 Search coming soon...</Text>
            </View>
        </View>
    )
}

function TrackList() {
    const selectedItem = use$(libraryUI$.selectedItem)
    const allTracks = use$(library$.tracks)

    if (!selectedItem) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="text-white/60 text-sm">Select an item to view tracks</Text>
            </View>
        )
    }

    // Filter tracks based on selected item
    let tracks = allTracks
    if (selectedItem.type === 'artist') {
        tracks = allTracks.filter(track => track.artist === selectedItem.name)
    } else if (selectedItem.type === 'playlist') {
        // For now, show all tracks for playlist items
        // Later this would filter based on actual playlist contents
        tracks = allTracks
    }

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <View className="p-2">
            <Text className="text-white text-sm font-medium mb-3">
                {selectedItem.name} ({tracks.length} track{tracks.length !== 1 ? 's' : ''})
            </Text>
            
            {/* Track list */}
            <View className="space-y-1">
                {tracks.map((track) => (
                    <View key={track.id} className="flex-row items-center py-2 px-2 hover:bg-white/10 rounded">
                        <View className="flex-1">
                            <Text className="text-white/80 text-sm font-medium" numberOfLines={1}>
                                {track.title}
                            </Text>
                            <Text className="text-white/50 text-xs" numberOfLines={1}>
                                {track.artist} • {track.album}
                            </Text>
                        </View>
                        <Text className="text-white/40 text-xs mr-2 tabular-nums">
                            {formatDuration(track.duration)}
                        </Text>
                        <Button
                            icon="plus"
                            iconSize={12}
                            variant="icon"
                            size="small"
                            onPress={() => {
                                console.log('Add track to queue:', track.title)
                                // TODO: Add to actual queue
                            }}
                            className="hover:bg-white/15 active:bg-white/25 rounded p-1"
                        />
                    </View>
                ))}
                
                {tracks.length === 0 && (
                    <View className="flex-1 items-center justify-center py-8">
                        <Text className="text-white/60 text-sm">No tracks found</Text>
                    </View>
                )}
            </View>
        </View>
    )
}