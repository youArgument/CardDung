import { describe, it, expect, beforeEach } from 'vitest';
import { generateDungeon, DUNGEON_TEMPLATES } from '../../js/data/dungeon.js';
import { DungeonEngine } from '../../js/engine/dungeon.js';

function makeState(grid, overrides = {}) {
  return {
    run: {
      dungeon: { grid, cols: 4, rows: 5, ...overrides.dungeon },
      player: { hp: 8, maxHp: 8, armor: 0, stamina: 100, gold: 0 },
      ...overrides
    }
  };
}

describe('DungeonEngine', () => {
  describe('getRevealable', () => {
    it('returns cells adjacent to revealed cells', () => {
      const dungeon = generateDungeon(1, 0);
      dungeon.grid[0].revealed = true; // reveal one cell
      const revealable = DungeonEngine.getRevealable(dungeon);
      expect(revealable.length).toBeGreaterThan(0);
      expect(revealable.every(c => !c.revealed)).toBe(true);
    });

    it('returns empty when no cells are revealed', () => {
      const dungeon = generateDungeon(1, 0);
      const revealable = DungeonEngine.getRevealable(dungeon);
      expect(revealable).toHaveLength(0);
    });
  });

  describe('isExitRevealed', () => {
    it('returns false when no exit is revealed', () => {
      const dungeon = generateDungeon(1, 0);
      expect(DungeonEngine.isExitRevealed(dungeon)).toBe(false);
    });

    it('returns true when exit cell is revealed', () => {
      const dungeon = { grid: [{ revealed: true, card: { type: DUNGEON_TEMPLATES.exit } }] };
      expect(DungeonEngine.isExitRevealed(dungeon)).toBe(true);
    });
  });
});

describe('generateDungeon', () => {
  it('creates a grid with correct dimensions', () => {
    const dungeon = generateDungeon(1, 0);
    expect(dungeon.cols).toBe(4);
    expect(dungeon.rows).toBe(5);
    expect(dungeon.grid).toHaveLength(20);
  });

  it('has a start position', () => {
    const dungeon = generateDungeon(1, 0);
    expect(dungeon.startPos).toBeDefined();
    expect(dungeon.startPos.row).toBeGreaterThanOrEqual(0);
    expect(dungeon.startPos.col).toBeGreaterThanOrEqual(0);
  });

  it('generates enemies for floor 1', () => {
    const dungeon = generateDungeon(1, 0);
    const enemies = dungeon.grid.filter(c => c.card.type === DUNGEON_TEMPLATES.enemy);
    expect(enemies.length).toBeGreaterThanOrEqual(3);
    expect(enemies[0].card.hp).toBeDefined();
    expect(enemies[0].card.atk).toBeDefined();
    expect(enemies[0].card.defeated).toBe(false);
  });

  it('generates items', () => {
    const dungeon = generateDungeon(1, 0);
    const items = dungeon.grid.filter(c => c.card.type === DUNGEON_TEMPLATES.item);
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  it('has empty cells', () => {
    const dungeon = generateDungeon(1, 0);
    const empties = dungeon.grid.filter(c => c.card.type === DUNGEON_TEMPLATES.empty);
    expect(empties.length).toBeGreaterThan(0);
  });
});
