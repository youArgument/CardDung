import { BIOME_TILES } from '../data/biomes.js';
import { FOG } from '../engine/worldmap.js';

const TILE_SIZE = 54;
const GAP = 2;
const PADDING = 20; // padding inside grid container.

export class WorldMapUI {
  constructor(containerId, worldMap) {
    this.container = document.getElementById(containerId);
    this.map = worldMap;
    this._offsetX = 0;
    this._offsetY = 0;
    this._scale = 1.0;
    this._isDragging = false;
    this._hasDragged = false;
    this._dragStartX = 0;
    this._dragStartY = 0;
    this._init();
  }

  _init() {
    const size = this.map.size;

    // World mesh (transformable container for pan/zoom).
    this.worldMesh = document.createElement('div');
    this.worldMesh.className = 'worldmap-mesh';
    this.container.appendChild(this.worldMesh);

    // Grid — CSS grid layout.
    this.gridEl = document.createElement('div');
    this.gridEl.className = 'worldmap-grid-cells';
    this.gridEl.style.gridTemplateColumns = `repeat(${size}, ${TILE_SIZE}px)`;
    this.worldMesh.appendChild(this.gridEl);

    // Player token — positioned absolutely inside grid.
    this.playerToken = document.createElement('div');
    this.playerToken.className = 'worldmap-player-token';
    this.playerToken.textContent = '🛡️';
    this.gridEl.appendChild(this.playerToken);

    // Render all tiles as CSS grid children.
    this._renderTiles();

    // Fog overlay for unexplored areas (handled via ::before on each cell).
    this._updateFogAndWalkable();

    // Input: drag-to-pan + tap to move/interact.
    this._setupInput();

    // Center camera after DOM is visible and sized.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.centerOnPlayer());
    });
  }

  _renderTiles() {
    const size = this.map.size;
    this._tileElements = [];

    for (let r = 0; r < size; r++) {
      this._tileElements[r] = [];
      for (let c = 0; c < size; c++) {
        const cell = this.map.getCell(r, c);
        if (!cell) continue;

        const tile = document.createElement('div');
        tile.className = `worldmap-cell`;
        tile.dataset.r = r;
        tile.dataset.c = c;

        // Biome/tile type class.
        const tileData = BIOME_TILES[cell.tileType] || BIOME_TILES.grass;
        tile.classList.add(`biome-${cell.tileType}`);
        if (tileData.sprite) {
          tile.textContent = tileData.sprite;
        }

        // POI icon inside cell.
        const poi = this.map.getObjectAt(r, c);
        if (poi) {
          const poiIcon = document.createElement('div');
          poiIcon.className = `worldmap-poi-icon poi-${poi.type}`;
          poiIcon.textContent = poi.icon || '❓';
          tile.appendChild(poiIcon);

          if (poi.type === 'grace' && poi.isActive) {
            tile.classList.add('grace-active');
          }
        }

        this.gridEl.insertBefore(tile, this.playerToken); // Before player token.
        this._tileElements[r][c] = tile;
      }
    }
  }

  _updateFogAndWalkable() {
    const size = this.map.size;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const tileEl = this._tileElements[r]?.[c];
        if (!tileEl) continue;

        const cell = this.map.getCell(r, c);
        if (!cell) continue;

        // Fog states via CSS classes (fog handled by ::before).
        tileEl.classList.remove('explored', 'visible', 'walkable');

        if (cell.fog === FOG.visible) {
          tileEl.classList.add('visible');
          tileEl.classList.add('explored');

          // Highlight walkable adjacent cells.
          const dr = r - this.map.playerPos.r;
          const dc = c - this.map.playerPos.c;
          if (Math.abs(dr) + Math.abs(dc) === 1 && cell.walkable && !cell.collision) {
            tileEl.classList.add('walkable');
          }
        } else if (cell.fog === FOG.explored) {
          tileEl.classList.add('explored');
        }
      }
    }

    // Update player token position inside grid.
    const pos = this.map.playerPos;
    this.playerToken.style.left = `${pos.c * (TILE_SIZE + GAP) + PADDING}px`;
    this.playerToken.style.top = `${pos.r * (TILE_SIZE + GAP) + PADDING}px`;

    // Update grace-active class on cells.
    for (const obj of this.map.objects.values()) {
      if (obj.type === 'grace' && obj.isActive) {
        const tileEl = this._tileElements[obj.r]?.[obj.c];
        if (tileEl) tileEl.classList.add('grace-active');
      }
    }
  }

  centerOnPlayer() {
    const pos = this.map.playerPos;
    const sw = this.container.clientWidth || 450;
    const sh = this.container.clientHeight || 700;
    const step = TILE_SIZE + GAP;

    this._offsetX = (sw / 2) - (pos.c * step) - (TILE_SIZE / 2);
    this._offsetY = (sh / 2) - (pos.r * step) - (TILE_SIZE / 2);

    this.worldMesh.style.transform = `translate(${this._offsetX}px, ${this._offsetY}px) scale(${this._scale})`;
  }

  updateCamera() {
    this.centerOnPlayer();
  }

  // ─── Drag-to-Pan Input ────────────────────────

  _setupInput() {
    const onStart = (e) => {
      this._isDragging = true;
      this._hasDragged = false;
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      this._dragStartX = cx;
      this._dragStartY = cy;
      this.container.classList.add('grabbing');
      this.worldMesh.classList.add('dragging');
    };

    const onMove = (e) => {
      if (!this._isDragging) return;
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      const dx = cx - this._dragStartX;
      const dy = cy - this._dragStartY;

      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) this._hasDragged = true;

      this._offsetX += dx;
      this._offsetY += dy;
      this._dragStartX = cx;
      this._dragStartY = cy;

      this.worldMesh.style.transform = `translate(${this._offsetX}px, ${this._offsetY}px) scale(${this._scale})`;
    };

    const onEnd = () => {
      this._isDragging = false;
      this.container.classList.remove('grabbing');
      this.worldMesh.classList.remove('dragging');
    };

    // Pan handlers.
    this.container.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    this.container.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);

    // Click handler for tiles.
    this.gridEl.addEventListener('click', (e) => {
      if (this._hasDragged) return;
      const cell = e.target.closest('.worldmap-cell');
      if (!cell) return;

      const r = parseInt(cell.dataset.r);
      const c = parseInt(cell.dataset.c);
      this._handleCellClick(r, c);
    });

    // Keyboard.
    document.addEventListener('keydown', (e) => {
      const dirs = { ArrowUp: [-1,0], ArrowDown: [1,0], ArrowLeft: [0,-1], ArrowRight: [0,1] };
      const d = dirs[e.key];
      if (!d) return;
      e.preventDefault();
      this._handleCellClick(this.map.playerPos.r + d[0], this.map.playerPos.c + d[1]);
    });
  }

  _handleCellClick(r, c) {
    const pos = this.map.playerPos;

    // Teleport mode.
    if (this.map.teleportMode) {
      const obj = this.map.getObjectAt(r, c);
      if (obj?.type === 'grace' && obj.isActive) {
        const res = this.map.teleportTo(obj.id);
        if (res) {
          this._updateFogAndWalkable();
          this.centerOnPlayer();
          this._emit('teleport', res);
        }
      } else {
        this.map.teleportMode = false;
        this._emit('teleport-cancel');
      }
      return;
    }

    // Tap self → interact with POI.
    if (r === pos.r && c === pos.c) {
      const obj = this.map.getObjectAt(pos.r, pos.c);
      if (obj) this._onPOITap(obj);
      return;
    }

    // Move to adjacent walkable cell.
    const res = this.map.movePlayer({ r, c });
    if (res) {
      this._updateFogAndWalkable();
      this.centerOnPlayer();
      this._emit('move', res);
    }
  }

  _onPOITap(obj) {
    switch (obj.type) {
      case 'grace':
        if (!obj.isActive) {
          const res = this.map.interact(obj);
          this._updateFogAndWalkable();
          this._emit('interact', res);
        } else {
          this.map.toggleTeleportMode();
          this._emit('teleport-mode');
        }
        break;
      case 'chest':
        if (!obj.opened) {
          const res = this.map.interact(obj);
          if (res) this._emit('interact', res);
        }
        break;
      case 'boss_entrance':
      case 'dungeon':
        const res = this.map.interact(obj);
        if (res) this._emit('enter', res);
        break;
    }
  }

  _listeners = {};

  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
  }

  _emit(event, data) {
    const cbs = this._listeners[event] || [];
    for (const cb of cbs) cb(data);
  }
}
