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

  // Calculate stat penalty multiplier: min(1.0, playerStat / reqStat), floor at 0.3
  static getStatMultiplier(effect, pStats) {
    const req = effect.req;
    if (!req || !pStats) return 1.0;
    let multiplier = 1.0;
    // STR-based effects (damage/physical attacks)
    if (req.strength && pStats.strength !== undefined) {
      multiplier = Math.min(multiplier, pStats.strength / req.strength);
    }
    if (req.agility && pStats.agility !== undefined) {
      multiplier = Math.min(multiplier, pStats.agility / req.agility);
    }
    if (req.intelligence && pStats.intelligence !== undefined) {
      multiplier = Math.min(multiplier, pStats.intelligence / req.intelligence);
    }
    if (req.will && pStats.will !== undefined) {
      multiplier = Math.min(multiplier, pStats.will / req.will);
    }
    return Math.max(0.3, multiplier);
  }

  // Process a single effect against the game state.
  static processEffect(effect, card, targetCell, p, run, hasFullStamina) {
    const results = [];
    const efx = effect;
    const pStats = p.stats || {};
    const statMult = CombatEngine.getStatMultiplier(efx, pStats);

    switch (efx.action) {
      case 'damage': {
        if (!targetCell || targetCell.card.type !== DUNGEON_TEMPLATES.enemy || targetCell.card.defeated) break;
        let str = p.strength + (run.buffs?.str?.value || 0);
        let basePower = efx.power || card.power || 0;
        // Apply stat penalty to power portion
        basePower = Math.max(1, Math.round(basePower * statMult));
        let dmg = basePower + str + (run.mergeBonus || 0);
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
          let basePower = efx.power || card.power || 0;
          basePower = Math.max(1, Math.round(basePower * statMult));
          let dmg = basePower + str + (run.mergeBonus || 0);
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
        let amt = efx.amount || card.heal || 0;
        if (!amt) break;
        amt = Math.max(1, Math.round(amt * statMult));
        p.hp = Math.min(p.hp + amt, p.maxHp);
        results.push({ type: 'heal', amount: amt });
        break;
      }
      case 'armor': {
        let amt = efx.amount || card.power || 0;
        if (!amt) break;
        amt = Math.max(1, Math.round(amt * statMult));
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
      // --- Enemy-played card actions ---
      case 'damage_player': {
        const srcEnemy = effect._sourceCell;
        if (!srcEnemy) break;
        let power = efx.power || 0;
        // Apply enemy buffs
        if (srcEnemy.card.buffs?.power) power += srcEnemy.card.buffs.power.value;
        // Player armor absorbs first
        let absorbed = Math.min(p.armor, power);
        p.armor -= absorbed;
        let dmg = power - absorbed;
        p.hp = Math.max(0, p.hp - dmg);
        results.push({ type: 'damage_player', amount: dmg, cell: srcEnemy });
        break;
      }
      case 'enemy_armor': {
        const srcEnemy = effect._sourceCell;
        if (!srcEnemy) break;
        const amt = efx.amount || 0;
        if (!amt) break;
        const maxA = srcEnemy.card.maxArmor || 99;
        srcEnemy.card.armor = Math.min((srcEnemy.card.armor || 0) + amt, maxA);
        results.push({ type: 'enemy_armor', amount: amt, cell: srcEnemy });
        break;
      }
      case 'heal_enemy': {
        const srcEnemy = effect._sourceCell;
        if (!srcEnemy) break;
        const amt = efx.amount || 0;
        if (!amt) break;
        const maxHp = srcEnemy.card.maxHp || srcEnemy.card.hp + amt;
        srcEnemy.card.hp = Math.min(srcEnemy.card.hp + amt, maxHp);
        results.push({ type: 'heal_enemy', amount: amt, cell: srcEnemy });
        break;
      }
      case 'enemy_retreat': {
        const srcEnemy = effect._sourceCell;
        if (!srcEnemy) break;
        // Close the enemy cell back to unrevealed state
        srcEnemy.revealed = false;
        srcEnemy.card.debuffs = [];
        srcEnemy.card.buffs = {};
        results.push({ type: 'enemy_retreat', cell: srcEnemy });
        break;
      }
      case 'enemy_buff': {
        const srcEnemy = effect._sourceCell;
        if (!srcEnemy) break;
        srcEnemy.card.buffs = srcEnemy.card.buffs || {};
        const ticks = efx.ticks || 3;
        if (efx.stat === 'power') srcEnemy.card.buffs.power = { value: efx.amount, ticks };
        results.push({ type: 'enemy_buff', stat: efx.stat, amount: efx.amount, cell: srcEnemy, ticks });
        break;
      }
      // --- Room-wide effects ---
      case 'room_debuff': {
        if (!run.roomEffects) run.roomEffects = [];
        const ticks = efx.ticks || 3;
        run.roomEffects.push({
          target: efx.target || 'enemy',
          stat: efx.stat || 'damage',
          amount: efx.amount || 0,
          ticks,
        });
        results.push({ type: 'room_debuff', target: efx.target, stat: efx.stat, amount: efx.amount, ticks });
        break;
      }
      // --- Exploration cards (visual hints only) ---
      case 'reveal_enemies': {
        results.push({ type: 'hint_enemies' });
        break;
      }
      case 'reveal_all_safe': {
        for (const cell of run.dungeon.grid) {
          if (!cell.revealed && cell.card.type !== DUNGEON_TEMPLATES.enemy) {
            results.push({ type: 'hint_cell', cell });
          }
        }
        break;
      }
      case 'reveal_item': {
        const itemCells = run.dungeon.grid.filter(c => !c.revealed && c.card.type === DUNGEON_TEMPLATES.item);
        if (itemCells.length > 0) {
          const picked = itemCells[Math.floor(Math.random() * itemCells.length)];
          results.push({ type: 'hint_cell', cell: picked });
        }
        break;
      }
      // --- Enemy deck interaction cards ---
      case 'enemy_discard': {
        if (!targetCell || targetCell.card.type !== DUNGEON_TEMPLATES.enemy || targetCell.card.defeated) break;
        const count = efx.count || 1;
        const hand = targetCell.card._enemyHand || [];
        const discarded = hand.splice(0, Math.min(count, hand.length));
        if (discarded.length > 0) {
          (targetCell.card._discardPile || []).push(...discarded);
          results.push({ type: 'enemy_discard', count: discarded.length, cell: targetCell });
        }
        break;
      }
      case 'steal_enemy_card': {
        if (!targetCell || targetCell.card.type !== DUNGEON_TEMPLATES.enemy || targetCell.card.defeated) break;
        const hand = targetCell.card._enemyHand || [];
        if (hand.length === 0) break;
        // Steal random card from enemy hand.
        const stealIdx = Math.floor(Math.random() * hand.length);
        const stolenCard = hand.splice(stealIdx, 1)[0];
        // Add to player's deck discard pile as a reusable card (converted to attack-like).
        run.deck.discardPile.push({
          uuid: Math.random().toString(36).slice(2, 14),
          id: stolenCard.id || 'stolen_card',
          type: 'attack',
          name: stolenCard.nameEn || stolenCard.nameRu || 'Stolen Card',
          sprite: '🃏',
          cost: 1,
          power: efx.power || 2,
          effects: [{ action: 'damage', power: efx.power || 2 }],
        });
        results.push({ type: 'steal_enemy_card', cell: targetCell });
        break;
      }
      case 'freeze_enemy_card': {
        if (!targetCell || targetCell.card.type !== DUNGEON_TEMPLATES.enemy || targetCell.card.defeated) break;
        // Freeze = skip next N card plays. Store as a flag on the enemy card.
        const ticks = efx.ticks || 1;
        targetCell.card._frozenTicks = (targetCell.card._frozenTicks || 0) + ticks;
        results.push({ type: 'freeze_enemy', cell: targetCell, ticks });
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
