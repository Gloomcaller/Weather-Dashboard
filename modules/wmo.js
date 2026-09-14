// WMO weather code → { label, icon, category }.
// icon is the filename base, without -day/-night suffix or extension.
// category matches the background filename (see backgrounds.js).

const TABLE = {
    0: { label: "Clear sky", icon: "clear", category: "clear" },
    1: { label: "Mainly clear", icon: "partly", category: "clouds" },
    2: { label: "Partly cloudy", icon: "partly", category: "clouds" },
    3: { label: "Overcast", icon: "overcast", category: "clouds" },
    45: { label: "Fog", icon: "fog", category: "fog" },
    48: { label: "Rime fog", icon: "fog", category: "fog" },
    51: { label: "Light drizzle", icon: "drizzle", category: "drizzle" },
    53: { label: "Drizzle", icon: "drizzle", category: "drizzle" },
    55: { label: "Dense drizzle", icon: "drizzle", category: "drizzle" },
    56: { label: "Freezing drizzle", icon: "sleet", category: "drizzle" },
    57: { label: "Freezing drizzle", icon: "sleet", category: "drizzle" },
    61: { label: "Light rain", icon: "rain", category: "rain" },
    63: { label: "Rain", icon: "rain", category: "rain" },
    65: { label: "Heavy rain", icon: "heavy-rain", category: "rain" },
    66: { label: "Freezing rain", icon: "sleet", category: "rain" },
    67: { label: "Freezing rain", icon: "sleet", category: "rain" },
    71: { label: "Light snow", icon: "snow", category: "snow" },
    73: { label: "Snow", icon: "snow", category: "snow" },
    75: { label: "Heavy snow", icon: "snow", category: "snow" },
    77: { label: "Snow grains", icon: "snow", category: "snow" },
    80: { label: "Light showers", icon: "rain", category: "rain" },
    81: { label: "Showers", icon: "rain", category: "rain" },
    82: { label: "Violent showers", icon: "heavy-rain", category: "rain" },
    85: { label: "Snow showers", icon: "snow", category: "snow" },
    86: { label: "Heavy snow showers", icon: "snow", category: "snow" },
    95: { label: "Thunderstorm", icon: "thunder", category: "thunder" },
    96: { label: "Thunderstorm with hail", icon: "hail", category: "thunder" },
    99: { label: "Thunderstorm with hail", icon: "hail", category: "thunder" },
};

// returns { label, icon, category, filename }
// filename is the full icon name including -day/-night where applicable.
export function describeWmo(code, isDay) {
    const entry = TABLE[code] || {
        label: "Unknown",
        icon: "cloudy",
        category: "clouds",
    };

    const icon = addDayNight(entry.icon, isDay);

    return {
        label: entry.label,
        icon,
        category: entry.category,
        filename: `media/site/icons/${icon}.png`,
    };
}

// only clear and partly have day/night variants. everything else is the same.
function addDayNight(icon, isDay) {
    const suffix = isDay ? "day" : "night";
    if (icon === "clear") return `clear-${suffix}`;
    if (icon === "partly") return `partly-${suffix}`;
    return icon;
}