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
import { PLAYER_CARDS, loadRemoteCards } from './data/cards.js';
import { ENEMY_CARDS } from './data/enemies.js';
import { CLASSES } from './data/classes.js';
import { t, setLanguage, applyTranslations, getLanguage } from './system/i18n.js';

const Game = {
  state: null,
  audio: null,
  hub: null,
  hubUI: null,
  selectedHandCard: null,
  clientVersion: null,

  async init() {
    // Load cards from server (falls back to built-in if offline).
    await loadRemoteCards();

    this.state = new GameState();
    this.audio = new AudioSystem();
    this.hub = new HubEngine(this.state);
    this.hubUI = new HubUI(this);

    // Load saved data
    const saved = SaveSystem.loadStats();
    if (saved) {
      this.state.player.gold = saved.gold ?? 20;
      this.state.selectedClassId = saved.selectedClass ?? null;
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
    this.applyLang();
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
    // Language switch
    document.getElementById('btn-lang-en').addEventListener('click', () => this.switchLang('en'));
    document.getElementById('btn-lang-ru').addEventListener('click', () => this.switchLang('ru'));

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

    // Rest popup
    document.getElementById('rest-popup').addEventListener('click', (e) => {
      if (e.target.id === 'rest-popup') this.hideRestPopup();
    });
    document.getElementById('btn-rest-yes').addEventListener('click', () => this.onRestYes());
    document.getElementById('btn-rest-no').addEventListener('click', () => this.onRestNo());

    // Generic confirmation popup
    document.getElementById('class-confirm-popup').addEventListener('click', (e) => {
      if (e.target.id === 'class-confirm-popup') this.hideConfirm();
    });
    document.getElementById('btn-confirm-yes').addEventListener('click', () => {
      if (this._confirmCallback) this._confirmCallback();
    });
    document.getElementById('btn-confirm-no').addEventListener('click', () => this.hideConfirm());
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

      // Cards that need manual targeting can be dragged.
      const uuid = dragCard.dataset.uuid;
      const run = this.state.run;
      const card = run?.deck?.hand?.find(c => c.uuid === uuid);
      if (!card) { dragTypeAllowed = false; return; }
      const tm = card.targetMode || '';
      dragTypeAllowed = tm.includes('target') || tm.includes('auto') || card.type === 'attack' || card.type === 'attack-all';
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
    const classId = this.state.selectedClassId;
    if (!classId || !CLASSES[classId]) return;
    this.audio.playSelect();
    this.state.startRun(classId);
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
      if (this.state.isLastRoom()) {
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
        CombatEngine.defeatEnemy(cell, run);
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

    const tm = card.targetMode || (card.type === 'attack-all' ? 'auto-enemy' : null) || (card.type === 'attack' ? 'auto-enemy' : null);

    if (tm === 'auto-enemy') {
      // Auto-target first alive enemy.
      const enemyCell = run.dungeon.grid.find(
        c => c.revealed && c.card.type === DUNGEON_TEMPLATES.enemy && !c.card.defeated
      );
      if (enemyCell) {
        this.playCardOnTarget(uuid, enemyCell.row, enemyCell.col);
      }
    } else if (tm === 'self' || card.type === 'item') {
      // No targeting needed: armor/energy/buffs/items.
      this.playCardOnTarget(uuid, null, null);
    } else if (tm === 'target-enemy' || tm === 'target-cell') {
      // Requires manual targeting via drag/drop — do nothing on click.
    } else {
      // Fallback: attack-like cards auto-target enemy.
      const isAttackLike = card.effects?.some(e => e.action === 'damage' || e.action === 'damage_all');
      if (isAttackLike) {
        const enemyCell = run.dungeon.grid.find(
          c => c.revealed && c.card.type === DUNGEON_TEMPLATES.enemy && !c.card.defeated
        );
        if (enemyCell) this.playCardOnTarget(uuid, enemyCell.row, enemyCell.col);
      } else {
        this.playCardOnTarget(uuid, null, null);
      }
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

    // Tome artifact: first card each turn costs 0 stamina
    let freeCost = false;
    if (run.artifact?.id === 'tome' && run.firstCardFree) {
      freeCost = true;
      run.firstCardFree = false;
    }

    const result = CombatEngine.playCard(card, targetCell, this.state, freeCost);
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
      // Exploration hints from player cards.
      if (effect.type === 'hint_enemies') this.showExplorationHints({ type: 'enemies' });
      if (effect.type === 'hint_cell') this.showExplorationHints({ type: 'cell', cell: effect.cell });
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
        p.maxStamina += itemCard.value;
        p.stamina = Math.min(p.stamina + itemCard.value, p.maxStamina);
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

  showRestPopup() {
    const run = this.state.run;
    if (!run) return;

    const title = document.getElementById('rest-popup-title');
    const desc = document.getElementById('rest-popup-desc');
    const yesBtn = document.getElementById('btn-rest-yes');
    const noBtn = document.getElementById('btn-rest-no');

    title.textContent = t('rest.title');
    desc.textContent = t('rest.desc');
    yesBtn.textContent = t('rest.yes');
    const skipGold = (run.restSkipCount + 1) * 3;
    noBtn.textContent = t('rest.no', skipGold);

    document.getElementById('rest-popup').classList.remove('hidden');
  },

  hideRestPopup() {
    document.getElementById('rest-popup').classList.add('hidden');
  },

  onRestYes() {
    this.hideRestPopup();
    // Restore full stamina, reset skip counter.
    this.state.restStamina();
    HUD.update(this.state);
    // Advance to next room or exit door.
    this.advanceAfterRest();
  },

  onRestNo() {
    this.hideRestPopup();
    // Skip rest: earn gold bonus.
    const bonus = this.state.skipRest();
    HUD.update(this.state);
    // Show a brief gold notification.
    this.showGoldNotification(bonus);
    // Advance to next room or exit door.
    setTimeout(() => this.advanceAfterRest(), 400);
  },

  advanceAfterRest() {
    const run = this.state.run;
    if (this.state.isLastRoom()) {
      this.onVictory();
    } else {
      this.state.advanceRoom();
      this.updateRoomProgress();
      GridUI.render(run.dungeon, this.state, document.getElementById('dungeon-grid'));
      HandUI.render(this.state, document.getElementById('hand-container'));
      HUD.update(this.state);
    }
  },

  showGoldNotification(amount) {
    const el = document.createElement('div');
    el.className = 'damage-number heal';
    el.textContent = `+${amount} 💰`;
    el.style.left = `${window.innerWidth / 2 - 30}px`;
    el.style.top = `${window.innerHeight / 2}px`;
    el.style.fontSize = '24px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  },

  showExitPopup() {
    const run = this.state.run;
    const title = document.getElementById('exit-popup-title');
    const desc = document.getElementById('exit-popup-desc');
    const continueBtn = document.getElementById('btn-exit-continue');
    const hubBtn = document.getElementById('btn-exit-hub');

    title.textContent = t('exit.door_title');
    desc.textContent = t('dungeon.room', run.roomsCleared + 1, run.totalRooms);
    continueBtn.textContent = t('exit.next_room');
    hubBtn.textContent = t('exit.to_hub');

    document.getElementById('exit-popup').classList.remove('hidden');
  },

  hideExitPopup() {
    document.getElementById('exit-popup').classList.add('hidden');
  },

  onExitContinue() {
    this.hideExitPopup();
    // Show rest popup before advancing.
    setTimeout(() => this.showRestPopup(), 300);
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
      roomProgress.textContent = t('dungeon.room', run.roomsCleared + 1, run.totalRooms);
    }
    if (roomFill) {
      roomFill.style.width = `${((run.roomsCleared + 1) / run.totalRooms) * 100}%`;
    }
  },

  advanceWorldTick() {
    const run = this.state.run;
    if (!run || !run.dungeon) return;

    // Process debuff ticks on all enemies (poison, nullify, etc.)
    this.processDebuffTicks();

    // Tick down room-wide effects.
    this.tickRoomEffects();

    // Each revealed alive enemy draws and plays a card.
    this.enemyAITick();

    // Tick down enemy buffs.
    this.tickEnemyBuffs();

    // Process run-level buffs (player_buff) — decrement and expire.
    this.processBuffTicks();

    // Check death after all enemy actions resolved.
    if (this.state.isDead()) setTimeout(() => this.onDefeat(), 600);
  },

  // Each enemy draws a card, then plays one randomly from hand.
  enemyAITick() {
    const run = this.state.run;
    if (!run || !run.dungeon) return;

    for (const cell of run.dungeon.grid) {
      if (!cell.revealed || cell.card.type !== DUNGEON_TEMPLATES.enemy || cell.card.defeated) continue;

      // Init enemy deck/hand on first tick.
      const card = cell.card;
      if (!card._deckInitialized) {
        const template = card.deckTemplate || ['bite'];
        card._enemyDeck = [...template].sort(() => Math.random() - 0.5); // shuffle
        card._enemyHand = [];
        card._discardPile = [];
        card.maxHp = card.hp;
        card._deckInitialized = true;
      }

      // Draw up to max hand (2).
      const maxHand = card._maxHand || 2;
      while (card._enemyHand.length < maxHand && card._enemyDeck.length > 0) {
        const drawnId = card._enemyDeck.shift();
        const templateCard = ENEMY_CARDS[drawnId];
        if (templateCard) {
          card._enemyHand.push({ ...templateCard });
        }
      }

      // Reshuffle discard into deck if both empty.
      if (card._enemyDeck.length === 0 && card._enemyHand.length === 0 && card._discardPile.length > 0) {
        card._enemyDeck = [...card._discardPile].sort(() => Math.random() - 0.5);
        card._discardPile = [];
      }

      // Check if enemy is frozen (skip card play).
      if (card._frozenTicks > 0) {
        card._frozenTicks--;
        GridUI.showDamage(cell, 0, 'block');
        GridUI.updateCell(cell);
        continue;
      }

      // Play random card from hand.
      if (card._enemyHand.length === 0) continue;
      const playIdx = Math.floor(Math.random() * card._enemyHand.length);
      const playCard = card._enemyHand.splice(playIdx, 1)[0];

      // Flash the cell to show enemy is playing a card.
      if (cell.element) {
        cell.element.classList.add('enemy-playing');
        setTimeout(() => cell.element?.classList.remove('enemy-playing'), 400);
      }
      card._discardPile.push(playCard);

      // Process each effect through CombatEngine.
      for (const effect of playCard.effects) {
        effect._sourceCell = cell;
        const results = CombatEngine.processEffect(effect, playCard, null, run.player, run, true);
        this.handleEnemyCardResults(results, cell, run);
      }

      // Re-render grid after enemy card effects.
      GridUI.render(run.dungeon, this.state, document.getElementById('dungeon-grid'));
      HUD.update(this.state);
    }
  },

  handleEnemyCardResults(results, cell, run) {
    for (const r of results) {
      if (r.type === 'damage_player') {
        const result = this.state.takeDamage(r.amount);
        GridUI.showDamage(cell, result.damage, 'damage');
        GridUI.animateHit(cell);
      } else if (r.type === 'heal_enemy' && r.cell) {
        GridUI.showDamage(r.cell, r.amount, 'heal');
        GridUI.updateCell(r.cell);
      } else if (r.type === 'enemy_armor' && r.cell) {
        GridUI.updateCell(r.cell);
      } else if (r.type === 'enemy_retreat' && r.cell) {
        // Enemy retreated: close cell back to face-down.
        const el = r.cell.element;
        if (el) {
          el.classList.remove('revealed', 'enemy-card');
          el.classList.add('face-down');
        }
        // Reset revealed but keep deck state for when re-revealed.
        r.cell.revealed = false;
      } else if (r.type === 'hint_enemies') {
        this.showExplorationHints({ type: 'enemies' });
      } else if (r.type === 'hint_cell') {
        this.showExplorationHints({ type: 'cell', cell: r.cell });
      }
    }
  },

  showExplorationHints(hint) {
    const run = this.state.run;
    if (!run || !run.dungeon) return;

    // Clear previous hints.
    for (const c of run.dungeon.grid) {
      if (c.element?.classList.contains('hint-gold')) {
        c.element.classList.remove('hint-gold');
      }
    }

    if (hint.type === 'enemies') {
      // Highlight all unrevealed enemy cells with golden border.
      for (const cell of run.dungeon.grid) {
        if (!cell.revealed && cell.card.type === DUNGEON_TEMPLATES.enemy) {
          cell.element?.classList.add('hint-gold');
        }
      }
    } else if (hint.type === 'cell') {
      hint.cell.element?.classList.add('hint-gold');
    }

    // Remove hints after 3 seconds.
    setTimeout(() => {
      for (const c of run.dungeon.grid) {
        if (c.element?.classList.contains('hint-gold')) {
          c.element.classList.remove('hint-gold');
        }
      }
    }, 3000);
  },

  tickRoomEffects() {
    const run = this.state.run;
    if (!run || !run.roomEffects) return;

    // Decrement ticks, remove expired.
    for (let i = run.roomEffects.length - 1; i >= 0; i--) {
      run.roomEffects[i].ticks--;
      if (run.roomEffects[i].ticks <= 0) run.roomEffects.splice(i, 1);
    }
  },

  tickEnemyBuffs() {
    const run = this.state.run;
    if (!run || !run.dungeon) return;

    for (const cell of run.dungeon.grid) {
      if (!cell.revealed || cell.card.type !== DUNGEON_TEMPLATES.enemy || cell.card.defeated) continue;
      const buffs = cell.card.buffs;
      if (!buffs) continue;
      for (const key of Object.keys(buffs)) {
        buffs[key].ticks--;
        if (buffs[key].ticks <= 0) delete buffs[key];
      }
    }
  },

  // Legacy: kept for compatibility, but enemyAITick handles attacks now.
  enemiesAttack() {
    const run = this.state.run;
    const attacks = DungeonEngine.allEnemiesAttack(run.dungeon, run);
    if (attacks.length === 0) return;

    const validAttacks = [];
    for (const attack of attacks) {
      const hasNullify = attack.cell.card.debuffs?.some(d => d.type === 'nullify' && d.ticks > 0);
      if (!hasNullify) {
        validAttacks.push(attack);
      }
    }

    if (validAttacks.length === 0) return;
    this.audio.playHit();

    for (const attack of validAttacks) {
      const result = this.state.takeDamage(attack.damage);
      GridUI.showDamage(attack.cell, result.damage, 'damage');
      GridUI.animateHit(attack.cell);
    }

    HUD.update(this.state);
  },

  processDebuffTicks() {
    const run = this.state.run;
    if (!run || !run.dungeon) return;
    for (const cell of run.dungeon.grid) {
      if (!cell.revealed || cell.card.type !== DUNGEON_TEMPLATES.enemy || cell.card.defeated) continue;
      if (!cell.card.debuffs?.length) continue;

      // Process each debuff.
      const remaining = [];
      for (const db of cell.card.debuffs) {
        if (db.ticks <= 0) continue;
        if (db.type === 'poison') {
          cell.card.hp -= db.amount;
          GridUI.showDamage(cell, db.amount, 'damage');
          if (cell.card.hp <= 0) {
            CombatEngine.defeatEnemy(cell, run);
            GridUI.updateCell(cell);
          }
        }
        db.ticks--;
        if (db.ticks > 0) remaining.push(db);
      }
      cell.card.debuffs = remaining;
    }
  },

  processBuffTicks() {
    const run = this.state.run;
    if (!run || !run.buffs) return;
    for (const key of Object.keys(run.buffs)) {
      run.buffs[key].ticks--;
      if (run.buffs[key].ticks <= 0) delete run.buffs[key];
    }
  },

  // Get effective player strength including active buffs.
  getPlayerStrength() {
    const run = this.state.run;
    let str = run.player.strength || 0;
    if (run.buffs?.str) str += run.buffs.str.value;
    return str;
  },

  enemiesAttack() {
    const run = this.state.run;
    const attacks = DungeonEngine.allEnemiesAttack(run.dungeon, run);
    if (attacks.length === 0) return;

    // Check for nullify debuff on each attacker.
    const validAttacks = [];
    for (const attack of attacks) {
      const hasNullify = attack.cell.card.debuffs?.some(d => d.type === 'nullify' && d.ticks > 0);
      if (!hasNullify) {
        validAttacks.push(attack);
      }
    }

    if (validAttacks.length === 0) return;
    this.audio.playHit();

    for (const attack of validAttacks) {
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

    document.getElementById('reward-title').textContent = t('reward.cleared');
    document.getElementById('reward-gold').textContent = t('reward.gold', run.player.gold);

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
      const cardName = t(`card.${cardId}.name`, card.name);
      const cardDesc = t(`card.${cardId}.desc`, card.desc);
      el.innerHTML = `
        <div class="card-sprite">${card.sprite}</div>
        <div class="card-name">${cardName}</div>
        <div class="card-desc">${cardDesc}</div>
        <div style="font-size:8px;color:#888;margin-top:4px">${card.cost}⚡</div>
      `;
      el.dataset.cardId = cardId;
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
      const cardId = chosen.dataset.cardId;
      if (cardId && PLAYER_CARDS[cardId]) {
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
    this.renderMenuDynamic();

    // Load and display version
    fetch('VERSION?nocache=' + Date.now())
      .then(r => r.text())
      .then(v => {
        const el = document.getElementById('app-version');
        if (el) el.textContent = `v${v.trim()}`;
      })
      .catch(() => {});
  },

  renderMenuDynamic() {
    const container = document.getElementById('menu-dynamic');
    const hasClass = this.state.selectedClassId && CLASSES[this.state.selectedClassId];

    if (hasClass) {
      this.renderReturningView(container);
    } else {
      this.renderFirstTimeView(container);
    }
  },

  renderReturningView(container) {
    const s = this.state.stats;
    const cls = CLASSES[this.state.selectedClassId];
    const className = t(cls.nameKey);

    container.innerHTML = `
      <div class="menu-returning-view">
        <div class="menu-stats">
          <div class="stat-row"><span class="stat-label">${t('menu.best_floor')}</span><span class="stat-val">${s.bestFloor}</span></div>
          <div class="stat-row"><span class="stat-label">${t('menu.runs')}</span><span class="stat-val">${s.totalRuns}</span></div>
          <div class="stat-row"><span class="stat-label">${t('menu.escapes')}</span><span class="stat-val">${s.totalEscapes}</span></div>
        </div>
        <div class="current-class-display">
          <span class="class-icon">${cls.sprite}</span>
          <span>${className}</span>
        </div>
        <button id="btn-continue" class="btn-continue">${t('menu.continue')}</button>
        <button id="btn-new-game" class="btn-new-game">${t('menu.new_game')}</button>
      </div>
    `;

    document.getElementById('btn-continue').addEventListener('click', () => {
      this.audio.playSelect();
      this.showScreen('hub');
      this.hubUI.updateHub();
    });

    document.getElementById('btn-new-game').addEventListener('click', () => {
      this.showConfirm(
        t('confirm.new_game_title'),
        t('confirm.new_game_desc'),
        () => this.onNewGameConfirm()
      );
    });
  },

  renderFirstTimeView(container) {
    container.innerHTML = `
      <div class="menu-class-picker-title">${t('class.picker.title')}</div>
      <div class="menu-class-grid-compact" id="menu-class-grid-compact"></div>
    `;

    const grid = document.getElementById('menu-class-grid-compact');

    for (const [id, cls] of Object.entries(CLASSES)) {
      const el = document.createElement('div');
      el.className = 'menu-class-card-compact';
      const name = t(cls.nameKey);
      el.innerHTML = `
        <div class="menu-class-card-compact-icon">${cls.sprite}</div>
        <div class="menu-class-card-compact-name">${name}</div>
      `;
      el.addEventListener('click', () => this.showClassDetail(id));
      grid.appendChild(el);
    }
  },

  // Generate a random starting deck for Beggar: 4 cards, at least 1 attack.
  generateBeggarDeck() {
    const attackIds = Object.keys(PLAYER_CARDS).filter(id => PLAYER_CARDS[id].type === 'attack');
    const armorIds = Object.keys(PLAYER_CARDS).filter(id => PLAYER_CARDS[id].type === 'armor');
    const deck = [];
    // Guarantee at least 1 attack card.
    deck.push(attackIds[Math.floor(Math.random() * attackIds.length)]);
    // Fill remaining 3 from attack + armor pool.
    const allBasic = [...attackIds, ...armorIds];
    for (let i = 0; i < 3; i++) {
      deck.push(allBasic[Math.floor(Math.random() * allBasic.length)]);
    }
    return deck.sort(() => Math.random() - 0.5);
  },

  showClassDetail(classId) {
    const cls = CLASSES[classId];
    if (!cls) return;
    const container = document.getElementById('menu-dynamic');
    const name = t(cls.nameKey);
    const desc = t(cls.descKey);
    const s = cls.stats;

    // For Beggar, generate a random preview deck.
    const displayDeck = classId === 'beggar' ? this.generateBeggarDeck() : cls.startingDeck;

    const statsHtml = `<div class="class-detail-stats-row">
      <span class="detail-stat">STR ${s.strength}</span>
      <span class="detail-stat">AGI ${s.agility}</span>
      <span class="detail-stat">INT ${s.intelligence}</span>
      <span class="detail-stat">WIL ${s.will}</span>
      <span class="detail-stat">VIT ${s.vitality}</span>
    </div>`;

    const deckHtml = displayDeck.length > 0
      ? `<div class="detail-deck-cards">
          ${displayDeck.map(cardId => {
            const card = PLAYER_CARDS[cardId];
            if (!card) return '';
            const cardName = t(`card.${cardId}.name`, card.name);
            const cardDesc = t(`card.${cardId}.desc`, card.desc);
            return `<div class="detail-card">
              <div class="detail-card-top">
                <span class="detail-card-sprite">${card.sprite}</span>
                <span class="detail-card-name">${cardName}</span>
                <span class="detail-card-cost">${card.cost}⚡</span>
              </div>
              <div class="detail-card-desc">${cardDesc}</div>
            </div>`;
          }).join('')}
        </div>`
      : '<div style="color:#666;font-size:10px">—</div>';

    let artifactHtml = '';
    if (cls.artifact) {
      const artName = t(cls.artifact.nameKey);
      const artDesc = t(cls.artifact.descKey);
      artifactHtml = `<div class="detail-artifact">
        <span class="detail-artifact-icon">${cls.artifact.sprite}</span>
        <div class="detail-artifact-info">
          <div class="detail-artifact-name">${artName}</div>
          <div class="detail-artifact-desc">${artDesc}</div>
        </div>
      </div>`;
    } else {
      artifactHtml = '<div style="color:#555;font-size:10px">—</div>';
    }

    container.innerHTML = `
      <div class="class-detail-view">
        <div class="class-detail-header">
          <div class="class-detail-sprite">${cls.sprite}</div>
          <div class="class-detail-name">${name}</div>
          <div class="class-detail-desc">${desc}</div>
        </div>
        <div class="class-detail-section">
          <div class="detail-section-title">Stats</div>
          ${statsHtml}
        </div>
        <div class="class-detail-section">
          <div class="detail-section-title">${t('class.picker.deck', displayDeck.length)}</div>
          ${deckHtml}
        </div>
        <div class="class-detail-section">
          <div class="detail-section-title">${'Artifact'}</div>
          ${artifactHtml}
        </div>
        <div class="btn-confirm-wrap">
          <button id="btn-class-confirm" class="btn-continue">${t('class.picker.confirm')}</button>
          <button id="btn-class-back" class="btn-new-game">${t('class.picker.back')}</button>
        </div>
      </div>
    `;

    document.getElementById('btn-class-confirm').addEventListener('click', () => this.confirmClass(classId));
    document.getElementById('btn-class-back').addEventListener('click', () => this.renderFirstTimeView(container));
  },

  confirmClass(classId) {
    this.state.selectedClassId = classId;
    // For Beggar, generate random deck (min 1 attack). Otherwise use class starting deck.
    if (classId === 'beggar') {
      this.state.activeDeck = this.generateBeggarDeck();
    } else {
      this.state.activeDeck = [...CLASSES[classId].startingDeck];
    }
    this.state.player.gold = 20;
    this.state.collection = [];
    this.state.upgrades = {};
    this.state.stats = {
      totalRuns: 0, totalEscapes: 0, bestFloor: 0, totalKills: 0,
      cardsDiscovered: new Set(Object.keys(PLAYER_CARDS))
    };
    SaveSystem.save(this.state);
    this.audio.playSelect();
    this.showScreen('hub');
    this.hubUI.updateHub();
  },

  onNewGameConfirm() {
    localStorage.clear();
    location.reload();
  },

  hasProgress() {
    const s = this.state.stats;
    return s.totalRuns > 0 || s.totalEscapes > 0 || s.bestFloor > 0 || this.state.collection.length > 0;
  },

  showConfirm(title, desc, callback) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-desc').textContent = desc;
    this._confirmCallback = callback;
    document.getElementById('class-confirm-popup').classList.remove('hidden');
  },

  hideConfirm() {
    document.getElementById('class-confirm-popup').classList.add('hidden');
    this._confirmCallback = null;
  },

  showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(`${name}-screen`);
    if (screen) screen.classList.add('active');
    this.state.screen = name;
  },

  switchLang(lang) {
    setLanguage(lang);
    this.applyLang();
    if (this.state.screen === 'hub') this.hubUI.reRenderAll();
  },

  applyLang() {
    const lang = getLanguage();
    document.getElementById('btn-lang-en').classList.toggle('active', lang === 'en');
    document.getElementById('btn-lang-ru').classList.toggle('active', lang === 'ru');
    applyTranslations();
    this.updateMenu();
    if (this.state.run) {
      GridUI.render(this.state.run.dungeon, this.state, document.getElementById('dungeon-grid'));
      HandUI.render(this.state, document.getElementById('hand-container'));
      HUD.update(this.state);
      this.updateRoomProgress();
    }
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
