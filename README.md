# ch3s

Encode any file or text into legal chess games (PGN) and decode it back — losslessly.

## How it works

Each chess position has some number `N` of legal moves, so a single move can carry
`floor(log2(N))` bits of information: read that many bits from the input as an integer
index into the **deterministically ordered** legal moves, and play that move. Decoding
replays the game and recovers each move's index, reconstructing the bit stream.

Because both sides order legal moves identically (by UCI string), the codec is
**symmetric and lossless for any byte sequence** — no retries, fallbacks, or
character-fix tables. File length is recorded in the PGN headers so the final
partial byte is truncated exactly.

```
backend/                  bun + express REST API
  src/
    index.ts              entry — boots the server
    app.ts                builds the express app (no listener; testable)
    config.ts             port / size limits (env-overridable)
    routes/               encode.ts, decode.ts
    utils/                http.ts — request/response helpers
    algorithms/           encode.ts, decode.ts, util.ts — the codec (framework-free)
  tests/                  roundtrip.test.ts

frontend/                 vite + react + tailwind UI
  index.html
  src/
    main.tsx              entry
    App.tsx               layout + tab state
    index.css             tailwind
    components/           Tabs, EncodePanel, DecodePanel, ui (shared primitives)
    lib/                  api, useAsync, download
```

## Run it

Two terminals, from the repo root:

```bash
# backend  → http://localhost:3001
cd backend && bun install && bun run dev

# frontend → http://localhost:3000
cd frontend && bun install && bun run dev
```

Open http://localhost:3000.

The frontend reads the backend URL from `VITE_API_URL` (defaults to
`http://localhost:3001`).

## Codec tests

```bash
cd backend && bun install
bun run tests/roundtrip.test.ts
```

Covers every byte value 0–255, the historically buggy strings (`hai`, `i`,
`details?`, all special chars), and random binary blobs.

## API

| Method | Path      | Body                                              | Returns |
| ------ | --------- | ------------------------------------------------- | ------- |
| POST   | `/encode` | `{ "text": "..." }` or raw `application/octet-stream` | `{ pgn, byteLength, gameCount, checksum }` |
| POST   | `/decode` | `{ "pgn": "..." }`                                | `{ base64, text, byteLength, checksumOk }` |
| GET    | `/health` | —                                                 | `{ ok: true }` |

## Deploy (Vercel)

Deploy `backend/` and `frontend/` as **two separate Vercel projects** (set each
one's Root Directory accordingly in the import step).

**Backend** — runs the Express app as a serverless function via
[`backend/api/index.ts`](backend/api/index.ts); [`backend/vercel.json`](backend/vercel.json)
rewrites every path to it, so `/encode`, `/decode`, and `/health` work unchanged.
No env vars required. Note its deployed URL.

**Frontend** — auto-detected Vite static build ([`frontend/vercel.json`](frontend/vercel.json)
adds the SPA rewrite). Set one environment variable to point it at the backend:

```
VITE_API_URL = https://<your-backend>.vercel.app
```

(see [`frontend/.env.example`](frontend/.env.example)). Redeploy the frontend
after setting it, since Vite inlines env vars at build time.

> Vercel builds with Node (not Bun) — the app code is plain Node/Express, so this
> is fine. `bun run dev` is only for local development.

## License

[Apache License 2.0](LICENSE) © abhinav gautam
