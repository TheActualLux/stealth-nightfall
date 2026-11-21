// In-world-readable status strip, key count, alert meter, stamina, and contextual stealth advice.
import { FONT, PALETTE, WIDTH } from './config.js';
import { formatTime } from './render.js';
import { findNearbyLantern } from './lanterns.js';

function rounded(ctx, x, y, width, height, radius) {
  ctx.beginPath(); ctx.roundRect(x, y, width, height, radius);
}

function hintFor(state) {
  if (state.notice) return state.notice;
  if (findNearbyLantern(state.player.x, state.player.y, state.lanterns)) return 'E shutter or open this wall lantern.';
  if (state.player.caught) return 'A lantern has closed in.';
  if (state.player.hidden) return 'You are in deep cover. Stay low and let the watch pass.';
  if (state.detection > 0.62) return 'Too close to the light. Break sight and crouch.';
  if (state.detection > 0.2) return 'A guard is searching. Slip behind a wall or hedge.';
  if (state.level.keys.some((key) => !key.found)) return 'A brass key lies somewhere in the garden. Find it before the gate.';
  if (Math.hypot(state.player.x - state.level.gate.x, state.player.y - state.level.gate.y) < 110) return 'The rookery gate is near. The watch does not sleep.';
  return 'Watch the lanterns. Their loops have a rhythm.';
}

export function drawHud(ctx, state, audioMuted) {
  const level = state.level;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(5, 16, 17, .82)'; rounded(ctx, 17, 14, WIDTH - 34, 52, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(222, 216, 178, .15)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.textAlign = 'left'; ctx.fillStyle = PALETTE.pale; ctx.font = `600 15px ${FONT}`;
  ctx.fillText('NIGHTFALL ROOKERY', 33, 34);
  ctx.fillStyle = PALETTE.muted; ctx.font = `12px ${FONT}`; ctx.fillText(`${String(state.levelIndex + 1).padStart(2, '0')}  /  03    ${level.name}`, 33, 52);

  const meterX = 385, meterY = 29, meterW = 174;
  ctx.textAlign = 'center'; ctx.fillStyle = state.detection > 0.65 ? PALETTE.red : PALETTE.pale; ctx.font = `11px ${FONT}`;
  ctx.fillText(state.detection > 0.65 ? 'ALARM' : state.detection > 0.08 ? 'SUSPICION' : 'UNSEEN', meterX + meterW / 2, 20);
  ctx.fillStyle = 'rgba(201, 210, 186, .13)'; rounded(ctx, meterX, meterY, meterW, 8, 4); ctx.fill();
  const color = state.detection > 0.65 ? PALETTE.red : state.detection > 0.3 ? '#e5b656' : '#a5b889';
  if (state.detection > 0) { ctx.fillStyle = color; rounded(ctx, meterX, meterY, meterW * state.detection, 8, 4); ctx.fill(); }
  ctx.fillStyle = 'rgba(230, 227, 198, .35)'; ctx.fillRect(meterX + meterW * 0.65, meterY - 2, 1, 12);

  const found = level.keys.filter((key) => key.found).length;
  ctx.textAlign = 'right'; ctx.fillStyle = PALETTE.amber; ctx.font = `bold 16px ${FONT}`;
  ctx.fillText(`KEYS ${found}/${level.keys.length}`, 790, 33);
  for (let i = 0; i < 3; i += 1) {
    const keyX = 626 + i * 21;
    ctx.save(); ctx.strokeStyle = i < found ? PALETTE.amber : 'rgba(243, 189, 101, .42)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(keyX + 4, 31, 4, 0, Math.PI * 2); ctx.moveTo(keyX + 8, 31); ctx.lineTo(keyX + 17, 31); ctx.lineTo(keyX + 17, 35); ctx.moveTo(keyX + 13, 31); ctx.lineTo(keyX + 13, 34); ctx.stroke();
    if (i < found) { ctx.fillStyle = PALETTE.amber; ctx.beginPath(); ctx.arc(keyX + 4, 31, 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  ctx.fillStyle = PALETTE.muted; ctx.font = `12px ${FONT}`; ctx.fillText(formatTime(state.elapsed), 770, 51);
  ctx.textAlign = 'right'; ctx.fillStyle = audioMuted ? '#77847c' : PALETTE.muted; ctx.font = `11px ${FONT}`;
  ctx.fillText(`${audioMuted ? 'MUTED' : 'M'}   ·   R RESTART`, 929, 32);

  ctx.fillStyle = 'rgba(5, 16, 17, .78)'; rounded(ctx, 17, 587, WIDTH - 34, 38, 6); ctx.fill();
  ctx.textAlign = 'left'; ctx.fillStyle = state.detection > 0.65 ? '#efaa8f' : '#d0d4bf'; ctx.font = `12px ${FONT}`; ctx.fillText(hintFor(state), 31, 606);
  const staminaX = 764, staminaW = 124;
  ctx.textAlign = 'right'; ctx.fillStyle = PALETTE.muted; ctx.font = `10px ${FONT}`; ctx.fillText('BREATH', staminaX - 7, 605);
  ctx.fillStyle = 'rgba(201, 210, 186, .16)'; rounded(ctx, staminaX, 601, staminaW, 8, 4); ctx.fill();
  if (state.player.stamina > 0) { ctx.fillStyle = '#adbd8c'; rounded(ctx, staminaX, 601, staminaW * state.player.stamina, 8, 4); ctx.fill(); }
  ctx.textAlign = 'right'; ctx.fillStyle = state.player.stoneCooldown <= 0 ? PALETTE.amber : '#77847c'; ctx.font = `10px ${FONT}`;
  ctx.fillText(state.player.stoneCooldown <= 0 ? 'STONE READY' : 'STONE', 927, 605);
}
