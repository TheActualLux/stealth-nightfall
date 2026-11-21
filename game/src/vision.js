// Guard field-of-view and grid-stepped line-of-sight tests.
import { TILE } from './config.js';
import { blocksSight } from './world.js';

export function lineOfSight(world, fromX, fromY, toX, toY) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const distance = Math.hypot(dx, dy);
  const steps = Math.ceil(distance / (TILE * 0.22));
  for (let step = 1; step < steps; step += 1) {
    const t = step / steps;
    if (blocksSight(world, fromX + dx * t, fromY + dy * t)) return false;
  }
  return true;
}

export function seesTarget(world, guard, target, lengthTiles) {
  const dx = target.x - guard.x;
  const dy = target.y - guard.y;
  const distance = Math.hypot(dx, dy);
  if (distance > lengthTiles * TILE || distance < 1) return false;
  let difference = Math.atan2(Math.sin(Math.atan2(dy, dx) - guard.angle), Math.cos(Math.atan2(dy, dx) - guard.angle));
  if (Math.abs(difference) > guard.halfAngle) return false;
  return lineOfSight(world, guard.x, guard.y, target.x, target.y);
}
