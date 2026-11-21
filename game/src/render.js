// Procedural top-down garden, lantern vision cones, character silhouettes, soft light, and vignetting.
import { COLS, FONT, HEIGHT, MAP_X, MAP_Y, PALETTE, ROWS, TILE, WIDTH } from './config.js';
import { drawHud } from './hud.js';

const rounded = (ctx, x, y, width, height, radius) => {
  ctx.beginPath(); ctx.roundRect(x, y, width, height, radius);
};
const hash = (a, b) => ((a * 374761393 + b * 668265263) ^ (a >>> 13)) >>> 0;
const tilePosition = (col, row) => ({ x: MAP_X + col * TILE, y: MAP_Y + row * TILE });

function drawFloor(ctx, world) {
  ctx.fillStyle = PALETTE.night; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  for (let row = 0; row < ROWS; row += 1) for (let col = 0; col < COLS; col += 1) {
    const { x, y } = tilePosition(col, row);
    const key = `${col},${row}`;
    const path = world.paths.has(key);
    ctx.fillStyle = path ? (hash(col, row) % 4 === 0 ? PALETTE.pathLight : PALETTE.path) : (hash(col, row) % 5 === 0 ? PALETTE.grass2 : PALETTE.grass);
    ctx.fillRect(x, y, TILE, TILE);
    if (path) {
      ctx.fillStyle = 'rgba(213, 202, 162, .07)';
      for (let i = 0; i < 3; i += 1) {
        const seed = hash(col * 5 + i, row * 9 + i * 3);
        ctx.fillRect(x + 4 + seed % 24, y + 5 + (seed >>> 5) % 22, 2, 1);
      }
    } else {
      ctx.strokeStyle = 'rgba(174, 206, 154, .055)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + 5, y + 8 + hash(col, row) % 14); ctx.lineTo(x + 8, y + 4 + hash(row, col) % 18); ctx.stroke();
    }
  }
}

function drawWater(ctx, world, time) {
  for (const key of world.ponds) {
    const [col, row] = key.split(',').map(Number);
    const { x, y } = tilePosition(col, row);
    ctx.fillStyle = PALETTE.pond; ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = 'rgba(45, 111, 115, .42)';
    ctx.beginPath(); ctx.ellipse(x + TILE / 2 + Math.sin(time + row) * 2, y + TILE / 2, 10, 6, 0.3, 0, Math.PI * 2); ctx.fill();
    if ((col + row) % 3 === 0) {
      ctx.fillStyle = '#789076'; ctx.beginPath(); ctx.arc(x + TILE / 2, y + TILE / 2, 4.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ced09e'; ctx.beginPath(); ctx.arc(x + TILE / 2 - 1, y + TILE / 2 - 2, 2, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function drawFeature(ctx, feature, world) {
  const x = MAP_X + feature.col * TILE, y = MAP_Y + feature.row * TILE;
  const w = feature.width * TILE, h = feature.height * TILE;
  if (feature.kind === 'hedge') {
    ctx.fillStyle = '#10241f'; ctx.fillRect(x + 3, y + 5, w, h);
    ctx.fillStyle = PALETTE.hedgeDark; rounded(ctx, x + 1, y + 1, w - 2, h - 2, 8); ctx.fill();
    ctx.fillStyle = PALETTE.hedge; rounded(ctx, x + 3, y + 2, w - 6, Math.max(8, h * 0.45), 6); ctx.fill();
    ctx.fillStyle = 'rgba(174, 201, 141, .16)'; ctx.beginPath(); ctx.arc(x + w * 0.35, y + h * 0.32, 3, 0, Math.PI * 2); ctx.fill();
  } else if (feature.kind === 'lowwall') {
    ctx.fillStyle = '#252e28'; ctx.fillRect(x + 2, y + h - 8, w - 4, 12);
    ctx.fillStyle = PALETTE.wall; ctx.fillRect(x + 1, y + 3, w - 2, h - 8);
    for (let px = x + 4; px < x + w - 2; px += 24) { ctx.fillStyle = 'rgba(20, 28, 25, .32)'; ctx.fillRect(px, y + 7, 2, h - 12); }
    ctx.fillStyle = '#89907a'; ctx.fillRect(x + 1, y + 2, w - 2, 4);
  } else if (feature.kind === 'crate') {
    ctx.fillStyle = '#181f1a'; ctx.fillRect(x + 5, y + 8, w - 5, h - 4);
    ctx.fillStyle = '#68533a'; rounded(ctx, x + 3, y + 3, w - 6, h - 8, 3); ctx.fill();
    ctx.strokeStyle = '#a08051'; ctx.lineWidth = 2; ctx.strokeRect(x + 7, y + 7, w - 14, h - 16);
    ctx.beginPath(); ctx.moveTo(x + 8, y + h - 7); ctx.lineTo(x + w - 8, y + 8); ctx.stroke();
  } else if (feature.kind === 'glasshouse') {
    ctx.fillStyle = '#111d1b'; ctx.fillRect(x + 4, y + 8, w - 8, h - 4);
    ctx.fillStyle = 'rgba(89, 124, 111, .44)'; ctx.fillRect(x + 3, y + 3, w - 6, h - 10);
    ctx.strokeStyle = '#82927e'; ctx.lineWidth = 3; ctx.strokeRect(x + 3, y + 3, w - 6, h - 10);
    for (let px = x + 14; px < x + w - 5; px += 28) { ctx.beginPath(); ctx.moveTo(px, y + 4); ctx.lineTo(px, y + h - 8); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(227, 197, 134, .35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 4, y + h / 2); ctx.lineTo(x + w - 4, y + h / 2); ctx.stroke();
    ctx.fillStyle = '#5d7656'; ctx.fillRect(x + 10, y + h - 17, w - 20, 5);
  } else if (feature.kind === 'tower') {
    ctx.fillStyle = '#121c1b'; ctx.fillRect(x + 4, y + 7, w - 8, h - 5);
    ctx.fillStyle = '#545c51'; ctx.fillRect(x + 4, y + 5, w - 8, h - 13);
    ctx.fillStyle = '#88836b'; ctx.beginPath(); ctx.moveTo(x + 1, y + 8); ctx.lineTo(x + w / 2, y); ctx.lineTo(x + w - 1, y + 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#dab96d'; ctx.fillRect(x + w / 2 - 3, y + h - 20, 6, 9);
    ctx.fillStyle = '#212824'; ctx.fillRect(x + w / 2 - 2, y + 13, 4, 5);
  }
}

function drawWalls(ctx, world) {
  // Border stones continue around the whole garden, with a carved opening at the east gate.
  for (let col = 0; col < COLS; col += 1) {
    const top = tilePosition(col, 0), bottom = tilePosition(col, ROWS - 1);
    ctx.fillStyle = '#455047'; ctx.fillRect(top.x, top.y, TILE, TILE); ctx.fillRect(bottom.x, bottom.y, TILE, TILE);
  }
  for (let row = 1; row < ROWS - 1; row += 1) {
    const left = tilePosition(0, row), right = tilePosition(COLS - 1, row);
    ctx.fillStyle = '#455047'; ctx.fillRect(left.x, left.y, TILE, TILE);
    if (row !== 8) ctx.fillRect(right.x, right.y, TILE, TILE);
  }
  ctx.fillStyle = 'rgba(220, 221, 181, .18)';
  for (let col = 0; col < COLS; col += 1) { const p = tilePosition(col, 0); ctx.fillRect(p.x, p.y, TILE, 3); }
  for (const key of world.solids) {
    const [col, row] = key.split(',').map(Number);
    if ((col === 0 || row === 0 || col === COLS - 1 || row === ROWS - 1) && !(col === COLS - 1 && row === 8)) continue;
    if (world.features.some((f) => col >= f.col && col < f.col + f.width && row >= f.row && row < f.row + f.height)) continue;
    const p = tilePosition(col, row); ctx.fillStyle = PALETTE.hedge; ctx.fillRect(p.x + 2, p.y + 2, TILE - 4, TILE - 5);
  }
}

function drawGate(ctx, level, time) {
  const x = MAP_X + (COLS - 1) * TILE + TILE * 0.5;
  const y = MAP_Y + 8.5 * TILE;
  ctx.save();
  const glow = ctx.createRadialGradient(x, y, 2, x, y, TILE * 1.8);
  glow.addColorStop(0, 'rgba(240, 188, 98, .3)'); glow.addColorStop(1, 'rgba(240, 188, 98, 0)');
  ctx.fillStyle = glow; ctx.fillRect(x - TILE * 2, y - TILE * 2, TILE * 4, TILE * 4);
  ctx.strokeStyle = '#b38b54'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(x - 12, y + 17); ctx.lineTo(x - 12, y - 17); ctx.lineTo(x + 14, y - 17); ctx.lineTo(x + 14, y + 17); ctx.stroke();
  ctx.strokeStyle = 'rgba(242, 216, 156, .6)'; ctx.lineWidth = 2;
  for (let dx = -7; dx <= 9; dx += 8) { ctx.beginPath(); ctx.moveTo(x + dx, y - 14); ctx.lineTo(x + dx, y + 14); ctx.stroke(); }
  ctx.fillStyle = level.keys.every((key) => key.found) ? PALETTE.amber : '#7a6b4e';
  ctx.beginPath(); ctx.arc(x, y, 4 + Math.sin(time * 3) * 0.7, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawCone(ctx, guard, length, time) {
  const radius = length * TILE;
  const color = guard.mode === 'chase' ? 'rgba(226, 65, 55, .24)' : guard.mode === 'suspicious' ? 'rgba(240, 224, 176, .23)' : 'rgba(244, 195, 113, .16)';
  ctx.save();
  ctx.beginPath(); ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, radius, guard.angle - guard.halfAngle, guard.angle + guard.halfAngle);
  ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  ctx.strokeStyle = guard.mode === 'chase' ? 'rgba(239, 102, 84, .42)' : 'rgba(255, 216, 149, .2)';
  ctx.lineWidth = 1; ctx.stroke();
  const lantern = ctx.createRadialGradient(guard.x, guard.y, 1, guard.x, guard.y, 40);
  lantern.addColorStop(0, 'rgba(255, 214, 135, .34)'); lantern.addColorStop(1, 'rgba(255, 214, 135, 0)');
  ctx.fillStyle = lantern; ctx.beginPath(); ctx.arc(guard.x, guard.y, 40 + Math.sin(time * 7 + guard.bob) * 2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawGuard(ctx, guard) {
  ctx.save(); ctx.translate(guard.x, guard.y + Math.sin(guard.bob) * 1); ctx.rotate(guard.angle);
  ctx.fillStyle = 'rgba(0,0,0,.34)'; ctx.beginPath(); ctx.ellipse(0, 9, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = guard.mode === 'chase' ? '#9d3e35' : '#52665d'; rounded(ctx, -6, -8, 12, 17, 5); ctx.fill();
  ctx.fillStyle = '#cfb993'; ctx.beginPath(); ctx.arc(1, -9, 4.3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#25332e'; ctx.beginPath(); ctx.arc(1, -10, 4.4, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PALETTE.amber; ctx.beginPath(); ctx.arc(10, 1, 3.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(243, 189, 101, .55)'; ctx.beginPath(); ctx.arc(10, 1, 5.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  if (guard.mode === 'suspicious' || guard.mode === 'chase') {
    ctx.font = `bold 15px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = guard.mode === 'chase' ? PALETTE.red : PALETTE.pale;
    ctx.fillText(guard.mode === 'chase' ? '!' : '?', guard.x, guard.y - 19);
  }
}

function drawKeeper(ctx, player, time) {
  if (player.stone) {
    ctx.strokeStyle = `rgba(209, 204, 173, ${Math.max(0, 1 - player.stone.age / 0.5)})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(player.stone.x, player.stone.y, 4 + player.stone.age * 28, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.save(); ctx.translate(player.x, player.y);
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(0, 5, player.crouch ? 8 : 7, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = player.hidden ? '#9cae8f' : PALETTE.player;
  if (player.crouch) {
    ctx.beginPath(); ctx.ellipse(0, 0, 8, 5.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d1c29a'; ctx.beginPath(); ctx.arc(4, -1, 3, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = '#374d43'; rounded(ctx, -5.5, -6, 11, 13, 4); ctx.fill();
    ctx.fillStyle = '#d2c29b'; ctx.beginPath(); ctx.arc(0, -7, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b4c0a4'; ctx.beginPath(); ctx.arc(0, -7, 4, Math.PI, Math.PI * 2); ctx.fill();
  }
  if (player.hidden) { ctx.strokeStyle = 'rgba(206, 228, 179, .45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, 11 + Math.sin(time * 3) * 1, 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore();
}

function drawKeys(ctx, level, time) {
  for (const key of level.keys) if (!key.found) {
    ctx.save(); ctx.translate(key.x, key.y + Math.sin(time * 2.5 + key.id) * 2);
    ctx.shadowColor = '#f6c870'; ctx.shadowBlur = 12; ctx.strokeStyle = '#f1c76d'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(-3, 0, 5, 0, Math.PI * 2); ctx.moveTo(2, 0); ctx.lineTo(12, 0); ctx.lineTo(12, 4); ctx.moveTo(8, 0); ctx.lineTo(8, 3); ctx.stroke();
    ctx.restore();
  }
}

function drawCoverLight(ctx, player) {
  const shade = ctx.createRadialGradient(player.x, player.y, 2, player.x, player.y, player.hidden ? 94 : 50);
  shade.addColorStop(0, player.hidden ? 'rgba(174, 193, 145, .13)' : 'rgba(240, 209, 148, .1)');
  shade.addColorStop(1, 'rgba(240, 209, 148, 0)'); ctx.fillStyle = shade; ctx.fillRect(player.x - 100, player.y - 100, 200, 200);
}

function drawVignette(ctx) {
  const gradient = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 200, WIDTH / 2, HEIGHT / 2, 610);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)'); gradient.addColorStop(1, 'rgba(0, 0, 0, .62)');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(canvas.clientWidth * ratio), height = Math.round(canvas.clientHeight * ratio);
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  }
  function draw(state, screen, dt = 0, audioMuted = false) {
    resize();
    state.muted = audioMuted;
    ctx.setTransform(canvas.width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0);
    drawFloor(ctx, state.world);
    drawWater(ctx, state.world, state.time);
    for (const feature of state.world.features) drawFeature(ctx, feature, state.world);
    drawWalls(ctx, state.world);
    drawGate(ctx, state.level, state.time);
    for (const guard of state.guards) drawCone(ctx, guard, state.level.length, state.time);
    drawKeys(ctx, state.level, state.time);
    drawCoverLight(ctx, state.player);
    for (const guard of state.guards) drawGuard(ctx, guard);
    drawKeeper(ctx, state.player, state.time);
    drawVignette(ctx);
    if (screen === 'play' || screen === 'paused') drawHud(ctx, state, state.muted);
    if (screen !== 'play') drawPanel(ctx, screen, state);
  }
  function drawPanel(ctx, screen, state) {
    const veil = screen === 'title' ? 'rgba(4, 14, 16, .48)' : 'rgba(4, 13, 14, .72)';
    ctx.fillStyle = veil; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const x = 190, y = screen === 'title' ? 132 : 152, width = 580, height = screen === 'title' ? 360 : 330;
    ctx.fillStyle = PALETTE.panel; rounded(ctx, x, y, width, height, 10); ctx.fill();
    ctx.strokeStyle = PALETTE.line; ctx.lineWidth = 1; ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (screen === 'title') {
      ctx.fillStyle = '#c4a46f'; ctx.font = `12px ${FONT}`; ctx.letterSpacing = '4px'; ctx.fillText('A NIGHT GARDEN TALE', WIDTH / 2, y + 46); ctx.letterSpacing = '0px';
      ctx.fillStyle = PALETTE.pale; ctx.font = `bold 38px ${FONT}`; ctx.fillText('NIGHTFALL ROOKERY', WIDTH / 2, y + 93);
      ctx.fillStyle = PALETTE.muted; ctx.font = `16px ${FONT}`; ctx.fillText('Cross the walled garden. Leave no witness.', WIDTH / 2, y + 132);
      ctx.fillStyle = PALETTE.amber; ctx.font = `600 15px ${FONT}`; ctx.fillText('WASD / arrows move    ·    Shift crouch    ·    Space sprint', WIDTH / 2, y + 187);
      ctx.fillStyle = '#d0d5bf'; ctx.font = `14px ${FONT}`; ctx.fillText('Q / right click toss a stone    ·    M mute    ·    P pause    ·    R restart', WIDTH / 2, y + 218);
      ctx.fillStyle = '#9caf9e'; ctx.font = `13px ${FONT}`; ctx.fillText('Hide in hedges, behind crates, and in deep shadow.', WIDTH / 2, y + 255);
      ctx.fillStyle = PALETTE.pale; ctx.font = `600 15px ${FONT}`; ctx.fillText('Press Enter or click to slip inside', WIDTH / 2, y + 311);
    } else if (screen === 'paused') {
      ctx.fillStyle = PALETTE.pale; ctx.font = `bold 30px ${FONT}`; ctx.fillText('The garden is listening', WIDTH / 2, y + 75);
      ctx.fillStyle = PALETTE.muted; ctx.font = `15px ${FONT}`; ctx.fillText('Patrols hold their breath while you plan.', WIDTH / 2, y + 127);
      ctx.fillStyle = PALETTE.amber; ctx.fillText('P / Esc to resume     ·     R restart', WIDTH / 2, y + 207);
    } else if (screen === 'caught') {
      ctx.fillStyle = PALETTE.red; ctx.font = `bold 31px ${FONT}`; ctx.fillText('The lanterns found you', WIDTH / 2, y + 75);
      ctx.fillStyle = PALETTE.muted; ctx.font = `15px ${FONT}`; ctx.fillText('The rookery keeps its secrets tonight.', WIDTH / 2, y + 127);
      ctx.fillStyle = PALETTE.amber; ctx.fillText('Enter / click to try again     ·     R restart', WIDTH / 2, y + 207);
    } else if (screen === 'win') {
      ctx.fillStyle = PALETTE.amber; ctx.font = `bold 31px ${FONT}`; ctx.fillText('The rookery sleeps', WIDTH / 2, y + 72);
      ctx.fillStyle = PALETTE.pale; ctx.font = `17px ${FONT}`; ctx.fillText('Three gardens crossed. No alarm raised.', WIDTH / 2, y + 127);
      ctx.fillStyle = PALETTE.muted; ctx.font = `14px ${FONT}`; ctx.fillText(`Night run  ·  ${formatTime(state.elapsed)}`, WIDTH / 2, y + 165);
      ctx.fillStyle = PALETTE.amber; ctx.fillText('Enter / click to walk the garden again', WIDTH / 2, y + 227);
    } else if (screen === 'transition') {
      ctx.fillStyle = PALETTE.amber; ctx.font = `bold 27px ${FONT}`; ctx.fillText(state.level.name, WIDTH / 2, y + 77);
      ctx.fillStyle = PALETTE.pale; ctx.font = `16px ${FONT}`; ctx.fillText(state.level.subtitle, WIDTH / 2, y + 134);
      ctx.fillStyle = PALETTE.muted; ctx.font = `14px ${FONT}`; ctx.fillText('The next watch is already making its rounds.', WIDTH / 2, y + 176);
      ctx.fillStyle = PALETTE.amber; ctx.fillText('Enter / click to continue', WIDTH / 2, y + 232);
    }
  }
  return { draw };
}

export function formatTime(seconds) {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}
