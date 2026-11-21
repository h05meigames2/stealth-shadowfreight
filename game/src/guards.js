// SHADOW FREIGHT — guards.js
// One job: guard AI — patrol routes, vision cones, suspicion, chase,
// and investigating noises (footsteps, chimes).
//
// States: 'patrol' -> 'suspicious' (seen briefly, meter < 100)
//        -> 'chase' (meter hit 100) -> 'search' (lost you) -> 'patrol'
//        'investigate' (heard a noise) -> 'patrol'

import {
  GUARD_RADIUS, GUARD_PATROL_SPEED, GUARD_CHASE_SPEED,
  GUARD_INVESTIGATE_SPEED, GUARD_VISION_RANGE, GUARD_VISION_HALF_ANGLE,
  GUARD_CATCH_DIST, DETECTION_FILL_BASE, DETECTION_DECAY,
  DETECTION_ALERT_AT, CHASE_SECONDS, SEARCH_SECONDS, NOISE_HEAR_RADIUS,
  CHIME_HEAR_RADIUS, PLAYER_CLOSE_SEEN_DIST, LAMP_RADIUS,
} from './config.js';
import { hasLineOfSight, tileAt, isShadowTile, isBushTile } from './levels.js';

export class Guard {
  constructor(def, level) {
    this.level = level;
    this.waypoints = def.waypoints;
    this.pauseAtWaypoint = def.pause;
    this.x = def.waypoints[0].x;
    this.y = def.waypoints[0].y;
    this.dir = 0; // facing angle, radians
    this.wpIndex = 1;
    this.pauseTimer = 0;
    this.state = 'patrol';
    this.speed = GUARD_PATROL_SPEED * level.patrolSpeed;
    this.visionRange = level.visionRange;
    this.detection = 0; // 0..100, shared meter with the player
    this.chaseTimer = 0;
    this.searchTimer = 0;
    this.investigateTarget = null;
    this.lookTimer = 0;
    this.lastSeen = null;
    this.suspicionPinged = false;
  }

  // Can this guard see the player right now?
  // Hidden in shadow or bush — unless the guard is almost on top of you.
  canSee(player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > this.visionRange) return false;
    if (dist > PLAYER_CLOSE_SEEN_DIST) {
      const angle = Math.atan2(dy, dx);
      let diff = angle - this.dir;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) > GUARD_VISION_HALF_ANGLE) return false;
      const tile = tileAt(this.level, player.x, player.y);
      if (isShadowTile(tile) || isBushTile(tile)) return false;
      if (!this.isPlayerLit(player)) return false;
    }
    return hasLineOfSight(this.level, this.x, this.y, player.x, player.y);
  }

  // Lit = inside a lamp's glow and not standing in shadow or a bush.
  isPlayerLit(player) {
    const tile = tileAt(this.level, player.x, player.y);
    if (isShadowTile(tile) || isBushTile(tile)) return false;
    for (const lamp of this.level.lamps) {
      if (Math.hypot(player.x - lamp.x, player.y - lamp.y) < LAMP_RADIUS) return true;
    }
    return false;
  }

  hearNoise(nx, ny, radius) {
    if (this.state === 'chase') return;
    const d = Math.hypot(nx - this.x, ny - this.y);
    if (d < radius) {
      this.state = 'investigate';
      this.investigateTarget = { x: nx, y: ny };
      this.lookTimer = 0;
    }
  }

  hearChime(nx, ny) {
    this.hearNoise(nx, ny, CHIME_HEAR_RADIUS);
  }

  hearFootsteps(nx, ny) {
    this.hearNoise(nx, ny, NOISE_HEAR_RADIUS);
  }

  update(dt, player, events) {
    const seen = this.canSee(player);
    if (seen) {
      this.lastSeen = { x: player.x, y: player.y };
      const dist = Math.hypot(player.x - this.x, player.y - this.y);
      const closeness = 1 - (dist / this.visionRange);
      this.detection = Math.min(DETECTION_ALERT_AT,
        this.detection + DETECTION_FILL_BASE * (0.55 + 0.75 * closeness) * dt);
      if (this.detection >= 55 && !this.suspicionPinged) {
        this.suspicionPinged = true;
        events.onSuspicious();
      }
      if (this.detection >= DETECTION_ALERT_AT && this.state !== 'chase') {
        this.state = 'chase';
        this.chaseTimer = CHASE_SECONDS;
        events.onAlert();
      }
    } else {
      if (this.state !== 'chase') {
        this.detection = Math.max(0, this.detection - DETECTION_DECAY * dt);
        if (this.detection < 40) this.suspicionPinged = false;
      }
    }

    if (this.state === 'patrol') this.updatePatrol(dt);
    else if (this.state === 'chase') this.updateChase(dt, player, events);
    else if (this.state === 'search') this.updateSearch(dt, events);
    else if (this.state === 'investigate') this.updateInvestigate(dt, events);
  }

  moveToward(tx, ty, speed, dt) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 1) return true;
    const step = Math.min(d, speed * dt);
    this.x += (dx / d) * step;
    this.y += (dy / d) * step;
    this.dir = Math.atan2(dy, dx);
    return d - step < 2;
  }

  updatePatrol(dt) {
    if (this.pauseTimer > 0) {
      this.pauseTimer -= dt;
      // Scan the area while paused: slow sweep of the vision cone.
      this.dir += Math.sin(Date.now() / 900 + this.wpIndex) * 0.4 * dt;
      return;
    }
    const target = this.waypoints[this.wpIndex];
    if (this.moveToward(target.x, target.y, this.speed, dt)) {
      this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
      this.pauseTimer = this.pauseAtWaypoint;
    }
  }

  updateChase(dt, player, events) {
    this.chaseTimer -= dt;
    this.moveToward(player.x, player.y, GUARD_CHASE_SPEED, dt);
    if (Math.hypot(player.x - this.x, player.y - this.y) < GUARD_CATCH_DIST) {
      events.onCaught();
      return;
    }
    if (this.chaseTimer <= 0) {
      this.state = 'search';
      this.searchTimer = SEARCH_SECONDS;
      this.detection = 45;
    }
  }

  updateSearch(dt, events) {
    this.searchTimer -= dt;
    // Sweep around the last place you were seen.
    this.dir += 1.6 * dt;
    if (this.searchTimer <= 0) {
      this.state = 'patrol';
      this.detection = Math.min(this.detection, 30);
    }
  }

  updateInvestigate(dt, events) {
    if (!this.investigateTarget) { this.state = 'patrol'; return; }
    const arrived = this.moveToward(
      this.investigateTarget.x, this.investigateTarget.y,
      GUARD_INVESTIGATE_SPEED, dt);
    if (arrived) {
      this.lookTimer += dt;
      this.dir += 1.8 * dt;
      if (this.lookTimer > 1.6) {
        this.investigateTarget = null;
        this.state = 'patrol';
      }
    }
  }
}
