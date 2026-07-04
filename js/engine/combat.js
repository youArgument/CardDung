import { DUNGEON_TEMPLATES } from '../data/dungeon.js';

export class CombatEngine {
  static playCard(card, targetCell, gameState) {
    const run = gameState.run;
    if (!run) return null;
    const p = run.player;

    // Card costs are paid in stamina.
    if (p.stamina < card.cost) return null;
    p.stamina -= card.cost;

    const result = { card, target: targetCell, effects: [] };

    switch (card.type) {
      case 'attack': {
        if (targetCell && targetCell.card.type === DUNGEON_TEMPLATES.enemy && !targetCell.card.defeated) {
          let dmg = card.power + p.strength + (gameState.run.mergeBonus || 0);
          targetCell.card.hp -= dmg;
          result.effects.push({ type: 'damage', amount: dmg, cell: targetCell });

          if (card.heal) {
            p.hp = Math.min(p.hp + card.heal, p.maxHp);
            result.effects.push({ type: 'heal', amount: card.heal });
          }

          if (targetCell.card.hp <= 0) {
            targetCell.card.defeated = true;
            targetCell.card.hp = 0;
            p.gold += targetCell.card.gold;
            run.enemiesSlain++;
            result.effects.push({ type: 'defeat', cell: targetCell, gold: targetCell.card.gold });
          }
        }
        break;
      }
      case 'attack-all': {
        for (const cell of run.dungeon.grid) {
          if (cell.revealed && cell.card.type === DUNGEON_TEMPLATES.enemy && !cell.card.defeated) {
            let dmg = card.power + p.strength + (gameState.run.mergeBonus || 0);
            cell.card.hp -= dmg;
            result.effects.push({ type: 'damage', amount: dmg, cell });

            if (cell.card.hp <= 0) {
              cell.card.defeated = true;
              cell.card.hp = 0;
              p.gold += cell.card.gold;
              run.enemiesSlain++;
              result.effects.push({ type: 'defeat', cell, gold: cell.card.gold });
            }
          }
        }
        break;
      }
      case 'armor': {
        p.armor += card.power;
        result.effects.push({ type: 'armor', amount: card.power });
        break;
      }
      case 'energy': {
        p.energy += card.power;
        result.effects.push({ type: 'energy', amount: card.power });
        break;
      }
    }

    // Move card to discard
    const handIdx = run.deck.hand.findIndex(c => c.uuid === card.uuid);
    if (handIdx !== -1) run.deck.hand.splice(handIdx, 1);
    run.deck.discardPile.push(card);

    return result;
  }
}
