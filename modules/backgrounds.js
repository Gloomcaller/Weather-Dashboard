// swaps the two background layers with a crossfade.
// only 8 background images exist: clear, clouds, drizzle, rain, snow, fog, thunder, default.

const BASE_PATH = "media/backgrounds";

const CATEGORIES = new Set([
    "clear", "clouds", "drizzle", "rain", "snow", "fog", "thunder",
]);

let frontLayer = null;
let backLayer = null;

export function initBackgrounds() {
    frontLayer = document.getElementById("bgA");
    backLayer = document.getElementById("bgB");
}

export function setBackground(category, isDay) {
    if (!frontLayer || !backLayer) return;

    const file = CATEGORIES.has(category) ? category : "default";
    const folder = isDay ? "day" : "night";
    const path = `${BASE_PATH}/${folder}/${file}.png`;

    // already showing this image? bail.
    if (frontLayer.dataset.path === path) return;

    // wait until the image is loaded before swapping, to avoid a blank frame.
    const img = new Image();
    img.onload = () => {
        backLayer.style.backgroundImage = `url("${path}")`;
        backLayer.dataset.path = path;

        // next frame so the browser has painted the new background first
        requestAnimationFrame(() => {
            frontLayer.classList.add("bg-hidden");
            backLayer.classList.remove("bg-hidden");

            const tmp = frontLayer;
            frontLayer = backLayer;
            backLayer = tmp;
        });
    };
    img.src = path;
}