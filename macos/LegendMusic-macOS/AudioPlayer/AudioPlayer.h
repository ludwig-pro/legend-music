#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <AVFoundation/AVFoundation.h>

@interface AudioPlayer : RCTEventEmitter <RCTBridgeModule>

@property (nonatomic, strong) AVPlayer *player;
@property (nonatomic, strong) AVPlayerItem *playerItem;
@property (nonatomic, strong) id timeObserver;
@property (nonatomic, assign) BOOL isPlaying;
@property (nonatomic, assign) NSTimeInterval duration;
@property (nonatomic, assign) NSTimeInterval currentTime;
@property (nonatomic, assign) BOOL hasListeners;
@property (nonatomic, copy) RCTPromiseResolveBlock loadResolve;
@property (nonatomic, copy) RCTPromiseRejectBlock loadReject;

@end
