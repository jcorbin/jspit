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
}
//# sourceMappingURL=ui.js.map
