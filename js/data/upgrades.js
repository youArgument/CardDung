export const UPGRADES = {
  startArmor: {
    id: 'startArmor', name: 'Starting Armor', icon: '🛡️',
    desc: '+1 starting armor per level',
    maxLevel: 5, baseCost: 15, costScale: 10,
    effect: (level) => level
  },
  startHp: {
    id: 'startHp', name: 'Vitality', icon: '❤️',
    desc: '+1 max HP per level',
    maxLevel: 5, baseCost: 20, costScale: 15,
    effect: (level) => level
  },
  extraReveal: {
    id: 'extraReveal', name: 'Extra Reveal', icon: '👁️',
    desc: '+1 reveal every 3 turns',
    maxLevel: 3, baseCost: 25, costScale: 20,
    effect: (level) => level
  },
  startEnergy: {
    id: 'startEnergy', name: 'Energy Reserve', icon: '⚡',
    desc: '+1 starting energy per level',
    maxLevel: 3, baseCost: 30, costScale: 20,
    effect: (level) => level
  },
  cardDraw: {
    id: 'cardDraw', name: 'Card Draw', icon: '📖',
    desc: '+1 card drawn each turn',
    maxLevel: 3, baseCost: 35, costScale: 25,
    effect: (level) => level
  },
  mergeBonus: {
    id: 'mergeBonus', name: 'Merge Bonus', icon: '✨',
    desc: 'Merged cards deal +1 damage per level',
    maxLevel: 5, baseCost: 40, costScale: 20,
    effect: (level) => level
  }
};

export function getUpgradeCost(upgradeId, currentLevel) {
  const u = UPGRADES[upgradeId];
  return u.baseCost + (u.costScale * currentLevel);
}
