// SHADOW FREIGHT — player.js
// One job: the courier — movement, collision, running noise, chime throws,
// core pickups and the exit. The game loop asks this object what happened.

import {
  PLAYER_RADIUS, PLAYER_WALK_SPEED, PLAYER_RUN_SPEED,
  CHIME_THROW_RANGE, CHIMES_PER_LEVEL, NOISE_RUN_RADIUS, LAMP_RADIUS,
  FIELD_Y, FIELD_W, FIELD_H,
} from './config.js';
import { circleFits, tileAt, isShadowTile, isBushTile } from './levels.js';

export class Player {
  constructor(level) {
    this.level = level;
    this.reset(level.playerStart);
    this.chimes = CHIMES_PER_LEVEL;
    this.chimeCooldown = 0;
    this.noisePulse = 0; // seconds since last run-noise ring
    this.stepTimer = 0;
  }

  reset(start) {
    this.x = start.x;
    this.y = start.y;
    this.facing = 0;
    this.running = false;
    this.moving = false;
    this.hidden = false;
    this.lit = false;
    this.chimes = CHIMES_PER_LEVEL;
    this.chimeCooldown = 0;
  }

  // Move with axis-separated collision so the player slides along walls.
  update(dt, input, events) {
    const mv = input.moveVector();
    this.moving = mv.x !== 0 || mv.y !== 0;
    this.running = input.running && this.moving;
    const speed = this.running ? PLAYER_RUN_SPEED : PLAYER_WALK_SPEED;
    const nx = this.x + mv.x * speed * dt;
    const ny = this.y + mv.y * speed * dt;
    if (circleFits(this.level, nx, this.y, PLAYER_RADIUS)) this.x = nx;
    if (circleFits(this.level, this.x, ny, PLAYER_RADIUS)) this.y = ny;
    if (this.moving) this.facing = Math.atan2(mv.y, mv.x);

    // Footsteps: soft when walking, a loud ring when running.
    if (this.moving) {
      this.stepTimer -= dt;
      const interval = this.running ? 0.28 : 0.42;
      if (this.stepTimer <= 0) {
        this.stepTimer = interval;
        events.onStep(this.running);
        if (this.running) events.onRunNoise(this.x, this.y, NOISE_RUN_RADIUS);
      }
    }

    if (this.chimeCooldown > 0) this.chimeCooldown -= dt;

    // Chime: Q, or click a point on the floor to toss one there.
    const wantChime = input.wasPressed('q');
    const clicked = input.consumeClick();
    if ((wantChime || clicked) && this.chimes > 0 && this.chimeCooldown <= 0) {
      let tx = this.x + Math.cos(this.facing) * 140;
      let ty = this.y + Math.sin(this.facing) * 140;
      if (clicked) {
        tx = input.mouse.x;
        ty = input.mouse.y - FIELD_Y; // mouse is in canvas space; field starts at FIELD_Y
      }
      const dx = tx - this.x;
      const dy = ty - this.y;
      const d = Math.hypot(dx, dy);
      if (d > CHIME_THROW_RANGE) {
        tx = this.x + (dx / d) * CHIME_THROW_RANGE;
        ty = this.y + (dy / d) * CHIME_THROW_RANGE;
      }
      // Clamp the landing point inside the field.
      tx = Math.max(20, Math.min(FIELD_W - 20, tx));
      ty = Math.max(20, Math.min(FIELD_H - 20, ty));
      this.chimes -= 1;
      this.chimeCooldown = 0.6;
      events.onChime(tx, ty);
    }

    // Hidden / lit state, for the HUD and the guards' vision.
    const tile = tileAt(this.level, this.x, this.y);
    this.hidden = isShadowTile(tile) || isBushTile(tile);
    this.lit = this.computeLit();

    // Core pickup.
    for (const core of this.level.cores) {
      if (!core.taken && Math.hypot(core.x - this.x, core.y - this.y) < 30) {
        core.taken = true;
        events.onCore(core);
      }
    }

    // Exit: only opens once every core is taken.
    if (this.level.exitOpen) {
      const e = this.level.exit;
      if (Math.hypot(e.x - this.x, e.y - this.y) < 34) events.onExit();
    }
  }

  computeLit() {
    if (this.hidden) return false;
    for (const lamp of this.level.lamps) {
      if (Math.hypot(this.x - lamp.x, this.y - lamp.y) < LAMP_RADIUS) return true;
    }
    return false;
  }
}
