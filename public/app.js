/* Côte d'Azur · Eva & Josh — sprite invitation board */

const STORAGE_KEY = "riviera-layout-v1";
const MIN_LANDMARK_WIDTH = 6;
const MAX_LANDMARK_WIDTH = 40;

/** Landmarks that open the Nice Airport detail scene instead of the caption. */
const AIRPORT_SCENE_IDS = new Set(["nice-airport"]);

/** Default layout (% of .board). */
const LAYOUT = {
  cannes:           { left: 0,  top: 58, w: 13 },
  "jw-marriott":    { left: 0,  top: 38, w: 11 },
  "palm-beach":     { left: 4,  top: 52, w: 16 },
  antibes:          { left: 45, top: 40, w: 16 },
  "nice-airport":   { left: 74, top: 34, w: 14 },
  "saint-emilion":  { left: 27, top: 72, w: 10 },
};

const PLACES = {
  "jw-marriott": {
    title: "JW Marriott",
    kicker: "Welcome · Cannes",
    story:
      "The weekend begins here — quiet light through glass and palms, champagne on the terrace, and that first long look at the Mediterranean.",
  },
  "palm-beach": {
    title: "Palm Beach Cannes",
    kicker: "Celebration",
    story:
      "At the tip of the Croisette, where the jetty meets open water. Dinner under soft lanterns, the sea close enough to hear.",
  },
  cannes: {
    title: "Cannes",
    kicker: "The coastline",
    story:
      "Morning walks along the Croisette, espresso in hand, bougainvillea over pale stone — beaches and the easy rhythm of late September.",
  },
  antibes: {
    title: "Antibes",
    kicker: "Day escape",
    story:
      "Ochre walls and a harbour full of masts. Ramparts, market flowers, and a long lunch in the shade.",
  },
  "nice-airport": {
    title: "Nice Airport",
    kicker: "Arrivals · Côte d'Azur",
    story:
      "Touch down by the sea — palms at the terminal, the mountains behind, and the short ride into Nice beginning just beyond the runway.",
  },
  "saint-emilion": {
    title: "Saint-Émilion",
    kicker: "Guest weekend vignette",
    story:
      "Limestone lanes, quiet vineyards, and a glass raised to the long road that brought everyone here.",
  },
};

const board = document.getElementById("board");
const stage = document.getElementById("stage");
const caption = document.getElementById("caption");
const captionKicker = document.getElementById("captionKicker");
const captionTitle = document.getElementById("captionTitle");
const captionStory = document.getElementById("captionStory");
const captionClose = document.getElementById("captionClose");
const hint = document.getElementById("hint");
const editToggle = document.getElementById("editToggle");
const editStatus = document.getElementById("editStatus");
const copyLayoutButton = document.getElementById("copyLayout");
const restoreRemovedButton = document.getElementById("restoreRemoved");
const landmarks = Array.from(document.querySelectorAll(".landmark"));
const airportScene = document.getElementById("airportScene");
const airportSceneClose = document.getElementById("airportSceneClose");
const airportSceneBackdrop = document.getElementById("airportSceneBackdrop");

let openId = null;
let airportOpen = false;
let hintTimer = null;
let editMode = true;
let suppressClick = false;
let dragState = null;
let currentLayout = {};

function numberOr(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function round(value, places = 2) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function cloneLayout(layout) {
  return Object.fromEntries(
    Object.entries(layout).map(([id, pos]) => [id, {
      left: numberOr(pos.left, 0),
      top: numberOr(pos.top, 0),
      w: numberOr(pos.w, 18),
      ...(pos.hidden ? { hidden: true } : {}),
    }]),
  );
}

function readSavedLayout() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved || typeof saved !== "object") return null;
    const result = {};
    landmarks.forEach((el) => {
      const pos = saved[el.dataset.id];
      if (!pos || typeof pos !== "object") return;
      const fallback = LAYOUT[el.dataset.id] || {};
      const left = Number(pos.left);
      const top = Number(pos.top);
      const w = Number(pos.w);
      if ([left, top, w].every(Number.isFinite)) {
        result[el.dataset.id] = { left, top, w, ...(pos.hidden ? { hidden: true } : {}) };
      } else if (fallback.left != null && fallback.top != null && fallback.w != null) {
        result[el.dataset.id] = { ...fallback };
      }
    });
    return Object.keys(result).length ? result : null;
  } catch (error) {
    console.warn("RivieraBoard: saved layout could not be read", error);
    return null;
  }
}

function getBaseLayout() {
  const base = {};
  landmarks.forEach((el) => {
    const id = el.dataset.id;
    const fallback = LAYOUT[id] || { left: 10, top: 10, w: 18 };
    base[id] = {
      left: numberOr(el.dataset.left, fallback.left),
      top: numberOr(el.dataset.top, fallback.top),
      w: numberOr(el.dataset.w, fallback.w),
    };
  });
  return base;
}

function getLayout() {
  const result = {};
  landmarks.forEach((el) => {
    const id = el.dataset.id;
    const pos = currentLayout[id] || {};
    result[id] = {
      left: round(numberOr(pos.left, parseFloat(el.style.left) || 0)),
      top: round(numberOr(pos.top, parseFloat(el.style.top) || 0)),
      w: round(numberOr(pos.w, parseFloat(getComputedStyle(el).getPropertyValue("--w")) || 18)),
      ...(pos.hidden ? { hidden: true } : {}),
    };
  });
  return result;
}

function saveLayout() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getLayout()));
  } catch (error) {
    console.warn("RivieraBoard: layout could not be saved", error);
  }
}

function updatePositionReadout(el) {
  const readout = el.querySelector(".landmark-readout");
  if (!readout) return;
  const pos = currentLayout[el.dataset.id] || {};
  readout.textContent = `L ${round(pos.left).toFixed(2)}% · T ${round(pos.top).toFixed(2)}% · W ${round(pos.w).toFixed(2)}%`;
}

function positionResizeHandle(el) {
  const handle = el.querySelector(".resize-handle");
  const image = el.querySelector("img");
  if (!handle || !image) return;

  // Keep the handle on the image corner, rather than on the label below it.
  handle.style.top = `${Math.max(0, image.offsetTop + image.offsetHeight - 10)}px`;
}

function ensurePositionReadouts() {
  landmarks.forEach((el) => {
    if (!el.querySelector(".landmark-readout")) {
      const readout = document.createElement("span");
      readout.className = "landmark-readout";
      readout.setAttribute("aria-hidden", "true");
      el.appendChild(readout);
    }
    if (!el.querySelector(".remove-handle")) {
      const remove = document.createElement("span");
      remove.className = "remove-handle";
      remove.setAttribute("aria-hidden", "true");
      remove.title = "Remove from map";
      remove.textContent = "×";
      el.appendChild(remove);
    }
    if (!el.querySelector(".resize-handle")) {
      const handle = document.createElement("span");
      handle.className = "resize-handle";
      handle.setAttribute("aria-hidden", "true");
      handle.title = "Drag to resize";
      el.appendChild(handle);
    }
    positionResizeHandle(el);
  });
}

function applyLayout(layout = currentLayout) {
  currentLayout = cloneLayout(layout);
  landmarks.forEach((el) => {
    const id = el.dataset.id;
    const pos = currentLayout[id] || { left: 10, top: 10, w: 18 };
    el.dataset.left = String(pos.left);
    el.dataset.top = String(pos.top);
    el.dataset.w = String(pos.w);
    el.style.left = `${pos.left}%`;
    el.style.top = `${pos.top}%`;
    el.style.setProperty("--w", `${pos.w}%`);
    el.hidden = Boolean(pos.hidden);
    updatePositionReadout(el);
    positionResizeHandle(el);
  });
}

function setEditMode(next) {
  editMode = Boolean(next) && isOwner;
  stage.classList.toggle("edit-mode", editMode);
  editToggle.setAttribute("aria-pressed", String(editMode));
  editStatus.textContent = editMode ? "On" : "Off";
  editToggle.title = editMode ? "Turn off position editing" : "Turn on position editing";
  if (editMode) {
    closeCaption();
    closeAirportScene();
  } else {
    landmarks.forEach((el) => el.classList.remove("is-selected"));
  }
}

function placeCaptionNear(el) {
  const stageRect = stage.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const gap = 12;
  let left = r.right - stageRect.left + gap;
  let top = r.top - stageRect.top + r.height * 0.15;

  caption.hidden = false;
  const cw = caption.offsetWidth || 280;
  const ch = caption.offsetHeight || 140;

  if (left + cw > stageRect.width - 16) left = r.left - stageRect.left - cw - gap;
  if (left < 12) left = 12;
  if (top + ch > stageRect.height - 16) top = stageRect.height - ch - 16;
  if (top < 12) top = 12;

  caption.style.left = `${left}px`;
  caption.style.top = `${top}px`;
  caption.style.right = "auto";
  caption.style.bottom = "auto";
  caption.style.transform = "none";
}

function openCaption(id, el) {
  const place = PLACES[id];
  if (!place || editMode || airportOpen) return;

  openId = id;
  landmarks.forEach((landmark) => landmark.classList.toggle("is-open", landmark.dataset.id === id));
  captionKicker.textContent = place.kicker;
  captionTitle.textContent = place.title;
  captionStory.textContent = place.story;
  placeCaptionNear(el);

  if (hint) {
    hint.classList.add("is-hidden");
    clearTimeout(hintTimer);
  }
}

function closeCaption() {
  openId = null;
  landmarks.forEach((el) => el.classList.remove("is-open"));
  caption.hidden = true;
}

function openAirportScene() {
  if (!airportScene) return;
  closeCaption();
  airportOpen = true;
  airportScene.hidden = false;
  stage.classList.add("airport-open");
  landmarks.forEach((el) => {
    el.classList.toggle("is-open", AIRPORT_SCENE_IDS.has(el.dataset.id));
  });
  if (hint) {
    hint.classList.add("is-hidden");
    clearTimeout(hintTimer);
  }
  airportSceneClose?.focus?.();
}

function closeAirportScene() {
  if (!airportScene) return;
  airportOpen = false;
  airportScene.hidden = true;
  stage.classList.remove("airport-open");
  landmarks.forEach((el) => {
    if (AIRPORT_SCENE_IDS.has(el.dataset.id)) el.classList.remove("is-open");
  });
}

function setHidden(id, hidden) {
  const pos = currentLayout[id];
  if (!pos) return;
  if (hidden) pos.hidden = true;
  else delete pos.hidden;
  applyLayout(currentLayout);
  saveLayout();
  syncRestoreButton();
}

function syncRestoreButton() {
  const n = Object.values(currentLayout).filter((pos) => pos.hidden).length
    + Object.values(propLayout).filter((pos) => pos.hidden).length;
  restoreRemovedButton.hidden = n === 0;
  restoreRemovedButton.textContent = `Restore removed (${n})`;
}

function updateDragPosition(e) {
  if (!dragState || e.pointerId !== dragState.pointerId) return;
  const { el, offsetX, offsetY } = dragState;
  const boardRect = board.getBoundingClientRect();
  const stickerWidth = el.getBoundingClientRect().width;
  const stickerHeight = el.getBoundingClientRect().height;
  const maxX = Math.max(0, boardRect.width - stickerWidth);
  const maxY = Math.max(0, boardRect.height - stickerHeight);
  const x = Math.min(maxX, Math.max(0, e.clientX - boardRect.left - offsetX));
  const y = Math.min(maxY, Math.max(0, e.clientY - boardRect.top - offsetY));
  const pos = currentLayout[el.dataset.id];

  pos.left = round((x / boardRect.width) * 100);
  pos.top = round((y / boardRect.height) * 100);
  el.style.left = `${pos.left}%`;
  el.style.top = `${pos.top}%`;
  el.dataset.left = String(pos.left);
  el.dataset.top = String(pos.top);
  updatePositionReadout(el);
  dragState.moved = true;
}

function updateResize(e) {
  if (!dragState || e.pointerId !== dragState.pointerId) return;
  const { el, startX, startW } = dragState;
  const boardRect = board.getBoundingClientRect();
  const pos = currentLayout[el.dataset.id];
  const deltaPercent = ((e.clientX - startX) / boardRect.width) * 100;
  const maxWidth = Math.min(MAX_LANDMARK_WIDTH, Math.max(MIN_LANDMARK_WIDTH, 100 - pos.left));
  pos.w = round(Math.min(maxWidth, Math.max(MIN_LANDMARK_WIDTH, startW + deltaPercent)));
  el.dataset.w = String(pos.w);
  el.style.setProperty("--w", `${pos.w}%`);
  positionResizeHandle(el);
  updatePositionReadout(el);
  dragState.moved = true;
}

function finishDrag(e) {
  if (!dragState || (e && e.pointerId !== dragState.pointerId)) return;
  const { el } = dragState;
  if (e && el.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
  el.classList.remove("is-dragging", "is-resizing");
  el.classList.add("is-selected");
  if (dragState.moved) {
    suppressClick = true;
    saveLayout();
    window.setTimeout(() => { suppressClick = false; }, 0);
  }
  dragState = null;
}

landmarks.forEach((el) => {
  el.addEventListener("pointerdown", (e) => {
    if (!editMode || e.button !== 0) return;
    e.preventDefault();
    closeCaption();
    closeAirportScene();
    landmarks.forEach((landmark) => landmark.classList.remove("is-selected"));
    if (e.target.closest?.(".remove-handle")) {
      setHidden(el.dataset.id, true);
      return;
    }
    const resizeHandle = e.target.closest?.(".resize-handle");
    const rect = el.getBoundingClientRect();
    if (resizeHandle) {
      dragState = {
        el,
        mode: "resize",
        pointerId: e.pointerId,
        startX: e.clientX,
        startW: currentLayout[el.dataset.id].w,
        moved: false,
      };
      el.classList.add("is-resizing", "is-selected");
    } else {
      dragState = {
        el,
        mode: "move",
        pointerId: e.pointerId,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        moved: false,
      };
      el.classList.add("is-dragging", "is-selected");
    }
    el.setPointerCapture?.(e.pointerId);
    updatePositionReadout(el);
  });

  el.addEventListener("pointermove", (e) => {
    if (dragState?.el !== el) return;
    if (dragState.mode === "resize") updateResize(e);
    else updateDragPosition(e);
  });

  el.addEventListener("pointerup", (e) => {
    if (dragState?.el === el) finishDrag(e);
  });

  el.addEventListener("pointercancel", (e) => {
    if (dragState?.el === el) finishDrag(e);
  });

  el.addEventListener("click", (e) => {
    e.preventDefault();
    if (suppressClick || editMode) return;
    const id = el.dataset.id;
    if (AIRPORT_SCENE_IDS.has(id)) {
      if (airportOpen) closeAirportScene();
      else openAirportScene();
      return;
    }
    if (openId === id) closeCaption();
    else openCaption(id, el);
  });
});

captionClose.addEventListener("click", (e) => {
  e.stopPropagation();
  closeCaption();
});

airportSceneClose?.addEventListener("click", (e) => {
  e.stopPropagation();
  closeAirportScene();
});

airportSceneBackdrop?.addEventListener("click", (e) => {
  e.stopPropagation();
  closeAirportScene();
});

editToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  setEditMode(!editMode);
});

restoreRemovedButton.addEventListener("click", (e) => {
  e.stopPropagation();
  Object.keys(currentLayout).forEach((id) => delete currentLayout[id].hidden);
  applyLayout(currentLayout);
  saveLayout();
  Object.values(propLayouts).forEach((layout) => Object.values(layout).forEach((pos) => delete pos.hidden));
  applyProps();
  saveProps();
  syncRestoreButton();
});

copyLayoutButton.addEventListener("click", (e) => {
  e.stopPropagation();
  window.RivieraBoard.exportLayout();
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (airportOpen) {
    closeAirportScene();
    return;
  }
  if (openId) closeCaption();
});

document.addEventListener("click", (e) => {
  if (airportOpen) return;
  if (!openId) return;
  if (e.target.closest(".landmark") || e.target.closest(".caption") || e.target.closest(".board-controls")) return;
  closeCaption();
});

window.addEventListener("resize", () => {
  if (!openId || airportOpen) return;
  const el = landmarks.find((landmark) => landmark.dataset.id === openId);
  if (el) placeCaptionNear(el);
});

ensurePositionReadouts();
const savedLayout = readSavedLayout();
applyLayout(savedLayout ? { ...getBaseLayout(), ...savedLayout } : getBaseLayout());
/* ---- Airport scene props: same move / resize / × editing as the map icons ----
   Positions are % of #airportProps, which fills .airport-stage — a box with the
   painting's own 1672×941 aspect that covers the panel. So left/top/w are % of the
   PAINTING and stay glued to it on any screen. Landscape and portrait screens frame
   the painting differently (portrait shows ≈ x39–64%), so each has its own layout.
   Painting map: sky y0–48 · terminal x7–40 y50–61 · apron y61–68 · runway x40–72 y57–62 ·
   viaduct road (30,76)→(65,64) · rail line (36,86)→(65,76) · bay x62–92 y58–84 ·
   foreground foliage y>82. */
const PROP_KEY = "riviera-airport-v2";
const PORTRAIT_QUERY = window.matchMedia("(max-width: 720px), (max-aspect-ratio: 1/1)");
const PROP_LAYOUT = {
  landscape: {
    // Close-up vignette: too big to sit in the scene, so off by default (Restore removed brings it back).
    "train-men": { left: 1,    top: 80.6, w: 22, hidden: true },
    train:       { left: 50.6, top: 72.2, w: 12.8 },  // on the painted rails, over the small painted train
    suv:         { left: 39.6, top: 72.0, w: 5.2 },   // on the viaduct road, angled with it
    suitcases:   { left: 34.2, top: 59.6, w: 5.4 },   // open apron by the jet bridges, clear of the palms
  },
  portrait: {
    "train-men": { left: 39.5, top: 88.4, w: 13, hidden: true },
    train:       { left: 50.6, top: 72.2, w: 12.8 },
    suv:         { left: 40.8, top: 71.2, w: 4.4 },
    suitcases:   { left: 44.2, top: 62.4, w: 5.4 },
  },
};
const airportProps = document.getElementById("airportProps");
const props = Array.from(document.querySelectorAll(".airport-prop"));
const propLayouts = JSON.parse(JSON.stringify(PROP_LAYOUT));
try {
  const saved = JSON.parse(localStorage.getItem(PROP_KEY) || "null");
  if (saved) {
    Object.keys(propLayouts).forEach((mode) => {
      Object.keys(propLayouts[mode]).forEach((id) => {
        if (saved[mode]?.[id]) propLayouts[mode][id] = saved[mode][id];
      });
    });
  }
} catch (error) { /* private mode: defaults */ }
const propOrientation = () => (PORTRAIT_QUERY.matches ? "portrait" : "landscape");
let propLayout = propLayouts[propOrientation()];

function applyProps() {
  propLayout = propLayouts[propOrientation()];
  props.forEach((el) => {
    const pos = propLayout[el.dataset.prop];
    el.style.left = `${pos.left}%`;
    el.style.top = `${pos.top}%`;
    el.style.setProperty("--w", `${pos.w}%`);
    el.hidden = Boolean(pos.hidden);
  });
}

function saveProps() {
  try { localStorage.setItem(PROP_KEY, JSON.stringify(propLayouts)); } catch (error) { /* ignore */ }
}

PORTRAIT_QUERY.addEventListener?.("change", () => { applyProps(); syncRestoreButton(); });

let propDrag = null;
props.forEach((el) => {
  ["remove-handle", "resize-handle"].forEach((cls) => {
    const span = document.createElement("span");
    span.className = cls;
    span.setAttribute("aria-hidden", "true");
    if (cls === "remove-handle") span.textContent = "×";
    el.appendChild(span);
  });
  el.addEventListener("pointerdown", (e) => {
    if (!editMode || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const pos = propLayout[el.dataset.prop];
    if (e.target.closest(".remove-handle")) {
      pos.hidden = true;
      applyProps();
      saveProps();
      syncRestoreButton();
      return;
    }
    const r = el.getBoundingClientRect();
    propDrag = {
      el, pos, pointerId: e.pointerId,
      mode: e.target.closest(".resize-handle") ? "resize" : "move",
      offsetX: e.clientX - r.left, offsetY: e.clientY - r.top, startX: e.clientX, startW: pos.w,
    };
    el.setPointerCapture?.(e.pointerId);
  });
  el.addEventListener("pointermove", (e) => {
    if (!propDrag || propDrag.el !== el || e.pointerId !== propDrag.pointerId) return;
    const box = airportProps.getBoundingClientRect();
    const { pos } = propDrag;
    if (propDrag.mode === "resize") {
      pos.w = round(Math.min(80, Math.max(4, propDrag.startW + ((e.clientX - propDrag.startX) / box.width) * 100)));
    } else {
      pos.left = round(((e.clientX - box.left - propDrag.offsetX) / box.width) * 100);
      pos.top = round(((e.clientY - box.top - propDrag.offsetY) / box.height) * 100);
    }
    applyProps();
  });
  const end = () => { if (propDrag?.el === el) { propDrag = null; saveProps(); } };
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
});
applyProps();

document.getElementById("openAirport").addEventListener("click", (e) => {
  e.stopPropagation();
  openAirportScene();
});

/* Editing controls are for the owner only. ?edit=1 turns them on (remembered in
   localStorage so it sticks), ?edit=0 clears it. Guests never see them and edit
   mode always starts Off, so a click on Nice Airport opens the scene. */
const OWNER_KEY = "riviera-edit";
const isOwner = (() => {
  try {
    const flag = new URLSearchParams(window.location.search).get("edit");
    if (flag === "1") localStorage.setItem(OWNER_KEY, "1");
    else if (flag === "0") localStorage.removeItem(OWNER_KEY);
    return localStorage.getItem(OWNER_KEY) === "1";
  } catch (error) {
    return new URLSearchParams(window.location.search).get("edit") === "1";
  }
})();
const boardControls = document.getElementById("boardControls");
if (boardControls) boardControls.hidden = !isOwner;
stage.classList.toggle("is-owner", isOwner);

setEditMode(false);
syncRestoreButton();
hintTimer = setTimeout(() => hint && hint.classList.add("is-hidden"), 7000);

function exportLayout() {
  const layout = getLayout();
  const json = JSON.stringify({ ...layout, airportScene: propLayouts }, null, 2);
  const table = Object.entries(layout)
    .map(([id, pos]) => `${id}\t${pos.left}\t${pos.top}\t${pos.w}`)
    .join("\n");
  const snippet = `const LAYOUT = ${json};\nconst PROP_LAYOUT = ${JSON.stringify(propLayouts, null, 2)};`;
  console.info("Riviera layout table (id\tleft\ttop\tw):\n" + table);
  console.info("Riviera LAYOUT snippet:\n" + snippet);

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(json)
      .then(() => console.info("Riviera layout JSON copied to clipboard."))
      .catch(() => console.warn("Riviera layout JSON is ready in the console; clipboard access was unavailable."));
  } else {
    console.warn("Riviera layout JSON is ready in the console; clipboard access was unavailable.");
  }
  return layout;
}

function clearSavedLayout() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("RivieraBoard: saved layout could not be cleared", error);
  }
  window.location.reload();
}

// Expose for console tweaks while previewing and for layout handoff.
window.RivieraBoard = {
  LAYOUT,
  STORAGE_KEY,
  AIRPORT_SCENE_IDS,
  applyLayout,
  getLayout,
  exportLayout,
  clearSavedLayout,
  openAirportScene,
  closeAirportScene,
  setPos(id, left, top, w) {
    const el = landmarks.find((landmark) => landmark.dataset.id === id);
    if (!el) return;
    const pos = currentLayout[id] || { left: 10, top: 10, w: 18 };
    if (left != null) pos.left = numberOr(left, pos.left);
    if (top != null) pos.top = numberOr(top, pos.top);
    if (w != null) pos.w = numberOr(w, pos.w);
    currentLayout[id] = pos;
    applyLayout(currentLayout);
    saveLayout();
  },
  setEditMode,
};
