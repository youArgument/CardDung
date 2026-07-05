import { describe, it, expect, beforeEach } from 'vitest';
import { CombatEngine } from '../../js/engine/combat.js';

function createGameState(overrides = {}) {
  const enemies = [
    { row: 0, col: 0, revealed: true, card: { type: 'enemy', id: 'rat', hp: 5, maxHp: 5, atk: 2, defeated: false, gold: 2, sprite: '🐀', name: 'Rat' } },
    { row: 0, col: 1, revealed: true, card: { type: 'enemy', id: 'skeleton', hp: 8, maxHp: 8, atk: 3, defeated: false, gold: 3, sprite: '💀', name: 'Skeleton' } },
    { row: 0, col: 2, revealed: false, card: { type: 'empty' } }
  ];
  return {
    run: {
      player: { hp: 8, maxHp: 8, armor: 0, stamina: 100, maxStamina: 100, energy: 5, gold: 0, strength: 0, maxEnergy: 5 },
      deck: {
        hand: [],
        discardPile: [],
        cards: []
      },
      dungeon: {
        grid: enemies,
        cols: 4,
        rows: 5
      },
      mergeBonus: 0,
      floor: 1,
      ...overrides
    }
  };
}

function makeCard(overrides = {}) {
  return {
    uuid: 'test-uuid',
    id: 'strike',
    name: 'Strike',
    cost: 1,
    type: 'attack',
    power: 5,
    heal: 0,
    poison: 0,
    merged: false,
    ...overrides
  };
}

describe('CombatEngine.playCard', () => {
  it('attack with low stamina plays at penalty (half damage)', () => {
    const gs = createGameState();
    gs.run.player.stamina = 0;
    const card = makeCard({ cost: 1, power: 6 });
    gs.run.deck.hand.push(card);
    const target = gs.run.dungeon.grid[0]; // rat hp=5
    const result = CombatEngine.playCard(card, target, gs);
    expect(result).not.toBeNull();
    expect(result.penalty).toBe(true);
    // Half damage: floor(6 / 2) = 3 (strength=0, mergeBonus=0)
    expect(target.card.hp).toBe(5 - 3); // 2
  });

  it('armor with low stamina returns null', () => {
    const gs = createGameState();
    gs.run.player.stamina = 0;
    const card = makeCard({ cost: 1, power: 4, type: 'armor' });
    const result = CombatEngine.playCard(card, null, gs);
    expect(result).toBeNull();
  });

  it('reduces stamina by card cost', () => {
    const gs = createGameState();
    const card = makeCard({ cost: 2 });
    gs.run.deck.hand.push(card);
    gs.run.player.stamina = 5;
    CombatEngine.playCard(card, null, gs);
    // createGameState starts with stamina=100
    // stamina should decrease by card cost.
    expect(gs.run.player.stamina).toBe(3);
  });

  it('deals damage to target enemy', () => {
    const gs = createGameState();
    const card = makeCard({ power: 5 });
    gs.run.deck.hand.push(card);
    const target = gs.run.dungeon.grid[0];
    const result = CombatEngine.playCard(card, target, gs);
    expect(target.card.hp).toBe(0);
    expect(target.card.defeated).toBe(true);
    expect(result.effects[0].type).toBe('damage');
  });

  it('defeats enemy when hp reaches 0', () => {
    const gs = createGameState();
    const card = makeCard({ power: 5 });
    gs.run.deck.hand.push(card);
    const target = gs.run.dungeon.grid[0];
    CombatEngine.playCard(card, target, gs);
    expect(target.card.defeated).toBe(true);
    expect(target.card.hp).toBe(0);
    expect(gs.run.player.gold).toBe(2);
  });

  it('heals player with leech-type attacks', () => {
    const gs = createGameState();
    gs.run.player.hp = 5;
    const card = makeCard({ power: 3, heal: 2, type: 'attack' });
    gs.run.deck.hand.push(card);
    const target = gs.run.dungeon.grid[0];
    CombatEngine.playCard(card, target, gs);
    expect(gs.run.player.hp).toBe(7);
  });

  it('attack-all damages all enemies', () => {
    const gs = createGameState();
    const card = makeCard({ power: 5, type: 'attack-all' });
    gs.run.deck.hand.push(card);
    CombatEngine.playCard(card, null, gs);
    expect(gs.run.dungeon.grid[0].card.hp).toBe(0);
    expect(gs.run.dungeon.grid[1].card.hp).toBe(3);
  });

  it('armor card adds armor', () => {
    const gs = createGameState();
    const card = makeCard({ power: 4, type: 'armor' });
    gs.run.deck.hand.push(card);
    const result = CombatEngine.playCard(card, null, gs);
    expect(gs.run.player.armor).toBe(4);
    expect(result.effects[0].type).toBe('armor');
  });

  it('energy card adds stamina directly', () => {
    const gs = createGameState();
    const card = makeCard({ power: 3, type: 'energy' });
    gs.run.deck.hand.push(card);
    gs.run.player.stamina = 10;
    CombatEngine.playCard(card, null, gs);
    // cost=1 (default), so: 10 - 1 (cost) + 3 (power) = 12
    expect(gs.run.player.stamina).toBe(12);
  });

  it('moves played card to discard pile', () => {
    const gs = createGameState();
    const card = makeCard({ uuid: 'card-1' });
    gs.run.deck.hand.push(card);
    CombatEngine.playCard(card, null, gs);
    expect(gs.run.deck.hand).not.toContain(card);
    expect(gs.run.deck.discardPile).toContain(card);
  });
});
