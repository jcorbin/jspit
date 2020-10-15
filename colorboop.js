import {TileGrid} from "./tiles.js";
import {KeyMap, coalesceMoves} from "./input.js";
import {everyFrame, schedule} from "./anim.js";
import {show as showUI} from "./ui.js";
export class ColorBoop {
  constructor(grid) {
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
    this.running = false;
    this.grid = grid;
    this.grid.clear();
    this.grid.createTile("at", {
      text: "@",
      tag: ["solid", "mind", "keyMove"],
      pos: {x: 10, y: 10}
    });
    this.colors.forEach((color, i) => {
      this.grid.createTile(`fg-swatch-${color}`, {
        fg: `var(--${color})`,
        tag: ["solid", "swatch", "fg"],
        text: "$",
        pos: {x: 5, y: i}
      });
      this.grid.createTile(`bg-swatch-${color}`, {
        bg: `var(--${color})`,
        tag: ["solid", "swatch", "bg"],
        text: "$",
        pos: {x: 15, y: i}
      });
    });
    this.grid.centerViewOn({x: 10, y: 10});
  }
  consumeInput(presses) {
    const movers = this.grid.queryTiles("keyMove");
    if (!movers.length)
      return false;
    if (movers.length > 1)
      throw new Error(`ambiguous ${movers.length}-mover situation`);
    const actor = movers[0];
    let {have, move} = coalesceMoves(presses);
    if (!have)
      return false;
    const pos = this.grid.getTilePosition(actor);
    const targ = {x: pos.x + move.x, y: pos.y + move.y};
    if (actor.classList.contains("solid")) {
      const hits = this.grid.tilesAt(targ, "solid");
      if (hits.length) {
        for (const hit of hits)
          if (hit.classList.contains("swatch")) {
            const spec = {};
            if (hit.classList.contains("fg"))
              spec.fg = hit.style.color;
            else if (hit.classList.contains("bg"))
              spec.bg = hit.style.backgroundColor;
            this.grid.updateTile(actor, spec);
          }
        return true;
      }
    }
    this.grid.moveTileTo(actor, targ);
    this.grid.nudgeViewTo(targ, ColorBoop.nudgeBy);
    return true;
  }
  run(readKeys, updated) {
    if (this.running)
      return;
    this.running = true;
    everyFrame(schedule(() => this.running, {
      every: ColorBoop.inputRate,
      then: () => {
        if (this.consumeInput(readKeys()))
          updated(this.grid);
        return true;
      }
    }));
  }
}
ColorBoop.demoName = "ColorBoop";
ColorBoop.demoTitle = "Boop a color, get a color";
ColorBoop.inputRate = 100;
ColorBoop.nudgeBy = 0.2;
export const bound = {};
export const state = {};
import {html, render} from "./web_modules/lit-html.js";
export function init(bind) {
  Object.assign(bound, bind);
  if (bound.grid) {
    state.grid = new TileGrid(bound.grid);
    new TileInspector(state.grid, ({pos, tiles: tiles2}) => {
      if (bound.inspect)
        render(tiles2.length ? html`@${pos.x},${pos.y} ${tiles2.map(({id}) => id)}` : html`// mouse-over a tile to inspect it`, bound.inspect);
    });
  }
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
}
function playPause() {
  if (!state.grid)
    return;
  showUI(bound, true, !state.world?.running);
  if (!state.world) {
    state.world = new ColorBoop(state.grid);
    if (bound.reset)
      bound.reset.disabled = false;
  }
  const {world, grid, keys} = state;
  if (world.running)
    world.running = false;
  else
    world.run(() => keys?.consumePresses() || [], () => {
      if (!grid || !bound.foot)
        return;
      const {x, y} = grid.getTilePosition("at");
      const {x: w, y: h} = grid.tileSize;
      const {x: vx, y: vy, width: vw, height: vh} = grid.viewport;
      render(html`
        player@${x},${y}+${w}+${h} view@${vx},${vy}+${Math.floor(vw)}+${Math.floor(vh)}
      `, bound.foot);
    });
}
export class TileInspector {
  constructor(grid, handler) {
    this.#inspectingIDs = "";
    this.grid = grid;
    this.handler = handler;
    this.grid.el.addEventListener("mousemove", this.mouseMoved.bind(this));
  }
  #inspectingIDs;
  mouseMoved(ev) {
    const tiles2 = this.grid.tilesAtPoint(ev.clientX, ev.clientY);
    const ids = tiles2.map(({id}) => id).join(";");
    if (this.#inspectingIDs === ids)
      return;
    this.#inspectingIDs = ids;
    const pos = this.grid.getTilePosition(tiles2[0]);
    this.handler({pos, tiles: tiles2});
  }
}
