# Card Architecture — Patient Rogue (CardDung)

## Overview

Cards are the core gameplay element. Each card is defined as a JSON object stored in `server/data/cards.json`. The PWA fetches this file via `GET /api/cards` on startup, falling back to built-in defaults when offline.

### Data Flow

```
Admin Editor (admin/index.html)
    └── POST /api/cards → Express server (carddung-server:4000)
                         └── writes server/data/cards.json (Docker volume: cards-data)

PWA Game (js/main.js init())
    └── GET /api/cards → js/data/cards.js::loadRemoteCards()
                          └── populates PLAYER_CARDS (mutable object)
```

### Key Files

| File | Role |
|------|------|
| `server/data/cards.json` | Source of truth — array of card objects |
| `js/data/cards.js` | Fetches remote cards, exports `PLAYER_CARDS`, backward compat |
| `js/engine/combat.js` | Effects processor (`CombatEngine.processEffect`) |
| `js/main.js` | Targeting logic based on `targetMode` |
| `admin/index.html` | SPA editor — create/edit/delete cards via API |

---

## Card JSON Schema

```json
{
  "id": "string (required, unique)",
  "nameEn": "string (required)",
  "nameRu": "string (required)",
  "descEn": "string",
  "descRu": "string",
  "cost": "number (stamina cost to play)",
  "sprite": "string (emoji, max 4 chars)",
  "type": "string (legacy: attack|armor|energy|attack-all; auto-inferred from effects)",
  "targetMode": "string (how the card targets — see below)",
  "rarity": "string (common|rare|legendary)",
  "effects": "[{ action, params... }]",
  "returnToHand": "boolean (default false)"
}
```

### Field Details

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique identifier. Used as key in `PLAYER_CARDS`. Snake_case convention (`fire_bolt`). |
| `nameEn` | string | ✅ | Display name (English). |
| `nameRu` | string | ✅ | Display name (Russian). |
| `descEn` | string | — | Flavor/description text (EN). Shown on card face. |
| `descRu` | string | — | Flavor/description text (RU). |
| `cost` | number | — | Stamina deducted to play the card. `0` = free. Default: `1`. |
| `sprite` | string | — | Emoji icon displayed on card face. Max 4 characters. |
| `type` | string | — | Legacy field for backward compatibility. Auto-inferred from `effects[]`: `damage_all` → `attack-all`, `damage` → `attack`, `armor` → `armor`, etc. |
| `targetMode` | string | — | Determines how the card selects a target (see Target Modes). Default: inferred from effects. |
| `rarity` | string | — | Card rarity tier: `common` / `rare` / `legendary`. Used by transform effects and admin filtering. Default: `common`. |
| `effects` | array | — | Ordered list of effect objects. If empty/missing, legacy fields (`power`, `heal`) are used instead (backward compat). |
| `returnToHand` | boolean | — | When `true`, card is NOT moved to discard pile after playing — stays in hand. Default: `false`. |

### Legacy Fields (Backward Compatibility)

These fields work when `effects[]` is absent/empty:

| Field | Type | Description |
|-------|------|-------------|
| `power` | number | Base attack power or armor amount. Auto-included in damage calculation: `dmg = power + player.strength + mergeBonus`. |
| `heal` | number | HP restored on play. Applied after damage. |
| `poison` | number | Poison damage per tick applied to target (3 ticks default). |

---

## Target Modes

The `targetMode` field determines how a card selects its target when played:

| Mode | Description | Player Action Required? | Valid Targets |
|------|-------------|------------------------|---------------|
| `auto-enemy` | Auto-selects first alive revealed enemy | ❌ No — plays immediately on click | First living enemy |
| `target-enemy` | Requires manual targeting via drag-drop | ✅ Yes — drag card onto enemy cell | Any revealed, alive enemy |
| `target-cell` | Can target any grid cell | ✅ Yes — drag onto any cell | Any dungeon grid cell |
| `self` | No external target; affects player only | ❌ No — plays immediately on click | Player (self) |

### Fallback Logic

When `targetMode` is missing, the game infers it from effects:
- Contains `damage_all` → `auto-enemy`
- Contains `damage` → `auto-enemy`
- Otherwise → `self`

---

## Effects System

Each effect in `effects[]` has an `action` field and action-specific parameters. Effects are processed **in order** during card resolution.

### Available Actions

#### `damage` — Single-target damage

Naps damage to one enemy target. Includes player strength and merge bonus.

```json
{ "action": "damage", "power": 5 }
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `power` | number | ✅ | Base damage value. Final: `dmg = power + player.strength + mergeBonus`. At low stamina: `max(1, floor(dmg / 2))`. |

**Requirements:** Target must be a revealed, alive enemy cell. Auto-defeats if HP ≤ 0.

---

#### `damage_all` — AoE damage to all enemies

Naps damage to ALL revealed, alive enemies simultaneously.

```json
{ "action": "damage_all", "power": 6 }
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `power` | number | ✅ | Base damage per enemy. Same formula as `damage`. |

**Requirements:** No specific target needed. Iterates all grid cells. Each enemy is independently checked for defeat.

---

#### `heal` — Restore player HP

Heals the player for a fixed amount, capped at max HP.

```json
{ "action": "heal", "amount": 3 }
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | number | ✅ | HP to restore. Clamped: `min(hp + amount, maxHp)`. |

---

#### `armor` — Gain armor

Adds temporary armor that absorbs incoming damage (resets each turn).

```json
{ "action": "armor", "amount": 4 }
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | number | ✅ | Armor points to add. Stacks with existing armor. |

---

#### `stamina` — Gain stamina

Restores stamina, capped at max stamina.

```json
{ "action": "stamina", "amount": 3 }
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | number | ✅ | Stamina to restore. Clamped: `min(stamina + amount, maxStamina)`. |

---

#### `apply_debuff` — Apply debuff to enemy

Applies a persistent effect to a target enemy that ticks down each player action.

```json
{ "action": "apply_debuff", "debuffType": "poison", "amount": 2, "ticks": 3 }
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `debuffType` | string | ✅ | Currently: `"poison"`. Poison deals `amount` damage to the enemy each tick. |
| `amount` | number | ✅ | Damage per tick (for poison). |
| `ticks` | number | — | Number of ticks before debuff expires. Default: `1`. Each player action = 1 tick. |

**Requirements:** Target must be a revealed, alive enemy cell. If the enemy dies from poison damage, it is auto-defeated with gold reward.

---

#### `nullify_damage` — Silence one enemy's attacks

Prevents a single enemy from attacking for N ticks.

```json
{ "action": "nullify_damage", "ticks": 3 }
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `ticks` | number | — | Duration in player actions. Default: `3`. |

**Requirements:** Target must be a revealed, alive enemy cell. During nullify, the enemy's attack is skipped entirely.

---

#### `nullify_all_damage` — Silence all enemies' attacks

Prevents ALL revealed enemies from attacking for N ticks.

```json
{ "action": "nullify_all_damage", "ticks": 3 }
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `ticks` | number | — | Duration in player actions. Default: `3`. |

---

#### `reflect_damage` — Reflect damage back to enemy

Deals fixed damage back to a single enemy target (no strength bonus).

```json
{ "action": "reflect_damage", "amount": 5 }
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | number | ✅ | Fixed damage reflected. No strength/mergeBonus applied. Auto-defeats if HP ≤ 0. |

**Requirements:** Target must be a revealed, alive enemy cell.

---

#### `player_buff` — Temporary stat increase

Grants temporary stat bonuses that affect future card plays for N ticks.

```json
{ "action": "player_buff", "str": 3, "ticks": 4 }
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `str` | number | — | STR bonus added to damage calculation (`dmg = power + strength + buff_str`). |
| `agi` | number | — | AGI bonus (reserved for future mechanics). |
| `vit` | number | — | VIT bonus (reserved for future mechanics). |
| `ticks` | number | — | Duration in player actions. Default: `3`. Buffs expire when ticks reach 0. |

**Stacking:** New buffs of the same type overwrite existing ones (don't stack additively).

---

## Debuff & Buff Tick System

### How Ticks Work

Each **player action** triggers a tick cycle (`advanceWorldTick()` in `main.js`):

1. **Process debuff ticks** — All enemy debuffs decrement by 1. Poison deals damage. Expired debuffs are removed.
2. **Enemies attack** — All revealed, alive enemies deal damage (unless nullified).
3. **Process buff ticks** — Player buffs decrement by 1. Expired buffs are removed.

### Debuff Storage

Debuffs are stored on the enemy card object:

```js
cell.card.debuffs = [
  { type: 'poison', amount: 2, ticks: 2 },
  { type: 'nullify', amount: 0, ticks: 3 }
];
```

### Buff Storage

Player buffs are stored on the run state:

```js
run.buffs = {
  str: { value: 3, ticks: 4 },
  agi: { value: 1, ticks: 2 }
};
```

---

## Stamina Penalty System

When `player.stamina < card.cost`:

| Card Type | Behavior |
|-----------|----------|
| Attack (`damage` / `damage_all`) | **Plays at half power**: `dmg = max(1, floor(normalDmg / 2))`. Stamina clamped to 0. |
| Non-attack (armor, stamina, buffs) | **Blocked entirely** — card is not played, returns `null`. |

The penalty flag (`result.penalty = true`) can be checked by UI for visual feedback.

---

## Legacy Backward Compatibility

Cards without an `effects[]` array still work through automatic conversion:

```js
CombatEngine.legacyToEffects(card)
// type='attack', power=5, heal=2  →  [{action:'damage',power:5}, {action:'heal',amount:2}]
// type='armor', power=4           →  [{action:'armor',amount:4}]
// type='energy', power=3          →  [{action:'stamina',amount:3}]
```

This ensures all pre-existing cards continue to function without migration.

---

## Admin Editor API

### Endpoints

| Method | Path | Description | Response |
|--------|------|-------------|----------|
| `GET` | `/api/cards` | List all cards | `{ ok: true, cards: [...] }` |
| `POST` | `/api/cards` | Create or update card (upsert by `id`) | `{ ok: true, card: {...} }` |
| `DELETE` | `/api/cards/:id` | Delete card by ID | `{ ok: true }` |

### Request Body (POST)

```json
{
  "id": "string",
  "nameEn": "string",
  "nameRu": "string",
  "descEn": "string",
  "descRu": "string",
  "cost": number,
  "sprite": "string",
  "targetMode": "auto-enemy|target-enemy|target-cell|self",
  "rarity": "common|rare|legendary",
  "effects": [...],
  "returnToHand": false
}
```

### Admin UI Features

- **Card list** with search by ID, name, rarity
- **Effects builder**: Add/remove effects dynamically; each effect type shows relevant fields
- **Live preview**: Card face renders in real-time as you edit
- **JSON export**: Full card JSON displayed; "COPY" button copies to clipboard
- **Rarity colors**: Common (gray), Rare (blue), Legendary (gold border + glow)

---

## Current Card List (18 cards)

| ID | Name EN | Type | Cost | Power | Rarity | Effects |
|----|---------|------|------|-------|--------|---------|
| `strike` | Strike | attack | 1 | 5 | common | damage(5) |
| `defend` | Defend | armor | 1 | — | common | armor(4) |
| `bash` | Bash | attack | 2 | 8 | rare | damage(8) |
| `leech` | Leech | attack | 1 | 3 | rare | damage(3), heal(2) |
| `fireball` | Fireball | attack-all | 2 | 6 | legendary | damage_all(6) |
| `dodge` | Dodge | armor | 0 | — | common | armor(2) |
| `heavy` | Heavy Blow | attack | 2 | 10 | legendary | damage(10) |
| `poison` | Venom | attack | 1 | 2 | rare | damage(2), apply_debuff(poison, 2/tick, 3 ticks) |
| `channel` | Channel | energy | 1 | — | common | stamina(3) |
| `heavy_slash` | Heavy Slash | attack | 1 | 7 | rare | damage(7) |
| `shield` | Shield | armor | 1 | — | rare | armor(6) |
| `parry` | Parry | armor | 0 | — | common | armor(3) |
| `fire_bolt` | Fire Bolt | attack | 1 | 5 | common | damage(5) |
| `frost` | Frost | attack | 1 | 4 | common | damage(4) |
| `mana_shield` | Mana Shield | armor | 1 | — | rare | armor(5) |
| `arcane_missile` | Arcane Missile | attack | 2 | 8 | rare | damage(8) |
| `dagger` | Dagger | attack | 0 | 3 | common | damage(3) |
| `backstab` | Backstab | attack | 2 | 12 | legendary | damage(12) |

---

## Card Creation Examples

### Multi-effect card: Attack + Heal (Leech-style)

```json
{
  "id": "blood_thirst",
  "nameEn": "Blood Thirst",
  "nameRu": "Кровавая Жажда",
  "descEn": "Deal 6 damage, heal 4",
  "descRu": "Нанеси 6 урона, лечись на 4",
  "cost": 2,
  "sprite": "🩸",
  "targetMode": "auto-enemy",
  "rarity": "rare",
  "effects": [
    { "action": "damage", "power": 6 },
    { "action": "heal", "amount": 4 }
  ]
}
```

### Debuff card: Poison + silence

```json
{
  "id": "toxic_cloud",
  "nameEn": "Toxic Cloud",
  "nameRu": "Токсичное Облако",
  "descEn": "Apply poison 3/tick for 4 ticks, nullify attacks for 2 ticks",
  "descRu": "Яд 3/тик на 4 тика, молчание 2 тика",
  "cost": 2,
  "sprite": "☁️",
  "targetMode": "target-enemy",
  "rarity": "legendary",
  "effects": [
    { "action": "apply_debuff", "debuffType": "poison", "amount": 3, "ticks": 4 },
    { "action": "nullify_damage", "ticks": 2 }
  ]
}
```

### Buff card: Temporary strength boost

```json
{
  "id": "battle_cry",
  "nameEn": "Battle Cry",
  "nameRu": "Боевой Крик",
  "descEn": "+3 STR for 4 turns",
  "descRu": "+3 СИЛ на 4 хода",
  "cost": 1,
  "sprite": "📯",
  "targetMode": "self",
  "rarity": "rare",
  "effects": [
    { "action": "player_buff", "str": 3, "ticks": 4 }
  ]
}
```

### Return-to-hand card: Reusable attack

```json
{
  "id": "quick_strike",
  "nameEn": "Quick Strike",
  "nameRu": "Быстрый Удар",
  "descEn": "Deal 3 damage. Returns to hand.",
  "descRu": "Нанеси 3 урона. Возвращается в руку.",
  "cost": 1,
  "sprite": "⚡",
  "targetMode": "auto-enemy",
  "rarity": "rare",
  "effects": [
    { "action": "damage", "power": 3 }
  ],
  "returnToHand": true
}
```

### AoE + self-buff combo

```json
{
  "id": "inferno",
  "nameEn": "Inferno",
  "nameRu": "Пылающий Ад",
  "descEn": "Deal 4 to all enemies, gain +2 STR for 3 turns",
  "descRu": "4 урона всем врагам, +2 СИЛ на 3 хода",
  "cost": 3,
  "sprite": "🌋",
  "targetMode": "auto-enemy",
  "rarity": "legendary",
  "effects": [
    { "action": "damage_all", "power": 4 },
    { "action": "player_buff", "str": 2, "ticks": 3 }
  ]
}
```

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────┐
│                    PLAYER_CARDS (JS)                  │
│  Mutable object, keyed by card.id                    │
│  Populated from:                                     │
│    1. Remote fetch /api/cards (on init)              │
│    2. Fallback built-in defaults (offline)           │
└──────────┬───────────────────────────────────────────┘
           │ used by
           ▼
┌──────────────────────────────────────────────────────┐
│                   COMBAT ENGINE                       │
│  playCard(card, targetCell, state, freeCost)         │
│    ├─ Check stamina → penalty or block               │
│    ├─ Build effects[] (legacyToEffects if needed)    │
│    └─ For each effect:                               │
│        processEffect(effect, card, target, p, run)   │
│          ├─ damage / damage_all                      │
│          ├─ heal / armor / stamina                   │
│          ├─ apply_debuff / nullify*                  │
│          └─ reflect_damage / player_buff             │
│    └─ Discard card (or returnToHand)                 │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│                   TICK SYSTEM                         │
│  advanceWorldTick() called after every player action:│
│    1. processDebuffTicks():                           │
│       ├─ Poison → damage enemy, auto-defeat if dead   │
│       └─ Decrement ticks, remove expired              │
│    2. enemiesAttack():                                │
│       └─ Skip enemies with nullify debuff             │
│    3. processBuffTicks():                             │
│       └─ Decrement run.buffs[*].ticks, expire         │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│                    TARGETING                          │
│  onHandCardClick → check card.targetMode:            │
│    auto-enemy → find first alive enemy, play          │
│    self       → no target needed, play immediately     │
│    target-*   → requires drag-drop onto grid cell      │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│                    DATA STORAGE                       │
│  server/data/cards.json ← Docker volume (cards-data) │
│       ↑ written by POST /api/cards                   │
│       ↓ read by GET /api/cards                       │
└──────────────────────────────────────────────────────┘
```
