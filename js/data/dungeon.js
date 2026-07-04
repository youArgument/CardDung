import { DUNGEON_ENEMIES, DUNGEON_ITEMS } from './enemies.js';

export const DUNGEON_TEMPLATES = {
  enemy: 'enemy',
  item: 'item',
  exit: 'exit',
  empty: 'empty',
  treasure: 'treasure'
};

export function generateDungeon(floor, roomIndex = 0) {
  const cols = 4;
  const rows = 5;
  const totalCells = cols * rows;
  const grid = [];

  // Determine card distribution based on floor and room
  const enemyCount = Math.min(3 + Math.floor(floor / 2) + roomIndex, 7);
  const itemCount = Math.min(1 + Math.floor(floor / 3), 3);
  const emptyCount = totalCells - enemyCount - itemCount;

  // Create card pool
  const pool = [];

  // Enemies
  for (let i = 0; i < enemyCount; i++) {
    const tier = floor <= 2 ? 1 : floor <= 4 ? 2 : 3;
    const enemies = Object.values(DUNGEON_ENEMIES).filter(e => e.tier <= tier);
    const template = enemies[Math.floor(Math.random() * enemies.length)];
    pool.push({
      type: DUNGEON_TEMPLATES.enemy,
      template: template.id,
      hp: template.hp + Math.floor(floor / 3) + roomIndex,
      maxHp: template.hp + Math.floor(floor / 3) + roomIndex,
      atk: template.atk + Math.floor(floor / 4) + Math.floor(roomIndex / 2),
      gold: template.gold + roomIndex,
      sprite: template.sprite,
      name: template.name,
      defeated: false
    });
  }

  // Items
  for (let i = 0; i < itemCount; i++) {
    const items = Object.values(DUNGEON_ITEMS);
    const template = items[Math.floor(Math.random() * items.length)];
    pool.push({
      type: DUNGEON_TEMPLATES.item,
      template: template.id,
      sprite: template.sprite,
      name: template.name,
      desc: template.desc,
      effect: template.effect,
      value: template.value,
      collected: false
    });
  }

  // Empty slots (we will overwrite exactly one slot with exit below)
  for (let i = 0; i < emptyCount; i++) {
    pool.push({ type: DUNGEON_TEMPLATES.empty, template: 'empty' });
  }

  // Shuffle pool
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Place in grid
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const card = pool[idx++] || { type: DUNGEON_TEMPLATES.empty, template: 'empty' };
      grid.push({
        row: r,
        col: c,
        card: card,
        revealed: false,
        element: null
      });
    }
  }

  // Guarantee one exit card per room/dungeon instance.
  // Place first reveal at a random edge position
  const startPositions = [
    { row: 0, col: 1 }, { row: 0, col: 2 },
    { row: 1, col: 0 }, { row: 1, col: 3 }
  ];
  const startPos = startPositions[Math.floor(Math.random() * startPositions.length)];

  const isAdjacent = (a, b) => {
    const dr = Math.abs(a.row - b.row);
    const dc = Math.abs(a.col - b.col);
    return (dr + dc) === 1;
  };

  const exitCandidates = grid.filter(c =>
    c.card.type === DUNGEON_TEMPLATES.empty &&
    !isAdjacent(c, startPos) &&
    !(c.row === startPos.row && c.col === startPos.col)
  );
  const exitCell = exitCandidates.length
    ? exitCandidates[Math.floor(Math.random() * exitCandidates.length)]
    : grid.find(c => c.card.type === DUNGEON_TEMPLATES.empty);

  if (exitCell) {
    exitCell.card = {
      type: DUNGEON_TEMPLATES.exit,
      template: 'exit',
      sprite: '🚪',
      name: 'Exit',
      desc: 'Escape'
    };
  }

  return {
    grid,
    cols,
    rows,
    startPos,
    revealedCount: 0,
    enemiesSlain: 0
  };
}

export function getAdjacentCells(grid, row, col, cols, rows) {
  const adjacent = [];
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  for (const [dr, dc] of directions) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
      const cell = grid.find(c => c.row === nr && c.col === nc);
      if (cell && !cell.revealed) {
        adjacent.push(cell);
      }
    }
  }

  return adjacent;
}

export function getRevealableCells(grid, cols, rows) {
  const revealable = new Set();

  for (const cell of grid) {
    if (cell.revealed) {
      const adjacent = getAdjacentCells(grid, cell.row, cell.col, cols, rows);
      for (const adj of adjacent) {
        revealable.add(adj);
      }
    }
  }

  return Array.from(revealable);
}
