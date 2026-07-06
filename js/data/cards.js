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
