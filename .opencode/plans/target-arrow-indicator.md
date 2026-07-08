# Fix: Target arrow indicator during targeting mode (Issue #1)

## Problem
When using an attack card with multiple enemies, there is no visual arrow showing which enemy will be targeted. Currently only corner brackets appear on targetable enemies. The user wants a dashed arrow from the hand card toward the hovered/targeted enemy.

## Changes

### 1. `js/main.js` — Add helper methods (before line 726)

Insert two new private methods before `enterTargetingMode`:

```js
// Position the target arrow from a source point (hand card) to a target element's center-top.
_showTargetArrow(sourceX, sourceY, targetEl) {
  const tRect = targetEl.getBoundingClientRect();
  const tx = tRect.left + tRect.width / 2;
  const ty = tRect.top;
  const angle = Math.atan2(ty - sourceY, tx - sourceX) * 180 / Math.PI;
  const dist = Math.hypot(tx - sourceX, ty - sourceY);
  this._targetArrowEl.style.display = 'block';
  this._targetArrowEl.style.left = `${sourceX}px`;
  this._targetArrowEl.style.top = `${sourceY}px`;
  this._targetArrowEl.style.height = `${Math.max(dist * 0.7, 50)}px`;
  this._targetArrowEl.style.transform = `rotate(${angle}deg)`;
},

_hideTargetArrow() {
  if (this._targetArrowEl) {
    this._targetArrowEl.style.display = 'none';
    this._targetArrowEl = null;
  }
},
```

### 2. `js/main.js` — Rewrite `enterTargetingMode()` (line 726-737)

Replace the entire method with:

```js
enterTargetingMode() {
  this._targetingMode = true;
  const run = this.state.run;
  // Highlight targetable enemies on grid
  document.querySelectorAll('.dungeon-card.enemy-card').forEach(el => {
    const row = parseInt(el.dataset.row);
    const col = parseInt(el.dataset.col);
    const cell = run.dungeon.grid.find(c => c.row === row && c.col === col);
    if (cell?.card.revealed && !cell.card.defeated) el.classList.add('targetable');
  });

  // Create persistent arrow element
  const arrow = document.createElement('div');
  arrow.className = 'card-target-arrow';
  arrow.style.display = 'none';
  arrow.style.height = '0px';
  document.body.appendChild(arrow);
  this._targetArrowEl = arrow;

  // Find hand card DOM for source position
  const handCardEl = document.querySelector('.hand-card[data-uuid="' + this._contextUuid + '"]');
  if (!handCardEl) { this.exitTargetingMode(); return; }
  const hRect = handCardEl.getBoundingClientRect();
  const sx = hRect.left + hRect.width / 2;
  const sy = hRect.top - 10;

  // Find nearest targetable enemy for auto-point
  let nearestEl = null, minDist = Infinity;
  document.querySelectorAll('.dungeon-card.enemy-card.targetable').forEach(el => {
    const eRect = el.getBoundingClientRect();
    const d = Math.hypot(eRect.left + eRect.width / 2 - sx, eRect.top - sy);
    if (d < minDist) { minDist = d; nearestEl = el; }
  });
  if (nearestEl) this._showTargetArrow(sx, sy, nearestEl);

  // Mousemove listener on grid for hover-based arrow update
  const onMouseMove = (e) => {
    if (!this._targetingMode || !this._targetArrowEl) return;
    const cardEl = e.target.closest('.dungeon-card.enemy-card.targetable');
    if (cardEl) this._showTargetArrow(sx, sy, cardEl);
  };

  // Touchmove listener for mobile targeting
  const onTouchMove = (e) => {
    if (!this._targetingMode || !this._targetArrowEl) return;
    const touch = e.touches[0];
    const elUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
    const cardEl = elUnderTouch?.closest('.dungeon-card.enemy-card.targetable');
    if (cardEl) this._showTargetArrow(sx, sy, cardEl);
  };

  const gridEl = document.getElementById('dungeon-grid');
  gridEl.addEventListener('mousemove', onMouseMove);
  gridEl.addEventListener('touchmove', onTouchMove, { passive: true });
  // Store references for cleanup
  this._targetingMouseHandler = onMouseMove;
  this._targetingTouchHandler = onTouchMove;
},
```

### 3. `js/main.js` — Rewrite `exitTargetingMode()` (line 739-744)

Replace the entire method with:

```js
exitTargetingMode() {
  this._targetingMode = false;
  document.querySelectorAll('.dungeon-card.targetable').forEach(el => {
    el.classList.remove('targetable');
  });
  // Remove arrow element
  if (this._targetArrowEl) {
    this._targetArrowEl.remove();
    this._targetArrowEl = null;
  }
  // Clean up listeners
  const gridEl = document.getElementById('dungeon-grid');
  if (gridEl && this._targetingMouseHandler) {
    gridEl.removeEventListener('mousemove', this._targetingMouseHandler);
    delete this._targetingMouseHandler;
  }
  if (gridEl && this._targetingTouchHandler) {
    gridEl.removeEventListener('touchmove', this._targetingTouchHandler);
    delete this._targetingTouchHandler;
  }
},
```

### 4. `js/main.js` — Refactor drag arrow to use helper (lines 202-214, optional)

The existing drag arrow code at lines 202-214 duplicates the `_showTargetArrow` logic. After merging, the drag path could call `_showTargetArrow(cx, cy, nearestEl)` instead of inline positioning. This is a nice-to-have refactor to reduce duplication.

## No CSS changes required
The existing `.card-target-arrow` class (line 798) already defines the dashed white line style used during drag. The same styling applies for targeting mode arrows.
