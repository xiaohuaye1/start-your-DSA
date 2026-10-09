export const MIN_SIDEBAR = 180;
export const MAX_SIDEBAR = 420;

export function sidebarBounds(viewport, rail = 54, separator = 8) {
  return { min: MIN_SIDEBAR, max: Math.max(MIN_SIDEBAR, Math.min(MAX_SIDEBAR, viewport - rail - separator - 760)) };
}

export function defaultSidebarWidth(viewport) {
  return viewport <= 1120 ? 195 : viewport <= 1350 ? 210 : 222;
}

export function normalizeSidebarWidth(width) {
  return Number.isInteger(width) && width >= MIN_SIDEBAR && width <= MAX_SIDEBAR ? width : 0;
}

export function createSidebarResizer({ sidebar, handle, rail, width = 0, save, onError }) {
  let preferred = normalizeSidebarWidth(width), drag = null, revision = 0, savedRevision = 0;
  let pending = Promise.resolve();
  const bounds = () => sidebarBounds(innerWidth, rail.getBoundingClientRect().width, handle.getBoundingClientRect().width);
  const clamp = width => Math.round(Math.max(bounds().min, Math.min(bounds().max, width)));
  function render() {
    const actual = clamp(preferred || defaultSidebarWidth(innerWidth));
    sidebar.style.width = `${actual}px`;
    handle.setAttribute('aria-valuemin', bounds().min);
    handle.setAttribute('aria-valuemax', bounds().max);
    handle.setAttribute('aria-valuenow', actual);
    handle.setAttribute('aria-valuetext', `${actual} 像素`);
  }
  function change(width) { preferred = width; revision++; render(); }
  function persist() {
    const version = revision, width = preferred;
    if (savedRevision >= version) return pending;
    // Serialize writes, preserving the final position after rapid keyboard/drag changes.
    pending = pending.catch(() => {}).then(async () => {
      await save({ sidebar_width: width });
      savedRevision = version;
    });
    return pending;
  }
  const saveSafely = () => { persist().catch(onError); };
  function finish() {
    if (!drag) return;
    const pointer = drag.pointer;
    drag = null;
    handle.classList.remove('dragging');
    document.body.classList.remove('resizing-sidebar');
    if (handle.hasPointerCapture(pointer)) handle.releasePointerCapture(pointer);
    saveSafely();
  }
  handle.addEventListener('pointerdown', event => {
    if (event.button !== 0 || drag) return;
    event.preventDefault(); handle.focus();
    drag = { pointer: event.pointerId, x: event.clientX, width: sidebar.getBoundingClientRect().width };
    handle.setPointerCapture(event.pointerId);
    handle.classList.add('dragging'); document.body.classList.add('resizing-sidebar');
  });
  handle.addEventListener('pointermove', event => {
    if (drag && drag.pointer === event.pointerId) change(clamp(drag.width + event.clientX - drag.x));
  });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) handle.addEventListener(event, finish);
  window.addEventListener('blur', finish);
  handle.addEventListener('dblclick', () => { change(0); saveSafely(); });
  handle.addEventListener('keydown', event => {
    const current = sidebar.getBoundingClientRect().width, step = event.shiftKey ? 30 : 10;
    const widths = { ArrowLeft: clamp(current - step), ArrowRight: clamp(current + step),
      Home: bounds().min, End: bounds().max, Enter: 0 };
    if (!(event.key in widths)) return;
    event.preventDefault(); change(widths[event.key]); saveSafely();
  });
  window.addEventListener('resize', render); // Clamp visually, but retain the preference for a larger window.
  render();
  return { flush: () => { finish(); return persist(); } };
}
