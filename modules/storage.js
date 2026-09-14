// localStorage helpers. Keys are prefixed with "weather." to avoid collisions.

const KEYS = {
    unit: "weather.unit",
    lastCity: "weather.lastCity"
};

const MAX_RECENTS = 5;

function read(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
    } catch {
        return fallback;
    }
}

function write(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // storage full or blocked, ignore
    }
}

// unit is "c" or "f"
export function getUnit() {
    return read(KEYS.unit, "c");
}

export function setUnit(unit) {
    write(KEYS.unit, unit);
}

// lastCity is { name, country, admin1, latitude, longitude } or null
export function getLastCity() {
    return read(KEYS.lastCity, null);
}

export function setLastCity(city) {
    write(KEYS.lastCity, city);
}