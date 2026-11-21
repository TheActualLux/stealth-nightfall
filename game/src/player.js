// Keeper movement, crouch/sprint noise, key pickup, and thrown-stone distractions.
import { TILE } from './config.js';
import { isBlocked, isCover, isShadow } from './world.js';

const PLAYER_RADIUS = 8;
const WALK = 116;
const CROUCH = 68;
const SPRINT = 186;

export function createPlayer(start) {
  return { x: start.x, y: start.y, radius: PLAYER_RADIUS, crouch: false, sprint: false, stamina: 1, footsteps: 0, keys: 0, stoneCooldown: 0, stone: null, caught: false };
}

export function movePlayer(player, world, input, dt, audio) {
  const horizontal = Number(input.down('KeyD', 'ArrowRight')) - Number(input.down('KeyA', 'ArrowLeft'));
  const vertical = Number(input.down('KeyS', 'ArrowDown')) - Number(input.down('KeyW', 'ArrowUp'));
  const magnitude = Math.hypot(horizontal, vertical) || 1;
  player.crouch = input.down('ShiftLeft', 'ShiftRight');
  player.sprint = input.down('Space') && !player.crouch && player.stamina > 0.04 && (horizontal !== 0 || vertical !== 0);
  const moving = horizontal !== 0 || vertical !== 0;
  const speed = player.crouch ? CROUCH : player.sprint ? SPRINT : WALK;
  let dx = horizontal / magnitude * speed * dt;
  let dy = vertical / magnitude * speed * dt;
  if (player.sprint) player.stamina = Math.max(0, player.stamina - dt * 0.22);
  else player.stamina = Math.min(1, player.stamina + dt * (player.crouch ? 0.2 : 0.13));

  const canMove = (x, y) => !isBlocked(world, x - player.radius, y - player.radius) && !isBlocked(world, x + player.radius, y - player.radius) && !isBlocked(world, x - player.radius, y + player.radius) && !isBlocked(world, x + player.radius, y + player.radius);
  if (canMove(player.x + dx, player.y)) player.x += dx;
  if (canMove(player.x, player.y + dy)) player.y += dy;
  player.noise = moving ? (player.crouch ? 0.18 : player.sprint ? 1.35 : 0.58) : 0;
  player.hidden = isCover(world, player.x, player.y) || isShadow(world, player.x, player.y);
  player.stoneCooldown = Math.max(0, player.stoneCooldown - dt);
  if (moving) {
    player.footsteps += dt * (player.sprint ? 3.2 : player.crouch ? 1.05 : 2.0);
    if (player.footsteps >= 1) {
      player.footsteps -= 1;
      audio.footstep(player.sprint ? 1 : player.crouch ? 0.3 : 0.65);
    }
  }
}

export function collectKeys(player, level) {
  for (const key of level.keys) {
    if (!key.found && Math.hypot(player.x - key.x, player.y - key.y) < TILE * 0.65) {
      key.found = true;
      player.keys += 1;
      return key;
    }
  }
  return null;
}

export function throwStone(player, pointer, audio, guards) {
  if (player.stoneCooldown > 0) return null;
  const dx = pointer.x - player.x;
  const dy = pointer.y - player.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 24) return null;
  const reach = TILE * 9;
  const target = { x: player.x + dx / distance * Math.min(reach, distance), y: player.y + dy / distance * Math.min(reach, distance) };
  player.stoneCooldown = 2.4;
  player.stone = { x: target.x, y: target.y, age: 0 };
  let nearest = null;
  for (const guard of guards) {
    const d = Math.hypot(guard.x - target.x, guard.y - target.y);
    if (nearest === null || d < nearest.distance) nearest = { guard, distance: d };
  }
  if (nearest && nearest.distance < TILE * 7) nearest.guard.investigate = { x: target.x, y: target.y, timer: 4.4 };
  audio.stone();
  return target;
}
