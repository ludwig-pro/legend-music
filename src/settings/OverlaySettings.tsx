import { observer, use$ } from "@legendapp/state/react";
import { useEffect, useState } from "react";
import { TextInput, View } from "react-native";

import { Checkbox } from "@/components/Checkbox";
import { Select } from "@/components/Select";
import { SettingsPage, SettingsRow, SettingsSection } from "@/settings/components";
import {
    OVERLAY_MAX_DISPLAY_DURATION_SECONDS,
    OVERLAY_MIN_DISPLAY_DURATION_SECONDS,
    settings$,
} from "@/systems/Settings";

const verticalOptions = [
    { value: "top", label: "Top" },
    { value: "middle", label: "Middle" },
    { value: "bottom", label: "Bottom" },
];

const horizontalOptions = [
    { value: "left", label: "Left" },
    { value: "center", label: "Center" },
    { value: "right", label: "Right" },
];

export const OverlaySettings = observer(function OverlaySettings() {
    const durationSeconds = use$(settings$.overlay.displayDurationSeconds);
    const overlayEnabled = use$(settings$.overlay.enabled);
    const [durationDraft, setDurationDraft] = useState(String(durationSeconds));

    useEffect(() => {
        setDurationDraft(String(durationSeconds));
    }, [durationSeconds]);

    const handleDurationChange = (text: string) => {
        const sanitized = text.replace(/[^0-9]/g, "");
        setDurationDraft(sanitized);

        const parsed = Number.parseInt(sanitized, 10);
        if (!Number.isNaN(parsed)) {
            const clamped = Math.max(
                OVERLAY_MIN_DISPLAY_DURATION_SECONDS,
                Math.min(parsed, OVERLAY_MAX_DISPLAY_DURATION_SECONDS),
            );
            settings$.overlay.displayDurationSeconds.set(clamped);
        }
    };

    const handleDurationBlur = () => {
        const parsed = Number.parseInt(durationDraft, 10);
        const clamped = Number.isNaN(parsed)
            ? durationSeconds
            : Math.max(OVERLAY_MIN_DISPLAY_DURATION_SECONDS, Math.min(parsed, OVERLAY_MAX_DISPLAY_DURATION_SECONDS));
        settings$.overlay.displayDurationSeconds.set(clamped);
        setDurationDraft(String(clamped));
    };

    return (
        <SettingsPage title="Overlay Settings">
            <SettingsSection title="Overlay Options">
                <SettingsRow
                    title="Enable overlay"
                    description="Show the current song overlay when a new track begins."
                    control={<Checkbox $checked={settings$.overlay.enabled} />}
                />

                <SettingsRow
                    title="Display duration"
                    description={`Number of seconds the overlay remains visible (between ${OVERLAY_MIN_DISPLAY_DURATION_SECONDS} and ${OVERLAY_MAX_DISPLAY_DURATION_SECONDS}).`}
                    control={
                        <TextInput
                            value={durationDraft}
                            onChangeText={handleDurationChange}
                            onBlur={handleDurationBlur}
                            keyboardType="numeric"
                            className="bg-background-tertiary text-text-primary border border-border-primary rounded-md px-3 py-1.5 w-20 text-center"
                            accessibilityLabel="Overlay display duration"
                        />
                    }
                    controlWrapperClassName="ml-6"
                />

                <SettingsRow
                    title="Position"
                    description="Choose where the overlay appears on screen."
                    control={
                        <View className="flex-row gap-3">
                            <View className="w-32">
                                <Select
                                    options={verticalOptions}
                                    value$={settings$.overlay.position.vertical}
                                    disabled={!overlayEnabled}
                                    triggerClassName="px-2"
                                />
                            </View>
                            <View className="w-32">
                                <Select
                                    options={horizontalOptions}
                                    value$={settings$.overlay.position.horizontal}
                                    disabled={!overlayEnabled}
                                    triggerClassName="px-2"
                                />
                            </View>
                        </View>
                    }
                    controlWrapperClassName="ml-6"
                />
            </SettingsSection>
        </SettingsPage>
    );
});
