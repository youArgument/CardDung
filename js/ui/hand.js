export class HandUI {
  static render(state, container) {
    const run = state.run;
    if (!run) return;

    container.innerHTML = '';
    const hand = run.deck.hand;

    hand.forEach((card, i) => {
      const el = document.createElement('div');
      el.className = 'hand-card';
      el.dataset.uuid = card.uuid;

      const canPlay = run.player.energy >= card.cost;
      const canPlayByStamina = run.player.stamina >= card.cost;
      if (!canPlayByStamina) el.classList.add('unplayable');

      const total = hand.length;
      const mid = (total - 1) / 2;
      const angle = (i - mid) * 5;
      el.style.transform = `rotate(${angle}deg)`;

      el.innerHTML = `
        <div class="card-cost">${card.cost}</div>
        <div class="card-sprite">${card.sprite}</div>
        <div class="card-name">${card.name}</div>
        <div class="card-desc">${card.desc}</div>
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
