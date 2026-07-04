import { PLAYER_CARDS } from '../data/cards.js';

export class Card {
  constructor(templateId) {
    const baseId = templateId.replace('+', '');
    const t = PLAYER_CARDS[baseId];
    if (!t) throw new Error(`Card template not found: ${templateId}`);

    const isMerged = templateId.endsWith('+');
    this.id = t.id;
    this.name = t.name;
    this.cost = t.cost;
    this.sprite = t.sprite;
    this.desc = t.desc;
    this.type = t.type;
    this.power = isMerged ? t.power + 1 : t.power;
    this.heal = t.heal || 0;
    this.poison = t.poison || 0;
    this.merged = isMerged;
    this.uuid = Math.random().toString(36).substr(2, 9);
  }
}
