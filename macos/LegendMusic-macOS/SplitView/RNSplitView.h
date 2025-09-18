#import <React/RCTViewManager.h>
#import <AppKit/AppKit.h>

@interface RNSplitView : NSSplitView

@property (nonatomic, assign) BOOL isVertical;
@property (nonatomic, assign) CGFloat dividerThickness;
@property (nonatomic, copy) RCTBubblingEventBlock onSplitViewDidResize;

@end

@interface RNSplitViewManager : RCTViewManager

@end