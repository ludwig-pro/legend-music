import { NativeEventEmitter, NativeModules } from "react-native";

const { AppExit } = NativeModules;

type AppExitEvents = {
    onAppExit: () => void;
};

const appExitEmitter = new NativeEventEmitter(AppExit);

const appExitApi = {
    addListener: <T extends keyof AppExitEvents>(eventType: T, listener: AppExitEvents[T]) => {
        const subscription = appExitEmitter.addListener(eventType, listener);
        return {
            remove: () => subscription.remove(),
        };
    },
    completeExit: (allow = true) => {
        if (AppExit?.completeExit) {
            AppExit.completeExit(allow);
        }
    },
};

export type { AppExitEvents };
export default appExitApi;
