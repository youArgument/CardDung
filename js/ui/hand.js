import { t } from '../system/i18n.js';

export class HandUI {
  // Calculate min stat multiplier across all effects of a card
  static getCardStatMultiplier(card, pStats) {
    if (!pStats || !card.effects || !card.effects.length) return 1.0;
    let minMult = 1.0;
    for (const efx of card.effects) {
      const req = efx.req;
      if (!req) continue;
      for (const [statKey, reqVal] of Object.entries(req)) {
        const playerVal = pStats[statKey] || 0;
        const mult = Math.max(0.3, playerVal / reqVal);
        minMult = Math.min(minMult, mult);
      }
    }
    return minMult;
  }

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

      // Check stat penalty
      const mult = HandUI.getCardStatMultiplier(card, pStats);
      let powerBadge = '';
      if (mult < 1.0 && mult > 0) {
        const pct = Math.round(mult * 100);
        el.classList.add('stat-penalty');
        el.style.opacity = String(0.5 + mult * 0.5); // 30% → opacity 0.65, 100% → opacity 1.0
        powerBadge = `<div class="card-power-badge">${pct}%</div>`;
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

      el.innerHTML = `
        <div class="card-cost">${card.cost}</div>
        <div class="card-sprite">${card.sprite}</div>
        <div class="card-name">${name}</div>
        ${powerBadge ? `<div class="card-power-pct">${powerBadge}</div>` : ''}
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
