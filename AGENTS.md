## Agent Notes (MVP)

### Project Goal
CardDung is a browser dungeon crawler where the player reveals dungeon cells and uses cards from hand to interact with enemies/items/exit doors. The MVP focuses on consistent click/drag behavior, stamina-based costs, and per-action tick reactions from enemies.

### What was done (so far)
- UI/interaction fixes
  - Removed negative `gap` in `css/style.css` for `.hand-container` to fix hand overlap.
  - Removed `transform: scale` on `.dungeon-card:hover` to stabilize stacking/hover and click targeting.
  - Prevented unintended auto-plays by coordinating click vs drag on hand (touch/click synthesis).
  - Ensured click handling on the dungeon grid uses `closest('.dungeon-card')`.

- Dungeon flow correctness
  - Disabled auto-reveal of the start cell in `js/engine/state.js` (`startRoom`).
  - Removed manual-mode reveal gating that blocked progression (removed `DungeonEngine.canReveal(run)` from `js/main.js`).
  - Made `END TURN` a no-op (no auto-attack / no auto-advance).
  - Implemented "tick after each player action" by calling `advanceWorldTick()` after actions.
  - Implemented "exit requires second click": exit triggers only when the door is already revealed and clicked again (`js/main.js`).
  - Guaranteed at least one exit card per dungeon via `js/data/dungeon.js` (replaces one empty cell with an exit).
  - Added room progress bar and increased total rooms per run (`totalRooms` in `js/engine/state.js`, and UI updates).

- Stamina-based mechanics
  - Stamina is now the gating resource for actions (card costs are checked against `player.stamina` instead of `energy`).
  - `js/engine/state.js`: reveal costs stamina (`-5`) on reveal.
  - `js/engine/combat.js`: stamina costs are deducted when playing applicable cards.
  - `js/engine/state.js`: `startNewTurn()` no longer regenerates stamina/energy.
  - `js/ui/hud.js` / `js/engine/hub.js`: updated compatibility for stamina/energy UI and logic.
  - Updated tests to match stamina behavior.

- Hand/cards rules
  - Hand size limit is 5 cards (`Deck.MAX_HAND = 5` in `js/engine/deck.js`).
  - Starting hand draw matches deck/menu settings (draw count updated in `js/engine/state.js`).
  - "Item after reveal" flow:
    - Items no longer auto-collect during reveal.
    - Clicking a revealed item cell collects it into the player hand as a card-like object (`collectItemAsCard` in `js/engine/state.js`).
    - `js/main.js` renders and updates hand/grid after collection.
    - Item cards can be used later via `useDungeonItemCard(itemCard)`.

- Enemy interaction rules
  - Enemies respond after each player action via `advanceWorldTick()` -> `enemiesAttack()`.
  - Implemented base hit for clicking already revealed enemies without a hand attack card.
  - Added a "miss" behavior when stamina is 0:
    - Clicking a revealed enemy with insufficient stamina applies 0 damage (visual hit) but still counts as an action tick (enemies react).
  - Added DOM/model safety for enemy detection because UI can re-render mid-flow:
    - Enemy base hit checks both `cell.card.type === enemy` and DOM class `enemy-card`.

- Containerization
  - Docker build updated and verified by running `docker compose up -d --build` after code changes.

### What was done (v0.1.10 — bugs, PWA, HTTPS)
- Bug fixes (code audit)
  - Fixed mobile tap on enemy: added `touchend` handler on grid (`js/main.js`) alongside `click` to avoid click-synthesis delays on smartphones.
  - Fixed duplicate `case 'draw':` in `useDungeonItemCard` switch (`js/main.js`).
  - Fixed `cardsDiscovered` (Set) serialization in `SaveSystem.save()` — replaced `{...state.stats}` with explicit field copy (`js/system/save.js`).
  - Added null guard in `GridUI.renderRevealedCard` (`js/ui/grid.js`).
  - Removed dead code: `goBtn` variable, `canPlay` variable (energy-based), `start` variable in dungeon generation, duplicate `updateHub()` in `HubUI`, empty merge-check `if` block, all `console.debug` statements.
  - Replaced hardcoded `5` with `Deck.MAX_HAND` constant (`js/engine/state.js`, `js/engine/deck.js`).
  - Replaced deprecated `substr` with `slice` in `Card` uuid generation (`js/engine/card.js`).
  - Added null-safe `setText` helper in `HUD.update()` (`js/ui/hud.js`).
  - Converted dead energy mechanic to stamina: `case 'energy'` in combat, `case 'maxEnergy'` in item handler, `energy_up` dungeon item (`js/engine/combat.js`, `js/main.js`, `js/data/enemies.js`).
  - Fixed `-0` damage display on miss: skip `showDamage` when amount <= 0 (`js/main.js`, `js/ui/grid.js`).
  - Fixed damage number positioning: replaced `offsetLeft/Top` with `getBoundingClientRect` + `position: fixed` (`js/ui/grid.js`, `css/style.css`).
  - Updated combat test to match energy→stamina conversion (`tests/engine/combat.test.js`).

- App versioning
  - Added `VERSION` file (semver, e.g. `0.1.0`).
  - `Dockerfile` auto-increments patch version on each build.
  - `bump-version.mjs` increments local VERSION after deploy.
  - `npm run deploy` runs `docker compose up -d --build && node bump-version.mjs`.
  - Version displayed on menu screen (`index.html`, `js/main.js`, `css/style.css`).

- PWA update notifications
  - Native SW update scheme: `updatefound` → `statechange` → show banner → `postMessage('SKIP_WAITING')` → `controllerchange` → `reload()` (`js/main.js`, `sw.js`).
  - SW listens for `SKIP_WAITING` message and calls `skipWaiting()` (`sw.js`).
  - Update banner in HTML with CSS animation (`index.html`, `css/style.css`).

- HTTPS + Nginx + Let's Encrypt
  - Added Nginx reverse proxy (`nginx.Dockerfile`, `nginx.conf`, `nginx-http.conf`).
  - Added certbot service to `docker-compose.yml` with Docker volumes for certificate persistence.
  - Domain: `game.you-argument.ru` → `95.31.141.194`.
  - Let's Encrypt certificate obtained (expires 02.10.2026).
  - Nginx redirects HTTP→HTTPS and proxies to `carddung:3000`.

### Current Repository Structure
```
.
├─ AGENTS.md                      # This file (agent notes)
├─ Dockerfile
├─ docker-compose.yml
├─ nginx.Dockerfile               # Nginx reverse proxy with Let's Encrypt
├─ nginx.conf                     # Nginx HTTPS config
├─ nginx-http.conf                # Nginx HTTP-only (for certbot challenge)
├─ bump-version.mjs               # Auto-increment VERSION after deploy
├─ VERSION                        # App version (auto-incremented)
├─ server/
│  ├─ Dockerfile
│  ├─ index.js
│  ├─ package.json
│  └─ package-lock.json
├─ index.html
├─ manifest.json
├─ package.json
├─ package-lock.json
├─ sw.js                          # Service Worker (PWA caching + update detection)
├─ vitest.config.js
├─ assets/
│  └─ images/
│     ├─ icon-192.png
│     └─ icon-512.png
├─ css/
│  └─ style.css
├─ js/
│  ├─ data/
│  │  ├─ cards.js
│  │  ├─ dungeon.js
│  │  ├─ enemies.js
│  │  └─ upgrades.js
│  ├─ engine/
│  │  ├─ card.js
│  │  ├─ combat.js
│  │  ├─ deck.js
│  │  ├─ dungeon.js
│  │  ├─ hub.js
│  │  └─ state.js
│  ├─ system/
│  │  ├─ audio.js
│  │  └─ save.js
│  └─ ui/
│     ├─ grid.js
│     ├─ hand.js
│     ├─ hub.js
│     └─ hud.js
├─ tests/
│  └─ engine/
│     ├─ card.test.js
│     ├─ combat.test.js
│     ├─ deck.test.js
│     ├─ dungeon.test.js
│     ├─ hub.test.js
│     └─ state.test.js
└─ (other project files as needed)
```

### Where the main gameplay logic lives
- `js/main.js`: binds UI events (click/touch/drag), handles dungeon-grid click flow, base-hit/miss logic, SW registration + update detection, and calls `advanceWorldTick()` after player actions.
- `js/engine/state.js`: run lifecycle, reveal logic, item collection into hand, and stamina rules.
- `js/engine/dungeon.js`: dungeon generation / reveal rules / enemy placement.
- `js/engine/combat.js`: play-card effects and stamina costs.
- `js/ui/*`: rendering of grid cards, hand cards, and HUD.

### Deployment
- `npm run deploy` — builds all Docker services, increments VERSION, starts containers.
- `https://game.you-argument.ru` — public HTTPS URL (Let's Encrypt, auto-renew needed before expiry).
- PWA update: SW detects new version via `updatefound`, shows banner, user clicks "Обновить" → `skipWaiting` → reload.
- `.gitignore` excludes `node_modules/` and `certs/`.

### Key Decisions
- Chose Let's Encrypt over Cloudflare Tunnel for production HTTPS.
- Replaced VERSION-check-in-SW with native PWA `updatefound` + `skipWaiting` scheme (standard PWA pattern).
- Two-step Nginx: HTTP-only for certbot challenge, then HTTPS with certificate.
