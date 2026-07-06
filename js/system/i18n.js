import { PLAYER_CARDS } from '../data/cards.js';

const translations = {
  en: {
    // Menu
    'menu.title': 'Dungeon\nElden\nSouls',
    'menu.subtitle': 'Card-Based Dungeon Crawler',
    'menu.best_floor': 'Best Floor',
    'menu.runs': 'Runs',
    'menu.escapes': 'Escapes',
    'menu.enter_hub': 'ENTER HUB',
    'menu.continue': 'CONTINUE',
    'menu.new_game': 'Start New Game',

    // Hub
    'hub.market': 'Black Market',
    'hub.market_desc': 'Buy cards for your deck',
    'hub.deck': 'Deck',
    'hub.deck_desc': 'Manage your collection',
    'hub.safehouse': 'Safehouse',
    'hub.safehouse_desc': 'Permanent upgrades',
    'hub.descent': 'The Descent',
    'hub.descent_desc': 'Enter the dungeon',
    'hub.back': '◀ Back',
    'hub.deck_count': '{0} / 5 cards',

    // Market
    'market.buy': 'BUY',
    'market.not_enough': 'Not enough gold!',
    'market.purchased': 'Purchased!',

    // Deck
    'deck.active': 'Active Deck',
    'deck.collection': 'Collection',
    'deck.merge': 'MERGE',
    'deck.remove': 'REMOVE',
    'deck.add': 'ADD TO DECK',
    'deck.close': 'CLOSE',
    'deck.power': 'Power: {0}',

    // Safehouse
    'safehouse.upgrade': 'UPGRADE',
    'safehouse.maxed': 'MAXED',

    // Dungeon HUD
    'dungeon.room': 'Room {0}/{1}',
    'dungeon.hub': 'HUB',

    // Exit popup
    'exit.cleared_title': 'Dungeon Cleared!',
    'exit.cleared_desc': 'All rooms cleared. What now?',
    'exit.claim_rewards': 'Claim Rewards',
    'exit.to_hub': 'To Hub',
    'exit.room_cleared': 'Room Cleared',
    'exit.next_room': 'Next Room',
    'exit.door_title': 'Exit Door',
    'exit.enemies_alive': 'Enemies still alive!',
    'exit.escape': 'Escape',

    // Reward screen
    'reward.cleared': 'CLEARED!',
    'reward.gold': '+{0} Gold',
    'reward.continue': 'CONTINUE',

    // Escape screen
    'escape.title': 'ESCAPED!',
    'escape.floor': 'Floor',
    'escape.gold': 'Gold',
    'escape.hp': 'HP',
    'escape.back_hub': 'BACK TO HUB',

    // Game over screen
    'gameover.title': 'DEFEATED',
    'gameover.revealed': 'Cards Revealed',
    'gameover.kills': 'Enemies Slain',
    'gameover.back_hub': 'BACK TO HUB',

    // Update banner
    'update.available': '🔄 Update available!',
    'update.button': 'Update',

    // Cards
    'card.strike.name': 'Strike',
    'card.strike.desc': 'Deal 5 damage',
    'card.defend.name': 'Defend',
    'card.defend.desc': 'Gain 4 Armor',
    'card.bash.name': 'Bash',
    'card.bash.desc': 'Deal 8 damage',
    'card.leech.name': 'Leech',
    'card.leech.desc': 'Deal 3, Heal 2',
    'card.fireball.name': 'Fireball',
    'card.fireball.desc': 'Deal 6 to all',
    'card.dodge.name': 'Dodge',
    'card.dodge.desc': 'Gain 2 Armor',
    'card.heavy.name': 'Heavy Blow',
    'card.heavy.desc': 'Deal 10 damage',
    'card.poison.name': 'Venom',
    'card.poison.desc': 'Deal 2, Poison 2',
    'card.channel.name': 'Channel',
    'card.channel.desc': 'Gain 3 Stamina',
    'card.heavy_slash.name': 'Heavy Slash',
    'card.heavy_slash.desc': 'Deal 7 damage',
    'card.shield.name': 'Shield',
    'card.shield.desc': 'Gain 6 Armor',
    'card.parry.name': 'Parry',
    'card.parry.desc': 'Gain 3 Armor',
    'card.fire_bolt.name': 'Fire Bolt',
    'card.fire_bolt.desc': 'Deal 5 damage',
    'card.frost.name': 'Frost',
    'card.frost.desc': 'Deal 4 damage',
    'card.mana_shield.name': 'Mana Shield',
    'card.mana_shield.desc': 'Gain 5 Armor',
    'card.arcane_missile.name': 'Arcane Missile',
    'card.arcane_missile.desc': 'Deal 8 damage',
    'card.dagger.name': 'Dagger',
    'card.dagger.desc': 'Deal 3 damage',
    'card.backstab.name': 'Backstab',
    'card.backstab.desc': 'Deal 12 damage',

    // Enemies
    'enemy.rat.name': 'Rat',
    'enemy.skeleton.name': 'Skeleton',
    'enemy.ghost.name': 'Ghost',
    'enemy.slime.name': 'Slime',
    'enemy.wolf.name': 'Wolf',
    'enemy.orc.name': 'Orc',
    'enemy.demon.name': 'Demon',
    'enemy.dragon.name': 'Dragon',
     'enemy.lich.name': 'Lich',
     'enemy.hand_title': 'Enemy Hand',


    // Items
    'item.health_potion.name': 'Potion',
    'item.health_potion.desc': 'Heal 3 HP',
    'item.armor_upgrade.name': 'Armor+',
    'item.armor_upgrade.desc': '+2 Max Armor',
    'item.strength_up.name': 'Strength',
    'item.strength_up.desc': '+1 Attack',
    'item.gold_pile.name': 'Gold',
    'item.gold_pile.desc': '+5 Gold',
    'item.card_draw.name': 'Tome',
    'item.card_draw.desc': 'Draw 2 cards',
    'item.energy_up.name': 'Crystal',
    'item.energy_up.desc': '+10 Max Stamina',

    // Exit card
    'exit_card.name': 'Exit',
    'exit_card.desc': 'Escape the dungeon',

    // Classes
    'class.warrior.name': 'Warrior',
    'class.warrior.desc': 'Heavy armor, raw strength',
    'class.mage.name': 'Mage',
    'class.mage.desc': 'Deadly spells, frail body',
    'class.rogue.name': 'Rogue',
    'class.rogue.desc': 'Swift strikes, poison blades',
    'class.beggar.name': 'Beggar',
    'class.beggar.desc': 'Nothing. Pure suffering.',

    // Artifacts
    'artifact.iron_belt.name': 'Iron Belt',
    'artifact.iron_belt.desc': '+2 Armor at start of each room',
    'artifact.tome.name': 'Tome',
    'artifact.tome.desc': 'First card each turn costs 0 stamina',
    'artifact.rogue_cloak.name': 'Rogue\'s Cloak',
    'artifact.rogue_cloak.desc': 'Draw 1 card when you defeat an enemy',

    // Class picker
    'class.picker.title': 'Choose Your Class',
    'class.picker.stats': 'STR {0}  AGI {1}  INT {2}  WIL {3}  VIT {4}',
    'class.picker.artifact': 'Artefact: {0}',
    'class.picker.deck': 'Deck: {0} cards',
    'class.picker.confirm': 'CHOOSE',
    'class.picker.back': '← Back',

    // Confirmation
    'confirm.new_game_title': 'Start New Game?',
    'confirm.new_game_desc': 'All progress will be lost forever!',
    'confirm.change_class_title': 'Change Class?',
    'confirm.change_class_desc': 'All progress will be reset!',

    // Rest popup
    'rest.title': 'Room Cleared',
    'rest.desc': 'Rest to restore all stamina, or push forward for gold.',
    'rest.yes': 'REST (Full Stamina)',
    'rest.no': "Skip (+{0} Gold)",
  },
  ru: {
    // Menu
    'menu.title': 'Dungeon\nElden\nSouls',
    'menu.subtitle': 'Карточный Подземельный Краулер',
    'menu.best_floor': 'Лучший Этаж',
    'menu.runs': 'Забеги',
    'menu.escapes': 'Побег',
    'menu.enter_hub': 'В ХАБ',
    'menu.continue': 'ПРОДОЛЖИТЬ',
    'menu.new_game': 'Начать новую игру',

    // Hub
    'hub.market': 'Чёрный Рынок',
    'hub.market_desc': 'Покупай карты для колоды',
    'hub.deck': 'Колода',
    'hub.deck_desc': 'Управляй коллекцией',
    'hub.safehouse': 'Безопасный Дом',
    'hub.safehouse_desc': 'Постоянные улучшения',
    'hub.descent': 'Спуск',
    'hub.descent_desc': 'Войти в подземелье',
    'hub.back': '◀ Назад',
    'hub.deck_count': '{0} / 5 карт',

    // Market
    'market.buy': 'КУПИТЬ',
    'market.not_enough': 'Не хватает золота!',
    'market.purchased': 'Куплено!',

    // Deck
    'deck.active': 'Активная Колода',
    'deck.collection': 'Коллекция',
    'deck.merge': 'СЛИТЬ',
    'deck.remove': 'УДАЛИТЬ',
    'deck.add': 'В КОЛОДУ',
    'deck.close': 'ЗАКРЫТЬ',
    'deck.power': 'Сила: {0}',

    // Safehouse
    'safehouse.upgrade': 'УЛУЧШИТЬ',
    'safehouse.maxed': 'МАКС',

    // Dungeon HUD
    'dungeon.room': 'Комната {0}/{1}',
    'dungeon.hub': 'ХАБ',

    // Exit popup
    'exit.cleared_title': 'Подземелье Очищено!',
    'exit.cleared_desc': 'Все комнаты пройдены. Что дальше?',
    'exit.claim_rewards': 'Забрать Награду',
    'exit.to_hub': 'В Хаб',
    'exit.room_cleared': 'Комната Очищена',
    'exit.next_room': 'Следующая Комната',
    'exit.door_title': 'Дверь Выхода',
    'exit.enemies_alive': 'Враги ещё живы!',
    'exit.escape': 'Сбежать',

    // Reward screen
    'reward.cleared': 'ПРОШЕНО!',
    'reward.gold': '+{0} Золота',
    'reward.continue': 'ДАЛЕЕ',

    // Escape screen
    'escape.title': 'ПОБЕГ!',
    'escape.floor': 'Этаж',
    'escape.gold': 'Золото',
    'escape.hp': 'HP',
    'escape.back_hub': 'В ХАБ',

    // Game over screen
    'gameover.title': 'ПОРАЖЕНИЕ',
    'gameover.revealed': 'Карт Раскрыто',
    'gameover.kills': 'Убито Врагов',
    'gameover.back_hub': 'В ХАБ',

    // Update banner
    'update.available': '🔄 Обновление доступно!',
    'update.button': 'Обновить',

    // Cards
    'card.strike.name': 'Удар',
    'card.strike.desc': 'Нанеси 5 урона',
    'card.defend.name': 'Защита',
    'card.defend.desc': 'Получи 4 брони',
    'card.bash.name': 'Толчок',
    'card.bash.desc': 'Нанеси 8 урона',
    'card.leech.name': 'Вампиризм',
    'card.leech.desc': 'Нанеси 3, Лечись 2',
    'card.fireball.name': 'Огненный Шар',
    'card.fireball.desc': '6 урона всем',
    'card.dodge.name': 'Уклонение',
    'card.dodge.desc': 'Получи 2 брони',
    'card.heavy.name': 'Тяжёлый Удар',
    'card.heavy.desc': 'Нанеси 10 урона',
    'card.poison.name': 'Яд',
    'card.poison.desc': 'Нанеси 2, Яд 2',
    'card.channel.name': 'Канал',
    'card.channel.desc': 'Получи 3 стамины',
    'card.heavy_slash.name': 'Тяжёлый Удар',
    'card.heavy_slash.desc': 'Нанеси 7 урона',
    'card.shield.name': 'Щит',
    'card.shield.desc': 'Получи 6 брони',
    'card.parry.name': 'Парирование',
    'card.parry.desc': 'Получи 3 брони',
    'card.fire_bolt.name': 'Огненная Стрела',
    'card.fire_bolt.desc': 'Нанеси 5 урона',
    'card.frost.name': 'Мороз',
    'card.frost.desc': 'Нанеси 4 урона',
    'card.mana_shield.name': 'Магический Щит',
    'card.mana_shield.desc': 'Получи 5 брони',
    'card.arcane_missile.name': 'Тайная Стрела',
    'card.arcane_missile.desc': 'Нанеси 8 урона',
    'card.dagger.name': 'Кинжал',
    'card.dagger.desc': 'Нанеси 3 урона',
    'card.backstab.name': 'Удар в Спину',
    'card.backstab.desc': 'Нанеси 12 урона',

    // Enemies
    'enemy.rat.name': 'Крыса',
    'enemy.skeleton.name': 'Скелет',
    'enemy.ghost.name': 'Призрак',
    'enemy.slime.name': 'Слизень',
    'enemy.wolf.name': 'Волк',
    'enemy.orc.name': 'Орк',
    'enemy.demon.name': 'Демон',
    'enemy.dragon.name': 'Дракон',
     'enemy.lich.name': 'Лич',
     'enemy.hand_title': 'Карты врага',

    // Items
    'item.health_potion.name': 'Зелье',
    'item.health_potion.desc': 'Лечит 3 HP',
    'item.armor_upgrade.name': 'Броня+',
    'item.armor_upgrade.desc': '+2 макс брони',
    'item.strength_up.name': 'Сила',
    'item.strength_up.desc': '+1 к атаке',
    'item.gold_pile.name': 'Золото',
    'item.gold_pile.desc': '+5 золота',
    'item.card_draw.name': 'Том',
    'item.card_draw.desc': 'Взяни 2 карты',
    'item.energy_up.name': 'Кристалл',
    'item.energy_up.desc': '+10 макс стамины',

    // Exit card
    'exit_card.name': 'Выход',
    'exit_card.desc': 'Сбежать из подземелья',

    // Classes
    'class.warrior.name': 'Воин',
    'class.warrior.desc': 'Тяжёлая броня, грубая сила',
    'class.mage.name': 'Маг',
    'class.mage.desc': 'Смертельные заклинания, хрупкое тело',
    'class.rogue.name': 'Разбойник',
    'class.rogue.desc': 'Быстрые удары, отравленные клинки',
    'class.beggar.name': 'Нищий',
    'class.beggar.desc': 'Ничего. Чистое страдание.',

    // Artifacts
    'artifact.iron_belt.name': 'Железный Пояс',
    'artifact.iron_belt.desc': '+2 брони в начале каждой комнаты',
    'artifact.tome.name': 'Том',
    'artifact.tome.desc': 'Первая карта в ход стоит 0 стамины',
    'artifact.rogue_cloak.name': 'Плащ Разбойника',
    'artifact.rogue_cloak.desc': 'Возьми 1 карту при убийстве врага',

    // Class picker
    'class.picker.title': 'Выбери Класс',
    'class.picker.stats': 'СИЛ {0}  ЛВК {1}  ИНТ {2}  ВОЛ {3}  ЖИВ {4}',
    'class.picker.artifact': 'Артефакт: {0}',
    'class.picker.deck': 'Колода: {0} карт',
    'class.picker.confirm': 'ВЫБРАТЬ',
    'class.picker.back': '← Назад',

    // Confirmation
    'confirm.new_game_title': 'Новая игра?',
    'confirm.new_game_desc': 'Весь прогресс будет потерян навсегда!',
    'confirm.change_class_title': 'Сменить класс?',
    'confirm.change_class_desc': 'Весь прогресс будет сброшен!',

    // Rest popup
    'rest.title': 'Комната Очищена',
    'rest.desc': 'Отдохни и восстановь стамину или продолжай вперёд за золото.',
    'rest.yes': 'ОТДЫХ (Полная стамина)',
    'rest.no': 'Продолжить (+{0} золота)',
  }
};

let currentLang = localStorage.getItem('carddung-lang') || 'en';

export function setLanguage(lang) {
  if (translations[lang]) {
    currentLang = lang;
    localStorage.setItem('carddung-lang', lang);
  }
}

export function getLanguage() {
  return currentLang;
}

export function t(key, ...args) {
  // Dynamic card lookup from PLAYER_CARDS (remote data).
  const cardMatch = key.match(/^card\.([^.]+)\.(name|desc)$/);
  if (cardMatch) {
    const [, cardId, field] = cardMatch;
    const card = PLAYER_CARDS[cardId];
    if (card) {
      let val;
      if (currentLang === 'ru') {
        // Check if remote card has RU fields.
        const ruName = key.endsWith('name') ? card.nameRu : card.descRu;
        val = ruName || (field === 'name' ? card.name : card.desc);
      } else {
        val = field === 'name' ? card.name : card.desc;
      }
      if (val) return val;
    }
  }

  let str = translations[currentLang][key] || translations.en[key] || key;
  for (let i = 0; i < args.length; i++) {
    str = str.replace(`{${i}}`, String(args[i]));
  }
  return str;
}

export function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
}
