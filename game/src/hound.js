// The kennel hound: asleep until noise wakes it, then it follows the keeper's own scent trail.
// It never sees you; it only ever knows where you have been, which is why crouching and
// standing still are the two ways to make it lose the thread.
import { TILE } from './config.js';

const SCENT_SPACING = TILE * 0.55;
const WAKE_RADIUS = TILE * 4.6;
const TRAIL_MEMORY = 7;

export function createHounds(level) {
  return (level.hounds ?? []).map((spot, id) => ({
    id, x: spot.x, y: spot.y, homeX: spot.x, homeY: spot.y,
    state: 'asleep', angle: spot.facing ?? 0, bob: id * 1.7, timer: 0,
    trail: [], barkCooldown: 0,
  }));
}

function dropScent(hound, player) {
  const last = hound.trail[hound.trail.length - 1];
  if (!last || Math.hypot(player.x - last.x, player.y - last.y) > SCENT_SPACING) {
    hound.trail.push({ x: player.x, y: player.y, age: 0 });
  }
}

function followScent(hound, player, dt) {
  for (const step of hound.trail) step.age += dt;
  while (hound.trail.length && hound.trail[0].age > TRAIL_MEMORY) hound.trail.shift();
  const target = hound.trail[0];
  if (!target) return false;
  const dx = target.x - hound.x;
  const dy = target.y - hound.y;
  const distance = Math.hypot(dx, dy);
  hound.angle = Math.atan2(dy, dx);
  if (distance < 3) { hound.trail.shift(); return true; }
  const step = Math.min(distance, 78 * dt);
  hound.x += (dx / distance) * step;
  hound.y += (dy / distance) * step;
  return false;
}

export function updateHounds(hounds, player, dt, audio) {
  let alarm = 0;
  for (const hound of hounds) {
    hound.bob += dt * (hound.state === 'awake' ? 9 : 2);
    hound.barkCooldown = Math.max(0, hound.barkCooldown - dt);
    const distance = Math.hypot(player.x - hound.x, player.y - hound.y);
    // A sprint, a thrown stone or a shuttered lantern close by carries to the kennel.
    const noise = player.sprint ? 1 : player.noise > 0 ? 0.55 : 0;
    if (hound.state === 'asleep' && distance < WAKE_RADIUS && noise > 0) {
      hound.state = 'awake';
      hound.timer = 9;
      hound.trail = [{ x: player.x, y: player.y, age: 0 }];
      if (hound.barkCooldown === 0) { audio.bark(); hound.barkCooldown = 2.4; }
    }
    if (hound.state === 'awake') {
      hound.timer -= dt;
      dropScent(hound, player);
      followScent(hound, player, dt);
      alarm = Math.max(alarm, 0.34);
      if (hound.barkCooldown === 0 && distance < TILE * 3.2) { audio.bark(); hound.barkCooldown = 1.8; }
      if (distance < TILE * 0.5) player.caught = true;
      if (hound.timer <= 0 && hound.trail.length === 0) hound.state = 'returning';
    } else if (hound.state === 'returning') {
      const dx = hound.homeX - hound.x;
      const dy = hound.homeY - hound.y;
      const back = Math.hypot(dx, dy);
      hound.angle = Math.atan2(dy, dx);
      if (back < 3) hound.state = 'asleep';
      else { const step = Math.min(back, 46 * dt); hound.x += (dx / back) * step; hound.y += (dy / back) * step; }
    }
  }
  return alarm;
}

export function drawHounds(ctx, hounds, time) {
  for (const hound of hounds) {
    if (hound.state === 'awake') {
      ctx.save();
      ctx.strokeStyle = 'rgba(239, 128, 96, .16)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(hound.x, hound.y, TILE * 2.2, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(239, 128, 96, .12)';
      for (const step of hound.trail) { ctx.beginPath(); ctx.arc(step.x, step.y, 2.4, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
    ctx.save();
    ctx.translate(hound.x, hound.y + Math.sin(hound.bob) * 0.8);
    ctx.rotate(hound.angle);
    ctx.fillStyle = 'rgba(0, 0, 0, .42)';
    ctx.beginPath(); ctx.ellipse(0, 5, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
    // A curled dog reads as an animal at a glance: haunch, chest, muzzle, tail and legs.
    ctx.fillStyle = hound.state === 'asleep' ? '#4a5148' : '#6b5646';
    ctx.beginPath(); ctx.ellipse(-4, 0, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4, 1, 5.4, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = hound.state === 'asleep' ? '#454b43' : '#7d6650'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-11, -1); ctx.quadraticCurveTo(-15, -4, -13, -7); ctx.stroke();
    ctx.fillStyle = hound.state === 'asleep' ? '#454b43' : '#7d6650';
    ctx.beginPath(); ctx.ellipse(9, 2, 4, 3, 0.35, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hound.state === 'asleep' ? '#2f3a34' : '#433a2f';
    for (const leg of [-8, -2, 3, 7]) { ctx.fillRect(leg, 3.4, 1.8, 4.2); }
    if (hound.state === 'asleep') {
      ctx.fillStyle = 'rgba(206, 226, 190, .6)'; ctx.font = 'bold 9px system-ui, sans-serif';
      ctx.fillText('z', 12, -9 + Math.sin(hound.bob) * 1.5);
    }
    ctx.fillStyle = hound.state === 'awake' ? '#ef8060' : 'rgba(239, 160, 120, .35)';
    ctx.beginPath(); ctx.arc(7, -1, 1.5, 0, Math.PI * 2); ctx.fill();
    if (hound.state === 'awake') {
      ctx.strokeStyle = 'rgba(239, 128, 96, .55)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(7, -1, 5 + Math.sin(time * 8) * 1.4, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }
}
