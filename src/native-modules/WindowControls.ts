import { NativeModules } from "react-native";

const { WindowControls } = NativeModules;

if (!WindowControls) {
    throw new Error("WindowControls native module is not available");
}

type WindowControlsType = {
    hideWindowControls: () => Promise<void>;
    showWindowControls: () => Promise<void>;
    isWindowFullScreen: () => Promise<boolean>;
};

export default WindowControls as WindowControlsType;
