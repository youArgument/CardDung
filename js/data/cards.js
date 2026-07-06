// Mutable object — populated from server on init, falls back to built-in defaults.
export const PLAYER_CARDS = {};

export const STARTING_DECK = ['strike', 'strike', 'strike', 'defend', 'defend', 'defend', 'bash', 'dodge'];

// Built-in fallback cards (used if server fetch fails or offline).
const FALLBACK_CARDS = [
  { id: 'strike', nameEn: 'Strike', nameRu: 'Удар', descEn: 'Deal physical damage based on STR', descRu: 'Нанеси физический урон от Силы', cost: 1, sprite: '⚔️', type: 'attack', power: 5, baseDamage: 3, mainStat: 'STR', requiredStat: 5, scaling: 0.35, damageType: 'Physical', tags: ['Melee'], effects: [{ action: 'damage' }] },
  { id: 'defend', nameEn: 'Defend', nameRu: 'Защита', descEn: 'Gain armor based on VIT', descRu: 'Получи броню от Выносливости', cost: 1, sprite: '🛡️', type: 'armor', power: 4, baseDamage: 3, mainStat: 'VIT', requiredStat: 4, scaling: 0.30, damageType: 'Armor', tags: ['Defense'], effects: [{ action: 'armor' }] },
  { id: 'bash', nameEn: 'Bash', nameRu: 'Толчок', descEn: 'Heavy physical strike', descRu: 'Мощный физический удар', cost: 2, sprite: '🔨', type: 'attack', power: 8, baseDamage: 7, mainStat: 'STR', requiredStat: 8, scaling: 0.40, damageType: 'Physical', tags: ['Melee'], effects: [{ action: 'damage' }] },
  { id: 'leech', nameEn: 'Leech', nameRu: 'Вампиризм', descEn: 'Deal damage and heal based on WIL', descRu: 'Нанеси урон и лечись от Воли', cost: 1, sprite: '🧛', type: 'attack', power: 3, heal: 2, baseDamage: 2, mainStat: 'WIL', requiredStat: 4, scaling: 0.30, damageType: 'Magic', tags: ['LifeSteal'], effects: [{ action: 'damage' }, { action: 'heal', amount: 1 }] },
  { id: 'fireball', nameEn: 'Fireball', nameRu: 'Огненный Шар', descEn: 'Deal magic damage to all enemies based on INT', descRu: 'Магический урон всем врагам от Интеллекта', cost: 2, sprite: '🔥', type: 'attack-all', power: 6, baseDamage: 5, mainStat: 'INT', requiredStat: 8, scaling: 0.30, damageType: 'Magic', tags: ['Fire', 'AOE'], effects: [{ action: 'damage_all' }] },
  { id: 'dodge', nameEn: 'Dodge', nameRu: 'Уклонение', descEn: 'Gain armor based on AGI', descRu: 'Получи броню от Ловкости', cost: 0, sprite: '💨', type: 'armor', power: 2, baseDamage: 1, mainStat: 'AGI', requiredStat: 3, scaling: 0.25, damageType: 'Armor', tags: ['Evasion'], effects: [{ action: 'armor' }] },
  { id: 'heavy', nameEn: 'Heavy Blow', nameRu: 'Тяжёлый Удар', descEn: 'Massive physical strike', descRu: 'Огромный физический удар', cost: 2, sprite: '🪓', type: 'attack', power: 10, baseDamage: 9, mainStat: 'STR', requiredStat: 10, scaling: 0.45, damageType: 'Physical', tags: ['Melee'], effects: [{ action: 'damage' }] },
  { id: 'poison', nameEn: 'Venom', nameRu: 'Яд', descEn: 'Deal damage and apply poison based on INT', descRu: 'Нанеси урон и наяд от Интеллекта', cost: 1, sprite: '🗡️', type: 'attack', power: 2, poison: 2, baseDamage: 2, mainStat: 'INT', requiredStat: 4, scaling: 0.30, damageType: 'Magic', tags: ['Poison'], effects: [{ action: 'damage' }, { action: 'apply_debuff', debuffType: 'poison', amount: 1, ticks: 3 }] },
  { id: 'channel', nameEn: 'Channel', nameRu: 'Канал', descEn: 'Restore stamina based on WIL', descRu: 'Восстанови стамину от Воли', cost: 1, sprite: '⚡', type: 'energy', power: 3, baseDamage: 2, mainStat: 'WIL', requiredStat: 3, scaling: 0.25, damageType: 'Utility', tags: ['Stamina'], effects: [{ action: 'stamina' }] },
  { id: 'heavy_slash', nameEn: 'Heavy Slash', nameRu: 'Тяжёлый Удар', descEn: 'Powerful physical slash', descRu: 'Мощный физический удар', cost: 1, sprite: '⚔️', type: 'attack', power: 7, baseDamage: 5, mainStat: 'STR', requiredStat: 6, scaling: 0.35, damageType: 'Physical', tags: ['Melee'], effects: [{ action: 'damage' }] },
  { id: 'shield', nameEn: 'Shield', nameRu: 'Щит', descEn: 'Gain heavy armor based on VIT+STR', descRu: 'Получи тяжёлую броню от Выносливости+Силы', cost: 1, sprite: '🛡️', type: 'armor', power: 6, baseDamage: 4, statWeights: { VIT: 0.8, STR: 0.2 }, requiredStat: 6, scaling: 0.35, damageType: 'Armor', tags: ['Defense'], effects: [{ action: 'armor' }] },
  { id: 'parry', nameEn: 'Parry', nameRu: 'Парирование', descEn: 'Quick armor based on AGI', descRu: 'Быстрая броня от Ловкости', cost: 0, sprite: '🔄', type: 'armor', power: 3, baseDamage: 2, mainStat: 'AGI', requiredStat: 4, scaling: 0.30, damageType: 'Armor', tags: ['Defense'], effects: [{ action: 'armor' }] },
  { id: 'fire_bolt', nameEn: 'Fire Bolt', nameRu: 'Огненная Стрела', descEn: 'Magic damage based on INT', descRu: 'Магический урон от Интеллекта', cost: 1, sprite: '🔥', type: 'attack', power: 5, baseDamage: 4, mainStat: 'INT', requiredStat: 4, scaling: 0.30, damageType: 'Magic', tags: ['Fire'], effects: [{ action: 'damage' }] },
  { id: 'frost', nameEn: 'Frost', nameRu: 'Мороз', descEn: 'Magic damage based on INT+WIL', descRu: 'Магический урон от Интеллекта+Воли', cost: 1, sprite: '❄️', type: 'attack', power: 4, baseDamage: 3, statWeights: { INT: 0.8, WIL: 0.2 }, requiredStat: 4, scaling: 0.30, damageType: 'Magic', tags: ['Ice'], effects: [{ action: 'damage' }] },
  { id: 'mana_shield', nameEn: 'Mana Shield', nameRu: 'Магический Щит', descEn: 'Gain armor based on INT', descRu: 'Получи броню от Интеллекта', cost: 1, sprite: '🔵', type: 'armor', power: 5, baseDamage: 3, mainStat: 'INT', requiredStat: 5, scaling: 0.30, damageType: 'Armor', tags: ['Defense', 'Magic'], effects: [{ action: 'armor' }] },
  { id: 'arcane_missile', nameEn: 'Arcane Missile', nameRu: 'Тайная Стрела', descEn: 'Powerful magic damage based on INT', descRu: 'Мощный магический урон от Интеллекта', cost: 2, sprite: '✨', type: 'attack', power: 8, baseDamage: 6, mainStat: 'INT', requiredStat: 8, scaling: 0.40, damageType: 'Magic', tags: ['Arcane'], effects: [{ action: 'damage' }] },
  { id: 'dagger', nameEn: 'Dagger', nameRu: 'Кинжал', descEn: 'Quick physical strike based on AGI', descRu: 'Быстрый физический удар от Ловкости', cost: 0, sprite: '🗡️', type: 'attack', power: 3, baseDamage: 2, mainStat: 'AGI', requiredStat: 3, scaling: 0.30, damageType: 'Physical', tags: ['Melee'], effects: [{ action: 'damage' }] },
  { id: 'backstab', nameEn: 'Backstab', nameRu: 'Удар в Спину', descEn: 'Devastating AGI strike', descRu: 'Разрушающий удар от Ловкости', cost: 2, sprite: '🔪', type: 'attack', power: 12, baseDamage: 10, mainStat: 'AGI', requiredStat: 8, scaling: 0.50, damageType: 'Physical', tags: ['Melee', 'Backstab'], effects: [{ action: 'damage' }] },
  // === Combat System 2.0 new cards ===
  { id: 'power_cleave', nameEn: 'Power Cleave', nameRu: 'Мощное Рассечение', descEn: 'STR cleave through armor', descRu: 'Удар Силой через броню', cost: 2, sprite: '⚔️', type: 'attack', rarity: 'rare', baseDamage: 8, mainStat: 'STR', requiredStat: 7, scaling: 0.40, damageType: 'Physical', tags: ['Melee'], effects: [{ action: 'damage' }] },
  { id: 'war_cleaver', nameEn: 'War Cleaver', nameRu: 'Боевой Топор', descEn: 'Heavy STR overhead strike', descRu: 'Тяжёлый удар Силой сверху', cost: 2, sprite: '🪓', type: 'attack', rarity: 'rare', baseDamage: 7, mainStat: 'STR', requiredStat: 6, scaling: 0.45, damageType: 'Physical', tags: ['Melee'], effects: [{ action: 'damage' }] },
  { id: 'whirlwind_axe', nameEn: 'Whirlwind Axe', nameRu: 'Вихрь Топора', descEn: 'STR AOE physical strike', descRu: 'Физический удар по всем от Силы', cost: 3, sprite: '🌀', type: 'attack-all', rarity: 'legendary', baseDamage: 5, mainStat: 'STR', requiredStat: 10, scaling: 0.45, damageType: 'Physical', tags: ['Melee', 'AOE'], effects: [{ action: 'damage_all' }] },
  { id: 'iron_bark', nameEn: 'Iron Bark', nameRu: 'Железная Кора', descEn: 'Gain heavy armor based on VIT+STR', descRu: 'Тяжёлая броня от Выносливости+Силы', cost: 2, sprite: '🛡️', type: 'armor', rarity: 'rare', baseDamage: 5, statWeights: { VIT: 0.7, STR: 0.3 }, requiredStat: 8, scaling: 0.40, damageType: 'Armor', tags: ['Defense'], effects: [{ action: 'armor' }] },
  { id: 'arcane_blast', nameEn: 'Arcane Blast', nameRu: 'Таинственный Взрыв', descEn: 'INT magic explosion', descRu: 'Взрыв магии от Интеллекта', cost: 2, sprite: '💥', type: 'attack', rarity: 'rare', baseDamage: 7, mainStat: 'INT', requiredStat: 7, scaling: 0.40, damageType: 'Magic', tags: ['Arcane'], effects: [{ action: 'damage' }] },
  { id: 'fire_meteor', nameEn: 'Fire Meteor', nameRu: 'Огненный Метеорит', descEn: 'INT AOE fire devastation', descRu: 'Разрушение по всем огнём от Интеллекта', cost: 3, sprite: '☄️', type: 'attack-all', rarity: 'legendary', baseDamage: 8, mainStat: 'INT', requiredStat: 12, scaling: 0.50, damageType: 'Magic', tags: ['Fire', 'AOE'], effects: [{ action: 'damage_all' }] },
  { id: 'ice_lance', nameEn: 'Ice Lance', nameRu: 'Ледяное Копьё', descEn: 'INT freeze strike with WIL control', descRu: 'Замораживающий удар от Интеллекта+Воли', cost: 2, sprite: '🧊', type: 'attack', rarity: 'rare', baseDamage: 6, statWeights: { INT: 0.8, WIL: 0.2 }, requiredStat: 7, scaling: 0.35, damageType: 'Magic', tags: ['Ice'], effects: [{ action: 'damage' }] },
  { id: 'thunder_bolt', nameEn: 'Thunder Bolt', nameRu: 'Громовая Молния', descEn: 'Lightning damage based on INT+WIL', descRu: 'Урон молнией от Интеллекта+Воли', cost: 2, sprite: '⚡', type: 'attack', rarity: 'rare', baseDamage: 5, statWeights: { INT: 0.7, WIL: 0.3 }, requiredStat: 6, scaling: 0.35, damageType: 'Magic', tags: ['Lightning'], effects: [{ action: 'damage' }] },
  { id: 'ice_blast', nameEn: 'Ice Blast', nameRu: 'Ледяной Взрыв', descEn: 'INT+WIL freeze AOE', descRu: 'Заморозка всех от Интеллекта+Воли', cost: 2, sprite: '❄️', type: 'attack-all', rarity: 'rare', baseDamage: 4, statWeights: { INT: 0.7, WIL: 0.3 }, requiredStat: 6, scaling: 0.35, damageType: 'Magic', tags: ['Ice', 'AOE'], effects: [{ action: 'damage_all' }] },
  { id: 'shadow_strike', nameEn: 'Shadow Strike', nameRu: 'Теневой Удар', descEn: 'AGI strike with INT precision', descRu: 'Удар Ловкостью с точностью Интеллекта', cost: 1, sprite: '🌑', type: 'attack', rarity: 'rare', baseDamage: 5, statWeights: { AGI: 0.7, INT: 0.3 }, requiredStat: 6, scaling: 0.40, damageType: 'Physical', tags: ['Melee'], effects: [{ action: 'damage' }] },
  { id: 'assassin_strike', nameEn: 'Assassin Strike', nameRu: 'Удар Убийцы', descEn: 'Massive AGI execution strike', descRu: 'Мощный удар Ловкостью-исполнением', cost: 3, sprite: '💀', type: 'attack', rarity: 'legendary', baseDamage: 12, mainStat: 'AGI', requiredStat: 10, scaling: 0.55, damageType: 'Physical', tags: ['Melee', 'Backstab'], effects: [{ action: 'damage' }] },
  { id: 'swift_slash', nameEn: 'Swift Slash', nameRu: 'Быстрый Удар', descEn: 'Rapid AGI assault with STR power', descRu: 'Быстрая атака Ловкостью+Силой', cost: 2, sprite: '💨', type: 'attack', rarity: 'rare', baseDamage: 6, statWeights: { AGI: 0.7, STR: 0.3 }, requiredStat: 7, scaling: 0.45, damageType: 'Physical', tags: ['Melee'], effects: [{ action: 'damage' }] },
  { id: 'holy_light', nameEn: 'Holy Light', nameRu: 'Святой Свет', descEn: 'Heal based on WIL+INT', descRu: 'Лечение от Воли+Интеллекта', cost: 2, sprite: '✨', type: 'heal', rarity: 'rare', baseDamage: 4, statWeights: { WIL: 0.8, INT: 0.2 }, requiredStat: 6, scaling: 0.35, damageType: 'Heal', tags: ['Holy'], effects: [{ action: 'heal' }] },
  { id: 'soul_reaper', nameEn: 'Soul Reaper', nameRu: 'Жнец Душ', descEn: 'WIL-based damage and heal', descRu: 'Урон и лечение от Воли', cost: 2, sprite: '👻', type: 'attack', rarity: 'rare', baseDamage: 4, mainStat: 'WIL', requiredStat: 6, scaling: 0.35, damageType: 'Magic', tags: ['LifeSteal'], effects: [{ action: 'damage' }, { action: 'heal', amount: 2 }] },
  { id: 'blood_thirst', nameEn: 'Blood Thirst', nameRu: 'Кровавая Жажда', descEn: 'STR+WIL berserker rage attack', descRu: 'Берсерк-атака Силы+Воли', cost: 2, sprite: '🩸', type: 'attack', rarity: 'rare', baseDamage: 7, statWeights: { STR: 0.8, WIL: 0.2 }, requiredStat: 8, scaling: 0.45, damageType: 'Physical', tags: ['Melee'], effects: [{ action: 'damage' }] },
  { id: 'war_cry', nameEn: 'War Cry', nameRu: 'Боевой Клич', descEn: 'WIL+STR buff to empower strikes', descRu: 'Бафф Воли+Силы для усиления ударов', cost: 1, sprite: '📯', type: 'buff', rarity: 'rare', baseDamage: 0, statWeights: { WIL: 0.7, STR: 0.3 }, requiredStat: 5, scaling: 0.30, damageType: 'Buff', tags: ['Buff'], effects: [{ action: 'player_buff', str: 2, ticks: 3 }] },
  { id: 'earth_wall', nameEn: 'Earth Wall', nameRu: 'Земляная Стена', descEn: 'Massive VIT armor barrier', descRu: 'Массивный барьер Выносливости', cost: 1, sprite: '🌍', type: 'armor', rarity: 'rare', baseDamage: 5, mainStat: 'VIT', requiredStat: 6, scaling: 0.40, damageType: 'Armor', tags: ['Defense'], effects: [{ action: 'armor' }] },
  { id: 'divine_shield', nameEn: 'Divine Shield', nameRu: 'Божественный Щит', descEn: 'Holy armor based on WIL+VIT', descRu: 'Святая броня от Воли+Выносливости', cost: 2, sprite: '🛡️', type: 'armor', rarity: 'rare', baseDamage: 4, statWeights: { WIL: 0.7, VIT: 0.3 }, requiredStat: 6, scaling: 0.35, damageType: 'Armor', tags: ['Defense', 'Holy'], effects: [{ action: 'armor' }] },
  { id: 'evasion_stance', nameEn: 'Evasion Stance', nameRu: 'Поза Уклонения', descEn: 'AGI stance for armor and dodge chance', descRu: 'Поза Ловкости для брони и уклонений', cost: 1, sprite: '💨', type: 'armor', rarity: 'common', baseDamage: 3, mainStat: 'AGI', requiredStat: 5, scaling: 0.35, damageType: 'Armor', tags: ['Evasion'], effects: [{ action: 'armor' }] },
  { id: 'dark_ritual', nameEn: 'Dark Ritual', nameRu: 'Тёмный Ритуал', descEn: 'WIL+INT dark magic damage', descRu: 'Тёмное заклинание Воли+Интеллекта', cost: 2, sprite: '🌙', type: 'attack', rarity: 'rare', baseDamage: 6, statWeights: { WIL: 0.5, INT: 0.5 }, requiredStat: 7, scaling: 0.40, damageType: 'Magic', tags: ['Dark'], effects: [{ action: 'damage' }] },
  { id: 'venom_cloud', nameEn: 'Venom Cloud', nameRu: 'Ядовитое Облако', descEn: 'INT-based poison AOE', descRu: 'Облако яда от Интеллекта по всем', cost: 2, sprite: '☁️', type: 'attack-all', rarity: 'rare', baseDamage: 3, mainStat: 'INT', requiredStat: 6, scaling: 0.35, damageType: 'Magic', tags: ['Poison', 'AOE'], effects: [{ action: 'damage_all' }, { action: 'apply_debuff', debuffType: 'poison', amount: 1, ticks: 3 }] },
  { id: 'execute_strike', nameEn: 'Execute Strike', nameRu: 'Казнь Ударом', descEn: 'AGI+STR finishing blow', descRu: 'Финальный удар Ловкости+Силы', cost: 3, sprite: '⚰️', type: 'attack', rarity: 'legendary', baseDamage: 10, statWeights: { AGI: 0.6, STR: 0.4 }, requiredStat: 9, scaling: 0.50, damageType: 'Physical', tags: ['Melee'], effects: [{ action: 'damage' }] },
];

// Populate PLAYER_CARDS from an array of card objects.
function populateCards(cardsArray) {
  for (const c of cardsArray) {
    const entry = {
      id: c.id,
      name: c.nameEn,
      desc: c.descEn,
      nameRu: c.nameRu,
      descRu: c.descRu,
      cost: c.cost,
      sprite: c.sprite,
      type: c.type,
      power: c.power || 0,
      heal: c.heal || 0,
      poison: c.poison || 0,
    };

    // New schema fields.
    if (c.targetMode) entry.targetMode = c.targetMode;
    if (c.effects && c.effects.length) entry.effects = JSON.parse(JSON.stringify(c.effects));
    if (c.rarity) entry.rarity = c.rarity;
    if (c.returnToHand) entry.returnToHand = true;

    // Combat System 2.0 fields
    if (c.baseDamage != null) entry.baseDamage = c.baseDamage;
    if (c.mainStat) entry.mainStat = c.mainStat;
    if (c.requiredStat != null) entry.requiredStat = c.requiredStat;
    if (c.scaling != null) entry.scaling = c.scaling;
    if (c.statWeights) entry.statWeights = JSON.parse(JSON.stringify(c.statWeights));
    if (c.damageType) entry.damageType = c.damageType;
    if (c.tags) entry.tags = [...c.tags];

    PLAYER_CARDS[c.id] = entry;
  }
}

/** Get all card IDs filtered by rarity. */
export function getCardsByRarity(rarity) {
  return Object.values(PLAYER_CARDS).filter(c => c.rarity === rarity).map(c => c.id);
}

// Initialize with fallback immediately (synchronous).
populateCards(FALLBACK_CARDS);

/**
 * Fetch cards from the server and update PLAYER_CARDS.
 * Called once during game init before anything uses PLAYER_CARDS.
 */
export async function loadRemoteCards() {
  try {
    const resp = await fetch('/api/cards', { cache: 'no-store' });
    if (!resp.ok) return; // keep fallback
    const cardsArray = await resp.json();
    if (Array.isArray(cardsArray) && cardsArray.length > 0) {
      // Clear and repopulate.
      for (const key of Object.keys(PLAYER_CARDS)) delete PLAYER_CARDS[key];
      populateCards(cardsArray);
      console.log('[CARDS] loaded', cardsArray.length, 'from server');
    }
  } catch {
    console.warn('[CARDS] fetch failed, using fallback');
  }
}

/**
 * Get card name/desc by language. Used by i18n t() for dynamic lookup.
 */
export function getCardTranslation(cardId, lang) {
  const cardsArray = lang === 'ru' ? FALLBACK_CARDS : null;
  // Check if we have remote data with EN/RU fields.
  const card = PLAYER_CARDS[cardId];
  if (!card) return null;

  // If the card has nameRu/descRu (from remote), use them.
  if (lang === 'ru' && card.nameRu !== undefined) {
    return { name: card.nameRu, desc: card.descRu };
  }
  return { name: card.name || card.nameEn, desc: card.desc || card.descEn };
}
