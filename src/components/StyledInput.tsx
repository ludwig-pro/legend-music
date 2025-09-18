import type { Observable } from "@legendapp/state";
import { forwardRef, memo } from "react";
import { StyleSheet, type TextInput as TextInputNative, type TextInputProps, View } from "react-native";

import { TextInput } from "@/components/TextInput";
import { cn } from "@/utils/cn";

export interface StyledInputProps extends TextInputProps {
    value$: Observable<string>;
    ignoreDropdownState?: boolean;
}

export const StyledInput = memo(
    forwardRef<TextInputNative, StyledInputProps>(function StyledInput(
        { value$, className, style, ignoreDropdownState, ...rest },
        ref,
    ) {
        console.log("StyledInput.render", { value: value$.peek() });
        return (
            <View
                className={cn("bg-background-secondary border border-border-primary rounded-md px-3 py-1.5", className)}
                style={style}
            >
                <TextInput
                    ref={ref}
                    value$={value$}
                    ignoreDropdownState={ignoreDropdownState}
                    className="text-sm text-text-primary"
                    // style={styles.input}
                    {...rest}
                />
            </View>
        );
    }),
);

const styles = StyleSheet.create({
    input: {
        paddingVertical: 0,
    },
});
