import { BIOME_TILES } from '../data/biomes.js';
import { POI_LIST, placePOIs } from '../data/poi.js';

export const FOG = { hidden: 'hidden', visible: 'visible', explored: 'explored' };
export const DIRECTIONS = [
  { r: -1, c: 0 }, // up
  { r: 1, c: 0 },  // down
  { r: 0, c: -1 }, // left
  { r: 0, c: 1 },  // right
];

export class WorldMap {
  constructor(size = 30) {
    this.size = size;
    this.grid = [];
    this.objects = new Map(); // id -> WorldObject overlay
    this.playerPos = { r: 0, c: 0 };
    this.teleportMode = false;
    this.activeGraceId = null;
    this._generateGrid();
  }

  // ─── Grid Generation ──────────────────────────────

  _generateGrid() {
    const size = this.size;
    this.grid = [];

    for (let r = 0; r < size; r++) {
      const row = [];
      for (let c = 0; c < size; c++) {
        const tile = this._pickTile(r, c);
        row.push({
          r,
          c,
          biomeId: 'wind_plateau',
          tileType: tile.type,
          walkable: tile.walkable,
          collision: tile.collision,
          fog: FOG.hidden,
        });
      }
      this.grid.push(row);
    }

    // Place POIs on walkable cells.
    placePOIs(this);

    // Find spawn point (center-ish walkable cell).
    const center = Math.floor(size / 2);
    for (let radius = 0; radius < size; radius++) {
      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          const nr = center + dr, nc = center + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
            const cell = this.grid[nr][nc];
            if (cell.walkable && !cell.collision && !this._getObjectAt(nr, nc)) {
              this.playerPos = { r: nr, c: nc };
              this.revealAround(this.playerPos, 2);
              return;
            }
          }
        }
      }
    }
  }

  _pickTile(r, c) {
    // Simple noise-like generation for "Плато ветров".
    const n = this._hash(r * 374761393 + c * 668265263);
    const v = (n & 0xFFFF) / 0xFFFF;

    if (v < 0.15) return BIOME_TILES.water;
    if (v < 0.28) return BIOME_TILES.rock;
    // Road cells near POIs will be set later by pathfinding, default to grass.
    return BIOME_TILES.grass;
  }

  _hash(x) {
    x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
    x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
    return (x ^ (x >>> 16)) >>> 0;
  }

  // ─── Fog of War ──────────────────────────────────

  revealArea(pos, radius, mode = FOG.visible) {
    const size = this.size;
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        if (Math.abs(dr) + Math.abs(dc) > radius) continue;
        const nr = pos.r + dr, nc = pos.c + dc;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        const cell = this.grid[nr][nc];
        // visible overrides explored, but nothing overrides hidden unless revealed.
        if (mode === FOG.visible || cell.fog !== FOG.visible) {
          cell.fog = mode;
        }
      }
    }
  }

  revealAround(pos, radius = 1) {
    // Old position cells become explored (if they were visible).
    this.revealArea(pos, radius, FOG.explored);
    // New position gets full visibility.
    this.revealArea(pos, radius, FOG.visible);
  }

  updateFog(oldPos, newPos) {
    // Mark old area as explored (not hidden, not visible).
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (Math.abs(dr) + Math.abs(dc) > 1) continue;
        const nr = oldPos.r + dr, nc = oldPos.c + dc;
        if (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size) {
          const cell = this.grid[nr][nc];
          if (cell.fog === FOG.visible) cell.fog = FOG.explored;
        }
      }
    }
    // New area becomes visible.
    this.revealArea(newPos, 1, FOG.visible);
  }

  // ─── Movement ─────────────────────────────────────

  canMove(from, to) {
    const dr = Math.abs(from.r - to.r);
    const dc = Math.abs(from.c - to.c);
    if (dr + dc !== 1) return false; // Only adjacent cells.
    const cell = this._getCell(to);
    if (!cell) return false;
    return cell.walkable && !cell.collision;
  }

  movePlayer(newPos) {
    if (!this.canMove(this.playerPos, newPos)) return null;
    const oldPos = { ...this.playerPos };
    this.updateFog(oldPos, newPos);
    this.playerPos = { r: newPos.r, c: newPos.c };

    // Check for POI interaction on new cell.
    const obj = this._getObjectAt(newPos.r, newPos.c);
    let interactResult = null;
    if (obj) {
      interactResult = this.interact(obj);
    }

    return { oldPos, newPos, object: interactResult };
  }

  // ─── POI Interaction ──────────────────────────────

  _getObjectAt(r, c) {
    for (const obj of this.objects.values()) {
      if (obj.r === r && obj.c === c) return obj;
    }
    return null;
  }

  interact(obj) {
    switch (obj.type) {
      case 'grace':
        if (!obj.isActive) {
          obj.isActive = true;
          this.activeGraceId = obj.id;
        }
        return { type: 'grace', id: obj.id, name: obj.name, activated: !obj.isActive };

      case 'chest':
        if (obj.opened) return null;
        obj.opened = true;
        const reward = obj.meta?.reward || { gold: 5 };
        return { type: 'chest', id: obj.id, name: obj.name, ...reward };

      case 'boss_entrance':
        return { type: 'boss_entrance', id: obj.id, name: obj.name, meta: obj.meta };

      case 'dungeon':
        return { type: 'dungeon', id: obj.id, name: obj.name, meta: obj.meta };

      default:
        return null;
    }
  }

  // ─── Fast Travel (Teleport Mode) ──────────────────

  toggleTeleportMode() {
    this.teleportMode = !this.teleportMode;
    return this.teleportMode;
  }

  teleportTo(objId) {
    const obj = this.objects.get(objId);
    if (!obj || obj.type !== 'grace' || !obj.isActive) return null;
    const oldPos = { ...this.playerPos };
    this.playerPos = { r: obj.r, c: obj.c };
    this.teleportMode = false;
    this.updateFog(oldPos, this.playerPos);
    return { oldPos, newPos: this.playerPos, graceId: obj.id };
  }

  // ─── Cell Accessors ──────────────────────────────

  _getCell(pos) {
    if (pos.r < 0 || pos.r >= this.size || pos.c < 0 || pos.c >= this.size) return null;
    return this.grid[pos.r][pos.c];
  }

  getCell(r, c) {
    return this._getCell({ r, c });
  }

  getObjectAt(r, c) {
    return this._getObjectAt(r, c);
  }

  getObjectsInRadius(pos, radius = 1) {
    const result = [];
    for (const obj of this.objects.values()) {
      if (Math.abs(obj.r - pos.r) + Math.abs(obj.c - pos.c) <= radius) {
        result.push(obj);
      }
    }
    return result;
  }

  // ─── Serialization ────────────────────────────────

  serialize() {
    const exploredCells = [];
    for (const row of this.grid) {
      for (const cell of row) {
        if (cell.fog === FOG.explored) exploredCells.push(`${cell.r},${cell.c}`);
      }
    }

    return {
      playerPos: { ...this.playerPos },
      teleportMode: this.teleportMode,
      activeGraceId: this.activeGraceId,
      exploredCells,
      openedChests: [...this.objects.values()].filter(o => o.opened).map(o => o.id),
    };
  }

  static deserialize(data) {
    const map = new WorldMap(30);
    // Regenerate grid first (same seed would give same layout, but for now we regenerate).
    // Restore explored cells.
    if (data.exploredCells) {
      for (const key of data.exploredCells) {
        const [r, c] = key.split(',').map(Number);
        const cell = map._getCell({ r, c });
        if (cell) cell.fog = FOG.explored;
      }
    }

    // Restore POI states.
    if (data.openedChests) {
      for (const id of data.openedChests) {
        const obj = map.objects.get(id);
        if (obj) obj.opened = true;
      }
    }
    if (data.activeGraceId) {
      const grace = map.objects.get(data.activeGraceId);
      if (grace) grace.isActive = true;
    }

    map.playerPos = data.playerPos || { r: 0, c: 0 };
    map.teleportMode = false;
    map.activeGraceId = data.activeGraceId;

    // Reveal around player.
    map.revealArea(map.playerPos, 1, FOG.visible);

    return map;
  }
}
