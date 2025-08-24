import { observable } from '@legendapp/state'
import { createJSONManager } from '@/utils/JSONManager'

export interface LibraryItem {
    id: string
    type: 'artist' | 'album' | 'playlist' | 'track'
    name: string
    children?: LibraryItem[]
    trackCount?: number
    duration?: number
}

export interface Track {
    id: string
    title: string
    artist: string
    album: string
    duration: number
    filePath: string
    albumArt?: string
    metadata?: any
}

// Library UI state (persistent)
export const libraryUI$ = createJSONManager({
    filename: 'libraryUI',
    initialValue: {
        isOpen: false,
        selectedItem: null as LibraryItem | null,
        searchQuery: '',
        expandedNodes: [] as string[],
    },
})

// Non-persistent UI state
export const libraryUIState$ = observable({
    // Add any non-persistent state here if needed
})

// Library data
export const library$ = observable({
    artists: [] as LibraryItem[],
    albums: [] as LibraryItem[],
    playlists: [] as LibraryItem[],
    tracks: [] as Track[],
    isScanning: false,
    lastScanTime: null as Date | null,
})

// Mock data for development
library$.artists.set([
    {
        id: 'artist-1',
        type: 'artist',
        name: 'Radiohead',
        trackCount: 15,
        children: [
            {
                id: 'album-1',
                type: 'album',
                name: 'OK Computer',
                trackCount: 12,
            },
            {
                id: 'album-2',
                type: 'album',
                name: 'In Rainbows',
                trackCount: 10,
            }
        ]
    },
    {
        id: 'artist-2',
        type: 'artist',
        name: 'The Beatles',
        trackCount: 25,
        children: [
            {
                id: 'album-3',
                type: 'album',
                name: 'Abbey Road',
                trackCount: 17,
            }
        ]
    }
])

library$.playlists.set([
    {
        id: 'playlist-1',
        type: 'playlist',
        name: 'Favorites',
        trackCount: 8,
    },
    {
        id: 'playlist-2',
        type: 'playlist',
        name: 'Rock.m3u',
        trackCount: 12,
    }
])

library$.tracks.set([
    {
        id: 'track-1',
        title: 'Paranoid Android',
        artist: 'Radiohead',
        album: 'OK Computer',
        duration: 383,
        filePath: '/Users/music/radiohead/paranoid.mp3',
    },
    {
        id: 'track-2', 
        title: 'Subterranean Homesick Alien',
        artist: 'Radiohead',
        album: 'OK Computer',
        duration: 267,
        filePath: '/Users/music/radiohead/subterranean.mp3',
    },
    {
        id: 'track-3',
        title: 'Exit Music (For a Film)',
        artist: 'Radiohead',
        album: 'OK Computer',
        duration: 264,
        filePath: '/Users/music/radiohead/exit.mp3',
    },
    {
        id: 'track-4',
        title: 'Come Together',
        artist: 'The Beatles',
        album: 'Abbey Road',
        duration: 259,
        filePath: '/Users/music/beatles/come_together.mp3',
    }
])