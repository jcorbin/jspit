import{html as h,render as u}from"./web_modules/lit-html.js";function m(e){return e=e&50331647,e=(e^e<<8)&564045186793727,e=(e^e<<4)&579507304992527,e=(e^e<<2)&619244948763443,e=(e^e<<1)&1501199875790165,e}function y({x:e,y:t}){return m(e)|m(t)<<1}class v{constructor(){this.#e=new Map,this.#t=new Map}#e;#t;update(e,t){for(const[i,s]of e.entries()){const r=t[i],o=y(r),a=this.#t.get(s);a!==void 0&&this.#e.get(a)?.delete(s);const n=this.#e.get(o);n?n.add(s):this.#e.set(o,new Set([s])),this.#t.set(s,o)}}tilesAt(e){return this.#e.get(y(e))}}class b{constructor(e){this.spatialIndex=new v,this.el=e}get tileSize(){for(const e of this.el.querySelectorAll(".tile")){const t=e.clientWidth,i=e.clientHeight;return{x:t,y:i}}return{x:0,y:0}}tileID(e){return`${this.el.id}${this.el.id?"-":""}tile-${e}`}createTile(e,t){let i=this.getTile(e);return i||(i=document.createElement("div"),this.el.appendChild(i),i.id=this.tileID(e)),this.updateTile(i,t)}updateTile(e,t){const i=this.getTile(e);if(!i)return null;if(t.text&&(i.innerText=t.text),t.fg&&(i.style.color=t.fg),t.bg&&(i.style.backgroundColor=t.bg),t.tag){if(i.className="tile",typeof t.tag=="string")i.classList.add(t.tag);else if(Array.isArray(t.tag))for(const s of t.tag)i.classList.add(s)}else i.className||(i.className="tile");return t.pos&&this.moveTileTo(i,t.pos),i}getTile(e){return typeof e=="string"?this.el.querySelector("#"+this.tileID(e)):e}queryTiles(...e){const t=[];for(const i of this.el.querySelectorAll(`.tile${e.map(s=>`.${s}`).join("")}`))t.push(i);return t}clear(){for(;this.el.firstChild;)this.el.removeChild(this.el.firstChild)}getTilePosition(e){const t=this.getTile(e);if(!t)return{x:NaN,y:NaN};const i=parseFloat(t.style.getPropertyValue("--x"))||0,s=parseFloat(t.style.getPropertyValue("--y"))||0;return{x:i,y:s}}moveTileTo(e,t){const i=this.getTile(e);return i?(i.style.setProperty("--x",t.x.toString()),i.style.setProperty("--y",t.y.toString()),this.spatialIndex.update([i.id],[t]),t):{x:NaN,y:NaN}}moveTileBy(e,{x:t,y:i}){const s=this.getTile(e);if(!s)return{x:NaN,y:NaN};let{x:r,y:o}=this.getTilePosition(s);return r+=t,o+=i,this.moveTileTo(s,{x:r,y:o})}tilesAt(e,...t){let i=[];const s=this.spatialIndex.tilesAt(e);if(!s)return i;for(const r of s){const o=this.el.querySelector(`#${r}`);o&&i.push(o)}return t.length&&(i=i.filter(r=>t.every(o=>r.classList.contains(o)))),i}get viewOffset(){const e=parseFloat(this.el.style.getPropertyValue("--xlate-x"))||0,t=parseFloat(this.el.style.getPropertyValue("--xlate-y"))||0;return{x:e,y:t}}get viewport(){const e=this.tileSize,{x:t,y:i}=this.viewOffset,s=this.el.clientWidth/e.x,r=this.el.clientHeight/e.y;return{x:t,y:i,width:s,height:r}}moveViewTo({x:e,y:t}){return e=Math.floor(e),t=Math.floor(t),this.el.style.setProperty("--xlate-x",e.toString()),this.el.style.setProperty("--xlate-y",t.toString()),{x:e,y:t}}moveViewBy({x:e,y:t}){const{x:i,y:s}=this.viewOffset;return this.moveViewTo({x:i+e,y:s+t})}centerViewOn({x:e,y:t}){const{width:i,height:s}=this.viewport;return e-=i/2,t-=s/2,this.moveViewTo({x:e,y:t})}nudgeViewTo({x:e,y:t},i){let{x:s,y:r,width:o,height:a}=this.viewport,n=o,l=a;for(typeof i=="number"?(n*=i,l*=i):(n=i.x,l=i.y);;){const c=e<s?-1:e>s+o?1:0,d=t<r?-1:t>r+a?1:0;if(c<0)s-=n;else if(c>0)s+=n;else if(d<0)r-=l;else if(d>0)r+=l;else return this.moveViewTo({x:s,y:r})}}}const w=()=>new Promise(e=>requestAnimationFrame(e)),T=(e,t)=>new Promise(i=>{const s=r=>{e.removeEventListener(t,s),i(r)};e.addEventListener(t,s)});class $ extends Map{constructor(){super(...arguments);this.enabled=!0}countKey({altKey:e,ctrlKey:t,metaKey:i,shiftKey:s,key:r}){const o=`${e?"A-":""}${t?"C-":""}${i?"M-":""}${s?"S-":""}${r}`,a=this.get(o)||0;this.set(o,a+1)}handleEvent(e){if(!this.enabled)return;if(e.type!=="keyup"&&e.type!=="keydown")return;const t=e;if(this.filter&&!this.filter(t))return;this.countKey(t),e.stopPropagation(),e.preventDefault()}register(e){const t=this.handleEvent.bind(this);e.addEventListener("keydown",t),e.addEventListener("keyup",t)}consumePresses(){const e=[];for(const[t,i]of Array.from(this.entries())){const s=Math.floor(i/2);if(s>0){const r=i%2;r==0?this.delete(t):this.set(t,1),e.push([t,s])}}return e}}function k(e,t){switch(e){case"ArrowUp":return{x:0,y:-1};case"ArrowRight":return{x:1,y:0};case"ArrowDown":return{x:0,y:1};case"ArrowLeft":return{x:-1,y:0};case".":return{x:0,y:0};default:return null}}function M(e){return e.map(([t,i])=>k(t,i)).reduce((t,i)=>(i&&(t.move.x+=i.x,t.move.y+=i.y,t.have=!0),t),{have:!1,move:{x:0,y:0}})}class S{constructor(e,t,i,s,r,o){this.cons=null,this.scen=null,this.inputRate=100,this.nudgeBy=.2,this.lastInput=0,this.demos=e,this.modal=t,this.grid=new b(i),this.keys=new $,this.head=s,this.foot=r,this.keys.filter=this.filterKeys.bind(this),this.keys.register(o||this.grid.el),this.#e=this.grid.el.className;const a=({demoName:n,demoTitle:l})=>h`
      <option value="${n}" title="${l}">${n}</option>`;this.addCtl(h`
      <select id="demo" title="Simulation Scenario" @change=${n=>{const l=n.target;this.change(l.value),l.blur()}}>${this.demos.map(a)}</select>
      <button @click=${()=>this.reboot()} title="Reboot Scenario <Escape>">Reboot</button>
    `)?.classList.remove("scen"),this.change(window.location.hash?window.location.hash.slice(1):"")}#e;filterKeys(e){return e.key==="Escape"?(this.reboot(),!1):this.modal.style.display!=="none"?!1:!e.altKey&&!e.ctrlKey&&!e.metaKey}change(e){let t=null;for(const s of this.demos)if(s.name===e){t=s;break}t||(t=this.demos[0]);const i=document.getElementById("demo");i.value=t.demoName,window.location.hash=`#${t.demoName}`,this.cons=t,this.reboot()}reboot(){this.grid.clear(),this.grid.el.className=this.#e,this.clearCtls(),this.setStatus(null),this.modal.style.display="none",this.scen=this.cons&&new this.cons,this.#t&&this.grid.el.removeEventListener("mousemove",this.#t),this.scen&&(this.scen.setup(this),this.scen.inspect&&(this.#t||(this.#t=this.mouseMoved.bind(this)),this.grid.el.addEventListener("mousemove",this.#t),this.grid.el.classList.add("inspectable")))}#t;#i;mouseMoved(e){const t=document.elementsFromPoint(e.clientX,e.clientY).filter(r=>r.classList.contains("tile"));if(!this.scen||!this.scen.inspect)return;const i=t.map(({id:r})=>r).join(";");if(this.#i===i)return;this.#i=i;const s=this.grid.getTilePosition(t[0]);this.scen.inspect(this,s,t)}clearCtls(){for(const e of this.head.querySelectorAll(".ctl.scen"))e.parentNode&&e.parentNode.removeChild(e)}addCtl(e){const t=document.createElement("div");return t.classList.add("ctl"),t.classList.add("scen"),this.head.appendChild(t),u(e,t),t}showModal(e){u(e,this.modal),this.modal.style.display=e?"":"none"}setStatus(e){u(e,this.foot)}update(e){(this.lastInput+=e/this.inputRate)>=1&&(this.consumeInput(),this.lastInput=this.lastInput%1),this.scen&&this.scen.update&&this.modal.style.display==="none"&&this.scen.update(this,e)}consumeInput(){const e=this.keys.consumePresses();if(!this.scen)return;const t=this.grid.queryTiles("keyMove");if(!t.length)return;if(t.length>1)throw new Error(`ambiguous ${t.length}-mover situation`);const i=t[0];let{have:s,move:r}=M(e);if(!s)return;const o=this.grid.getTilePosition(i),a={x:o.x+r.x,y:o.y+r.y};let n={actor:i,pos:o,targ:a,ok:!0};this.scen.act&&(n=this.scen.act(this,n)),n.ok&&(this.grid.moveTileTo(n.actor,n.targ),this.grid.nudgeViewTo(n.targ,this.nudgeBy))}}class g{setup(e){e.showModal(h`
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
    `)}}g.demoName="Hello",g.demoTitle="Welcome screen";class p{constructor(){this.colors=["black","darker-grey","dark-grey","grey","light-grey","lighter-grey","white","dark-white","blue","bright-purple","cyan","dark-orange","dark-sea-green","green","light-cyan","magenta","orange","purple","red","red-orange","yellow","yellow-orange"]}#e;inspect(e,t,i){this.#e&&u(i.length?h`@${t.x},${t.y} ${i.map(({id:s})=>s)}`:h`// mouse-over a tile to inspect it`,this.#e)}setup(e){this.#e=e.addCtl(h`// mouse-over a tile to inspect it`),e.showModal(h`
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
    `),e.grid.createTile("at",{text:"@",tag:["solid","mind","keyMove"],pos:{x:10,y:10}}),this.colors.forEach((t,i)=>{e.grid.createTile(`fg-swatch-${t}`,{fg:`var(--${t})`,tag:["solid","swatch","fg"],text:"$",pos:{x:5,y:i}}),e.grid.createTile(`bg-swatch-${t}`,{bg:`var(--${t})`,tag:["solid","swatch","bg"],text:"$",pos:{x:15,y:i}})}),e.grid.centerViewOn({x:10,y:10})}act(e,t){if(!t.actor.classList.contains("solid"))return t;const i=e.grid.tilesAt(t.targ,"solid");if(!(t.ok=!i.length)){for(const s of i)if(s.classList.contains("swatch")){const r={};s.classList.contains("fg")?r.fg=s.style.color:s.classList.contains("bg")&&(r.bg=s.style.backgroundColor),e.grid.updateTile(t.actor,r)}}return t}update(e,t){const{x:i,y:s}=e.grid.getTilePosition("at"),{x:r,y:o}=e.grid.tileSize,{x:a,y:n,width:l,height:c}=e.grid.viewport;e.setStatus(h`player@${i},${s}+${r}+${o} view@${a},${n}+${Math.floor(l)}+${Math.floor(c)}`)}}p.demoName="ColorBoop",p.demoTitle="Boop a color, get a color";class f{constructor(){this.particleID=0,this.rate=5,this.turnLeft=.5,this.turnRight=.5,this.stepLimit=50,this.elapsed=0,this.pi=0,this.digSeq=new Map}setup(e){e.grid.createTile(`particle-${++this.particleID}`,{tag:["particle","init"],bg:"var(--black)",fg:"var(--dark-grey)",text:"."}),e.grid.centerViewOn({x:0,y:0}),this.doSettings(e)}doSettings(e){e.showModal(h`
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

          <input id="dla-turnLeft" type="range" min="0" max="1" step="0.01" value="${this.turnLeft}" @change=${t=>{const{value:i}=t.target;this.turnLeft=parseFloat(i),this.doSettings(e)}}>
          <label for="dla-turnLeft">Left Turning Arc: upto Math.PI/${this.turnLeft}</label>
          <br>

          <input id="dla-turnRight" type="range" min="0" max="1" step="0.01" value="${this.turnRight}" @change=${t=>{const{value:i}=t.target;this.turnRight=parseFloat(i),this.doSettings(e)}}>
          <label for="dla-turnRight">Right Turning Radius: upto Math.PI/${this.turnRight}</label>
          <br>

          <input id="dla-rate" type="range" min="1" max="100" value="${this.rate}" @change=${t=>{const{value:i}=t.target;this.rate=parseFloat(i),this.doSettings(e)}}>
          <label for="dla-rate">Particle Move Rate: every ${this.rate}ms</label>
          <br>

          <button @click=${()=>{e.showModal(null);const t=e.addCtl(h`
              <button @click=${()=>{t?.parentNode?.removeChild(t),this.dropPlayer(e),this.rate=100,s()}}>Drop Player</button>
            `),i=e.addCtl(h``),s=()=>{if(!i)return;u(h`
                <input id="dla-rate" type="range" min="1" max="100" value="${this.rate}" @change=${r=>{const{value:o}=r.target;this.rate=parseFloat(o),s()}}>
                <label for="dla-rate">Particle Move Rate: every ${this.rate}ms</label>
              `,i)};s()}}>Run</button>
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
    `)}dropPlayer(e){e.grid.createTile("at",{text:"@",tag:["solid","mind","keyMove"],pos:{x:0,y:0}})}update(e,t){this.elapsed+=t;const i=Math.min(this.stepLimit,Math.floor(this.elapsed/this.rate));if(!i)return;this.elapsed-=i*this.rate;const s=e.grid.queryTiles("particle","live"),r=()=>{const o=e.grid.createTile(`particle-${++this.particleID}`,{tag:["particle","live"],fg:"var(--green)",text:"*"});e.setStatus(h`
        <label for="particleID">Particels:</label>
        <span id="particleID">${this.particleID}</span>
      `),s.push(o)};for(let o=0;o<i;++o,++this.pi){if(!s.length){r();continue}this.pi%=s.length;const a=s[this.pi];if(!a.classList.contains("live")){s.splice(this.pi,1);continue}let n=a.dataset.heading&&parseFloat(a.dataset.heading);n?(n+=Math.PI*Math.random()*(this.turnLeft+this.turnRight)-this.turnLeft,n%=2*Math.PI):n=Math.random()*2*Math.PI,a.dataset.heading=n.toString();const l=Math.cos(n),c=Math.sin(n),d=e.grid.getTilePosition(a);if(Math.abs(c)>Math.abs(l)?c<0?d.y--:d.y++:l<0?d.x--:d.x++,!e.grid.tilesAt(d,"particle").length){delete a.dataset.heading,e.grid.updateTile(a,{tag:["particle"],bg:"var(--black)",fg:"var(--grey)",text:".",pos:d}),s.splice(this.pi,1);continue}e.grid.moveTileTo(a,d),e.grid.queryTiles("keyMove").length||e.grid.nudgeViewTo(d,.2)}}act(e,t){if(!t.actor.classList.contains("solid"))return t;const i=e.grid.tilesAt(t.targ);if(i.length)i.some(s=>s.classList.contains("particle"))||(t.ok=!1);else{const s=t.actor.id,r=(this.digSeq.get(s)||0)+1;this.digSeq.set(s,r),e.grid.createTile(`particle-placed-${s}-${r}`,{tag:["particle"],bg:"var(--black)",fg:"var(--orange)",text:".",pos:t.targ})}return t}}f.demoName="DLA",f.demoTitle="Diffusion Limited Aggregation";async function L(){await T(window,"DOMContentLoaded");const e=document.querySelector("main");if(!e)throw new Error("no <main> element");const t=e.querySelector(".modal");if(!t)throw new Error("no <main> .modal");const i=e.querySelector(".grid");if(!i)throw new Error("no <main> .grid element");const s=document.querySelector("header");if(!s)throw new Error("no <header> element");const r=document.querySelector("footer");if(!r)throw new Error("no <footer> element");let o=!0;const a=new S([g,p,f],t,i,s,r,document.body);let n=await w(),l=0;for(;o;){a.update(l);const c=await w();l=c-n,n=c}}L();
