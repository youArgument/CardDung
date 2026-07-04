import { describe, it, expect, beforeEach } from 'vitest';
import { Deck } from '../../js/engine/deck.js';

describe('Deck', () => {
  let deck;

  beforeEach(() => {
    deck = new Deck();
  });

  it('starts empty', () => {
    expect(deck.cards).toEqual([]);
    expect(deck.drawPile).toEqual([]);
    expect(deck.hand).toEqual([]);
    expect(deck.discardPile).toEqual([]);
  });

  it('initializes from template IDs', () => {
    deck.initFromTemplates(['strike', 'strike', 'defend']);
    expect(deck.cards).toHaveLength(3);
    expect(deck.cards[0] instanceof Object).toBe(true);
    expect(deck.drawPile).toHaveLength(3);
  });

  it('draws cards into hand', () => {
    deck.initFromTemplates(['strike', 'strike', 'defend', 'bash', 'dodge']);
    const drawn = deck.draw(3);
    expect(drawn).toHaveLength(3);
    expect(deck.hand).toHaveLength(3);
    expect(deck.drawPile).toHaveLength(2);
  });

  it('respects MAX_HAND = 5', () => {
    deck.initFromTemplates(['a', 'b', 'c', 'd', 'e', 'f', 'g'].map(() => 'strike'));
    deck.draw(10);
    expect(deck.hand.length).toBeLessThanOrEqual(5);
  });

  it('reshuffles discard pile when draw pile is empty', () => {
    deck.initFromTemplates(['strike', 'defend', 'bash']);
    deck.draw(3);
    expect(deck.drawPile).toHaveLength(0);
    deck.discardHand();
    expect(deck.discardPile).toHaveLength(3);
    const drawn = deck.draw(2);
    expect(drawn).toHaveLength(2);
    expect(deck.hand).toHaveLength(2);
  });

  it('discards hand', () => {
    deck.initFromTemplates(['strike', 'defend']);
    deck.draw(2);
    deck.discardHand();
    expect(deck.hand).toHaveLength(0);
    expect(deck.discardPile).toHaveLength(2);
  });

  it('removes a card from hand by uuid', () => {
    deck.initFromTemplates(['strike', 'defend', 'bash']);
    deck.draw(3);
    const card = deck.hand[0];
    deck.removeCard(card.uuid);
    expect(deck.hand.find(c => c.uuid === card.uuid)).toBeUndefined();
    expect(deck.discardPile).toContain(card);
  });

  it('does nothing when removing unknown uuid', () => {
    deck.initFromTemplates(['strike']);
    deck.draw(1);
    deck.removeCard('nonexistent');
    expect(deck.hand).toHaveLength(1);
  });

  it('adds a card to cards and discard pile', () => {
    deck.addCard('strike');
    expect(deck.cards).toHaveLength(1);
    expect(deck.discardPile).toHaveLength(1);
  });

  it('shuffles cards randomly', () => {
    const ids = ['strike', 'strike', 'defend', 'defend', 'bash', 'dodge', 'leech', 'fireball'];
    deck.initFromTemplates(ids);
    const originalOrder = deck.drawPile.map(c => c.id);
    let sameOrder = true;
    for (let i = 0; i < 5; i++) {
      deck = new Deck();
      deck.initFromTemplates(ids);
      const newOrder = deck.drawPile.map(c => c.id);
      if (JSON.stringify(newOrder) !== JSON.stringify(originalOrder)) {
        sameOrder = false;
        break;
      }
    }
    expect(sameOrder).toBe(false);
  });

  it('shuffleAndDraw resets and reshuffles', () => {
    deck.initFromTemplates(['strike', 'defend', 'bash']);
    deck.draw(2);
    deck.shuffleAndDraw();
    expect(deck.drawPile).toHaveLength(3);
    expect(deck.hand).toHaveLength(0);
    expect(deck.discardPile).toHaveLength(0);
  });
});
