// SHADOW FREIGHT — config.js
// One job: every tunable number, colour and label for the game.
// No other module hard-codes a balance value; they all read from here.

export const GAME_TITLE = 'SHADOW FREIGHT';
export const GAME_SUBTITLE = 'a night-freight stealth run';

export const CANVAS_W = 1280;
export const CANVAS_H = 720;
export const HUD_H = 72;
export const TILE = 40;
export const COLS = 32;
export const ROWS = 16;
export const FIELD_X = 0;
export const FIELD_Y = HUD_H;
export const FIELD_W = COLS * TILE;
export const FIELD_H = ROWS * TILE;

export const PLAYER_RADIUS = 13;
export const PLAYER_WALK_SPEED = 150;
export const PLAYER_RUN_SPEED = 238;
export const PLAYER_CLOSE_SEEN_DIST = 46;

export const GUARD_RADIUS = 14;
export const GUARD_PATROL_SPEED = 62;
export const GUARD_CHASE_SPEED = 168;
export const GUARD_INVESTIGATE_SPEED = 118;
export const GUARD_VISION_RANGE = 175;
export const GUARD_VISION_HALF_ANGLE = 0.56; // radians, ~32 degrees
export const GUARD_CATCH_DIST = 26;

export const LAMP_RADIUS = 118;
export const NOISE_RUN_RADIUS = 112;
export const NOISE_HEAR_RADIUS = 270;
export const CHIME_THROW_RANGE = 260;
export const CHIME_HEAR_RADIUS = 330;
export const CHIMES_PER_LEVEL = 3;

export const DETECTION_FILL_BASE = 62; // per second while fully seen
export const DETECTION_DECAY = 26; // per second while unseen
export const DETECTION_ALERT_AT = 100;
export const CHASE_SECONDS = 4.5;
export const SEARCH_SECONDS = 2.0;

export const START_ATTEMPTS = 3;
export const CORE_SCORE = 500;
export const LEVEL_CLEAR_SCORE = 1000;
export const GHOST_BONUS = 500;
export const TIME_BONUS_PER_SECOND = 5;
export const TIME_BONUS_CAP_SECONDS = 240;

export const COLORS = {
  floor: '#2b2f36',
  floorAlt: '#262a31',
  floorEdge: '#1d2026',
  shadowFloor: '#141821',
  shadowFloorEdge: '#0e1118',
  wall: '#4a4238',
  wallTop: '#6b5f4c',
  wallEdge: '#2e2820',
  bush: '#1f4d2e',
  bushLeaf: '#2f7a44',
  bushEdge: '#12301c',
  lampGlow: 'rgba(255, 196, 90, 0.20)',
  lampCore: '#ffd27a',
  lampPost: '#8a7a5a',
  exit: '#39d0a5',
  exitGlow: 'rgba(57, 208, 165, 0.25)',
  exitLocked: '#3a5a50',
  core: '#ffd23e',
  coreGlow: 'rgba(255, 210, 62, 0.30)',
  player: '#e8e4d8',
  playerCoat: '#c94f42',
  guard: '#3d5a80',
  guardDark: '#2b3f5c',
  guardVisor: '#ffd23e',
  coneCalm: 'rgba(255, 210, 62, 0.16)',
  coneSuspicious: 'rgba(255, 150, 40, 0.28)',
  coneAlert: 'rgba(255, 60, 40, 0.34)',
  coneEdge: 'rgba(255, 210, 62, 0.35)',
  hudBg: '#101318',
  hudLine: '#232830',
  hudText: '#e8e4d8',
  hudMuted: '#9aa3ad',
  hudAccent: '#ffd23e',
  hudDanger: '#ff5140',
  hudGood: '#39d0a5',
  titleBg: '#0b0e13',
  overlay: 'rgba(8, 10, 14, 0.78)',
  chime: '#7fe3ff',
  noiseRing: 'rgba(255, 255, 255, 0.35)',
};

export const LEVEL_NAMES = [
  'DOCK 1 — NIGHT SHIFT',
  'DOCK 2 — DOUBLE WATCH',
  'DOCK 3 — THE VAULT YARD',
];

export const CONTROLS_TEXT = [
  'WASD / ARROWS — move    SHIFT — run (loud!)',
  'Q or CLICK — toss a chime to lure a guard',
  'P — pause    R — restart level    M — mute',
  'Stay in the dark. Grab every core. Slip out the east gate unseen.',
];
