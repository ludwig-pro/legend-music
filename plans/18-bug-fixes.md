## Plan
Patch high-priority bugs before release: fix overlay re-enable behavior, prevent playback stalls on load failures, and silence production logging noise while keeping debug hooks.

## Overlay Behavior
- Ensure the now playing overlay appears immediately when re-enabled mid-playback, not only on track change.
- Remove noisy overlay duration clamp logging.

## Playback Resilience
- On track load failures, mark tracks missing/unplayable and auto-skip to the next item so playback never stalls.

## Logging Hygiene
- Wrap persistence/queue/library logging behind debug flags and default them off.
- Remove stray unconditional console logs (app state, panel resize, playlist delete hotkey) to keep release logs clean.

## Steps
- [ ] Fix overlay re-enable logic and remove overlay duration debug log.
- [ ] Auto-skip on track load failures and flag missing tracks to keep playback moving.
- [ ] Gate persistence/queue/library logs behind disabled debug flags and strip remaining stray console logs.
