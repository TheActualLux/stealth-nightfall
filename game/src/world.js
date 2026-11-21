// Garden tile layout, cover, collisions, and the geometry shared by sight and movement.
import { COLS, MAP_X, MAP_Y, ROWS, TILE } from './config.js';

const id = (col, row) => `${col},${row}`;
const rect = (col, row, width = 1, height = 1, kind = 'hedge') => ({ col, row, width, height, kind });

export function createWorld(levelIndex) {
  const solids = new Set();
  const covers = new Set();
  const features = [];
  const paths = new Set();
  const ponds = new Set();
  const shadows = new Set();
  const addSolid = (col, row, cover = false) => {
    solids.add(id(col, row));
    if (cover) covers.add(id(col, row));
  };
  const addPatch = (col, row, width, height, kind, solid = false, cover = false) => {
    features.push(rect(col, row, width, height, kind));
    if (solid) for (let y = row; y < row + height; y += 1) for (let x = col; x < col + width; x += 1) addSolid(x, y, cover);
  };

  for (let col = 0; col < COLS; col += 1) { addSolid(col, 0); addSolid(col, ROWS - 1); }
  for (let row = 0; row < ROWS; row += 1) { addSolid(0, row); addSolid(COLS - 1, row); }
  solids.delete(id(COLS - 1, 8)); // The rookery gate is an opening in the east wall.
  for (let col = 1; col < COLS - 1; col += 1) {
    paths.add(id(col, 8));
    if (col >= 2 && col <= 21) paths.add(id(col, 13));
  }
  for (let row = 1; row < ROWS - 1; row += 1) {
    paths.add(id(2, row));
    paths.add(id(12, row));
    paths.add(id(20, row));
  }

  // Lily pools and low garden walls are fixed landmarks, visible in every chapter.
  for (let y = 2; y <= 4; y += 1) for (let x = 15; x <= 17; x += 1) ponds.add(id(x, y));
  for (let y = 11; y <= 12; y += 1) for (let x = 5; x <= 7; x += 1) ponds.add(id(x, y));
  addPatch(15, 5, 4, 2, 'glasshouse', true, true);
  addPatch(4, 2, 2, 2, 'tower', true, true);
  addPatch(5, 9, 3, 1, 'lowwall', true, true);
  addPatch(16, 10, 4, 1, 'lowwall', true, true);
  addPatch(9, 2, 1, 3, 'hedge', true, true);
  addPatch(4, 5, 1, 2, 'hedge', true, true);
  addPatch(7, 5, 1, 2, 'hedge', true, true);
  addPatch(3, 10, 1, 3, 'hedge', true, true);
  addPatch(8, 11, 1, 2, 'hedge', true, true);
  addPatch(22, 3, 1, 3, 'hedge', true, true);
  addPatch(22, 11, 1, 3, 'hedge', true, true);
  addPatch(22, 14, 2, 1, 'hedge', true, true);
  // Crates make pockets of hard cover near each crossing.
  addPatch(10, 10, 1, 1, 'crate', true, true);
  addPatch(17, 9, 1, 1, 'crate', true, true);
  addPatch(6, 14, 1, 1, 'crate', true, true);
  addPatch(23, 6, 1, 1, 'crate', true, true);

  // Deep shadow pockets are passable and hide a crouched keeper from a cone.
  for (const [col, row] of [[1, 14], [4, 14], [10, 7], [14, 9], [18, 14], [21, 7], [24, 9], [11, 14], [2, 5]]) shadows.add(id(col, row));
  if (levelIndex > 0) {
    // Later chapters have less forgiving cover: two hedge corners are opened, crates removed.
    solids.delete(id(7, 5)); covers.delete(id(7, 5));
    if (levelIndex > 1) {
      solids.delete(id(4, 5)); covers.delete(id(4, 5));
      solids.delete(id(17, 9)); covers.delete(id(17, 9));
      addPatch(14, 11, 1, 2, 'hedge', true, true);
    }
  }

  return { solids, covers, paths, ponds, shadows, features, levelIndex };
}

export function tileAt(x, y) {
  return { col: Math.floor((x - MAP_X) / TILE), row: Math.floor((y - MAP_Y) / TILE) };
}

export function tileCenter(col, row) {
  return { x: MAP_X + (col + 0.5) * TILE, y: MAP_Y + (row + 0.5) * TILE };
}

export function isBlocked(world, x, y) {
  const { col, row } = tileAt(x, y);
  return col < 0 || row < 0 || col >= COLS || row >= ROWS || world.solids.has(id(col, row)) || world.ponds.has(id(col, row));
}

export function isCover(world, x, y) {
  if (isShadow(world, x, y)) return true;
  const { col, row } = tileAt(x, y);
  // Cover includes the lee of solid hedges, walls, and crates, not their impassable interiors.
  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
      if (!world.covers.has(id(col + colOffset, row + rowOffset))) continue;
      const centerX = MAP_X + (col + colOffset + 0.5) * TILE;
      const centerY = MAP_Y + (row + rowOffset + 0.5) * TILE;
      const gapX = Math.max(0, Math.abs(x - centerX) - TILE / 2);
      const gapY = Math.max(0, Math.abs(y - centerY) - TILE / 2);
      if (Math.hypot(gapX, gapY) < 18) return true;
    }
  }
  return false;
}

export function isShadow(world, x, y) {
  const { col, row } = tileAt(x, y);
  return world.shadows.has(id(col, row));
}

export function blocksSight(world, x, y) {
  const { col, row } = tileAt(x, y);
  return col < 0 || row < 0 || col >= COLS || row >= ROWS || world.solids.has(id(col, row)) || world.ponds.has(id(col, row));
}

export function cellKey(col, row) { return id(col, row); }
