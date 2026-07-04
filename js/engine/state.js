import { Deck } from './deck.js';
import { generateDungeon, DUNGEON_TEMPLATES } from '../data/dungeon.js';

export class GameState {
  constructor() {
    this.screen = 'menu';
    this.player = { gold: 20 };
    this.activeDeck = ['strike', 'strike', 'strike', 'defend', 'defend', 'defend', 'bash', 'dodge'];
    this.collection = [];
    this.upgrades = {};
    this.stats = {
      totalRuns: 0, totalEscapes: 0, bestFloor: 0, totalKills: 0,
      cardsDiscovered: new Set(['strike', 'defend', 'bash', 'dodge'])
    };
    this.run = null;
  }

  startRun() {
    const upg = this.upgrades;
    this.run = {
      player: {
        hp: 8 + (upg.startHp || 0),
        maxHp: 8 + (upg.startHp || 0),
        armor: 4 + (upg.startArmor || 0),
        maxArmor: 4 + (upg.startArmor || 0),
        stamina: 100,
        maxStamina: 100,
        energy: 0,
        maxEnergy: 0,
        gold: 0,
        strength: 0
      },
      deck: new Deck(),
        floor: 1,
        currentRoom: 0,
        totalRooms: 1 + Math.floor(Math.random() * 3), // 1-3 rooms
        roomsCleared: 0,
      dungeon: null,
      turn: 0,
      revealedThisTurn: 0,
      maxRevealPerTurn: 2,
      enemiesSlain: 0,
      cardsRevealed: 0,
      extraDraw: upg.cardDraw || 0,
      mergeBonus: upg.mergeBonus || 0
    };

    this.run.deck.initFromTemplates([...this.activeDeck]);
    // Starting hand should reflect the deck configured in the Hub.
    // We cap it to MAX_HAND (handled by Deck.draw).
    this.run.deck.draw(5 + this.run.extraDraw);
    this.startRoom();
    this.screen = 'dungeon';
    this.stats.totalRuns++;
  }

  startRoom() {
    this.run.dungeon = generateDungeon(this.run.floor, this.run.currentRoom);
    this.run.turn = 1;
    this.run.revealedThisTurn = 0;
  }

  revealCell(cell) {
    if (cell.revealed) return;

    // Stamina cost for revealing
    this.run.player.stamina -= 5;
    if (this.run.player.stamina <= 0) {
      const overflow = Math.abs(this.run.player.stamina);
      this.run.player.stamina = 0;
      this.run.player.hp -= overflow;
    }

    cell.revealed = true;
    this.run.dungeon.revealedCount++;
    this.run.cardsRevealed++;
    this.run.revealedThisTurn++;

    // Items are picked up only when the player clicks the revealed item cell.
  }

  collectItemAsCard(item) {
    // Convert dungeon item into a hand card. We store it as a Card-like object
    // but without tying it to PLAYER_CARDS.
    if (item.collected) return false;
    const deck = this.run.deck;
    if (deck.hand.length >= 5) return false;

    deck.hand.push({
      uuid: item.uuid ?? Math.random().toString(36).slice(2, 10),
      type: 'item',
      cost: 0,
      sprite: item.sprite,
      name: item.name,
      desc: item.desc ?? '',
      // item.effect determines what it does when used
      effect: item.effect,
      value: item.value,
    });

    item.collected = true;
    return true;
  }

  startNewTurn() {
    this.run.turn++;
    this.run.revealedThisTurn = 0;
    // Energy mechanic disabled; no-op.
    this.run.player.armor = 0;
    // In tick mode, stamina is restored only via cards (e.g. food). No passive regen here.
    
    this.run.deck.discardHand();
    this.run.deck.draw(3 + this.run.extraDraw);

    if (this.upgrades.extraReveal && this.run.turn % 3 === 0) {
      this.run.maxRevealPerTurn = 3;
    } else {
      this.run.maxRevealPerTurn = 2;
    }
  }

  takeDamage(amount) {
    let blocked = Math.min(amount, this.run.player.armor);
    this.run.player.armor -= blocked;
    const actual = amount - blocked;
    this.run.player.hp -= actual;
    return { damage: actual, blocked };
  }

  isDead() {
    return this.run.player.hp <= 0;
  }

  isRoomCleared() {
    return this.run.dungeon.grid.every(
      cell => !cell.revealed || cell.card.type !== DUNGEON_TEMPLATES.enemy || cell.card.defeated
    );
  }

  advanceRoom() {
    this.run.roomsCleared++;
    if (this.run.roomsCleared >= this.run.totalRooms) {
      // All rooms cleared, generate exit
      this.addExitToRoom();
    } else {
      this.run.currentRoom++;
      this.startRoom();
    }
  }

  addExitToRoom() {
    // Find an empty revealed cell and place exit
    const emptyCells = this.run.dungeon.grid.filter(
      c => c.revealed && c.card.type === DUNGEON_TEMPLATES.empty
    );
    if (emptyCells.length > 0) {
      const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      cell.card = {
        type: DUNGEON_TEMPLATES.exit,
        template: 'exit',
        sprite: '🚪',
        name: 'Exit',
        desc: 'Escape'
      };
    }
  }
}
