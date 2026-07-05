export const DUNGEON_ENEMIES = {
  rat: {
    id: 'rat', name: 'Rat', sprite: '🐀', hp: 3, atk: 2, gold: 2, tier: 1, maxArmor: 0,
    deckTemplate: ['bite', 'bite', 'scratch', 'retreat']
  },
  skeleton: {
    id: 'skeleton', name: 'Skeleton', sprite: '💀', hp: 5, atk: 3, gold: 3, tier: 1, maxArmor: 2,
    deckTemplate: ['bone_strike', 'shield_bone', 'bone_strike', 'heavy_blow']
  },
  ghost: {
    id: 'ghost', name: 'Ghost', sprite: '👻', hp: 4, atk: 4, gold: 3, tier: 1, maxArmor: 0,
    deckTemplate: ['wail', 'phase_through', 'wail', 'dark_touch']
  },
  slime: {
    id: 'slime', name: 'Slime', sprite: '🟢', hp: 6, atk: 2, gold: 2, tier: 1, maxArmor: 3,
    deckTemplate: ['ooze_slap', 'absorb', 'ooze_slap', 'split']
  },
  wolf: {
    id: 'wolf', name: 'Wolf', sprite: '🐺', hp: 7, atk: 4, gold: 4, tier: 2, maxArmor: 1,
    deckTemplate: ['fang_bite', 'pounce', 'howl_buff', 'retreat']
  },
  orc: {
    id: 'orc', name: 'Orc', sprite: '👹', hp: 10, atk: 5, gold: 5, tier: 2, maxArmor: 4,
    deckTemplate: ['club_smash', 'iron_skin', 'club_smash', 'war_cry']
  },
  demon: {
    id: 'demon', name: 'Demon', sprite: '👿', hp: 8, atk: 6, gold: 6, tier: 2, maxArmor: 2,
    deckTemplate: ['hellfire', 'dark_ritual', 'hellfire', 'possess']
  },
  dragon: {
    id: 'dragon', name: 'Dragon', sprite: '🐉', hp: 15, atk: 7, gold: 10, tier: 3, maxArmor: 5,
    deckTemplate: ['fire_breath', 'scale_armor', 'tail_sweep', 'dragon_roar']
  },
  lich: {
    id: 'lich', name: 'Lich', sprite: '🧙', hp: 12, atk: 8, gold: 8, tier: 3, maxArmor: 3,
    deckTemplate: ['death_touch', 'life_drain', 'frost_bolt']
  }
};

// Enemy card templates — same effects format as player cards.
export const ENEMY_CARDS = {
  bite:        { id: 'bite', nameEn: 'Bite', nameRu: 'Укус', effects: [{ action: 'damage_player', power: 2 }] },
  scratch:     { id: 'scratch', nameEn: 'Scratch', nameRu: 'Царапина', effects: [{ action: 'damage_player', power: 1 }] },
  bone_strike: { id: 'bone_strike', nameEn: 'Bone Strike', nameRu: 'Удар костью', effects: [{ action: 'damage_player', power: 3 }] },
  shield_bone: { id: 'shield_bone', nameEn: 'Bone Shield', nameRu: 'Костяной щит', effects: [{ action: 'enemy_armor', amount: 2 }] },
  heavy_blow:  { id: 'heavy_blow', nameEn: 'Heavy Blow', nameRu: 'Тяжёлый удар', effects: [{ action: 'damage_player', power: 5 }] },
  wail:          { id: 'wail', nameEn: 'Wail', nameRu: 'Вой', effects: [{ action: 'damage_player', power: 3 }] },
  phase_through: { id: 'phase_through', nameEn: 'Phase Through', nameRu: 'Призрачность', effects: [{ action: 'enemy_retreat' }] },
  dark_touch:    { id: 'dark_touch', nameEn: 'Dark Touch', nameRu: 'Тёмное касание', effects: [{ action: 'damage_player', power: 5 }] },
  ooze_slap: { id: 'ooze_slap', nameEn: 'Ooze Slap', nameRu: 'Удар слизью', effects: [{ action: 'damage_player', power: 2 }] },
  absorb:    { id: 'absorb', nameEn: 'Absorb', nameRu: 'Поглощение', effects: [{ action: 'enemy_armor', amount: 3 }, { action: 'heal_enemy', amount: 1 }] },
  split:     { id: 'split', nameEn: 'Split', nameRu: 'Разделение', effects: [{ action: 'damage_player', power: 4 }] },
  fang_bite:   { id: 'fang_bite', nameEn: 'Fang Bite', nameRu: 'Укус клыка', effects: [{ action: 'damage_player', power: 3 }] },
  pounce:      { id: 'pounce', nameEn: 'Pounce', nameRu: 'Прыжок', effects: [{ action: 'damage_player', power: 5 }] },
  howl_buff:   { id: 'howl_buff', nameEn: 'Howling Fury', nameRu: 'Вой ярости', effects: [{ action: 'enemy_buff', stat: 'power', amount: 1, ticks: 3 }] },
  club_smash:  { id: 'club_smash', nameEn: 'Club Smash', nameRu: 'Удар дубиной', effects: [{ action: 'damage_player', power: 4 }] },
  iron_skin:   { id: 'iron_skin', nameEn: 'Iron Skin', nameRu: 'Железная кожа', effects: [{ action: 'enemy_armor', amount: 4 }] },
  war_cry:     { id: 'war_cry', nameEn: 'War Cry', nameRu: 'Боевой клич', effects: [{ action: 'enemy_buff', stat: 'power', amount: 2, ticks: 2 }] },
  hellfire:     { id: 'hellfire', nameEn: 'Hellfire', nameRu: 'Адский огонь', effects: [{ action: 'damage_player', power: 5 }] },
  dark_ritual:  { id: 'dark_ritual', nameEn: 'Dark Ritual', nameRu: 'Тёмный ритуал', effects: [{ action: 'heal_enemy', amount: 3 }] },
  possess:      { id: 'possess', nameEn: 'Possess', nameRu: 'Одержимость', effects: [{ action: 'damage_player', power: 4 }, { action: 'enemy_buff', stat: 'power', amount: 1, ticks: 2 }] },
  fire_breath:  { id: 'fire_breath', nameEn: 'Fire Breath', nameRu: 'Огненное дыхание', effects: [{ action: 'damage_player', power: 6 }] },
  scale_armor:  { id: 'scale_armor', nameEn: 'Scale Armor', nameRu: 'Чешуйчатая броня', effects: [{ action: 'enemy_armor', amount: 5 }] },
  tail_sweep:   { id: 'tail_sweep', nameEn: 'Tail Sweep', nameRu: 'Удар хвостом', effects: [{ action: 'damage_player', power: 4 }] },
  dragon_roar:  { id: 'dragon_roar', nameEn: 'Dragon Roar', nameRu: 'Рёв дракона', effects: [{ action: 'enemy_buff', stat: 'power', amount: 2, ticks: 3 }] },
  death_touch: { id: 'death_touch', nameEn: 'Death Touch', nameRu: 'Касание смерти', effects: [{ action: 'damage_player', power: 6 }] },
  life_drain:  { id: 'life_drain', nameEn: 'Life Drain', nameRu: 'Отжизнение', effects: [{ action: 'damage_player', power: 3 }, { action: 'heal_enemy', amount: 2 }] },
  frost_bolt:  { id: 'frost_bolt', nameEn: 'Frost Bolt', nameRu: 'Морозная стрела', effects: [{ action: 'damage_player', power: 4 }] },
  retreat:     { id: 'retreat', nameEn: 'Retreat', nameRu: 'Отступление', effects: [{ action: 'enemy_retreat' }] }
};

export const EXIT_CARD = { id: 'exit', name: 'Exit', sprite: '🚪', desc: 'Escape the dungeon' };

export const EMPTY_CARD = { id: 'empty', name: 'Empty', sprite: '' };
