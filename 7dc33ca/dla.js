import {html, render} from "./web_modules/lit-html.js";
import {bindVars} from "./config.js";
import {TileGrid, TileInspector} from "./tiles.js";
import {KeyMap, coalesceMoves} from "./input.js";
import {everyFrame, schedule} from "./anim.js";
import {show as showUI} from "./ui.js";
var InitWhere;
(function(InitWhere2) {
  InitWhere2[InitWhere2["Seed"] = 0] = "Seed";
  InitWhere2[InitWhere2["RandSeed"] = 1] = "RandSeed";
  InitWhere2[InitWhere2["RandPrior"] = 2] = "RandPrior";
  InitWhere2[InitWhere2["RandVoid"] = 3] = "RandVoid";
  InitWhere2[InitWhere2["RandAny"] = 4] = "RandAny";
})(InitWhere || (InitWhere = {}));
export class DLA {
  constructor(grid) {
    this.particleID = 0;
    this.elapsed = 0;
    this.digSeq = new Map();
    this.running = false;
    const {seeds} = DLA.settings;
    this.grid = grid;
    this.grid.clear();
    const center = {x: NaN, y: NaN};
    for (const pos of seeds) {
      this.grid.createTile(`particle-${++this.particleID}`, {
        tag: ["particle", "init"],
        pos,
        text: "·"
      });
      if (isNaN(center.x) || isNaN(center.y))
        center.x = pos.x, center.y = pos.y;
      else
        center.x = (center.x + pos.x) / 2, center.y = (center.y + pos.y) / 2;
    }
    if (!isNaN(center.x) && !isNaN(center.y))
      this.grid.centerViewOn(center);
  }
  dropPlayer() {
    const {seeds} = DLA.settings;
    const pos = seeds[0];
    this.grid.createTile("at", {
      tag: ["solid", "mind", "keyMove"],
      pos,
      fg: "var(--dla-player)",
      text: "@"
    });
  }
  initPlace() {
    const {bounds, seeds, initWhere: {value: where}, initAnyBalance} = DLA.settings;
    const chooseVoid = () => {
      while (true) {
        const pos = {
          x: bounds.x + Math.random() * bounds.w,
          y: bounds.y + Math.random() * bounds.h
        };
        const at = this.grid.tilesAt(pos, "particle").filter((t) => !t.classList.contains("live"));
        if (!at.length)
          return pos;
      }
    };
    const choosePrior = () => {
      const prior = this.grid.queryTiles({tag: "particle"}).filter((t) => !t.classList.contains("live"));
      const tile = prior[Math.floor(Math.random() * prior.length)];
      return this.grid.getTilePosition(tile);
    };
    switch (where) {
      case 0:
        return seeds[0];
      case 1:
        return seeds[Math.floor(Math.random() * seeds.length)];
      case 2:
        return choosePrior();
      case 3:
        return chooseVoid();
      case 4:
        const nVoid = this.grid.queryTiles({tag: ["particle", "void"]}).length;
        const nPrime = this.grid.queryTiles({tag: ["particle", "prime"]}).length;
        const total = nVoid + nPrime;
        const sVoid = Math.pow(Math.random(), nVoid - total * (1 - initAnyBalance));
        const sPrime = Math.pow(Math.random(), nPrime - total * initAnyBalance);
        return sPrime >= sVoid ? choosePrior() : chooseVoid();
      default:
        throw new Error(`invalid initWhere value ${where}`);
    }
  }
  spawn() {
    const ghost = this.grid.queryTile({
      tag: "ghost",
      id: "^particle-"
    });
    if (!ghost && this.particleID >= this.particleLimit())
      return null;
    const {initBase, initArc} = DLA.settings;
    const pos = this.initPlace();
    const heading = Math.PI * (initBase + (Math.random() - 0.5) * initArc);
    const kind = this.anyCell(pos) ? "prime" : "void";
    const spec = {
      tag: ["particle", "live", kind],
      pos,
      text: "*",
      data: {heading}
    };
    if (ghost)
      return this.grid.updateTile(ghost, spec);
    return this.grid.createTile(`particle-${++this.particleID}`, spec);
  }
  stepLimit() {
    const {bounds, stepLimit} = DLA.settings;
    if (stepLimit > 0)
      return stepLimit;
    return bounds.w + bounds.h;
  }
  particleLimit() {
    const {bounds, particleLimit} = DLA.settings;
    if (particleLimit > 0) {
      if (particleLimit > 1)
        return particleLimit;
      return bounds.w * bounds.h * particleLimit;
    }
    return bounds.w * bounds.h / 2;
  }
  anyCell(...pts) {
    for (const pt of pts)
      if (this.grid.tilesAt(pt, "particle").filter((t) => !t.classList.contains("live")).length)
        return true;
    return false;
  }
  update(dt) {
    const {
      genRate,
      playRate,
      turnLeft,
      turnRight,
      ordinalMoves
    } = DLA.settings;
    const havePlayer = !!this.grid.queryTile({tag: "keyMove"});
    const rate = havePlayer ? playRate : genRate;
    this.elapsed += dt;
    const n = Math.floor(this.elapsed / rate);
    if (!n)
      return;
    this.elapsed -= n * rate;
    let ps = this.grid.queryTiles({tag: ["particle", "live"]});
    for (let i = 0; i < n; ++i) {
      ps = ps.filter((p) => p.classList.contains("live"));
      if (!ps.length) {
        const p = this.spawn();
        if (!p) {
          if (!havePlayer)
            this.dropPlayer();
          return;
        }
        ps.push(p);
        continue;
      }
      for (const p of ps) {
        let steps = this.grid.getTileData(p, "steps");
        if (typeof steps !== "number")
          steps = 0;
        this.grid.setTileData(p, "steps", ++steps);
        let heading = this.grid.getTileData(p, "heading");
        if (typeof heading !== "number")
          heading = 0;
        const adj = Math.random() * (turnLeft + turnRight) - turnLeft;
        heading += Math.PI * adj;
        heading %= 2 * Math.PI;
        this.grid.setTileData(p, "heading", heading);
        const p1 = this.grid.getTilePosition(p);
        const p2 = {x: p1.x, y: p1.y};
        let dx = Math.cos(heading);
        let dy = Math.sin(heading);
        if (!ordinalMoves) {
          const prior = this.grid.getTileData(p, "prior");
          if (prior !== null && typeof prior === "object" && !Array.isArray(prior)) {
            if (typeof prior.x === "number")
              dx += prior.x;
            if (typeof prior.y === "number")
              dy += prior.y;
          }
          if (Math.abs(dy) > Math.abs(dx)) {
            if (dy < 0)
              p2.y++, dy++;
            else
              p2.y--, dy--;
          } else {
            if (dx < 0)
              p2.x++, dx++;
            else
              p2.x--, dx--;
          }
          this.grid.setTileData(p, "prior", {x: dx, y: dy});
        } else {
          p2.x += dx;
          p2.y += dy;
        }
        const p3 = {x: Math.floor(p1.x), y: Math.floor(p1.y)};
        const p4 = {x: Math.floor(p2.x), y: Math.floor(p2.y)};
        if (p3.x !== p4.x || p3.y !== p4.y) {
          const at3 = this.grid.tilesAt(p3, "particle").filter((t) => t.id !== p.id && !t.classList.contains("live"));
          const at4 = this.grid.tilesAt(p4, "particle").filter((t) => !t.classList.contains("live"));
          if (at3.length && !at4.length) {
            this.grid.updateTile(p, {
              tag: ["particle", "prime"],
              pos: p4,
              text: "·"
            });
            continue;
          } else if (!at3.length && (at4.length || this.anyCell({x: p3.x, y: p3.y - 1}, {x: p3.x + 1, y: p3.y}, {x: p3.x, y: p3.y + 1}, {x: p3.x - 1, y: p3.y}) || ordinalMoves && this.anyCell({x: p3.x + 1, y: p3.y - 1}, {x: p3.x + 1, y: p3.y + 1}, {x: p3.x - 1, y: p3.y + 1}, {x: p3.x - 1, y: p3.y - 1}))) {
            this.grid.updateTile(p, {
              tag: ["particle", "void"],
              pos: p3,
              text: "·"
            });
            continue;
          }
        }
        this.grid.moveTileTo(p, p2);
        if (steps >= this.stepLimit()) {
          this.grid.updateTile(p, {
            tag: ["ghost"],
            pos: p1
          });
        }
      }
    }
  }
  consumeInput(presses) {
    const movers = this.grid.queryTiles({tag: "keyMove"});
    if (!movers.length)
      return;
    if (movers.length > 1)
      throw new Error(`ambiguous ${movers.length}-mover situation`);
    const actor = movers[0];
    let {have, move} = coalesceMoves(presses);
    if (!have)
      return;
    const pos = this.grid.getTilePosition(actor);
    const targ = {x: pos.x + move.x, y: pos.y + move.y};
    if (actor.classList.contains("solid")) {
      const hits = this.grid.tilesAt(targ);
      if (!hits.length) {
        return;
      } else {
        if (!hits.some((h) => h.classList.contains("particle")))
          return;
      }
    }
    this.grid.moveTileTo(actor, targ);
    this.grid.nudgeViewTo(targ, DLA.nudgeBy);
  }
  run(readKeys, update) {
    this.running = true;
    everyFrame(schedule(() => this.running, {every: DLA.inputRate, then: () => {
      this.consumeInput(readKeys());
      return true;
    }}, (dt) => {
      this.update(dt);
      if (update)
        update(dt);
      return true;
    }));
  }
}
DLA.demoName = "DLA";
DLA.demoTitle = "Diffusion Limited Aggregation";
DLA.inputRate = 100;
DLA.nudgeBy = 0.2;
DLA.settings = {
  genRate: 1,
  playRate: 100,
  bounds: {
    x: -15,
    y: -15,
    w: 30,
    h: 30
  },
  seeds: [
    {x: 0, y: 0}
  ],
  initWhere: {
    value: 4,
    options: [
      {label: "First Seed", value: 0},
      {label: "Random Seed", value: 1},
      {label: "Random Point: World", value: 2},
      {label: "Random Point: Void", value: 3},
      {label: "Random Point", value: 4}
    ]
  },
  initAnyBalance: 0.25,
  initBase: 0,
  initArc: 2,
  turnLeft: 0.1,
  turnRight: 0.1,
  stepLimit: 0,
  particleLimit: 0,
  ordinalMoves: false
};
export const bound = {};
export const state = {};
function onInsepcted({pos: {x, y}, tiles: tiles2}) {
  if (bound.inspectorAt) {
    bound.inspectorAt.innerText = `${isNaN(x) ? "X" : Math.floor(x)},${isNaN(y) ? "Y" : Math.floor(y)}`;
  }
  if (bound.inspector) {
    const lines = tiles2.map((t) => {
      let line = `id=${t.id}`;
      line += ` tag=[${Array.from(t.classList).filter((n) => n !== "tile").join(", ")}]`;
      return line;
    });
    bound.inspector.value = lines.join("\n");
    bound.inspector.rows = lines.length;
    bound.inspector.cols = lines.reduce((max, line) => Math.max(max, line.length), 0);
  }
}
export function init(bind) {
  Object.assign(bound, bind);
  if (bound.grid) {
    state.grid = new TileGrid(bound.grid);
    if (bound.inspector) {
      state.inspector = new TileInspector(state.grid, onInsepcted);
      state.inspector.disable();
    }
  }
  if (bound.keys)
    state.keys = new KeyMap(bound.keys, (ev) => {
      if (ev.key === "Escape") {
        if (ev.type === "keydown")
          playPause();
        return false;
      }
      if (ev.code === "Space") {
        const enabled = ev.type === "keydown";
        if (enabled)
          state.inspector?.enable();
        else
          state.inspector?.disable();
        state.grid?.el.classList.toggle("inspectable", enabled && !!state.inspector);
        state.grid?.el.classList.toggle("retro", enabled);
        return false;
      }
      if (!state.world?.running)
        return false;
      return !ev.altKey && !ev.ctrlKey && !ev.metaKey;
    });
  bound.run?.addEventListener("click", playPause);
  bound.reset?.addEventListener("click", () => {
    if (state.world)
      state.world.running = false;
    state.world = void 0;
    if (bound.reset)
      bound.reset.disabled = true;
    showUI(bound, false, false);
  });
  bound.dropPlayer?.addEventListener("click", () => {
    if (state.world) {
      if (bound.dropPlayer)
        bound.dropPlayer.disabled = true;
      state.world.dropPlayer();
    }
  });
  bindVars({
    data: DLA.settings,
    getInput: (name) => bound.menu?.querySelector(`input[name="${name}"]`) || null,
    getSelect: (name) => bound.menu?.querySelector(`select[name="${name}"]`) || null
  });
  showUI(bound, false, false);
}
function playPause() {
  if (!state.grid)
    return;
  showUI(bound, true, !state.world?.running);
  if (!state.world) {
    state.world = new DLA(state.grid);
    if (bound.dropPlayer)
      bound.dropPlayer.disabled = false;
    if (bound.reset)
      bound.reset.disabled = false;
  }
  const {world, keys} = state;
  if (world.running)
    world.running = false;
  else
    world.run(() => keys?.consumePresses() || [], () => bound.status && render(html`
        <label for="particleID">Particles:</label>
        <span id="particleID">${world.particleID}</span>
      `, bound.status));
}
//# sourceMappingURL=dla.js.map
