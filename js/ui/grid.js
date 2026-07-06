import { DungeonEngine } from '../engine/dungeon.js';
import { DUNGEON_TEMPLATES } from '../data/dungeon.js';
import { PLAYER_CARDS } from '../data/cards.js';
import { t } from '../system/i18n.js';

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
    if (!card) return;

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

      if (card.armor > 0) {
        const armorBadge = document.createElement('div');
        armorBadge.className = 'card-armor';
        armorBadge.textContent = card.armor;
        el.appendChild(armorBadge);
      }

      const sprite = document.createElement('div');
      sprite.className = 'card-sprite';
      sprite.textContent = card.sprite;
      el.appendChild(sprite);

      const label = document.createElement('div');
      label.className = 'card-label';
      label.textContent = t(`enemy.${card.template}.name`, card.name);
      el.appendChild(label);

      // Show enemy hand cards as small badges.
      if (card._enemyHand && card._enemyHand.length > 0) {
        const handBar = document.createElement('div');
        handBar.className = 'enemy-hand-bar';
        for (const hc of card._enemyHand) {
          const badge = document.createElement('span');
          badge.className = 'enemy-hand-card';
          // Show action icon based on first effect.
          const ffx = hc.effects?.[0];
          if (ffx?.action === 'damage_player') badge.textContent = '⚔️';
          else if (ffx?.action === 'enemy_armor') badge.textContent = '🛡️';
          else if (ffx?.action === 'heal_enemy') badge.textContent = '💚';
          else if (ffx?.action === 'enemy_retreat') badge.textContent = '🏃';
          else if (ffx?.action === 'enemy_buff') badge.textContent = '🔥';
          else badge.textContent = '🂠';
          // Tooltip with card name.
          const lang = localStorage.getItem('carddung-lang') || 'en';
          badge.title = lang === 'ru' ? hc.nameRu : hc.nameEn;
          handBar.appendChild(badge);
        }
        el.appendChild(handBar);
      }

      // Show frozen indicator.
      if (card._frozenTicks > 0) {
        const frozenBadge = document.createElement('div');
        frozenBadge.className = 'enemy-frozen';
        frozenBadge.textContent = `❄️${card._frozenTicks}`;
        el.appendChild(frozenBadge);
      }
    } else if (card.type === DUNGEON_TEMPLATES.item) {
      el.classList.add('item-card');
      if (card.collected) el.classList.add('defeated');

      // Render from real PLAYER_CARDS.
      const template = PLAYER_CARDS[card.cardId];
      const spriteName = template?.nameEn || template?.name || 'Card';
      const lang = localStorage.getItem('carddung-lang') || 'en';
      const displayName = lang === 'ru' ? (template?.nameRu || spriteName) : spriteName;

      const sprite = document.createElement('div');
      sprite.className = 'card-sprite';
      sprite.textContent = template?.sprite || '🃏';
      el.appendChild(sprite);

      const label = document.createElement('div');
      label.className = 'card-label';
      label.textContent = displayName;
      el.appendChild(label);
    } else if (card.type === DUNGEON_TEMPLATES.exit) {
      el.classList.add('exit-card');

      const sprite = document.createElement('div');
      sprite.className = 'card-sprite';
      sprite.textContent = card.sprite;
      el.appendChild(sprite);

      const label = document.createElement('div');
      label.className = 'card-label';
      label.textContent = t('exit_card.name', card.name);
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
    GridUI.showDamageNumber(cell, amount, type);
  }

  static showDamageNumber(cell, amount, type = 'damage') {
    if (!cell.element || amount <= 0) return;
    const num = document.createElement('div');
    num.className = `damage-number ${type}`;
    num.textContent = type === 'heal' ? `+${amount}` : `-${amount}`;
    const rect = cell.element.getBoundingClientRect();
    num.style.left = `${rect.left + rect.width / 2 - 10}px`;
    num.style.top = `${rect.top + rect.height / 3}px`;
    document.body.appendChild(num);
    setTimeout(() => num.remove(), 800);
  }
}
