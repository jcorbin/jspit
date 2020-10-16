function tailPart(s) {
  const parts = s.split("/");
  return parts.pop() || parts.pop() || "";
}
function getVersion() {
  const base = document.querySelector("head base");
  const version = tailPart(base?.getAttribute("href") || "");
  if (version && version !== ".")
    return version;
  const parts = window.location.pathname.split("/");
  return parts[parts.length - 2] || "";
}
export function show(bound, should, running) {
  if (should)
    document.body.classList.add("showUI");
  else
    document.body.classList.remove("showUI");
  if (running)
    document.body.classList.add("running");
  else
    document.body.classList.remove("running");
  if (bound.version) {
    const version = getVersion() || "DEV";
    if (bound.version instanceof HTMLElement)
      bound.version.innerText = version;
    else
      for (const el of bound.version)
        el.innerText = version;
  }
}
//# sourceMappingURL=ui.js.map
