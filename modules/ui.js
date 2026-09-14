// all DOM rendering. nothing here does fetches or state.

import { describeWmo } from "./wmo.js";
import { formatTemp, formatWind, formatVisibility, windDirection } from "./units.js";

const els = {};
let clockInterval = null;

export function init() {
    els.cityName = document.getElementById("cityName");
    els.placeSub = document.getElementById("placeSub");
    els.localTime = document.getElementById("localTime");
    els.currentIcon = document.getElementById("currentIcon");
    els.tempValue = document.getElementById("tempValue");
    els.tempUnit = document.getElementById("tempUnit");
    els.feelsLike = document.getElementById("feelsLike");
    els.weatherDesc = document.getElementById("weatherDesc");
    els.updatedAt = document.getElementById("updatedAt");

    els.dHumidity = document.getElementById("dHumidity");
    els.dWind = document.getElementById("dWind");
    els.windArrow = document.getElementById("windArrow");
    els.dPressure = document.getElementById("dPressure");
    els.dVisibility = document.getElementById("dVisibility");
    els.dCloud = document.getElementById("dCloud");
    els.dUV = document.getElementById("dUV");

    els.sunrise = document.getElementById("sunrise");
    els.sunset = document.getElementById("sunset");

    els.aqiValue = document.getElementById("aqiValue");
    els.aqiLabel = document.getElementById("aqiLabel");
    els.aqiPm25 = document.getElementById("aqiPm25");
    els.aqiUs = document.getElementById("aqiUs");
    els.aqiEu = document.getElementById("aqiEu");

    els.hourlyStrip = document.getElementById("hourlyStrip");
    els.dailyStrip = document.getElementById("dailyStrip");

    els.spinner = document.getElementById("spinner");
    els.cityDropdown = document.getElementById("cityDropdown");
}

// current

export function renderCurrent(city, current, unit) {
    els.cityName.textContent = city.name;
    els.placeSub.textContent = placeLabel(city);

    const info = describeWmo(current.weather_code, current.is_day === 1);
    els.currentIcon.src = info.filename;
    els.currentIcon.alt = info.label;

    els.tempValue.textContent = formatTemp(current.temperature_2m, unit);
    els.tempUnit.textContent = unit === "f" ? "°F" : "°C";
    els.feelsLike.textContent = `${formatTemp(current.apparent_temperature, unit)}°`;
    els.weatherDesc.textContent = info.label;

    els.updatedAt.textContent = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}

// details

export function renderDetails(current, unit, daily) {
    els.dHumidity.textContent = `${current.relative_humidity_2m}%`;

    els.dWind.textContent = `${formatWind(current.wind_speed_10m, unit)} ${windDirection(current.wind_direction_10m)}`;
    // arrow points where the wind is going, so add 180 to the "from" direction.
    els.windArrow.style.transform = `rotate(${current.wind_direction_10m + 180}deg)`;

    els.dPressure.textContent = `${Math.round(current.pressure_msl)} hPa`;
    els.dVisibility.textContent = formatVisibility(current.visibility, unit);
    els.dCloud.textContent = `${current.cloud_cover}%`;

    const uv = daily?.uv_index_max?.[0];
    els.dUV.textContent = uv == null ? "—" : `${uv.toFixed(1)} (${uvRisk(uv)})`;
}

// sun

export function renderSun(daily) {
    els.sunrise.textContent = shortTime(daily.sunrise?.[0]);
    els.sunset.textContent = shortTime(daily.sunset?.[0]);
}

// air quality

export function renderAqi(aqi) {
    if (!aqi || aqi.usAqi == null) {
        els.aqiValue.textContent = "—";
        els.aqiLabel.textContent = "No data available";
        els.aqiLabel.removeAttribute("data-level");
        els.aqiPm25.textContent = "—";
        els.aqiUs.textContent = "—";
        els.aqiEu.textContent = "—";
        return;
    }

    const lvl = aqiLevel(aqi.usAqi);
    els.aqiValue.textContent = Math.round(aqi.usAqi);
    els.aqiLabel.textContent = lvl.label;
    els.aqiLabel.dataset.level = lvl.level;

    els.aqiPm25.textContent = aqi.pm25 == null ? "—" : `${aqi.pm25.toFixed(1)} µg/m³`;
    els.aqiUs.textContent = Math.round(aqi.usAqi);
    els.aqiEu.textContent = aqi.euAqi == null ? "—" : Math.round(aqi.euAqi);
}

// hourly

export function renderHourly(hourly, offsetSeconds, unit) {
    els.hourlyStrip.innerHTML = "";

    const startIdx = findCurrentHour(hourly.time, offsetSeconds);
    const endIdx = Math.min(startIdx + 24, hourly.time.length);

    for (let i = startIdx; i < endIdx; i++) {
        const cell = document.createElement("div");
        cell.className = "hour-cell" + (i === startIdx ? " now" : "");

        const time = document.createElement("span");
        time.className = "hour-time";
        time.textContent = i === startIdx ? "Now" : hourly.time[i].slice(11, 16);

        const info = describeWmo(hourly.weather_code[i], hourly.is_day[i] === 1);
        const icon = document.createElement("img");
        icon.src = info.filename;
        icon.alt = info.label;

        const temp = document.createElement("span");
        temp.className = "hour-temp";
        temp.textContent = `${formatTemp(hourly.temperature_2m[i], unit)}°`;

        cell.append(time, icon, temp);

        const pop = hourly.precipitation_probability[i];
        if (pop != null && pop > 0) {
            const p = document.createElement("span");
            p.className = "hour-pop";
            p.textContent = `${pop}%`;
            cell.appendChild(p);
        }

        els.hourlyStrip.appendChild(cell);
    }
}

// daily

export function renderDaily(daily, unit) {
    els.dailyStrip.innerHTML = "";
    const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 0; i < daily.time.length; i++) {
        const cell = document.createElement("div");
        cell.className = "day-cell";

        const name = document.createElement("span");
        name.className = "day-name";
        if (i === 0) {
            name.textContent = "Today";
        } else {
            const d = new Date(daily.time[i] + "T00:00:00");
            name.textContent = names[d.getDay()];
        }

        const info = describeWmo(daily.weather_code[i], true);
        const icon = document.createElement("img");
        icon.src = info.filename;
        icon.alt = info.label;

        const temps = document.createElement("div");
        temps.className = "day-temps";
        const max = document.createElement("span");
        max.className = "max";
        max.textContent = `${formatTemp(daily.temperature_2m_max[i], unit)}°`;
        const min = document.createElement("span");
        min.className = "min";
        min.textContent = `${formatTemp(daily.temperature_2m_min[i], unit)}°`;
        temps.append(max, min);

        cell.append(name, icon, temps);

        const pop = daily.precipitation_probability_max[i];
        if (pop != null && pop > 0) {
            const p = document.createElement("span");
            p.className = "day-pop";
            p.textContent = `${pop}%`;
            cell.appendChild(p);
        }

        els.dailyStrip.appendChild(cell);
    }
}

// error

export function renderError(message) {
    els.cityName.textContent = "—";
    els.placeSub.textContent = message;
    els.tempValue.textContent = "—";
    els.feelsLike.textContent = "—";
    els.weatherDesc.textContent = "—";
    els.updatedAt.textContent = "—";
    els.currentIcon.src = "media/site/icons/cloudy.png";
}

// dropdown

export function showDropdown(results, onPick) {
    els.cityDropdown.innerHTML = "";
    results.forEach((r) => {
        const li = document.createElement("li");

        const name = document.createElement("span");
        name.className = "city-name";
        name.textContent = r.name;

        const sub = document.createElement("span");
        sub.className = "city-sub";
        sub.textContent = placeLabel(r);

        li.append(name, sub);
        li.addEventListener("click", () => {
            hideDropdown();
            onPick(r);
        });

        els.cityDropdown.appendChild(li);
    });
    els.cityDropdown.hidden = false;
}

export function hideDropdown() {
    els.cityDropdown.hidden = true;
    els.cityDropdown.innerHTML = "";
}

// spinner

export function showSpinner() {
    els.spinner.hidden = false;
}

export function hideSpinner() {
    els.spinner.hidden = true;
}

// theme + clock

export function setNightMode(isNight) {
    document.body.classList.toggle("is-night", isNight);
}

export function setUnitToggle(unit) {
    document.querySelectorAll("#unitToggle button").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.unit === unit);
    });
}

export function updateClock(offsetSeconds) {
    if (clockInterval) clearInterval(clockInterval);

    const tick = () => {
        const d = new Date(Date.now() + offsetSeconds * 1000);
        els.localTime.textContent = d.toISOString().slice(11, 16);
    };
    tick();
    clockInterval = setInterval(tick, 30000);
}

// helpers

function placeLabel(city) {
    if (city.name === "My Location") return "Current position";
    const parts = [city.admin1, city.country].filter(Boolean);
    return parts.join(", ");
}

function shortTime(iso) {
    return iso ? iso.slice(11, 16) : "—";
}

function uvRisk(uv) {
    if (uv < 3) return "Low";
    if (uv < 6) return "Moderate";
    if (uv < 8) return "High";
    if (uv < 11) return "Very high";
    return "Extreme";
}

function aqiLevel(usAqi) {
    if (usAqi <= 50) return { label: "Good", level: "good" };
    if (usAqi <= 100) return { label: "Moderate", level: "moderate" };
    if (usAqi <= 150) return { label: "Unhealthy (groups)", level: "unhealthy-s" };
    if (usAqi <= 200) return { label: "Unhealthy", level: "unhealthy" };
    if (usAqi <= 300) return { label: "Very unhealthy", level: "very" };
    return { label: "Hazardous", level: "hazardous" };
}

// find the hourly index matching the current wall-clock hour at the city.
// Open-Meteo returns local ISO strings like "2026-09-14T14:00" (no Z).
function findCurrentHour(times, offsetSeconds) {
    const cityNow = new Date(Date.now() + offsetSeconds * 1000)
        .toISOString()
        .slice(0, 13); // "YYYY-MM-DDTHH"

    for (let i = 0; i < times.length; i++) {
        if (times[i].slice(0, 13) >= cityNow) return i;
    }
    return 0;
}