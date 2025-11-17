export function generateId() {
    // Fall back to a timestamp-based identifier if crypto.randomUUID is unavailable
    if (typeof crypto?.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
