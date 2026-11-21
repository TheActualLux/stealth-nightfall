// Shutterable corridor lanterns and their delayed guard relighting.
import { TILE } from './config.js';

export const LANTERN_INTERACTION_RANGE = TILE * 1.3;
export const LANTERN_SHADOW_RANGE = TILE * 4.5;
export const LANTERN_SHADOW_HALF_ANGLE = Math.PI * 0.36;

export function createLanterns(level) {
  return level.lanterns.map((lantern) => ({ ...lantern, relightTimer: 0 }));
}

export function findNearbyLantern(x, y, lanterns, maxDistance = LANTERN_INTERACTION_RANGE) {
  let nearest = null;
  for (const lantern of lanterns) {
    const distance = Math.hypot(x - lantern.x, y - lantern.y);
    if (distance <= maxDistance && (nearest === null || distance < nearest.distance)) nearest = { lantern, distance };
  }
  return nearest?.lantern ?? null;
}

export function toggleNearbyLantern(player, lanterns) {
  const lantern = findNearbyLantern(player.x, player.y, lanterns);
  if (!lantern) return null;
  lantern.lit = !lantern.lit;
  lantern.relightTimer = 0;
  return lantern;
}

export function lanternShadowContains(lantern, x, y) {
  if (lantern.lit) return false;
  const dx = x - lantern.x;
  const dy = y - lantern.y;
  const distance = Math.hypot(dx, dy);
  if (distance > LANTERN_SHADOW_RANGE || distance < 1) return distance < 1;
  const angle = Math.atan2(dy, dx);
  const difference = Math.atan2(Math.sin(angle - lantern.facing), Math.cos(angle - lantern.facing));
  return Math.abs(difference) <= LANTERN_SHADOW_HALF_ANGLE;
}

export function isInsideLanternShadow(x, y, lanterns) {
  return lanterns.some((lantern) => lanternShadowContains(lantern, x, y));
}

export function updateLanternRelights(lanterns, guards, dt, audio) {
  for (const lantern of lanterns) {
    if (lantern.lit) continue;
    const guardIsClose = guards.some((guard) => Math.hypot(guard.x - lantern.x, guard.y - lantern.y) <= TILE);
    if (!guardIsClose) {
      lantern.relightTimer = 0;
      continue;
    }
    lantern.relightTimer += dt;
    if (lantern.relightTimer >= 0.95) {
      lantern.lit = true;
      lantern.relightTimer = 0;
      audio.clank();
    }
  }
}
