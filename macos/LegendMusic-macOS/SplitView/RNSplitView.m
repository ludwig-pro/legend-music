#import "RNSplitView.h"
#import <React/RCTView.h>
#import <React/RCTLog.h>

@interface RNSplitView () <NSSplitViewDelegate>

@end

@implementation RNSplitView {
    CGFloat _dividerThickness;
}

- (instancetype)init
{
    self = [super init];
    if (self) {
        self.delegate = self;
        self.dividerStyle = NSSplitViewDividerStyleThin;
        self.isVertical = YES;
        self.dividerThickness = 1.0;

        // Default to vertical split view
        self.vertical = YES;
    }
    return self;
}

- (void)setIsVertical:(BOOL)isVertical
{
    _isVertical = isVertical;
    self.vertical = isVertical;
}

- (void)setDividerThickness:(CGFloat)dividerThickness
{
    _dividerThickness = dividerThickness;
    [self setNeedsDisplay:YES];
}

- (CGFloat)dividerThickness
{
    return _dividerThickness;
}

// MARK: - NSSplitViewDelegate

- (void)splitViewDidResizeSubviews:(NSNotification *)notification
{
    if (self.onSplitViewDidResize) {
        NSArray<NSView *> *subviews = self.subviews;
        NSMutableArray *sizes = [NSMutableArray array];

        for (NSView *subview in subviews) {
            if (self.isVertical) {
                [sizes addObject:@(subview.frame.size.width)];
            } else {
                [sizes addObject:@(subview.frame.size.height)];
            }
        }

        self.onSplitViewDidResize(@{
            @"sizes": sizes,
            @"isVertical": @(self.isVertical)
        });
    }
}

- (BOOL)splitView:(NSSplitView *)splitView canCollapseSubview:(NSView *)subview
{
    return NO; // Prevent collapsing subviews
}

- (CGFloat)splitView:(NSSplitView *)splitView constrainMinCoordinate:(CGFloat)proposedMinimumPosition ofSubviewAt:(NSInteger)dividerIndex
{
    // Set minimum width/height for the first pane (LibraryTree)
    return 200.0;
}

- (CGFloat)splitView:(NSSplitView *)splitView constrainMaxCoordinate:(CGFloat)proposedMaximumPosition ofSubviewAt:(NSInteger)dividerIndex
{
    // Set maximum width/height for the first pane (LibraryTree)
    CGFloat totalSize = self.isVertical ? self.frame.size.width : self.frame.size.height;
    return totalSize - 300.0; // Leave at least 300pt for the second pane
}

- (void)splitView:(NSSplitView *)splitView resizeSubviewsWithOldSize:(NSSize)oldSize
{
    // Custom resize behavior to maintain proportions
    [splitView adjustSubviews];
}

@end

@implementation RNSplitViewManager

RCT_EXPORT_MODULE(RNSplitView)

- (NSView *)view
{
    return [[RNSplitView alloc] init];
}

RCT_EXPORT_VIEW_PROPERTY(isVertical, BOOL)
RCT_EXPORT_VIEW_PROPERTY(dividerThickness, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(onSplitViewDidResize, RCTBubblingEventBlock)

@end