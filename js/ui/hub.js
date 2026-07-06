import { PLAYER_CARDS } from '../data/cards.js';
import { CLASSES } from '../data/classes.js';
import { UPGRADES, getUpgradeCost } from '../data/upgrades.js';
import { t } from '../system/i18n.js';

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

  reRenderAll() {
    this.updateHub();
    // Re-render any open panel
    document.querySelectorAll('.hub-panel:not(.hidden)').forEach(panel => {
      const panelName = panel.id.replace('panel-', '');
      switch (panelName) {
        case 'market': this.renderMarket(); break;
        case 'deck': this.renderDeck(); break;
        case 'safehouse': this.renderSafehouse(); break;
      }
    });
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
      const name = t(`card.${card.id}.name`, card.name);
      const desc = t(`card.${card.id}.desc`, card.desc);
      el.innerHTML = `
        <div class="market-sprite">${card.sprite}</div>
        <div class="market-info">
          <div class="market-name">${name}</div>
          <div class="market-desc">${desc}</div>
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
    document.getElementById('deck-count-label').textContent = t('hub.deck_count', activeCount);

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
      const cardName = t(`card.${baseId}.name`, card.name);
      el.innerHTML = `
        ${card.sprite}
        <div class="card-name-small">${cardName}${cardId.endsWith('+') ? ' ★' : ''}</div>
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
      const cardName = t(`card.${cardId}.name`, card.name);
      el.innerHTML = `
        ${card.sprite}
        <div class="card-name-small">${cardName}</div>
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

    // Get current class base stats
    const classId = this.game.state.selectedClassId || 'warrior';
    const classData = CLASSES[classId] || CLASSES.warrior;

    // Stat upgrade IDs and their corresponding stat keys
    const statUpgrades = [
      { id: 'statStr', key: 'strength' },
      { id: 'statAgi', key: 'agility' },
      { id: 'statInt', key: 'intelligence' },
      { id: 'statWill', key: 'will' },
    ];

    // Render stats section
    const statsSection = document.createElement('div');
    statsSection.className = 'stats-section';
    const statsTitle = document.createElement('div');
    statsTitle.className = 'section-title';
    statsTitle.textContent = t('safehouse.stats_title');
    statsSection.appendChild(statsTitle);

    for (const su of statUpgrades) {
      const baseVal = classData.stats[su.key] || 0;
      const bonusLevel = hub.getUpgradeLevel(su.id);
      const totalVal = baseVal + bonusLevel;
      const upgrade = UPGRADES[su.id];
      const maxed = bonusLevel >= upgrade.maxLevel;
      const cost = getUpgradeCost(su.id, bonusLevel);

      const statRow = document.createElement('div');
      statRow.className = `stat-row ${maxed ? 'maxed' : ''}`;
      statRow.innerHTML = `
        <div class="stat-icon">${upgrade.icon}</div>
        <div class="stat-info">
          <div class="stat-name">${t(`stat.${su.key}.name`)}</div>
          <div class="stat-value">${baseVal} + ${bonusLevel} = <strong>${totalVal}</strong></div>
        </div>
        ${maxed ? `<div class="stat-maxed">${t('safehouse.maxed')}</div>` : `<button class="btn-stat-upgrade" data-id="${su.id}" ${gold < cost ? 'disabled' : ''}>◆ ${cost}</button>`}
      `;

      if (!maxed) {
        const btn = statRow.querySelector('.btn-stat-upgrade');
        btn.addEventListener('click', () => {
          if (hub.buyUpgrade(su.id)) {
            this.game.audio.playSelect();
            this.renderSafehouse();
            this.updateHub();
          }
        });
      }

      statsSection.appendChild(statRow);
    }
    container.appendChild(statsSection);

    // Render regular upgrades (non-stat)
    for (const [id, upgrade] of Object.entries(UPGRADES)) {
      if (upgrade.statType) continue; // Skip stat upgrades — already rendered above

      const level = hub.getUpgradeLevel(id);
      const maxed = level >= upgrade.maxLevel;
      const cost = getUpgradeCost(id, level);

      const el = document.createElement('div');
      el.className = `upgrade-item ${maxed ? 'maxed' : ''}`;
      const name = t(upgrade.nameKey, upgrade.name);
      const desc = t(upgrade.descKey, upgrade.desc);
      el.innerHTML = `
        <div class="upgrade-icon">${upgrade.icon}</div>
        <div class="upgrade-info">
          <div class="upgrade-name">${name}</div>
          <div class="upgrade-desc">${desc}</div>
          <div class="upgrade-level">${maxed ? t('safehouse.maxed') : `Lv ${level}/${upgrade.maxLevel}`}</div>
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
    document.getElementById('popup-name').textContent = t(`card.${cardId}.name`, card.name);
    document.getElementById('popup-desc').textContent = t(`card.${cardId}.desc`, card.desc);
    document.getElementById('popup-stats').textContent = `${t('deck.power', card.power)}`;

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
        mergeBtn.textContent = t('deck.merge');
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
      removeBtn.textContent = t('deck.remove');
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
      addBtn.textContent = t('deck.add');
      addBtn.disabled = this.game.state.activeDeck.length >= 5;
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
    closeBtn.textContent = t('deck.close');
    closeBtn.addEventListener('click', () => this.hidePopup());
    actions.appendChild(closeBtn);

    popup.classList.remove('hidden');
  }

  hidePopup() {
    document.getElementById('card-popup').classList.add('hidden');
  }
}
