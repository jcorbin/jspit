export function show(bound, should, running) {
  const overlay = should ? "" : "none";
  if (bound.head)
    bound.head.style.display = overlay;
  if (bound.foot)
    bound.foot.style.display = overlay;
  if (bound.grid)
    bound.grid.style.display = overlay;
  if (bound.menu) {
    if (should)
      bound.menu.classList.remove("modal");
    else
      bound.menu.classList.add("modal");
    bound.menu.style.display = running ? "none" : "";
  }
  if (bound.version) {
    const parts = window.location.pathname.split("/");
    bound.version.innerText = parts[parts.length - 2] || "DEV";
  }
}
//# sourceMappingURL=ui.js.map
