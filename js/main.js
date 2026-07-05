import { GameState } from './engine/state.js';
import { AudioSystem } from './system/audio.js';
import { HubEngine } from './engine/hub.js';
import { HubUI } from './ui/hub.js';
import { SaveSystem } from './system/save.js';
import { HUD } from './ui/hud.js';
import { DungeonEngine } from './engine/dungeon.js';
import { GridUI } from './ui/grid.js';
import { HandUI } from './ui/hand.js';
import { CombatEngine } from './engine/combat.js';
import { DUNGEON_TEMPLATES } from './data/dungeon.js';
import { PLAYER_CARDS } from './data/cards.js';

const Game = {
  state: null,
  audio: null,
  hub: null,
  hubUI: null,
  selectedHandCard: null,
  clientVersion: null,

  init() {
    this.state = new GameState();
    this.audio = new AudioSystem();
    this.hub = new HubEngine(this.state);
    this.hubUI = new HubUI(this);

    // Load saved data
    const saved = SaveSystem.loadStats();
    if (saved) {
      this.state.player.gold = saved.gold ?? 20;
      this.state.activeDeck = saved.activeDeck ?? ['strike', 'strike', 'defend', 'defend', 'bash'];
      this.state.collection = saved.collection ?? [];
      this.state.upgrades = saved.upgrades ?? {};
      this.state.stats = {
        ...saved.stats,
        cardsDiscovered: new Set(saved.stats?.cardsDiscovered || [])
      };
    }

    this.bindEvents();
    this.hubUI.init();
    this.updateMenu();
    this.bindUpdateButton();

    document.addEventListener('click', () => this.audio.init(), { once: true });
    document.addEventListener('touchstart', () => this.audio.init(), { once: true });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').then(reg => {
        console.log('[SW] registered', reg.scope);
      }).catch(err => console.error('[SW] registration failed:', err));
    }

    // Check for updates: fetch VERSION from network and compare with cached
    this.checkForUpdate();
  },

  bindEvents() {
    // Menu
    document.getElementById('btn-to-hub').addEventListener('click', () => {
      this.audio.playSelect();
      this.showScreen('hub');
      this.hubUI.updateHub();
    });

    // Game Over → Hub
    document.querySelectorAll('#gameover-screen .btn-primary').forEach(btn => {
      btn.addEventListener('click', () => this.returnToHub());
    });

    // Escape → Hub
    document.getElementById('btn-escape-hub').addEventListener('click', () => this.returnToHub());

    // Reward
    document.getElementById('btn-reward-done').addEventListener('click', () => this.afterReward());

    // Dungeon grid
    const gridEl = document.getElementById('dungeon-grid');
    const handleGridTap = (cardEl) => {
      if (!cardEl) return;
      const row = parseInt(cardEl.dataset.row);
      const col = parseInt(cardEl.dataset.col);
      this.onDungeonCardClick(row, col);
    };
    gridEl.addEventListener('click', (e) => {
      handleGridTap(e.target.closest('.dungeon-card'));
    });
    // Direct touch handling for mobile — avoids click synthesis delays/conflicts.
    gridEl.addEventListener('touchend', (e) => {
      const cardEl = e.target.closest('.dungeon-card');
      if (!cardEl) return;
      // Prevent the synthesized click from double-firing
      e.preventDefault();
      handleGridTap(cardEl);
    });

    // Hand
    const handEl = document.getElementById('hand-container');
    handEl.dataset.wasDragging = '0';
    handEl.addEventListener('click', (e) => {
      const cardEl = e.target.closest('.hand-card');
      if (!cardEl) return;
      if (handEl.dataset.wasDragging === '1') return;
      this.onHandCardClick(cardEl.dataset.uuid);
    });

    // Prevent the click from bubbling into drag logic and causing unintended plays.
    // (Touch/click synthesis can trigger unexpected mousedown/mouseup sequences.)
    handEl.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });

    this.setupDragDrop(handEl, gridEl);

    // Card popup close on backdrop
    document.getElementById('card-popup').addEventListener('click', (e) => {
      if (e.target.id === 'card-popup') this.hubUI.hidePopup();
    });

    // Exit popup
    document.getElementById('exit-popup').addEventListener('click', (e) => {
      if (e.target.id === 'exit-popup') this.hideExitPopup();
    });
    document.getElementById('btn-exit-continue').addEventListener('click', () => this.onExitContinue());
    document.getElementById('btn-exit-hub').addEventListener('click', () => this.onExitToHub());
  },

  setupDragDrop(handEl, gridEl) {
    let dragCard = null;
    let dragClone = null;
    let didDrag = false;
    let dragTypeAllowed = false;

    const handleStart = (e) => {
      const cardEl = e.target.closest('.hand-card');
      if (!cardEl) return;
      dragCard = cardEl;
      didDrag = false;

      // Only attack cards should be played via drag & drop.
      const uuid = dragCard.dataset.uuid;
      const run = this.state.run;
      const card = run?.deck?.hand?.find(c => c.uuid === uuid);
      dragTypeAllowed = !!card && card.type === 'attack' || card.type === 'attack-all';
      const touch = e.touches ? e.touches[0] : e;

      setTimeout(() => {
        if (!dragTypeAllowed) return;
        // If user didn't move far enough, this will still create clone after 150ms.
        // We'll treat that as drag attempt.
        dragClone = cardEl.cloneNode(true);
        dragClone.style.position = 'fixed';
        dragClone.style.zIndex = '200';
        dragClone.style.width = '72px';
        dragClone.style.height = '100px';
        dragClone.style.left = `${touch.clientX - 36}px`;
        dragClone.style.top = `${touch.clientY - 50}px`;
        dragClone.style.pointerEvents = 'none';
        dragClone.style.transform = 'scale(1.1) rotate(-3deg)';
        dragClone.style.boxShadow = '0 12px 35px rgba(0,0,0,0.6)';
        document.body.appendChild(dragClone);
      }, 150);
    };

    const handleMove = (e) => {
      if (!dragClone) return;
      e.preventDefault();
      didDrag = true;
      const touch = e.touches ? e.touches[0] : e;
      dragClone.style.left = `${touch.clientX - 36}px`;
      dragClone.style.top = `${touch.clientY - 50}px`;

      // Mark so click handler won't trigger.
      // (We can't access closure var directly from here reliably across edits,
      // so we just flip a DOM flag.)
      handEl.dataset.wasDragging = '1';
    };

    const handleEnd = (e) => {
      if (!dragCard || !dragClone) { dragCard = null; return; }

      const wasDrag = didDrag;
      const touch = e.changedTouches ? e.changedTouches[0] : e;

      dragClone.style.display = 'none';
      const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      dragClone.style.display = '';

      const targetEl = elemBelow?.closest('.dungeon-card.enemy-card');
      if (targetEl && dragTypeAllowed && wasDrag) {
        const row = parseInt(targetEl.dataset.row);
        const col = parseInt(targetEl.dataset.col);
        this.playCardOnTarget(dragCard.dataset.uuid, row, col);
      }

      dragClone.remove();
      dragCard = null;
      dragClone = null;

      // Reset for click handler
      didDrag = false;
      dragTypeAllowed = false;

      handEl.dataset.wasDragging = '0';
    };

    handEl.addEventListener('mousedown', handleStart);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    handEl.addEventListener('touchstart', handleStart, { passive: true });
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
  },

  // ===== DUNGEON =====
  enterDungeon() {
    this.audio.playSelect();
    this.state.startRun();
    this.showScreen('dungeon');
    this.renderDungeon();
    this.updateRoomProgress();
    HUD.update(this.state);
  },

  leaveToHub() {
    const run = this.state.run;
    if (run) {
      // Transfer remaining hand cards to collection
      for (const card of run.deck.hand) {
        if (card.id && PLAYER_CARDS[card.id]) {
          this.state.collection.push(card.id);
        }
      }
    }
    this.state.run = null;
    this.showScreen('hub');
    this.hubUI.updateHub();
  },

  onDungeonCardClick(row, col) {
    const run = this.state.run;
    if (!run || this.state.screen !== 'dungeon') return;

    const cell = run.dungeon.grid.find(c => c.row === row && c.col === col);
    if (!cell) return;

    // State safety: UI sometimes re-renders mid-flow.
    const isDomEnemy = cell.element && cell.element.classList.contains('enemy-card');

    // Exit flow: last room → auto-victory; otherwise → popup.
    if (cell.revealed && cell.card.type === DUNGEON_TEMPLATES.exit) {
      if (this.allEnemiesDefeated() && this.state.isLastRoom()) {
        this.onVictory();
      } else {
        this.showExitPopup();
      }
      return;
    }

    // Item flow: player must click the revealed item cell to pick it up
    // and add it to hand (max 5).
    if (cell.revealed && cell.card.type === DUNGEON_TEMPLATES.item) {
      const item = cell.card;
      const added = this.state.collectItemAsCard(item);
      if (!added) {
        // Hand is full: do nothing.
        return;
      }

      // Re-render hand and the grid cell (mark as collected/defeated)
      cell.card.collected = true;
      GridUI.render(run.dungeon, this.state, document.getElementById('dungeon-grid'));
      HandUI.render(this.state, document.getElementById('hand-container'));
      HUD.update(this.state);
      return;
    }

    // Base hit: if player clicks a revealed enemy cell, apply a small default damage.
    // (This must be before the general "revealed return".)
    if (cell.revealed && (cell.card.type === DUNGEON_TEMPLATES.enemy || isDomEnemy) && !cell.card.defeated) {
      // default hit costs 1 stamina
      const baseCost = 1;
      if (run.player.stamina < baseCost) {
        // Out of stamina: treat as a "miss" — no damage shown but still count as an action tick.
        // Enemies should still react (advanceWorldTick).
        GridUI.animateHit(cell);
        GridUI.updateCell(cell);
        HUD.update(this.state);
        this.advanceWorldTick();
        return;
      }

      run.player.stamina -= baseCost;

      const base = 2 + (run.player.strength || 0);
      cell.card.hp -= base;
      if (cell.card.hp <= 0) {
        cell.card.defeated = true;
        cell.card.hp = 0;
        run.player.gold += cell.card.gold;
        run.enemiesSlain++;
      }
      GridUI.animateHit(cell);
      GridUI.showDamage(cell, base, 'damage');
      GridUI.updateCell(cell);
      HUD.update(this.state);
      this.advanceWorldTick();
      if (!this.state.isDead() && this.allEnemiesDefeated()) this.onAllEnemiesDefeated();
      return;
    }

    if (cell.revealed) return;

    // No per-action reveal limit in this mode.
    // Stamina is the only gating factor.

    this.audio.playReveal();
    this.state.revealCell(cell);

    cell.element.classList.remove('face-down', 'revealable');
    cell.element.classList.add('revealed');
    GridUI.renderRevealedCard(cell.element, cell);

    const result = DungeonEngine.onReveal(cell, this.state);

    if (result.type === 'exit') {
      // Door is now revealed; actual leaving happens on a second click.
      GridUI.render(run.dungeon, this.state, document.getElementById('dungeon-grid'));
      HUD.update(this.state);
      return;
    }

    if (result.type === 'enemy') {
      // In this flow, player reveals/kills at will; do not auto-attack after each reveal.
    }

    GridUI.render(run.dungeon, this.state, document.getElementById('dungeon-grid'));
    HUD.update(this.state);

    // Tick: after any action, enemies react.
    this.advanceWorldTick();
  },

  onHandCardClick(uuid) {
    const run = this.state.run;
    if (!run) return;

    const card = run.deck.hand.find(c => c.uuid === uuid);
    if (!card) return;

    if (this.selectedHandCard === uuid) {
      this.selectedHandCard = null;
      HandUI.selectCard(null);
      return;
    }

    this.selectedHandCard = uuid;
    HandUI.selectCard(uuid);

    if (card.type === 'attack') {
      const enemyCell = run.dungeon.grid.find(
        c => c.revealed && c.card.type === DUNGEON_TEMPLATES.enemy && !c.card.defeated
      );
      if (enemyCell) {
        this.playCardOnTarget(uuid, enemyCell.row, enemyCell.col);
      }
    } else if (card.type === 'armor' || card.type === 'energy' || card.type === 'item') {
      // Immediate-use cards: armor/energy/consumables.
      this.playCardOnTarget(uuid, null, null);
    } else {
      // Attack cards and anything else require targeting via drag/drop.
    }
  },

  playCardOnTarget(uuid, targetRow, targetCol) {
    const run = this.state.run;
    const card = run.deck.hand.find(c => c.uuid === uuid);
    if (!card) return;

    // If we can't play the card, remove selection and re-render.
    // Costs are paid in stamina.
    if (run.player.stamina < card.cost) {
      this.selectedHandCard = null;
      HandUI.selectCard(null);
      HandUI.render(this.state, document.getElementById('hand-container'));
      return;
    }

    let targetCell = null;
    if (targetRow !== null && targetCol !== null) {
      targetCell = run.dungeon.grid.find(c => c.row === targetRow && c.col === targetCol);
    }

    if ((card.type === 'attack' || card.type === 'attack-all') && (!targetCell || targetCell.card.type !== DUNGEON_TEMPLATES.enemy || targetCell.card.defeated)) {
      return;
    }

    const result = CombatEngine.playCard(card, targetCell, this.state);
    if (!result) {
      // Dungeon item cards are handled here.
      if (card.type === 'item') {
        this.useDungeonItemCard(card);
        return;
      }
      // Failed to play (e.g. not enough energy or invalid target): clear selection.
      this.selectedHandCard = null;
      HandUI.selectCard(null);
      HandUI.render(this.state, document.getElementById('hand-container'));
      return;
    }

    this.audio.playAttack();
    this.selectedHandCard = null;

    for (const effect of result.effects) {
      if (effect.type === 'damage' && effect.cell) {
        GridUI.animateHit(effect.cell);
        GridUI.showDamage(effect.cell, effect.amount, 'damage');
        GridUI.updateCell(effect.cell);
      }
      if (effect.type === 'heal') HUD.update(this.state);
      if (effect.type === 'armor') HUD.update(this.state);
      if (effect.type === 'defeat') {
        GridUI.showDamage(effect.cell, effect.gold, 'heal');
        GridUI.updateCell(effect.cell);
      }
    }

    HandUI.render(this.state, document.getElementById('hand-container'));
    HUD.update(this.state);

    // Tick: after any action, enemies react.
    this.advanceWorldTick();

    if (!this.state.isDead() && this.allEnemiesDefeated()) {
      this.onAllEnemiesDefeated();
    }
  },

  useDungeonItemCard(itemCard) {
    const run = this.state.run;
    const p = run.player;

    // Consume the item from hand
    const idx = run.deck.hand.findIndex(c => c.uuid === itemCard.uuid);
    if (idx !== -1) run.deck.hand.splice(idx, 1);
    run.deck.discardPile.push(itemCard);

    // Apply item effect
    switch (itemCard.effect) {
      case 'heal':
        p.hp = Math.min(p.hp + itemCard.value, p.maxHp);
        break;
      case 'maxArmor':
        p.maxArmor += itemCard.value;
        p.armor = Math.min(p.armor + itemCard.value, p.maxArmor);
        break;
      case 'strength':
        p.strength += itemCard.value;
        break;
      case 'gold':
        p.gold += itemCard.value;
        break;
      case 'draw':
        run.deck.draw(itemCard.value);
        break;
      case 'maxEnergy':
        // Energy mechanic disabled; convert to stamina instead.
        p.maxStamina += itemCard.value * 10;
        p.stamina = Math.min(p.stamina + itemCard.value * 10, p.maxStamina);
        break;
      case 'stamina':
        p.stamina = Math.min(p.stamina + itemCard.value, p.maxStamina);
        break;
    }

    this.audio.playAttack();
    HandUI.render(this.state, document.getElementById('hand-container'));
    HUD.update(this.state);

    // Tick: after any action, enemies react.
    this.advanceWorldTick();
  },

  onAllEnemiesDefeated() {
    const run = this.state.run;
    this.updateRoomProgress();
    GridUI.render(run.dungeon, this.state, document.getElementById('dungeon-grid'));
    HandUI.render(this.state, document.getElementById('hand-container'));
    HUD.update(this.state);
  },

  showExitPopup() {
    const run = this.state.run;
    const title = document.getElementById('exit-popup-title');
    const desc = document.getElementById('exit-popup-desc');
    const continueBtn = document.getElementById('btn-exit-continue');
    const hubBtn = document.getElementById('btn-exit-hub');

    if (this.allEnemiesDefeated()) {
      if (this.state.isLastRoom()) {
        title.textContent = 'Dungeon Cleared!';
        desc.textContent = 'All rooms cleared. What now?';
        continueBtn.textContent = 'Claim Rewards';
        hubBtn.textContent = 'To Hub';
      } else {
        title.textContent = 'Room Cleared';
        desc.textContent = `Room ${run.roomsCleared + 1}/${run.totalRooms}`;
        continueBtn.textContent = 'Next Room';
        hubBtn.textContent = 'To Hub';
      }
    } else {
      title.textContent = 'Exit Door';
      desc.textContent = 'Enemies still alive!';
      continueBtn.textContent = 'Escape';
      hubBtn.textContent = 'To Hub';
    }

    document.getElementById('exit-popup').classList.remove('hidden');
  },

  hideExitPopup() {
    document.getElementById('exit-popup').classList.add('hidden');
  },

  onExitContinue() {
    this.hideExitPopup();

    if (this.allEnemiesDefeated()) {
      const run = this.state.run;
      if (this.state.isLastRoom()) {
        // Dungeon complete — show rewards
        this.onVictory();
      } else {
        // Advance to next room
        this.state.advanceRoom();
        this.updateRoomProgress();
        GridUI.render(run.dungeon, this.state, document.getElementById('dungeon-grid'));
        HandUI.render(this.state, document.getElementById('hand-container'));
        HUD.update(this.state);
      }
    } else {
      // Enemies still alive — escape to hub
      this.onEscape();
    }
  },

  onExitToHub() {
    this.hideExitPopup();
    this.onEscape();
  },

  updateRoomProgress() {
    const run = this.state.run;
    const roomProgress = document.getElementById('room-progress');
    const roomFill = document.getElementById('room-progress-fill');
    if (roomProgress) {
      roomProgress.textContent = `Room ${run.roomsCleared + 1}/${run.totalRooms}`;
    }
    if (roomFill) {
      roomFill.style.width = `${((run.roomsCleared + 1) / run.totalRooms) * 100}%`;
    }
  },

  advanceWorldTick() {
    // After each player action, all revealed alive enemies deal damage.
    this.enemiesAttack();
  },

  enemiesAttack() {
    const run = this.state.run;
    const attacks = DungeonEngine.allEnemiesAttack(run.dungeon, run);
    if (attacks.length === 0) return;

    this.audio.playHit();

    for (const attack of attacks) {
      const result = this.state.takeDamage(attack.damage);
      GridUI.showDamage(attack.cell, result.damage, 'damage');
      GridUI.animateHit(attack.cell);
    }

    HUD.update(this.state);

    // Death check must happen after each enemy reaction tick.
    if (this.state.isDead()) setTimeout(() => this.onDefeat(), 600);
  },

  allEnemiesDefeated() {
    const run = this.state.run;
    // At least one enemy must have been revealed for the room to be "clearable"
    if (run.revealedEnemiesCount === 0) return false;
    return run.dungeon.grid.every(
      cell => !cell.revealed || cell.card.type !== DUNGEON_TEMPLATES.enemy || cell.card.defeated
    );
  },

  renderDungeon() {
    GridUI.render(this.state.run.dungeon, this.state, document.getElementById('dungeon-grid'));
    HandUI.render(this.state, document.getElementById('hand-container'));
  },

  // ===== RESULTS =====
  onVictory() {
    this.audio.playVictory();
    const run = this.state.run;

    document.getElementById('reward-title').textContent = 'CLEARED!';
    document.getElementById('reward-gold').textContent = `+${run.player.gold} Gold`;

    const rewardCards = document.getElementById('reward-cards');
    rewardCards.innerHTML = '';

    const cardPool = Object.keys(PLAYER_CARDS);
    const choices = [];
    for (let i = 0; i < 3; i++) {
      choices.push(cardPool[Math.floor(Math.random() * cardPool.length)]);
    }

    let chosen = 0;
    choices.forEach(cardId => {
      const card = PLAYER_CARDS[cardId];
      const el = document.createElement('div');
      el.className = 'reward-card';
      el.innerHTML = `
        <div class="card-sprite">${card.sprite}</div>
        <div class="card-name">${card.name}</div>
        <div class="card-desc">${card.desc}</div>
        <div style="font-size:8px;color:#888;margin-top:4px">${card.cost}⚡</div>
      `;
      el.addEventListener('click', () => {
        if (chosen >= 1) return;
        if (el.classList.contains('chosen')) {
          el.classList.remove('chosen');
          chosen--;
        } else {
          el.classList.add('chosen');
          chosen++;
        }
        document.getElementById('btn-reward-done').classList.toggle('hidden', chosen < 1);
      });
      rewardCards.appendChild(el);
    });

    document.getElementById('btn-reward-done').classList.add('hidden');
    this.showScreen('reward');
  },

  afterReward() {
    const chosen = document.querySelector('.reward-card.chosen');
    if (chosen) {
      const name = chosen.querySelector('.card-name').textContent;
      const cardId = Object.keys(PLAYER_CARDS).find(id => PLAYER_CARDS[id].name === name);
      if (cardId) {
        this.state.collection.push(cardId);
        this.state.stats.cardsDiscovered.add(cardId);
      }
    }

    // Add gold from run to hub
    this.state.player.gold += this.state.run.player.gold;
    SaveSystem.save(this.state);
    this.returnToHub();
  },

  onEscape() {
    this.audio.playVictory();
    const run = this.state.run;
    this.state.stats.totalEscapes++;
    if (run.floor > this.state.stats.bestFloor) this.state.stats.bestFloor = run.floor;
    this.state.stats.totalKills += run.enemiesSlain;

    // Gold carries back to hub
    this.state.player.gold += run.player.gold;

    // Transfer remaining hand cards to collection (they survive the run)
    for (const card of run.deck.hand) {
      if (card.id && PLAYER_CARDS[card.id]) {
        this.state.collection.push(card.id);
      }
    }

    document.getElementById('esc-floor').textContent = run.floor;
    document.getElementById('esc-gold').textContent = run.player.gold;
    document.getElementById('esc-hp').textContent = `${run.player.hp}/${run.player.maxHp}`;

    SaveSystem.save(this.state);
    this.showScreen('escape');
  },

  onDefeat() {
    this.audio.playDefeat();
    const run = this.state.run;
    if (run.floor > this.state.stats.bestFloor) this.state.stats.bestFloor = run.floor;
    this.state.stats.totalKills += run.enemiesSlain;

    // Player loses all remaining hand cards on death (no transfer to collection)
    run.deck.hand = [];

    document.getElementById('go-floor').textContent = run.floor;
    document.getElementById('go-revealed').textContent = run.cardsRevealed;
    document.getElementById('go-kills').textContent = run.enemiesSlain;

    SaveSystem.save(this.state);
    this.showScreen('gameover');
  },

  returnToHub() {
    this.state.run = null;
    this.showScreen('hub');
    this.hubUI.updateHub();
  },

  updateMenu() {
    const s = this.state.stats;
    document.getElementById('best-floor').textContent = s.bestFloor;
    document.getElementById('total-runs').textContent = s.totalRuns;
    document.getElementById('total-escapes').textContent = s.totalEscapes;

    // Load and display version
    fetch('VERSION?nocache=' + Date.now())
      .then(r => r.text())
      .then(v => {
        const el = document.getElementById('app-version');
        if (el) el.textContent = `v${v.trim()}`;
      })
      .catch(() => {});
  },

  showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(`${name}-screen`);
    if (screen) screen.classList.add('active');
    this.state.screen = name;
  },

  // ===== PWA UPDATE =====
  checkForUpdate() {
    const storedVersion = localStorage.getItem('carddung-version');

    // Fetch VERSION from network to get server version
    fetch('./VERSION?nocache=' + Date.now(), { cache: 'no-store' })
      .then(r => r.text())
      .then(serverVersion => {
        const sv = serverVersion.trim();

        if (storedVersion && sv !== storedVersion) {
          console.log('[UPDATE] available:', storedVersion, '->', sv);
          const banner = document.getElementById('update-banner');
          if (banner) banner.classList.remove('hidden');
        }

        // Store current version for next comparison
        if (!storedVersion) {
          localStorage.setItem('carddung-version', sv);
        }
      })
      .catch(() => {});
  },

  bindUpdateButton() {
    const btn = document.getElementById('btn-update-reload');
    if (btn) {
      btn.addEventListener('click', () => {
        localStorage.removeItem('carddung-version');
        // Unregister SW, clear all caches, then reload
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(regs => {
            Promise.all(regs.map(r => r.unregister()))
              .then(() => caches.keys())
              .then(keys => Promise.all(keys.map(key => caches.delete(key))))
              .then(() => window.location.reload());
          });
        } else {
          caches.keys().then(keys =>
            Promise.all(keys.map(key => caches.delete(key)))
          ).then(() => window.location.reload());
        }
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => Game.init());
