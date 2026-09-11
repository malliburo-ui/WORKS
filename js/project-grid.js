const SLOTS = 14;
const VIDEO_EXT = /\.(mp4|webm|mov)(\?|$)/i;

function mediaEl(src) {
  if (VIDEO_EXT.test(src)) {
    const video = document.createElement("video");
    video.src = src;
    video.muted = true;
    video.defaultMuted = true;
    video.autoplay = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("muted", "");
    video.preload = "auto";
    video.width = 900;
    video.height = 900;
    video.setAttribute("aria-hidden", "true");
    const play = () => video.play().catch(() => {});
    video.addEventListener("canplay", play);
    video.addEventListener("loadeddata", play);
    return video;
  }

  const img = document.createElement("img");
  img.src = src;
  img.width = 900;
  img.height = 900;
  img.alt = "";
  return img;
}

function tileCount(images) {
  if (images.length <= 1) return Math.max(SLOTS, images.length);
  return images.length;
}

function renderFilm(images) {
  const film = document.querySelector(".film");
  film.replaceChildren();

  const count = tileCount(images);
  for (let i = 0; i < count; i += 1) {
    const tile = document.createElement("a");
    tile.href = `/#${encodeURIComponent(name)}`;
    tile.className = images[i] ? "tile" : "tile tile--gray";
    tile.setAttribute("aria-label", "All Cases");

    if (images[i]) {
      const media = mediaEl(images[i]);
      tile.appendChild(media);
      if (media.play) media.play().catch(() => {});
    }

    film.appendChild(tile);
  }
}

async function loadImages() {
  const response = await fetch("media.json", { cache: "no-store" });
  if (!response.ok) {
    return [];
  }
  const data = await response.json();
  return Array.isArray(data.images) ? data.images : [];
}

let lastKey = null;

async function refresh() {
  const images = await loadImages();
  const key = images.join("|");
  if (key === lastKey) return;
  lastKey = key;
  renderFilm(images);
}

const name = decodeURIComponent(location.pathname.replaceAll("/", ""));
if (name) {
  document.title = `${name} — WORKS`;
}

refresh();
setInterval(refresh, 1500);
