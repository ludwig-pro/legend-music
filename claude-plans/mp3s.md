## Instructions

- Follow all of the steps in order, one by one
- Check them off in this file as they are completed
- Do a git commit with a brief description of the change for each step before moving to the next step, including this file
- Remember that this is a React Native MacOS app, so iOS only APIs will not work.
- Use Legend State for state
- Use Reanimated for animations

## Steps

[x] When adding playlists from ytm, add an "order" along with them so they can be sorted correctly.
[x] When YoutubeMusicPlayer receives the "playerState" message it should update the observable received by getPlaylistContent
[x] ObservablePersistExpoFS needs a format "m3u" which just reads and writes plain text files with an extension "m3u"
[x] Save the current playlist to stateSaved$ from State.ts

## Plan for later (do not do these yet)

[] Handle media keys
[] Make an expanded playlist view