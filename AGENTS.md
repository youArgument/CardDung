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
  - Implemented “tick after each player action” by calling `advanceWorldTick()` after actions.
  - Implemented “exit requires second click”: exit triggers only when the door is already revealed and clicked again (`js/main.js`).
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
  - Hand size limit is 5 cards (`MAX_HAND = 5` in `js/engine/deck.js`).
  - Starting hand draw matches deck/menu settings (draw count updated in `js/engine/state.js`).
  - “Item after reveal” flow:
    - Items no longer auto-collect during reveal.
    - Clicking a revealed item cell collects it into the player hand as a card-like object (`collectItemAsCard` in `js/engine/state.js`).
    - `js/main.js` renders and updates hand/grid after collection.
    - Item cards can be used later via `useDungeonItemCard(itemCard)`.

- Enemy interaction rules
  - Enemies respond after each player action via `advanceWorldTick()` -> `enemiesAttack()`.
  - Implemented base hit for clicking already revealed enemies without a hand attack card.
  - Added a “miss” behavior when stamina is 0:
    - Clicking a revealed enemy with insufficient stamina applies 0 damage (visual hit) but still counts as an action tick (enemies react).
  - Added DOM/model safety for enemy detection because UI can re-render mid-flow:
    - Enemy base hit checks both `cell.card.type === enemy` and DOM class `enemy-card`.

- Debugging
  - Added console debug logs in `js/main.js` to diagnose why revealed enemy clicks might not apply base damage.

- Containerization
  - Docker build updated and verified by running `docker compose up -d --build` after code changes.

### Current Repository Structure
```
.
├─ AGENTS.md                      # This file (agent notes)
├─ Dockerfile
├─ docker-compose.yml
├─ server/
│  ├─ Dockerfile
│  ├─ index.js
│  ├─ package.json
│  └─ package-lock.json
├─ index.html
├─ manifest.json
├─ package.json
├─ package-lock.json
├─ sw.js
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
- `js/main.js`: binds UI events (click/touch/drag), handles dungeon-grid click flow, base-hit/miss logic, and calls `advanceWorldTick()` after player actions.
- `js/engine/state.js`: run lifecycle, reveal logic, item collection into hand, and stamina rules.
- `js/engine/dungeon.js`: dungeon generation / reveal rules / enemy placement.
- `js/engine/combat.js`: play-card effects and stamina costs.
- `js/ui/*`: rendering of grid cards, hand cards, and HUD.
