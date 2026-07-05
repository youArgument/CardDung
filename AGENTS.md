## Agent Notes (MVP)

### Project Goal
CardDung is a browser dungeon crawler where the player reveals dungeon cells and uses cards from hand to interact with enemies/items/exit doors. The MVP focuses on consistent click/drag behavior, stamina-based costs, per-action tick reactions from enemies, sequential multi-room dungeons, and i18n (EN/RU).

### What was done (so far)
- UI/interaction fixes
  - Removed negative `gap` in `css/style.css` for `.hand-container` to fix hand overlap.
  - Removed `transform: scale` on `.dungeon-card:hover` to stabilize stacking/hover and click targeting.
  - Prevented unintended auto-plays by coordinating click vs drag on hand (touch/click synthesis).
  - Ensured click handling on the dungeon grid uses `closest('.dungeon-card')`.

- Dungeon flow correctness
  - Disabled auto-reveal of the start cell in `js/engine/state.js` (`startRoom`).
  - Removed manual-mode reveal gating that blocked progression.
  - Implemented "tick after each player action" by calling `advanceWorldTick()` after actions.
  - Guaranteed at least one exit card per dungeon via `js/data/dungeon.js` (replaces one empty cell with an exit).

- Stamina-based mechanics
  - Stamina is the gating resource for all actions (card costs checked against `player.stamina`).
  - Reveal costs `-5` stamina. Combat deducts stamina when playing cards.
  - No passive stamina regen in `startNewTurn()`.

- Hand/cards rules
  - Hand size limit: 5 cards (`Deck.MAX_HAND = 5`).
  - Items don't auto-collect on reveal; clicking a revealed item cell collects it into hand (`collectItemAsCard`).
  - Item cards used via `useDungeonItemCard(itemCard)`.

- Enemy interaction rules
  - Enemies respond after each player action via `advanceWorldTick()` → `enemiesAttack()`.
  - Base hit for clicking revealed enemies (1 stamina, fixed damage).
  - "Miss" at 0 stamina: visual hit but 0 damage, still triggers enemy tick.

- Containerization
  - Docker build verified with `docker compose up -d --build` after code changes.

### What was done (v0.1.10 — bugs, PWA, HTTPS)
- Bug fixes (code audit)
  - Fixed mobile tap: added `touchend` handler on grid (`js/main.js`).
  - Fixed duplicate `case 'draw':` in `useDungeonItemCard`.
  - Fixed Set serialization in `SaveSystem.save()`.
  - Added null guards, removed dead code, replaced deprecated `substr` with `slice`.
  - Converted dead energy mechanic to stamina throughout.
  - Fixed `-0` damage display on miss; fixed damage number positioning (`getBoundingClientRect`).

- App versioning
  - `VERSION` file (semver), auto-incremented by Dockerfile on each build.
  - Version displayed on menu screen.

- PWA update notifications
  - VERSION-check scheme: fetches `VERSION?nocache=...` from network, compares with localStorage.
  - Banner button: unregisters SW → clears all caches → removes localStorage key → reload (`js/main.js`).
  - SW cache name bumped to `patient-rogue-v8` to force fresh asset cache on update.

- HTTPS + Nginx + Let's Encrypt
  - Domain: `game.you-argument.ru` → `95.31.141.194`.
  - Certificate expires 02.10.2026. Nginx redirects HTTP→HTTPS, proxies to `carddung:3000`.

### What was done (v0.1.15 — UI, deck limit, hand→collection)
- UI improvements
  - Fixed grid scroll, single-row hand (no fan), HUB button centered top, removed END TURN.
  - Removed player portrait, star-bar, energy/floor badges from dungeon HUD.

- Deck limit: 5 cards max. Default: `['strike', 'strike', 'defend', 'defend', 'bash']`.

- Hand→collection transfer on escape; hand lost on death.

### What was done (v0.1.37 — sequential dungeons, i18n)
- Sequential dungeon system (1–5 rooms)
  - `state.js`: `totalRooms` = 1–5, `revealedEnemiesCount` tracker, `isLastRoom()` helper.
  - Exit door already in grid from generation; player can find it at any time by exploring.
  - After all revealed enemies defeated: `onAllEnemiesDefeated()` updates progress bar (no auto-reveal of door).
  - Clicking exit door:
    - Last room → auto-victory (`onVictory()`, reward screen) — no popup.
    - Non-last room → popup "Next Room" / "To Hub".
  - Exit door is the primary goal in each room; enemies don't need to be defeated to leave.

- i18n (EN/RU)

- i18n (EN/RU)
  - `js/system/i18n.js`: translation dict (~60 keys), `t(key, ...args)` with string interpolation.
  - Language selector buttons on menu screen (`btn-lang-en`, `btn-lang-ru`).
  - All UI strings use `data-i18n` attributes in HTML or `t()` calls in JS.
  - Language persisted in localStorage; switching re-renders all screens instantly.

### Current Repository Structure
```
.
├─ AGENTS.md                      # This file (agent notes)
├─ Dockerfile                     # Auto-increments VERSION on build
├─ docker-compose.yml
├─ nginx.Dockerfile, nginx.conf   # HTTPS + Let's Encrypt
├─ bump-version.mjs, VERSION      # Version management
├─ server/                        # Express server (Dockerized)
├─ index.html                     # All screens with data-i18n attributes
├─ manifest.json                  # PWA manifest (icon cache-busting ?v=2)
├─ sw.js                          # Service Worker (patient-rogue-v8, offline fallback)
├─ vitest.config.js
├─ assets/images/                 # PWA icons (192, 512)
├─ css/style.css                  # All styles including .lang-selector
├─ js/
│  ├─ data/                      # cards.js, dungeon.js, enemies.js, upgrades.js
│  ├─ engine/                    # card.js, combat.js, deck.js, dungeon.js, hub.js, state.js
│  ├─ system/                    # audio.js, save.js, i18n.js (EN/RU translations)
│  └─ ui/                        # grid.js, hand.js, hub.js, hud.js
├─ tests/engine/                  # card, combat, deck, dungeon, hub, state tests (66 total)
└─ .gitignore                     # excludes node_modules/, certs/
```

### Where the main gameplay logic lives
- `js/main.js`: UI events (click/touch/drag), dungeon-grid flow, base-hit/miss, exit popup, sequential room transitions, PWA update check, language switching.
- `js/engine/state.js`: run lifecycle, reveal costs stamina, item collection, `revealedEnemiesCount`, `isLastRoom()`, `advanceRoom()` → next room or exit door.
- `js/engine/dungeon.js`: grid generation with guaranteed exit card per room.
- `js/engine/combat.js`: play-card effects and stamina costs.
- `js/system/i18n.js`: translation system, `t()`, `applyTranslations()`.
- `js/ui/*`: rendering of grid cards, hand cards, HUD (with i18n integration).

### Deployment
- Manual: bump local `VERSION` → `docker compose up -d --build` (Docker auto-increments patch).
- Server VERSION always > local due to Dockerfile auto-increment.
- Phone PWA: fetches network VERSION vs localStorage → shows banner if different → user clicks "Обновить" → SW unregistered, caches cleared, reload.
- `https://game.you-argument.ru` — public HTTPS URL (Let's Encrypt).

### Key Decisions
- Let's Encrypt over Cloudflare Tunnel for production HTTPS.
- PWA update: VERSION-check via localStorage; SW cache name bumps force fresh assets.
- Exit door always in grid from generation, findable at any time; popup only on click.
- Sequential dungeons: 1–5 rooms, exit popup adapts to room state.
- i18n: `data-i18n` attributes for static HTML, `t()` calls for dynamic JS strings.
- Active Deck limit: 5 cards. Hand survives escape (→collection), lost on death.
