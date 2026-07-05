import { DUNGEON_TEMPLATES } from '../data/dungeon.js';

export class CombatEngine {
  // Shared logic: mark enemy as defeated and apply rewards.
  static defeatEnemy(cell, run) {
    if (cell.card.defeated) return null;
    cell.card.defeated = true;
    cell.card.hp = 0;
    run.player.gold += cell.card.gold;
    run.enemiesSlain++;
    // Rogue Cloak artifact: draw 1 card on enemy defeat
    if (run.artifact?.id === 'rogue_cloak') {
      run.deck.draw(1);
    }
    return { type: 'defeat', cell, gold: cell.card.gold };
  }

  // Process a single effect against the game state.
  static processEffect(effect, card, targetCell, p, run, hasFullStamina) {
    const results = [];
    const efx = effect;

    switch (efx.action) {
      case 'damage': {
        if (!targetCell || targetCell.card.type !== DUNGEON_TEMPLATES.enemy || targetCell.card.defeated) break;
        let str = p.strength + (run.buffs?.str?.value || 0);
        let dmg = (efx.power || card.power || 0) + str + (run.mergeBonus || 0);
        if (!hasFullStamina) dmg = Math.max(1, Math.floor(dmg / 2));
        targetCell.card.hp -= dmg;
        results.push({ type: 'damage', amount: dmg, cell: targetCell });
        if (targetCell.card.hp <= 0) {
          const d = CombatEngine.defeatEnemy(targetCell, run);
          if (d) results.push(d);
        }
        break;
      }
      case 'damage_all': {
        for (const cell of run.dungeon.grid) {
          if (!cell.revealed || cell.card.type !== DUNGEON_TEMPLATES.enemy || cell.card.defeated) continue;
          let str = p.strength + (run.buffs?.str?.value || 0);
          let dmg = (efx.power || card.power || 0) + str + (run.mergeBonus || 0);
          if (!hasFullStamina) dmg = Math.max(1, Math.floor(dmg / 2));
          cell.card.hp -= dmg;
          results.push({ type: 'damage', amount: dmg, cell });
          if (cell.card.hp <= 0) {
            const d = CombatEngine.defeatEnemy(cell, run);
            if (d) results.push(d);
          }
        }
        break;
      }
      case 'heal': {
        const amt = efx.amount || card.heal || 0;
        if (!amt) break;
        p.hp = Math.min(p.hp + amt, p.maxHp);
        results.push({ type: 'heal', amount: amt });
        break;
      }
      case 'armor': {
        const amt = efx.amount || card.power || 0;
        if (!amt) break;
        p.armor += amt;
        results.push({ type: 'armor', amount: amt });
        break;
      }
      case 'stamina': {
        const amt = efx.amount || card.power || 0;
        if (!amt) break;
        p.stamina = Math.min(p.stamina + amt, p.maxStamina);
        results.push({ type: 'energy', amount: amt });
        break;
      }
      case 'apply_debuff': {
        // Apply a debuff to target enemy (poison, nullify damage, etc.)
        if (!targetCell || targetCell.card.type !== DUNGEON_TEMPLATES.enemy || targetCell.card.defeated) break;
        if (!run.debuffs) run.debuffs = {};
        const key = `${targetCell.row}-${targetCell.col}`;
        targetCell.card.debuffs = targetCell.card.debuffs || [];
        targetCell.card.debuffs.push({
          type: efx.debuffType,
          amount: efx.amount || 0,
          ticks: efx.ticks || 1,
        });
        results.push({ type: 'debuff', debuffType: efx.debuffType, cell: targetCell, ticks: efx.ticks || 1 });
        break;
      }
      case 'nullify_damage': {
        // Nullify damage from a single enemy for N ticks.
        if (!targetCell || targetCell.card.type !== DUNGEON_TEMPLATES.enemy || targetCell.card.defeated) break;
        targetCell.card.debuffs = targetCell.card.debuffs || [];
        targetCell.card.debuffs.push({ type: 'nullify', amount: 0, ticks: efx.ticks || 3 });
        results.push({ type: 'debuff', debuffType: 'nullify', cell: targetCell, ticks: efx.ticks || 3 });
        break;
      }
      case 'nullify_all_damage': {
        // Nullify damage from all enemies for N ticks.
        const ticks = efx.ticks || 3;
        for (const cell of run.dungeon.grid) {
          if (!cell.revealed || cell.card.type !== DUNGEON_TEMPLATES.enemy || cell.card.defeated) continue;
          cell.card.debuffs = cell.card.debuffs || [];
          cell.card.debuffs.push({ type: 'nullify', amount: 0, ticks });
        }
        results.push({ type: 'debuff_all', debuffType: 'nullify', ticks });
        break;
      }
      case 'reflect_damage': {
        // Reflect damage back to target enemy.
        if (!targetCell || targetCell.card.type !== DUNGEON_TEMPLATES.enemy || targetCell.card.defeated) break;
        const amt = efx.amount || card.power || 0;
        targetCell.card.hp -= amt;
        results.push({ type: 'reflect', amount: amt, cell: targetCell });
        if (targetCell.card.hp <= 0) {
          const d = CombatEngine.defeatEnemy(targetCell, run);
          if (d) results.push(d);
        }
        break;
      }
      case 'player_buff': {
        // Temporarily increase player stats for N ticks.
        if (!run.buffs) run.buffs = {};
        const ticks = efx.ticks || 3;
        if (efx.str) run.buffs.str = { value: efx.str, ticks };
        if (efx.agi) run.buffs.agi = { value: efx.agi, ticks };
        if (efx.vit) run.buffs.vit = { value: efx.vit, ticks };
        results.push({ type: 'player_buff', ticks });
        break;
      }
    }

    return results;
  }

  static playCard(card, targetCell, gameState, freeCost = false) {
    const run = gameState.run;
    if (!run) return null;
    const p = run.player;

    // Card costs are paid in stamina.
    const cost = freeCost ? 0 : card.cost;
    const hasFullStamina = p.stamina >= cost;
    p.stamina = Math.max(0, p.stamina - cost);

    // Not enough stamina: attack-type cards play at half power, others blocked.
    if (!hasFullStamina) {
      const hasEffects = card.effects?.length;
      const isAttackLike = hasEffects
        ? card.effects.some(e => e.action === 'damage' || e.action === 'damage_all')
        : card.type === 'attack' || card.type === 'attack-all'; // legacy fallback.
      if (!isAttackLike) return null;
    }

    // Build effects list: merge new schema (effects[]) with legacy fields.
    let effects = card.effects;
    if (!effects || !effects.length) {
      // Legacy fallback: reconstruct from type/power/heal/poison.
      effects = CombatEngine.legacyToEffects(card);
    }

    const result = { card, target: targetCell, effects: [], penalty: !hasFullStamina };

    for (const effect of effects) {
      // Skip non-attack effects when stamina is low.
      if (!hasFullStamina && !(effect.action === 'damage' || effect.action === 'damage_all')) continue;

      const processed = CombatEngine.processEffect(effect, card, targetCell, p, run, hasFullStamina);
      result.effects.push(...processed);
    }

    // return_to_hand: don't discard, put back in hand.
    if (card.returnToHand) {
      return result;
    }

    // Move card to discard.
    const handIdx = run.deck.hand.findIndex(c => c.uuid === card.uuid);
    if (handIdx !== -1) run.deck.hand.splice(handIdx, 1);
    run.deck.discardPile.push(card);

    return result;
  }

  // Convert legacy card fields to effects[] format.
  static legacyToEffects(card) {
    const effects = [];
    if (card.type === 'attack' || card.type === 'attack-all') {
      effects.push({ action: card.type === 'attack-all' ? 'damage_all' : 'damage', power: card.power });
    }
    if (card.heal) effects.push({ action: 'heal', amount: card.heal });
    if (card.poison) effects.push({ action: 'apply_debuff', debuffType: 'poison', amount: card.poison, ticks: 3 });
    if (card.type === 'armor') effects.push({ action: 'armor', amount: card.power });
    if (card.type === 'energy') effects.push({ action: 'stamina', amount: card.power });
    return effects;
  }
}
