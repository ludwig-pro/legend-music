# Legend Music

Legend Music is a macOS-first local music player that treats your library like a first-class citizen.
It stays private, keeps playlists synced as you organize files, and remembers your queue between sessions.
The multi-window UI includes a Skia visualizer and floating overlay—all without accounts or uploads.

https://github.com/user-attachments/assets/061cae41-c47a-4977-b095-27d007b9d0e9

## Why you'll love it

- **Local-first and private:** uses your folders, reads ID3 tags, caches artwork, and never uploads your library.
- **High performance, low consumption:** It uses minimal CPU and memory to avoid draining your battery.
- **Always in sync:** native filesystem watcher rescans when Finder changes happen; queue and preferences persist across restarts.
- **Flexible workspace:** multiple windows for library, visualizer, and settings with drag-and-drop queue management.

## Install

- Install the latest version from [Releases](./releases)

## Add and browse your library

- Library folders are watched natively; adding or removing a folder triggers a rescan and artwork caching.
- Browse playlists and search; double-click to play or drag tracks into the queue.

## Play your music

- Drag files or folders from Finder straight into the playlist to enqueue; reorder with drag-and-drop.
- The queue is persisted (`queue.m3u` plus saved index/time), so the session survives restarts.
- Customize playback toolbar and bottom bar shortcuts under **Settings → Customize UI**.

## Windows and shortcuts

| Window/Action | Default hotkey | Notes |
| --- | --- | --- |
| Toggle Media Library | `L` | Opens the tree + track list. |
| Toggle Visualizer | `V` | Skia visualizer with preset picker. |
| Search current list | `J` | Focuses the omnibox/search input. |
| Play/Pause | Media key or `Space` | Space works when the playlist has no text focus. |
| Next/Previous | Media keys | Falls back to queue navigation controls. |
| Toggle Shuffle | `⌥ + S` | Uses `settings$.playback.shuffle`. |
| Cycle Repeat | `⌥ + R` | Off → track → queue. |

## Visuals and overlay

- Skia-driven visualizer window streams FFT frames from the native player.
- A floating current-song overlay can stay on top while you work elsewhere.

## Technical details

- Stack: React Native 0.78 for macOS, `@legendapp/state`, NativeWind/Tailwind (`global.css`, `tailwind.config.js`), design primitives in `src/legend-kit`.
- Native modules: Objective-C++ bridges in `macos/LegendMusic-macOS` (AudioPlayer, WindowManager, DragDropView, FileDialog, FileSystemWatcher, SFSymbol) consumed via `src/native-modules`.
- Persistence: JSON caches and settings under `~/Library/Caches/LegendMusic` plus queue exports as `.m3u`; state is restored on launch.
- Scripts: `bun run start` (Metro), `bun run mac` (macOS app), `bun run test` (Jest), `bun run lint`/`bun run lint:fix` (Biome), `bun run build` (Release build), `bun run package` (codesign + notarize), `bun run publish` (build + package).
- Build notes: run `bun bootstrap` once (installs dependencies and pods), then use `bun run build` for a Release `.app`. Tests live in `__tests__/` or `*.test.ts(x)`.

### Build and launch from source

1. Prereqs: macOS 13+, Xcode 15+ CLI tools, Node 18+, [Bun](https://bun.sh/), Ruby + Bundler + CocoaPods; Watchman recommended.
2. Install dependencies and pods: `bun bootstrap`.
3. Start Metro in one terminal: `bun run start`.
4. Launch the macOS app in another: `bun run mac` (opens `LegendMusic.app`).
5. Open **Settings → Library** and add your music folders.
