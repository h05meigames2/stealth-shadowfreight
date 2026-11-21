// SHADOW FREIGHT — render.js
// One job: draw everything — the yard, the light and shadow, the guards
// and their vision cones, the courier, the HUD and every menu screen.
// All drawing is canvas 2D; the game owns no image assets at all.

import {
  CANVAS_W, CANVAS_H, HUD_H, TILE, COLS, ROWS, FIELD_Y, FIELD_W, FIELD_H,
  COLORS, GAME_TITLE, GAME_SUBTITLE, CONTROLS_TEXT, LAMP_RADIUS,
  GUARD_VISION_RANGE, GUARD_VISION_HALF_ANGLE, GUARD_RADIUS,
  PLAYER_RADIUS, CHIME_THROW_RANGE,
} from './config.js';
import { blocksSightTile, isShadowTile, isBushTile } from './levels.js';

function conePolygon(ctx, gx, gy, dir, range, halfAngle) {
  ctx.beginPath();
  ctx.moveTo(gx, gy);
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const a = dir - halfAngle + (2 * halfAngle * i) / steps;
    ctx.lineTo(gx + Math.cos(a) * range, gy + Math.sin(a) * range);
  }
  ctx.closePath();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  clear() {
    this.ctx.fillStyle = COLORS.titleBg;
    this.ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  // ---- the yard -------------------------------------------------------

  drawField(level, player, guards, effects) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(0, FIELD_Y);

    // Floor tiles with a checkerboard tint.
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const ch = level.grid[y][x];
        const px = x * TILE;
        const py = y * TILE;
        if (ch === '#') continue;
        if (isShadowTile(ch)) {
          ctx.fillStyle = COLORS.shadowFloor;
        } else {
          ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
        }
        ctx.fillRect(px, py, TILE, TILE);
        if (isShadowTile(ch)) {
          ctx.strokeStyle = COLORS.shadowFloorEdge;
          ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
        }
      }
    }

    // Lamp glow pools on the floor (light = danger).
    for (const lamp of level.lamps) {
      const g = ctx.createRadialGradient(lamp.x, lamp.y, 8, lamp.x, lamp.y, LAMP_RADIUS);
      g.addColorStop(0, COLORS.lampGlow);
      g.addColorStop(1, 'rgba(255, 196, 90, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, LAMP_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }

    // Exit gate glow.
    const e = level.exit;
    const eg = ctx.createRadialGradient(e.x, e.y, 6, e.x, e.y, 70);
    eg.addColorStop(0, level.exitOpen ? COLORS.exitGlow : 'rgba(58, 90, 80, 0.25)');
    eg.addColorStop(1, 'rgba(57, 208, 165, 0)');
    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.arc(e.x, e.y, 70, 0, Math.PI * 2);
    ctx.fill();

    // Bushes / sack stacks.
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (!isBushTile(level.grid[y][x])) continue;
        const px = x * TILE;
        const py = y * TILE;
        ctx.fillStyle = COLORS.bush;
        ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
        ctx.fillStyle = COLORS.bushLeaf;
        for (const [ox, oy, r] of [[12, 12, 8], [26, 16, 9], [16, 28, 8], [30, 30, 6]]) {
          ctx.beginPath();
          ctx.arc(px + ox, py + oy, r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = COLORS.bushEdge;
        ctx.strokeRect(px + 2.5, py + 2.5, TILE - 5, TILE - 5);
      }
    }

    // Crate walls with a top face so they read as stacked boxes.
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (level.grid[y][x] !== '#') continue;
        const px = x * TILE;
        const py = y * TILE;
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = COLORS.wallTop;
        ctx.fillRect(px + 2, py + 2, TILE - 4, 12);
        ctx.strokeStyle = COLORS.wallEdge;
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
        ctx.beginPath();
        ctx.moveTo(px + 2, py + 14);
        ctx.lineTo(px + TILE - 2, py + 14);
        ctx.stroke();
      }
    }

    // Lamps: pole + warm bulb.
    for (const lamp of level.lamps) {
      ctx.fillStyle = COLORS.lampPost;
      ctx.fillRect(lamp.x - 3, lamp.y - 3, 6, 6);
      ctx.fillStyle = COLORS.lampCore;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 210, 122, 0.6)';
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 9, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Data cores.
    for (const core of level.cores) {
      if (core.taken) continue;
      const pulse = 1 + Math.sin(Date.now() / 300) * 0.12;
      const g = ctx.createRadialGradient(core.x, core.y, 2, core.x, core.y, 26 * pulse);
      g.addColorStop(0, COLORS.coreGlow);
      g.addColorStop(1, 'rgba(255, 210, 62, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(core.x, core.y, 26 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(core.x, core.y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = COLORS.core;
      ctx.fillRect(-8, -8, 16, 16);
      ctx.fillStyle = '#7a5c00';
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
    }

    // Exit gate: double doors with a chevron.
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.fillStyle = level.exitOpen ? COLORS.exit : COLORS.exitLocked;
    ctx.fillRect(-16, -18, 10, 36);
    ctx.fillRect(6, -18, 10, 36);
    ctx.fillStyle = level.exitOpen ? '#0b3d2f' : '#16241f';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(level.exitOpen ? 'EXIT' : 'LOCK', 0, -28);
    ctx.restore();

    // Vision cones (under the guards, above the floor).
    for (const guard of guards) {
      const fill = guard.state === 'chase' ? COLORS.coneAlert
        : guard.detection >= 55 ? COLORS.coneSuspicious : COLORS.coneCalm;
      ctx.fillStyle = fill;
      conePolygon(ctx, guard.x, guard.y, guard.dir, guard.visionRange, GUARD_VISION_HALF_ANGLE);
      ctx.fill();
      ctx.strokeStyle = COLORS.coneEdge;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Noise rings and chime pings.
    for (const fx of effects) {
      if (fx.kind === 'noise') {
        ctx.strokeStyle = COLORS.noiseRing;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, fx.r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (fx.kind === 'chime') {
        ctx.strokeStyle = '#7fe3ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, fx.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#7fe3ff';
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Guards: body, visor slit, direction tick, alert mark.
    for (const guard of guards) {
      ctx.save();
      ctx.translate(guard.x, guard.y);
      ctx.fillStyle = guard.state === 'chase' ? '#8c2f26' : COLORS.guard;
      ctx.beginPath();
      ctx.arc(0, 0, GUARD_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COLORS.guardDark;
      ctx.lineWidth = 2;
      ctx.stroke();
      // Visor: a yellow slit facing the guard's direction.
      ctx.rotate(guard.dir);
      ctx.fillStyle = COLORS.guardVisor;
      ctx.fillRect(2, -5, 9, 10);
      ctx.fillStyle = '#d8d2c0';
      ctx.fillRect(-GUARD_RADIUS - 2, -2, 5, 4);
      ctx.restore();
      if (guard.state === 'chase') {
        ctx.fillStyle = '#ff5140';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('!', guard.x, guard.y - 22);
      } else if (guard.state === 'investigate' || guard.state === 'search') {
        ctx.fillStyle = '#ffb347';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('?', guard.x, guard.y - 22);
      }
    }

    // The courier: hooded figure, red coat, facing tick.
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.fillStyle = player.hidden ? 'rgba(201, 79, 66, 0.55)' : COLORS.playerCoat;
    ctx.beginPath();
    ctx.arc(0, 0, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = player.hidden ? 'rgba(232, 228, 216, 0.5)' : COLORS.player;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.rotate(player.facing);
    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.arc(PLAYER_RADIUS - 2, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Chime range hint while the player holds Q-ready (always show faintly).
    ctx.strokeStyle = 'rgba(127, 227, 255, 0.12)';
    ctx.beginPath();
    ctx.arc(player.x, player.y, CHIME_THROW_RANGE, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // ---- HUD ------------------------------------------------------------

  drawHud(state) {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.hudBg;
    ctx.fillRect(0, 0, CANVAS_W, HUD_H);
    ctx.fillStyle = COLORS.hudLine;
    ctx.fillRect(0, HUD_H - 2, CANVAS_W, 2);

    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 20px monospace';
    ctx.fillText(state.levelName, 20, 22);
    ctx.fillStyle = COLORS.hudMuted;
    ctx.font = '14px monospace';
    ctx.fillText(`CORES ${state.coresGot}/${state.coresTotal}    TIME ${state.timeText}    SCORE ${state.score}`, 20, 48);

    // Detection meter.
    const mx = 560;
    const mw = 260;
    ctx.fillStyle = COLORS.hudMuted;
    ctx.font = 'bold 13px monospace';
    ctx.fillText('SEEN', mx, 22);
    ctx.fillStyle = '#1d2026';
    roundRect(ctx, mx + 52, 12, mw, 18, 4);
    ctx.fill();
    const frac = Math.max(0, Math.min(1, state.detection / 100));
    ctx.fillStyle = frac >= 1 ? COLORS.hudDanger : frac >= 0.55 ? '#ff9a2e' : COLORS.hudAccent;
    if (frac > 0) {
      roundRect(ctx, mx + 52, 12, mw * frac, 18, 4);
      ctx.fill();
    }
    ctx.strokeStyle = COLORS.hudLine;
    roundRect(ctx, mx + 52, 12, mw, 18, 4);
    ctx.stroke();
    ctx.fillStyle = state.lit ? COLORS.hudDanger : state.hidden ? COLORS.hudGood : COLORS.hudMuted;
    ctx.font = '13px monospace';
    ctx.fillText(state.lit ? 'IN THE LIGHT!' : state.hidden ? 'HIDDEN' : 'IN SHADOW', mx + 52, 48);

    // Attempts, chimes, mute.
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`ATTEMPTS ${'●'.repeat(state.attempts)}${'○'.repeat(Math.max(0, 3 - state.attempts))}`, 1080, 22);
    ctx.fillStyle = COLORS.hudMuted;
    ctx.font = '14px monospace';
    ctx.fillText(`CHIMES ${state.chimes}   [M] ${state.muted ? 'MUTED' : 'SOUND'}   [P] PAUSE`, 1080, 48);
    ctx.textAlign = 'left';
  }

  // ---- screens ----------------------------------------------------------

  dim() {
    this.ctx.fillStyle = COLORS.overlay;
    this.ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  centeredTitle(title, sub, lines, accent) {
    const ctx = this.ctx;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = accent || COLORS.hudAccent;
    ctx.font = 'bold 64px monospace';
    ctx.fillText(title, CANVAS_W / 2, 190);
    ctx.fillStyle = COLORS.hudText;
    ctx.font = '22px monospace';
    ctx.fillText(sub, CANVAS_W / 2, 240);
    ctx.fillStyle = COLORS.hudMuted;
    ctx.font = '16px monospace';
    lines.forEach((line, i) => {
      ctx.fillText(line, CANVAS_W / 2, 320 + i * 28);
    });
    ctx.textAlign = 'left';
  }

  drawTitle(bestScore) {
    this.clear();
    this.centeredTitle(GAME_TITLE, GAME_SUBTITLE, [
      'You are Wren, a courier for hire. Three data cores are locked',
      'in the Harrow Dock freight yard. Lift them all, then slip out',
      'the east gate — without a single guard ever seeing your face.',
      '',
      'Dark ground hides you. Lamp light betrays you.',
      'Run loud, walk quiet, toss a chime to pull a patrol away.',
      '',
      'PRESS ENTER OR CLICK TO START',
      ...(bestScore > 0 ? [`BEST SCORE: ${bestScore}`] : []),
    ]);
    const ctx = this.ctx;
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.hudMuted;
    ctx.font = '14px monospace';
    CONTROLS_TEXT.forEach((line, i) => {
      ctx.fillText(line, CANVAS_W / 2, 560 + i * 22);
    });
    ctx.textAlign = 'left';
  }

  drawPaused() {
    this.dim();
    this.centeredTitle('PAUSED', 'Take a breath. The guards keep their routes.', [
      'P — resume    R — restart this level    M — mute',
    ]);
  }

  drawLevelClear(stats) {
    this.dim();
    this.centeredTitle('YARD CLEAR', `${stats.levelName} — slipped through clean`, [
      `Cores: ${stats.cores}    Time: ${stats.timeText}    Ghost bonus: ${stats.ghost ? '+500' : '—'}`,
      `Level score: ${stats.levelScore}    Total: ${stats.totalScore}`,
      '',
      'PRESS ENTER FOR THE NEXT YARD',
    ], COLORS.hudGood);
  }

  drawWin(stats) {
    this.clear();
    this.centeredTitle('GHOST OF THE DOCKS', 'All three yards cleared. Nobody saw a thing.', [
      `Cores recovered: ${stats.cores}/${stats.coresTotal}`,
      `Total time: ${stats.timeText}    Final score: ${stats.totalScore}`,
      `Times spotted: ${stats.timesSpotted}    Chimes used: ${stats.chimesUsed}`,
      '',
      'PRESS ENTER OR CLICK TO PLAY AGAIN',
    ], COLORS.hudGood);
  }

  drawCaught(stats) {
    this.dim();
    this.centeredTitle('SPOTTED!', 'A guard caught you in the open.', [
      `Attempts left: ${stats.attempts}`,
      stats.attempts > 0
        ? 'PRESS ENTER TO TRY THIS YARD AGAIN'
        : 'NO ATTEMPTS LEFT — PRESS ENTER FOR THE TITLE SCREEN',
    ], COLORS.hudDanger);
  }

  drawGameOver(stats) {
    this.clear();
    this.centeredTitle('CAUGHT FOR GOOD', 'The yard keeps its cores tonight.', [
      `Score: ${stats.totalScore}    Cores: ${stats.cores}/${stats.coresTotal}`,
      '',
      'PRESS ENTER TO TRY AGAIN FROM DOCK 1',
    ], COLORS.hudDanger);
  }
}
