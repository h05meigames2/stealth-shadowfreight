// SHADOW FREIGHT — main.js
// One job: the game loop and the state machine — title, playing, paused,
// level clear, caught, won and game over — plus score, timer and attempts.
// It wires input, player, guards, audio and the renderer together.

import {
  CANVAS_W, CANVAS_H, START_ATTEMPTS, CORE_SCORE,
  LEVEL_CLEAR_SCORE, GHOST_BONUS, TIME_BONUS_PER_SECOND,
  TIME_BONUS_CAP_SECONDS,
} from './config.js';
import { buildLevel, levelName, LEVEL_COUNT } from './levels.js';
import { Guard } from './guards.js';
import { Player } from './player.js';
import { Renderer } from './render.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';
import { buildShotScene } from './shots.js';

function formatTime(sec) {
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.input = new Input(canvas);
    this.audio = new SoundBank();
    this.input.onAnyKey = () => this.audio.ensure();
    this.state = 'title';
    this.bestScore = 0;
    try {
      this.bestScore = Number(localStorage.getItem('shadowfreight-best') || 0) || 0;
    } catch (e) { this.bestScore = 0; }
    this.levelIndex = 0;
    this.level = null;
    this.player = null;
    this.guards = [];
    this.effects = [];
    this.score = 0;
    this.levelStartScore = 0;
    this.attempts = START_ATTEMPTS;
    this.elapsedSec = 0;
    this.levelElapsedSec = 0;
    this.timesSpotted = 0;
    this.chimesUsed = 0;
    this.coresCollected = 0;
    this.coresTotal = 12; // 3 + 4 + 5 cores across the three yards
    this.levelGhost = true; // true until a guard fully alerts on this level
    this.shotScene = null;
    this.lastTs = 0;

    // Screenshot mode: ?shot=start|play|win|caught (&seed=1, ignored value,
    // kept so the URL is stable and repeatable).
    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    if (shot) {
      this.shotScene = buildShotScene(shot);
      this.state = 'shot';
    }
  }

  startGame() {
    this.score = 0;
    this.attempts = START_ATTEMPTS;
    this.elapsedSec = 0;
    this.timesSpotted = 0;
    this.chimesUsed = 0;
    this.coresCollected = 0;
    this.loadLevel(0);
    this.state = 'playing';
  }

  loadLevel(index) {
    this.levelIndex = index;
    this.level = buildLevel(index);
    this.player = new Player(this.level);
    this.guards = this.level.guards.map((def) => new Guard(def, this.level));
    this.effects = [];
    this.levelStartScore = this.score;
    this.levelStartCores = this.coresCollected;
    this.levelElapsedSec = 0;
    this.levelGhost = true;
  }

  restartLevel() {
    this.score = this.levelStartScore;
    this.coresCollected = this.levelStartCores;
    this.loadLevel(this.levelIndex);
    this.state = 'playing';
  }

  saveBest() {
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      try { localStorage.setItem('shadowfreight-best', String(this.bestScore)); } catch (e) { /* private mode */ }
    }
  }

  // ---- events from player / guards -------------------------------------

  events() {
    return {
      onStep: (running) => this.audio.footstep(running),
      onRunNoise: (x, y, radius) => {
        this.effects.push({ kind: 'noise', x, y, r: 10, maxR: radius, ttl: 0.5 });
        for (const g of this.guards) g.hearFootsteps(x, y);
      },
      onChime: (x, y) => {
        this.chimesUsed += 1;
        this.audio.chimeToss();
        this.effects.push({ kind: 'chime', x, y, r: 6, maxR: 90, ttl: 1.1 });
        setTimeout(() => this.audio.chimeRing(), 250);
        for (const g of this.guards) g.hearChime(x, y);
      },
      onCore: () => {
        this.audio.pickup();
        this.score += CORE_SCORE;
        this.coresCollected += 1;
        const got = this.level.cores.filter((c) => c.taken).length;
        if (got === this.level.cores.length) this.level.exitOpen = true;
      },
      onExit: () => this.completeLevel(),
      onSuspicious: () => this.audio.suspicious(),
      onAlert: () => {
        this.audio.alert();
        this.timesSpotted += 1;
        this.levelGhost = false;
      },
      onCaught: () => this.getCaught(),
    };
  }

  completeLevel() {
    const timeBonus = Math.max(0, TIME_BONUS_CAP_SECONDS - Math.floor(this.levelElapsedSec))
      * TIME_BONUS_PER_SECOND;
    const ghost = this.levelGhost ? GHOST_BONUS : 0;
    const levelScore = LEVEL_CLEAR_SCORE + timeBonus + ghost;
    this.score += levelScore;
    this.audio.levelClear();
    this.levelClearStats = {
      levelName: levelName(this.levelIndex),
      cores: this.level.cores.length,
      timeText: formatTime(this.levelElapsedSec),
      ghost: this.levelGhost,
      levelScore,
      totalScore: this.score,
    };
    if (this.levelIndex + 1 >= LEVEL_COUNT) {
      this.state = 'won';
      this.audio.win();
      this.saveBest();
      this.winStats = {
        cores: this.coresCollected,
        coresTotal: this.coresTotal,
        timeText: formatTime(this.elapsedSec),
        totalScore: this.score,
        timesSpotted: this.timesSpotted,
        chimesUsed: this.chimesUsed,
      };
    } else {
      this.state = 'levelclear';
    }
  }

  getCaught() {
    this.audio.caught();
    this.attempts -= 1;
    this.saveBest();
    this.state = this.attempts > 0 ? 'caught' : 'gameover';
  }

  // ---- update ------------------------------------------------------------

  update(dt) {
    if (this.state === 'playing') {
      this.elapsedSec += dt;
      this.levelElapsedSec += dt;
      this.player.update(dt, this.input, this.events());
      const ev = this.events();
      for (const g of this.guards) g.update(dt, this.player, ev);
      // If a guard caught the player mid-update, stop the frame here.
      if (this.state !== 'playing') return;
      // Effects age out.
      for (const fx of this.effects) {
        fx.ttl -= dt;
        fx.r += (fx.maxR - fx.r) * dt * 6;
      }
      this.effects = this.effects.filter((fx) => fx.ttl > 0);

      if (this.input.wasPressed('p')) { this.state = 'paused'; this.audio.click(); }
      if (this.input.wasPressed('r')) { this.restartLevel(); }
    } else if (this.state === 'paused') {
      if (this.input.wasPressed('p')) { this.state = 'playing'; this.audio.click(); }
      if (this.input.wasPressed('r')) { this.restartLevel(); }
    } else if (this.state === 'title') {
      if (this.input.wasPressed('enter') || this.input.consumeClick()) {
        this.audio.ensure();
        this.audio.click();
        this.startGame();
      }
    } else if (this.state === 'levelclear') {
      if (this.input.wasPressed('enter')) {
        this.audio.click();
        this.loadLevel(this.levelIndex + 1);
        this.state = 'playing';
      }
    } else if (this.state === 'caught') {
      if (this.input.wasPressed('enter')) {
        this.audio.click();
        this.restartLevel();
      }
    } else if (this.state === 'won' || this.state === 'gameover') {
      if (this.input.wasPressed('enter') || this.input.consumeClick()) {
        this.audio.click();
        this.state = 'title';
      }
    }

    if (this.input.wasPressed('m')) {
      this.audio.setMuted(!this.audio.muted);
    }
  }

  // ---- render ------------------------------------------------------------

  hudState() {
    const got = this.level ? this.level.cores.filter((c) => c.taken).length : 0;
    const total = this.level ? this.level.cores.length : 0;
    return {
      levelName: levelName(this.levelIndex),
      coresGot: got,
      coresTotal: total,
      timeText: formatTime(this.elapsedSec),
      score: this.score,
      detection: Math.max(0, ...this.guards.map((g) => g.detection)),
      lit: this.player ? this.player.lit : false,
      hidden: this.player ? this.player.hidden : false,
      attempts: this.attempts,
      chimes: this.player ? this.player.chimes : 0,
      muted: this.audio.muted,
    };
  }

  render() {
    const r = this.renderer;
    if (this.state === 'shot') {
      const s = this.shotScene;
      if (!s) { r.clear(); return; }
      if (s.kind === 'title') { r.drawTitle(this.bestScore); return; }
      if (s.kind === 'win') { r.drawWin(s.stats); return; }
      // play / caught: draw the field, the HUD, then the overlay.
      r.clear();
      r.drawField(s.level, s.player, s.guards, s.effects || []);
      r.drawHud({
        levelName: levelName(0),
        coresGot: s.level.cores.filter((c) => c.taken).length,
        coresTotal: s.level.cores.length,
        timeText: formatTime(s.elapsedSec),
        score: s.score,
        detection: s.detection,
        lit: s.player.lit,
        hidden: s.player.hidden,
        attempts: s.attempts,
        chimes: s.player.chimes,
        muted: false,
      });
      if (s.kind === 'caught') r.drawCaught(s.stats);
      return;
    }

    if (this.state === 'title') { r.drawTitle(this.bestScore); return; }
    if (this.state === 'won') { r.drawWin(this.winStats); return; }
    if (this.state === 'gameover') {
      r.drawGameOver({
        totalScore: this.score,
        cores: this.coresCollected,
        coresTotal: this.coresTotal,
      });
      return;
    }

    // In-world states share the field + HUD.
    r.clear();
    r.drawField(this.level, this.player, this.guards, this.effects);
    r.drawHud(this.hudState());
    if (this.state === 'paused') r.drawPaused();
    else if (this.state === 'levelclear') r.drawLevelClear(this.levelClearStats);
    else if (this.state === 'caught') {
      r.drawCaught({ attempts: this.attempts });
    }
  }

  frame(ts) {
    const dt = Math.min(0.05, (ts - this.lastTs) / 1000 || 0.016);
    this.lastTs = ts;
    if (this.state !== 'shot') this.update(dt);
    this.render();
    this.input.endFrame();
    requestAnimationFrame((t) => this.frame(t));
  }

  run() {
    requestAnimationFrame((t) => this.frame(t));
  }
}

const canvas = document.getElementById('game');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;
const game = new Game(canvas);
// Exposed for play-testing and screenshots; the game itself never reads it.
window.__shadowfreight = game;
game.run();
