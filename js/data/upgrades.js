export const UPGRADES = {
  startArmor: {
    id: 'startArmor', nameKey: 'upgrade.start_armor.name', icon: '🛡️',
    descKey: 'upgrade.start_armor.desc',
    maxLevel: 5, baseCost: 15, costScale: 10,
    effect: (level) => level
  },
  startHp: {
    id: 'startHp', nameKey: 'upgrade.start_hp.name', icon: '❤️',
    descKey: 'upgrade.start_hp.desc',
    maxLevel: 5, baseCost: 20, costScale: 15,
    effect: (level) => level
  },
  extraReveal: {
    id: 'extraReveal', nameKey: 'upgrade.extra_reveal.name', icon: '👁️',
    descKey: 'upgrade.extra_reveal.desc',
    maxLevel: 3, baseCost: 25, costScale: 20,
    effect: (level) => level
  },
  startStamina: {
    id: 'startStamina', nameKey: 'upgrade.start_stamina.name', icon: '⚡',
    descKey: 'upgrade.start_stamina.desc',
    maxLevel: 3, baseCost: 30, costScale: 20,
    effect: (level) => level * 10
  },
  cardDraw: {
    id: 'cardDraw', nameKey: 'upgrade.card_draw.name', icon: '📖',
    descKey: 'upgrade.card_draw.desc',
    maxLevel: 3, baseCost: 35, costScale: 25,
    effect: (level) => level
  },
  mergeBonus: {
    id: 'mergeBonus', nameKey: 'upgrade.merge_bonus.name', icon: '✨',
    descKey: 'upgrade.merge_bonus.desc',
    maxLevel: 5, baseCost: 40, costScale: 20,
    effect: (level) => level
  },
  statStr: {
    id: 'statStr', nameKey: 'stat.strength.name', icon: '💪',
    descKey: 'upgrade.stat.desc', statType: 'strength',
    maxLevel: 20, baseCost: 15, costScale: 8,
    effect: (level) => level
  },
  statAgi: {
    id: 'statAgi', nameKey: 'stat.agility.name', icon: '🏃',
    descKey: 'upgrade.stat.desc', statType: 'agility',
    maxLevel: 20, baseCost: 15, costScale: 8,
    effect: (level) => level
  },
  statInt: {
    id: 'statInt', nameKey: 'stat.intelligence.name', icon: '🧠',
    descKey: 'upgrade.stat.desc', statType: 'intelligence',
    maxLevel: 20, baseCost: 15, costScale: 8,
    effect: (level) => level
  },
  statWill: {
    id: 'statWill', nameKey: 'stat.will.name', icon: '✨',
    descKey: 'upgrade.stat.desc', statType: 'will',
    maxLevel: 20, baseCost: 20, costScale: 10,
    effect: (level) => level
  }
};

export function getUpgradeCost(upgradeId, currentLevel) {
  const u = UPGRADES[upgradeId];
  return u.baseCost + (u.costScale * currentLevel);
}
