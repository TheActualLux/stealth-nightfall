// Shared world dimensions and the restrained palette for Nightfall Rookery.
export const WIDTH = 960;
export const HEIGHT = 640;
export const TILE = 34;
export const COLS = 26;
export const ROWS = 18;
export const MAP_X = (WIDTH - COLS * TILE) / 2;
export const MAP_Y = (HEIGHT - ROWS * TILE) / 2;
export const TAU = Math.PI * 2;
export const PALETTE = {
  ink: '#071516', night: '#0b2020', grass: '#102927', grass2: '#15332f',
  path: '#35433a', pathLight: '#485145', hedge: '#21463a', hedgeDark: '#17372f',
  wall: '#596155', stone: '#85836d', pond: '#102d36', water: '#1c4a51',
  amber: '#f3bd65', pale: '#f4e8c8', player: '#d8e3c0', red: '#ef6654',
  muted: '#99aaa0', panel: 'rgba(7, 19, 20, .91)', line: 'rgba(219, 225, 196, .15)',
};
export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
