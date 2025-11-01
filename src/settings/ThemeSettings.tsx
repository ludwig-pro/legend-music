import { observer } from "@legendapp/state/react";
import { Text } from "react-native";
import { Button } from "@/components/Button";
import { ColorPicker } from "@/components/ColorPicker";
import { SettingsPage, SettingsSection } from "@/settings/components";
import { themeState$, useTheme } from "@/theme/ThemeProvider";

type ThemeType = "light" | "dark";

export const ThemeSettings = observer(() => {
    const { currentTheme, resetTheme } = useTheme();
    const colors$ = themeState$.customColors[currentTheme as ThemeType];

    return (
        <SettingsPage
            title="Theme Settings"
            scroll
            actions={
                <Button onClick={resetTheme} variant="secondary" className="px-3 py-1.5 h-auto">
                    <Text className="text-sm text-text-primary">Reset</Text>
                </Button>
            }
            contentClassName="p-4"
        >
            <SettingsSection title="Background Colors" card={false} contentClassName="gap-3">
                <ColorPicker label="Primary" $color={colors$.background.primary} />
                <ColorPicker label="Secondary" $color={colors$.background.secondary} />
                <ColorPicker label="Tertiary" $color={colors$.background.tertiary} />
            </SettingsSection>

            <SettingsSection title="Text Colors" card={false} className="mt-6" contentClassName="gap-3">
                <ColorPicker label="Primary" $color={colors$.text.primary} />
                <ColorPicker label="Secondary" $color={colors$.text.secondary} />
                <ColorPicker label="Tertiary" $color={colors$.text.tertiary} />
            </SettingsSection>

            <SettingsSection title="Accent Colors" card={false} className="mt-6" contentClassName="gap-3">
                <ColorPicker label="Primary" $color={colors$.accent.primary} />
                <ColorPicker label="Secondary" $color={colors$.accent.secondary} />
            </SettingsSection>

            <SettingsSection title="Border Colors" card={false} className="mt-6" contentClassName="gap-3">
                <ColorPicker label="Border" $color={colors$.border.primary} />
                <ColorPicker label="Popup Border" $color={colors$.border.popup} />
            </SettingsSection>
        </SettingsPage>
    );
});
