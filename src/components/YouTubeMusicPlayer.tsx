import { useObservable } from '@legendapp/state/react';
import React, { useRef } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

interface Track {
    title: string;
    artist: string;
    duration: string;
    thumbnail: string;
    id?: string;
}

interface PlaylistTrack extends Track {
    isPlaying?: boolean;
    index: number;
}

interface PlayerState {
    isPlaying: boolean;
    currentTrack: Track | null;
    currentTime: string;
    isLoading: boolean;
    error: string | null;
    playlist: PlaylistTrack[];
    currentTrackIndex: number;
}

const injectedJavaScript = `
(function() {
    let lastState = {};

    function extractPlaylistInfo() {
        try {
            const playlist = [];
            let currentTrackIndex = -1;
            
            // Try multiple strategies to find playlist items
            let items = [];
            
            // Strategy 1: Try to get queue items (most reliable for current playlist)
            const queueItems = document.querySelectorAll('ytmusic-player-queue-item');
            if (queueItems.length > 0) {
                items = Array.from(queueItems);
                console.log('Found queue items:', items.length);
            }
            
            // Strategy 2: Try to find Up Next section
            if (items.length === 0) {
                const upNextItems = document.querySelectorAll('ytmusic-player-queue ytmusic-responsive-list-item-renderer');
                if (upNextItems.length > 0) {
                    items = Array.from(upNextItems);
                    console.log('Found up next items:', items.length);
                }
            }
            
            // Strategy 3: Try general playlist items on the page
            if (items.length === 0) {
                const playlistItems = document.querySelectorAll('ytmusic-responsive-list-item-renderer');
                if (playlistItems.length > 0) {
                    items = Array.from(playlistItems).slice(0, 20); // Limit to avoid too many items
                    console.log('Found general playlist items:', items.length);
                }
            }
            
            // Strategy 4: Try any music items
            if (items.length === 0) {
                const musicItems = document.querySelectorAll('[class*="music"], [class*="song"], [class*="track"]');
                items = Array.from(musicItems).slice(0, 10);
                console.log('Found music items:', items.length);
            }
            
            // Process found items
            items.forEach((item, index) => {
                const titleEl = item.querySelector('.title, [class*="title"], .song-title, h3, h4');
                const artistEl = item.querySelector('.byline, [class*="byline"], .artist, [class*="artist"], .subtitle');
                const durationEl = item.querySelector('.duration, [class*="duration"], .time');
                const thumbnailEl = item.querySelector('img');
                
                if (titleEl && artistEl) {
                    const title = titleEl.textContent?.trim() || '';
                    const artist = artistEl.textContent?.trim() || '';
                    
                    // Only skip if it's completely empty or just whitespace
                    if (title && artist && title !== artist) {
                        playlist.push({
                            title: title,
                            artist: artist,
                            duration: durationEl?.textContent?.trim() || '',
                            thumbnail: thumbnailEl?.src || '',
                            index: index,
                            isPlaying: item.classList.contains('playing') || 
                                     item.getAttribute('aria-selected') === 'true' ||
                                     item.classList.contains('selected')
                        });
                        
                        if (item.classList.contains('playing') || 
                            item.getAttribute('aria-selected') === 'true' ||
                            item.classList.contains('selected')) {
                            currentTrackIndex = playlist.length - 1;
                        }
                    }
                }
            });
            
            console.log('Final playlist:', playlist.length, 'items');
            return { playlist, currentTrackIndex };
        } catch (error) {
            console.error('Error extracting playlist:', error);
            return { playlist: [], currentTrackIndex: -1 };
        }
    }

    function extractPlayerInfo() {
        try {
            // Get current track info
            const titleElement = document.querySelector('.title.style-scope.ytmusic-player-bar');
            const artistElement = document.querySelector('.byline.style-scope.ytmusic-player-bar');
            const thumbnailElement = document.querySelector('.image.style-scope.ytmusic-player-bar img');

            // Get play/pause state
            const playButton = document.querySelector('#play-pause-button button');
            const isPlaying = playButton?.getAttribute('aria-label')?.includes('Pause') || false;

            // Get current time
            const timeElement = document.querySelector('#left-controls .time-info');
            const currentTime = timeElement?.textContent?.trim() || '0:00';

            // Get duration
            const durationElement = document.querySelector('#right-controls .time-info');
            const duration = durationElement?.textContent?.trim() || '0:00';
            
            // Get playlist info
            const { playlist, currentTrackIndex } = extractPlaylistInfo();

            const currentState = {
                isPlaying,
                currentTrack: {
                    title: titleElement?.textContent?.trim() || '',
                    artist: artistElement?.textContent?.trim() || '',
                    duration: duration,
                    thumbnail: thumbnailElement?.src || ''
                },
                currentTime,
                playlist,
                currentTrackIndex,
                isLoading: false,
                error: null
            };

            // Only send update if state changed
            if (JSON.stringify(currentState) !== JSON.stringify(lastState)) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'playerState',
                    data: currentState
                }));
                lastState = currentState;
            }
        } catch (error) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'error',
                data: { error: error.message }
            }));
        }
    }

    // Control functions
    window.ytMusicControls = {
        playPause: function() {
            const button = document.querySelector('#play-pause-button button');
            if (button) button.click();
        },

        next: function() {
            const button = document.querySelector('.next-button button[aria-label="Next"]');
            if (button) button.click();
        },

        previous: function() {
            const button = document.querySelector('.previous-button button[aria-label="Previous"]');
            if (button) button.click();
        },

        setVolume: function(volume) {
            const slider = document.querySelector('#volume-slider input');
            if (slider) {
                slider.value = volume;
                slider.dispatchEvent(new Event('input', { bubbles: true }));
            }
        },

        seek: function(seconds) {
            const progressBar = document.querySelector('#progress-bar input');
            if (progressBar) {
                progressBar.value = seconds;
                progressBar.dispatchEvent(new Event('input', { bubbles: true }));
            }
        },
        
        playTrackAtIndex: function(index) {
            // Try to find and click the track at the given index
            const queueItems = document.querySelectorAll('ytmusic-player-queue-item, .ytmusic-player-queue-item, [class*="queue"] .song-item, .queue-item');
            
            if (queueItems[index]) {
                queueItems[index].click();
                return;
            }
            
            // Try alternative selectors for playlist items
            const playlistItems = document.querySelectorAll('ytmusic-responsive-list-item-renderer, .ytmusic-responsive-list-item-renderer, [class*="playlist"] .song-item');
            
            if (playlistItems[index]) {
                playlistItems[index].click();
            }
        }
    };

    // Initial extraction
    extractPlayerInfo();

    // Set up observers for dynamic content
    const observer = new MutationObserver(function(mutations) {
        let shouldUpdate = false;
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' || mutation.type === 'attributes') {
                shouldUpdate = true;
            }
        });
        if (shouldUpdate) {
            setTimeout(extractPlayerInfo, 100);
        }
    });

    // Observe the player bar for changes
    const playerBar = document.querySelector('ytmusic-player-bar');
    if (playerBar) {
        observer.observe(playerBar, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['aria-label', 'title']
        });
    }

    // Periodic updates as fallback
    setInterval(extractPlayerInfo, 1000);

    // Signal that injection is complete
    window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'injectionComplete',
        data: { success: true }
    }));
})();
`;

// Create observable player state outside component for global access
const playerState$ = useObservable<PlayerState>({
    isPlaying: false,
    currentTrack: null,
    currentTime: '0:00',
    isLoading: true,
    error: null,
    playlist: [],
    currentTrackIndex: -1,
});

let webViewRef: React.MutableRefObject<WebView | null> | null = null;

const executeCommand = (command: string, ...args: any[]) => {
    const script = `window.ytMusicControls.${command}(${args.map(arg => JSON.stringify(arg)).join(', ')}); true;`;
    webViewRef?.current?.injectJavaScript(script);
};

// Expose control methods
const controls = {
    playPause: () => executeCommand('playPause'),
    next: () => executeCommand('next'),
    previous: () => executeCommand('previous'),
    setVolume: (volume: number) => executeCommand('setVolume', volume),
    seek: (seconds: number) => executeCommand('seek', seconds),
    playTrackAtIndex: (index: number) => executeCommand('playTrackAtIndex', index),
};

export function YouTubeMusicPlayer() {
    const localWebViewRef = useRef<WebView>(null);

    // Set the global ref to this instance
    React.useEffect(() => {
        webViewRef = localWebViewRef;
        return () => {
            webViewRef = null;
        };
    }, []);

    const handleMessage = (event: any) => {
        try {
            const message = JSON.parse(event.nativeEvent.data);

            console.log({ message})

            switch (message.type) {
                case 'playerState':
                    playerState$.assign(message.data);
                    break;
                case 'error':
                    playerState$.error.set(message.data.error);
                    playerState$.isLoading.set(false);
                    break;
                case 'injectionComplete':
                    playerState$.isLoading.set(false);
                    break;
            }
        } catch (error) {
            console.error('Failed to parse WebView message:', error);
            playerState$.error.set('Failed to parse player message');
        }
    };

    return (
        <View className="flex-1">
            <WebView
                ref={localWebViewRef}
                source={{ uri: 'https://music.youtube.com' }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                mixedContentMode="compatibility"
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                injectedJavaScript={injectedJavaScript}
                onMessage={handleMessage}
                onLoadStart={() => playerState$.isLoading.set(true)}
                onLoadEnd={() => {
                    // Injection will set loading to false
                }}
                onError={(error) => {
                    playerState$.error.set(`WebView error: ${error.nativeEvent.description}`);
                    playerState$.isLoading.set(false);
                }}
                userAgent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                className="flex-1"
            />
        </View>
    );
}

// Export player state and controls for use in other components
export { playerState$, controls };
export type { Track, PlaylistTrack, PlayerState };