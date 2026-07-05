import { describe, it, expect } from 'vitest';
import { Card } from '../../js/engine/card.js';

describe('Card', () => {
  it('creates a card from a valid template', () => {
    const card = new Card('strike');
    expect(card.id).toBe('strike');
    expect(card.name).toBe('Strike');
    expect(card.cost).toBe(1);
    expect(card.type).toBe('attack');
    expect(card.power).toBe(5);
    expect(card.merged).toBe(false);
    expect(card.uuid).toBeDefined();
  });

  it('creates a merged card with + suffix', () => {
    const card = new Card('strike+');
    expect(card.id).toBe('strike');
    expect(card.merged).toBe(true);
    expect(card.power).toBe(6);
  });

  it('throws on unknown template', () => {
    expect(() => new Card('unknown')).toThrow('Card template not found');
  });

  it('generates unique uuids', () => {
    const a = new Card('defend');
    const b = new Card('defend');
    expect(a.uuid).not.toBe(b.uuid);
  });

  it('has correct properties for defend', () => {
    const card = new Card('defend');
    expect(card.type).toBe('armor');
    expect(card.power).toBe(4);
    expect(card.heal).toBe(0);
    expect(card.poison).toBe(0);
  });

  it('has heal property for leech', () => {
    const card = new Card('leech');
    expect(card.type).toBe('attack');
    expect(card.heal).toBe(2);
  });

  it('has poison property for poison card', () => {
    const card = new Card('poison');
    expect(card.poison).toBe(2);
  });

  it('creates energy-type card', () => {
    const card = new Card('channel');
    expect(card.type).toBe('energy');
    expect(card.power).toBe(3);
    expect(card.cost).toBe(1);
  });
});
