import { BIOME_TILES } from '../data/biomes.js';
import { FOG, HEX_DIRECTIONS, hexDist } from '../engine/worldmap.js';

// ── Hex rendering constants (pointy-topped) ────────────────────────────────
const HEX_SIZE     = 40;
const SQRT3        = Math.sqrt(3);
const STEP_Q       = HEX_SIZE * SQRT3;   // ~69.28 — horizontal step between columns
const STEP_R       = HEX_SIZE * 1.5;      // 60     — vertical step between rows

// ── Camera ──────────────────────────────────────────────────────────────────
const LERP_SPEED   = 0.08;                // per-frame lerp factor (higher = faster)

// ── Interaction thresholds ──────────────────────────────────────────────────
const TAP_RADIUS   = 12;                  // max px a "tap" may wander (generous for both mouse & touch)
const ZOOM_MIN     = 0.3;
const ZOOM_MAX     = 4.0;
const WHEEL_ZOOM   = 0.08;

// ── Colours ─────────────────────────────────────────────────────────────────
const BIOME_COLORS = { grass: '#111e16', rock: '#2a2a2a', water: '#0f1926', road: '#261f11' };
const FOG_HIDDEN   = 'rgba(2,3,5,0.95)';
const FOG_EXPLORED = 'rgba(2,3,5,0.65)';

// ── Hex-direction lookup (pointy-topped, axial) ─────────────────────────────
const ANGLE_STEP   = Math.PI / 180 * 60;
const HEX_ANGLES   = [0, 1, 2, 3, 4, 5].map(i => ANGLE_STEP * i - Math.PI / 6);

/* ------------------------------------------------------------------ */
/*  WorldMapUI — canvas-based hex grid with camera pan/zoom/tap-move  */
/* ------------------------------------------------------------------ */
export class WorldMapUI {
  /* ---------- public surface ---------- */
  /** @param {string} containerId — id of the <div> that wraps the canvas */
  constructor(containerId, worldMap) {
    this.container = document.getElementById(containerId);
    this.map       = worldMap;

    // Camera state.
    this._cx = 0;                       // current camera offset x (CSS px)
    this._cy = 0;                       // current camera offset y
    this._tcx = 0;                      // target camera offset x   (for lerp animation)
    this._tcy = 0;                      // target camera offset y
    this._zoom = 1.0;                   // uniform scale factor

    // Render loop.
    this._rafId      = null;
    this._dirty      = false;           // true when a frame needs painting

    // Pointer (tap / pan) state — one unified model for mouse & touch.
    this._pointerDown     = false;
    this._pointerDragged  = false;      // true once pointer moved past TAP_RADIUS
    this._px0             = 0;          // pointer down clientX
    this._py0             = 0;          // pointer down clientY
    this._snapCx          = 0;          // camera offset at pointer-down (truth for hex resolution)
    this._snapCy          = 0;

    // Pinch-zoom state.
    this._pinchDist0 = null;

    this._init();
  }

  /* ---------- lifecycle ---------- */

  _init() {
    this.canvas = document.getElementById('worldmap-canvas');
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'worldmap-canvas';
      this.container.appendChild(this.canvas);
    }
    this.ctx = this.canvas.getContext('2d');

    // Ensure pointer events work on the canvas.
    this.canvas.style.touchAction = 'none';

    window.addEventListener('resize', () => { this._resize(); this._requestFrame(); });
    this._bindEvents();
  }

  /** Call after the screen becomes visible so container dimensions are correct. */
  activate() {
    this._resize();
    const w = this._w || window.innerWidth;
    this._zoom = Math.max(0.8, (w / STEP_Q) / 7);

    // Paint one frame at player position BEFORE accepting pointer input.
    // This guarantees _cx/_cy match the on-screen image so first tap resolves correctly.
    this.centerOnPlayer(true);          // instant — no animation
    this._requestFrame();

    // Smoothly animate to center (cosmetic, runs after paint).
    requestAnimationFrame(() => this.centerOnPlayer());
  }

  _resize() {
    const rect = this.container.getBoundingClientRect();
    const w = rect.width  || window.innerWidth;
    const h = rect.height || window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    this.canvas.style.width  = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.canvas.width        = Math.round(w * dpr);
    this.canvas.height       = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this._w = w;
    this._h = h;
    this._requestFrame();
  }

  /* ---------- hex geometry (axial ↔ pixel) ---------- */

  /** Axial → world pixel. */
  hexToPixel(q, r) {
    return { x: STEP_Q * (q + r * 0.5), y: STEP_R * r };
  }

  /** World pixel → axial hex (fractional then rounded). */
  pixelToHex(px, py) {
    const qf = (SQRT3 / 3 * px - 1 / 3 * py) / HEX_SIZE;
    const rf = (2 / 3 * py) / HEX_SIZE;
    return this._hexRound(qf, rf);
  }

  _hexRound(qf, rf) {
    const sf = -qf - rf;
    let q = Math.round(qf), r = Math.round(rf), s = Math.round(sf);
    const dq = Math.abs(q - qf), dr = Math.abs(r - rf), ds = Math.abs(s - sf);
    if (dq > dr && dq > ds) q = -r - s;
    else if (dr > ds) r = -q - s;
    return { q, r };
  }

  /* ---------- render loop (single stable rAF) ---------- */

  _requestFrame() {
    if (!this._dirty) { this._dirty = true; this._rafId = requestAnimationFrame(() => this._tick()); }
  }

  _tick() {
    this._render();
    this._dirty = false;
    // Keep loop alive while animating or pointer is down so there's no dead pause.
    if (this._animating || this._pointerDown) {
      this._rafId = requestAnimationFrame(() => this._tick());
    } else {
      this._rafId = null;
    }
  }

  _render() {
    const ctx = this.ctx;
    const w   = this._w || window.innerWidth;
    const h   = this._h || window.innerHeight;
    if (!w || !h) return;
    const hs  = HEX_SIZE * this._zoom;          // scaled hex size

    // Clear.
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, w, h);

    // Viewport centre in world space.
    const vcx = this._cx + w / 2;
    const vcy = this._cy + h / 2;
    const hw  = w / 2, hh = h / 2;

    ctx.lineWidth = 1;

    for (const key in this.map.grid) {
      const cell   = this.map.grid[key];
      const hp     = this.hexToPixel(cell.q, cell.r);
      const sx     = hp.x * this._zoom + vcx;
      const sy     = hp.y * this._zoom + vcy;

      // Frustum cull with margin.
      if (sx < -hw - hs || sx > hw * 3 + hs) continue;
      if (sy < -hh - hs || sy > hh * 3 + hs) continue;

      this._drawHex(ctx, sx, sy, hs, cell);
    }

    this._drawPlayer();
  }

  /* ---------- drawing helpers ---------- */

  _drawHex(ctx, x, y, size, cell) {
    // Outline.
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = HEX_ANGLES[i];
      ctx.lineTo(x + size * Math.cos(a), y + size * Math.sin(a));
    }
    ctx.closePath();

    // Fill.
    ctx.fillStyle = BIOME_COLORS[cell.tileType] || BIOME_COLORS.grass;
    ctx.fill();

    if (cell.fog === FOG.hidden) {
      ctx.fillStyle   = FOG_HIDDEN;
      ctx.fill();
      ctx.strokeStyle = 'rgba(15,30,44,0.5)';
      ctx.stroke();
      return;
    }

    if (cell.fog === FOG.explored) {
      ctx.fillStyle = FOG_EXPLORED;
      ctx.fill();
    }

    // Subtle border.
    ctx.strokeStyle = 'rgba(160,130,80,0.08)';
    ctx.stroke();

    // Highlight walkable neighbours.
    if (cell.fog === FOG.visible && hexDist(cell, this.map.playerPos) === 1 && cell.walkable && !cell.collision) {
      ctx.strokeStyle = 'rgba(233,196,106,0.35)';
      ctx.lineWidth   = 2;
      ctx.stroke();
      ctx.lineWidth   = 1;
    }

    // POI icon.
    if (cell.fog !== FOG.hidden) {
      const poi = this.map._getObjectAt(cell.q, cell.r);
      if (poi) {
        ctx.textAlign     = 'center';
        ctx.textBaseline  = 'middle';
        ctx.font          = `${14 * this._zoom}px Arial`;
        if (poi.type === 'grace' && poi.isActive) {
          ctx.shadowColor = '#e9c46a';
          ctx.shadowBlur  = 10;
        }
        ctx.fillText(poi.icon || '❓', x, y);
        ctx.shadowBlur = 0;
      }
    }

    // Tile sprite (when zoomed in enough).
    if (cell.fog === FOG.visible && this._zoom > 0.6) {
      const td = BIOME_TILES[cell.tileType];
      if (td?.sprite) {
        ctx.textAlign     = 'center';
        ctx.textBaseline  = 'middle';
        ctx.font          = `${12 * this._zoom}px Arial`;
        ctx.fillText(td.sprite, x, y);
      }
    }
  }

  _drawPlayer() {
    const ctx   = this.ctx;
    const pos   = this.map.playerPos;
    const hp    = this.hexToPixel(pos.q, pos.r);
    const px    = hp.x * this._zoom + this._cx + (this._w || window.innerWidth) / 2;
    const py    = hp.y * this._zoom + this._cy + (this._h || window.innerHeight) / 2;
    const rad   = HEX_SIZE * this._zoom * 0.7;

    // Glow ring.
    ctx.beginPath();
    ctx.arc(px, py, rad + 4, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(233,196,106,0.5)';
    ctx.lineWidth   = 2;
    ctx.stroke();

    // Body circle.
    ctx.beginPath();
    ctx.arc(px, py, rad, 0, Math.PI * 2);
    const g = ctx.createRadialGradient(px, py, 0, px, py, rad);
    g.addColorStop(0, '#fff');
    g.addColorStop(0.3, '#e9c46a');
    g.addColorStop(1, '#b8860b');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 2;
    ctx.stroke();

    // Shield emoji.
    ctx.textAlign     = 'center';
    ctx.textBaseline  = 'middle';
    ctx.font          = `${12 * this._zoom}px Arial`;
    ctx.fillText('🛡️', px, py);
  }

  /* ---------- camera ---------- */

  /** Smoothly centre the viewport on the player.
   *  @param {boolean} [instant=false] — skip animation (used by activate).
   */
  centerOnPlayer(instant = false) {
    const hp = this.hexToPixel(this.map.playerPos.q, this.map.playerPos.r);
    this._tcx = -hp.x * this._zoom;
    this._tcy = -hp.y * this._zoom;

    if (instant || this._pointerDown) {
      // Snap immediately — either first paint or pointer is down (don't animate under drag).
      this._cx = this._tcx;
      this._cy = this._tcy;
      this._requestFrame();
      return;
    }

    this._startLerp();
  }

  _animating = false;

  _startLerp() {
    if (this._animating) return;
    this._animating = true;
    const step = () => {
      const dx = this._tcx - this._cx;
      const dy = this._tcy - this._cy;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
        this._cx = this._tcx;
        this._cy = this._tcy;
        this._animating = false;
        this._requestFrame();
        return;
      }
      this._cx += dx * LERP_SPEED;
      this._cy += dy * LERP_SPEED;
      this._requestFrame();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- hex resolution ---------- */

  /** Convert viewport (client) coords to axial hex, given a camera offset. */
  _screenToHex(cx, cy, offX, offY) {
    const rect = this.canvas.getBoundingClientRect();
    const vx   = cx - rect.left;          // position inside canvas (CSS px)
    const vy   = cy - rect.top;
    const w    = this._w || this.canvas.clientWidth;
    const h    = this._h || this.canvas.clientHeight;

    // Inverse of render transform:  screen = world * zoom + offset + viewportCentre
    const wx = (vx - w / 2 - offX) / this._zoom;
    const wy = (vy - h / 2 - offY) / this._zoom;
    return this.pixelToHex(wx, wy);
  }

  /* ---------- event binding ---------- */

  _bindEvents() {
    // ── Pointer Events (unified mouse + single-finger touch pan/tap) ────────
    this.canvas.addEventListener('pointerdown',   e => this._onPointerDown(e));
    window.addEventListener(      'pointermove',   e => this._onPointerMove(e));
    window.addEventListener(      'pointerup',     e => this._onPointerUp(e));
    window.addEventListener(      'pointercancel', ()  => this._onPointerCancel());

    // ── Touch Events (multi-finger pinch zoom only) ─────────────────────────
    this.canvas.addEventListener('touchstart', e => this._onTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove',  e => this._onTouchMove(e),  { passive: false });

    // ── Wheel zoom (desktop mouse wheel / trackpad) ─────────────────────────
    this.container.addEventListener('wheel', e => this._onWheel(e), { passive: false });

    // ── Keyboard movement ───────────────────────────────────────────────────
    document.addEventListener('keydown', e => this._onKey(e));
  }

  /* ---------- pointer (tap / pan) ---------- */

  _onPointerDown(e) {
    if (e.button !== 0 && e.pointerType === 'mouse') return; // ignore right-click etc.

    this._pointerDown   = true;
    this._pointerDragged = false;
    this._px0           = e.clientX;
    this._py0           = e.clientY;
    this._snapCx        = this._cx;     // camera truth at press time
    this._snapCy        = this._cy;

    // Stop any in-flight camera animation so the pointer has a stable reference.
    this._animating = false;

    // Claim capture so we get pointerup even if cursor leaves the canvas.
    try { this.canvas.setPointerCapture(e.pointerId); } catch {}
  }

  _onPointerMove(e) {
    if (!this._pointerDown) return;

    const dx = e.clientX - this._px0;
    const dy = e.clientY - this._py0;

    // Classify as drag once moved past threshold.
    if (!this._pointerDragged && (Math.abs(dx) > TAP_RADIUS || Math.abs(dy) > TAP_RADIUS)) {
      this._pointerDragged = true;
    }

    if (this._pointerDragged) {
      // Pan the camera.
      this._cx += dx;
      this._cy += dy;
      this._tcx = this._cx;
      this._tcy = this._cy;
      this._px0 = e.clientX;
      this._py0 = e.clientY;
      this._requestFrame();
    }
  }

  _onPointerUp(e) {
    if (!this._pointerDown) return;

    try { this.canvas.releasePointerCapture(e.pointerId); } catch {}
    this._pointerDown = false;

    // Tap (not dragged) → resolve hex and move.
    if (!this._pointerDragged) {
      const hex = this._screenToHex(this._px0, this._py0, this._snapCx, this._snapCy);
      this._handleCellClick(hex.q, hex.r);
    }
  }

  _onPointerCancel() {
    // System interrupted (phone call, IME, etc.) — abort silently.
    this._pointerDown   = false;
    this._pointerDragged = true;       // suppress tap on recovery
  }

  /* ---------- pinch zoom (touch) ---------- */

  _onTouchStart(e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      this._pinchDist0 = _touchDist(e.touches);
      // Stop camera animation during pinch.
      this._animating = false;
    }
  }

  _onTouchMove(e) {
    if (e.touches.length !== 2 || !this._pinchDist0) return;
    e.preventDefault();

    const dist   = _touchDist(e.touches);
    const ratio  = dist / this._pinchDist0;
    const newZ   = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, this._zoom * ratio));

    // Zoom toward pinch midpoint.
    const rect   = this.canvas.getBoundingClientRect();
    const midX   = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
    const midY   = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

    this._cx += (midX - this.canvas.clientWidth / 2) * (this._zoom - newZ);
    this._cy += (midY - this.canvas.clientHeight / 2) * (this._zoom - newZ);
    this._tcx = this._cx;
    this._tcy = this._cy;

    this._zoom        = newZ;
    this._pinchDist0  = dist;
    this._requestFrame();
  }

  /* ---------- wheel zoom ──────────────────── */

  _onWheel(e) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? (1 + WHEEL_ZOOM) : (1 - WHEEL_ZOOM);
    this._zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, this._zoom * factor));
    this._requestFrame();
  }

  /* ---------- keyboard ────────────────────── */

  _DIRS = {
    ArrowUp: [0, -1], ArrowDown: [0, 1],
    ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    ',': [-1, 1], '.': [1, -1],
  };

  _onKey(e) {
    const d = this._DIRS[e.key];
    if (!d) return;
    e.preventDefault();
    this._handleCellClick(this.map.playerPos.q + d[0], this.map.playerPos.r + d[1]);
  }

  /* ---------- cell interaction ────────────── */

  _handleCellClick(q, r) {
    const pos = this.map.playerPos;

    // Grace teleport mode.
    if (this.map.teleportMode) {
      const obj = this.map.getObjectAt(q, r);
      if (obj?.type === 'grace' && obj.isActive) {
        const res = this.map.teleportTo(obj.id);
        if (res) { this.centerOnPlayer(); this._emit('teleport', res); }
      } else {
        this.map.teleportMode = false;
        this._emit('teleport-cancel');
      }
      return;
    }

    // Tapped own cell → interact with POI.
    if (q === pos.q && r === pos.r) {
      const obj = this.map.getObjectAt(pos.q, pos.r);
      if (obj) this._onPOITap(obj);
      return;
    }

    // Move to adjacent hex.
    const res = this.map.movePlayer({ q, r });
    if (res) {
      this.centerOnPlayer();
      this._emit('move', res);
    }
  }

  _onPOITap(obj) {
    switch (obj.type) {
      case 'grace':
        if (!obj.isActive) {
          const r = this.map.interact(obj);
          this._requestFrame();
          this._emit('interact', r);
        } else {
          this.map.toggleTeleportMode();
          this._emit('teleport-mode');
        }
        break;
      case 'chest':
        if (!obj.opened) {
          const cr = this.map.interact(obj);
          if (cr) { this._requestFrame(); this._emit('interact', cr); }
        }
        break;
      case 'boss_entrance':
      case 'dungeon': {
        const er = this.map.interact(obj);
        if (er) this._emit('enter', er);
        break;
      }
    }
  }

  /* ---------- event emitter ───────────────── */

  _listeners = {};

  on(event, cb) {
    (this._listeners[event] ||= []).push(cb);
  }

  _emit(event, data) {
    for (const cb of (this._listeners[event] || [])) cb(data);
  }
}

/* ── util ─────────────────────────────────── */
function _touchDist(t) {
  const dx = t[0].clientX - t[1].clientX;
  const dy = t[0].clientY - t[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}
