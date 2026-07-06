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

  startRun(classId, meta) {
    const classData = CLASSES[classId] || CLASSES.warrior;
    this.selectedClassId = classId;
    const upg = this.upgrades;
    // Stat bonuses from safehouse upgrades
    const bonusStr = (upg.statStr || 0);
    const bonusAgi = (upg.statAgi || 0);
    const bonusInt = (upg.statInt || 0);
    const bonusWill = (upg.statWill || 0);
    // Total stats = class base + upgrade bonuses
    const totalStr = classData.stats.strength + bonusStr;
    const totalAgi = classData.stats.agility + bonusAgi;
    const totalInt = classData.stats.intelligence + bonusInt;
    const totalWill = classData.stats.will + bonusWill;

    // Dungeon type from world map meta (or default)
    const dungeonType = (meta && meta.type) || 'dungeon';
    const isBossRun = dungeonType === 'boss';
    const totalRooms = isBossRun ? 1 : 1 + Math.floor(Math.random() * 5);

    this.run = {
      player: {
        hp: classData.stats.vitality + (upg.startHp || 0),
        maxHp: classData.stats.vitality + (upg.startHp || 0),
        armor: 4 + (upg.startArmor || 0),
        maxArmor: 4 + (upg.startArmor || 0),
        stamina: 100 + (upg.startStamina || 0) * 10,
        maxStamina: 100 + (upg.startStamina || 0) * 10,
        gold: 0,
        // Base attack bonus: STR × 0.5 (Combat System 2.0)
        strength: Math.round(totalStr * 0.5),
        stats: {
          strength: totalStr,
          agility: totalAgi,
          intelligence: totalInt,
          will: totalWill,
        },
        classStats: { ...classData.stats }
      },
      deck: new Deck(),
      floor: 1,
      currentRoom: 0,
      totalRooms: totalRooms,
      roomsCleared: 0,
      revealedEnemiesCount: 0,
      dungeon: null,
      enemiesSlain: 0,
      cardsRevealed: 0,
      extraDraw: upg.cardDraw || 0,
      mergeBonus: upg.mergeBonus || 0,
      artifact: classData.artifact ? { ...classData.artifact } : null,
      firstCardFree: false,
      restSkipCount: 0, // tracks consecutive rooms without resting
      dungeonType: dungeonType // 'dungeon' or 'boss' for UI and boss room logic
    };

    // Use the player's active deck (managed in hub). Falls back to class starting deck on first game.
    let deckCards = [...this.activeDeck];
    if (!deckCards || deckCards.length === 0) {
      deckCards = [...classData.startingDeck];
      // Beggar with no deck: generate 4 random basic cards.
      if (deckCards.length === 0) {
        const playableIds = Object.keys(PLAYER_CARDS).filter(id => {
          const c = PLAYER_CARDS[id];
          return c.type === 'attack' || c.type === 'armor';
        });
        for (let i = 0; i < 4; i++) {
          deckCards.push(playableIds[Math.floor(Math.random() * playableIds.length)]);
        }
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
    // Pick up a real card from PLAYER_CARDS.
    if (item.collected) return false;
    const deck = this.run.deck;
    if (deck.hand.length >= Deck.MAX_HAND) return false;

    // item.cardId references a real PLAYER_CARDS entry.
    const template = PLAYER_CARDS[item.cardId];
    if (!template) {
      item.collected = true;
      return false;
    }

    deck.hand.push({
      uuid: Math.random().toString(36).slice(2, 14),
      id: template.id,
      type: template.type,
      cost: template.cost,
      sprite: template.sprite,
      name: template.name,
      desc: template.desc,
      power: template.power || 0,
      heal: template.heal || 0,
      poison: template.poison || 0,
      effects: template.effects ? [...template.effects] : undefined,
      targetMode: template.targetMode,
    });

    item.collected = true;
    return true;
  }

  // Rest: restore full stamina, reset skip counter.
  restStamina() {
    this.run.player.stamina = this.run.player.maxStamina;
    this.run.restSkipCount = 0;
  }

  // Skip rest: increment skip counter and award gold bonus.
  // Returns the gold earned from skipping.
  skipRest() {
    this.run.restSkipCount++;
    const bonus = this.run.restSkipCount * 3;
    this.run.player.gold += bonus;
    return bonus;
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
