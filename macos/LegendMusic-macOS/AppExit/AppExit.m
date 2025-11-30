#import "AppExit.h"
#import "AppDelegate.h"

@implementation AppExit {
  BOOL hasListeners;
}

RCT_EXPORT_MODULE();

- (instancetype)init {
  self = [super init];
  if (self) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleAppExit:)
                                                 name:kLegendAppExitRequestedNotification
                                               object:nil];
  }
  return self;
}

- (void)dealloc {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (NSArray<NSString *> *)supportedEvents {
  return @[ @"onAppExit" ];
}

- (void)startObserving {
  hasListeners = YES;
}

- (void)stopObserving {
  hasListeners = NO;
}

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

- (void)handleAppExit:(__unused NSNotification *)notification {
  if (!hasListeners) {
    return;
  }

  [self sendEventWithName:@"onAppExit" body:@{}];
}

RCT_EXPORT_METHOD(completeExit:(BOOL)allow) {
  dispatch_async(dispatch_get_main_queue(), ^{
    id delegate = [NSApp delegate];
    if (delegate && [delegate respondsToSelector:@selector(completeAppExit:)]) {
      [(AppDelegate *)delegate completeAppExit:allow];
    } else {
      [NSApp replyToApplicationShouldTerminate:allow ? NSTerminateNow : NSTerminateCancel];
    }
  });
}

@end
