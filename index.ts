import 'core-js/stable';
import 'regenerator-runtime/runtime';
import {html, render, TemplateResult} from 'lit-html';

interface Point {
  x: number,
  y: number,
}

interface TileSpec {
  text?: string
  pos?: Point
  tag?: string|string[]
  fg?: string
  bg?: string
}

class TileGrid {
  el : HTMLElement

  constructor(el:HTMLElement) {
    this.el = el;
    // TODO handle resize events
  }

  get tileSize(): Point {
    // TODO use an invisible ghost tile? cache?
    for (const tile of this.el.querySelectorAll('.tile')) {
      const h = tile.clientHeight;
      return {x: h, y: h};
    }
    return {x: 0, y: 0};
  }

  tileID(id:string) {
    return `${this.el.id}${this.el.id ? '-': ''}tile-${id}`;
  }

  createTile(id: string, spec:TileSpec):HTMLElement {
    let tile = this.getTile(id);
    if (!tile) {
      tile = document.createElement('div');
      this.el.appendChild(tile)
      tile.id = this.tileID(id)
    }
    return this.updateTile(tile, spec) as HTMLElement;
  }

  updateTile(elOrID:HTMLElement|string, spec:TileSpec) {
    const tile = this.getTile(elOrID);
    if (!tile) return null;
    if (spec.text) tile.innerText = spec.text;
    if (spec.fg) tile.style.color = spec.fg;
    if (spec.bg) tile.style.backgroundColor = spec.bg;
    if (spec.tag) {
      tile.className = 'tile';
      if (typeof spec.tag === 'string') tile.classList.add(spec.tag);
      else if (Array.isArray(spec.tag)) for (const tag of spec.tag) tile.classList.add(tag);
    } else if (!tile.className) tile.className = 'tile';
    if (spec.pos) this.moveTileTo(tile, spec.pos);
    return tile;
  }

  getTile(elOrID:HTMLElement|string):HTMLElement|null {
    if (typeof elOrID === 'string') {
      return this.el.querySelector('#' + this.tileID(elOrID));
    }
    return elOrID;
  }

  queryTiles(selector?:string) {
    const res : HTMLElement[] = [];
    for (const el of this.el.querySelectorAll(`.tile${selector || ''}`))
      res.push(el as HTMLElement);
    return res;
  }

  clear() {
    while (this.el.firstChild) this.el.removeChild(this.el.firstChild);
  }

  getTilePosition(elOrID:HTMLElement|string) {
    const tile = this.getTile(elOrID);
    if (!tile) return {x: NaN, y: NaN};
    const x = parseFloat(tile.style.getPropertyValue('--x')) || 0;
    const y = parseFloat(tile.style.getPropertyValue('--y')) || 0;
    return {x, y};
  }

  moveTileTo(elOrID:HTMLElement|string, {x, y}:Point) {
    const tile = this.getTile(elOrID);
    if (!tile) return {x: NaN, y: NaN};
    tile.style.setProperty('--x', x.toString());
    tile.style.setProperty('--y', y.toString());
    return {x, y};
  }

  moveTileBy(elOrID:HTMLElement|string, {x: dx, y: dy}:Point) {
    const tile = this.getTile(elOrID);
    if (!tile) return {x: NaN, y: NaN};
    let {x, y} = this.getTilePosition(tile);
    x += dx, y += dy;
    return this.moveTileTo(tile, {x, y});
  }

  tilesAt(at:Point, ...tag:string[]):HTMLElement[] {
    const tiles : HTMLElement[] = [];
    // TODO :shrug: spatial index
    for (const other of this.el.querySelectorAll(`.tile${tag.map(t => `.${t}`).join('')}`)) {
      const el = other as HTMLElement;
      const pos = this.getTilePosition(el);
      if (pos.x === at.x && pos.y === at.y) tiles.push(el);
    }
    return tiles;
  }

  get viewOffset() {
    const x = parseFloat(this.el.style.getPropertyValue('--xlate-x')) || 0;
    const y = parseFloat(this.el.style.getPropertyValue('--xlate-y')) || 0;
    return {x, y};
  }

  get viewport() {
    const
      tileSize = this.tileSize,
      {x, y} = this.viewOffset,
      width = this.el.clientWidth  / tileSize.x,
      height = this.el.clientHeight / tileSize.y;
    return {x, y, width, height};
  }

  moveViewTo({x, y}:Point) {
    x = Math.floor(x);
    y = Math.floor(y);
    this.el.style.setProperty('--xlate-x', x.toString());
    this.el.style.setProperty('--xlate-y', y.toString());
    return {x, y};
  }

  moveViewBy({x: dx, y: dy}:Point) {
    const {x, y} = this.viewOffset;
    return this.moveViewTo({x: x + dx, y: y + dy});
  }

  centerViewOn({x, y}:Point) {
    const {width, height} = this.viewport;
    x -= width / 2, y -= height / 2;
    return this.moveViewTo({x, y});
  }

  nudgeViewTo({x, y}:Point, nudge:Point|number) {
    let {x: vx, y: vy, width, height} = this.viewport;
    let nx = width, ny = height;
    if (typeof nudge === 'number') nx *= nudge,   ny *= nudge;
    else                           nx  = nudge.x, ny  = nudge.y;
    while (true) {
      const dx = x < vx ? -1 : x > vx + width ? 1 : 0;
      const dy = y < vy ? -1 : y > vy + height ? 1 : 0;
      if      (dx < 0) vx -= nx;
      else if (dx > 0) vx += nx;
      else if (dy < 0) vy -= ny;
      else if (dy > 0) vy += ny;
      else             return this.moveViewTo({x: vx, y: vy});
    }
  }
}

const nextFrame = () => new Promise<number>(resolve => requestAnimationFrame(resolve));

const once = (target:EventTarget, name:string) => new Promise<Event>(resolve => {
  const handler = (event:Event) => {
    target.removeEventListener(name, handler);
    resolve(event);
  };
  target.addEventListener(name, handler);
});

class KeyMap extends Map<string, number> {
  countKey({altKey, ctrlKey, metaKey, shiftKey, key}:KeyboardEvent) {
    const name = `${
      altKey ? 'A-' : ''}${
      ctrlKey ? 'C-' : ''}${
      metaKey ? 'M-' : ''}${
      shiftKey ? 'S-' : ''}${
      key}`;
    const n = this.get(name) || 0;
    this.set(name, n+1);
  }

  enabled = true
  filter? : (keyEvent:KeyboardEvent) => boolean

  handleEvent(event:Event) {
    if (!this.enabled) return;
    if (event.type !== 'keyup' && event.type !== 'keydown') return;
    const keyEvent = event as KeyboardEvent;
    if (this.filter && !this.filter(keyEvent)) return;
    this.countKey(keyEvent);
    event.stopPropagation();
    event.preventDefault();
  }

  register(target:EventTarget) {
    const handler = this.handleEvent.bind(this);
    target.addEventListener('keydown', handler);
    target.addEventListener('keyup', handler);
  }

  consumePresses() {
    const presses :Array<[string, number]> = [];
    for (const [name, count] of Array.from(this.entries())) {
      const n = Math.floor(count / 2);
      if (n > 0) {
        const d = count % 2;
        if (d == 0) this.delete(name);
        else        this.set(name, 1);
        presses.push([name, n]);
      }
    }
    return presses;
  }
}

interface Move {
  x: number,
  y: number,
}

function parseMoveKey(key:string, _count:number): Move|null {
  switch (key) {
    // arrow keys + stay
    case 'ArrowUp':    return {x:  0, y: -1};
    case 'ArrowRight': return {x:  1, y:  0};
    case 'ArrowDown':  return {x:  0, y:  1};
    case 'ArrowLeft':  return {x: -1, y:  0};
    case '.':          return {x:  0, y:  0};
    default:           return null;
  }
}

function coalesceKeys(presses:Array<[string, number]>) {
  return presses
    .map(([key, count]) => parseMoveKey(key, count))
    .reduce((acc, move) => {
      if (move) {
        acc.move.x += move.x;
        acc.move.y += move.y;
        acc.have = true
      }
      return acc;
    }, {
      have: false,
      move: {x: 0, y: 0},
    });
}

interface SimAction {
  actor: HTMLElement,
  pos: Point,
  targ: Point,
  ok: boolean,
}

interface Context {
  addCtl(tmpl:TemplateResult|null):HTMLElement|null
  showModal(tmpl:TemplateResult|null):void
  setStatus(tmpl:TemplateResult|null):void
  grid : TileGrid
}

interface Scenario {
  setup(ctx:Context): void
  update?(ctx:Context, dt:number): void
  act?(ctx:Context, action:SimAction): SimAction
  inspect?(ctx:Context, pos:Point, tiles:HTMLElement[]):void
}

interface ScenarioCons {
  new(): Scenario
}

class Sim {
  scen : Scenario | null = null
  modal : HTMLElement
  grid : TileGrid
  keys : KeyMap
  head? : HTMLElement
  foot? : HTMLElement
  cont? : HTMLElement

  constructor(
    modal : HTMLElement,
    view : HTMLElement,
    head? : HTMLElement,
    foot? : HTMLElement,
    cont? : HTMLElement,
  ) {
    this.modal = modal;
    this.grid = new TileGrid(view);
    this.keys = new KeyMap();
    this.head = head;
    this.foot = foot;
    this.cont = cont;
    this.keys.filter = this.filterKeys.bind(this);
    this.keys.register(this.cont || this.grid.el);
    this.#origGridClassname = this.grid.el.className;
  }

  #origGridClassname:string

  filterKeys(event:KeyboardEvent) {
    if (this.modal.style.display !== 'none') return false;
    return !event.altKey && !event.ctrlKey && !event.metaKey;
  }

  change(scen:Scenario|null) {
    this.grid.clear();
    this.scen = scen;
    this.setStatus(null);
    this.grid.el.className = this.#origGridClassname;
    this.clearCtls();
    this.modal.style.display = 'none';
    if (this.#boundMouseMoved) this.grid.el.removeEventListener('mousemove', this.#boundMouseMoved);
    if (this.scen) {
      this.scen.setup(this);
      if (this.scen.inspect) {
        if (!this.#boundMouseMoved) this.#boundMouseMoved = this.mouseMoved.bind(this)
        this.grid.el.addEventListener('mousemove', this.#boundMouseMoved);
        this.grid.el.classList.add('inspectable');
      }
    }
  }

  #boundMouseMoved?:any
  #inspectingIDs?:string
  mouseMoved(ev:MouseEvent) {
    const tiles = document
      .elementsFromPoint(ev.clientX, ev.clientY)
      .filter(el => el.classList.contains('tile')) as HTMLElement[];
    if (!this.scen || !this.scen.inspect) return;

    const ids = tiles.map(({id}) => id).join(';');
    if (this.#inspectingIDs === ids) return;
    this.#inspectingIDs = ids;
    // if (!tiles.length) return;

    // TODO would be nice to be able to just translate event coordinates into
    // tile space
    const pos = this.grid.getTilePosition(tiles[0]);
    this.scen.inspect(this, pos, tiles);
  }

  clearCtls() {
    if (!this.head) return;
    for (const el of this.head.querySelectorAll('.ctl.scen'))
      if (el.parentNode) el.parentNode.removeChild(el);
  }

  addCtl(tmpl:TemplateResult|null):HTMLElement|null {
    if (!this.head) return null;
    const ctl = document.createElement('div');
    ctl.classList.add('ctl');
    ctl.classList.add('scen');
    this.head.appendChild(ctl);
    render(tmpl, ctl);
    return ctl;
  }

  showModal(tmpl:TemplateResult|null) {
    render(tmpl, this.modal);
    this.modal.style.display = tmpl ? '' : 'none';
  }

  setStatus(tmpl:TemplateResult|null) {
    if (this.foot) render(tmpl, this.foot);
  }

  inputRate = 100 // rate at which to coalesce and process movement input
  nudgeBy = 0.2   // proportion to scroll viewport by when at goes outside

  lastInput = 0
  update(dt:number):void {
    if ((this.lastInput += dt / this.inputRate) >= 1) {
      this.consumeInput();
      this.lastInput = this.lastInput % 1;
    }

    if (this.scen && this.scen.update &&
      this.modal.style.display === 'none')
      this.scen.update(this, dt);
  }

  consumeInput() {
    const presses = this.keys.consumePresses();
    if (!this.scen) return;

    const movers = this.grid.queryTiles('.keyMove');
    if (!movers.length) return;
    if (movers.length > 1) throw new Error(`ambiguous ${movers.length}-mover situation`);
    const actor = movers[0];

    let {have, move} = coalesceKeys(presses);
    if (!have) return;

    const pos = this.grid.getTilePosition(actor);
    const targ = {x: pos.x + move.x, y: pos.y + move.y};
    let action = {actor, pos, targ, ok: true};

    if (this.scen.act) action = this.scen.act(this, action);

    if (action.ok) {
      this.grid.moveTileTo(action.actor, action.targ);
      this.grid.nudgeViewTo(action.targ, this.nudgeBy);
    }
  }
}

class Hello {
  setup(ctx:Context) {
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
        <a href="//github.com/jcorbin/jspit">Github</a>
        |
        <a href="//github.com/jcorbin/jspit/blob/main/stream.md">Dev log</a>
      </section>
    `);
  }
}

class ColorBoop {
  colors = [
    'black',
    'darker-grey',
    'dark-grey',
    'grey',
    'light-grey',
    'lighter-grey',
    'white',
    'dark-white',
    'blue',
    'bright-purple',
    'cyan',
    'dark-orange',
    'dark-sea-green',
    'green',
    'light-cyan',
    'magenta',
    'orange',
    'purple',
    'red',
    'red-orange',
    'yellow',
    'yellow-orange',
  ]

  #viewer?:HTMLElement|null

  inspect?(_ctx:Context, pos:Point, tiles:HTMLElement[]):void {
    if (this.#viewer) render(tiles.length
      ? html`@${pos.x},${pos.y} ${tiles.map(({id}) => id)}`
      : html`// mouse-over a tile to inspect it`,
      this.#viewer
    )
  }

  setup(ctx:Context) {
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

    ctx.grid.createTile('at', {
      text: '@',
      tag: ['solid', 'mind', 'keyMove'],
      pos: {x: 10, y: 10},
    });
    this.colors.forEach((color, i) => {
      ctx.grid.createTile(`fg-swatch-${color}`, {
        fg: `var(--${color})`,
        tag: ['solid', 'swatch', 'fg'],
        text: '$',
        pos: {x: 5, y: i},
      });
      ctx.grid.createTile(`bg-swatch-${color}`, {
        bg: `var(--${color})`,
        tag: ['solid', 'swatch', 'bg'],
        text: '$',
        pos: {x: 15, y: i},
      });
    });
      
    ctx.grid.centerViewOn({x: 10, y: 10});
  }

  act(ctx:Context, action:SimAction): SimAction {
    if (!action.actor.classList.contains('solid')) return action;
    const hits = ctx.grid.tilesAt(action.targ, 'solid');
    if (!(action.ok = !hits.length)) for (const hit of hits)
      if (hit.classList.contains('swatch')) {
        const spec : TileSpec = {};
        if      (hit.classList.contains('fg')) spec.fg = hit.style.color;
        else if (hit.classList.contains('bg')) spec.bg = hit.style.backgroundColor;
        ctx.grid.updateTile(action.actor, spec)
      }
    return action;
  }

  update(ctx:Context, _dt:number) {
    const {x, y} = ctx.grid.getTilePosition('at');
    const {x: w, y: h} = ctx.grid.tileSize;
    const {x: vx, y: vy, width: vw, height: vh} = ctx.grid.viewport;
    ctx.setStatus(html`player@${x},${y}+${w}+${h} view@${vx},${vy}+${Math.floor(vw)}+${Math.floor(vh)}`);
  }
}

class DLA {
  particleID = 0

  setup(ctx:Context):void {
    ctx.grid.createTile(`particle-${++this.particleID}`, {
      tag: ['particle', 'init'],
      bg: 'var(--black)',
      fg: 'var(--dark-grey)',
      text: '.',
    });
    ctx.grid.centerViewOn({x: 0, y: 0});
    this.updateCtl(ctx);
  }

  updateCtl(ctx:Context):void {
    ctx.showModal(html`
      <section>
        <h1>Diffusion Limited Aggregation</h1>

        <p>
          This implementation fires particles from the origin with random
          initial radial heading. Each move proceeds by randomly perturbing the
          heading up to the turning radius set below, and advancing forward
          orthogonally along the greatest projected axis.
        </p>

        <fieldset>
          <legend>Settings</legend>

          <input id="dla-turnDenom" type="range" min="1" max="100" value="${this.turnDenom}" @change=${this.turnDenomChanged.bind(this, ctx)}>
          <label for="dla-turnDenom">Turning Radius: Math.PI/${this.turnDenom}</label>
          <br>

          <input id="dla-rate" type="range" min="1" max="100" value="${this.rate}" @change=${this.rateChanged.bind(this, ctx)}>
          <label for="dla-rate">Particle Move Rate: every ${this.rate}ms</label>
          <br>

          <button @click=${() => ctx.showModal(null)}>Run</button>
        </fieldset>
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

  turnDenomChanged(ctx:Context, ev:Event) {
    const {value} = ev.target as HTMLInputElement;
    this.turnDenom = parseFloat(value);
    this.updateCtl(ctx);
  }

  rateChanged(ctx:Context, ev:Event) {
    const {value} = ev.target as HTMLInputElement;
    this.rate = parseFloat(value);
    this.updateCtl(ctx);
  }

  rate = 5
  turnDenom = 8;
  stepLimit = 50;

  elapsed = 0

  update?(ctx:Context, dt:number): void {
    this.elapsed += dt
    const n = Math.min(this.stepLimit, Math.floor(this.elapsed / this.rate));
    if (!n) return;
    this.elapsed -= n * this.rate;
    for (let i = 0; i < n; ++i) {

      const p = ctx.grid.getTile(`particle-${this.particleID}`);
      if (!p || !p.classList.contains('live')) {
        ctx.grid.createTile(`particle-${++this.particleID}`, {
          tag: ['particle', 'live'],
          fg: 'var(--green)',
          text: '*',
        });
        ctx.setStatus(html`
          <label for="particleID">Particels:</label>
          <span id="particleID">${this.particleID}</span>
        `);
        continue;
      }

      let heading = (p.dataset.heading && parseFloat(p.dataset.heading));
      if (!heading) {
        heading = Math.random() * 2 * Math.PI;
      } else {
        heading += Math.random() * Math.PI / this.turnDenom;
        heading %= 2 * Math.PI;
      }
      p.dataset.heading = heading.toString();

      const dx = Math.cos(heading);
      const dy = Math.sin(heading);
      const pos = ctx.grid.getTilePosition(p);
      if (Math.abs(dy) > Math.abs(dx)) {
        if (dy < 0) pos.y--;
        else pos.y++;
      } else {
        if (dx < 0) pos.x--;
        else pos.x++;
      }

      if (!ctx.grid.tilesAt(pos, 'particle').length) {
        delete p.dataset.heading;
        ctx.grid.updateTile(p, {
          tag: ['particle'],
          bg: 'var(--black)',
          fg: 'var(--grey)',
          text: '.',
          pos,
        });
        continue;
      }

      ctx.grid.moveTileTo(p, pos);
      ctx.grid.nudgeViewTo(pos, 0.2);
    }
  }
}

const demos:ScenarioCons[] = [
  Hello,
  ColorBoop,
  DLA,
];

function setupDemoSelector(
  boot:HTMLButtonElement,
  sel:HTMLSelectElement,
  change:(scen:Scenario|null)=>void) {
  for (const demo of demos) {
    const opt = document.createElement('option');
    opt.value = demo.name;
    opt.innerText = demo.name; // TODO description?
    sel.appendChild(opt);
  }
  if (window.location.hash) sel.value = window.location.hash.slice(1);
  const changed = () => {
    let demo = null;
    for (const d of demos) if (d.name === sel.value) {
      demo = new d();
      break;
    }
    if (!demo) sel.value = 'hello';
    window.location.hash = `#${sel.value}`;
    change(demo || new Hello());
    sel.blur();
  };
  sel.addEventListener('change', changed);
  boot.addEventListener('click', changed);
  changed();
}

async function main() {
  await once(window, 'DOMContentLoaded');

  const main = document.querySelector('main');
  if (!main) throw new Error('no <main> element');

  const modal = main.querySelector('.modal');
  if (!modal) throw new Error('no <main> .modal')

  const demoSel = document.querySelector('select#demo');
  if (!demoSel) throw new Error('no <select#demo> element');

  const demoBoot = document.querySelector('#reboot');
  if (!demoBoot) throw new Error('no #reboot element');

  const mainGrid = main.querySelector('.grid');
  if (!mainGrid) throw new Error('no <main> .grid element');

  const head = document.querySelector('header');
  if (!head) throw new Error('no <header> element');

  const foot = document.querySelector('footer');
  if (!foot) throw new Error('no <footer> element');

  let running = true;

  const sim = new Sim(
    modal as HTMLElement,
    mainGrid as HTMLElement,
    head,
    foot,
    document.body,
  );

  setupDemoSelector(
    demoBoot as HTMLButtonElement,
    demoSel as HTMLSelectElement,
    sim.change.bind(sim),
  );

  let last = await nextFrame();

  let dt = 0;
  while (running) {
    sim.update(dt);
    const next = await nextFrame();
    dt = next - last, last = next;
  }
}
main();

// vim:set ts=2 sw=2 expandtab:
