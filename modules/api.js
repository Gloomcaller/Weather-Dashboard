// all network calls. nothing here touches the DOM.

import * as cache from "./cache.js";

const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const AIR_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";

const TTL = {
    geo: 24 * 60 * 60 * 1000,   // 24 hours
    forecast: 10 * 60 * 1000,   // 10 minutes
    aqi: 30 * 60 * 1000,        // 30 minutes
};

const CURRENT_FIELDS = [
    "temperature_2m",
    "apparent_temperature",
    "relative_humidity_2m",
    "weather_code",
    "is_day",
    "wind_speed_10m",
    "wind_direction_10m",
    "pressure_msl",
    "cloud_cover",
    "visibility",
].join(",");

const HOURLY_FIELDS = [
    "temperature_2m",
    "weather_code",
    "precipitation_probability",
    "is_day",
].join(",");

const DAILY_FIELDS = [
    "weather_code",
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_probability_max",
    "sunrise",
    "sunset",
    "uv_index_max",
].join(",");

// rounds coords to 3 decimals so nearby points share a cache entry.
function coordKey(lat, lon) {
    return `${lat.toFixed(3)},${lon.toFixed(3)}`;
}

// returns [] if nothing found, throws on network / server error.
export async function searchCity(name) {
    const key = `geo:${name.toLowerCase().trim()}`;
    return cache.wrap(key, TTL.geo, async () => {
        const url = `${GEO_URL}?name=${encodeURIComponent(name)}&count=5&language=en&format=json`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Could not search for that city.");

        const data = await res.json();
        if (!data.results || data.results.length === 0) return [];

        return data.results.map((r) => ({
            name: r.name,
            country: r.country,
            countryCode: r.country_code,
            admin1: r.admin1 || "",
            latitude: r.latitude,
            longitude: r.longitude,
            timezone: r.timezone,
        }));
    });
}

// returns an object with current, hourly, daily, and timezone info.
export async function getForecast(lat, lon) {
    const key = `fc:${coordKey(lat, lon)}`;
    return cache.wrap(key, TTL.forecast, async () => {
        const params = new URLSearchParams({
            latitude: lat,
            longitude: lon,
            current: CURRENT_FIELDS,
            hourly: HOURLY_FIELDS,
            daily: DAILY_FIELDS,
            timezone: "auto",
            forecast_days: 7,
        });

        const res = await fetch(`${FORECAST_URL}?${params}`);
        if (!res.ok) throw new Error("Could not fetch weather data.");

        const data = await res.json();
        if (data.error) throw new Error(data.reason || "Weather service error.");

        return {
            current: data.current,
            hourly: data.hourly,
            daily: data.daily,
            units: {
                temp: data.current_units.temperature_2m,
                wind: data.current_units.wind_speed_10m,
                pressure: data.current_units.pressure_msl,
                visibility: data.current_units.visibility,
            },
            utcOffsetSeconds: data.utc_offset_seconds,
            timezone: data.timezone,
        };
    });
}

// air quality is a separate endpoint and not available everywhere.
// returns null if the region has no data or the request fails.
export async function getAirQuality(lat, lon) {
    const key = `aqi:${coordKey(lat, lon)}`;
    return cache.wrap(key, TTL.aqi, async () => {
        const params = new URLSearchParams({
            latitude: lat,
            longitude: lon,
            current: "pm2_5,us_aqi,european_aqi",
        });

        try {
            const res = await fetch(`${AIR_URL}?${params}`);
            if (!res.ok) return null;
            const data = await res.json();
            if (data.error) return null;

            return {
                pm25: data.current?.pm2_5 ?? null,
                usAqi: data.current?.us_aqi ?? null,
                euAqi: data.current?.european_aqi ?? null,
            };
        } catch {
            return null;
        }
    });
}

// reverse geocoding. returns a city-like object, or a fallback on failure.
// uses BigDataCloud, a free keyless service.
export async function reverseGeocode(lat, lon) {
    const key = `rev:${coordKey(lat, lon)}`;
    return cache.wrap(key, TTL.geo, async () => {
        const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
        const fallback = { name: "My Location", admin1: "", country: "" };

        try {
            const res = await fetch(url);
            if (!res.ok) return fallback;
            const data = await res.json();

            const name = data.city || data.locality || data.principalSubdivision || "My Location";
            return {
                name,
                admin1: data.principalSubdivision || "",
                country: data.countryName || "",
            };
        } catch {
            return fallback;
        }
    });
}