/* The cursor: a small gilt star that sits exactly on the pointer, with no trailing parts.
   It gains a ring over anything clickable, and carries a faint candlelight
   with it across the dark pages. Only for a mouse, and never with reduced motion. */
(() => {
  if (!matchMedia("(pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.documentElement.classList.add("fancy-cursor");
  const cur = document.getElementById("cursor"), light = document.getElementById("cLight");
  let x = -100, y = -100, queued = false;
  const paint = () => {
    queued = false;
    cur.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    light.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    x = e.clientX; y = e.clientY;
    if (!queued) { queued = true; requestAnimationFrame(paint); }
    cur.classList.remove("gone");
    const t = e.target;
    const zoom = t.closest?.("[data-zoom]");
    const hover = !zoom && t.closest?.("a, button, [data-search], [data-to], [data-go], [data-en], label, .ribbon, .pin");
    const read = !hover && !zoom && t.closest?.(".folio, .cmp-col");
    cur.classList.toggle("zoom", !!zoom);
    cur.classList.toggle("hover", !!hover);
    cur.classList.toggle("read", !!read);
    light.classList.toggle("off", !!read);
  }, { passive: true });
  addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") return;
    cur.classList.add("down");
  });
  addEventListener("pointerup", () => cur.classList.remove("down"));
  document.addEventListener("mouseleave", () => cur.classList.add("gone"));
})();
