function tailPart(s) {
  const parts = s.split("/");
  return parts.pop() || parts.pop() || "";
}
function parseVersion(doc, url) {
  if (typeof url === "string")
    url = new URL(url);
  const base = doc.querySelector("head base");
  const version = tailPart(base?.getAttribute("href") || "");
  if (version && version !== ".")
    return version;
  const parts = url.pathname.split("/");
  return parts[parts.length - 2] || "";
}
function getVersion() {
  return parseVersion(document, window.location);
}
export async function getLatestVersion() {
  const parser = new DOMParser();
  const response = await fetch("/index.html", {cache: "reload"});
  const doc = parser.parseFromString(await response.text(), "text/html");
  const version = parseVersion(doc, response.url);
  return version;
}
export async function show(bound, should, running) {
  document.body.classList.toggle("showUI", should);
  document.body.classList.toggle("running", running);
  const version = getVersion() || "DEV";
  if (bound.version) {
    if (bound.version instanceof HTMLElement)
      bound.version.innerText = version;
    else
      for (const el of bound.version)
        el.innerText = version;
  }
  if (bound.latest) {
    const latest = await getLatestVersion();
    if (latest && latest !== version) {
      const link = bound.latest.tagName.toLowerCase() === "a" ? bound.latest : bound.latest.querySelector("a");
      if (link) {
        if (getComputedStyle(bound.latest).display === "none")
          bound.latest.style.display = "initial";
        link.href = window.location.href.replace(`/${version}/`, `/${latest}/`);
        link.innerText = latest;
      }
    }
  }
}
//# sourceMappingURL=ui.js.map
