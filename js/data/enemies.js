export const DUNGEON_ENEMIES = {
  rat: { id: 'rat', name: 'Rat', sprite: '🐀', hp: 3, atk: 2, gold: 2, tier: 1 },
  skeleton: { id: 'skeleton', name: 'Skeleton', sprite: '💀', hp: 5, atk: 3, gold: 3, tier: 1 },
  ghost: { id: 'ghost', name: 'Ghost', sprite: '👻', hp: 4, atk: 4, gold: 3, tier: 1 },
  slime: { id: 'slime', name: 'Slime', sprite: '🟢', hp: 6, atk: 2, gold: 2, tier: 1 },
  wolf: { id: 'wolf', name: 'Wolf', sprite: '🐺', hp: 7, atk: 4, gold: 4, tier: 2 },
  orc: { id: 'orc', name: 'Orc', sprite: '👹', hp: 10, atk: 5, gold: 5, tier: 2 },
  demon: { id: 'demon', name: 'Demon', sprite: '👿', hp: 8, atk: 6, gold: 6, tier: 2 },
  dragon: { id: 'dragon', name: 'Dragon', sprite: '🐉', hp: 15, atk: 7, gold: 10, tier: 3 },
  lich: { id: 'lich', name: 'Lich', sprite: '🧙', hp: 12, atk: 8, gold: 8, tier: 3 }
};

export const DUNGEON_ITEMS = {
  health_potion: { id: 'health_potion', name: 'Potion', sprite: '🧪', desc: 'Heal 3 HP', effect: 'heal', value: 3 },
  armor_upgrade: { id: 'armor_upgrade', name: 'Armor+', sprite: '🛡️', desc: '+2 Max Armor', effect: 'maxArmor', value: 2 },
  strength_up: { id: 'strength_up', name: 'Strength', sprite: '💪', desc: '+1 Attack', effect: 'strength', value: 1 },
  gold_pile: { id: 'gold_pile', name: 'Gold', sprite: '💰', desc: '+5 Gold', effect: 'gold', value: 5 },
  card_draw: { id: 'card_draw', name: 'Tome', sprite: '📖', desc: 'Draw 2 cards', effect: 'draw', value: 2 },
  energy_up: { id: 'energy_up', name: 'Crystal', sprite: '💎', desc: '+1 Max Energy', effect: 'maxEnergy', value: 1 }
};

export const EXIT_CARD = { id: 'exit', name: 'Exit', sprite: '🚪', desc: 'Escape the dungeon' };

export const EMPTY_CARD = { id: 'empty', name: 'Empty', sprite: '' };
