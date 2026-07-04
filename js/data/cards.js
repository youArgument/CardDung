export const PLAYER_CARDS = {
  strike: {
    id: 'strike', name: 'Strike', cost: 1,
    sprite: '⚔️', desc: 'Deal 5 damage',
    type: 'attack', power: 5
  },
  defend: {
    id: 'defend', name: 'Defend', cost: 1,
    sprite: '🛡️', desc: 'Gain 4 Armor',
    type: 'armor', power: 4
  },
  bash: {
    id: 'bash', name: 'Bash', cost: 2,
    sprite: '🔨', desc: 'Deal 8 damage',
    type: 'attack', power: 8
  },
  leech: {
    id: 'leech', name: 'Leech', cost: 1,
    sprite: '🧛', desc: 'Deal 3, Heal 2',
    type: 'attack', power: 3, heal: 2
  },
  fireball: {
    id: 'fireball', name: 'Fireball', cost: 2,
    sprite: '🔥', desc: 'Deal 6 to all',
    type: 'attack-all', power: 6
  },
  dodge: {
    id: 'dodge', name: 'Dodge', cost: 0,
    sprite: '💨', desc: 'Gain 2 Armor',
    type: 'armor', power: 2
  },
  heavy: {
    id: 'heavy', name: 'Heavy Blow', cost: 2,
    sprite: '🪓', desc: 'Deal 10 damage',
    type: 'attack', power: 10
  },
  poison: {
    id: 'poison', name: 'Venom', cost: 1,
    sprite: '🗡️', desc: 'Deal 2, Poison 2',
    type: 'attack', power: 2, poison: 2
  },
  channel: {
    id: 'channel', name: 'Channel', cost: 0,
    sprite: '⚡', desc: 'Gain 1 Energy',
    type: 'energy', power: 1
  }
};

export const STARTING_DECK = ['strike', 'strike', 'strike', 'defend', 'defend', 'defend', 'bash', 'dodge'];
