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
    localStorage.setItem('patientRogue_save', JSON.stringify(data));
  }

  static loadStats() {
    const raw = localStorage.getItem('patientRogue_save');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }
}
