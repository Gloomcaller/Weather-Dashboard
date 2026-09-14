// Unit conversions and formatting helpers.

export function cToF(celsius) {
    return celsius * 9 / 5 + 32;
}

export function kmhToMph(kmh) {
    return kmh * 0.621371;
}

// returns just the number as a string. The degree symbol lives in the HTML.
export function formatTemp(celsius, unit) {
    const v = unit === "f" ? cToF(celsius) : celsius;
    return String(Math.round(v));
}

export function formatWind(kmh, unit) {
    if (unit === "f") return `${Math.round(kmhToMph(kmh))} mph`;
    return `${Math.round(kmh)} km/h`;
}

export function formatVisibility(meters, unit) {
    if (unit === "f") {
        const mi = meters / 1609.34;
        return mi >= 10 ? `${Math.round(mi)} mi` : `${mi.toFixed(1)} mi`;
    }
    const km = meters / 1000;
    return km >= 10 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`;
}

// 8-point compass. Meteorological convention: degrees = where wind comes FROM.
export function windDirection(deg) {
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return dirs[Math.round(deg / 45) % 8];
}