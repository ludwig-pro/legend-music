import { useObservable } from "@legendapp/state/react";
import React, { useRef } from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";

import type { LocalTrack } from "@/systems/LocalMusicState";
import { localMusicState$ } from "@/systems/LocalMusicState";

interface LocalPlayerState {
    isPlaying: boolean;
    currentTrack: LocalTrack | null;
    currentTime: number;
    duration: number;
    volume: number;
    isLoading: boolean;
    error: string | null;
    currentIndex: number;
}

// Create observable player state for local music
const localPlayerState$ = useObservable<LocalPlayerState>({
    isPlaying: false,
    currentTrack: null,
    currentTime: 0,
    duration: 0,
    volume: 0.5,
    isLoading: true,
    error: null,
    currentIndex: -1,
});

let localAudioWebViewRef: React.MutableRefObject<WebView | null> | null = null;

const executeLocalAudioCommand = (command: string, ...args: any[]) => {
    const script = `window.localAudioPlayer.${command}(${args.map((arg) => JSON.stringify(arg)).join(", ")}); true;`;
    localAudioWebViewRef?.current?.injectJavaScript(script);
};

// Expose control methods for local audio
const localAudioControls = {
    loadTrack: (filePath: string, title: string, artist: string) => 
        executeLocalAudioCommand("loadTrack", filePath, title, artist),
    
    loadPlaylist: (playlist: LocalTrack[], startIndex: number = 0) => 
        executeLocalAudioCommand("loadPlaylist", playlist, startIndex),
    
    play: () => executeLocalAudioCommand("play"),
    pause: () => executeLocalAudioCommand("pause"),
    togglePlayPause: () => executeLocalAudioCommand("togglePlayPause"),
    
    playPrevious: () => executeLocalAudioCommand("playPrevious"),
    playNext: () => executeLocalAudioCommand("playNext"),
    playTrackAtIndex: (index: number) => executeLocalAudioCommand("playTrackAtIndex", index),
    
    setVolume: (volume: number) => executeLocalAudioCommand("setVolume", volume),
    seek: (seconds: number) => executeLocalAudioCommand("seek", seconds),
    
    getCurrentState: () => executeLocalAudioCommand("getCurrentState"),
};

export function LocalAudioPlayer() {
    const localWebViewRef = useRef<WebView>(null);

    // Set the global ref to this instance
    React.useEffect(() => {
        localAudioWebViewRef = localWebViewRef;
        return () => {
            localAudioWebViewRef = null;
        };
    }, []);

    const handleMessage = (event: any) => {
        try {
            const message = JSON.parse(event.nativeEvent.data);
            console.log("LocalAudioPlayer message:", message);

            switch (message.type) {
                case "ready":
                    localPlayerState$.isLoading.set(false);
                    console.log("Local audio player is ready");
                    break;
                    
                case "trackLoaded":
                    const trackData = message.data;
                    // Update current track in local music state
                    localPlayerState$.currentIndex.set(trackData.currentIndex);
                    // Find the track in our local tracks array
                    const tracks = localMusicState$.tracks.get();
                    const track = tracks.find(t => t.filePath === trackData.filePath);
                    if (track) {
                        localPlayerState$.currentTrack.set(track);
                    }
                    break;
                    
                case "playlistLoaded":
                    console.log("Local playlist loaded:", message.data.playlist.length, "tracks");
                    localPlayerState$.currentIndex.set(message.data.currentIndex);
                    break;
                    
                case "play":
                    localPlayerState$.isPlaying.set(true);
                    break;
                    
                case "pause":
                    localPlayerState$.isPlaying.set(false);
                    break;
                    
                case "timeupdate":
                    localPlayerState$.currentTime.set(message.data.currentTime);
                    localPlayerState$.duration.set(message.data.duration);
                    break;
                    
                case "loadedmetadata":
                    localPlayerState$.duration.set(message.data.duration);
                    break;
                    
                case "error":
                    localPlayerState$.error.set(message.data.error);
                    localPlayerState$.isLoading.set(false);
                    console.error("Local audio player error:", message.data.error);
                    break;
                    
                case "ended":
                    // Track ended, will automatically play next if available
                    break;
                    
                default:
                    console.log("Unknown local audio player message type:", message.type);
            }
        } catch (error) {
            console.error("Failed to parse LocalAudioPlayer message:", error);
        }
    };

    // Read the HTML file content
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Local Audio Player</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: transparent;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .player-container {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 1000;
        }
        
        .player-info {
            color: white;
            text-align: center;
            padding: 20px;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
    </style>
</head>
<body>
    <audio id="audioElement" preload="auto"></audio>

    <script>
        class LocalAudioPlayer {
            constructor() {
                this.audio = document.getElementById('audioElement');
                this.currentTrack = null;
                this.playlist = [];
                this.currentIndex = -1;
                this.isPlaying = false;
                
                this.setupAudioEvents();
                this.audio.volume = 0.5;
                console.log('Local Audio Player initialized');
            }
            
            setupAudioEvents() {
                this.audio.addEventListener('loadedmetadata', () => {
                    this.postMessage({ 
                        type: 'loadedmetadata', 
                        data: { 
                            duration: this.audio.duration,
                            currentTime: this.audio.currentTime
                        } 
                    });
                });
                
                this.audio.addEventListener('timeupdate', () => {
                    this.postMessage({ 
                        type: 'timeupdate', 
                        data: { 
                            currentTime: this.audio.currentTime,
                            duration: this.audio.duration
                        } 
                    });
                });
                
                this.audio.addEventListener('play', () => {
                    this.isPlaying = true;
                    this.postMessage({ type: 'play', data: {} });
                });
                
                this.audio.addEventListener('pause', () => {
                    this.isPlaying = false;
                    this.postMessage({ type: 'pause', data: {} });
                });
                
                this.audio.addEventListener('ended', () => {
                    this.playNext();
                    this.postMessage({ type: 'ended', data: {} });
                });
                
                this.audio.addEventListener('error', (e) => {
                    console.error('Audio error:', e);
                    this.postMessage({ type: 'error', data: { error: e.message || 'Audio playback error' } });
                });
            }
            
            postMessage(message) {
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify(message));
                } else {
                    console.log('LocalAudioPlayer message:', message);
                }
            }
            
            loadTrack(filePath, title, artist) {
                console.log('Loading track:', filePath, title, artist);
                
                this.currentTrack = { filePath, title, artist };
                const fileUrl = filePath.startsWith('file://') ? filePath : \`file://\${filePath}\`;
                this.audio.src = fileUrl;
                
                this.postMessage({ 
                    type: 'trackLoaded', 
                    data: { 
                        filePath, 
                        title, 
                        artist,
                        currentIndex: this.currentIndex
                    } 
                });
                
                return true;
            }
            
            loadPlaylist(playlist, startIndex = 0) {
                console.log('Loading playlist:', playlist.length, 'tracks, starting at index:', startIndex);
                
                this.playlist = playlist;
                this.currentIndex = startIndex;
                
                if (playlist.length > 0 && startIndex < playlist.length) {
                    const track = playlist[startIndex];
                    this.loadTrack(track.filePath, track.title, track.artist);
                }
                
                this.postMessage({ 
                    type: 'playlistLoaded', 
                    data: { 
                        playlist: playlist.map(t => ({ title: t.title, artist: t.artist })),
                        currentIndex: this.currentIndex
                    } 
                });
            }
            
            play() {
                if (this.audio.src) {
                    this.audio.play().catch(e => {
                        console.error('Play failed:', e);
                        this.postMessage({ type: 'error', data: { error: 'Play failed: ' + e.message } });
                    });
                }
            }
            
            pause() {
                this.audio.pause();
            }
            
            togglePlayPause() {
                if (this.isPlaying) {
                    this.pause();
                } else {
                    this.play();
                }
            }
            
            playPrevious() {
                if (this.playlist.length > 0 && this.currentIndex > 0) {
                    this.currentIndex--;
                    const track = this.playlist[this.currentIndex];
                    this.loadTrack(track.filePath, track.title, track.artist);
                    if (this.isPlaying) {
                        this.play();
                    }
                }
            }
            
            playNext() {
                if (this.playlist.length > 0 && this.currentIndex < this.playlist.length - 1) {
                    this.currentIndex++;
                    const track = this.playlist[this.currentIndex];
                    this.loadTrack(track.filePath, track.title, track.artist);
                    if (this.isPlaying) {
                        this.play();
                    }
                }
            }
            
            playTrackAtIndex(index) {
                if (this.playlist.length > 0 && index >= 0 && index < this.playlist.length) {
                    this.currentIndex = index;
                    const track = this.playlist[this.currentIndex];
                    this.loadTrack(track.filePath, track.title, track.artist);
                    this.play();
                }
            }
            
            setVolume(volume) {
                this.audio.volume = Math.max(0, Math.min(1, volume));
            }
            
            seek(seconds) {
                if (this.audio.duration) {
                    this.audio.currentTime = Math.max(0, Math.min(this.audio.duration, seconds));
                }
            }
            
            getCurrentState() {
                return {
                    isPlaying: this.isPlaying,
                    currentTrack: this.currentTrack,
                    currentTime: this.audio.currentTime || 0,
                    duration: this.audio.duration || 0,
                    volume: this.audio.volume,
                    playlist: this.playlist.map(t => ({ title: t.title, artist: t.artist })),
                    currentIndex: this.currentIndex
                };
            }
        }
        
        const player = new LocalAudioPlayer();
        
        window.localAudioPlayer = {
            loadTrack: (filePath, title, artist) => player.loadTrack(filePath, title, artist),
            loadPlaylist: (playlist, startIndex) => player.loadPlaylist(playlist, startIndex),
            play: () => player.play(),
            pause: () => player.pause(),
            togglePlayPause: () => player.togglePlayPause(),
            playPrevious: () => player.playPrevious(),
            playNext: () => player.playNext(),
            playTrackAtIndex: (index) => player.playTrackAtIndex(index),
            setVolume: (volume) => player.setVolume(volume),
            seek: (seconds) => player.seek(seconds),
            getCurrentState: () => player.getCurrentState()
        };
        
        setTimeout(() => {
            player.postMessage({ type: 'ready', data: {} });
        }, 100);
    </script>
</body>
</html>`;

    return (
        <View className="w-0 h-0 opacity-0 absolute">
            <WebView
                ref={localWebViewRef}
                source={{ html: htmlContent }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                onMessage={handleMessage}
                onError={(error) => {
                    localPlayerState$.error.set(
                        `LocalAudioPlayer WebView error: ${error.nativeEvent.description}`,
                    );
                    localPlayerState$.isLoading.set(false);
                }}
                style={{ width: 0, height: 0, opacity: 0 }}
            />
        </View>
    );
}

// Export player state and controls for use in other components
export { localPlayerState$, localAudioControls };
export type { LocalPlayerState };