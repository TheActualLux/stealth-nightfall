// Game setup, screen flow, deterministic simulation updates, and the single animation loop.
import { createInput, ACT_MUTE, ACT_PAUSE, ACT_RESTART, ACT_START, ACT_STONE, ACT_LEVEL_1, ACT_LEVEL_2, ACT_LEVEL_3, ACT_LANTERN } from './input.js';
import { LEVELS } from './levels.js';
import { createWorld } from './world.js';
import { createPlayer, collectKeys, movePlayer, throwStone } from './player.js';
import { createGuards, updateGuards } from './guards.js';
import { createRenderer } from './render.js';
import { createAudio } from './audio.js';
import { createLanterns, isInsideLanternShadow, toggleNearbyLantern } from './lanterns.js';

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const input = createInput(canvas);
const renderer = createRenderer(canvas);
const audio = createAudio();
const state = {
  screen: 'title', levelIndex: 0, level: LEVELS[0], world: createWorld(0),
  player: createPlayer(LEVELS[0].playerStart), guards: createGuards(LEVELS[0]), lanterns: createLanterns(LEVELS[0]),
  lanternHintShown: false,
  detection: 0, time: 0, elapsed: 0, notice: '', noticeTimer: 0, transitionTimer: 0,
};
let previous = performance.now();
let accumulator = 0;
let lastNotice = '';

function announce(message) {
  if (message !== lastNotice) { status.textContent = message; lastNotice = message; }
}

function setNotice(message, duration = 2.1) {
  state.notice = message;
  state.noticeTimer = duration;
}

function loadLevel(index) {
  state.levelIndex = index;
  state.level = { ...LEVELS[index], keys: LEVELS[index].keys.map((key) => ({ ...key, found: false })) };
  state.world = createWorld(index);
  state.player = createPlayer(state.level.playerStart);
  state.guards = createGuards(state.level);
  state.lanterns = createLanterns(state.level);
  state.lanternHintShown = false;
  state.detection = 0;
  state.notice = '';
  if (index === 0) state.elapsed = 0;
}

function startGame(levelIndex = 0) {
  state.elapsed = 0;
  loadLevel(levelIndex);
  state.screen = 'play';
  setNotice('Keep to the shadow. The watch follows a steady rhythm.', 3.2);
  announce(`Nightfall Rookery. ${state.level.name}. Move with WASD or arrow keys.`);
}

function restart() {
  loadLevel(0);
  state.screen = 'play';
  setNotice('A fresh night. Find your way to the rookery gate.', 2.5);
  announce('Nightfall Rookery restarted.');
}

function advanceLevel() {
  if (state.levelIndex >= LEVELS.length - 1) {
    state.screen = 'win';
    audio.gate();
    announce(`The rookery sleeps. Night run ${Math.floor(state.elapsed)} seconds.`);
    return;
  }
  state.levelIndex += 1;
  state.level = { ...LEVELS[state.levelIndex], keys: LEVELS[state.levelIndex].keys.map((key) => ({ ...key, found: false })) };
  state.screen = 'transition';
  setNotice('');
  announce(`${state.level.name}. New patrols ahead.`);
}

function handleActions() {
  const actions = input.takeActions();
  if (actions & ACT_MUTE) {
    const muted = audio.toggle();
    setNotice(muted ? 'The garden falls quiet.' : 'Lanterns and footsteps return.', 1.6);
  }
  if (actions & ACT_RESTART && state.screen !== 'title') { restart(); return; }
  if (actions & ACT_PAUSE) {
    if (state.screen === 'play') { state.screen = 'paused'; announce('Paused.'); }
    else if (state.screen === 'paused') { state.screen = 'play'; announce('Resumed.'); }
  }
  if (state.screen === 'title') {
    if (actions & ACT_LEVEL_1) { startGame(0); return; }
    if (actions & ACT_LEVEL_2) { startGame(1); return; }
    if (actions & ACT_LEVEL_3) { startGame(2); return; }
  }
  if (actions & ACT_START) {
    if (state.screen === 'title' || state.screen === 'caught' || state.screen === 'win') startGame();
    else if (state.screen === 'transition') { loadLevel(state.levelIndex); state.screen = 'play'; setNotice(state.level.subtitle, 2.5); }
  }
  if ((actions & ACT_LANTERN) && state.screen === 'play') {
    const lantern = toggleNearbyLantern(state.player, state.lanterns);
    if (lantern) {
      audio.shutter();
      setNotice(lantern.lit ? 'Lantern opened. The corridor is bright again.' : 'Lantern shuttered. The corridor sinks into shadow.', 2.2);
    }
  }
  if ((actions & ACT_STONE) && state.screen === 'play') {
    const stone = throwStone(state.player, input.pointer(), audio, state.guards);
    if (stone) setNotice('A small sound travels farther than a small shadow.', 2.2);
    else if (state.player.stoneCooldown > 0) setNotice('Wait for the stone to return.', 1.2);
  }
}

function update(dt) {
  state.time += dt;
  audio.lantern(dt);
  if (state.screen !== 'play') return;
  state.elapsed += dt;
  movePlayer(state.player, state.world, input, dt, audio);
  state.player.hidden = state.player.hidden || isInsideLanternShadow(state.player.x, state.player.y, state.lanterns);
  const key = collectKeys(state.player, state.level);
  if (key) { audio.key(); setNotice('A brass key. The old lock will turn now.', 2.1); }
  const action = updateGuards(state.guards, state.world, state.player, state.level, state.lanterns, dt, audio);
  const visibleGuards = state.guards.filter((guard) => guard.seeing);
  const pressure = action.detection;
  const loudNearMiss = visibleGuards.length === 0 && state.player.sprint && action.nearest && action.nearest.distance < 82;
  const rise = pressure > 0 ? dt * (0.32 + pressure * 1.25) : 0;
  const near = loudNearMiss ? dt * 0.42 : 0;
  const recovery = state.player.hidden ? dt * 0.21 : dt * 0.115;
  state.detection = Math.max(0, Math.min(1, state.detection + rise + near - (pressure > 0 || loudNearMiss ? 0 : recovery)));
  if (!state.lanternHintShown && state.lanterns.some((lantern) => Math.hypot(state.player.x - lantern.x, state.player.y - lantern.y) <= 68)) {
    state.lanternHintShown = true;
    setNotice('E shutters a wall lantern. Guards can relight it.', 3);
  }
  if (loudNearMiss && state.detection > 0.16 && state.noticeTimer < 0.15) setNotice('Gravel scatters underfoot. A lantern turns your way.', 1.8);
  if (state.detection >= 1 || state.player.caught) {
    state.screen = 'caught';
    announce('Caught. Press Enter to try again, or R to restart.');
    return;
  }
  if (state.noticeTimer > 0) state.noticeTimer -= dt;
  else state.notice = '';
  if (state.player.stone) {
    state.player.stone.age += dt;
    if (state.player.stone.age >= 0.5) state.player.stone = null;
  }
  const gateDistance = Math.hypot(state.player.x - state.level.gate.x, state.player.y - state.level.gate.y);
  if (gateDistance < 35) {
    if (state.level.keys.every((item) => item.found)) advanceLevel();
    else if (state.noticeTimer <= 0) setNotice('The gate needs every brass key.', 1.7);
  }
}

function draw() {
  renderer.draw(state, state.screen, 0, audio.muted());
}

function frame(now) {
  requestAnimationFrame(frame);
  const elapsed = Math.min(0.1, Math.max(0, (now - previous) / 1000));
  previous = now;
  handleActions();
  if (state.screen === 'play') {
    accumulator += elapsed;
    while (accumulator >= 1 / 60) { update(1 / 60); accumulator -= 1 / 60; }
  } else {
    accumulator = 0;
    state.time += elapsed;
    audio.lantern(elapsed);
  }
  draw();
}

canvas.addEventListener('click', () => {
  if (state.screen === 'title' || state.screen === 'caught' || state.screen === 'win') startGame();
  else if (state.screen === 'transition') { loadLevel(state.levelIndex); state.screen = 'play'; setNotice(state.level.subtitle, 2.5); }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && state.screen === 'play') { state.screen = 'paused'; announce('Paused while the garden is hidden.'); }
});
window.addEventListener('resize', () => { canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight; });
announce('Nightfall Rookery. Press Enter or click to begin.');
requestAnimationFrame(frame);
