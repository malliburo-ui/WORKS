history.scrollRestoration = "manual";

function scrollToOpenedCase() {
  const id = decodeURIComponent(location.hash.replace(/^#/, ""));
  if (!id) return;

  const tile = document.getElementById(id);
  if (!tile) return;

  tile.scrollIntoView({ block: "center", inline: "nearest" });
  tile.blur();
}

scrollToOpenedCase();
window.addEventListener("load", scrollToOpenedCase);
