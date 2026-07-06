import { describe, it, expect } from 'vitest';
import { Card } from '../../js/engine/card.js';

describe('Card', () => {
  it('creates a card from a valid template', () => {
    const card = new Card('strike');
    expect(card.id).toBe('strike');
    expect(card.name).toBe('Strike');
    expect(card.cost).toBe(1);
    expect(card.type).toBe('attack');
    // Combat System 2.0: baseDamage instead of power
    expect(card.baseDamage).toBe(3);
    expect(card.mainStat).toBe('STR');
    expect(card.merged).toBe(false);
    expect(card.uuid).toBeDefined();
  });

  it('creates a merged card with + suffix', () => {
    const card = new Card('strike+');
    expect(card.id).toBe('strike');
    expect(card.merged).toBe(true);
    // Merged: baseDamage +1 bonus
    expect(card.baseDamage).toBe(4);
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
    // Combat System 2.0: baseDamage instead of power/heal/poison
    expect(card.baseDamage).toBe(3);
    expect(card.mainStat).toBe('VIT');
    expect(card.requiredStat).toBe(4);
  });

  it('has heal effect for leech', () => {
    const card = new Card('leech');
    expect(card.type).toBe('attack');
    // Combat System 2.0: effects array instead of heal property
    expect(card.effects.length).toBe(2);
    expect(card.effects[1].action).toBe('heal');
    expect(card.tags).toContain('LifeSteal');
  });

  it('has poison debuff effect for poison card', () => {
    const card = new Card('poison');
    // Combat System 2.0: apply_debuff effect instead of poison property
    expect(card.effects.some(e => e.action === 'apply_debuff' && e.debuffType === 'poison')).toBe(true);
    expect(card.tags).toContain('Poison');
  });

  it('creates energy-type card', () => {
    const card = new Card('channel');
    expect(card.type).toBe('energy');
    // Combat System 2.0: baseDamage instead of power
    expect(card.baseDamage).toBe(3);
    expect(card.cost).toBe(1);
    expect(card.effects[0].action).toBe('stamina');
  });

  it('copies effects array from template', () => {
    const card = new Card('fireball');
    expect(card.effects.length).toBe(1);
    expect(card.effects[0].action).toBe('damage_all');
    expect(card.mainStat).toBe('INT'); // single stat, not hybrid
  });

  it('has statWeights for hybrid cards', () => {
    const card = new Card('frost');
    expect(card.statWeights.INT).toBe(0.8);
    expect(card.statWeights.WIL).toBe(0.2);
  });
});
