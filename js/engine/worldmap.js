import { BIOME_TILES } from '../data/biomes.js';
import { POI_LIST, placePOIs } from '../data/poi.js';

export const FOG = { hidden: 'hidden', visible: 'visible', explored: 'explored' };

// 6 hex directions (pointy-topped, axial coords).
export const HEX_DIRECTIONS = [
  { q: 1, r: -1 }, { q: 1, r: 0 },
  { q: 0, r: 1 },  { q: -1, r: 1 },
  { q: -1, r: 0 }, { q: 0, r: -1 },
];

/** Hex distance in axial coordinates. */
export function hexDist(a, b) {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

/** Check if (q,r) is within world radius. */
export function inWorld(q, r, radius) {
  return hexDist({ q: 0, r: 0 }, { q, r }) <= radius;
}

/** Make a sparse-grid key from axial coords. */
export function hexKey(q, r) { return `${q},${r}`; }

/** Parse "q,r" string back to {q, r}. */
export function parseHexKey(key) {
  const [q, r] = key.split(',').map(Number);
  return { q, r };
}

// ─── Tile Type Helpers ──────────────────────

function isWalkable(tileType) {
  const t = BIOME_TILES[tileType];
  return t?.walkable ?? true;
}

function hasCollision(tileType) {
  const t = BIOME_TILES[tileType];
  return t?.collision ?? false;
}

// ─── World Map Class ────────────────────────

export class WorldMap {
  constructor(radius = 15) {
    this.radius = radius;           // world radius (hex distance from center).
    this.grid = {};                 // sparse: "q,r" → cell object.
    this.objects = new Map();       // id → POI overlay.
    this.playerPos = { q: 0, r: 0 };
    this.teleportMode = false;
    this.activeGraceId = null;
    this._generateWorld();
  }

  // ─── World Generation ─────────────────────

  _generateWorld() {
    const radius = this.radius;

    // Generate hex rings from center outward.
    for (let ring = 0; ring <= radius; ring++) {
      for (const { q, r } of this._ringCoords(ring)) {
        const tileType = this._pickTile(q, r);
        this.grid[hexKey(q, r)] = {
          q,
          r,
          biomeId: 'wind_plateau',
          tileType,
          walkable: isWalkable(tileType),
          collision: hasCollision(tileType),
          fog: FOG.hidden,
        };
      }
    }

    // Place POIs on walkable cells.
    placePOIs(this);

    // Find spawn point at center (or nearest walkable).
    this._findSpawn();
  }

  /** Generate all hex coords for a given ring. */
  _ringCoords(ring) {
    if (ring === 0) return [{ q: 0, r: 0 }];
    const coords = [];
    // Start at east edge of ring.
    let q = ring, r = -ring;
    for (let dir = 0; dir < 6; dir++) {
      const dq = HEX_DIRECTIONS[dir].q;
      const dr = HEX_DIRECTIONS[dir].r;
      for (let step = 0; step < ring; step++) {
        coords.push({ q, r });
        q += dq;
        r += dr;
      }
    }
    return coords;
  }

  _pickTile(q, r) {
    const n = this._hash(q * 374761393 + r * 668265263);
    const v = (n & 0xFFFF) / 0xFFFF;
    if (v < 0.15) return BIOME_TILES.water.type;
    if (v < 0.28) return BIOME_TILES.rock.type;
    return BIOME_TILES.grass.type;
  }

  _hash(x) {
    x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
    x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
    return (x ^ (x >>> 16)) >>> 0;
  }

  _findSpawn() {
    // Center first.
    const center = this.grid[hexKey(0, 0)];
    if (center && center.walkable && !center.collision && !this._getObjectAt(0, 0)) {
      this.playerPos = { q: 0, r: 0 };
      this.revealAround(this.playerPos, 4);
      return;
    }
    // Search outward.
    for (let ring = 1; ring <= this.radius; ring++) {
      for (const { q, r } of this._ringCoords(ring)) {
        const cell = this.grid[hexKey(q, r)];
        if (cell && cell.walkable && !cell.collision && !this._getObjectAt(q, r)) {
          this.playerPos = { q, r };
          this.revealAround(this.playerPos, 4);
          return;
        }
      }
    }
  }

  // ─── Fog of War ──────────────────────────

  /** Generate ring coords relative to an arbitrary center (cq, cr). */
  _ringCoordsAt(cq, cr, ring) {
    if (ring === 0) return [{ q: cq, r: cr }];
    const coords = [];
    // Start at east edge of ring (relative), then offset by center.
    let q = cq + ring, r = cr - ring;
    for (let dir = 0; dir < 6; dir++) {
      const dq = HEX_DIRECTIONS[dir].q;
      const dr = HEX_DIRECTIONS[dir].r;
      for (let step = 0; step < ring; step++) {
        coords.push({ q, r });
        q += dq;
        r += dr;
      }
    }
    return coords;
  }

  /** Reveal hexes within `radius` of `pos` (ring-based — no full grid scan). */
  revealArea(pos, radius, mode = FOG.visible) {
    for (let ring = 0; ring <= radius; ring++) {
      for (const coord of this._ringCoordsAt(pos.q, pos.r, ring)) {
        const cell = this.grid[hexKey(coord.q, coord.r)];
        if (!cell) continue;
        if (mode === FOG.visible || cell.fog !== FOG.visible) {
          cell.fog = mode;
        }
      }
    }
  }

  revealAround(pos, radius = 1) {
    this.revealArea(pos, radius, FOG.explored);
    this.revealArea(pos, radius, FOG.visible);
  }

  /** Update fog after player moves from oldPos → newPos (ring-based). */
  updateFog(oldPos, newPos) {
    // Old area: dim visible cells within radius 4 of old position → explored.
    for (let ring = 0; ring <= 4; ring++) {
      for (const coord of this._ringCoordsAt(oldPos.q, oldPos.r, ring)) {
        const cell = this.grid[hexKey(coord.q, coord.r)];
        if (cell && cell.fog === FOG.visible) {
          cell.fog = FOG.explored;
        }
      }
    }
    // New area → visible (radius 4 for better situational awareness).
    this.revealArea(newPos, 4, FOG.visible);
  }

  // ─── Movement ─────────────────────────────

  canMove(from, to) {
    if (hexDist(from, to) !== 1) return false;
    const cell = this.grid[hexKey(to.q, to.r)];
    if (!cell) return false;
    return cell.walkable && !cell.collision;
  }

  movePlayer(newPos) {
    if (!this.canMove(this.playerPos, newPos)) return null;
    const oldPos = { ...this.playerPos };
    this.updateFog(oldPos, newPos);
    this.playerPos = { q: newPos.q, r: newPos.r };

    // Check for POI interaction on new cell.
    const obj = this._getObjectAt(newPos.q, newPos.r);
    let interactResult = null;
    if (obj) interactResult = this.interact(obj);

    return { oldPos, newPos, object: interactResult };
  }

  // ─── POI Interaction ──────────────────────

  _getObjectAt(q, r) {
    for (const obj of this.objects.values()) {
      if (obj.q === q && obj.r === r) return obj;
    }
    return null;
  }

  interact(obj) {
    switch (obj.type) {
      case 'grace':
        const wasActive = obj.isActive;
        if (!wasActive) {
          obj.isActive = true;
          this.activeGraceId = obj.id;
        }
        return { type: 'grace', id: obj.id, name: obj.name, activated: !wasActive };

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

  // ─── Fast Travel (Teleport Mode) ──────────

  toggleTeleportMode() {
    this.teleportMode = !this.teleportMode;
    return this.teleportMode;
  }

  teleportTo(objId) {
    const obj = this.objects.get(objId);
    if (!obj || obj.type !== 'grace' || !obj.isActive) return null;
    const oldPos = { ...this.playerPos };
    this.playerPos = { q: obj.q, r: obj.r };
    this.teleportMode = false;
    this.updateFog(oldPos, this.playerPos);
    return { oldPos, newPos: this.playerPos, graceId: obj.id };
  }

  // ─── Cell Accessors ──────────────────────

  getCell(q, r) {
    const key = hexKey(q, r);
    if (!inWorld(q, r, this.radius)) return null;
    return this.grid[key] || null;
  }

  getObjectAt(q, r) {
    return this._getObjectAt(q, r);
  }

  getObjectsInRadius(pos, radius = 1) {
    const result = [];
    for (const obj of this.objects.values()) {
      if (hexDist(obj, pos) <= radius) result.push(obj);
    }
    return result;
  }

  // ─── Serialization ────────────────────────

  serialize() {
    const exploredCells = [];
    for (const key in this.grid) {
      if (this.grid[key].fog === FOG.explored) exploredCells.push(key);
    }
    return {
      radius: this.radius,
      playerPos: { ...this.playerPos },
      teleportMode: this.teleportMode,
      activeGraceId: this.activeGraceId,
      exploredCells,
      openedChests: [...this.objects.values()].filter(o => o.opened).map(o => o.id),
    };
  }

  static deserialize(data) {
    const map = new WorldMap(data.radius ?? 15);
    // Restore explored cells.
    if (data.exploredCells) {
      for (const key of data.exploredCells) {
        const cell = map.grid[key];
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
    map.playerPos = data.playerPos || { q: 0, r: 0 };
    map.teleportMode = false;
    map.activeGraceId = data.activeGraceId;
    map.revealArea(map.playerPos, 4, FOG.visible);
    return map;
  }
}
