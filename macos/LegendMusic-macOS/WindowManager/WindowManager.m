#import "WindowManager.h"
#import <React/RCTRootView.h>
#import <React/RCTBridge.h>
#import <AppKit/AppKit.h>

@interface WindowManager() <NSWindowDelegate>
@property (nonatomic, strong) NSMutableDictionary<NSString *, NSWindow *> *windows;
@property (nonatomic, strong) NSMutableDictionary<NSString *, RCTRootView *> *rootViews;
@end

@implementation WindowManager

RCT_EXPORT_MODULE();

- (instancetype)init {
  self = [super init];
  if (self) {
    _windows = [NSMutableDictionary new];
    _rootViews = [NSMutableDictionary new];
  }
  return self;
}

- (NSArray<NSString *> *)supportedEvents {
  return @[@"onWindowClosed", @"onMainWindowMoved", @"onMainWindowResized"];
}

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

RCT_EXPORT_METHOD(openWindow:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  NSString *identifier = options[@"identifier"];
  if (![identifier isKindOfClass:[NSString class]] || identifier.length == 0) {
    identifier = @"default";
  }

  NSString *title = options[@"title"] ?: @"New Window";
  NSString *moduleName = options[@"moduleName"] ?: @"SettingsWindow";
  CGFloat width = options[@"width"] ? [options[@"width"] floatValue] : 400;
  CGFloat height = options[@"height"] ? [options[@"height"] floatValue] : 300;
  NSNumber *originX = options[@"x"];
  NSNumber *originY = options[@"y"];

  NSWindow *existingWindow = self.windows[identifier];
  if (existingWindow) {
    NSRect frame = [existingWindow frame];
    CGFloat newWidth = frame.size.width;
    CGFloat newHeight = frame.size.height;

    if (options[@"width"]) {
      newWidth = width;
    }

    if (options[@"height"]) {
      newHeight = height;
    }

    NSPoint origin = frame.origin;
    if (originX) {
      origin.x = [originX doubleValue];
    }

    if (originY) {
      origin.y = [originY doubleValue];
    }

    NSRect newFrame = NSMakeRect(origin.x, origin.y, newWidth, newHeight);
    [existingWindow setFrame:newFrame display:YES animate:NO];
    [existingWindow makeKeyAndOrderFront:nil];
    resolve(@{@"success": @YES});
    return;
  }

  NSRect frame = NSMakeRect(0, 0, width, height);
  NSUInteger styleMask = NSWindowStyleMaskTitled |
                        NSWindowStyleMaskClosable |
                        NSWindowStyleMaskResizable |
                        NSWindowStyleMaskMiniaturizable;

  NSWindow *window = [[NSWindow alloc] initWithContentRect:frame
                                               styleMask:styleMask
                                                 backing:NSBackingStoreBuffered
                                                   defer:NO];

  [window setReleasedWhenClosed:NO];
  [window setTitle:title];

  if (originX || originY) {
    NSRect currentFrame = [window frame];
    NSPoint origin = currentFrame.origin;
    if (originX) {
      origin.x = [originX doubleValue];
    }
    if (originY) {
      origin.y = [originY doubleValue];
    }
    [window setFrameOrigin:origin];
  } else {
    [window center];
  }

  RCTBridge *bridge = self.bridge;
  if (!bridge) {
    reject(@"no_bridge", @"RCTBridge not available", nil);
    return;
  }

  NSDictionary *initialProps = nil;
  id initialPropsCandidate = options[@"initialProperties"];
  if ([initialPropsCandidate isKindOfClass:[NSDictionary class]]) {
    initialProps = initialPropsCandidate;
  }

  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                   moduleName:moduleName
                                            initialProperties:initialProps];

  [window setContentView:rootView];
  [window setDelegate:self];

  self.windows[identifier] = window;
  self.rootViews[identifier] = rootView;

  [window makeKeyAndOrderFront:nil];

  resolve(@{@"success": @YES});
}

RCT_EXPORT_METHOD(closeWindow:(NSString *)identifier
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  NSString *targetIdentifier = identifier;
  if (![targetIdentifier isKindOfClass:[NSString class]] || targetIdentifier.length == 0) {
    targetIdentifier = @"default";
  }

  NSWindow *window = self.windows[targetIdentifier];
  if (!window) {
    resolve(@{@"success": @NO, @"message": @"No window to close"});
    return;
  }

  [window orderOut:nil];
  [self handleWindowClosedForIdentifier:targetIdentifier];

  resolve(@{@"success": @YES});
}

// Window delegate method to detect when window is closed by the system close button
- (void)windowWillClose:(NSNotification *)notification {
  NSWindow *closingWindow = notification.object;
  NSString *identifier = [self identifierForWindow:closingWindow];
  if (!identifier) {
    return;
  }

  [self handleWindowClosedForIdentifier:identifier];
}

// Explicitly tell the system not to terminate the app when this window closes
- (BOOL)windowShouldClose:(NSWindow *)window {
  NSString *identifier = [self identifierForWindow:window];
  if (identifier) {
    return YES; // Allow window to close
  }
  return NO; // Don't close other windows
}

#pragma mark - Main Window Management

+ (NSWindow *)getMainWindow {
  // Get the main window from the app delegate
  NSApplication *app = [NSApplication sharedApplication];
  NSArray *windows = [app windows];
  
  for (NSWindow *window in windows) {
    // The main window is typically the first window that's not a panel or sheet
    if ([window isKindOfClass:[NSWindow class]] && ![window isSheet] && ![window isKindOfClass:[NSPanel class]]) {
      return window;
    }
  }
  
  // Fallback to the key window if no main window found
  return [app keyWindow];
}

RCT_EXPORT_METHOD(getMainWindowFrame:(RCTPromiseResolveBlock)resolve
                   rejecter:(RCTPromiseRejectBlock)reject) {
  NSWindow *mainWindow = [WindowManager getMainWindow];
  if (!mainWindow) {
    reject(@"no_main_window", @"Main window not found", nil);
    return;
  }
  
  NSRect frame = [mainWindow frame];
  NSDictionary *frameDict = @{
    @"x": @(frame.origin.x),
    @"y": @(frame.origin.y),
    @"width": @(frame.size.width),
    @"height": @(frame.size.height)
  };
  
  resolve(frameDict);
}

RCT_EXPORT_METHOD(setMainWindowFrame:(NSDictionary *)frameDict
                   resolver:(RCTPromiseResolveBlock)resolve
                   rejecter:(RCTPromiseRejectBlock)reject) {
  NSWindow *mainWindow = [WindowManager getMainWindow];
  if (!mainWindow) {
    reject(@"no_main_window", @"Main window not found", nil);
    return;
  }
  
  CGFloat x = [frameDict[@"x"] doubleValue];
  CGFloat y = [frameDict[@"y"] doubleValue];
  CGFloat width = [frameDict[@"width"] doubleValue];
  CGFloat height = [frameDict[@"height"] doubleValue];
  
  NSRect newFrame = NSMakeRect(x, y, width, height);
  [mainWindow setFrame:newFrame display:YES animate:NO];
  
  resolve(@{@"success": @YES});
}

- (void)setupMainWindowObservers {
  NSWindow *mainWindow = [WindowManager getMainWindow];
  if (!mainWindow) {
    return;
  }
  
  // Set up notification observers for window events
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(mainWindowDidMove:)
                                               name:NSWindowDidMoveNotification
                                             object:mainWindow];
  
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(mainWindowDidResize:)
                                               name:NSWindowDidResizeNotification
                                             object:mainWindow];
}

- (void)mainWindowDidMove:(NSNotification *)notification {
  NSWindow *window = notification.object;
  NSRect frame = [window frame];
  
  NSDictionary *frameDict = @{
    @"x": @(frame.origin.x),
    @"y": @(frame.origin.y),
    @"width": @(frame.size.width),
    @"height": @(frame.size.height)
  };
  
  // No need to manually save - setFrameAutosaveName handles persistence
  
  [self sendEventWithName:@"onMainWindowMoved" body:frameDict];
}

- (void)mainWindowDidResize:(NSNotification *)notification {
  NSWindow *window = notification.object;
  NSRect frame = [window frame];
  
  NSDictionary *frameDict = @{
    @"x": @(frame.origin.x),
    @"y": @(frame.origin.y),
    @"width": @(frame.size.width),
    @"height": @(frame.size.height)
  };
  
  // No need to manually save - setFrameAutosaveName handles persistence
  
  [self sendEventWithName:@"onMainWindowResized" body:frameDict];
}


#pragma mark - Helpers

- (nullable NSString *)identifierForWindow:(NSWindow *)window {
  __block NSString *foundIdentifier = nil;
  [self.windows enumerateKeysAndObjectsUsingBlock:^(NSString * _Nonnull key, NSWindow * _Nonnull obj, BOOL * _Nonnull stop) {
    if (obj == window) {
      foundIdentifier = key;
      *stop = YES;
    }
  }];

  return foundIdentifier;
}

- (void)handleWindowClosedForIdentifier:(NSString *)identifier {
  [self.windows removeObjectForKey:identifier];
  [self.rootViews removeObjectForKey:identifier];

  [self sendEventWithName:@"onWindowClosed" body:@{ @"identifier": identifier ?: @"" }];
}


- (void)dealloc {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

@end
