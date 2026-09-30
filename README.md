# Riviera map preview (Eva & Josh)

Interactive Côte d’Azur wedding invitation map for **Eva Lash & Josh Danial** (19 Sep 2027, Palm Beach Cannes).

## Run locally

```bash
node server.js
```

Open **http://127.0.0.1:3850** (cache-bust query on assets is currently `?v=panorama11`).

## What it is

- Full-bleed `public/assets/panorama-base.png` as the home stage.
- Landmark stickers (Cannes, JW Marriott, Palm Beach, Antibes, Nice, Nice Airport, Saint-Émilion) with gold silhouette halo; hover lift; drag + resize in **Edit positions**.
- Layout persistence: `localStorage` key `riviera-layout-v1`. Helpers: `RivieraBoard.getLayout()`, `.exportLayout()`, `.clearSavedLayout()`, `.setPos()`.
- **Click Nice or Nice Airport** (Edit positions Off) → `#airportScene` detail with `nice-airport-scene.png` background and travel props (plane, train, SUV, suitcases, bag, palms, lemon, sailboat). Close: X / Escape / outside click.
- Do **not** put airport-pack props on the home panorama; they belong only in the Nice Airport scene.
- Girls-in-car assets are excluded on purpose (`_archive_excluded/` locally, gitignored).

## Key paths

| Path | Role |
|------|------|
| `public/index.html` | Markup, landmark `data-*`, airport scene shell |
| `public/app.js` | LAYOUT, drag/resize, airport open/close |
| `public/styles.css` | Board, gold halo, edit HUD |
| `public/assets/` | Panorama + landmark PNGs (black knocked out) |
| `scripts/knockout.py` | Black → transparent helper |
| `server.js` | Static server on port 3850 |

## Notes for the next agent

- User places landmarks by dragging/resizing; use **Copy layout** / paste JSON to lock coords into HTML + `LAYOUT`.
- Prefer silhouette gold glow on cutouts, not floating map rings.
- Wedding figures in €; drafts only unless asked to send.
