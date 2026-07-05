export const CLASSES = {
  warrior: {
    id: 'warrior',
    nameKey: 'class.warrior.name',
    descKey: 'class.warrior.desc',
    sprite: '⚔️',
    stats: { strength: 8, agility: 5, intelligence: 2, will: 4, vitality: 8 },
    startingDeck: ['strike', 'heavy_slash', 'shield', 'bash', 'parry'],
    artifact: {
      id: 'iron_belt',
      nameKey: 'artifact.iron_belt.name',
      descKey: 'artifact.iron_belt.desc',
      sprite: '⛓️'
    }
  },
  mage: {
    id: 'mage',
    nameKey: 'class.mage.name',
    descKey: 'class.mage.desc',
    sprite: '🔮',
    stats: { strength: 2, agility: 4, intelligence: 9, will: 8, vitality: 3 },
    startingDeck: ['fire_bolt', 'frost', 'mana_shield', 'arcane_missile'],
    artifact: {
      id: 'tome',
      nameKey: 'artifact.tome.name',
      descKey: 'artifact.tome.desc',
      sprite: '📖'
    }
  },
  rogue: {
    id: 'rogue',
    nameKey: 'class.rogue.name',
    descKey: 'class.rogue.desc',
    sprite: '🗡️',
    stats: { strength: 4, agility: 9, intelligence: 4, will: 5, vitality: 5 },
    startingDeck: ['dagger', 'dagger', 'poison', 'dodge', 'backstab'],
    artifact: {
      id: 'rogue_cloak',
      nameKey: 'artifact.rogue_cloak.name',
      descKey: 'artifact.rogue_cloak.desc',
      sprite: '🧥'
    }
  },
  beggar: {
    id: 'beggar',
    nameKey: 'class.beggar.name',
    descKey: 'class.beggar.desc',
    sprite: '🥀',
    stats: { strength: 1, agility: 1, intelligence: 1, will: 1, vitality: 1 },
    startingDeck: [],
    artifact: null
  }
};
