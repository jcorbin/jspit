import {html, render} from "./web_modules/lit-html.js";
function mortonSpread1(x) {
  x = x & 50331647;
  x = (x ^ x << 8) & 564045186793727;
  x = (x ^ x << 4) & 579507304992527;
  x = (x ^ x << 2) & 619244948763443;
  x = (x ^ x << 1) & 1501199875790165;
  return x;
}
function mortonKey({x, y}) {
  return mortonSpread1(x) | mortonSpread1(y) << 1;
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
class TileGrid {
  constructor(el) {
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
    return `${this.el.id}${this.el.id ? "-" : ""}tile-${id}`;
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
  updateTile(elOrID, spec) {
    const tile = this.getTile(elOrID);
    if (!tile)
      return null;
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
    if (spec.pos)
      this.moveTileTo(tile, spec.pos);
    return tile;
  }
  getTile(elOrID) {
    if (typeof elOrID === "string") {
      return this.el.querySelector("#" + this.tileID(elOrID));
    }
    return elOrID;
  }
  queryTiles(...tag) {
    const res = [];
    for (const el of this.el.querySelectorAll(`.tile${tag.map((t) => `.${t}`).join("")}`))
      res.push(el);
    return res;
  }
  clear() {
    while (this.el.firstChild)
      this.el.removeChild(this.el.firstChild);
  }
  getTilePosition(elOrID) {
    const tile = this.getTile(elOrID);
    if (!tile)
      return {x: NaN, y: NaN};
    const x = parseFloat(tile.style.getPropertyValue("--x")) || 0;
    const y = parseFloat(tile.style.getPropertyValue("--y")) || 0;
    return {x, y};
  }
  moveTileTo(elOrID, pt) {
    const tile = this.getTile(elOrID);
    if (!tile)
      return {x: NaN, y: NaN};
    tile.style.setProperty("--x", pt.x.toString());
    tile.style.setProperty("--y", pt.y.toString());
    this.spatialIndex.update([tile.id], [pt]);
    return pt;
  }
  moveTileBy(elOrID, {x: dx, y: dy}) {
    const tile = this.getTile(elOrID);
    if (!tile)
      return {x: NaN, y: NaN};
    let {x, y} = this.getTilePosition(tile);
    x += dx, y += dy;
    return this.moveTileTo(tile, {x, y});
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
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const once = (target, name) => new Promise((resolve) => {
  const handler = (event) => {
    target.removeEventListener(name, handler);
    resolve(event);
  };
  target.addEventListener(name, handler);
});
class KeyMap extends Map {
  constructor() {
    super(...arguments);
    this.enabled = true;
  }
  countKey({altKey, ctrlKey, metaKey, shiftKey, key}) {
    const name = `${altKey ? "A-" : ""}${ctrlKey ? "C-" : ""}${metaKey ? "M-" : ""}${shiftKey ? "S-" : ""}${key}`;
    const n = this.get(name) || 0;
    this.set(name, n + 1);
  }
  handleEvent(event) {
    if (!this.enabled)
      return;
    if (event.type !== "keyup" && event.type !== "keydown")
      return;
    const keyEvent = event;
    if (this.filter && !this.filter(keyEvent))
      return;
    this.countKey(keyEvent);
    event.stopPropagation();
    event.preventDefault();
  }
  register(target) {
    const handler = this.handleEvent.bind(this);
    target.addEventListener("keydown", handler);
    target.addEventListener("keyup", handler);
  }
  consumePresses() {
    const presses = [];
    for (const [name, count] of Array.from(this.entries())) {
      const n = Math.floor(count / 2);
      if (n > 0) {
        const d = count % 2;
        if (d == 0)
          this.delete(name);
        else
          this.set(name, 1);
        presses.push([name, n]);
      }
    }
    return presses;
  }
}
function parseMoveKey(key, _count) {
  switch (key) {
    case "ArrowUp":
      return {x: 0, y: -1};
    case "ArrowRight":
      return {x: 1, y: 0};
    case "ArrowDown":
      return {x: 0, y: 1};
    case "ArrowLeft":
      return {x: -1, y: 0};
    case ".":
      return {x: 0, y: 0};
    default:
      return null;
  }
}
function coalesceKeys(presses) {
  return presses.map(([key, count]) => parseMoveKey(key, count)).reduce((acc, move) => {
    if (move) {
      acc.move.x += move.x;
      acc.move.y += move.y;
      acc.have = true;
    }
    return acc;
  }, {
    have: false,
    move: {x: 0, y: 0}
  });
}
function make(tagName, className) {
  const el = document.createElement(tagName);
  if (className)
    el.className = className;
  return el;
}
class Sim {
  constructor(cons, el, options) {
    this.inputRate = 100;
    this.nudgeBy = 0.2;
    this.running = false;
    this.lastInput = 0;
    this.head = options?.head || el.querySelector("header") || el.appendChild(make("header"));
    this.modal = options?.modal || el.querySelector(".modal") || el.appendChild(make("aside", "modal"));
    this.grid = new TileGrid(options?.grid || el.querySelector(".grid") || el.appendChild(make("div", "grid")));
    this.foot = options?.foot || el.querySelector("footer") || el.appendChild(make("footer"));
    this.keys = new KeyMap();
    this.keys.filter = this.filterKeys.bind(this);
    this.keys.register(options?.keysOn || this.grid.el);
    this.#origGridClassname = this.grid.el.className;
    this.cons = cons;
    this.scen = new this.cons();
    this.reset();
    this.init();
  }
  #origGridClassname;
  filterKeys(event) {
    if (event.key === "Escape") {
      if (this.scen.showMenu) {
        this.scen.showMenu(this);
      } else {
        this.reboot();
      }
      return false;
    }
    if (this.modal.style.display !== "none")
      return false;
    return !event.altKey && !event.ctrlKey && !event.metaKey;
  }
  reset() {
    this.grid.clear();
    this.grid.el.className = this.#origGridClassname;
    this.clearCtls();
    this.setStatus(null);
    this.modal.style.display = "none";
    if (this.#boundMouseMoved)
      this.grid.el.removeEventListener("mousemove", this.#boundMouseMoved);
  }
  reboot() {
    this.reset();
    this.scen = new this.cons();
    this.init();
  }
  init() {
    this.scen.setup(this);
    if (this.scen.inspect) {
      if (!this.#boundMouseMoved)
        this.#boundMouseMoved = this.mouseMoved.bind(this);
      this.grid.el.addEventListener("mousemove", this.#boundMouseMoved);
      this.grid.el.classList.add("inspectable");
    }
  }
  #boundMouseMoved;
  #inspectingIDs;
  mouseMoved(ev) {
    const tiles = document.elementsFromPoint(ev.clientX, ev.clientY).filter((el) => el.classList.contains("tile"));
    if (!this.scen || !this.scen.inspect)
      return;
    const ids = tiles.map(({id}) => id).join(";");
    if (this.#inspectingIDs === ids)
      return;
    this.#inspectingIDs = ids;
    const pos = this.grid.getTilePosition(tiles[0]);
    this.scen.inspect(this, pos, tiles);
  }
  clearCtls() {
    for (const el of this.head.querySelectorAll(".ctl.scen"))
      if (el.parentNode)
        el.parentNode.removeChild(el);
  }
  addCtl(tmpl) {
    const ctl = this.head.appendChild(make("div", "ctl scen"));
    render(tmpl, ctl);
    return ctl;
  }
  showModal(tmpl) {
    render(tmpl, this.modal);
    this.modal.style.display = tmpl ? "" : "none";
  }
  setStatus(tmpl) {
    render(tmpl, this.foot);
  }
  async run() {
    this.running = true;
    let last = await nextFrame();
    let dt = 0;
    while (this.running) {
      this.update(dt);
      const next = await nextFrame();
      dt = next - last, last = next;
    }
  }
  halt() {
    this.running = false;
  }
  update(dt) {
    if ((this.lastInput += dt / this.inputRate) >= 1) {
      this.consumeInput();
      this.lastInput = this.lastInput % 1;
    }
    if (this.scen && this.scen.update && this.modal.style.display === "none")
      this.scen.update(this, dt);
  }
  consumeInput() {
    const presses = this.keys.consumePresses();
    if (!this.scen)
      return;
    const movers = this.grid.queryTiles("keyMove");
    if (!movers.length)
      return;
    if (movers.length > 1)
      throw new Error(`ambiguous ${movers.length}-mover situation`);
    const actor = movers[0];
    let {have, move} = coalesceKeys(presses);
    if (!have)
      return;
    const pos = this.grid.getTilePosition(actor);
    const targ = {x: pos.x + move.x, y: pos.y + move.y};
    let action = {actor, pos, targ, ok: true};
    if (this.scen.act)
      action = this.scen.act(this, action);
    if (action.ok) {
      this.grid.moveTileTo(action.actor, action.targ);
      this.grid.nudgeViewTo(action.targ, this.nudgeBy);
    }
  }
}
class Hello {
  setup(ctx) {
    ctx.showModal(html`
      <section>
        <p>
          Welcome to the Pits of JavaScript, where we experiment our way towards
          a "game", spinning demos and other pieces of interest as the spirit
          moves...
        </p>

        <p>
          To get started, just pick a demo from the header dropdown.
        </p>
      </section>

      <section align="center">
        <a href="//github.com/borkshop/js/tree/main/packages/jspit">Github</a>
        |
        <a href="//github.com/borkshop/js/blob/main/packages/jspit/stream.md">Dev log</a>
      </section>
    `);
  }
}
Hello.demoName = "Hello";
Hello.demoTitle = "Welcome screen";
class ColorBoop {
  constructor() {
    this.colors = [
      "black",
      "darker-grey",
      "dark-grey",
      "grey",
      "light-grey",
      "lighter-grey",
      "white",
      "dark-white",
      "blue",
      "bright-purple",
      "cyan",
      "dark-orange",
      "dark-sea-green",
      "green",
      "light-cyan",
      "magenta",
      "orange",
      "purple",
      "red",
      "red-orange",
      "yellow",
      "yellow-orange"
    ];
  }
  #viewer;
  inspect(_ctx, pos, tiles) {
    if (this.#viewer)
      render(tiles.length ? html`@${pos.x},${pos.y} ${tiles.map(({id}) => id)}` : html`// mouse-over a tile to inspect it`, this.#viewer);
  }
  setup(ctx) {
    this.#viewer = ctx.addCtl(html`// mouse-over a tile to inspect it`);
    ctx.showModal(html`
      <section>
        <h1 align="center">Welcome traveler</h1>
        <p>
          Boop a color, get a color!
        </p>
        <p>
          This is the first and simplest example of jspit's <code>TileGrid</code>.
        </p>
        <p>
          <button @click=${() => ctx.showModal(null)}>Ok!</button>
        </p>
      </section>
    `);
    ctx.grid.createTile("at", {
      text: "@",
      tag: ["solid", "mind", "keyMove"],
      pos: {x: 10, y: 10}
    });
    this.colors.forEach((color, i) => {
      ctx.grid.createTile(`fg-swatch-${color}`, {
        fg: `var(--${color})`,
        tag: ["solid", "swatch", "fg"],
        text: "$",
        pos: {x: 5, y: i}
      });
      ctx.grid.createTile(`bg-swatch-${color}`, {
        bg: `var(--${color})`,
        tag: ["solid", "swatch", "bg"],
        text: "$",
        pos: {x: 15, y: i}
      });
    });
    ctx.grid.centerViewOn({x: 10, y: 10});
  }
  act(ctx, action) {
    if (!action.actor.classList.contains("solid"))
      return action;
    const hits = ctx.grid.tilesAt(action.targ, "solid");
    if (!(action.ok = !hits.length)) {
      for (const hit of hits)
        if (hit.classList.contains("swatch")) {
          const spec = {};
          if (hit.classList.contains("fg"))
            spec.fg = hit.style.color;
          else if (hit.classList.contains("bg"))
            spec.bg = hit.style.backgroundColor;
          ctx.grid.updateTile(action.actor, spec);
        }
    }
    return action;
  }
  update(ctx, _dt) {
    const {x, y} = ctx.grid.getTilePosition("at");
    const {x: w, y: h} = ctx.grid.tileSize;
    const {x: vx, y: vy, width: vw, height: vh} = ctx.grid.viewport;
    ctx.setStatus(html`player@${x},${y}+${w}+${h} view@${vx},${vy}+${Math.floor(vw)}+${Math.floor(vh)}`);
  }
}
ColorBoop.demoName = "ColorBoop";
ColorBoop.demoTitle = "Boop a color, get a color";
function readHashFrag() {
  const parts = window.location.hash.split(";");
  const frag = parts.shift();
  return frag ? frag.replace(/^#+/, "") : null;
}
function setHashFrag(frag) {
  const parts = window.location.hash.split(";");
  const expected = "#" + frag;
  if (parts.length && parts[0] === expected)
    return;
  window.location.hash = expected;
}
function readHashVar(name) {
  const parts = window.location.hash.split(";");
  parts.shift();
  const prefix = name + "=";
  for (const part of parts)
    if (part.startsWith(prefix))
      return unescape(part.slice(prefix.length));
  return null;
}
function setHashVar(name, value) {
  const parts = window.location.hash.split(";");
  const frag = parts.shift() || "#;";
  const prefix = name + "=";
  let res = [frag];
  let found = false;
  for (const part of parts)
    if (!part.startsWith(prefix)) {
      res.push(part);
    } else if (value !== null && !found) {
      res.push(prefix + escape(value));
      found = true;
    }
  if (value !== null && !found)
    res.push(prefix + escape(value));
  window.location.hash = res.join(";");
}
class DLA {
  constructor() {
    this.particleID = 0;
    this.rate = 5;
    this.turnLeft = 0.5;
    this.turnRight = 0.5;
    this.stepLimit = 50;
    this.#ctls = [];
    this.elapsed = 0;
    this.digSeq = new Map();
  }
  setup(ctx) {
    ctx.grid.createTile(`particle-${++this.particleID}`, {
      tag: ["particle", "init"],
      bg: "var(--black)",
      fg: "var(--dark-grey)",
      text: "."
    });
    ctx.grid.centerViewOn({x: 0, y: 0});
    for (const name of ["rate", "turnLeft", "turnRight"])
      this.updateSetting(name, readHashVar(name));
    this.showMenu(ctx);
  }
  updateSetting(name, value) {
    switch (name) {
      case "turnLeft":
      case "turnRight":
      case "rate":
        const given = value !== null;
        if (!given)
          value = this[name].toString();
        setHashVar(name, value);
        if (given)
          this[name] = parseFloat(value || "");
    }
  }
  #ctls;
  showMenu(ctx) {
    this.#ctls = this.#ctls.filter((ctl) => {
      ctl.parentNode?.removeChild(ctl);
      return false;
    });
    const change = (ev) => {
      const {name, value} = ev.target;
      this.updateSetting(name, value);
      this.showMenu(ctx);
    };
    ctx.showModal(html`
      <section>
        <h1>Diffusion Limited Aggregation</h1>

        <p>
          This implementation fires particles from the origin with random
          initial radial heading. Each move proceeds by randomly perturbing the
          heading up to the turning radius set below, and advancing forward
          orthogonally along the greatest projected axis.
        </p>

        <fieldset><legend>Settings</legend><dl>
          <dt>Turns upto</dt>
          <dd><label for="dla-turnLeft">Left: Math.PI *</label>
            <input id="dla-turnLeft" name="turnLeft" type="number" min="0" max="1" step="0.2" value="${this.turnLeft}" @change=${change}>
          </dd>
          <dd><label for="dla-turnRight">Right: Math.PI *</label>
            <input id="dla-turnRight" name="turnRight" type="number" min="0" max="1" step="0.2" value="${this.turnRight}" @change=${change}>
          </dd>

          <dt>Particles Move</dt><dd>
            1 <!-- TODO -->
            step <!-- TODO -->
            <label for="dla-rate">every</label>
            <input id="dla-rate" name="rate" type="number" min="1" max="100" value="${this.rate}" @change=${change}>ms
          </dd>
        </dl></fieldset>

        <button @click=${() => {
      ctx.showModal(null);
      const drop = ctx.addCtl(html`
            <button @click=${() => {
        drop?.parentNode?.removeChild(drop);
        this.dropPlayer(ctx);
        this.rate = 100;
        doRate();
      }}>Drop Player</button>
          `);
      const rate = ctx.addCtl(html``);
      const doRate = () => {
        if (!rate)
          return;
        render(html`
              <input id="dla-rate" type="range" min="1" max="100" value="${this.rate}" @change=${(ev) => {
          const {value} = ev.target;
          this.rate = parseFloat(value);
          doRate();
        }}>
              <label for="dla-rate">Particle Move Rate: every ${this.rate}ms</label>
            `, rate);
      };
      doRate();
      this.#ctls.push(drop, rate);
    }}>Run</button>
      </section>

      <section>

        Inspired by
        <a href="//web.archive.org/web/20151003181050/http://codepen.io/DonKarlssonSan/full/BopXpq/">2015-10 codepen by DonKarlssonSan</a>
        <br>
        <br>

        Other resources:
        <ul>
          <li><a href"https://roguelike.club/event2020.html">Roguecel 2020 talk by Herbert Wolverson</a> demonstrated DLA among other techniques</li>
          <li><a href="//www.roguebasin.com/index.php?title=Diffusion-limited_aggregation">Roguebasin DLA article</a></li>
          <li><a href="//en.wikipedia.org/wiki/Diffusion-limited_aggregation">WikiPedia on the wider topic</a></li>
          <li><a href="//paulbourke.net/fractals/dla/">Paul Boruke, reference from DonKarlssonSan</a></li>
        </ul>

      </section>
    `);
  }
  dropPlayer(ctx) {
    ctx.grid.createTile("at", {
      text: "@",
      tag: ["solid", "mind", "keyMove"],
      pos: {x: 0, y: 0}
    });
  }
  update(ctx, dt) {
    this.elapsed += dt;
    const n = Math.min(this.stepLimit, Math.floor(this.elapsed / this.rate));
    if (!n)
      return;
    this.elapsed -= n * this.rate;
    let ps = ctx.grid.queryTiles("particle", "live");
    const spawn = () => {
      const p = ctx.grid.createTile(`particle-${++this.particleID}`, {
        tag: ["particle", "live"],
        fg: "var(--green)",
        text: "*"
      });
      ctx.setStatus(html`
        <label for="particleID">Particels:</label>
        <span id="particleID">${this.particleID}</span>
      `);
      ps.push(p);
    };
    for (let i = 0; i < n; ++i) {
      ps = ps.filter((p) => p.classList.contains("live"));
      if (!ps.length) {
        spawn();
        continue;
      }
      for (const p of ps) {
        let heading = p.dataset.heading && parseFloat(p.dataset.heading) || 0;
        const adj = Math.random() * (this.turnLeft + this.turnRight) - this.turnLeft;
        heading += Math.PI * adj;
        heading %= 2 * Math.PI;
        p.dataset.heading = heading.toString();
        const dx = Math.cos(heading);
        const dy = Math.sin(heading);
        const pos = ctx.grid.getTilePosition(p);
        if (Math.abs(dy) > Math.abs(dx)) {
          if (dy < 0)
            pos.y--;
          else
            pos.y++;
        } else {
          if (dx < 0)
            pos.x--;
          else
            pos.x++;
        }
        if (!ctx.grid.tilesAt(pos, "particle").length) {
          delete p.dataset.heading;
          ctx.grid.updateTile(p, {
            tag: ["particle"],
            bg: "var(--black)",
            fg: "var(--grey)",
            text: ".",
            pos
          });
        } else {
          ctx.grid.moveTileTo(p, pos);
          if (!ctx.grid.queryTiles("keyMove").length)
            ctx.grid.nudgeViewTo(pos, 0.2);
        }
      }
    }
  }
  act(ctx, action) {
    if (!action.actor.classList.contains("solid"))
      return action;
    const hits = ctx.grid.tilesAt(action.targ);
    if (!hits.length) {
      const aid = action.actor.id;
      const did = (this.digSeq.get(aid) || 0) + 1;
      this.digSeq.set(aid, did);
      ctx.grid.createTile(`particle-placed-${aid}-${did}`, {
        tag: ["particle"],
        bg: "var(--black)",
        fg: "var(--orange)",
        text: ".",
        pos: action.targ
      });
    } else if (!hits.some((h) => h.classList.contains("particle"))) {
      action.ok = false;
    }
    return action;
  }
}
DLA.demoName = "DLA";
DLA.demoTitle = "Diffusion Limited Aggregation";
const demos = [
  Hello,
  ColorBoop,
  DLA
];
function demoNamed(name) {
  for (const d of demos)
    if (d.name === name)
      return d;
  return demos[0];
}
let sim;
async function main() {
  await once(window, "DOMContentLoaded");
  const main2 = document.querySelector("main");
  if (!main2)
    throw new Error("no <main> element");
  const head = document.querySelector("header") || document.body.insertBefore(make("header"), main2);
  const demoOption = ({demoName, demoTitle}) => html`
    <option value="${demoName}" title="${demoTitle}">${demoName}</option>`;
  render(html`
    <select id="demo" title="Simulation Scenario" @change=${(ev) => {
    const sel2 = ev.target;
    change(sel2.value);
    sel2.blur();
  }}>${demos.map(demoOption)}</select>
  `, head.appendChild(make("div", "ctl right")));
  render(html`
    <button @click=${() => sim?.reboot()} title="Reboot Scenario <Escape>">Reboot</button>
  `, head.appendChild(make("div", "ctl right")));
  const sel = document.getElementById("demo");
  const change = (name) => {
    if (sim)
      sim.halt();
    const cons = demoNamed(name);
    setHashFrag(cons.demoName);
    sel.value = cons.demoName;
    sim = new Sim(cons, main2, {
      head,
      modal: main2.querySelector("*.modal"),
      foot: document.querySelector("footer"),
      keysOn: document.body
    });
    sim.run();
  };
  change(readHashFrag() || "");
}
main();
