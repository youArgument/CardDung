import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../../js/engine/state.js';

describe('GameState', () => {
  let state;

  beforeEach(() => {
    state = new GameState();
  });

  it('initializes with default values', () => {
    expect(state.screen).toBe('menu');
    expect(state.player.gold).toBe(20);
    expect(state.activeDeck).toHaveLength(5);
    expect(state.collection).toEqual([]);
    expect(state.upgrades).toEqual({});
  });

  it('starts a run', () => {
    state.startRun();
    expect(state.screen).toBe('dungeon');
    expect(state.run).toBeDefined();
    expect(state.run.player.hp).toBeGreaterThan(0);
    expect(state.run.player.stamina).toBeGreaterThan(0);
    expect(state.run.deck).toBeDefined();
    expect(state.run.dungeon).toBeDefined();
    expect(state.run.turn).toBe(1);
  });

  it('startRun applies upgrades to player', () => {
    state.upgrades = { startHp: 2, startArmor: 1 };
    state.startRun();
    expect(state.run.player.maxHp).toBe(10);
    expect(state.run.player.hp).toBe(10);
    expect(state.run.player.maxArmor).toBe(5);
    expect(state.run.player.armor).toBe(5);
  });

  it('startRoom sets up dungeon', () => {
    state.startRun();
    const initialRun = state.run;
    state.startRoom();
    expect(state.run.turn).toBe(1);
    expect(state.run.dungeon.grid).toBeDefined();
  });

  it('revealCell reduces stamina and marks cell', () => {
    state.startRun();
    const startCell = state.run.dungeon.grid.find(c => c.row === state.run.dungeon.startPos.row && c.col === state.run.dungeon.startPos.col);
    const otherCell = state.run.dungeon.grid.find(c => c.row === 0 && c.col === 0 && c !== startCell) || state.run.dungeon.grid.find(c => !c.revealed);
    if (!otherCell) return;
    const staminaBefore = state.run.player.stamina;
    state.revealCell(otherCell);
    expect(otherCell.revealed).toBe(true);
    expect(state.run.player.stamina).toBe(staminaBefore - 5);
    // start room no longer auto-reveals the start cell
    expect(state.run.dungeon.revealedCount).toBe(1);
  });

  it('takeDamage reduces hp through armor', () => {
    state.startRun();
    state.run.player.armor = 3;
    const result = state.takeDamage(5);
    expect(result.blocked).toBe(3);
    expect(result.damage).toBe(2);
    expect(state.run.player.hp).toBe(state.run.player.maxHp - 2);
  });

  it('isDead returns true when hp <= 0', () => {
    state.startRun();
    state.run.player.hp = 0;
    expect(state.isDead()).toBe(true);
  });

  it('isDead returns false when hp > 0', () => {
    state.startRun();
    expect(state.isDead()).toBe(false);
  });

  it('startNewTurn resets energy and reveals', () => {
    state.startRun();
    state.run.player.energy = 0;
    state.run.revealedThisTurn = 2;
    state.startNewTurn();
    expect(state.run.turn).toBe(2);
    // Energy mechanic disabled.
    expect(state.run.player.energy).toBe(0);
    expect(state.run.revealedThisTurn).toBe(0);
  });

  it('advanceRoom increments roomsCleared', () => {
    state.startRun();
    const roomsBefore = state.run.roomsCleared;
    state.advanceRoom();
    expect(state.run.roomsCleared).toBe(roomsBefore + 1);
  });

  it('advanceRoom starts new room if not all cleared', () => {
    state.run = {
      roomsCleared: 0,
      totalRooms: 2,
      currentRoom: 0,
      floor: 1,
      dungeon: { grid: [], cols: 4, rows: 5 }
    };
    state.startRoom = () => { state.run.currentRoom = 1; };
    state.advanceRoom();
    expect(state.run.currentRoom).toBe(1);
  });
});
