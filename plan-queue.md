# Queue Enhancement Plan

## Core Queue Infrastructure
- Introduce `queue$` observable in `src/components/LocalAudioPlayer.tsx` to hold ordered tracks and queue metadata.
- Provide queue helper APIs: `queueReplace(tracks, startIndex?)`, `queueAppend(track|tracks, { playImmediately? })`, `queueInsertNext(track|tracks)`, and `queueClear()`.
- Keep `localPlayerState$` in sync with queue mutations, auto-play the first item on non-empty queue transitions, and clear player state when the queue empties.

## Playback Control Refactor
- Update `localAudioControls.loadPlaylist` to delegate to `queueReplace` and ensure consistent track loading.
- Rework navigation helpers (`playNext`, `playPrevious`, `playTrackAtIndex`) to operate on `queue$`, guarding index bounds and handling empty queue gracefully.
- Ensure playback commands reset errors, handle loading state, and trigger autoplay when appropriate.

## UI Integration
- Render `queue$` in `src/components/Playlist.tsx` as the visible “Queue”, preserving current-track highlighting via `localPlayerState$.currentIndex` and showing empty/scan messaging when needed.
- Add optional UX touches such as queue length badges or a clear-queue button to reinforce the new behavior.

## Entry Point Wiring
- `src/components/PlaylistSelector.tsx`: selecting a playlist calls `queueReplace`; selecting a track from search defaults to `queueAppend` and offers a "Play Next" action via `queueInsertNext`, auto-playing if the queue was idle.
- `src/components/MediaLibrary.tsx`: update track interactions to default to enqueue, and surface contextual actions for "Play Next" (via `queueInsertNext`) and potential "Play Now" (queue replace). Playlist-level selections should replace the queue.

## Persistence, Testing, and Follow-Up
- Decide whether to persist queue contents/current index with `stateSaved$` for session restore.
- Document new interactions and ensure settings or help text reflect queue behavior changes.
- Outline unit/smoke tests covering queue helper logic and basic enqueue/play-next flows, and run `bun run test` before shipping.
