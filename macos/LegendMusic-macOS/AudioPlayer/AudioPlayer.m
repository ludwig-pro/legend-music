#import "AudioPlayer.h"
#import <React/RCTLog.h>

@implementation AudioPlayer

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
    return YES;
}

- (NSArray<NSString *> *)supportedEvents
{
    return @[@"onLoadSuccess", @"onLoadError", @"onPlaybackStateChanged", @"onProgress", @"onCompletion"];
}

- (instancetype)init
{
    self = [super init];
    if (self) {
        [self setupPlayer];
        _isPlaying = NO;
        _duration = 0;
        _currentTime = 0;
    }
    return self;
}

- (void)setupPlayer
{
    self.player = [[AVPlayer alloc] init];

    // Configure player for spatial audio - macOS handles this automatically
    if (@available(macOS 12.0, *)) {
        // Enable spatial audio processing
        self.player.audiovisualBackgroundPlaybackPolicy = AVPlayerAudiovisualBackgroundPlaybackPolicyAutomatic;
    }

    // Set up player observers
    [self setupPlayerObservers];

    RCTLogInfo(@"Audio player configured - spatial audio handled automatically by macOS");
}

- (void)setupPlayerObservers
{
    // Add observer for player item status changes
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(playerItemDidReachEnd:)
                                                 name:AVPlayerItemDidPlayToEndTimeNotification
                                               object:nil];

    // Add observer for player item failed to play
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(playerItemFailedToPlay:)
                                                 name:AVPlayerItemFailedToPlayToEndTimeNotification
                                               object:nil];
}

- (void)startObserving
{
    self.hasListeners = YES;

    // Resume progress updates if playback is active and we do not yet observe time
    if (self.isPlaying && self.player && !self.timeObserver) {
        [self addTimeObserver];
    }
}

- (void)stopObserving
{
    self.hasListeners = NO;

    // Clean up progress timer when no more listeners
    [self removeTimeObserver];
}

- (void)dealloc
{
    [self removeTimeObserver];
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

#pragma mark - Player Observers

- (void)playerItemDidReachEnd:(NSNotification *)notification
{
    dispatch_async(dispatch_get_main_queue(), ^{
        self.isPlaying = NO;
        [self removeTimeObserver];
        [self sendEventWithName:@"onPlaybackStateChanged" body:@{@"isPlaying": @NO}];
        [self sendEventWithName:@"onCompletion" body:@{}];
    });
}

- (void)playerItemFailedToPlay:(NSNotification *)notification
{
    dispatch_async(dispatch_get_main_queue(), ^{
        self.isPlaying = NO;
        [self removeTimeObserver];
        [self sendEventWithName:@"onPlaybackStateChanged" body:@{@"isPlaying": @NO}];
        [self sendEventWithName:@"onLoadError" body:@{@"error": @"Playback failed"}];
    });
}

#pragma mark - Exported Methods

RCT_EXPORT_METHOD(loadTrack:(NSString *)filePath
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_main_queue(), ^{
        @try {
            // Stop current playback
            if (self.player.rate > 0) {
                [self.player pause];
                self.isPlaying = NO;
            }

            // Create URL from file path
            NSURL *fileURL;
            if ([filePath hasPrefix:@"file://"]) {
                fileURL = [NSURL URLWithString:filePath];
            } else {
                fileURL = [NSURL fileURLWithPath:filePath];
            }

            if (!fileURL) {
                reject(@"INVALID_URL", @"Invalid file path", nil);
                return;
            }

            // Check if file exists
            if (![[NSFileManager defaultManager] fileExistsAtPath:[fileURL path]]) {
                reject(@"FILE_NOT_FOUND", @"Audio file not found", nil);
                return;
            }

            // Create player item
            self.playerItem = [AVPlayerItem playerItemWithURL:fileURL];
            if (!self.playerItem) {
                reject(@"FILE_LOAD_ERROR", @"Failed to create player item", nil);
                return;
            }

            // Replace current item
            [self.player replaceCurrentItemWithPlayerItem:self.playerItem];

            // Wait for the item to be ready
            [self.playerItem addObserver:self forKeyPath:@"status" options:NSKeyValueObservingOptionNew context:nil];
            [self.playerItem addObserver:self forKeyPath:@"duration" options:NSKeyValueObservingOptionNew context:nil];

            // Store resolve/reject for later use
            self.loadResolve = resolve;
            self.loadReject = reject;

        } @catch (NSException *exception) {
            RCTLogError(@"Exception in loadTrack: %@", exception.reason);
            reject(@"EXCEPTION", exception.reason, nil);
        }
    });
}

RCT_EXPORT_METHOD(getTrackInfo:(NSString *)filePath
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
        @autoreleasepool {
            NSURL *fileURL;
            if ([filePath hasPrefix:@"file://"]) {
                fileURL = [NSURL URLWithString:filePath];
            } else {
                fileURL = [NSURL fileURLWithPath:filePath];
            }

            if (!fileURL) {
                reject(@"INVALID_URL", @"Invalid file path", nil);
                return;
            }

            if (![[NSFileManager defaultManager] fileExistsAtPath:fileURL.path]) {
                reject(@"FILE_NOT_FOUND", @"Audio file not found", nil);
                return;
            }

            NSError *error = nil;
            AVAudioFile *audioFile = [[AVAudioFile alloc] initForReading:fileURL error:&error];
            if (error || audioFile == nil) {
                reject(@"FILE_READ_ERROR", error.localizedDescription ?: @"Failed to read audio file", error);
                return;
            }

            double sampleRate = audioFile.processingFormat.sampleRate;
            double durationSeconds = 0;
            if (sampleRate > 0) {
                durationSeconds = (double)audioFile.length / sampleRate;
            }

            resolve(@{
                @"durationSeconds": @(durationSeconds),
                @"sampleRate": @(sampleRate),
                @"frameCount": @(audioFile.length)
            });
        }
    });
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary<NSKeyValueChangeKey,id> *)change context:(void *)context
{
    if ([keyPath isEqualToString:@"status"]) {
        AVPlayerItem *item = (AVPlayerItem *)object;
        if (item.status == AVPlayerItemStatusReadyToPlay) {
            // Get duration
            CMTime duration = item.duration;
            if (CMTIME_IS_VALID(duration)) {
                self.duration = CMTimeGetSeconds(duration);
            }
            self.currentTime = 0;

            // Remove observers
            [item removeObserver:self forKeyPath:@"status"];
            [item removeObserver:self forKeyPath:@"duration"];

            // Send success event
            [self sendEventWithName:@"onLoadSuccess" body:@{@"duration": @(self.duration)}];
            if (self.loadResolve) {
                self.loadResolve(@{@"success": @YES});
                self.loadResolve = nil;
                self.loadReject = nil;
            }
        } else if (item.status == AVPlayerItemStatusFailed) {
            NSError *error = item.error;
            RCTLogError(@"Error loading audio file: %@", error.localizedDescription);

            // Remove observers
            [item removeObserver:self forKeyPath:@"status"];
            [item removeObserver:self forKeyPath:@"duration"];

            [self sendEventWithName:@"onLoadError" body:@{@"error": error.localizedDescription ?: @"Unknown error"}];
            if (self.loadReject) {
                self.loadReject(@"FILE_LOAD_ERROR", error.localizedDescription ?: @"Unknown error", error);
                self.loadResolve = nil;
                self.loadReject = nil;
            }
        }
    } else if ([keyPath isEqualToString:@"duration"]) {
        AVPlayerItem *item = (AVPlayerItem *)object;
        CMTime duration = item.duration;
        if (CMTIME_IS_VALID(duration)) {
            self.duration = CMTimeGetSeconds(duration);
        }
    }
}

RCT_EXPORT_METHOD(play:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_main_queue(), ^{
        if (!self.playerItem) {
            reject(@"NO_FILE", @"No audio file loaded", nil);
            return;
        }

        if (self.player.rate > 0) {
            resolve(@{@"success": @YES});
            return;
        }

        [self.player play];
        self.isPlaying = YES;

        if (self.hasListeners) {
            [self addTimeObserver];
        }
        [self sendEventWithName:@"onPlaybackStateChanged" body:@{@"isPlaying": @YES}];
        resolve(@{@"success": @YES});
    });
}

RCT_EXPORT_METHOD(pause:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_main_queue(), ^{
        if (!self.player) {
            reject(@"NO_PLAYER", @"No audio player available", nil);
            return;
        }

        [self.player pause];
        self.isPlaying = NO;
        [self removeTimeObserver];
        [self sendEventWithName:@"onPlaybackStateChanged" body:@{@"isPlaying": @NO}];
        resolve(@{@"success": @YES});
    });
}

RCT_EXPORT_METHOD(stop:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_main_queue(), ^{
        if (!self.player) {
            reject(@"NO_PLAYER", @"No audio player available", nil);
            return;
        }

        [self.player pause];
        [self.player seekToTime:kCMTimeZero];
        self.isPlaying = NO;
        self.currentTime = 0;
        [self removeTimeObserver];
        [self sendEventWithName:@"onPlaybackStateChanged" body:@{@"isPlaying": @NO}];
        resolve(@{@"success": @YES});
    });
}

RCT_EXPORT_METHOD(seek:(double)seconds
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_main_queue(), ^{
        if (!self.player || !self.playerItem) {
            reject(@"NO_PLAYER", @"No audio player available", nil);
            return;
        }

        // Clamp seek time to valid range
        double clampedTime = MAX(0, MIN(seconds, self.duration));
        CMTime seekTime = CMTimeMakeWithSeconds(clampedTime, NSEC_PER_SEC);

        [self.player seekToTime:seekTime completionHandler:^(BOOL finished) {
            if (finished) {
                self.currentTime = clampedTime;
                resolve(@{@"success": @YES});
            } else {
                reject(@"SEEK_FAILED", @"Seek operation failed", nil);
            }
        }];
    });
}

RCT_EXPORT_METHOD(setVolume:(double)volume
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_main_queue(), ^{
        if (!self.player) {
            reject(@"NO_PLAYER", @"No audio player available", nil);
            return;
        }

        float clampedVolume = MAX(0.0f, MIN(1.0f, (float)volume));
        self.player.volume = clampedVolume;
        resolve(@{@"success": @YES});
    });
}

RCT_EXPORT_METHOD(getCurrentState:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_main_queue(), ^{
        CMTime currentTime = self.player.currentTime;
        if (CMTIME_IS_VALID(currentTime)) {
            self.currentTime = CMTimeGetSeconds(currentTime);
        }

        resolve(@{
            @"isPlaying": @(self.isPlaying),
            @"currentTime": @(self.currentTime),
            @"duration": @(self.duration),
            @"volume": @(self.player ? self.player.volume : 0.5f)
        });
    });
}

#pragma mark - Time Observer

- (void)addTimeObserver
{
    [self removeTimeObserver];

    __weak typeof(self) weakSelf = self;
    // Throttle updates: emit every 2s on a background queue to minimize CPU impact
    dispatch_queue_t backgroundQueue = dispatch_get_global_queue(QOS_CLASS_BACKGROUND, 0);
    CMTime interval = CMTimeMakeWithSeconds(2.0, NSEC_PER_SEC);
    self.timeObserver = [self.player addPeriodicTimeObserverForInterval:interval
                                                                   queue:backgroundQueue
                                                              usingBlock:^(CMTime time) {
        __strong typeof(weakSelf) strongSelf = weakSelf;
        if (strongSelf && strongSelf.hasListeners && strongSelf.isPlaying && CMTIME_IS_VALID(time)) {
            NSTimeInterval newTime = CMTimeGetSeconds(time);

            // Only send updates if time has changed significantly (avoid redundant events)
            if (fabs(newTime - strongSelf.currentTime) >= 1.0) {
                strongSelf.currentTime = newTime;

                // Dispatch event sending back to main queue
                dispatch_async(dispatch_get_main_queue(), ^{
                    [strongSelf sendEventWithName:@"onProgress" body:@{
                        @"currentTime": @(strongSelf.currentTime),
                        @"duration": @(strongSelf.duration)
                    }];
                });
            }
        }
    }];
}

- (void)removeTimeObserver
{
    if (self.timeObserver) {
        [self.player removeTimeObserver:self.timeObserver];
        self.timeObserver = nil;
    }
}

@end
