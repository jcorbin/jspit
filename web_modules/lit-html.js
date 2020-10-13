/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */const F=new WeakMap,T=e=>typeof e=="function"&&F.has(e);/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */const S=typeof window!="undefined"&&window.customElements!=null&&window.customElements.polyfillWrapFlushCallback!==void 0,P=(e,t,n=null)=>{for(;t!==n;){const s=t.nextSibling;e.removeChild(t),t=s}};/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */const h={},C={};/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */const c=`{{lit-${String(Math.random()).slice(2)}}}`,k=`<!--${c}-->`,I=new RegExp(`${c}|${k}`),v="$lit$";class W{constructor(e,t){this.parts=[],this.element=t;const n=[],s=[],i=document.createTreeWalker(t.content,133,null,!1);let l=0,o=-1,r=0;const{strings:w,values:{length:U}}=e;for(;r<U;){const a=i.nextNode();if(a===null){i.currentNode=s.pop();continue}if(o++,a.nodeType===1){if(a.hasAttributes()){const d=a.attributes,{length:x}=d;let f=0;for(let u=0;u<x;u++)O(d[u].name,v)&&f++;for(;f-- >0;){const u=w[r],b=N.exec(u)[2],y=b.toLowerCase()+v,g=a.getAttribute(y);a.removeAttribute(y);const p=g.split(I);this.parts.push({type:"attribute",index:o,name:b,strings:p}),r+=p.length-1}}a.tagName==="TEMPLATE"&&(s.push(a),i.currentNode=a.content)}else if(a.nodeType===3){const d=a.data;if(d.indexOf(c)>=0){const x=a.parentNode,f=d.split(I),u=f.length-1;for(let b=0;b<u;b++){let y,g=f[b];if(g==="")y=m();else{const p=N.exec(g);p!==null&&O(p[2],v)&&(g=g.slice(0,p.index)+p[1]+p[2].slice(0,-v.length)+p[3]),y=document.createTextNode(g)}x.insertBefore(y,a),this.parts.push({type:"node",index:++o})}f[u]===""?(x.insertBefore(m(),a),n.push(a)):a.data=f[u],r+=u}}else if(a.nodeType===8)if(a.data===c){const d=a.parentNode;(a.previousSibling===null||o===l)&&(o++,d.insertBefore(m(),a)),l=o,this.parts.push({type:"node",index:o}),a.nextSibling===null?a.data="":(n.push(a),o--),r++}else{let d=-1;for(;(d=a.data.indexOf(c,d+1))!==-1;)this.parts.push({type:"node",index:-1}),r++}}for(const a of n)a.parentNode.removeChild(a)}}const O=(e,t)=>{const n=e.length-t.length;return n>=0&&e.slice(n)===t},$=e=>e.index!==-1,m=()=>document.createComment(""),N=/([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F "'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/;/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */class R{constructor(e,t,n){this.__parts=[],this.template=e,this.processor=t,this.options=n}update(e){let t=0;for(const n of this.__parts)n!==void 0&&n.setValue(e[t]),t++;for(const n of this.__parts)n!==void 0&&n.commit()}_clone(){const e=S?this.template.element.content.cloneNode(!0):document.importNode(this.template.element.content,!0),t=[],n=this.template.parts,s=document.createTreeWalker(e,133,null,!1);let i=0,l=0,o,r=s.nextNode();for(;i<n.length;){if(o=n[i],!$(o)){this.__parts.push(void 0),i++;continue}for(;l<o.index;)l++,r.nodeName==="TEMPLATE"&&(t.push(r),s.currentNode=r.content),(r=s.nextNode())===null&&(s.currentNode=t.pop(),r=s.nextNode());if(o.type==="node"){const w=this.processor.handleTextExpression(this.options);w.insertAfterNode(r.previousSibling),this.__parts.push(w)}else this.__parts.push(...this.processor.handleAttributeExpressions(r,o.name,o.strings,this.options));i++}return S&&(document.adoptNode(e),customElements.upgrade(e)),e}}/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */const M=window.trustedTypes&&trustedTypes.createPolicy("lit-html",{createHTML:e=>e}),G=` ${c} `;class j{constructor(e,t,n,s){this.strings=e,this.values=t,this.type=n,this.processor=s}getHTML(){const e=this.strings.length-1;let t="",n=!1;for(let s=0;s<e;s++){const i=this.strings[s],l=i.lastIndexOf("<!--");n=(l>-1||n)&&i.indexOf("-->",l+1)===-1;const o=N.exec(i);o===null?t+=i+(n?G:k):t+=i.substr(0,o.index)+o[1]+o[2]+v+o[3]+c}return t+=this.strings[e],t}getTemplateElement(){const e=document.createElement("template");let t=this.getHTML();return M!==void 0&&(t=M.createHTML(t)),e.innerHTML=t,e}}/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */const _=e=>e===null||!(typeof e=="object"||typeof e=="function"),A=e=>Array.isArray(e)||!!(e&&e[Symbol.iterator]);class L{constructor(e,t,n){this.dirty=!0,this.element=e,this.name=t,this.strings=n,this.parts=[];for(let s=0;s<n.length-1;s++)this.parts[s]=this._createPart()}_createPart(){return new V(this)}_getValue(){const e=this.strings,t=e.length-1,n=this.parts;if(t===1&&e[0]===""&&e[1]===""){const i=n[0].value;if(typeof i=="symbol")return String(i);if(typeof i=="string"||!A(i))return i}let s="";for(let i=0;i<t;i++){s+=e[i];const l=n[i];if(l!==void 0){const o=l.value;if(_(o)||!A(o))s+=typeof o=="string"?o:String(o);else for(const r of o)s+=typeof r=="string"?r:String(r)}}return s+=e[t],s}commit(){this.dirty&&(this.dirty=!1,this.element.setAttribute(this.name,this._getValue()))}}class V{constructor(e){this.value=void 0,this.committer=e}setValue(e){e!==h&&(!_(e)||e!==this.value)&&(this.value=e,T(e)||(this.committer.dirty=!0))}commit(){for(;T(this.value);){const e=this.value;this.value=h,e(this)}if(this.value===h)return;this.committer.commit()}}class E{constructor(e){this.value=void 0,this.__pendingValue=void 0,this.options=e}appendInto(e){this.startNode=e.appendChild(m()),this.endNode=e.appendChild(m())}insertAfterNode(e){this.startNode=e,this.endNode=e.nextSibling}appendIntoPart(e){e.__insert(this.startNode=m()),e.__insert(this.endNode=m())}insertAfterPart(e){e.__insert(this.startNode=m()),this.endNode=e.endNode,e.endNode=this.startNode}setValue(e){this.__pendingValue=e}commit(){if(this.startNode.parentNode===null)return;for(;T(this.__pendingValue);){const t=this.__pendingValue;this.__pendingValue=h,t(this)}const e=this.__pendingValue;if(e===h)return;_(e)?e!==this.value&&this.__commitText(e):e instanceof j?this.__commitTemplateResult(e):e instanceof Node?this.__commitNode(e):A(e)?this.__commitIterable(e):e===C?(this.value=C,this.clear()):this.__commitText(e)}__insert(e){this.endNode.parentNode.insertBefore(e,this.endNode)}__commitNode(e){if(this.value===e)return;this.clear(),this.__insert(e),this.value=e}__commitText(e){const t=this.startNode.nextSibling;e=e??"";const n=typeof e=="string"?e:String(e);t===this.endNode.previousSibling&&t.nodeType===3?t.data=n:this.__commitNode(document.createTextNode(n)),this.value=e}__commitTemplateResult(e){const t=this.options.templateFactory(e);if(this.value instanceof R&&this.value.template===t)this.value.update(e.values);else{const n=new R(t,e.processor,this.options),s=n._clone();n.update(e.values),this.__commitNode(s),this.value=n}}__commitIterable(e){Array.isArray(this.value)||(this.value=[],this.clear());const t=this.value;let n=0,s;for(const i of e)s=t[n],s===void 0&&(s=new E(this.options),t.push(s),n===0?s.appendIntoPart(this):s.insertAfterPart(t[n-1])),s.setValue(i),s.commit(),n++;n<t.length&&(t.length=n,this.clear(s&&s.endNode))}clear(e=this.startNode){P(this.startNode.parentNode,e.nextSibling,this.endNode)}}class q{constructor(e,t,n){if(this.value=void 0,this.__pendingValue=void 0,n.length!==2||n[0]!==""||n[1]!=="")throw new Error("Boolean attributes can only contain a single expression");this.element=e,this.name=t,this.strings=n}setValue(e){this.__pendingValue=e}commit(){for(;T(this.__pendingValue);){const t=this.__pendingValue;this.__pendingValue=h,t(this)}if(this.__pendingValue===h)return;const e=!!this.__pendingValue;this.value!==e&&(e?this.element.setAttribute(this.name,""):this.element.removeAttribute(this.name),this.value=e),this.__pendingValue=h}}class z extends L{constructor(e,t,n){super(e,t,n);this.single=n.length===2&&n[0]===""&&n[1]===""}_createPart(){return new X(this)}_getValue(){return this.single?this.parts[0].value:super._getValue()}commit(){this.dirty&&(this.dirty=!1,this.element[this.name]=this._getValue())}}class X extends V{}let H=!1;(()=>{try{const e={get capture(){return H=!0,!1}};window.addEventListener("test",e,e),window.removeEventListener("test",e,e)}catch(e){}})();class K{constructor(e,t,n){this.value=void 0,this.__pendingValue=void 0,this.element=e,this.eventName=t,this.eventContext=n,this.__boundHandleEvent=s=>this.handleEvent(s)}setValue(e){this.__pendingValue=e}commit(){for(;T(this.__pendingValue);){const i=this.__pendingValue;this.__pendingValue=h,i(this)}if(this.__pendingValue===h)return;const e=this.__pendingValue,t=this.value,n=e==null||t!=null&&(e.capture!==t.capture||e.once!==t.once||e.passive!==t.passive),s=e!=null&&(t==null||n);n&&this.element.removeEventListener(this.eventName,this.__boundHandleEvent,this.__options),s&&(this.__options=J(e),this.element.addEventListener(this.eventName,this.__boundHandleEvent,this.__options)),this.value=e,this.__pendingValue=h}handleEvent(e){typeof this.value=="function"?this.value.call(this.eventContext||this.element,e):this.value.handleEvent(e)}}const J=e=>e&&(H?{capture:e.capture,passive:e.passive,once:e.once}:e.capture);/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */class Q{handleAttributeExpressions(e,t,n,s){const i=t[0];if(i==="."){const o=new z(e,t.slice(1),n);return o.parts}if(i==="@")return[new K(e,t.slice(1),s.eventContext)];if(i==="?")return[new q(e,t.slice(1),n)];const l=new L(e,t,n);return l.parts}handleTextExpression(e){return new E(e)}}const Y=new Q;/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */function Z(e){let t=B.get(e.type);t===void 0&&(t={stringsArray:new WeakMap,keyString:new Map},B.set(e.type,t));let n=t.stringsArray.get(e.strings);if(n!==void 0)return n;const s=e.strings.join(c);return n=t.keyString.get(s),n===void 0&&(n=new W(e,e.getTemplateElement()),t.keyString.set(s,n)),t.stringsArray.set(e.strings,n),n}const B=new Map;/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */const D=new WeakMap,ee=(e,t,n)=>{let s=D.get(t);s===void 0&&(P(t,t.firstChild),D.set(t,s=new E(Object.assign({templateFactory:Z},n))),s.appendInto(t)),s.setValue(e),s.commit()};/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */typeof window!="undefined"&&(window.litHtmlVersions||(window.litHtmlVersions=[])).push("1.3.0");const te=(e,...t)=>new j(e,t,"html",Y);export{te as html,ee as render};
