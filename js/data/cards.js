// Mutable object — populated from server on init, falls back to built-in defaults.
export const PLAYER_CARDS = {};

export const STARTING_DECK = ['strike', 'strike', 'strike', 'defend', 'defend', 'defend', 'bash', 'dodge'];

// Built-in fallback cards (used if server fetch fails or offline).
const FALLBACK_CARDS = [
  { id: 'strike', nameEn: 'Strike', nameRu: 'Удар', descEn: 'Deal 5 damage', descRu: 'Нанеси 5 урона', cost: 1, sprite: '⚔️', type: 'attack', power: 5 },
  { id: 'defend', nameEn: 'Defend', nameRu: 'Защита', descEn: 'Gain 4 Armor', descRu: 'Получи 4 брони', cost: 1, sprite: '🛡️', type: 'armor', power: 4 },
  { id: 'bash', nameEn: 'Bash', nameRu: 'Толчок', descEn: 'Deal 8 damage', descRu: 'Нанеси 8 урона', cost: 2, sprite: '🔨', type: 'attack', power: 8 },
  { id: 'leech', nameEn: 'Leech', nameRu: 'Вампиризм', descEn: 'Deal 3, Heal 2', descRu: 'Нанеси 3, Лечись 2', cost: 1, sprite: '🧛', type: 'attack', power: 3, heal: 2 },
  { id: 'fireball', nameEn: 'Fireball', nameRu: 'Огненный Шар', descEn: 'Deal 6 to all', descRu: '6 урона всем', cost: 2, sprite: '🔥', type: 'attack-all', power: 6 },
  { id: 'dodge', nameEn: 'Dodge', nameRu: 'Уклонение', descEn: 'Gain 2 Armor', descRu: 'Получи 2 брони', cost: 0, sprite: '💨', type: 'armor', power: 2 },
  { id: 'heavy', nameEn: 'Heavy Blow', nameRu: 'Тяжёлый Удар', descEn: 'Deal 10 damage', descRu: 'Нанеси 10 урона', cost: 2, sprite: '🪓', type: 'attack', power: 10 },
  { id: 'poison', nameEn: 'Venom', nameRu: 'Яд', descEn: 'Deal 2, Poison 2', descRu: 'Нанеси 2, Яд 2', cost: 1, sprite: '🗡️', type: 'attack', power: 2, poison: 2 },
  { id: 'channel', nameEn: 'Channel', nameRu: 'Канал', descEn: 'Gain 3 Stamina', descRu: 'Получи 3 стамины', cost: 1, sprite: '⚡', type: 'energy', power: 3 },
  { id: 'heavy_slash', nameEn: 'Heavy Slash', nameRu: 'Тяжёлый Удар', descEn: 'Deal 7 damage', descRu: 'Нанеси 7 урона', cost: 1, sprite: '⚔️', type: 'attack', power: 7 },
  { id: 'shield', nameEn: 'Shield', nameRu: 'Щит', descEn: 'Gain 6 Armor', descRu: 'Получи 6 брони', cost: 1, sprite: '🛡️', type: 'armor', power: 6 },
  { id: 'parry', nameEn: 'Parry', nameRu: 'Парирование', descEn: 'Gain 3 Armor', descRu: 'Получи 3 брони', cost: 0, sprite: '🔄', type: 'armor', power: 3 },
  { id: 'fire_bolt', nameEn: 'Fire Bolt', nameRu: 'Огненная Стрела', descEn: 'Deal 5 damage', descRu: 'Нанеси 5 урона', cost: 1, sprite: '🔥', type: 'attack', power: 5 },
  { id: 'frost', nameEn: 'Frost', nameRu: 'Мороз', descEn: 'Deal 4 damage', descRu: 'Нанеси 4 урона', cost: 1, sprite: '❄️', type: 'attack', power: 4 },
  { id: 'mana_shield', nameEn: 'Mana Shield', nameRu: 'Магический Щит', descEn: 'Gain 5 Armor', descRu: 'Получи 5 брони', cost: 1, sprite: '🔵', type: 'armor', power: 5 },
  { id: 'arcane_missile', nameEn: 'Arcane Missile', nameRu: 'Тайная Стрела', descEn: 'Deal 8 damage', descRu: 'Нанеси 8 урона', cost: 2, sprite: '✨', type: 'attack', power: 8 },
  { id: 'dagger', nameEn: 'Dagger', nameRu: 'Кинжал', descEn: 'Deal 3 damage', descRu: 'Нанеси 3 урона', cost: 0, sprite: '🗡️', type: 'attack', power: 3 },
  { id: 'backstab', nameEn: 'Backstab', nameRu: 'Удар в Спину', descEn: 'Deal 12 damage', descRu: 'Нанеси 12 урона', cost: 2, sprite: '🔪', type: 'attack', power: 12 },
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
    if (c.effects && c.effects.length) entry.effects = [...c.effects];
    if (c.rarity) entry.rarity = c.rarity;
    if (c.returnToHand) entry.returnToHand = true;

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
