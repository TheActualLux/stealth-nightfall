// Authored patrol loops and key placements for each chapter of the garden.
import { MAP_X, MAP_Y, TILE } from './config.js';

const at = (col, row) => ({ x: MAP_X + (col + 0.5) * TILE, y: MAP_Y + (row + 0.5) * TILE });
const wallLantern = (col, row, facing) => ({ ...at(col, row), facing, lit: true });

export const LEVELS = [
  {
    name: 'The Gravel Walk', subtitle: 'A quiet crossing', keys: [], lanterns: [wallLantern(3, 7, Math.PI / 2)], guards: [
      { name: 'Mara', route: [[3, 8], [8, 8], [8, 6], [8, 8]], pause: 0.8 },
      { name: 'Ivo', route: [[15, 13], [20, 13], [20, 10], [20, 13]], pause: 1.1 },
      { name: 'Sedge', route: [[5, 4], [8, 4], [8, 6], [7, 7], [5, 7]], pause: 0.65 },
      { name: 'Pell', route: [[15, 8], [23, 8], [23, 10], [23, 8]], pause: 0.9 },
    ], length: 6.2, suspicion: 2.25, chase: 3.3,
  },
  {
    name: 'The Glasshouse', subtitle: 'Three brass teeth, one at a time', keys: [[10, 11]], lanterns: [wallLantern(6, 7, Math.PI / 2), wallLantern(18, 12, Math.PI / 2), wallLantern(11, 5, 0)], guards: [
      { name: 'Mara', route: [[3, 8], [8, 8], [8, 6], [8, 8]], pause: 0.7 },
      { name: 'Ivo', route: [[15, 13], [20, 13], [20, 10], [20, 13]], pause: 0.9 },
      { name: 'Sedge', route: [[5, 4], [8, 4], [8, 6], [7, 7], [5, 7]], pause: 0.55 },
      { name: 'Pell', route: [[15, 8], [23, 8], [23, 10], [23, 8]], pause: 0.7 },
      { name: 'Wren', route: [[13, 2], [13, 6], [13, 2]], pause: 0.8 },
    ], length: 6.7, suspicion: 1.9, chase: 3.5,
  },
  {
    name: 'The Rookery Gate', subtitle: 'Two keys remain. Keep to the shadows.', keys: [[2, 11], [14, 7]], lanterns: [wallLantern(6, 7, Math.PI / 2), wallLantern(18, 12, Math.PI / 2), wallLantern(11, 5, 0)], guards: [
      { name: 'Mara', route: [[3, 8], [8, 8], [8, 6], [8, 8]], pause: 0.55 },
      { name: 'Ivo', route: [[15, 13], [20, 13], [20, 10], [20, 13]], pause: 0.65 },
      { name: 'Sedge', route: [[5, 4], [8, 4], [8, 6], [7, 7], [5, 7]], pause: 0.45 },
      { name: 'Pell', route: [[15, 8], [23, 8], [23, 10], [23, 8]], pause: 0.55 },
      { name: 'Wren', route: [[13, 2], [13, 6], [13, 2]], pause: 0.75 },
      { name: 'Rook', route: [[12, 10], [12, 7], [12, 4], [12, 7]], pause: 0.6 },
    ], length: 7.2, suspicion: 1.65, chase: 3.8,
  },
].map((level) => ({
  ...level,
  guards: level.guards.map((guard, index) => ({
    ...guard, id: index, route: guard.route.map(([col, row]) => at(col, row)),
  })),
  keys: level.keys.map(([col, row], id) => ({ id, ...at(col, row), found: false })),
  lanterns: level.lanterns.map((lantern, id) => ({ ...lantern, id })),
  playerStart: at(1, 15),
  gate: at(25, 8),
}));
