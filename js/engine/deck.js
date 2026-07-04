import { Card } from './card.js';

export class Deck {
  constructor() {
    this.cards = [];
    this.drawPile = [];
    this.hand = [];
    this.discardPile = [];
  }

  initFromTemplates(templateIds) {
    this.cards = templateIds.map(id => new Card(id));
    this.shuffleAndDraw();
  }

  addCard(templateId) {
    const card = new Card(templateId);
    this.cards.push(card);
    this.discardPile.push(card);
  }

  shuffleAndDraw() {
    this.drawPile = [...this.cards];
    this.shuffle(this.drawPile);
    this.hand = [];
    this.discardPile = [];
  }

  draw(count) {
    const MAX_HAND = 5;
    const drawn = [];
    for (let i = 0; i < count; i++) {
      if (this.hand.length >= MAX_HAND) break;
      if (this.drawPile.length === 0) {
        if (this.discardPile.length === 0) break;
        this.drawPile = [...this.discardPile];
        this.discardPile = [];
        this.shuffle(this.drawPile);
      }
      const card = this.drawPile.pop();
      if (card) {
        this.hand.push(card);
        drawn.push(card);
      }
    }
    return drawn;
  }

  discardHand() {
    this.discardPile.push(...this.hand);
    this.hand = [];
  }

  removeCard(uuid) {
    const idx = this.hand.findIndex(c => c.uuid === uuid);
    if (idx !== -1) {
      const [card] = this.hand.splice(idx, 1);
      this.discardPile.push(card);
    }
  }

  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
}
