import { Deck } from './deck.js';
import { generateDungeon, DUNGEON_TEMPLATES } from '../data/dungeon.js';
import { CLASSES } from '../data/classes.js';
import { PLAYER_CARDS } from '../data/cards.js';

export class GameState {
  constructor() {
    this.screen = 'menu';
    this.player = { gold: 20 };
    this.activeDeck = ['strike', 'strike', 'defend', 'defend', 'bash'];
    this.collection = [];
    this.upgrades = {};
    this.stats = {
      totalRuns: 0, totalEscapes: 0, bestFloor: 0, totalKills: 0,
      cardsDiscovered: new Set(['strike', 'defend', 'bash', 'dodge', 'heavy_slash', 'shield', 'parry', 'fire_bolt', 'frost', 'mana_shield', 'arcane_missile', 'dagger', 'backstab'])
    };
    this.run = null;
    this.selectedClassId = null;
  }

  startRun(classId) {
    const classData = CLASSES[classId] || CLASSES.warrior;
    this.selectedClassId = classId;
    const upg = this.upgrades;
    this.run = {
      player: {
        hp: classData.stats.vitality + (upg.startHp || 0),
        maxHp: classData.stats.vitality + (upg.startHp || 0),
        armor: 4 + (upg.startArmor || 0),
        maxArmor: 4 + (upg.startArmor || 0),
        stamina: 100 + (upg.startStamina || 0) * 10,
        maxStamina: 100 + (upg.startStamina || 0) * 10,
        gold: 0,
        strength: Math.floor(classData.stats.strength / 2),
        classStats: { ...classData.stats }
      },
      deck: new Deck(),
      floor: 1,
      currentRoom: 0,
      totalRooms: 1 + Math.floor(Math.random() * 5),
      roomsCleared: 0,
      revealedEnemiesCount: 0,
      dungeon: null,
      enemiesSlain: 0,
      cardsRevealed: 0,
      extraDraw: upg.cardDraw || 0,
      mergeBonus: upg.mergeBonus || 0,
      artifact: classData.artifact ? { ...classData.artifact } : null,
      firstCardFree: false
    };

    // If class has no starting deck (e.g. Beggar), generate 3 random basic cards.
    let deckCards = [...classData.startingDeck];
    if (deckCards.length === 0) {
      const playableIds = Object.keys(PLAYER_CARDS).filter(id => {
        const c = PLAYER_CARDS[id];
        return c.type === 'attack' || c.type === 'armor';
      });
      for (let i = 0; i < 3; i++) {
        deckCards.push(playableIds[Math.floor(Math.random() * playableIds.length)]);
      }
    }
    this.run.deck.initFromTemplates(deckCards);
    this.run.deck.draw(5 + this.run.extraDraw);
    this.startRoom();
    this.screen = 'dungeon';
    this.stats.totalRuns++;
  }

  startRoom() {
    this.run.dungeon = generateDungeon(this.run.floor, this.run.currentRoom);
    this.run.firstCardFree = true;
    // Iron Belt artifact: +2 armor at start of each room
    if (this.run.artifact?.id === 'iron_belt') {
      this.run.player.armor = Math.min(this.run.player.armor + 2, this.run.player.maxArmor);
    }
  }

  revealCell(cell) {
    if (cell.revealed) return;

    // Stamina cost for revealing — clamp at 0, no HP drain.
    this.run.player.stamina = Math.max(0, this.run.player.stamina - 5);

    cell.revealed = true;
    this.run.dungeon.revealedCount++;
    this.run.cardsRevealed++;

    if (cell.card.type === DUNGEON_TEMPLATES.enemy) {
      this.run.revealedEnemiesCount++;
    }

    // Items are picked up only when the player clicks the revealed item cell.
  }

  collectItemAsCard(item) {
    // Convert dungeon item into a hand card. We store it as a Card-like object
    // but without tying it to PLAYER_CARDS.
    if (item.collected) return false;
    const deck = this.run.deck;
    if (deck.hand.length >= Deck.MAX_HAND) return false;

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

  isLastRoom() {
    return this.run.roomsCleared + 1 >= this.run.totalRooms;
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
