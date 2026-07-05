import { describe, it, expect, beforeEach } from 'vitest';
import { HubEngine } from '../../js/engine/hub.js';

describe('HubEngine', () => {
  let state;
  let hub;

  beforeEach(() => {
    state = {
      player: { gold: 50 },
      activeDeck: ['strike', 'defend', 'bash'],
      collection: ['fireball', 'dodge'],
      upgrades: {},
      stats: { cardsDiscovered: new Set(['strike', 'defend', 'bash']) }
    };
    hub = new HubEngine(state);
  });

  describe('getMarketInventory', () => {
    it('returns 6 random cards', () => {
      const inventory = hub.getMarketInventory();
      expect(inventory).toHaveLength(6);
      inventory.forEach(item => {
        expect(item.id).toBeDefined();
        expect(item.name).toBeDefined();
        expect(item.cost).toBeGreaterThanOrEqual(5);
      });
    });
  });

  describe('buyCard', () => {
    it('deducts gold and adds to collection', () => {
      const result = hub.buyCard('strike');
      expect(result).toBe(true);
      expect(state.player.gold).toBeLessThan(50);
      expect(state.collection).toContain('strike');
    });

    it('returns false if not enough gold', () => {
      state.player.gold = 2;
      const result = hub.buyCard('heavy');
      expect(result).toBe(false);
      expect(state.collection).not.toContain('heavy');
    });
  });

  describe('addToDeck', () => {
    it('moves card from collection to active deck', () => {
      const result = hub.addToDeck('fireball');
      expect(result).toBe(true);
      expect(state.activeDeck).toContain('fireball');
      expect(state.collection).not.toContain('fireball');
    });

    it('returns false when deck is full (5)', () => {
      state.activeDeck = Array(5).fill('strike');
      const result = hub.addToDeck('fireball');
      expect(result).toBe(false);
    });

    it('returns false if card not in collection', () => {
      const result = hub.addToDeck('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('removeFromDeck', () => {
    it('moves card from active deck to collection', () => {
      const result = hub.removeFromDeck(0);
      expect(result).toBe(true);
      expect(state.activeDeck).not.toContain('strike');
      expect(state.collection).toContain('strike');
    });

    it('returns false for invalid index', () => {
      expect(hub.removeFromDeck(-1)).toBe(false);
      expect(hub.removeFromDeck(10)).toBe(false);
    });
  });

  describe('mergeCards', () => {
    it('merges two identical cards into upgraded version', () => {
      state.activeDeck = ['strike', 'strike'];
      const result = hub.mergeCards(0, 1);
      expect(result).toBe(true);
      expect(state.activeDeck).toHaveLength(1);
      expect(state.activeDeck[0]).toBe('strike+');
    });

    it('returns false if cards are different', () => {
      state.activeDeck = ['strike', 'defend'];
      const result = hub.mergeCards(0, 1);
      expect(result).toBe(false);
      expect(state.activeDeck).toHaveLength(2);
    });

    it('returns false for same index', () => {
      const result = hub.mergeCards(0, 0);
      expect(result).toBe(false);
    });

    it('returns false for invalid indices', () => {
      expect(hub.mergeCards(0, 10)).toBe(false);
      expect(hub.mergeCards(-1, 1)).toBe(false);
    });
  });

  describe('buyUpgrade', () => {
    it('increments upgrade level on purchase', () => {
      const result = hub.buyUpgrade('startHp');
      expect(result).toBe(true);
      expect(state.upgrades.startHp).toBe(1);
    });

    it('deducts gold from player', () => {
      const goldBefore = state.player.gold;
      hub.buyUpgrade('startArmor');
      expect(state.player.gold).toBeLessThan(goldBefore);
    });

    it('does not exceed max level', () => {
      state.upgrades.startHp = 5;
      const result = hub.buyUpgrade('startHp');
      expect(result).toBe(false);
    });

    it('cost increases with level', () => {
      const cost1 = hub.getUpgradeLevel('startArmor');
      hub.buyUpgrade('startArmor');
      hub.buyUpgrade('startArmor');
      expect(state.upgrades.startArmor).toBe(2);
    });
  });
});
