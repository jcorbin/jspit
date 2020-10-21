export function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}
export async function everyFrame(update) {
  let last = await nextFrame();
  let dt = 0;
  while (update(dt)) {
    const next = await nextFrame();
    dt = next - last, last = next;
  }
}
export function schedule(...parts) {
  const every = parts.map((part) => typeof part === "function" ? 0 : part.every);
  const then = parts.map((part) => typeof part === "function" ? part : part.then);
  const last = every.map(() => 0);
  return (dt) => {
    for (let i = 0; i < every.length; ++i) {
      let n = dt;
      if (every[i] > 0) {
        last[i] += dt / every[i];
        if (n = Math.floor(last[i]))
          last[i] -= n;
      }
      if (n && !then[i](n))
        return false;
    }
    return true;
  };
}
//# sourceMappingURL=anim.js.map
