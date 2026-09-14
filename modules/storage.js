// localStorage helpers. Keys are prefixed with "weather." to avoid collisions.

const KEYS = {
    unit: "weather.unit",
    lastCity: "weather.lastCity",
    recents: "weather.recents",
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

// recents is an array of city objects, most recent first
export function getRecents() {
    return read(KEYS.recents, []);
}

export function addRecent(city) {
    const list = getRecents().filter(
        (c) => !(c.name === city.name && c.country === city.country)
    );
    list.unshift(city);
    write(KEYS.recents, list.slice(0, MAX_RECENTS));
}

export function clearRecents() {
    write(KEYS.recents, []);
}