// SHADOW FREIGHT — input.js
// One job: read keyboard and mouse and expose a clean per-frame state.
// The game never touches DOM events directly; it reads this object.

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set(); // keys pressed since last consume (edge-triggered)
    this.mouse = { x: 0, y: 0, clicked: false, down: false };
    this.canvas = canvas;
    this.onAnyKey = null; // called on first keydown (audio unlock, title start)

    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (!e.repeat) {
        this.keys.add(e.key.toLowerCase());
        this.pressed.add(e.key.toLowerCase());
        if (this.onAnyKey) this.onAnyKey();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
    });
    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
      this.mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
    });
    canvas.addEventListener('mousedown', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
      this.mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
      this.mouse.down = true;
      this.mouse.clicked = true;
      if (this.onAnyKey) this.onAnyKey();
    });
    window.addEventListener('mouseup', () => { this.mouse.down = false; });
  }

  // Movement vector from WASD / arrows, normalized.
  moveVector() {
    let x = 0;
    let y = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) y -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.hypot(x, y);
      x *= inv;
      y *= inv;
    }
    return { x, y };
  }

  get running() {
    return this.keys.has('shift');
  }

  // Edge-triggered: true once per physical press.
  wasPressed(key) {
    const k = key.toLowerCase();
    if (this.pressed.has(k)) {
      this.pressed.delete(k);
      return true;
    }
    return false;
  }

  consumeClick() {
    const c = this.mouse.clicked;
    this.mouse.clicked = false;
    return c;
  }

  // Call at the end of each frame so stale presses do not leak into the next.
  endFrame() {
    this.pressed.clear();
    this.mouse.clicked = false;
  }
}
