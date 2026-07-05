import { PLAYER_CARDS } from '../data/cards.js';
import { UPGRADES, getUpgradeCost } from '../data/upgrades.js';

export class HubEngine {
  constructor(state) {
    this.state = state;
  }

  // Get market inventory (random cards for sale)
  getMarketInventory() {
    const cardIds = Object.keys(PLAYER_CARDS);
    const inventory = [];

    // Generate 6 random cards
    for (let i = 0; i < 6; i++) {
      const id = cardIds[Math.floor(Math.random() * cardIds.length)];
      const card = PLAYER_CARDS[id];
      const cost = card.cost <= 1 ? 5 : card.cost <= 2 ? 10 : 15;
      inventory.push({ id, ...card, cost });
    }

    return inventory;
  }

  // Buy a card from market
  buyCard(cardId) {
    const card = PLAYER_CARDS[cardId];
    const cost = card.cost <= 1 ? 5 : card.cost <= 2 ? 10 : 15;

    if (this.state.player.gold < cost) return false;

    this.state.player.gold -= cost;
    this.state.collection.push(cardId);
    this.state.stats.cardsDiscovered.add(cardId);
    return true;
  }

  // Add card to active deck (max 5)
  addToDeck(cardId) {
    if (this.state.activeDeck.length >= 5) return false;
    if (!this.state.collection.includes(cardId)) return false;

    this.state.activeDeck.push(cardId);
    // Remove one from collection
    const idx = this.state.collection.indexOf(cardId);
    if (idx !== -1) this.state.collection.splice(idx, 1);
    return true;
  }

  // Remove card from active deck
  removeFromDeck(index) {
    if (index < 0 || index >= this.state.activeDeck.length) return false;
    const cardId = this.state.activeDeck.splice(index, 1)[0];
    this.state.collection.push(cardId);
    return true;
  }

  // Merge two identical cards in deck → one upgraded card
  mergeCards(index1, index2) {
    if (index1 === index2) return false;
    if (index1 < 0 || index1 >= this.state.activeDeck.length) return false;
    if (index2 < 0 || index2 >= this.state.activeDeck.length) return false;

    const id1 = this.state.activeDeck[index1];
    const id2 = this.state.activeDeck[index2];

    if (id1 !== id2) return false;

    // Remove both, add one back (considered "upgraded")
    // Remove higher index first
    const hi = Math.max(index1, index2);
    const lo = Math.min(index1, index2);
    this.state.activeDeck.splice(hi, 1);
    this.state.activeDeck.splice(lo, 1);

    // Add back as "merged" version (stored with suffix)
    this.state.activeDeck.push(`${id1}+`);
    return true;
  }

  // Buy upgrade
  buyUpgrade(upgradeId) {
    const currentLevel = this.state.upgrades[upgradeId] || 0;
    const upgrade = UPGRADES[upgradeId];

    if (currentLevel >= upgrade.maxLevel) return false;

    const cost = getUpgradeCost(upgradeId, currentLevel);
    if (this.state.player.gold < cost) return false;

    this.state.player.gold -= cost;
    this.state.upgrades[upgradeId] = currentLevel + 1;
    return true;
  }

  // Get upgrade level
  getUpgradeLevel(upgradeId) {
    return this.state.upgrades[upgradeId] || 0;
  }

  // Apply upgrades to a new run
  applyUpgradesToRun(runState) {
    runState.player.maxArmor += this.getUpgradeLevel('startArmor');
    runState.player.maxHp += this.getUpgradeLevel('startHp');
    // Energy mechanic disabled; keep for compatibility but don't apply.
    runState.player.armor = runState.player.maxArmor;
    runState.player.hp = runState.player.maxHp;
    // runState.player.energy = runState.player.maxEnergy;
    runState.extraDraw = this.getUpgradeLevel('cardDraw');
    runState.mergeBonus = this.getUpgradeLevel('mergeBonus');
  }
}
