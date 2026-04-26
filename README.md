# Hermes Trismegistus

**Alchemical Master NanoClaw Agent** — daily ephemeris forecasts, herbal & alchemical wisdom, personal notes and reminders.

## Features

- **Alchemical Oracle** — Ask about herbs, metals, planetary correspondences, and the Great Work. Claude answers by citing primary sources: Paracelsus, Culpeper, the Emerald Tablet, Jakob Böhme, Michael Maier, John Gerard.
- **Daily 07:00 Forecast** — A cron job fires every morning with real ephemeris data (astronomia) and sends a narrated alchemical forecast via `mcp__nanoclaw__send_message`.
- **Notes** — Store personal notes via REST API.
- **Reminders** — Schedule reminders delivered via NanoClaw at the specified time.
- **Knowledge Base** — SQLite database seeded with 6 primary alchemical/herbal texts.

## Quick Start

```bash
cp .env.example .env
# Fill in ANTHROPIC_API_KEY (required)
# Fill in LOCUS_API_KEY and NANOCLAW_MCP_URL for NanoClaw integration

npm install
npm run build
npm start
```

Or for development:

```bash
npm run dev
```

Visit `http://localhost:8080` for the UI.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude API key for Q&A and forecast narration |
| `LOCUS_API_KEY` | No | Locus API key |
| `NANOCLAW_MCP_URL` | No | NanoClaw MCP endpoint URL for sending messages |
| `TZ` or `TIMEZONE` | No | Timezone for cron jobs (default: UTC) |
| `CLAUDE_MODEL` | No | Claude model ID (default: claude-haiku-4-5-20251001) |
| `DB_PATH` | No | Path to SQLite database (default: ./hermes.db) |
| `PORT` | No | HTTP port (default: 8080) |

## REST API

### Chat

```bash
POST /api/chat
{ "question": "What are the properties of sulfur in the Great Work?" }
# Returns: { "answer": "..." }
```

### Ephemeris

```bash
GET /api/ephemeris
# Returns: sun, moon, planets with zodiac positions + alchemical meanings
```

### Knowledge Base

```bash
GET /api/texts
# Returns list of all primary source texts in the knowledge base
```

### Notes

```bash
POST /api/notes    { "title": "Calcination experiment", "body": "..." }
GET /api/notes
DELETE /api/notes/:id
```

### Reminders

```bash
POST /api/reminders  { "title": "Check the vessel", "body": "...", "deliver_at": "2026-04-27T07:00:00Z" }
GET /api/reminders          # pending only
GET /api/reminders?all=true # all including delivered
```

## Knowledge Base

The SQLite knowledge base (`hermes.db`) is seeded with excerpts from:

| Author | Work | Year |
|--------|------|------|
| Paracelsus | Archidoxis Magica | 1570 |
| Nicholas Culpeper | The Complete Herbal | 1653 |
| Hermes Trismegistus | Emerald Tablet (Tabula Smaragdina) | c. 8th century CE |
| Jakob Böhme | Aurora (Morgenröte im Aufgang) | 1612 |
| Michael Maier | Atalanta Fugiens | 1618 |
| John Gerard | Herball or Generall Historie of Plantes | 1597 |

## Deployment (Locus)

```bash
# Authenticate with Locus
TOKEN=$(curl -s -X POST https://beta-api.buildwithlocus.com/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "'$LOCUS_API_KEY'"}' | jq -r '.token')

# Deploy from GitHub repo
curl -s -X POST https://beta-api.buildwithlocus.com/v1/projects/from-repo \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/YOUR_ORG/hermes",
    "name": "hermes-trismegistus"
  }'
```

Or push to Locus git remote — see BUILD_SKILL.md for the full workflow.

Service URL pattern: `https://svc-{id}.buildwithlocus.com`

## Architecture

```
src/
├── server.ts      Express HTTP server, routes
├── db.ts          SQLite schema + knowledge base seeding + CRUD
├── agent.ts       Claude integration, NanoClaw MCP tool call
├── ephemeris.ts   Planetary positions via astronomia
└── cron.ts        node-cron jobs (07:00 forecast, 5-min reminders)
```

## The Tradition

> *"True, without falsehood, certain and most true: that which is above is the same as that which is below."*
> — Hermes Trismegistus, Emerald Tablet
