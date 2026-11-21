// Learnable patrol loops, waypoint pauses, investigation, pursuit, and shared detection pressure.
import { TILE } from './config.js';
import { seesTarget } from './vision.js';

const wrapAngle = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));
const moveToward = (guard, x, y, speed, dt) => {
  const dx = x - guard.x;
  const dy = y - guard.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) return true;
  const step = Math.min(distance, speed * dt);
  guard.x += dx / distance * step;
  guard.y += dy / distance * step;
  guard.angle = Math.atan2(dy, dx);
  return step >= distance - 0.5;
};

export function createGuards(level) {
  return level.guards.map((route) => ({
    name: route.name, route: route.route, waypoint: 1, pause: route.pause * 0.65, pauseLength: route.pause,
    x: route.route[0].x, y: route.route[0].y, angle: 0, halfAngle: Math.PI * 35 / 180,
    mode: 'patrol', investigate: null, chaseTimer: 0, seeing: false, suspicion: 0, patrolPhase: route.id * 2.4,
    bob: route.id * 1.2,
  }));
}

export function updateGuards(guards, world, player, level, dt, audio) {
  let detection = 0;
  let nearest = null;
  for (const guard of guards) {
    guard.patrolPhase += dt;
    guard.bob += dt * (guard.mode === 'patrol' ? 4 : 8);
    guard.seeing = seesTarget(world, guard, player, level.length);
    const dist = Math.hypot(player.x - guard.x, player.y - guard.y);
    const isVisible = guard.seeing;
    if (nearest === null || dist < nearest.distance) nearest = { distance: dist, name: guard.name };
    const light = player.hidden ? (player.crouch ? 0.10 : 0.25) : player.crouch ? 0.45 : 1;
    const motion = player.sprint ? 1.35 : 1;
    if (isVisible) {
      const meter = Math.max(0, 1 - dist / (level.length * TILE));
      detection = Math.max(detection, Math.min(1, 0.21 * meter * light * motion + guard.suspicion * 0.55));
      guard.suspicion = Math.min(1, guard.suspicion + dt * (0.45 + meter * 0.4) * light * motion);
      if (guard.mode !== 'chase') guard.mode = guard.suspicion > 0.22 ? 'suspicious' : 'patrol';
      if (guard.mode !== 'chase') {
        guard.investigate = null;
        guard.targetX = player.x;
        guard.targetY = player.y;
      }
    } else {
      guard.suspicion = Math.max(0, guard.suspicion - dt * (player.hidden ? 0.72 : 0.36));
      if (guard.mode === 'chase') {
        guard.chaseTimer -= dt;
        if (guard.chaseTimer <= 0) guard.mode = guard.investigate ? 'investigate' : 'patrol';
      } else if (guard.investigate) guard.mode = 'investigate';
      else guard.mode = guard.suspicion > 0.18 ? 'suspicious' : 'patrol';
      // Sprinting leaves a broad sound; ordinary steps are only heard nearby.
      const audible = player.noise > 0 && dist < TILE * (player.sprint ? 4.4 : player.crouch ? 0.7 : 1.45);
      if (audible && !guard.investigate && guard.mode !== 'chase') {
        guard.investigate = { x: player.x, y: player.y, timer: player.sprint ? 3.2 : 1.6 };
      }
    }
    if (guard.mode === 'suspicious' && isVisible) detection = Math.max(detection, 0.17 + guard.suspicion * 0.24);
    if (guard.mode === 'chase') detection = Math.max(detection, 0.68);
    if (guard.mode === 'investigate' && guard.investigate) guard.investigate.timer -= dt;

    if (guard.mode === 'chase') {
      moveToward(guard, player.x, player.y, 104, dt);
    } else if (guard.mode === 'investigate' && guard.investigate) {
      const arrived = moveToward(guard, guard.investigate.x, guard.investigate.y, 76, dt);
      if (arrived && guard.investigate.timer <= 0) { guard.investigate = null; guard.mode = 'patrol'; }
    } else {
      const waypoint = guard.route[guard.waypoint];
      if (guard.pause > 0) {
        guard.pause -= dt;
        guard.angle += Math.sin(guard.patrolPhase * 1.7) * dt * 0.6;
      } else if (moveToward(guard, waypoint.x, waypoint.y, 47, dt)) {
        guard.waypoint = (guard.waypoint + 1) % guard.route.length;
        guard.pause = guard.pauseLength;
      }
    }
    if (guard.suspicion > 0.78 && guard.mode !== 'chase') {
      guard.mode = 'chase';
      guard.chaseTimer = level.chase;
      guard.targetX = player.x;
      guard.targetY = player.y;
      audio.alarm();
    }
    if (guard.mode === 'chase' && dist < TILE * 0.45) player.caught = true;
  }
  return { detection: Math.min(1, detection), nearest };
}
