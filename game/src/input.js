// Keyboard and pointer state with queued one-shot actions for the main loop.
export const ACT_START = 1;
export const ACT_PAUSE = 2;
export const ACT_RESTART = 4;
export const ACT_MUTE = 8;
export const ACT_STONE = 16;
export const ACT_LEVEL_1 = 32;
export const ACT_LEVEL_2 = 64;
export const ACT_LEVEL_3 = 128;
export const ACT_LANTERN = 256;

export function createInput(canvas) {
  const held = new Set();
  let actions = 0;
  let pointer = { x: 480, y: 320 };
  const updatePointer = (event) => {
    const bounds = canvas.getBoundingClientRect();
    pointer = { x: (event.clientX - bounds.left) * 960 / bounds.width, y: (event.clientY - bounds.top) * 640 / bounds.height };
  };
  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault();
    held.add(event.code);
    if (event.repeat) return;
    if (event.code === 'Enter') actions |= ACT_START;
    else if (event.code === 'Digit1' || event.code === 'Numpad1') actions |= ACT_LEVEL_1;
    else if (event.code === 'Digit2' || event.code === 'Numpad2') actions |= ACT_LEVEL_2;
    else if (event.code === 'Digit3' || event.code === 'Numpad3') actions |= ACT_LEVEL_3;
    else if (event.code === 'Escape' || event.code === 'KeyP') actions |= ACT_PAUSE;
    else if (event.code === 'KeyR') actions |= ACT_RESTART;
    else if (event.code === 'KeyM') actions |= ACT_MUTE;
    else if (event.code === 'KeyQ') actions |= ACT_STONE;
    else if (event.code === 'KeyE') actions |= ACT_LANTERN;
  });
  window.addEventListener('keyup', (event) => held.delete(event.code));
  window.addEventListener('blur', () => held.clear());
  canvas.addEventListener('pointermove', updatePointer);
  canvas.addEventListener('pointerdown', (event) => {
    updatePointer(event);
    if (event.button === 2) actions |= ACT_STONE;
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  return {
    down(...codes) { return codes.some((code) => held.has(code)); },
    pointer() { return pointer; },
    takeActions() { const result = actions; actions = 0; return result; },
  };
}
