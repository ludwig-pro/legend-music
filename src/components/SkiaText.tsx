import type { Observable } from "@legendapp/state";
import { useObservable, useObserveEffect, useValue } from "@legendapp/state/react";
import { Canvas, matchFont, type SkFont, Text as SkiaTextNode } from "@shopify/react-native-skia";
import { useMemo } from "react";
import { Platform, type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { useSharedValue } from "react-native-reanimated";

export type SkiaTextProps = {
    text$: Observable<string>;
    color?: string;
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: "normal" | "bold";
    align?: "left" | "center" | "right";
    width?: number;
    height?: number;
    className?: string;
    style?: StyleProp<ViewStyle>;
};

const DEFAULT_FONT_FAMILY = Platform.select({
    ios: "SF Pro Display",
    macos: "SF Pro Display",
    default: "Helvetica",
});
const DEFAULT_FONT_SIZE = 12;
const DEFAULT_COLOR = "#FFFFFF";

function createFont(fontFamily: string | undefined, fontSize: number, fontWeight: "normal" | "bold"): SkFont {
    const resolvedFamily = fontFamily ?? DEFAULT_FONT_FAMILY ?? "Helvetica";
    return matchFont({
        fontFamily: resolvedFamily,
        fontSize,
        fontStyle: "normal",
        fontWeight,
    });
}

export function SkiaText({
    text$,
    color = DEFAULT_COLOR,
    fontFamily,
    fontSize = DEFAULT_FONT_SIZE,
    fontWeight = "normal",
    align = "left",
    width,
    height,
    className,
    style,
}: SkiaTextProps) {
    const textShared = useSharedValue("");
    const textWidth$ = useObservable({ width: 0, length: 0 });
    const { width: textWidth } = useValue(textWidth$);

    useObserveEffect(text$, ({ value, previous }) => {
        const next = value ?? "";
        textShared.set(next);
        if (next?.length !== previous?.length) {
            textWidth$.set({ length: next.length, width: font.measureText(next).width });
        }
    });

    const font = useMemo(() => createFont(fontFamily, fontSize, fontWeight), [fontFamily, fontSize, fontWeight]);
    const metrics = useMemo(() => font.getMetrics(), [font]);
    const canvasHeight = height ?? Math.ceil(metrics.descent - metrics.ascent);
    const baseWidth = width ?? Math.ceil(fontSize * 3);
    const canvasWidth = Math.max(baseWidth, Math.ceil(textWidth));

    const x = useMemo(() => {
        if (align === "right") {
            return canvasWidth - textWidth;
        }
        if (align === "center") {
            return (canvasWidth - textWidth) / 2;
        }
        return 0;
    }, [align, canvasWidth, textWidth]);

    return (
        <View className={className} style={[styles.container, { width: canvasWidth, height: canvasHeight }, style]}>
            <Canvas style={StyleSheet.absoluteFill}>
                <SkiaTextNode
                    // Type narrowing expects exact `{ value: string }` – Reanimated shared values satisfy that at runtime.
                    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                    text={textShared as unknown as { value: string }}
                    x={x}
                    y={fontSize}
                    color={color}
                    font={font}
                />
            </Canvas>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        overflow: "hidden",
    },
});
