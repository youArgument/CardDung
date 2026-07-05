const translations = {
  en: {
    // Menu
    'menu.title': 'PATIENT ROGUE',
    'menu.subtitle': 'Extraction Card Dungeon',
    'menu.best_floor': 'Best Floor',
    'menu.runs': 'Runs',
    'menu.escapes': 'Escapes',
    'menu.enter_hub': 'ENTER HUB',

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
  },
  ru: {
    // Menu
    'menu.title': 'PATIENT ROGUE',
    'menu.subtitle': 'Подземелье Карточной Вылазки',
    'menu.best_floor': 'Лучший Этаж',
    'menu.runs': 'Забеги',
    'menu.escapes': 'Побег',
    'menu.enter_hub': 'В ХАБ',

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
