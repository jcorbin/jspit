export class KeyMap extends Map {
  #handler;
  constructor(target, filter) {
    super();
    this.#handler = this.handleEvent.bind(this);
    this.filter = filter;
    this.target = target;
    this.target.addEventListener("keydown", this.#handler);
    this.target.addEventListener("keyup", this.#handler);
  }
  countKey({altKey, ctrlKey, metaKey, shiftKey, key}) {
    const name = `${altKey ? "A-" : ""}${ctrlKey ? "C-" : ""}${metaKey ? "M-" : ""}${shiftKey ? "S-" : ""}${key}`;
    const n = this.get(name) || 0;
    this.set(name, n + 1);
  }
  handleEvent(event) {
    if (event.type !== "keyup" && event.type !== "keydown")
      return;
    const keyEvent = event;
    if (this.filter && !this.filter(keyEvent))
      return;
    this.countKey(keyEvent);
    event.stopPropagation();
    event.preventDefault();
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
function parseMoveKey(key) {
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
export function coalesceMoves(presses) {
  return presses.map(([key, _count]) => parseMoveKey(key)).reduce((acc, move) => {
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
