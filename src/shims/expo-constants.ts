import { Platform } from "react-native";

export const AppOwnership = {
    Expo: "expo",
} as const;

export const ExecutionEnvironment = {
    Bare: "bare",
    Standalone: "standalone",
    StoreClient: "storeClient",
} as const;

export const UserInterfaceIdiom = {
    Handset: "handset",
    Tablet: "tablet",
    Desktop: "desktop",
    TV: "tv",
    Unsupported: "unsupported",
} as const;

const constants = {
    appOwnership: null,
    debugMode: __DEV__ ?? false,
    deviceName: Platform.OS,
    deviceYearClass: null,
    executionEnvironment: ExecutionEnvironment.Bare,
    experienceUrl: null,
    expoRuntimeVersion: null,
    expoVersion: null,
    isDetached: false,
    intentUri: null,
    isHeadless: false,
    manifest: null,
    manifest2: null,
    expoConfig: null,
    expoGoConfig: null,
    easConfig: null,
    sessionId: "local",
    statusBarHeight: 0,
    systemFonts: [],
    platform: {
        ios: { userInterfaceIdiom: UserInterfaceIdiom.Desktop },
        android: { userInterfaceIdiom: UserInterfaceIdiom.Handset },
        web: { userInterfaceIdiom: UserInterfaceIdiom.Desktop },
    },
    linkingUri: "",
    nativeAppVersion: null,
    nativeBuildVersion: null,
    supportsTablet: true,
    __unsafeNoWarnManifest: null,
    __unsafeNoWarnManifest2: null,
};

export default constants;
