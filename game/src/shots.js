// SHADOW FREIGHT — shots.js
// One job: deterministic screenshot scenes for ?shot=start|play|win|caught.
// Each scene sets the game to a fixed, hand-placed state so a screenshot
// taken twice looks the same. No randomness here at all.

import { buildLevel } from './levels.js';
import { Guard } from './guards.js';
import { Player } from './player.js';

export const SHOT_NAMES = ['start', 'play', 'win', 'caught'];

// Place a guard at a fixed spot, facing a fixed direction, mid-patrol.
function placeGuard(level, x, y, dir, detection, state) {
  const g = new Guard({ waypoints: [{ x, y }, { x: x + 80, y }], pause: 1 }, level);
  g.x = x;
  g.y = y;
  g.dir = dir;
  g.detection = detection;
  g.state = state || 'patrol';
  return g;
}

// Returns a ready-to-render snapshot for the requested shot name, or null.
export function buildShotScene(name) {
  if (name === 'start') {
    return { kind: 'title' };
  }

  if (name === 'play') {
    const level = buildLevel(0);
    // One core already lifted, one glowing ahead, the exit still locked.
    level.cores[0].taken = true;
    const player = new Player(level);
    // Tucked in the west shadow lane, just outside a lamp pool.
    player.x = 260;
    player.y = 250;
    player.facing = 0.5;
    player.hidden = true;
    player.lit = false;
    player.chimes = 2;
    const guards = [
      placeGuard(level, 420, 250, Math.PI, 38, 'patrol'),
      placeGuard(level, 760, 420, -Math.PI / 2, 72, 'patrol'),
      placeGuard(level, 980, 170, Math.PI / 2, 12, 'investigate'),
    ];
    return {
      kind: 'play',
      level,
      player,
      guards,
      detection: 38,
      elapsedSec: 74,
      score: 500,
      attempts: 3,
      muted: false,
      effects: [{ kind: 'chime', x: 640, y: 330, r: 42 }],
    };
  }

  if (name === 'win') {
    return {
      kind: 'win',
      stats: {
        cores: 12,
        coresTotal: 12,
        timeText: '07:42',
        totalScore: 9850,
        timesSpotted: 1,
        chimesUsed: 4,
      },
    };
  }

  if (name === 'caught') {
    const level = buildLevel(0);
    const player = new Player(level);
    // Caught in the open, inside the lamp pool at (820, 330) — lit for real.
    player.x = 820;
    player.y = 300;
    player.facing = Math.PI;
    player.lit = true;
    const guards = [
      placeGuard(level, 740, 300, 0, 100, 'chase'),
      placeGuard(level, 980, 170, Math.PI / 2, 64, 'patrol'),
    ];
    return {
      kind: 'caught',
      level,
      player,
      guards,
      detection: 100,
      elapsedSec: 96,
      score: 0,
      attempts: 2,
      muted: false,
      stats: { attempts: 2 },
    };
  }

  return null;
}
