// tiny TTL cache on top of localStorage.
// keys are namespaced with "weather.cache." to keep them separate from user prefs.

const PREFIX = "weather.cache.";

export function get(key) {
    try {
        const raw = localStorage.getItem(PREFIX + key);
        if (!raw) return null;
        const entry = JSON.parse(raw);
        if (Date.now() > entry.expires) {
            localStorage.removeItem(PREFIX + key);
            return null;
        }
        return entry.value;
    } catch {
        return null;
    }
}

export function set(key, value, ttlMs) {
    try {
        const entry = { value, expires: Date.now() + ttlMs };
        localStorage.setItem(PREFIX + key, JSON.stringify(entry));
    } catch {
        // quota exceeded or storage disabled, ignore
    }
}

export function clear() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
}

// returns cached value, or calls fetchFn and caches the result.
// does not cache null/undefined results (e.g. missing AQI data).
export async function wrap(key, ttlMs, fetchFn) {
    const hit = get(key);
    if (hit !== null) return hit;
    const fresh = await fetchFn();
    if (fresh !== null && fresh !== undefined) set(key, fresh, ttlMs);
    return fresh;
}