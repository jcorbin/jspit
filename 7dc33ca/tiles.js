function mortonSpread1(x) {
  x = x & 50331647;
  x = (x ^ x << 8) & 564045186793727;
  x = (x ^ x << 4) & 579507304992527;
  x = (x ^ x << 2) & 619244948763443;
  x = (x ^ x << 1) & 1501199875790165;
  return x;
}
function mortonKey({x, y}) {
  return mortonSpread1(Math.floor(x)) | mortonSpread1(Math.floor(y)) << 1;
}
class TileMortonIndex {
  constructor() {
    this.#fore = new Map();
    this.#back = new Map();
  }
  #fore;
  #back;
  update(ids, pos) {
    for (const [i, id] of ids.entries()) {
      const pt = pos[i];
      const key = mortonKey(pt);
      const prior = this.#back.get(id);
      if (prior !== void 0)
        this.#fore.get(prior)?.delete(id);
      const at = this.#fore.get(key);
      if (at)
        at.add(id);
      else
        this.#fore.set(key, new Set([id]));
      this.#back.set(id, key);
    }
  }
  tilesAt(at) {
    return this.#fore.get(mortonKey(at));
  }
}
export class TileGrid {
  constructor(el) {
    this.idspace = "tile";
    this.spatialIndex = new TileMortonIndex();
    this.el = el;
  }
  get tileSize() {
    for (const tile of this.el.querySelectorAll(".tile")) {
      const x = tile.clientWidth;
      const y = tile.clientHeight;
      return {x, y};
    }
    return {x: 0, y: 0};
  }
  tileID(id) {
    return `${this.el.id}${this.el.id ? "-" : ""}${this.idspace}-${id}`;
  }
  createTile(id, spec) {
    let tile = this.getTile(id);
    if (!tile) {
      tile = document.createElement("div");
      this.el.appendChild(tile);
      tile.id = this.tileID(id);
    }
    return this.updateTile(tile, spec);
  }
  updateTile(tile, spec) {
    if (spec.text)
      tile.innerText = spec.text;
    if (spec.fg)
      tile.style.color = spec.fg;
    if (spec.bg)
      tile.style.backgroundColor = spec.bg;
    if (spec.tag) {
      tile.className = "tile";
      if (typeof spec.tag === "string")
        tile.classList.add(spec.tag);
      else if (Array.isArray(spec.tag))
        for (const tag of spec.tag)
          tile.classList.add(tag);
    } else if (!tile.className)
      tile.className = "tile";
    this.moveTileTo(tile, spec.pos || {x: 0, y: 0});
    if (spec.data) {
      for (const name in tile.dataset)
        if (!(name in spec.data))
          delete tile.dataset[name];
      for (const name in spec.data)
        tile.dataset[name] = JSON.stringify(spec.data[name]);
    }
    return tile;
  }
  getTile(elOrID) {
    if (typeof elOrID === "string") {
      return this.el.querySelector("#" + this.tileID(elOrID));
    }
    return elOrID;
  }
  getTileData(tile, name) {
    const sval = tile?.dataset[name];
    if (!sval)
      return null;
    try {
      return JSON.parse(sval);
    } catch (e) {
    }
    return null;
  }
  setTileData(tile, name, value) {
    if (!tile)
      return;
    if (value === null)
      delete tile.dataset[name];
    else
      tile.dataset[name] = JSON.stringify(value);
  }
  tileQuerySelector(query) {
    const parseMatcher = (s) => {
      switch (s[0]) {
        case "^":
        case "$":
        case "*":
          return {match: s[0], value: s.slice(1)};
        default:
          return {match: "", value: s.slice(1)};
      }
    };
    const attrs = [];
    const addAttr = (name, match, value) => attrs.push(`${name}${match}=${value}`);
    if (query?.id) {
      let {match, value} = parseMatcher(query.id);
      if (!match || match === "^")
        value = `${this.idspace}-${value}`;
      addAttr("id", match, value);
    }
    if (query?.data)
      for (const name in query.data) {
        const {match, value} = parseMatcher(query.data[name]);
        addAttr(`data-${name}`, match, value);
      }
    const tagClasses = typeof query?.tag === "string" ? `.${query.tag}` : Array.isArray(query?.tag) ? query?.tag.map((t) => `.${t}`).join("") : "";
    return `.tile${tagClasses}${attrs.map((attr) => `[${attr}]`).join("")}`;
  }
  queryTile(query) {
    return this.el.querySelector(this.tileQuerySelector(query));
  }
  queryTiles(query) {
    const res = [];
    for (const el of this.el.querySelectorAll(this.tileQuerySelector(query)))
      res.push(el);
    return res;
  }
  clear() {
    for (const tile of this.queryTiles())
      this.el.removeChild(tile);
  }
  getTilePosition(tile) {
    const x = parseFloat(tile.style.getPropertyValue("--x")) || 0;
    const y = parseFloat(tile.style.getPropertyValue("--y")) || 0;
    return {x, y};
  }
  moveTileTo(tile, pt) {
    tile.style.setProperty("--x", pt.x.toString());
    tile.style.setProperty("--y", pt.y.toString());
    this.spatialIndex.update([tile.id], [pt]);
    return pt;
  }
  moveTileBy(tile, {x: dx, y: dy}) {
    let {x, y} = this.getTilePosition(tile);
    x += dx, y += dy;
    return this.moveTileTo(tile, {x, y});
  }
  tilesAtPoint(clientX, clientY) {
    return document.elementsFromPoint(clientX, clientY).filter((el) => el.classList.contains("tile"));
  }
  tilesAt(at, ...tag) {
    let tiles = [];
    const ids = this.spatialIndex.tilesAt(at);
    if (!ids)
      return tiles;
    for (const id of ids) {
      const el = this.el.querySelector(`#${id}`);
      if (el)
        tiles.push(el);
    }
    if (tag.length)
      tiles = tiles.filter((el) => tag.every((t) => el.classList.contains(t)));
    return tiles;
  }
  get viewOffset() {
    const x = parseFloat(this.el.style.getPropertyValue("--xlate-x")) || 0;
    const y = parseFloat(this.el.style.getPropertyValue("--xlate-y")) || 0;
    return {x, y};
  }
  get viewport() {
    const tileSize = this.tileSize, {x, y} = this.viewOffset, width = this.el.clientWidth / tileSize.x, height = this.el.clientHeight / tileSize.y;
    return {x, y, width, height};
  }
  moveViewTo({x, y}) {
    x = Math.floor(x);
    y = Math.floor(y);
    this.el.style.setProperty("--xlate-x", x.toString());
    this.el.style.setProperty("--xlate-y", y.toString());
    return {x, y};
  }
  moveViewBy({x: dx, y: dy}) {
    const {x, y} = this.viewOffset;
    return this.moveViewTo({x: x + dx, y: y + dy});
  }
  centerViewOn({x, y}) {
    const {width, height} = this.viewport;
    x -= width / 2, y -= height / 2;
    return this.moveViewTo({x, y});
  }
  nudgeViewTo({x, y}, nudge) {
    let {x: vx, y: vy, width, height} = this.viewport;
    let nx = width, ny = height;
    if (typeof nudge === "number")
      nx *= nudge, ny *= nudge;
    else
      nx = nudge.x, ny = nudge.y;
    while (true) {
      const dx = x < vx ? -1 : x > vx + width ? 1 : 0;
      const dy = y < vy ? -1 : y > vy + height ? 1 : 0;
      if (dx < 0)
        vx -= nx;
      else if (dx > 0)
        vx += nx;
      else if (dy < 0)
        vy -= ny;
      else if (dy > 0)
        vy += ny;
      else
        return this.moveViewTo({x: vx, y: vy});
    }
  }
}
export class TileInspector {
  constructor(grid, handler) {
    this.#inspectingIDs = "";
    this.grid = grid;
    this.handler = handler;
    this.enable();
  }
  #listener;
  enable() {
    if (this.#listener)
      return;
    this.#inspectingIDs = "";
    this.handler({pos: {x: NaN, y: NaN}, tiles: []});
    this.#listener = this.mouseMoved.bind(this);
    this.grid.el.addEventListener("mousemove", this.#listener);
  }
  disable() {
    if (!this.#listener)
      return;
    this.grid.el.removeEventListener("mousemove", this.#listener);
    this.#listener = void 0;
    this.#inspectingIDs = "";
    this.handler({pos: {x: NaN, y: NaN}, tiles: []});
  }
  #inspectingIDs;
  mouseMoved(ev) {
    const tiles = this.grid.tilesAtPoint(ev.clientX, ev.clientY);
    const ids = tiles.map(({id}) => id).join(";");
    if (this.#inspectingIDs === ids)
      return;
    this.#inspectingIDs = ids;
    const pos = tiles.length ? this.grid.getTilePosition(tiles[0]) : {x: NaN, y: NaN};
    this.handler({pos, tiles});
  }
}
//# sourceMappingURL=tiles.js.map
