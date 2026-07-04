export class HUD {
  static update(state) {
    const run = state.run;
    if (!run) return;
    const p = run.player;

    // HP as number
    document.getElementById('hp-text').textContent = `${Math.max(0, p.hp)}/${p.maxHp}`;

    // Armor as number
    document.getElementById('armor-badge').textContent = `🛡${p.armor}`;

    // Stamina
    const staminaEl = document.getElementById('stamina-badge');
    if (staminaEl) {
      staminaEl.textContent = `⚡${p.stamina}`;
      staminaEl.style.opacity = p.stamina <= 20 ? '0.6' : '1';
    }

    // Resources
    document.getElementById('gold-val').textContent = p.gold;
    // Energy is no longer a gating resource; show it as stamina cap placeholder.
    document.getElementById('energy-val').textContent = `⚡${p.stamina}`;
    document.getElementById('floor-val').textContent = `F${run.floor}`;

    // Room progress
    const roomProgress = document.getElementById('room-progress');
    if (roomProgress) {
      const current = run.roomsCleared + 1;
      const total = run.totalRooms;
      roomProgress.textContent = `Room ${current}/${total}`;
    }

    // Reveal progress (stars)
    const starBar = document.getElementById('star-bar');
    starBar.innerHTML = '';
    for (let i = 0; i < run.maxRevealPerTurn; i++) {
      const star = document.createElement('div');
      star.className = `star ${i < run.revealedThisTurn ? '' : 'empty'}`;
      starBar.appendChild(star);
    }
  }
}
