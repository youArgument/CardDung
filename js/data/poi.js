import { hexDist, hexKey } from '../engine/worldmap.js';

// World Object types.
export const POI_TYPES = {
  grace:          'grace',
  chest:          'chest',
  boss_entrance:  'boss_entrance',
  dungeon:        'dungeon',
};

// POI icon mapping.
const POI_ICONS = {
  [POI_TYPES.grace]:          '🔥',
  [POI_TYPES.chest]:          '📦',
  [POI_TYPES.boss_entrance]:  '💀',
  [POI_TYPES.dungeon]:        '⬛',
};

// Predefined POI list for the initial world map.
export const POI_LIST = [
  // Graces (fast travel points) — placed at key intersections and safe spots.
  { id: 'grace_spawn', type: 'grace', nameEn: 'Spawn Grace', nameRu: 'Благодать Старта', isActive: true, meta: {} },
  { id: 'grace_crossroads', type: 'grace', nameEn: 'Crossroads Grace', nameRu: 'Благодать Перекрёстка', meta: {} },
  { id: 'grace_lake', type: 'grace', nameEn: "Lake's Edge Grace", nameRu: 'Благодать Озёрного Края', meta: {} },
  { id: 'grace_hilltop', type: 'grace', nameEn: 'Hilltop Grace', nameRu: 'Благодать Вершины', meta: {} },

  // Dungeons — entry points to dungeon runs.
  { id: 'dungeon_crypt', type: 'dungeon', nameEn: "Crypt of the Forgotten", nameRu: 'Крипта Забытых', meta: { rooms: 3 } },
  { id: 'dungeon_ruins', type: 'dungeon', nameEn: 'Ancient Ruins', nameRu: 'Древние Руины', meta: { rooms: 3 } },

  // Boss entrances.
  { id: 'boss_wyrm', type: 'boss_entrance', nameEn: "Wyrm's Lair", nameRu: 'Логово Змея', meta: { enemyId: 'dragon' } },

  // Chests — gold/item rewards.
  { id: 'chest_1', type: 'chest', nameEn: 'Buried Treasure', nameRu: 'Захороненное Сокровище', meta: { gold: 5 } },
  { id: 'chest_2', type: 'chest', nameEn: 'Old Cache', nameRu: 'Старый Запас', meta: { gold: 8 } },
  { id: 'chest_3', type: 'chest', nameEn: "Trader's Pack", nameRu: 'Сумка Торговца', meta: { gold: 10 } },
];

// Place POIs on the world map grid.
export function placePOIs(worldMap) {
  // Define positions for each POI using axial hex coordinates (relative to center).
  const placements = [
    { id: 'grace_spawn',     dq: 0,   dr: 0 },
    { id: 'grace_crossroads', dq: -5, dr: -3 },
    { id: 'grace_lake',      dq: 4,   dr: 6 },
    { id: 'grace_hilltop',   dq: -7,  dr: 5 },

    { id: 'dungeon_crypt',   dq: -8,  dr: -7 },
    { id: 'dungeon_ruins',   dq: 7,   dr: -6 },

    { id: 'boss_wyrm',       dq: -10, dr: 2 },

    { id: 'chest_1',         dq: -3,  dc: 4 },
    { id: 'chest_2',         dq: 5,   dr: -4 },
    { id: 'chest_3',         dq: -6,  dr: -8 },
  ];

  for (const p of placements) {
    const poi = POI_LIST.find(po => po.id === p.id);
    if (!poi) continue;

    let q = p.dq, r = p.dr ?? p.dc;
    // Clamp to world radius.
    if (hexDist({ q: 0, r: 0 }, { q, r }) > worldMap.radius) {
      const scale = worldMap.radius / hexDist({ q: 0, r: 0 }, { q, r });
      q = Math.round(q * scale);
      r = Math.round(r * scale);
    }

    // Find nearest walkable cell if this one is blocked.
    const cell = worldMap.getCell(q, r);
    if (!cell?.walkable || cell?.collision) {
      const nearest = findNearestWalkable(worldMap, q, r);
      if (nearest) { q = nearest.q; r = nearest.r; }
    }

    // Create the world object.
    const obj = {
      ...poi,
      q,
      r,
      icon: POI_ICONS[poi.type] || '❓',
      opened: false,
    };

    if (poi.type === 'grace' && poi.isActive) {
      obj.isActive = true;
    } else if (poi.type === 'grace') {
      obj.isActive = false;
    }

    worldMap.objects.set(poi.id, obj);

    // Mark the cell as road for graces and key locations.
    const finalCell = worldMap.getCell(q, r);
    if (finalCell && poi.type !== 'chest') {
      finalCell.tileType = 'road';
    }
  }
}

function findNearestWalkable(worldMap, q, r) {
  for (let radius = 1; radius < 6; radius++) {
    const candidates = [];
    for (const key in worldMap.grid) {
      const cell = worldMap.grid[key];
      if (hexDist(cell, { q, r }) === radius && cell.walkable && !cell.collision) {
        candidates.push(cell);
      }
    }
    if (candidates.length) return candidates[0];
  }
  return null;
}
