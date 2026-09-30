# Handoff — Riviera wedding map (Eva & Josh)

**Repo:** https://github.com/rambam613/riviera-map-preview  
**Owner GitHub:** `rambam613`  
**Couple:** Eva Lash & Josh Danial · wedding **19 September 2027** · Palm Beach Cannes (Espace Alain Delon)  
**Local path (Grok box):** `/workspace/riviera-map-preview/`  
**Run:** `node server.js` → **http://127.0.0.1:3850**  
**Cache-bust:** `?v=panorama11` on CSS/JS/asset links  

---

## Where we left off (2026-09-30)

1. Home panorama is clean; airport-pack props are **not** on the home board.
2. Click **Nice** or **Nice Airport** (Edit positions **Off**) → `#airportScene` with `nice-airport-scene.png` + travel stickers.
3. Edit mode: drag move + corner resize + gold halo; layout in `localStorage` `riviera-layout-v1`.
4. **Final landmark coordinates may still be only in the user’s browser** — if they paste Copy layout JSON, write it into `LAYOUT` + HTML `data-*` and bump cache-bust.
5. Girls-in-car assets excluded forever (local `_archive_excluded/`, gitignored).
6. Repo pushed so another agent can clone and continue.

---

## Product rules (do not regress)

| Do | Don’t |
|----|--------|
| Full `panorama-base.png` as home stage | Use labeled `map.png` as interactive base |
| Cutouts hover-lift; gold **silhouette** halo on landmarks | Old floating halo rings over geography |
| Quiet masthead typography | Dark title chip / ◆ pill |
| Airport travel assets **only** inside Nice Airport scene | Overlay train/palms/bags/lemon/SUV on home |
| Exclude girls-in-car cutouts | Re-add Fiat with girls |

---

## Architecture

| Path | Role |
|------|------|
| `server.js` | Static server, port **3850** |
| `public/index.html` | Board, landmarks (`data-id` / `data-left` / `data-top` / `data-w`), `#airportScene` |
| `public/app.js` | `LAYOUT`, `PLACES`, drag/resize, airport open/close, `RivieraBoard.*` |
| `public/styles.css` | Board, gold halo, edit HUD, airport scene |
| `public/assets/` | All PNGs (see inventory below) |
| `scripts/knockout.py` | Black → transparent |
| `README.md` | Short run notes |
| `HANDOFF.md` | This file |

### JS API (`window.RivieraBoard`)
- `getLayout()` → `{ id: {left, top, w}, ... }` (% of `.board`)
- `exportLayout()` → clipboard + console `LAYOUT` snippet
- `clearSavedLayout()` → wipe `localStorage` + reload defaults
- `setPos(id, left, top, w)` → nudge one landmark

### Open airport scene
`AIRPORT_SCENE_IDS = {"nice", "nice-airport"}` when edit mode is off. Close: X, Escape, backdrop.

---

## Default LAYOUT (% of `.board`)

```js
const LAYOUT = {
  cannes:           { left: 0,  top: 58, w: 13 },
  "jw-marriott":    { left: 0,  top: 38, w: 11 },
  "palm-beach":     { left: 4,  top: 52, w: 16 },
  antibes:          { left: 45, top: 40, w: 16 },
  "nice-airport":   { left: 74, top: 34, w: 14 },
  nice:             { left: 78, top: 20, w: 18 },
  "saint-emilion":  { left: 27, top: 72, w: 10 },
};
```

Geography intent: Cannes cluster left tip; Antibes center peninsula; Nice right bay; airport near Nice; Saint-Émilion secondary in water.

---

## Place copy (`PLACES` in app.js)

| id | Title | Kicker |
|----|--------|--------|
| jw-marriott | JW Marriott | Welcome · Cannes |
| palm-beach | Palm Beach Cannes | Celebration |
| cannes | Cannes | The coastline |
| antibes | Antibes | Day escape |
| nice-airport | Nice Airport | Arrivals · Côte d'Azur |
| nice | Nice | Promenade & arrival |
| saint-emilion | Saint-Émilion | Guest weekend vignette |

---

## Asset inventory (`public/assets/`)

**~54 MB total · all committed to `main`.** Clone the repo to get binaries; GitHub web may not preview every large PNG inline.

### Home stage / base
| File | Role |
|------|------|
| `panorama-base.png` | **Primary home background** (full Riviera watercolor) |
| `panorama-texture.png` | Alternate / texture (same family as base) |
| `map.png` | Labeled coast reference — **not** the interactive stage |

### Home landmarks (interactive stickers)
| File | Landmark id |
|------|-------------|
| `cannes.png` | cannes |
| `jw-marriott.png` | jw-marriott |
| `palm-beach.png` | palm-beach |
| `antibes.png` | antibes |
| `nice.png` | nice |
| `nice-airport.png` | nice-airport (terminal sticker on home) |
| `saint-emilion.png` | saint-emilion |

### Home ambient (on panorama)
| File | Role |
|------|------|
| `plane.png` | Drifting plane (restored original; not airport-pack plane) |
| `plane-old.png` | Backup of original plane |
| `yacht.png` | Ambient yacht |
| `sailboat-a.png` / `sailboat-b.png` | Ambient sailboats |
| `seagull-1.png` … `seagull-5.png` / `seagulls.png` | Gulls |

### Nice Airport scene (click-through only)
| File | Role |
|------|------|
| `nice-airport-scene.png` | **Scene background** |
| `airplane.png` | Prop |
| `train.png` | Prop |
| `suv.png` | Prop |
| `suitcases.png` | Prop |
| `woven-bag.png` | Prop |
| `palms.png` | Prop |
| `lemon.png` | Prop |
| `sailboat-airport.png` | Prop |

Wired in `#airportScene .airport-props` in `index.html`.

### Available but not wired on home (OK to use in airport scene / later)
| File | Notes |
|------|--------|
| `train-men.png` | Men in train windows — allowed (not the excluded girls) |

### Raw / source (knockout inputs & crops)
| Path | Notes |
|------|--------|
| `_raw_*.png` | Pre-knockout landmark/ambient sources |
| `_raw/airport-spritesheet.png` | Airport pack sheet |
| `_raw/nice-airport-scene.png` | Scene source |
| `_raw/_raw_*.png` | Cropped sheet pieces before knockout |
| `_raw/_previews/` | Debug JPG grids/crops (optional) |

### Explicitly excluded (not in git)
| Item | Why |
|------|-----|
| Girls Fiat / car-with-two-women | User: do not use |
| Local `_archive_excluded/_EXCLUDED_girls-car.png` | Gitignored |

---

## Related work (other folders / repos — not this map)

| Item | Location |
|------|----------|
| Palm Beach venue negotiation brief | `/workspace/palm-beach-brief/PALM_BEACH_NEGOTIATION_BRIEF_FOR_GROK.md` (draft only; don’t send) |
| Oratory Critic PWA | `/workspace/oratory-coach/` · port 3847 · needs real OpenAI key |
| Wedding site (separate) | GitHub `rambam613/wedding` |

Venue notes (context only): July Nolaan ~€30k + VAT hire vs Sept devis €70k HT hire block; planner Oana Nechifor (`ciao@oanaevents.it`); kosher Les Délices de Salomé. Don’t invent Thierry or missing Jean-Rémy production PDF.

---

## Standing prefs for Josh

- Wedding money in **€**
- Draft email/social; **don’t send** unless explicitly asked
- Map: cutouts animate; panorama is geographic stage; airport detail is click-through

---

## Suggested next steps

1. User finishes drag/resize → **Copy layout** → lock JSON into `LAYOUT` + `data-*` → bump to `panorama12`.
2. Polish airport prop placement / optional captions inside scene.
3. Wire remaining narrative panels for other cities the same pattern as Nice Airport if desired.
4. Deploy (GitHub Pages / static host) when layout is locked.
