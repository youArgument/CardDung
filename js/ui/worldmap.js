import { BIOME_TILES } from '../data/biomes.js';
import { FOG } from '../engine/worldmap.js';
import { t } from '../system/i18n.js';

const TILE_SIZE = 32; // px per tile on mobile portrait.
const VISIBLE_RADIUS = 6; // tiles visible in each direction from center.

export class WorldMapUI {
  constructor(containerId, worldMap) {
    this.container = document.getElementById(containerId);
    this.map = worldMap;
    this.gridEl = null;
    this.playerMarker = null;
    this._init();
  }

  _init() {
    // Create the grid container.
    this.gridEl = document.createElement('div');
    this.gridEl.className = 'worldmap-grid';
    this.container.appendChild(this.gridEl);

    // Create tile elements for visible area.
    this._renderTiles();

    // Player marker.
    this.playerMarker = document.createElement('div');
    this.playerMarker.className = 'worldmap-player';
    this.playerMarker.textContent = '🧙';
    this.container.appendChild(this.playerMarker);

    // POI overlay layer.
    this.poiLayer = document.createElement('div');
    this.poiLayer.className = 'worldmap-poi-layer';
    this.container.appendChild(this.poiLayer);

    // Input handling.
     this._setupInput();

     // Initial camera position — defer until container is visible and sized.
     requestAnimationFrame(() => {
       requestAnimationFrame(() => this.updateCamera());
     });
   }

  _renderTiles() {
    const size = this.map.size;
    this.gridEl.innerHTML = '';
    this._tileElements = [];

    // Set grid container dimensions.
    this.gridEl.style.width = `${size * TILE_SIZE}px`;
    this.gridEl.style.height = `${size * TILE_SIZE}px`;

    for (let r = 0; r < size; r++) {
      this._tileElements[r] = [];
      for (let c = 0; c < size; c++) {
        const cell = this.map.getCell(r, c);
        if (!cell) continue;

        const tile = document.createElement('div');
        tile.className = `worldmap-tile worldmap-tile-${cell.tileType}`;
        tile.dataset.r = r;
        tile.dataset.c = c;
        tile.style.left = `${c * TILE_SIZE}px`;
        tile.style.top = `${r * TILE_SIZE}px`;

        const tileData = BIOME_TILES[cell.tileType] || BIOME_TILES.grass;
        if (tileData.sprite) {
          tile.textContent = tileData.sprite;
        }

        this.gridEl.appendChild(tile);
        this._tileElements[r][c] = tile;
      }
    }
  }

  updateTiles() {
    // Update fog states and POI visibility on existing tiles.
    const size = this.map.size;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const tile = this._tileElements?.[r]?.[c];
        if (!tile) continue;

        const cell = this.map.getCell(r, c);
        if (!cell) continue;

        // Fog states.
        tile.classList.toggle('fog-hidden', cell.fog === FOG.hidden);
        tile.classList.toggle('fog-explored', cell.fog === FOG.explored);
        tile.classList.toggle('fog-visible', cell.fog === FOG.visible);

        // Tile type colors/sprites already set at creation.
      }
    }

    this._renderPOIs();
  }

  _renderPOIs() {
    if (!this.poiLayer) return;
    this.poiLayer.innerHTML = '';

    const size = this.map.size;
    this.poiLayer.style.width = `${size * TILE_SIZE}px`;
    this.poiLayer.style.height = `${size * TILE_SIZE}px`;

    for (const obj of this.map.objects.values()) {
      const cell = this.map.getCell(obj.r, obj.c);
      if (!cell || cell.fog === FOG.hidden) continue; // Don't show hidden POIs.

      const poiEl = document.createElement('div');
      poiEl.className = `worldmap-poi worldmap-poi-${obj.type}`;
      poiEl.dataset.id = obj.id;
      poiEl.textContent = obj.icon || '❓';
      poiEl.style.left = `${obj.c * TILE_SIZE}px`;
      poiEl.style.top = `${obj.r * TILE_SIZE}px`;

      if (cell.fog === FOG.explored) {
        poiEl.classList.add('poi-explored'); // Dimmed for explored.
      }

      this.poiLayer.appendChild(poiEl);
    }
  }

  updateCamera() {
    const pos = this.map.playerPos;
    const screenW = this.container.clientWidth || 450;
    const screenH = this.container.clientHeight || 700;

    // Center the grid on the player: shift so player tile is at center of screen.
    const offsetX = -(pos.c * TILE_SIZE) + (screenW / 2) - (TILE_SIZE / 2);
    const offsetY = -(pos.r * TILE_SIZE) + (screenH / 2) - (TILE_SIZE / 2);

    this.gridEl.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

    // Position POI layer to match grid.
    if (this.poiLayer) {
      this.poiLayer.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    }

    // Update player marker position (always centered).
    if (this.playerMarker) {
      this.playerMarker.style.left = `${screenW / 2 - TILE_SIZE / 2}px`;
      this.playerMarker.style.top = `${screenH / 2 - TILE_SIZE / 2}px`;
    }
  }

  // ─── Input Handling ──────────────────────────────

  _setupInput() {
    let longPressTimer = null;

    const handleTap = (e) => {
      e.preventDefault();
      if (!this.map) return;

      // Calculate which tile was tapped relative to the grid.
      const rect = this.container.getBoundingClientRect();
      const touch = e.touches ? e.changedTouches[0] : e;
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      // Convert screen coords to grid coords.
      const pos = this.map.playerPos;
      const tileCol = Math.round((x + (pos.c * TILE_SIZE - rect.width / 2)) / TILE_SIZE);
      const tileRow = Math.round((y + (pos.r * TILE_SIZE - rect.height / 2)) / TILE_SIZE);

      // Clamp to grid bounds.
      const r = Math.max(0, Math.min(this.map.size - 1, tileRow));
      const c = Math.max(0, Math.min(this.map.size - 1, tileCol));

      this._handleCellTap(r, c);
    };

    // Touch handling for mobile.
    this.container.addEventListener('touchstart', (e) => {
      longPressTimer = setTimeout(() => {
        // Long press on grace → toggle teleport mode.
        const obj = this.map.getObjectAt(this.map.playerPos.r, this.map.playerPos.c);
        if (obj?.type === 'grace') {
          this._onGraceLongPress(obj);
        }
      }, 500);
    }, { passive: true });

    this.container.addEventListener('touchend', (e) => {
      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
      handleTap(e);
    });

    // Mouse handling for desktop.
    this.container.addEventListener('click', handleTap);

    // Keyboard arrows for movement.
    document.addEventListener('keydown', (e) => {
      if (!this.map) return;
      const dir = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
      const d = dir[e.key];
      if (d) {
        e.preventDefault();
        this._handleCellTap(this.map.playerPos.r + d[0], this.map.playerPos.c + d[1]);
      }
    });
  }

  _handleCellTap(r, c) {
    const pos = this.map.playerPos;

    // Teleport mode: click on grace to teleport.
    if (this.map.teleportMode) {
      const obj = this.map.getObjectAt(r, c);
      if (obj?.type === 'grace' && obj.isActive) {
        const result = this.map.teleportTo(obj.id);
        if (result) {
          this.updateTiles();
          this.updateCamera();
          this._emit('teleport', result);
        }
        return;
      }
      // Cancel teleport mode on non-grace click.
      this.map.teleportMode = false;
      this._emit('teleport-cancel');
      return;
    }

    // Movement: tap adjacent cell to move.
    if (r === pos.r && c === pos.c) {
      // Tap self → interact with POI at current position.
      const obj = this.map.getObjectAt(pos.r, pos.c);
      if (obj) {
        this._onPOITap(obj);
      }
      return;
    }

    const result = this.map.movePlayer({ r, c });
    if (result) {
      this.updateTiles();
      this.updateCamera();
      this._emit('move', result);
    }
  }

  _onPOITap(obj) {
    switch (obj.type) {
      case 'grace':
        if (!obj.isActive) {
          const res = this.map.interact(obj);
          this.updateTiles();
          this._emit('interact', res);
        } else {
          // Activated grace → offer teleport mode.
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

  _onGraceLongPress(obj) {
    if (obj.type === 'grace' && obj.isActive) {
      this.map.toggleTeleportMode();
      this._emit('teleport-mode');
    }
  }

  // ─── Event Emitter ──────────────────────────────

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
