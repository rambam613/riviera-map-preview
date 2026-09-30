# Riviera map preview (Eva & Josh)

Interactive Côte d’Azur wedding invitation map for **Eva Lash & Josh Danial** (19 Sep 2027, Palm Beach Cannes).

## Run

```bash
node server.js
```

Open **http://127.0.0.1:3850** (cache-bust `?v=panorama11`).

## Full handoff (assets + data)

**Read [HANDOFF.md](./HANDOFF.md)** — complete asset inventory (~54 MB under `public/assets/`), default `LAYOUT`, place copy, airport click-through rules, and where we left off.

All map PNGs are committed on `main` under `public/assets/` (landmarks, panorama base, Nice Airport scene + props, ambient boats/gulls, raw sources). Clone the repo to get them; do not expect a text-only handoff prompt to embed binaries.

## Quick rules

- Home = panorama + landmark stickers only (gold halo, drag/resize in Edit positions).
- Click **Nice** / **Nice Airport** → airport scene; airport travel props live **there**, not on the home map.
- No girls-in-car assets.
