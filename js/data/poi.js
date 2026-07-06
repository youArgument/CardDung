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
  const size = worldMap.size;
  const center = Math.floor(size / 2);

  // Define relative positions for each POI (relative to center).
  const placements = [
    { id: 'grace_spawn',     dr: 0,   dc: 0 },
    { id: 'grace_crossroads', dr: -5, dc: -3 },
    { id: 'grace_lake',      dr: 4,   dc: 6 },
    { id: 'grace_hilltop',   dr: -7,  dc: 5 },

    { id: 'dungeon_crypt',   dr: -8,  dc: -7 },
    { id: 'dungeon_ruins',   dr: 7,   dc: -6 },

    { id: 'boss_wyrm',       dr: -10, dc: 2 },

    { id: 'chest_1',         dr: -3,  dc: 4 },
    { id: 'chest_2',         dr: 5,   dc: -4 },
    { id: 'chest_3',         dr: -6,  dc: -8 },
  ];

  for (const p of placements) {
    const poi = POI_LIST.find(po => po.id === p.id);
    if (!poi) continue;

    let r = center + p.dr, c = center + p.dc;
    // Clamp to grid bounds.
    r = Math.max(1, Math.min(size - 2, r));
    c = Math.max(1, Math.min(size - 2, c));

    // Find nearest walkable cell if this one is blocked.
    if (!worldMap.getCell(r, c)?.walkable || worldMap.getCell(r, c)?.collision) {
      const nearest = findNearestWalkable(worldMap, r, c);
      if (nearest) { r = nearest.r; c = nearest.c; }
    }

    // Create the world object.
    const obj = {
      ...poi,
      r,
      c,
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
    const cell = worldMap.getCell(r, c);
    if (cell && poi.type !== 'chest') {
      cell.tileType = 'road';
    }
  }
}

function findNearestWalkable(worldMap, r, c) {
  const size = worldMap.size;
  for (let radius = 1; radius < 6; radius++) {
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        if (Math.abs(dr) + Math.abs(dc) !== radius) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          const cell = worldMap.getCell(nr, nc);
          if (cell?.walkable && !cell.collision) return { r: nr, c: nc };
        }
      }
    }
  }
  return null;
}
