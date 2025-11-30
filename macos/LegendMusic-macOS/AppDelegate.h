#import <RCTAppDelegate.h>
#import <Cocoa/Cocoa.h>

extern NSString *const kLegendAppExitRequestedNotification;

@interface AppDelegate : RCTAppDelegate <NSWindowDelegate>

- (void)completeAppExit:(BOOL)allow;

@end
