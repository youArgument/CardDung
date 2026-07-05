import { t } from '../system/i18n.js';

export class HandUI {
  static render(state, container) {
    const run = state.run;
    if (!run) return;

    container.innerHTML = '';
    const hand = run.deck.hand;

    hand.forEach((card) => {
      const el = document.createElement('div');
      el.className = 'hand-card';
      el.dataset.uuid = card.uuid;

      if (run.player.stamina < card.cost) el.classList.add('unplayable');

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
