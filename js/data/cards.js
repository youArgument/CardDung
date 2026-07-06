// Mutable object — populated from server on init, falls back to built-in defaults.
export const PLAYER_CARDS = {};

export const STARTING_DECK = ['strike', 'strike', 'strike', 'defend', 'defend', 'defend', 'bash', 'dodge'];

// Built-in fallback cards (used if server fetch fails or offline).
// Combat System 2.0 — 40 cards with baseDamage, mainStat/statWeights, requiredStat, scaling, damageType, tags.
const FALLBACK_CARDS = [
  {"id":"strike","nameEn":"Strike","nameRu":"Удар","descEn":"Basic physical attack based on STR","descRu":"Базовый физический удар от Силы","cost":1,"sprite":"⚔️","type":"attack","targetMode":"auto-enemy","rarity":"common","baseDamage":3,"mainStat":"STR","requiredStat":4,"scaling":0.35,"damageType":"Physical","tags":["Melee"],"effects":[{"action":"damage"}]},
  {"id":"defend","nameEn":"Defend","nameRu":"Защита","descEn":"Basic armor from VIT","descRu":"Базовая броня от Выносливости","cost":1,"sprite":"🛡️","type":"armor","targetMode":"self","rarity":"common","baseDamage":3,"mainStat":"VIT","requiredStat":4,"scaling":0.3,"damageType":"Armor","tags":["Defense"],"effects":[{"action":"armor"}]},
  {"id":"dodge","nameEn":"Dodge","nameRu":"Уклонение","descEn":"Quick evasion based on AGI","descRu":"Быстрое уклонение от Ловкости","cost":0,"sprite":"💨","type":"armor","targetMode":"self","rarity":"common","baseDamage":2,"mainStat":"AGI","requiredStat":3,"scaling":0.25,"damageType":"Armor","tags":["Evasion"],"effects":[{"action":"armor"}]},
  {"id":"dagger","nameEn":"Dagger","nameRu":"Кинжал","descEn":"Quick AGI strike","descRu":"Быстрый удар Ловкостью","cost":0,"sprite":"🗡️","type":"attack","targetMode":"auto-enemy","rarity":"common","baseDamage":2,"mainStat":"AGI","requiredStat":3,"scaling":0.3,"damageType":"Physical","tags":["Melee"],"effects":[{"action":"damage"}]},
  {"id":"fire_bolt","nameEn":"Fire Bolt","nameRu":"Огненная Стрела","descEn":"Basic INT fire spell","descRu":"Базовое огненное заклинание от Интеллекта","cost":1,"sprite":"🔥","type":"attack","targetMode":"auto-enemy","rarity":"common","baseDamage":4,"mainStat":"INT","requiredStat":4,"scaling":0.3,"damageType":"Magic","tags":["Fire"],"effects":[{"action":"damage"}]},
  {"id":"mana_shield","nameEn":"Mana Shield","nameRu":"Магический Щит","descEn":"INT-based magical barrier","descRu":"Магический барьер от Интеллекта","cost":1,"sprite":"🔵","type":"armor","targetMode":"self","rarity":"common","baseDamage":3,"mainStat":"INT","requiredStat":5,"scaling":0.3,"damageType":"Armor","tags":["Defense"],"effects":[{"action":"armor"}]},
  {"id":"channel","nameEn":"Channel","nameRu":"Канал","descEn":"Restore stamina from WIL","descRu":"Восстанови стамину от Воли","cost":1,"sprite":"⚡","type":"energy","targetMode":"self","rarity":"common","baseDamage":3,"mainStat":"WIL","requiredStat":4,"scaling":0.25,"damageType":"Utility","tags":["Stamina"],"effects":[{"action":"stamina"}]},
  {"id":"evasion_stance","nameEn":"Evasion Stance","nameRu":"Поза Уклонения","descEn":"AGI stance for armor and dodge chance","descRu":"Поза Ловкости для брони и уклонений","cost":1,"sprite":"🏃","type":"armor","targetMode":"self","rarity":"common","baseDamage":3,"mainStat":"AGI","requiredStat":5,"scaling":0.35,"damageType":"Armor","tags":["Evasion"],"effects":[{"action":"armor"}]},
  {"id":"heavy_slash","nameEn":"Heavy Slash","nameRu":"Тяжёлый Удар","descEn":"Powerful physical slash from STR","descRu":"Мощный физический удар от Силы","cost":1,"sprite":"⚔️","type":"attack","targetMode":"auto-enemy","rarity":"rare","baseDamage":5,"mainStat":"STR","requiredStat":6,"scaling":0.35,"damageType":"Physical","tags":["Melee"],"effects":[{"action":"damage"}]},
  {"id":"bash","nameEn":"Bash","nameRu":"Толчок","descEn":"Heavy STR strike that pushes through armor","descRu":"Мощный удар Силой через броню","cost":2,"sprite":"🔨","type":"attack","targetMode":"auto-enemy","rarity":"rare","baseDamage":7,"mainStat":"STR","requiredStat":8,"scaling":0.4,"damageType":"Physical","tags":["Melee"],"effects":[{"action":"damage"}]},
  {"id":"power_cleave","nameEn":"Power Cleave","nameRu":"Мощное Рассечение","descEn":"STR cleave through enemy defenses","descRu":"Рассечение Силой через защиту врага","cost":2,"sprite":"⚔️","type":"attack","targetMode":"auto-enemy","rarity":"rare","baseDamage":8,"mainStat":"STR","requiredStat":7,"scaling":0.4,"damageType":"Physical","tags":["Melee"],"effects":[{"action":"damage"}]},
  {"id":"blood_thirst","nameEn":"Blood Thirst","nameRu":"Кровавая Жажда","descEn":"STR+WIL berserker rage attack","descRu":"Берсерк-атака Силы+Воли","cost":2,"sprite":"🩸","type":"attack","targetMode":"auto-enemy","rarity":"rare","baseDamage":7,"statWeights":{"STR":0.8,"WIL":0.2},"requiredStat":8,"scaling":0.45,"damageType":"Physical","tags":["Melee"],"effects":[{"action":"damage"}]},
  {"id":"shield","nameEn":"Shield","nameRu":"Щит","descEn":"Heavy armor from VIT+STR","descRu":"Тяжёлая броня от Выносливости+Силы","cost":1,"sprite":"🛡️","type":"armor","targetMode":"self","rarity":"rare","baseDamage":4,"statWeights":{"VIT":0.8,"STR":0.2},"requiredStat":6,"scaling":0.35,"damageType":"Armor","tags":["Defense"],"effects":[{"action":"armor"}]},
  {"id":"parry","nameEn":"Parry","nameRu":"Парирование","descEn":"Quick AGI armor response","descRu":"Быстрая броня от Ловкости","cost":0,"sprite":"🔄","type":"armor","targetMode":"self","rarity":"rare","baseDamage":2,"mainStat":"AGI","requiredStat":4,"scaling":0.3,"damageType":"Armor","tags":["Defense"],"effects":[{"action":"armor"}]},
  {"id":"earth_wall","nameEn":"Earth Wall","nameRu":"Земляная Стена","descEn":"Massive VIT armor barrier","descRu":"Массивный барьер Выносливости","cost":1,"sprite":"🌍","type":"armor","targetMode":"self","rarity":"rare","baseDamage":5,"mainStat":"VIT","requiredStat":6,"scaling":0.4,"damageType":"Armor","tags":["Defense"],"effects":[{"action":"armor"}]},
  {"id":"arcane_missile","nameEn":"Arcane Missile","nameRu":"Тайная Стрела","descEn":"Powerful INT magic projectile","descRu":"Мощное магическое снаряжение от Интеллекта","cost":2,"sprite":"✨","type":"attack","targetMode":"auto-enemy","rarity":"rare","baseDamage":6,"mainStat":"INT","requiredStat":8,"scaling":0.4,"damageType":"Magic","tags":["Arcane"],"effects":[{"action":"damage"}]},
  {"id":"fireball","nameEn":"Fireball","nameRu":"Огненный Шар","descEn":"INT AOE fire devastation","descRu":"Магический урон всем врагам огнём от Интеллекта","cost":2,"sprite":"🔥","type":"attack-all","targetMode":"auto-enemy","rarity":"rare","baseDamage":5,"mainStat":"INT","requiredStat":8,"scaling":0.35,"damageType":"Magic","tags":["Fire","AOE"],"effects":[{"action":"damage_all"}]},
  {"id":"arcane_blast","nameEn":"Arcane Blast","nameRu":"Таинственный Взрыв","descEn":"INT magic explosion","descRu":"Взрыв магии от Интеллекта","cost":2,"sprite":"💥","type":"attack","targetMode":"auto-enemy","rarity":"rare","baseDamage":7,"mainStat":"INT","requiredStat":7,"scaling":0.4,"damageType":"Magic","tags":["Arcane"],"effects":[{"action":"damage"}]},
  {"id":"frost","nameEn":"Frost","nameRu":"Мороз","descEn":"INT+WIL freezing spell","descRu":"Замораживающее заклинание от Интеллекта+Воли","cost":1,"sprite":"❄️","type":"attack","targetMode":"auto-enemy","rarity":"rare","baseDamage":3,"statWeights":{"INT":0.8,"WIL":0.2},"requiredStat":4,"scaling":0.3,"damageType":"Magic","tags":["Ice"],"effects":[{"action":"damage"}]},
  {"id":"thunder_bolt","nameEn":"Thunder Bolt","nameRu":"Громовая Молния","descEn":"INT+WIL lightning strike","descRu":"Удар молнией от Интеллекта+Воли","cost":2,"sprite":"⚡","type":"attack","targetMode":"auto-enemy","rarity":"rare","baseDamage":5,"statWeights":{"INT":0.7,"WIL":0.3},"requiredStat":6,"scaling":0.35,"damageType":"Magic","tags":["Lightning"],"effects":[{"action":"damage"}]},
  {"id":"ice_lance","nameEn":"Ice Lance","nameRu":"Ледяное Копьё","descEn":"INT+WIL piercing ice attack","descRu":"Пронзающая атака льдом от Интеллекта+Воли","cost":2,"sprite":"🧊","type":"attack","targetMode":"auto-enemy","rarity":"rare","baseDamage":6,"statWeights":{"INT":0.8,"WIL":0.2},"requiredStat":7,"scaling":0.35,"damageType":"Magic","tags":["Ice"],"effects":[{"action":"damage"}]},
  {"id":"backstab","nameEn":"Backstab","nameRu":"Удар в Спину","descEn":"Devastating AGI backstab strike","descRu":"Разрушающий удар Ловкостью в спину","cost":2,"sprite":"🔪","type":"attack","targetMode":"auto-enemy","rarity":"rare","baseDamage":10,"mainStat":"AGI","requiredStat":8,"scaling":0.5,"damageType":"Physical","tags":["Melee","Backstab"],"effects":[{"action":"damage"}]},
  {"id":"shadow_strike","nameEn":"Shadow Strike","nameRu":"Теневой Удар","descEn":"AGI+INT precision strike from shadows","descRu":"Удар Ловкостью с точностью Интеллекта из теней","cost":1,"sprite":"🌑","type":"attack","targetMode":"auto-enemy","rarity":"rare","baseDamage":5,"statWeights":{"AGI":0.7,"INT":0.3},"requiredStat":6,"scaling":0.4,"damageType":"Physical","tags":["Melee"],"effects":[{"action":"damage"}]},
  {"id":"swift_slash","nameEn":"Swift Slash","nameRu":"Быстрый Удар","descEn":"AGI+STR rapid assault","descRu":"Быстрая атака Ловкостью+Силой","cost":2,"sprite":"💨","type":"attack","targetMode":"auto-enemy","rarity":"rare","baseDamage":6,"statWeights":{"AGI":0.7,"STR":0.3},"requiredStat":7,"scaling":0.45,"damageType":"Physical","tags":["Melee"],"effects":[{"action":"damage"}]},
  {"id":"holy_light","nameEn":"Holy Light","nameRu":"Святой Свет","descEn":"WIL+INT healing light","descRu":"Лечение светом от Воли+Интеллекта","cost":2,"sprite":"✨","type":"heal","targetMode":"self","rarity":"rare","baseDamage":4,"statWeights":{"WIL":0.8,"INT":0.2},"requiredStat":6,"scaling":0.35,"damageType":"Heal","tags":["Holy"],"effects":[{"action":"heal"}]},
  {"id":"soul_reaper","nameEn":"Soul Reaper","nameRu":"Жнец Душ","descEn":"WIL drain — damage and heal","descRu":"Высасывание Воли — урон и лечение","cost":2,"sprite":"👻","type":"attack","targetMode":"auto-enemy","rarity":"rare","baseDamage":4,"mainStat":"WIL","requiredStat":6,"scaling":0.35,"damageType":"Magic","tags":["LifeSteal"],"effects":[{"action":"damage"},{"action":"heal","amount":2}]},
  {"id":"divine_shield","nameEn":"Divine Shield","nameRu":"Божественный Щит","descEn":"WIL+VIT holy armor barrier","descRu":"Святая броня от Воли+Выносливости","cost":2,"sprite":"🛡️","type":"armor","targetMode":"self","rarity":"rare","baseDamage":4,"statWeights":{"WIL":0.7,"VIT":0.3},"requiredStat":6,"scaling":0.35,"damageType":"Armor","tags":["Defense","Holy"],"effects":[{"action":"armor"}]},
  {"id":"dark_ritual","nameEn":"Dark Ritual","nameRu":"Тёмный Ритуал","descEn":"WIL+INT dark magic damage","descRu":"Тёмное заклинание Воли+Интеллекта","cost":2,"sprite":"🌙","type":"attack","targetMode":"auto-enemy","rarity":"rare","baseDamage":6,"statWeights":{"WIL":0.5,"INT":0.5},"requiredStat":7,"scaling":0.4,"damageType":"Magic","tags":["Dark"],"effects":[{"action":"damage"}]},
  {"id":"poison","nameEn":"Venom","nameRu":"Яд","descEn":"INT poison strike with DoT","descRu":"Отравляющий удар от Интеллекта с ядом","cost":1,"sprite":"🗡️","type":"attack","targetMode":"auto-enemy","rarity":"rare","baseDamage":2,"mainStat":"INT","requiredStat":4,"scaling":0.3,"damageType":"Magic","tags":["Poison"],"effects":[{"action":"damage"},{"action":"apply_debuff","debuffType":"poison","ticks":3}]},
  {"id":"war_cry","nameEn":"War Cry","nameRu":"Боевой Клич","descEn":"WIL+STR buff to empower strikes for 3 turns","descRu":"Бафф Воли+Силы для усиления ударов на 3 хода","cost":1,"sprite":"📯","type":"buff","targetMode":"self","rarity":"rare","baseDamage":0,"statWeights":{"WIL":0.7,"STR":0.3},"requiredStat":5,"scaling":0.3,"damageType":"Buff","tags":["Buff"],"effects":[{"action":"player_buff","str":2,"ticks":3}]},
  {"id":"heavy","nameEn":"Heavy Blow","nameRu":"Тяжёлый Удар","descEn":"Massive STR overhead strike — devastating at mastery","descRu":"Огромный удар Силой сверху — разрушительный при мастерстве","cost":2,"sprite":"🪓","type":"attack","targetMode":"auto-enemy","rarity":"legendary","baseDamage":9,"mainStat":"STR","requiredStat":10,"scaling":0.45,"damageType":"Physical","tags":["Melee"],"effects":[{"action":"damage"}]},
  {"id":"whirlwind_axe","nameEn":"Whirlwind Axe","nameRu":"Вихрь Топора","descEn":"STR AOE physical strike to all enemies","descRu":"Физический удар по всем врагам от Силы","cost":3,"sprite":"🌀","type":"attack-all","targetMode":"auto-enemy","rarity":"legendary","baseDamage":5,"mainStat":"STR","requiredStat":10,"scaling":0.45,"damageType":"Physical","tags":["Melee","AOE"],"effects":[{"action":"damage_all"}]},
  {"id":"fire_meteor","nameEn":"Fire Meteor","nameRu":"Огненный Метеорит","descEn":"INT AOE fire devastation — ultimate spell","descRu":"Разрушение по всем огнём от Интеллекта — ультимативное заклинание","cost":3,"sprite":"☄️","type":"attack-all","targetMode":"auto-enemy","rarity":"legendary","baseDamage":8,"mainStat":"INT","requiredStat":12,"scaling":0.5,"damageType":"Magic","tags":["Fire","AOE"],"effects":[{"action":"damage_all"}]},
  {"id":"assassin_strike","nameEn":"Assassin Strike","nameRu":"Удар Убийцы","descEn":"Massive AGI execution — highest single-target damage","descRu":"Мощный удар Ловкостью-исполнением — максимальный урон по одному","cost":3,"sprite":"💀","type":"attack","targetMode":"auto-enemy","rarity":"legendary","baseDamage":12,"mainStat":"AGI","requiredStat":10,"scaling":0.55,"damageType":"Physical","tags":["Melee","Backstab"],"effects":[{"action":"damage"}]},
  {"id":"execute_strike","nameEn":"Execute Strike","nameRu":"Казнь Ударом","descEn":"AGI+STR finishing blow — devastating executioner strike","descRu":"Финальный удар Ловкости+Силы — разрушительная казнь","cost":3,"sprite":"⚰️","type":"attack","targetMode":"auto-enemy","rarity":"legendary","baseDamage":10,"statWeights":{"AGI":0.6,"STR":0.4},"requiredStat":9,"scaling":0.5,"damageType":"Physical","tags":["Melee"],"effects":[{"action":"damage"}]},
  {"id":"ice_blast","nameEn":"Ice Blast","nameRu":"Ледяной Взрыв","descEn":"INT+WIL freeze AOE — devastates all enemies with ice","descRu":"Заморозка всех от Интеллекта+Воли — ледяное разрушение","cost":2,"sprite":"❄️","type":"attack-all","targetMode":"auto-enemy","rarity":"legendary","baseDamage":4,"statWeights":{"INT":0.7,"WIL":0.3},"requiredStat":6,"scaling":0.35,"damageType":"Magic","tags":["Ice","AOE"],"effects":[{"action":"damage_all"}]},
  {"id":"leech","nameEn":"Leech","nameRu":"Вампиризм","descEn":"WIL life drain — deal damage and heal","descRu":"Высасывание жизни от Воли — урон и лечение","cost":1,"sprite":"🧛","type":"attack","targetMode":"auto-enemy","rarity":"legendary","baseDamage":2,"mainStat":"WIL","requiredStat":4,"scaling":0.3,"damageType":"Magic","tags":["LifeSteal"],"effects":[{"action":"damage"},{"action":"heal","amount":1}]},
  {"id":"scout","nameEn":"Scout","nameRu":"Разведка","descEn":"Reveal hidden enemies on the map","descRu":"Покажи скрытых врагов на карте","cost":1,"sprite":"👁️","type":"utility","targetMode":"self","rarity":"common","baseDamage":0,"requiredStat":0,"scaling":0,"damageType":"Utility","tags":["Explore"],"effects":[{"action":"reveal_enemies"}]},
  {"id":"safe_scout","nameEn":"Safe Scout","nameRu":"Безопасная Разведка","descEn":"Reveal all safe cells (non-enemy)","descRu":"Покажи все безопасные клетки","cost":1,"sprite":"🗺️","type":"utility","targetMode":"self","rarity":"common","baseDamage":0,"requiredStat":0,"scaling":0,"damageType":"Utility","tags":["Explore"],"effects":[{"action":"reveal_all_safe"}]},
  {"id":"item_finder","nameEn":"Item Finder","nameRu":"Находчик Предметов","descEn":"Reveal a hidden item cell","descRu":"Покажи скрытую клетку с предметом","cost":1,"sprite":"🔍","type":"utility","targetMode":"self","rarity":"common","baseDamage":0,"requiredStat":0,"scaling":0,"damageType":"Utility","tags":["Explore"],"effects":[{"action":"reveal_item"}]},
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
