export class SaveSystem {
  static save(state) {
    const data = {
      gold: state.player.gold,
      selectedClass: state.selectedClassId,
      activeDeck: state.activeDeck,
      collection: state.collection,
      upgrades: state.upgrades,
      stats: {
        totalRuns: state.stats.totalRuns,
        totalEscapes: state.stats.totalEscapes,
        bestFloor: state.stats.bestFloor,
        totalKills: state.stats.totalKills,
        cardsDiscovered: [...state.stats.cardsDiscovered]
      }
    };

    // World state is saved separately by Game.leaveWorldMap().
    // If it exists in the passed state, preserve it.
    if (state.worldState) {
      data.worldState = state.worldState;
    } else {
      // Keep existing worldState from localStorage if present.
      const existing = this.load();
      if (existing?.worldState) data.worldState = existing.worldState;
    }

    localStorage.setItem('patientRogue_save', JSON.stringify(data));
  }

  static load() {
    const raw = localStorage.getItem('patientRogue_save');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  static loadStats() {
    return this.load();
  }
}
