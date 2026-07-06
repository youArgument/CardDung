# 🗺️ Global World Map System (Grid + Fog + POI + Fast Travel)

## 🎯 Цель системы

Реализовать глобальную карту мира для карточной/пошаговой игры с:
- плиточным ландшафтом (GridMatrix)
- объектами мира (WorldObjects / POI)
- пошаговым перемещением (4-direction step movement)
- системой тумана войны (Fog of War)
- системой “Благодатей” (Graces) и быстрым перемещением (Fast Travel)
- мобильным UI (portrait-first, centered camera)

---

# 🧱 1. Архитектура данных

## 1.1 GridMatrix (основной слой мира)

Каждая клетка представляет тайл карты.

```ts
type FogState = 'hidden' | 'visible' | 'explored'

type GridCell = {
  r: number
  c: number

  biomeId: string

  walkable: boolean
  collision: boolean

  fog: FogState
}
1.2 WorldObjects (POI слой)

Объекты накладываются поверх сетки и НЕ хранятся внутри grid.

type WorldObjectType =
  | 'grace'
  | 'chest'
  | 'boss_entrance'
  | 'dungeon'

type WorldObject = {
  id: string

  r: number
  c: number

  type: WorldObjectType
  name: string

  isActive: boolean

  meta: Record<string, any>
}
1.3 GameState (runtime)
type GameState = {
  playerPos: { r: number; c: number }

  teleportMode: boolean

  activeGraceId: string | null
}
🧭 2. Система перемещения (Step Movement)
2.1 Правила движения
только 4 направления (вверх/вниз/влево/вправо)
1 клетка за шаг
нельзя ходить в collision / non-walkable клетки
2.2 Проверка хода

function canMove(from, to, grid): boolean {
  const dr = Math.abs(from.r - to.r)
  const dc = Math.abs(from.c - to.c)

  if (dr + dc !== 1) return false

  const cell = grid[to.r][to.c]
  if (!cell) return false

  return cell.walkable && !cell.collision
}
2.3 Движение игрока
function movePlayer(state, newPos, grid) {
  if (!canMove(state.playerPos, newPos, grid)) return state

  updateFog(state.playerPos, newPos, grid)

  state.playerPos = newPos
  return state
}
🌫️ 3. Система Тумана Войны (Fog of War)
3.1 Состояния
hidden — никогда не видели
visible — сейчас в радиусе обзора
explored — уже видели ранее
3.2 Инициализация карты
for (const row of grid) {
  for (const cell of row) {
    cell.fog = 'hidden'
  }
}
3.3 Обновление тумана
function updateFog(oldPos, newPos, grid) {
  revealArea(oldPos, 1, grid, 'explored')
  revealArea(newPos, 1, grid, 'visible')
}
3.4 Радиус обзора
function revealArea(pos, radius, grid, mode = 'visible') {
  for (let dr = -radius; dr <= radius; dr++) {
    for (let dc = -radius; dc <= radius; dc++) {

      if (Math.abs(dr) + Math.abs(dc) > radius) continue

      const cell = grid[pos.r + dr]?.[pos.c + dc]
      if (!cell) continue

      cell.fog = mode
    }
  }
}
🧿 4. POI взаимодействия
4.1 Логика взаимодействия
function interact(cell, object, state) {
  if (!object) return
Chest
  if (object.type === 'chest') {
    openChest(object.meta)
  }
Boss
  if (object.type === 'boss_entrance') {
    enterBossFight(object.meta)
  }
Grace
  if (object.type === 'grace') {
    if (!object.isActive) {
      object.isActive = true
      state.activeGraceId = object.id
    }
  }
}
⚡ 5. Fast Travel (Teleport Mode)
5.1 Включение режима
state.teleportMode = true
5.2 Логика клика
function onCellClick(cell, object, state, grid) {

  // отмена режима при клике мимо активных graces
  if (state.teleportMode && (!object || object.type !== 'grace')) {
    state.teleportMode = false
    return
  }

  // телепорт
  if (
    state.teleportMode &&
    object?.type === 'grace' &&
    object.isActive
  ) {
    state.playerPos = { r: object.r, c: object.c }
    state.teleportMode = false

    updateFog(state.playerPos, state.playerPos, grid)
    return
  }

  // обычное взаимодействие
  interact(cell, object, state)
}
📱 6. UI / Camera System (Mobile-first)
6.1 Ограничения UI
portrait mode
max width: 450px
карта всегда центрируется на игроке
6.2 Camera follow
function updateCamera(playerPos, tileSize, screen) {
  return {
    x: playerPos.c * tileSize - screen.width / 2,
    y: playerPos.r * tileSize - screen.height / 2
  }
}
6.3 Центровка
каждый шаг = камера пересчитывается
игрок всегда в центре экрана
👆 7. Input System
7.1 Tap rules
Action	Result
tap соседняя клетка	move
tap на себя + POI	interact
tap active grace	enter teleport mode
tap grace (teleport mode)	teleport
🧩 8. Архитектурные правила (ВАЖНО)
❌ НЕ делать:
POI внутри grid
fog внутри player
UI содержит логику мира
✅ ДЕЛАТЬ:
grid = мир
objects = overlay
state = игрок
UI = отображение
🚀 9. Расширения (future systems)

Можно добавить позже:

биомы с разными правилами движения
туман с line-of-sight (raycast vision)
враги на карте (world encounters)
автогенерация POI
события на вход в клетку
мини-данжи вместо экранов
🧠 Итог

Эта система заменяет:

классические данжи
линейные карты
отдельные сцены перемещения

И даёт:
👉 единый живой мир
👉 стратегическое перемещение
👉 исследование через fog of war
👉 быстрые перемещения через graces