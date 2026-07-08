# CardDung — Architecture Overview

## Summary

**CardDung** (aka "Patient Rogue") is a browser-based, card-driven roguelike dungeon crawler built as a Progressive Web App (PWA). Version **0.3.0**. Vanilla JavaScript (ES modules), HTML, CSS — no frontend framework. Optional Express backend for remote card/enemy data. Deployed via Docker Compose behind Nginx + Let's Encrypt at `https://game.you-argument.ru`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JS (ES modules), HTML, CSS |
| Backend | Express.js (Node 18) — card/enemy data API |
| Admin Panel | SPA (~45KB HTML) — card editor, enemy deck composer |
| Testing | Vitest (6 test files, ~65 tests) |
| PWA | Service Worker (`sw.js`), manifest.json, cache-first strategy |
| Deployment | Docker Compose: 5 services (frontend, backend, admin, nginx, certbot) |

---

## Directory Structure

```
CardDung/
  index.html              # All game screens (menu, hub, dungeon, reward, gameover, worldmap, escape)
  css/style.css           # All styles (~35KB)
  manifest.json           # PWA manifest (fullscreen portrait mode)
  sw.js                   # Service Worker (cache-first, patient-rogue-v9)
  VERSION                 # Semver file (0.3.0), auto-incremented by Dockerfile
  package.json            # http-server + vitest devDependencies
  docker-compose.yml      # 5 services: carddung, carddung-server, admin, nginx, certbot
  Dockerfile              # Frontend container (http-server :3000)
  server.Dockerfile       # Backend Express container (:4000)
  admin.Dockerfile        # Admin panel container (:5000)
  nginx.conf / nginx-http.conf

  js/                     # Main application code (ES modules)
    main.js               # Entry point: Game object, event binding, init (~72KB)
    data/                 # Data definitions
      cards.js            # PLAYER_CARDS (48 fallback), loadRemoteCards()
      classes.js          # CLASSES: Warrior, Mage, Rogue, Beggar
      dungeon.js          # generateDungeon(), DUNGEON_TEMPLATES, grid generation
      enemies.js          # DUNGEON_ENEMIES (9 types), ENEMY_CARDS (~27 cards)
      upgrades.js         # UPGRADES: safehouse upgrade definitions (10 types)
      biomes.js           # Biome data for world map
      poi.js              # Points of Interest for world map
    engine/               # Game logic
      combat.js           # CombatEngine: mastery + scaling formulas, effects processing
      state.js            # GameState: run lifecycle, rooms, damage, rest mechanic
      deck.js             # Deck class: draw/discard/hand (MAX_HAND=5)
      dungeon.js          # DungeonEngine: dungeon-specific logic
      hub.js              # HubEngine: market/deck/safehouse operations
      card.js             # Card class constructor
      worldmap.js         # WorldMap engine: grid, fog of war, POI, fast travel
    system/               # Cross-cutting systems
      i18n.js             # Translation system (~60 keys EN/RU), t(), applyTranslations()
      save.js             # SaveSystem: localStorage persistence
      audio.js            # AudioSystem
    ui/                   # UI rendering modules
      grid.js             # GridUI: dungeon grid, damage numbers, hints
      hand.js             # HandUI: player hand card display
      hub.js              # HubUI: market/deck/safehouse panels
      hud.js              # HUD: HP, armor, stamina, gold
      worldmap.js         # WorldMapUI: world map rendering

  server/                 # Express backend
    index.js              # API: /api/cards (GET/POST/DELETE), /api/enemies (GET/PUT)
    data/
      cards.json          # Remote card data (Docker volume: cards-data)
      enemies.json        # Enemy definitions

  admin/                  # Admin panel SPA (~45KB HTML)
    index.html            # Card editor, enemy deck composer, drag-drop reorder

  assets/images/          # PWA icons (192x192, 512x512 PNG)
  tests/engine/           # Vitest tests (6 files: card, combat, deck, dungeon, hub, state)
```

---

## Core Systems

### Character Classes (`js/data/classes.js`)
Four classes with distinct stats (STR, AGI, INT, WIL, VIT), starting decks, and artifacts:
- **Warrior** — Iron Belt (+2 armor/room). High STR/VIT.
- **Mage** — Tome (first card free/turn). High INT/WIL.
- **Rogue** — Rogue's Cloak (+draw on kill). High AGI.
- **Beggar** — No artifact, all stats 1. Hard mode.

### Combat Engine (`js/engine/combat.js`)
Effects-based system with mastery + scaling formula:
- **Mastery**: `Clamp(EffectiveStat / RequiredStat, 0.30, 1.00)` (min 30%)
- **Scaling Bonus**: `max(0, EffectiveStat - RequiredStat) * Scaling`
- Supports hybrid stat weights (`{ STR: 0.8, WIL: 0.2 }`) and tag-based modifiers from artifacts/room state.

Cards define an `effects[]` array processed in order. ~14+ action types (damage, armor, heal, stamina, debuffs, buffs, exploration, enemy control).

### Dungeon Flow (`js/engine/state.js`, `js/data/dungeon.js`)
- Sequential dungeons with 1-5 rooms (random), 4x5 grid per room
- Cell types: enemy, item, exit, empty, treasure
- Reveal costs -5 stamina; no passive regen
- Rest between rooms: restore stamina OR skip for cumulative gold bonus (+3/skip)
- Boss runs (1 room) from world map dungeon type

### Enemy System (`js/data/enemies.js`)
9 enemy types across 3 tiers with own card decks. Each enemy draws up to maxHand(2) and plays random cards per tick. `_firstTurn` delay prevents instant attack on reveal.

| Tier | Enemies | HP Range |
|------|---------|----------|
| 1 | Rat, Skeleton, Ghost, Slime | 3-6 |
| 2 | Wolf, Orc, Demon | 7-10 |
| 3 | Dragon, Lich | 12-15 |

### World Map (`js/engine/worldmap.js`, `js/ui/worldmap.js`)
Grid-based world map with fog of war (hidden/visible/explored, radius 1), Points of Interest (graces, chests, boss entrances, dungeons), step movement, and Fast Travel via activated Graces.

### Hub System (`js/engine/hub.js`, `js/ui/hub.js`)
Four panels: Black Market (buy cards), Deck/Storage (manage deck/collection), Safehouse (upgrades), Enter Dungeon.

---

## Data Flow

```
Admin Editor → POST /api/cards → Express (:4000) → cards.json (Docker volume)
                                              ↓
PWA Game ← GET /api/cards ←─── loadRemoteCards() → PLAYER_CARDS

Player saves → SaveSystem.save() → localStorage ('patientRogue_save')
```

---

## PWA Update Mechanism
Fetches `VERSION?nocache=...` from network, compares with localStorage. Shows update banner on mismatch. User clicks "Update" to unregister SW, clear caches, reload.

---

## Key Design Decisions (AGENTS.md)
- HTTPS via Let's Encrypt (not Cloudflare Tunnel)
- Effects-based combat engine — no per-card-ID switch cases
- Active deck max 5 cards; hand survives escape (→ collection), lost on death
- Exit door always in grid from generation
- i18n via `data-i18n` HTML attributes and `t()` JS calls
- Enemy AI: tick system, each revealed enemy draws/plays random card per player action
