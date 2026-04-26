import * as dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import { initDb, addNote, listNotes, deleteNote, addReminder, listReminders, getAllTexts } from "./db";
import { chat } from "./agent";
import { getEphemeris, formatForecastText } from "./ephemeris";
import { initCrons } from "./cron";

const app = express();
app.use(express.json());
const PORT = process.env.PORT ?? 8080;

// ─────────────────────────────────────────────────────────────
// GET /  — landing page
// ─────────────────────────────────────────────────────────────

app.get("/", (_req: Request, res: Response) => {
  const ephem = getEphemeris();
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Hermes Trismegistus — Alchemical Oracle</title>
  <style>
    :root {
      --bg: #0a0a0f;
      --surface: #12121e;
      --border: #1e1e3a;
      --gold: #c9a227;
      --violet: #8b5cf6;
      --text: #e8e0d0;
      --muted: #6b6080;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--bg); color: var(--text); font-family: 'Georgia', serif; min-height: 100vh; }
    header { background: linear-gradient(180deg, #0f0f20 0%, #0a0a14 100%); border-bottom: 1px solid var(--border); padding: 32px 40px; text-align: center; }
    .sigil { font-size: 3rem; margin-bottom: 12px; }
    h1 { font-size: 1.8rem; color: var(--gold); letter-spacing: 0.05em; margin-bottom: 4px; }
    .subtitle { font-size: 0.85rem; color: var(--muted); letter-spacing: 0.1em; text-transform: uppercase; }
    .container { max-width: 900px; margin: 0 auto; padding: 40px 24px; }
    .section { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 28px; margin-bottom: 28px; }
    .section-title { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--muted); margin-bottom: 20px; }
    .ephem-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .ephem-item { background: rgba(0,0,0,0.3); border-radius: 8px; padding: 12px; }
    .ephem-label { font-size: 0.65rem; text-transform: uppercase; color: var(--muted); margin-bottom: 4px; }
    .ephem-value { font-size: 0.95rem; color: var(--gold); font-family: monospace; }
    .ephem-sub { font-size: 0.72rem; color: #a08060; margin-top: 3px; }
    .chat-area { display: flex; flex-direction: column; gap: 16px; }
    .chat-input-row { display: flex; gap: 10px; }
    textarea {
      flex: 1; background: rgba(0,0,0,0.4); border: 1px solid var(--border); border-radius: 8px;
      padding: 12px; color: var(--text); font-family: 'Georgia', serif; font-size: 0.9rem;
      resize: vertical; min-height: 80px;
    }
    textarea:focus { outline: none; border-color: rgba(201,162,39,0.5); }
    button {
      background: linear-gradient(135deg, #7c3aed, #5b21b6);
      border: none; border-radius: 8px; color: #fff; padding: 12px 24px;
      font-family: 'Georgia', serif; cursor: pointer; transition: opacity 0.15s;
      align-self: flex-end;
    }
    button:hover { opacity: 0.9; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .response-box {
      background: rgba(0,0,0,0.4); border: 1px solid rgba(201,162,39,0.2);
      border-radius: 8px; padding: 20px; font-size: 0.9rem; line-height: 1.7;
      white-space: pre-wrap; display: none;
    }
    .loading { color: var(--muted); font-style: italic; }
    .sources-section { margin-top: 24px; }
    .texts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
    .text-card { background: rgba(0,0,0,0.3); border: 1px solid var(--border); border-radius: 8px; padding: 14px; }
    .text-author { font-size: 0.85rem; font-weight: bold; color: var(--gold); }
    .text-work { font-size: 0.75rem; color: var(--text); margin-top: 3px; }
    .text-meta { font-size: 0.65rem; color: var(--muted); margin-top: 4px; }
    .api-list { font-size: 0.82rem; line-height: 2; }
    .api-list code { background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px; font-family: monospace; color: var(--gold); }
  </style>
</head>
<body>
<header>
  <div class="sigil">⚗</div>
  <h1>Hermes Trismegistus</h1>
  <div class="subtitle">Thrice-Greatest · Alchemical Oracle · NanoClaw Agent</div>
</header>
<div class="container">

  <div class="section">
    <div class="section-title">Today's Celestial Positions · ${ephem.date}</div>
    <div class="ephem-grid">
      <div class="ephem-item">
        <div class="ephem-label">☉ Sol</div>
        <div class="ephem-value">${ephem.sun.degree}°${ephem.sun.minutes}' ${ephem.sun.sign}</div>
        <div class="ephem-sub">Gold · Heart · Vital Fire</div>
      </div>
      <div class="ephem-item">
        <div class="ephem-label">☽ Luna · ${ephem.moon.phase}</div>
        <div class="ephem-value">${ephem.moon.degree}°${ephem.moon.minutes}' ${ephem.moon.sign}</div>
        <div class="ephem-sub">Silver · Brain · The Vessel</div>
      </div>
      ${ephem.planets
        .map(
          (p) =>
            `<div class="ephem-item">
        <div class="ephem-label">${p.name}</div>
        <div class="ephem-value">${p.degree}°${p.minutes}' ${p.sign}</div>
      </div>`
        )
        .join("")}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Consult the Oracle</div>
    <div class="chat-area">
      <div class="chat-input-row">
        <textarea id="question" placeholder="Ask about herbs, metals, planetary correspondences, the Great Work..."></textarea>
      </div>
      <button id="askBtn" onclick="askOracle()">Ask Hermes</button>
      <div class="response-box" id="response"></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Primary Sources — Knowledge Base</div>
    <div class="texts-grid" id="texts-grid">Loading…</div>
  </div>

  <div class="section">
    <div class="section-title">REST API</div>
    <div class="api-list">
      <code>POST /api/chat</code> — Ask an alchemical question · body: { question, history? }<br>
      <code>GET /api/ephemeris</code> — Current planetary positions<br>
      <code>GET /api/texts</code> — List knowledge base sources<br>
      <code>POST /api/notes</code> — Add a note · body: { title, body }<br>
      <code>GET /api/notes</code> — List all notes<br>
      <code>DELETE /api/notes/:id</code> — Delete a note<br>
      <code>POST /api/reminders</code> — Add a reminder · body: { title, body, deliver_at }<br>
      <code>GET /api/reminders</code> — List pending reminders<br>
      <code>GET /health</code> — Health check
    </div>
  </div>

</div>
<script>
  async function askOracle() {
    const q = document.getElementById('question').value.trim();
    if (!q) return;
    const btn = document.getElementById('askBtn');
    const resp = document.getElementById('response');
    btn.disabled = true;
    resp.style.display = 'block';
    resp.className = 'response-box loading';
    resp.textContent = 'The Oracle contemplates…';
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ question: q })
      });
      const data = await r.json();
      resp.className = 'response-box';
      resp.textContent = data.answer ?? data.error ?? 'No response';
    } catch(e) {
      resp.className = 'response-box';
      resp.textContent = 'Error: ' + e.message;
    } finally {
      btn.disabled = false;
    }
  }

  document.getElementById('question').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) askOracle();
  });

  fetch('/api/texts').then(r => r.json()).then(data => {
    const grid = document.getElementById('texts-grid');
    if (!data.texts || !data.texts.length) { grid.textContent = 'None'; return; }
    grid.innerHTML = data.texts.map(t =>
      '<div class="text-card">'
      + '<div class="text-author">' + t.author + '</div>'
      + '<div class="text-work">' + t.work + '</div>'
      + '<div class="text-meta">' + t.year + ' · ' + t.category + '</div>'
      + '</div>'
    ).join('');
  }).catch(() => {});
</script>
</body>
</html>`;
  res.send(html);
});

// ─────────────────────────────────────────────────────────────
// GET /health
// ─────────────────────────────────────────────────────────────

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", agent: "hermes-trismegistus", version: "1.0.0" });
});

// ─────────────────────────────────────────────────────────────
// POST /api/chat — consult the oracle
// ─────────────────────────────────────────────────────────────

app.post("/api/chat", async (req: Request, res: Response) => {
  const { question, history } = req.body as {
    question?: string;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
  };

  if (!question) {
    res.status(400).json({ error: "question is required" });
    return;
  }

  try {
    const answer = await chat(question, history ?? []);
    res.json({ answer });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Chat] Error:", message);
    res.status(500).json({ error: message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/ephemeris — current planetary positions
// ─────────────────────────────────────────────────────────────

app.get("/api/ephemeris", (_req: Request, res: Response) => {
  try {
    const ephem = getEphemeris();
    const text = formatForecastText(ephem);
    res.json({ ...ephem, forecastText: text });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/texts — knowledge base index
// ─────────────────────────────────────────────────────────────

app.get("/api/texts", (_req: Request, res: Response) => {
  const texts = getAllTexts();
  res.json({ texts });
});

// ─────────────────────────────────────────────────────────────
// Notes endpoints
// ─────────────────────────────────────────────────────────────

app.post("/api/notes", (req: Request, res: Response) => {
  const { title, body } = req.body as { title?: string; body?: string };
  if (!title || !body) {
    res.status(400).json({ error: "title and body are required" });
    return;
  }
  const id = addNote(title, body);
  res.status(201).json({ id, title, body });
});

app.get("/api/notes", (_req: Request, res: Response) => {
  const notes = listNotes();
  res.json({ notes });
});

app.delete("/api/notes/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "invalid id" });
    return;
  }
  const deleted = deleteNote(id);
  if (!deleted) {
    res.status(404).json({ error: "note not found" });
    return;
  }
  res.json({ deleted: true });
});

// ─────────────────────────────────────────────────────────────
// Reminders endpoints
// ─────────────────────────────────────────────────────────────

app.post("/api/reminders", (req: Request, res: Response) => {
  const { title, body, deliver_at } = req.body as {
    title?: string;
    body?: string;
    deliver_at?: string;
  };

  if (!title || !body || !deliver_at) {
    res.status(400).json({ error: "title, body, and deliver_at are required" });
    return;
  }

  // Validate deliver_at is a valid ISO date
  const date = new Date(deliver_at);
  if (isNaN(date.getTime())) {
    res.status(400).json({ error: "deliver_at must be a valid ISO date string" });
    return;
  }

  const id = addReminder(title, body, date.toISOString());
  res.status(201).json({ id, title, body, deliver_at: date.toISOString() });
});

app.get("/api/reminders", (req: Request, res: Response) => {
  const includeDelivered = req.query.all === "true";
  const reminders = listReminders(includeDelivered);
  res.json({ reminders });
});

// ─────────────────────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────────────────────

initDb();
initCrons();

app.listen(PORT, () => {
  console.log(`\n⚗ Hermes Trismegistus running on http://localhost:${PORT}`);
  console.log(`  ANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY ? "set ✓" : "NOT SET ✗"}`);
  console.log(`  LOCUS_API_KEY=${process.env.LOCUS_API_KEY ? "set ✓" : "NOT SET"}`);
  console.log(`  NANOCLAW_MCP_URL=${process.env.NANOCLAW_MCP_URL ?? "not set (forecasts will log only)"}`);
  console.log(`  TZ=${process.env.TZ ?? process.env.TIMEZONE ?? "UTC"}\n`);
});
