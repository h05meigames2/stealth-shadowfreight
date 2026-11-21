// SHADOW FREIGHT — levels.js
// One job: define the three freight-yard levels and turn a definition
// into a playable grid (tiles, player start, guard patrols, cores, exit).
//
// Tile legend:
//   '#' crate wall — solid, blocks movement and sight
//   '.' concrete floor
//   ',' shadow floor — dark ground where guards cannot spot you
//   '~' bush / stacked sacks — hides you, blocks sight, walkable
//   'L' lamp — a pool of light; standing in it makes you visible
//   'C' data core (collect), 'E' exit gate, 'P' player start,
//   'G' guard spawn (patrol waypoints come from the level definition)

import { TILE, COLS, ROWS } from './config.js';

export function isSolidTile(ch) {
  return ch === '#';
}

export function blocksSightTile(ch) {
  return ch === '#' || ch === '~';
}

export function isShadowTile(ch) {
  return ch === ',';
}

export function isBushTile(ch) {
  return ch === '~';
}

function blankGrid() {
  const g = [];
  for (let y = 0; y < ROWS; y++) g.push(new Array(COLS).fill('.'));
  return g;
}

function border(grid) {
  for (let x = 0; x < COLS; x++) { grid[0][x] = '#'; grid[ROWS - 1][x] = '#'; }
  for (let y = 0; y < ROWS; y++) { grid[y][0] = '#'; grid[y][COLS - 1] = '#'; }
}

function rect(grid, x, y, w, h, ch) {
  for (let j = y; j < y + h; j++)
    for (let i = x; i < x + w; i++) grid[j][i] = ch;
}

function put(grid, x, y, ch) { grid[y][x] = ch; }

function tileCenter(tx, ty) {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}

// Each level: a builder that paints tiles, plus patrol routes in tile coords.
const LEVEL_DEFS = [
  {
    name: 'DOCK 1 — NIGHT SHIFT',
    patrolSpeed: 1.0,
    visionRange: 175,
    build(grid) {
      border(grid);
      rect(grid, 15, 1, 1, 6, '#'); // crate spine, upper half
      rect(grid, 15, 9, 1, 6, '#'); // crate spine, lower half
      rect(grid, 2, 4, 5, 1, '#');
      rect(grid, 9, 4, 5, 1, '#');
      rect(grid, 18, 4, 5, 1, '#');
      rect(grid, 25, 4, 5, 1, '#');
      rect(grid, 2, 11, 5, 1, '#');
      rect(grid, 9, 11, 5, 1, '#');
      rect(grid, 18, 11, 5, 1, '#');
      rect(grid, 25, 11, 5, 1, '#');
      rect(grid, 6, 1, 2, 14, ','); // shadow lane, west
      rect(grid, 24, 1, 2, 14, ','); // shadow lane, east
      put(grid, 8, 2, '~'); put(grid, 9, 2, '~');
      put(grid, 22, 6, '~'); put(grid, 23, 6, '~');
      put(grid, 4, 13, '~'); put(grid, 5, 13, '~');
      put(grid, 11, 1, 'L'); put(grid, 20, 8, 'L');
      put(grid, 11, 13, 'L'); put(grid, 27, 3, 'L');
      put(grid, 12, 2, 'C'); put(grid, 27, 2, 'C'); put(grid, 4, 10, 'C');
      put(grid, 30, 14, 'E');
      put(grid, 2, 2, 'P');
    },
    guards: [
      { waypoints: [[4, 6], [12, 6]], pause: 1.2 },
      { waypoints: [[19, 10], [28, 10]], pause: 1.2 },
    ],
  },
  {
    name: 'DOCK 2 — DOUBLE WATCH',
    patrolSpeed: 1.25,
    visionRange: 185,
    build(grid) {
      border(grid);
      rect(grid, 10, 1, 1, 5, '#');
      rect(grid, 10, 10, 1, 5, '#');
      rect(grid, 21, 1, 1, 5, '#');
      rect(grid, 21, 10, 1, 5, '#');
      rect(grid, 2, 7, 7, 1, '#');
      rect(grid, 23, 8, 7, 1, '#');
      rect(grid, 5, 1, 2, 14, ',');
      rect(grid, 16, 1, 2, 14, ',');
      rect(grid, 26, 1, 2, 14, ',');
      put(grid, 3, 3, '~'); put(grid, 24, 3, '~');
      put(grid, 8, 12, '~'); put(grid, 28, 12, '~');
      put(grid, 15, 13, '~');
      put(grid, 7, 2, 'L'); put(grid, 14, 6, 'L'); put(grid, 24, 8, 'L');
      put(grid, 7, 11, 'L'); put(grid, 19, 13, 'L'); put(grid, 28, 2, 'L');
      put(grid, 6, 1, 'C'); put(grid, 28, 5, 'C');
      put(grid, 3, 14, 'C'); put(grid, 24, 14, 'C');
      put(grid, 30, 8, 'E');
      put(grid, 2, 2, 'P');
    },
    guards: [
      { waypoints: [[2, 6], [8, 6]], pause: 0.9 },
      { waypoints: [[12, 12], [19, 12]], pause: 0.9 },
      { waypoints: [[23, 4], [29, 4]], pause: 0.9 },
    ],
  },
  {
    name: 'DOCK 3 — THE VAULT YARD',
    patrolSpeed: 1.5,
    visionRange: 195,
    build(grid) {
      border(grid);
      rect(grid, 8, 1, 1, 4, '#');
      rect(grid, 8, 11, 1, 4, '#');
      rect(grid, 16, 1, 1, 6, '#');
      rect(grid, 16, 9, 1, 6, '#');
      rect(grid, 24, 1, 1, 4, '#');
      rect(grid, 24, 11, 1, 4, '#');
      rect(grid, 4, 1, 2, 14, ',');
      rect(grid, 12, 1, 2, 14, ',');
      rect(grid, 20, 1, 2, 14, ',');
      rect(grid, 28, 1, 2, 14, ',');
      put(grid, 2, 7, '~'); put(grid, 30, 7, '~');
      put(grid, 11, 8, '~'); put(grid, 19, 8, '~');
      put(grid, 6, 14, '~'); put(grid, 26, 1, '~');
      put(grid, 3, 4, 'L'); put(grid, 10, 6, 'L'); put(grid, 17, 3, 'L');
      put(grid, 25, 6, 'L'); put(grid, 10, 12, 'L'); put(grid, 22, 12, 'L');
      put(grid, 29, 13, 'L');
      put(grid, 3, 2, 'C'); put(grid, 30, 2, 'C'); put(grid, 15, 7, 'C');
      put(grid, 2, 13, 'C'); put(grid, 30, 13, 'C');
      put(grid, 30, 8, 'E');
      put(grid, 2, 1, 'P');
    },
    guards: [
      { waypoints: [[2, 5], [6, 5]], pause: 0.7 },
      { waypoints: [[10, 10], [14, 10]], pause: 0.7 },
      { waypoints: [[18, 4], [22, 4]], pause: 0.7 },
      { waypoints: [[25, 11], [29, 11]], pause: 0.7 },
    ],
  },
];

export const LEVEL_COUNT = LEVEL_DEFS.length;

export function levelName(index) {
  return LEVEL_DEFS[index].name;
}

// Turn a level definition into runtime data. Core/exit/player/lamp tiles
// are lifted out of the grid and stored as objects; the grid keeps only
// terrain ('#', '.', ',', '~') so collision and sight tests stay simple.
export function buildLevel(index) {
  const def = LEVEL_DEFS[index];
  const grid = blankGrid();
  def.build(grid);
  const level = {
    index,
    name: def.name,
    patrolSpeed: def.patrolSpeed,
    visionRange: def.visionRange,
    grid,
    playerStart: { x: 80, y: 80 },
    guards: [],
    cores: [],
    lamps: [],
    exit: { x: 0, y: 0 },
    exitOpen: false,
  };
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const ch = grid[y][x];
      const c = tileCenter(x, y);
      if (ch === 'P') { level.playerStart = c; grid[y][x] = '.'; }
      else if (ch === 'C') { level.cores.push({ x: c.x, y: c.y, taken: false }); grid[y][x] = '.'; }
      else if (ch === 'E') { level.exit = c; grid[y][x] = '.'; }
      else if (ch === 'L') { level.lamps.push(c); grid[y][x] = '.'; }
    }
  }
  level.guards = def.guards.map((g) => ({
    waypoints: g.waypoints.map(([tx, ty]) => tileCenter(tx, ty)),
    pause: g.pause,
  }));
  return level;
}

export function tileAt(level, px, py) {
  const tx = Math.floor(px / TILE);
  const ty = Math.floor(py / TILE);
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return '#';
  return level.grid[ty][tx];
}

// True when the straight line between two points crosses no sight-blocking tile.
export function hasLineOfSight(level, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (blocksSightTile(tileAt(level, ax + dx * t, ay + dy * t))) return false;
  }
  return true;
}

// True when a circle of the given radius fits at (px, py) without touching a wall.
export function circleFits(level, px, py, r) {
  const checks = [
    [px - r, py], [px + r, py], [px, py - r], [px, py + r],
    [px - r * 0.7, py - r * 0.7], [px + r * 0.7, py - r * 0.7],
    [px - r * 0.7, py + r * 0.7], [px + r * 0.7, py + r * 0.7],
  ];
  for (const [cx, cy] of checks) if (isSolidTile(tileAt(level, cx, cy))) return false;
  return true;
}
