import type React from "react";
import { Platform, requireNativeComponent, type StyleProp, StyleSheet, type ViewStyle } from "react-native";

export interface SplitViewResizeEvent {
    sizes: number[];
    isVertical: boolean;
}

interface NativeSplitViewProps {
    isVertical?: boolean;
    dividerThickness?: number;
    onSplitViewDidResize?: (event: { nativeEvent: SplitViewResizeEvent }) => void;
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
}

interface SplitViewProps {
    isVertical?: boolean;
    dividerThickness?: number;
    onSplitViewDidResize?: (event: SplitViewResizeEvent) => void;
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
}

const RNSplitView = requireNativeComponent<NativeSplitViewProps>("RNSplitView");

export function SplitView({
    isVertical = true,
    dividerThickness = 1,
    onSplitViewDidResize,
    style,
    children,
    ...props
}: SplitViewProps) {
    // For macOS, use the native component
    if (Platform.OS === "macos" && RNSplitView) {
        const handleResize = onSplitViewDidResize
            ? (event: { nativeEvent: SplitViewResizeEvent }) => {
                  onSplitViewDidResize(event.nativeEvent);
              }
            : undefined;

        return (
            <RNSplitView
                isVertical={isVertical}
                dividerThickness={dividerThickness}
                onSplitViewDidResize={handleResize}
                style={[styles.container, style]}
                {...props}
            >
                {children}
            </RNSplitView>
        );
    }

    // Fallback for other platforms (shouldn't be needed for this macOS app)
    return null;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
