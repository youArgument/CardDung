import { DungeonEngine } from '../engine/dungeon.js';
import { DUNGEON_TEMPLATES } from '../data/dungeon.js';

export class GridUI {
  static render(dungeon, state, container) {
    container.innerHTML = '';

    const gridEl = document.createElement('div');
    gridEl.className = 'grid-container';
    gridEl.style.gridTemplateColumns = `repeat(${dungeon.cols}, var(--card-size))`;
    gridEl.style.gridTemplateRows = `repeat(${dungeon.rows}, var(--card-size))`;

    const revealable = DungeonEngine.getRevealable(dungeon);
    const revealableSet = new Set(revealable);

    for (const cell of dungeon.grid) {
      const el = document.createElement('div');
      el.className = 'dungeon-card';
      el.dataset.row = cell.row;
      el.dataset.col = cell.col;

      if (!cell.revealed) {
        if (revealableSet.has(cell)) {
          el.classList.add('face-down', 'revealable');
        } else {
          el.classList.add('face-down');
        }
      } else {
        el.classList.add('revealed');
        GridUI.renderRevealedCard(el, cell);
      }

      gridEl.appendChild(el);
      cell.element = el;
    }

    container.appendChild(gridEl);
  }

  static renderRevealedCard(el, cell) {
    const card = cell.card;
    el.innerHTML = '';

    if (card.type === DUNGEON_TEMPLATES.empty) {
      el.classList.add('empty-slot');
      return;
    }

    if (card.type === DUNGEON_TEMPLATES.enemy) {
      el.classList.add('enemy-card');
      if (card.defeated) el.classList.add('defeated');

      const hpBadge = document.createElement('div');
      hpBadge.className = 'card-hp';
      hpBadge.textContent = card.hp;
      el.appendChild(hpBadge);

      const atkBadge = document.createElement('div');
      atkBadge.className = 'card-atk';
      atkBadge.textContent = card.atk;
      el.appendChild(atkBadge);

      const sprite = document.createElement('div');
      sprite.className = 'card-sprite';
      sprite.textContent = card.sprite;
      el.appendChild(sprite);

      const label = document.createElement('div');
      label.className = 'card-label';
      label.textContent = card.name;
      el.appendChild(label);
    } else if (card.type === DUNGEON_TEMPLATES.item) {
      el.classList.add('item-card');
      if (card.collected) el.classList.add('defeated');

      const sprite = document.createElement('div');
      sprite.className = 'card-sprite';
      sprite.textContent = card.sprite;
      el.appendChild(sprite);

      const label = document.createElement('div');
      label.className = 'card-label';
      label.textContent = card.name;
      el.appendChild(label);
    } else if (card.type === DUNGEON_TEMPLATES.exit) {
      el.classList.add('exit-card');

      const sprite = document.createElement('div');
      sprite.className = 'card-sprite';
      sprite.textContent = card.sprite;
      el.appendChild(sprite);

      const label = document.createElement('div');
      label.className = 'card-label';
      label.textContent = card.name;
      el.appendChild(label);
    }
  }

  static updateCell(cell) {
    if (cell.element && cell.revealed) {
      GridUI.renderRevealedCard(cell.element, cell);
    }
  }

  static animateHit(cell) {
    if (cell.element) {
      cell.element.classList.add('hit');
      setTimeout(() => cell.element.classList.remove('hit'), 300);
    }
  }

  static showDamage(cell, amount, type = 'damage') {
    if (!cell.element) return;
    const num = document.createElement('div');
    num.className = `damage-number ${type}`;
    num.textContent = type === 'heal' ? `+${amount}` : `-${amount}`;
    num.style.left = `${cell.element.offsetLeft + 20}px`;
    num.style.top = `${cell.element.offsetTop}px`;
    cell.element.parentElement.appendChild(num);
    setTimeout(() => num.remove(), 800);
  }
}
