import express from 'express';
import { nanoid } from 'nanoid';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
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
