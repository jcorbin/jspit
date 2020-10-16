import {html, render} from "./web_modules/lit-html.js";
import {readHashVar, setHashVar} from "./state.js";
import {TileGrid} from "./tiles.js";
import {KeyMap, coalesceMoves} from "./input.js";
import {everyFrame, schedule} from "./anim.js";
import {show as showUI} from "./ui.js";
export class DLA {
  constructor(grid) {
    this.particleID = 0;
    this.elapsed = 0;
    this.digSeq = new Map();
    this.running = false;
    this.grid = grid;
    this.grid.clear();
    this.grid.createTile(`particle-${++this.particleID}`, {
      tag: ["particle", "init"],
      bg: "var(--particle-bg)",
      fg: "var(--particle-dead)",
      text: "."
    });
    this.grid.centerViewOn({x: 0, y: 0});
  }
  static bindSettings(getInput) {
    DLA.bindSetting("dropAfter", getInput("dropAfter"));
    DLA.bindSetting("initBase", getInput("initBase"));
    DLA.bindSetting("initArc", getInput("initArc"));
    DLA.bindSetting("turnLeft", getInput("turnLeft"));
    DLA.bindSetting("turnRight", getInput("turnRight"));
    DLA.bindSetting("genRate", getInput("genRate"));
    DLA.bindSetting("playRate", getInput("playRate"));
    DLA.bindSetting("stepLimit", getInput("stepLimit"));
    DLA.bindToggle("clampMoves", getInput("clampMoves"));
    DLA.bindToggle("trackClampDebt", getInput("trackClampDebt"));
  }
  static bindToggle(name, input2) {
    if (input2)
      DLA.inputs[name] = input2;
    const update = (enabled) => {
      setHashVar(name, enabled ? "true" : "false");
      DLA[name] = enabled;
      return enabled;
    };
    const value = update((readHashVar(name) || DLA[name].toString()).toLowerCase() === "true");
    if (input2) {
      input2.checked = value;
      input2.addEventListener("change", () => update(input2.checked));
    }
  }
  static bindSetting(name, input2) {
    if (input2)
      DLA.inputs[name] = input2;
    const update = (value2) => {
      const given = value2 !== null;
      if (!given)
        value2 = DLA[name].toString();
      setHashVar(name, value2);
      if (given)
        DLA[name] = parseFloat(value2 || "");
      return value2;
    };
    const value = update(readHashVar(name));
    if (input2) {
      input2.value = value || "";
      input2.addEventListener("change", () => input2.value = update(input2.value) || "");
    }
  }
  dropPlayer() {
    this.grid.createTile("at", {
      text: "@",
      tag: ["solid", "mind", "keyMove"],
      fg: "var(--dla-player)",
      pos: {x: 0, y: 0}
    });
  }
  update(dt) {
    const havePlayer = !!this.grid.queryTiles("keyMove").length;
    if (DLA.dropAfter && this.particleID > DLA.dropAfter && !havePlayer)
      this.dropPlayer();
    const rate = havePlayer ? DLA.playRate : DLA.genRate;
    this.elapsed += dt;
    const n = Math.min(DLA.stepLimit, Math.floor(this.elapsed / rate));
    if (!n)
      return;
    this.elapsed -= n * rate;
    let ps = this.grid.queryTiles("particle", "live");
    const spawn = () => {
      const heading = Math.PI * (DLA.initBase + (Math.random() - 0.5) * DLA.initArc);
      const p = this.grid.createTile(`particle-${++this.particleID}`, {
        tag: ["particle", "live"],
        fg: "var(--particle-live)",
        text: "*",
        data: {heading}
      });
      ps.push(p);
    };
    for (let i = 0; i < n; ++i) {
      ps = ps.filter((p) => p.classList.contains("live"));
      if (!ps.length) {
        spawn();
        continue;
      }
      for (const p of ps) {
        let heading = this.grid.getTileData(p, "heading");
        if (typeof heading !== "number")
          heading = 0;
        const adj = Math.random() * (DLA.turnLeft + DLA.turnRight) - DLA.turnLeft;
        heading += Math.PI * adj;
        heading %= 2 * Math.PI;
        this.grid.setTileData(p, "heading", heading);
        let dx = Math.cos(heading);
        let dy = Math.sin(heading);
        const pos = this.grid.getTilePosition(p);
        if (DLA.clampMoves) {
          if (DLA.trackClampDebt) {
            const prior = this.grid.getTileData(p, "prior");
            if (prior !== null && typeof prior === "object" && !Array.isArray(prior)) {
              if (typeof prior.x === "number")
                dx += prior.x;
              if (typeof prior.y === "number")
                dy += prior.y;
            }
          }
          if (Math.abs(dy) > Math.abs(dx)) {
            if (dy < 0)
              pos.y++, dy++;
            else
              pos.y--, dy--;
          } else {
            if (dx < 0)
              pos.x++, dx++;
            else
              pos.x--, dx--;
          }
          if (DLA.trackClampDebt)
            this.grid.setTileData(p, "prior", {x: dx, y: dy});
        } else {
          pos.x += dx;
          pos.y += dy;
        }
        if (!this.grid.tilesAt(pos, "particle").length) {
          pos.x = Math.floor(pos.x);
          pos.y = Math.floor(pos.y);
          this.grid.updateTile(p, {
            tag: ["particle"],
            bg: "var(--particle-bg)",
            fg: "var(--particle-dead)",
            text: ".",
            pos,
            data: {}
          });
        } else {
          this.grid.moveTileTo(p, pos);
          if (!this.grid.queryTiles("keyMove").length)
            this.grid.nudgeViewTo(pos, 0.2);
        }
      }
    }
  }
  consumeInput(presses) {
    const movers = this.grid.queryTiles("keyMove");
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
        const aid = actor.id;
        const did = (this.digSeq.get(aid) || 0) + 1;
        this.digSeq.set(aid, did);
        this.grid.createTile(`particle-placed-${aid}-${did}`, {
          tag: ["particle"],
          bg: "var(--particle-bg)",
          fg: "var(--dla-player)",
          text: ".",
          pos: targ
        });
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
DLA.dropAfter = 0;
DLA.genRate = 1;
DLA.playRate = 100;
DLA.initBase = 0;
DLA.initArc = 2;
DLA.turnLeft = 0.5;
DLA.turnRight = 0.5;
DLA.stepLimit = 50;
DLA.clampMoves = false;
DLA.trackClampDebt = true;
DLA.inputs = {};
export const bound = {};
export const state = {};
export function init(bind) {
  Object.assign(bound, bind);
  if (bound.grid)
    state.grid = new TileGrid(bound.grid);
  if (bound.keys)
    state.keys = new KeyMap(bound.keys, (ev) => {
      if (ev.key === "Escape") {
        if (ev.type === "keydown")
          playPause();
        return false;
      }
      if (bound.menu?.style.display !== "none")
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
  DLA.bindSettings((name) => bound.menu?.querySelector(`input[name="${name}"]`) || null);
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
    world.run(() => keys?.consumePresses() || [], () => bound.foot && render(html`
        <label for="particleID">Particles:</label>
        <span id="particleID">${world.particleID}</span>
      `, bound.foot));
}
//# sourceMappingURL=dla.js.map
