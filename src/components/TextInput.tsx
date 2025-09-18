import type { Observable } from "@legendapp/state";
import { use$ } from "@legendapp/state/react";
import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import { TextInput as TextInputNative } from "react-native";

import { state$ } from "@/systems/State";

export interface TextInputProps extends React.ComponentProps<typeof TextInputNative> {
    value$?: Observable<string>;
    ignoreDropdownState?: boolean;
}

export const TextInput = memo(
    forwardRef<TextInputNative, TextInputProps>(function TextInput(
        { value: valueProp, value$, onChangeText: onChangeTextProp, ignoreDropdownState = false, ...rest },
        ref,
    ) {
        console.log("TextInput.render", { value$, value: valueProp });
        const isDropdownOpen = use$(state$.isDropdownOpen);
        const value = value$ ? value$.peek() : valueProp;
        const innerRef = useRef<TextInputNative>(null);

        useImperativeHandle(ref, () => innerRef.current as TextInputNative, []);

        const onChangeText = useCallback(
            (text: string) => {
                if (value$) {
                    value$.set(text);
                }
                onChangeTextProp?.(text);
            },
            [value$, onChangeTextProp],
        );

        return (
            <TextInputNative
                {...rest}
                ref={innerRef}
                defaultValue={value}
                onChangeText={onChangeText}
                editable={ignoreDropdownState || !isDropdownOpen}
            />
        );
    }),
);
