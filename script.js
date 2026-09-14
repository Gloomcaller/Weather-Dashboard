import * as api from "./modules/api.js";
import * as storage from "./modules/storage.js";
import * as ui from "./modules/ui.js";
import * as bg from "./modules/backgrounds.js";
import { describeWmo } from "./modules/wmo.js";

const state = {
    city: null,
    forecast: null,
    aqi: null,
    unit: "c",
};

const form = document.querySelector(".search-form");
const input = document.getElementById("cityInput");
const geoBtn = document.getElementById("geoBtn");
const refreshBtn = document.getElementById("refreshBtn");
const unitToggle = document.getElementById("unitToggle");

// events

form.addEventListener("submit", onSearch);
geoBtn.addEventListener("click", onGeolocate);
refreshBtn.addEventListener("click", onRefresh);
unitToggle.addEventListener("click", onUnitToggle);

// close dropdown when clicking outside the search area
document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-wrap")) ui.hideDropdown();
});

// handlers

async function onSearch(e) {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    ui.showSpinner();
    try {
        const results = await api.searchCity(query);
        if (results.length === 0) {
            ui.hideSpinner();
            ui.renderError("City not found.");
            return;
        }
        if (results.length === 1) {
            await loadWeather(results[0]);
            return;
        }
        ui.hideSpinner();
        ui.showDropdown(results, loadWeather);
    } catch (err) {
        ui.hideSpinner();
        ui.renderError(err.message || "Search failed.");
    }
}

async function onGeolocate() {
    if (!navigator.geolocation) {
        ui.renderError("Geolocation is not supported by this browser.");
        return;
    }
    ui.showSpinner();
    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const { latitude, longitude } = pos.coords;
            const place = await api.reverseGeocode(latitude, longitude);
            const city = {
                name: place.name,
                admin1: place.admin1,
                country: place.country,
                latitude,
                longitude,
            };
            loadWeather(city);
        },
        () => {
            ui.hideSpinner();
            ui.renderError("Could not access your location.");
        }
    );
}

function onRefresh() {
    if (state.city) loadWeather(state.city);
}

function onUnitToggle(e) {
    const btn = e.target.closest("button[data-unit]");
    if (!btn) return;
    const unit = btn.dataset.unit;
    if (unit === state.unit) return;

    state.unit = unit;
    storage.setUnit(unit);
    ui.setUnitToggle(unit);

    // no need to refetch, just re-render
    if (state.forecast) renderAll();
}

// main flow

async function loadWeather(city) {
    ui.showSpinner();
    try {
        const [forecast, aqi] = await Promise.all([
            api.getForecast(city.latitude, city.longitude),
            api.getAirQuality(city.latitude, city.longitude),
        ]);

        state.city = city;
        state.forecast = forecast;
        state.aqi = aqi;

        storage.setLastCity(city);
        if (city.name !== "My Location") storage.addRecent(city);

        renderAll();
    } catch (err) {
        ui.renderError(err.message || "Could not load weather data.");
    } finally {
        ui.hideSpinner();
    }
}

function renderAll() {
    const { city, forecast, aqi, unit } = state;
    const current = forecast.current;
    const isDay = current.is_day === 1;

    ui.renderCurrent(city, current, unit);
    ui.renderDetails(current, unit, forecast.daily);
    ui.renderSun(forecast.daily);
    ui.renderAqi(aqi);
    ui.renderHourly(forecast.hourly, forecast.utcOffsetSeconds, unit);
    ui.renderDaily(forecast.daily, unit);
    ui.updateClock(forecast.utcOffsetSeconds);
    ui.setNightMode(!isDay);

    const info = describeWmo(current.weather_code, isDay);
    bg.setBackground(info.category, isDay);
}

// boot

function boot() {
    ui.init();
    bg.initBackgrounds();

    state.unit = storage.getUnit();
    ui.setUnitToggle(state.unit);

    const last = storage.getLastCity();
    if (last) loadWeather(last);
}

boot();