import { NativeEventEmitter, NativeModules } from "react-native";

const { WindowManager } = NativeModules;

if (!WindowManager) {
    throw new Error("WindowManager native module is not available");
}

export type WindowOptions = {
    identifier?: string;
    moduleName?: string;
    title?: string;
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    initialProperties?: Record<string, unknown>;
};

export type WindowFrame = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type WindowClosedEvent = {
    identifier: string;
};

type WindowManagerType = {
    openWindow: (options?: WindowOptions) => Promise<{ success: boolean }>;
    closeWindow: (identifier?: string) => Promise<{ success: boolean; message?: string }>;
    getMainWindowFrame: () => Promise<WindowFrame>;
    setMainWindowFrame: (frame: WindowFrame) => Promise<{ success: boolean }>;
};

const windowManagerEmitter = new NativeEventEmitter(WindowManager);

export const useWindowManager = (): WindowManagerType & {
    onWindowClosed: (callback: (event: WindowClosedEvent) => void) => { remove: () => void };
} => {
    return {
        openWindow: (options = {}) => WindowManager.openWindow(options),
        closeWindow: (identifier?: string) => WindowManager.closeWindow(identifier),
        getMainWindowFrame: () => WindowManager.getMainWindowFrame(),
        setMainWindowFrame: (frame: WindowFrame) => WindowManager.setMainWindowFrame(frame),
        onWindowClosed: (callback: (event: WindowClosedEvent) => void) => {
            const subscription = windowManagerEmitter.addListener("onWindowClosed", callback);
            return {
                remove: () => subscription.remove(),
            };
        },
    };
};

export default WindowManager as WindowManagerType;
