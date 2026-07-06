import express from 'express';
import { nanoid } from 'nanoid';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CARDS_PATH = join(__dirname, 'data', 'cards.json');
const ENEMIES_PATH = join(__dirname, 'data', 'enemies.json');

const app = express();
app.use(express.json());

// CORS for local dev (nginx handles prod)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// No-cache for card data — always fresh.
app.use('/api/cards', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  next();
});

function readCards() {
  try {
    const raw = readFileSync(CARDS_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeCards(cards) {
  writeFileSync(CARDS_PATH, JSON.stringify(cards, null, 2), 'utf8');
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// ===== CARDS API =====
app.get('/api/cards', (_req, res) => {
  res.json(readCards());
});

app.post('/api/cards', (req, res) => {
  const cards = readCards();
  const body = req.body;
  if (!body.id) return res.status(400).json({ error: 'id is required' });

  const existingIdx = cards.findIndex(c => c.id === body.id);
  if (existingIdx !== -1) {
    cards[existingIdx] = body;
  } else {
    cards.push(body);
  }
  writeCards(cards);
  res.json({ ok: true, card: body });
});

app.delete('/api/cards/:id', (req, res) => {
  const cards = readCards();
  const filtered = cards.filter(c => c.id !== req.params.id);
  if (filtered.length === cards.length) {
    return res.status(404).json({ error: 'card not found' });
  }
  writeCards(filtered);
  res.json({ ok: true });
});

// ===== ENEMIES API =====
function readEnemies() {
  try {
    const raw = readFileSync(ENEMIES_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeEnemies(enemies) {
  writeFileSync(ENEMIES_PATH, JSON.stringify(enemies, null, 2), 'utf8');
}

app.get('/api/enemies', (_req, res) => {
  res.json(readEnemies());
});

// Update deckTemplate for a specific enemy.
app.put('/api/enemies/:id/deck', (req, res) => {
  const enemies = readEnemies();
  const { deckTemplate } = req.body;
  if (!Array.isArray(deckTemplate)) return res.status(400).json({ error: 'deckTemplate must be array' });

  const idx = enemies.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'enemy not found' });

  enemies[idx].deckTemplate = deckTemplate;
  writeEnemies(enemies);
  res.json({ ok: true, enemy: enemies[idx] });
});

// MVP: placeholders. Next step: move authoritative engine here.
app.post('/api/game/start-run', (_req, res) => {
  const runId = nanoid();
  res.json({ runId, state: { screen: 'dungeon', run: null } });
});

app.get('/api/game/state', (req, res) => {
  res.json({ runId: req.query.runId ?? null, state: { screen: 'dungeon', run: null } });
});

app.post('/api/game/action', (req, res) => {
  const { runId } = req.body ?? {};
  res.json({ runId: runId ?? null, state: { screen: 'dungeon', run: null } });
});

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`carddung-server listening on :${port}`);
});
