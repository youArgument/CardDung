import { t } from '../system/i18n.js';
import { CombatEngine } from '../engine/combat.js';

export class HandUI {
  static render(state, container) {
    const run = state.run;
    if (!run) return;

    container.innerHTML = '';
    const hand = run.deck.hand;
    const pStats = run.player.stats || {};

    hand.forEach((card) => {
      const el = document.createElement('div');
      el.className = 'hand-card';
      el.dataset.uuid = card.uuid;

      if (run.player.stamina < card.cost) el.classList.add('unplayable');

      // Calculate actual damage using Combat System 2.0 formula
      let displayPower = null;
      let masteryMult = 1.0;
      if (card.type === 'attack' || card.type === 'attack-all') {
        const calcVal = CombatEngine.calculateCardValue(card, pStats);
        displayPower = calcVal;
        // Calculate mastery for visual feedback
        const effectiveStat = CombatEngine.getEffectiveStat(card, pStats);
        masteryMult = CombatEngine.getMastery(effectiveStat, card.requiredStat || 0);
        if (masteryMult < 1.0) el.classList.add('stat-penalty');
      }

      // Translate name/desc based on card type
      let name = card.name;
      let desc = card.desc || '';
      if (card.id) {
        name = t(`card.${card.id}.name`, card.name);
        desc = t(`card.${card.id}.desc`, card.desc);
      } else if (card.type === 'item' && card.template) {
        name = t(`item.${card.template}.name`, card.name);
        desc = t(`item.${card.template}.desc`, card.desc);
      }

      let powerHtml = '';
      if (displayPower !== null) {
        const powerClass = masteryMult < 1.0 ? 'card-power-penalty' : 'card-power';
        powerHtml = `<div class="${powerClass}">${displayPower}</div>`;
      }

      el.innerHTML = `
        ${powerHtml}
        <div class="card-cost">${card.cost}</div>
        <div class="card-sprite">${card.sprite}</div>
        <div class="card-name">${name}</div>
        <div class="card-desc">${desc}</div>
      `;

      container.appendChild(el);
    });
  }

  static selectCard(uuid) {
    document.querySelectorAll('.hand-card').forEach(el => {
      el.classList.toggle('selected', el.dataset.uuid === uuid);
    });
  }
}
