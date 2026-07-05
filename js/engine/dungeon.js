import { DUNGEON_TEMPLATES, getRevealableCells } from '../data/dungeon.js';

export class DungeonEngine {
  // Called when a cell is revealed
  static onReveal(cell, state) {
    const card = cell.card;

    if (card.type === DUNGEON_TEMPLATES.enemy && !card.defeated) {
      // Enemy revealed - all visible enemies attack
      return { type: 'enemy', cell };
    } else if (card.type === DUNGEON_TEMPLATES.exit) {
      return { type: 'exit' };
    } else if (card.type === DUNGEON_TEMPLATES.item) {
      return { type: 'item', cell };
    } else {
      return { type: 'empty' };
    }
  }

  // All visible (revealed, alive) enemies attack the player
  static allEnemiesAttack(dungeon, state) {
    let totalDamage = 0;
    const attacks = [];

    for (const cell of dungeon.grid) {
      if (cell.revealed && cell.card.type === DUNGEON_TEMPLATES.enemy && !cell.card.defeated) {
        const dmg = cell.card.atk;
        attacks.push({ cell, damage: dmg });
        totalDamage += dmg;
      }
    }

    return attacks;
  }

  // Apply attacks to player
  static applyAttacks(attacks, state) {
    for (const attack of attacks) {
      const result = state.takeDamage(attack.damage);
      attack.result = result;
    }
  }


  // Get all revealable cells (adjacent to revealed cells)
  static getRevealable(dungeon) {
    return getRevealableCells(dungeon.grid, dungeon.cols, dungeon.rows);
  }

  // Check if exit is revealed
  static isExitRevealed(dungeon) {
    return dungeon.grid.some(
      cell => cell.revealed && cell.card.type === DUNGEON_TEMPLATES.exit
    );
  }
}
