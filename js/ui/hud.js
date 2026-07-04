export class HUD {
  static update(state) {
    const run = state.run;
    if (!run) return;
    const p = run.player;

    const setText = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    // HP as number
    setText('hp-text', `${Math.max(0, p.hp)}/${p.maxHp}`);

    // Armor as number
    setText('armor-badge', `🛡${p.armor}`);

    // Stamina
    const staminaEl = document.getElementById('stamina-badge');
    if (staminaEl) {
      staminaEl.textContent = `⚡${p.stamina}`;
      staminaEl.style.opacity = p.stamina <= 20 ? '0.6' : '1';
    }

    // Resources
    setText('gold-val', p.gold);
    setText('energy-val', `⚡${p.stamina}`);
    setText('floor-val', `F${run.floor}`);

    // Room progress
    const roomProgress = document.getElementById('room-progress');
    if (roomProgress) {
      const current = run.roomsCleared + 1;
      const total = run.totalRooms;
      roomProgress.textContent = `Room ${current}/${total}`;
    }

    // Reveal progress (stars)
    const starBar = document.getElementById('star-bar');
    if (!starBar) return;
    starBar.innerHTML = '';
    for (let i = 0; i < run.maxRevealPerTurn; i++) {
      const star = document.createElement('div');
      star.className = `star ${i < run.revealedThisTurn ? '' : 'empty'}`;
      starBar.appendChild(star);
    }
  }
}
