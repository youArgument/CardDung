import { PLAYER_CARDS } from '../data/cards.js';
import { UPGRADES, getUpgradeCost } from '../data/upgrades.js';

export class HubUI {
  constructor(game) {
    this.game = game;
    this.marketInventory = [];
    this.longPressTimer = null;
  }

  init() {
    // Hub card clicks
    document.querySelectorAll('.hub-card').forEach(card => {
      card.addEventListener('click', () => {
        this.game.audio.playSelect();
        const panel = card.dataset.panel;
        if (panel === 'dungeon') {
          this.game.enterDungeon();
        } else {
          this.openPanel(panel);
        }
      });
    });

    // Hub back button
    document.getElementById('btn-hub-menu').addEventListener('click', () => {
      this.game.audio.playSelect();
      this.game.showScreen('menu');
    });

    // Panel back buttons
    document.querySelectorAll('.btn-panel-back').forEach(btn => {
      btn.addEventListener('click', () => this.closeAllPanels());
    });

    // Hub leave button (from dungeon)
    document.getElementById('btn-hub-leave').addEventListener('click', () => {
      this.game.leaveToHub();
    });
  }

  updateHub() {
    document.getElementById('hub-gold').textContent = this.game.state.player.gold;
  }

  openPanel(panelName) {
    // Close all panels first
    this.closeAllPanels();

    const panel = document.getElementById(`panel-${panelName}`);
    if (!panel) return;

    panel.classList.remove('hidden');

    switch (panelName) {
      case 'market': this.renderMarket(); break;
      case 'deck': this.renderDeck(); break;
      case 'safehouse': this.renderSafehouse(); break;
    }
  }

  closeAllPanels() {
    document.querySelectorAll('.hub-panel').forEach(p => p.classList.add('hidden'));
  }

  // ===== MARKET =====
  renderMarket() {
    const hub = this.game.hub;
    this.marketInventory = hub.getMarketInventory();
    const gold = this.game.state.player.gold;

    document.getElementById('panel-gold').textContent = gold;

    const container = document.getElementById('market-list');
    container.innerHTML = '';

    for (const card of this.marketInventory) {
      const el = document.createElement('div');
      el.className = `market-item ${card.cost > gold ? 'cant-afford' : ''}`;
      el.innerHTML = `
        <div class="market-sprite">${card.sprite}</div>
        <div class="market-info">
          <div class="market-name">${card.name}</div>
          <div class="market-desc">${card.desc}</div>
        </div>
        <div class="market-cost">◆ ${card.cost}</div>
      `;
      el.addEventListener('click', () => {
        if (hub.buyCard(card.id)) {
          this.game.audio.playSelect();
          this.renderMarket();
          this.updateHub();
        }
      });
      container.appendChild(el);
    }
  }

  // ===== DECK =====
  renderDeck() {
    const state = this.game.state;
    const activeCount = state.activeDeck.length;
    document.getElementById('deck-count').textContent = activeCount;

    // Active deck
    const activeGrid = document.getElementById('deck-active');
    activeGrid.innerHTML = '';

    // Count duplicates
    const deckCounts = {};
    for (const id of state.activeDeck) {
      const baseId = id.replace('+', '');
      deckCounts[baseId] = (deckCounts[baseId] || 0) + 1;
    }

    state.activeDeck.forEach((cardId, index) => {
      const baseId = cardId.replace('+', '');
      const card = PLAYER_CARDS[baseId];
      if (!card) return;

      const el = document.createElement('div');
      el.className = 'deck-card in-deck';
      el.innerHTML = `
        ${card.sprite}
        <div class="card-name-small">${card.name}${cardId.endsWith('+') ? ' ★' : ''}</div>
        ${deckCounts[baseId] > 1 ? `<div class="card-count">${deckCounts[baseId]}</div>` : ''}
      `;

      // Long press for popup
      this.setupLongPress(el, () => this.showCardPopup(baseId, 'deck', index));

      // Click to remove
      el.addEventListener('click', (e) => {
        if (!el.dataset.longPressed) {
          this.game.hub.removeFromDeck(index);
          this.game.audio.playSelect();
          this.renderDeck();
        }
      });

      activeGrid.appendChild(el);
    });

    // Collection
    const collGrid = document.getElementById('deck-collection');
    collGrid.innerHTML = '';

    const collCounts = {};
    for (const id of state.collection) {
      collCounts[id] = (collCounts[id] || 0) + 1;
    }

    const uniqueColl = [...new Set(state.collection)];
    uniqueColl.forEach(cardId => {
      const card = PLAYER_CARDS[cardId];
      if (!card) return;

      const el = document.createElement('div');
      el.className = 'deck-card can-add';
      el.innerHTML = `
        ${card.sprite}
        <div class="card-name-small">${card.name}</div>
        ${collCounts[cardId] > 1 ? `<div class="card-count">${collCounts[cardId]}</div>` : ''}
      `;

      this.setupLongPress(el, () => this.showCardPopup(cardId, 'collection'));

      el.addEventListener('click', (e) => {
        if (!el.dataset.longPressed) {
          if (this.game.hub.addToDeck(cardId)) {
            this.game.audio.playSelect();
            this.renderDeck();
          }
        }
      });

      collGrid.appendChild(el);
    });
  }

  // ===== SAFEHOUSE =====
  renderSafehouse() {
    const hub = this.game.hub;
    const gold = this.game.state.player.gold;
    document.getElementById('panel-gold-safe').textContent = gold;

    const container = document.getElementById('upgrade-list');
    container.innerHTML = '';

    for (const [id, upgrade] of Object.entries(UPGRADES)) {
      const level = hub.getUpgradeLevel(id);
      const maxed = level >= upgrade.maxLevel;
      const cost = getUpgradeCost(id, level);

      const el = document.createElement('div');
      el.className = `upgrade-item ${maxed ? 'maxed' : ''}`;
      el.innerHTML = `
        <div class="upgrade-icon">${upgrade.icon}</div>
        <div class="upgrade-info">
          <div class="upgrade-name">${upgrade.name}</div>
          <div class="upgrade-desc">${upgrade.desc}</div>
          <div class="upgrade-level">${maxed ? 'MAX' : `Lv ${level}/${upgrade.maxLevel}`}</div>
        </div>
        ${maxed ? '' : `<div class="upgrade-cost">◆ ${cost}</div>`}
      `;

      if (!maxed) {
        el.addEventListener('click', () => {
          if (hub.buyUpgrade(id)) {
            this.game.audio.playSelect();
            this.renderSafehouse();
            this.updateHub();
          }
        });
      }

      container.appendChild(el);
    }
  }

  // ===== LONG PRESS & POPUP =====
  setupLongPress(el, onLongPress) {
    const startHandler = (e) => {
      this.longPressTimer = setTimeout(() => {
        el.dataset.longPressed = 'true';
        onLongPress();
      }, 500);
    };

    const endHandler = () => {
      clearTimeout(this.longPressTimer);
      setTimeout(() => { delete el.dataset.longPressed; }, 100);
    };

    el.addEventListener('touchstart', startHandler, { passive: true });
    el.addEventListener('touchend', endHandler);
    el.addEventListener('touchmove', endHandler);
    el.addEventListener('mousedown', startHandler);
    el.addEventListener('mouseup', endHandler);
    el.addEventListener('mouseleave', endHandler);
  }

  showCardPopup(cardId, source, deckIndex) {
    const card = PLAYER_CARDS[cardId];
    if (!card) return;

    const popup = document.getElementById('card-popup');
    document.getElementById('popup-sprite').textContent = card.sprite;
    document.getElementById('popup-name').textContent = card.name;
    document.getElementById('popup-desc').textContent = card.desc;
    document.getElementById('popup-stats').textContent = `Cost: ${card.cost}⚡ | Power: ${card.power}`;

    const actions = document.getElementById('popup-actions');
    actions.innerHTML = '';

    if (source === 'deck') {
      // Check if can merge with another identical card
      const state = this.game.state;
      const baseId = cardId;
      const otherIndex = state.activeDeck.findIndex((id, i) => i !== deckIndex && id.replace('+', '') === baseId);

      if (otherIndex !== -1) {
        const mergeBtn = document.createElement('button');
        mergeBtn.className = 'popup-btn merge';
        mergeBtn.textContent = 'MERGE';
        mergeBtn.addEventListener('click', () => {
          if (this.game.hub.mergeCards(deckIndex, otherIndex)) {
            this.game.audio.playSelect();
            this.hidePopup();
            this.renderDeck();
          }
        });
        actions.appendChild(mergeBtn);
      }

      const removeBtn = document.createElement('button');
      removeBtn.className = 'popup-btn remove';
      removeBtn.textContent = 'REMOVE';
      removeBtn.addEventListener('click', () => {
        this.game.hub.removeFromDeck(deckIndex);
        this.game.audio.playSelect();
        this.hidePopup();
        this.renderDeck();
      });
      actions.appendChild(removeBtn);
    } else if (source === 'collection') {
      const addBtn = document.createElement('button');
      addBtn.className = 'popup-btn add';
      addBtn.textContent = 'ADD TO DECK';
      addBtn.disabled = this.game.state.activeDeck.length >= 12;
      addBtn.addEventListener('click', () => {
        if (this.game.hub.addToDeck(cardId)) {
          this.game.audio.playSelect();
          this.hidePopup();
          this.renderDeck();
        }
      });
      actions.appendChild(addBtn);
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'popup-btn close';
    closeBtn.textContent = 'CLOSE';
    closeBtn.addEventListener('click', () => this.hidePopup());
    actions.appendChild(closeBtn);

    popup.classList.remove('hidden');
  }

  hidePopup() {
    document.getElementById('card-popup').classList.add('hidden');
  }
}
