export type QueueAction = "enqueue" | "play-next";

interface QueueActionEventLike {
    shiftKey?: boolean;
    nativeEvent?: {
        shiftKey?: boolean;
    };
}

interface GetQueueActionOptions {
    event?: QueueActionEventLike | null;
    shiftPressedFallback?: boolean;
}

export function getQueueAction(options: GetQueueActionOptions = {}): QueueAction {
    const { event, shiftPressedFallback = false } = options;

    if (event) {
        if (typeof event.shiftKey === "boolean" && event.shiftKey) {
            return "play-next";
        }

        const nativeEvent = (event as { nativeEvent?: QueueActionEventLike["nativeEvent"] }).nativeEvent;
        if (nativeEvent && typeof nativeEvent.shiftKey === "boolean" && nativeEvent.shiftKey) {
            return "play-next";
        }
    }

    return shiftPressedFallback ? "play-next" : "enqueue";
}
