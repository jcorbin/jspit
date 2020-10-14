import{html as l,render as g}from"./web_modules/lit-html.js";function b(e){return e=e&50331647,e=(e^e<<8)&564045186793727,e=(e^e<<4)&579507304992527,e=(e^e<<2)&619244948763443,e=(e^e<<1)&1501199875790165,e}function T({x:e,y:t}){return b(e)|b(t)<<1}class ${constructor(){this.#e=new Map,this.#t=new Map}#e;#t;update(e,t){for(const[i,s]of e.entries()){const r=t[i],o=T(r),n=this.#t.get(s);n!==void 0&&this.#e.get(n)?.delete(s);const a=this.#e.get(o);a?a.add(s):this.#e.set(o,new Set([s])),this.#t.set(s,o)}}tilesAt(e){return this.#e.get(T(e))}}class M{constructor(e){this.spatialIndex=new $,this.el=e}get tileSize(){for(const e of this.el.querySelectorAll(".tile")){const t=e.clientWidth,i=e.clientHeight;return{x:t,y:i}}return{x:0,y:0}}tileID(e){return`${this.el.id}${this.el.id?"-":""}tile-${e}`}createTile(e,t){let i=this.getTile(e);return i||(i=document.createElement("div"),this.el.appendChild(i),i.id=this.tileID(e)),this.updateTile(i,t)}updateTile(e,t){const i=this.getTile(e);if(!i)return null;if(t.text&&(i.innerText=t.text),t.fg&&(i.style.color=t.fg),t.bg&&(i.style.backgroundColor=t.bg),t.tag){if(i.className="tile",typeof t.tag=="string")i.classList.add(t.tag);else if(Array.isArray(t.tag))for(const s of t.tag)i.classList.add(s)}else i.className||(i.className="tile");return t.pos&&this.moveTileTo(i,t.pos),i}getTile(e){return typeof e=="string"?this.el.querySelector("#"+this.tileID(e)):e}queryTiles(...e){const t=[];for(const i of this.el.querySelectorAll(`.tile${e.map(s=>`.${s}`).join("")}`))t.push(i);return t}clear(){for(;this.el.firstChild;)this.el.removeChild(this.el.firstChild)}getTilePosition(e){const t=this.getTile(e);if(!t)return{x:NaN,y:NaN};const i=parseFloat(t.style.getPropertyValue("--x"))||0,s=parseFloat(t.style.getPropertyValue("--y"))||0;return{x:i,y:s}}moveTileTo(e,t){const i=this.getTile(e);return i?(i.style.setProperty("--x",t.x.toString()),i.style.setProperty("--y",t.y.toString()),this.spatialIndex.update([i.id],[t]),t):{x:NaN,y:NaN}}moveTileBy(e,{x:t,y:i}){const s=this.getTile(e);if(!s)return{x:NaN,y:NaN};let{x:r,y:o}=this.getTilePosition(s);return r+=t,o+=i,this.moveTileTo(s,{x:r,y:o})}tilesAt(e,...t){let i=[];const s=this.spatialIndex.tilesAt(e);if(!s)return i;for(const r of s){const o=this.el.querySelector(`#${r}`);o&&i.push(o)}return t.length&&(i=i.filter(r=>t.every(o=>r.classList.contains(o)))),i}get viewOffset(){const e=parseFloat(this.el.style.getPropertyValue("--xlate-x"))||0,t=parseFloat(this.el.style.getPropertyValue("--xlate-y"))||0;return{x:e,y:t}}get viewport(){const e=this.tileSize,{x:t,y:i}=this.viewOffset,s=this.el.clientWidth/e.x,r=this.el.clientHeight/e.y;return{x:t,y:i,width:s,height:r}}moveViewTo({x:e,y:t}){return e=Math.floor(e),t=Math.floor(t),this.el.style.setProperty("--xlate-x",e.toString()),this.el.style.setProperty("--xlate-y",t.toString()),{x:e,y:t}}moveViewBy({x:e,y:t}){const{x:i,y:s}=this.viewOffset;return this.moveViewTo({x:i+e,y:s+t})}centerViewOn({x:e,y:t}){const{width:i,height:s}=this.viewport;return e-=i/2,t-=s/2,this.moveViewTo({x:e,y:t})}nudgeViewTo({x:e,y:t},i){let{x:s,y:r,width:o,height:n}=this.viewport,a=o,h=n;for(typeof i=="number"?(a*=i,h*=i):(a=i.x,h=i.y);;){const u=e<s?-1:e>s+o?1:0,p=t<r?-1:t>r+n?1:0;if(u<0)s-=a;else if(u>0)s+=a;else if(p<0)r-=h;else if(p>0)r+=h;else return this.moveViewTo({x:s,y:r})}}}const k=()=>new Promise(e=>requestAnimationFrame(e)),S=(e,t)=>new Promise(i=>{const s=r=>{e.removeEventListener(t,s),i(r)};e.addEventListener(t,s)});class x extends Map{constructor(){super(...arguments);this.enabled=!0}countKey({altKey:e,ctrlKey:t,metaKey:i,shiftKey:s,key:r}){const o=`${e?"A-":""}${t?"C-":""}${i?"M-":""}${s?"S-":""}${r}`,n=this.get(o)||0;this.set(o,n+1)}handleEvent(e){if(!this.enabled)return;if(e.type!=="keyup"&&e.type!=="keydown")return;const t=e;if(this.filter&&!this.filter(t))return;this.countKey(t),e.stopPropagation(),e.preventDefault()}register(e){const t=this.handleEvent.bind(this);e.addEventListener("keydown",t),e.addEventListener("keyup",t)}consumePresses(){const e=[];for(const[t,i]of Array.from(this.entries())){const s=Math.floor(i/2);if(s>0){const r=i%2;r==0?this.delete(t):this.set(t,1),e.push([t,s])}}return e}}function L(e,t){switch(e){case"ArrowUp":return{x:0,y:-1};case"ArrowRight":return{x:1,y:0};case"ArrowDown":return{x:0,y:1};case"ArrowLeft":return{x:-1,y:0};case".":return{x:0,y:0};default:return null}}function P(e){return e.map(([t,i])=>L(t,i)).reduce((t,i)=>(i&&(t.move.x+=i.x,t.move.y+=i.y,t.have=!0),t),{have:!1,move:{x:0,y:0}})}function c(e,t){const i=document.createElement(e);return t&&(i.className=t),i}class C{constructor(e,t,i){this.inputRate=100,this.nudgeBy=.2,this.running=!1,this.lastInput=0,this.head=i?.head||t.querySelector("header")||t.appendChild(c("header")),this.modal=i?.modal||t.querySelector(".modal")||t.appendChild(c("aside","modal")),this.grid=new M(i?.grid||t.querySelector(".grid")||t.appendChild(c("div","grid"))),this.foot=i?.foot||t.querySelector("footer")||t.appendChild(c("footer")),this.keys=new x,this.keys.filter=this.filterKeys.bind(this),this.keys.register(i?.keysOn||this.grid.el),this.#e=this.grid.el.className,this.cons=e,this.scen=new this.cons,this.reset(),this.init()}#e;filterKeys(e){return e.key==="Escape"?(this.scen.showMenu?this.scen.showMenu(this):this.reboot(),!1):this.modal.style.display!=="none"?!1:!e.altKey&&!e.ctrlKey&&!e.metaKey}reset(){this.grid.clear(),this.grid.el.className=this.#e,this.clearCtls(),this.setStatus(null),this.modal.style.display="none",this.#t&&this.grid.el.removeEventListener("mousemove",this.#t)}reboot(){this.reset(),this.scen=new this.cons,this.init()}init(){this.scen.setup(this),this.scen.inspect&&(this.#t||(this.#t=this.mouseMoved.bind(this)),this.grid.el.addEventListener("mousemove",this.#t),this.grid.el.classList.add("inspectable"))}#t;#i;mouseMoved(e){const t=document.elementsFromPoint(e.clientX,e.clientY).filter(r=>r.classList.contains("tile"));if(!this.scen||!this.scen.inspect)return;const i=t.map(({id:r})=>r).join(";");if(this.#i===i)return;this.#i=i;const s=this.grid.getTilePosition(t[0]);this.scen.inspect(this,s,t)}clearCtls(){for(const e of this.head.querySelectorAll(".ctl.scen"))e.parentNode&&e.parentNode.removeChild(e)}addCtl(e){const t=this.head.appendChild(c("div","ctl scen"));return g(e,t),t}showModal(e){g(e,this.modal),this.modal.style.display=e?"":"none"}setStatus(e){g(e,this.foot)}async run(){this.running=!0;let e=await k(),t=0;for(;this.running;){this.update(t);const i=await k();t=i-e,e=i}}halt(){this.running=!1}update(e){(this.lastInput+=e/this.inputRate)>=1&&(this.consumeInput(),this.lastInput=this.lastInput%1),this.scen&&this.scen.update&&this.modal.style.display==="none"&&this.scen.update(this,e)}consumeInput(){const e=this.keys.consumePresses();if(!this.scen)return;const t=this.grid.queryTiles("keyMove");if(!t.length)return;if(t.length>1)throw new Error(`ambiguous ${t.length}-mover situation`);const i=t[0];let{have:s,move:r}=P(e);if(!s)return;const o=this.grid.getTilePosition(i),n={x:o.x+r.x,y:o.y+r.y};let a={actor:i,pos:o,targ:n,ok:!0};this.scen.act&&(a=this.scen.act(this,a)),a.ok&&(this.grid.moveTileTo(a.actor,a.targ),this.grid.nudgeViewTo(a.targ,this.nudgeBy))}}class m{setup(e){e.showModal(l`
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
    `)}}m.demoName="Hello",m.demoTitle="Welcome screen";class y{constructor(){this.colors=["black","darker-grey","dark-grey","grey","light-grey","lighter-grey","white","dark-white","blue","bright-purple","cyan","dark-orange","dark-sea-green","green","light-cyan","magenta","orange","purple","red","red-orange","yellow","yellow-orange"]}#e;inspect(e,t,i){this.#e&&g(i.length?l`@${t.x},${t.y} ${i.map(({id:s})=>s)}`:l`// mouse-over a tile to inspect it`,this.#e)}setup(e){this.#e=e.addCtl(l`// mouse-over a tile to inspect it`),e.showModal(l`
      <section>
        <h1 align="center">Welcome traveler</h1>
        <p>
          Boop a color, get a color!
        </p>
        <p>
          This is the first and simplest example of jspit's <code>TileGrid</code>.
        </p>
        <p>
          <button @click=${()=>e.showModal(null)}>Ok!</button>
        </p>
      </section>
    `),e.grid.createTile("at",{text:"@",tag:["solid","mind","keyMove"],pos:{x:10,y:10}}),this.colors.forEach((t,i)=>{e.grid.createTile(`fg-swatch-${t}`,{fg:`var(--${t})`,tag:["solid","swatch","fg"],text:"$",pos:{x:5,y:i}}),e.grid.createTile(`bg-swatch-${t}`,{bg:`var(--${t})`,tag:["solid","swatch","bg"],text:"$",pos:{x:15,y:i}})}),e.grid.centerViewOn({x:10,y:10})}act(e,t){if(!t.actor.classList.contains("solid"))return t;const i=e.grid.tilesAt(t.targ,"solid");if(!(t.ok=!i.length)){for(const s of i)if(s.classList.contains("swatch")){const r={};s.classList.contains("fg")?r.fg=s.style.color:s.classList.contains("bg")&&(r.bg=s.style.backgroundColor),e.grid.updateTile(t.actor,r)}}return t}update(e,t){const{x:i,y:s}=e.grid.getTilePosition("at"),{x:r,y:o}=e.grid.tileSize,{x:n,y:a,width:h,height:u}=e.grid.viewport;e.setStatus(l`player@${i},${s}+${r}+${o} view@${n},${a}+${Math.floor(h)}+${Math.floor(u)}`)}}y.demoName="ColorBoop",y.demoTitle="Boop a color, get a color";function D(){const e=window.location.hash.split(";"),t=e.shift();return t?t.replace(/^#+/,""):null}function N(e){const t=window.location.hash.split(";"),i="#"+e;if(t.length&&t[0]===i)return;window.location.hash=i}function A(e){const t=window.location.hash.split(";");t.shift();const i=e+"=";for(const s of t)if(s.startsWith(i))return unescape(s.slice(i.length));return null}function I(e,t){const i=window.location.hash.split(";"),s=i.shift()||"#;",r=e+"=";let o=[s],n=!1;for(const a of i)a.startsWith(r)?t!==null&&!n&&(o.push(r+escape(t)),n=!0):o.push(a);t!==null&&!n&&o.push(r+escape(t)),window.location.hash=o.join(";")}class w{constructor(){this.particleID=0,this.rate=5,this.turnLeft=.5,this.turnRight=.5,this.stepLimit=50,this.#e=[],this.elapsed=0,this.digSeq=new Map}setup(e){e.grid.createTile(`particle-${++this.particleID}`,{tag:["particle","init"],bg:"var(--black)",fg:"var(--dark-grey)",text:"."}),e.grid.centerViewOn({x:0,y:0});for(const t of["rate","turnLeft","turnRight"])this.updateSetting(t,A(t));this.showMenu(e)}updateSetting(e,t){switch(e){case"turnLeft":case"turnRight":case"rate":const i=t!==null;i||(t=this[e].toString()),I(e,t),i&&(this[e]=parseFloat(t||""))}}#e;showMenu(e){this.#e=this.#e.filter(i=>(i.parentNode?.removeChild(i),!1));const t=i=>{const{name:s,value:r}=i.target;this.updateSetting(s,r),this.showMenu(e)};e.showModal(l`
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
            <input id="dla-turnLeft" name="turnLeft" type="number" min="0" max="1" step="0.2" value="${this.turnLeft}" @change=${t}>
          </dd>
          <dd><label for="dla-turnRight">Right: Math.PI *</label>
            <input id="dla-turnRight" name="turnRight" type="number" min="0" max="1" step="0.2" value="${this.turnRight}" @change=${t}>
          </dd>

          <dt>Particles Move</dt><dd>
            <label for="dla-rate">every</label>
            1 <!-- TODO -->
            step <!-- TODO -->
            <input id="dla-rate" name="rate" type="number" min="1" max="100" value="${this.rate}" @change=${t}>ms
          </dd>
        </dl></fieldset>

        <button @click=${()=>{e.showModal(null);const i=e.addCtl(l`
            <button @click=${()=>{i?.parentNode?.removeChild(i),this.dropPlayer(e),this.rate=100,r()}}>Drop Player</button>
          `),s=e.addCtl(l``),r=()=>{if(!s)return;g(l`
              <input id="dla-rate" type="range" min="1" max="100" value="${this.rate}" @change=${o=>{const{value:n}=o.target;this.rate=parseFloat(n),r()}}>
              <label for="dla-rate">Particle Move Rate: every ${this.rate}ms</label>
            `,s)};r(),this.#e.push(i,s)}}>Run</button>
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
    `)}dropPlayer(e){e.grid.createTile("at",{text:"@",tag:["solid","mind","keyMove"],pos:{x:0,y:0}})}update(e,t){this.elapsed+=t;const i=Math.min(this.stepLimit,Math.floor(this.elapsed/this.rate));if(!i)return;this.elapsed-=i*this.rate;let s=e.grid.queryTiles("particle","live");const r=()=>{const o=e.grid.createTile(`particle-${++this.particleID}`,{tag:["particle","live"],fg:"var(--green)",text:"*"});e.setStatus(l`
        <label for="particleID">Particels:</label>
        <span id="particleID">${this.particleID}</span>
      `),s.push(o)};for(let o=0;o<i;++o){if(s=s.filter(n=>n.classList.contains("live")),!s.length){r();continue}for(const n of s){let a=n.dataset.heading&&parseFloat(n.dataset.heading)||0;const h=Math.random()*(this.turnLeft+this.turnRight)-this.turnLeft;a+=Math.PI*h,a%=2*Math.PI,n.dataset.heading=a.toString();const u=Math.cos(a),p=Math.sin(a),d=e.grid.getTilePosition(n);Math.abs(p)>Math.abs(u)?p<0?d.y--:d.y++:u<0?d.x--:d.x++,e.grid.tilesAt(d,"particle").length?(e.grid.moveTileTo(n,d),e.grid.queryTiles("keyMove").length||e.grid.nudgeViewTo(d,.2)):(delete n.dataset.heading,e.grid.updateTile(n,{tag:["particle"],bg:"var(--black)",fg:"var(--grey)",text:".",pos:d}))}}}act(e,t){if(!t.actor.classList.contains("solid"))return t;const i=e.grid.tilesAt(t.targ);if(i.length)i.some(s=>s.classList.contains("particle"))||(t.ok=!1);else{const s=t.actor.id,r=(this.digSeq.get(s)||0)+1;this.digSeq.set(s,r),e.grid.createTile(`particle-placed-${s}-${r}`,{tag:["particle"],bg:"var(--black)",fg:"var(--orange)",text:".",pos:t.targ})}return t}}w.demoName="DLA",w.demoTitle="Diffusion Limited Aggregation";const v=[m,y,w];function q(e){for(const t of v)if(t.name===e)return t;return v[0]}let f;async function R(){await S(window,"DOMContentLoaded");const e=document.querySelector("main");if(!e)throw new Error("no <main> element");const t=document.querySelector("header")||document.body.insertBefore(c("header"),e),i=({demoName:o,demoTitle:n})=>l`
    <option value="${o}" title="${n}">${o}</option>`;g(l`
    <select id="demo" title="Simulation Scenario" @change=${o=>{const n=o.target;r(n.value),n.blur()}}>${v.map(i)}</select>
  `,t.appendChild(c("div","ctl right"))),g(l`
    <button @click=${()=>f?.reboot()} title="Reboot Scenario <Escape>">Reboot</button>
  `,t.appendChild(c("div","ctl right")));const s=document.getElementById("demo"),r=o=>{f&&f.halt();const n=q(o);N(n.demoName),s.value=n.demoName,f=new C(n,e,{head:t,modal:e.querySelector("*.modal"),foot:document.querySelector("footer"),keysOn:document.body}),f.run()};r(D()||"")}R();
