import { PortalProvider } from "@gorhom/portal";
import type { Observable } from "@legendapp/state";
import { useObservable, useValue } from "@legendapp/state/react";
import { View } from "react-native";
import { EffectView } from "@/components/EffectView";
import { Sidebar } from "@/components/Sidebar";
import { TooltipProvider } from "@/components/TooltipProvider";
import { SplitView } from "@/native-modules/SplitView";
import { AccountSettings } from "@/settings/AccountSettings";
import { CustomizeUISettings } from "@/settings/CustomizeUISettings";
import { GeneralSettings } from "@/settings/GeneralSettings";
import { LibrarySettings } from "@/settings/LibrarySettings";
import { OpenSourceSettings } from "@/settings/OpenSourceSettings";
import { OverlaySettings } from "@/settings/OverlaySettings";
import { SUPPORT_ACCOUNTS } from "@/systems/constants";
import { state$ } from "@/systems/State";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { ax } from "@/utils/ax";

export type SettingsPage = "general" | "library" | "overlay" | "ui-customize" | "account" | "open-source";

// Define the categories for settings
const SETTING_PAGES: { id: SettingsPage; name: string }[] = ax([
    { id: "general", name: "General" },
    { id: "library", name: "Library" },
    { id: "overlay", name: "Overlay" },
    { id: "ui-customize", name: "Customize UI" },
    SUPPORT_ACCOUNTS && { id: "account", name: "Account" },
    { id: "open-source", name: "Open Source" },
]);

function Content({ selectedItem$ }: { selectedItem$: Observable<SettingsPage> }) {
    const selectedItem = useValue(selectedItem$);

    switch (selectedItem) {
        case "general":
            return <GeneralSettings />;
        case "library":
            return <LibrarySettings />;
        case "overlay":
            return <OverlaySettings />;
        case "ui-customize":
            return <CustomizeUISettings />;
        case "open-source":
            return <OpenSourceSettings />;
        case "account":
            return <AccountSettings />;
        default:
            return null;
    }
}

export default function SettingsContainer() {
    const showSettingsPage = useValue(state$.showSettingsPage);
    const selectedItem$ = useObservable<SettingsPage>(showSettingsPage || "general");

    return (
        <EffectView style={{ flex: 1 }}>
            <ThemeProvider>
                <PortalProvider>
                    <TooltipProvider>
                        <SplitView className="flex-1" isVertical>
                            <View className="flex-1">
                                <Sidebar items={SETTING_PAGES} selectedItem$={selectedItem$} className="py-2" />
                            </View>
                            <View className="flex-1 bg-background-primary">
                                <Content selectedItem$={selectedItem$} />
                            </View>
                        </SplitView>
                    </TooltipProvider>
                </PortalProvider>
            </ThemeProvider>
        </EffectView>
    );
}
