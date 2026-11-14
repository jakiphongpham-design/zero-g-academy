# SYSTEM_ARCHITECTURE.md — Zero-G Academy

> **Master context anchor.** This document is the single source of truth for every human developer and AI coding agent on this project. If code and this document disagree, this document wins until it is amended through a reviewed pull request.

**Product:** A browser-based educational space simulator for ages 7–12.
**Stack:** Vanilla HTML5, CSS3, ES2020+ JavaScript modules, HTML5 Canvas 2D.
**Forbidden:** React, Vue, Svelte, any UI framework, any build step that is required to run the app, Matter.js, Planck.js, Box2D, p5.js, Phaser, or any other external physics/game engine.

---

## 1. AI Team Git Protocol

### 1.1 Mandatory pre-flight for AI coding agents

Every AI coding agent MUST, before writing or modifying any file:

1. **Read this entire document** (`/SYSTEM_ARCHITECTURE.md`). Do not rely on a summary or memory from a previous session.
2. **Identify its assigned scope** — exactly one of:
   - `src/missions/mars-gravity/`
   - `src/missions/solar-flare/`
   - `src/missions/zero-g/`
   - `src/core/` (dashboard, routing, state — architecture-owner tasks only)
   - `src/data/` (NASA contracts and fallback data — architecture-owner tasks only)
3. **State its scope** in its first message/commit/PR description: `SCOPE: src/missions/<mission-id>/`.
4. **Confirm it is on a `feature/` branch**, not `main`.

### 1.2 Folder isolation rules

| Rule | Detail |
|---|---|
| **R1 — Stay in your folder** | A mission agent may create, edit, or delete files **only** inside its own `src/missions/<mission-id>/` folder. |
| **R2 — Read-only shared code** | Mission code MAY `import` from `src/data/` (constants, DONKI fetch). It MUST NOT edit those files. |
| **R3 — No cross-mission imports** | `mars-gravity` must never import from `solar-flare` or `zero-g`, and vice versa. Copy small helpers instead of sharing them. |
| **R4 — No direct state writes from missions** | Missions never write to `localStorage`. They report results to the dashboard via `postMessage` (see §4.4). The dashboard is the **single writer** of state. |
| **R5 — Contract changes need a dedicated PR** | Any change to `src/core/`, `src/data/`, the state schema, the `postMessage` contract, or this document must be its own PR, labelled `architecture`, reviewed by a human. |
| **R6 — No new dependencies** | No `npm install`, no CDN `<script>` tags, no new runtime libraries. Dev-only tooling (e.g. a local static server) is allowed but must not be required by the shipped code. |
| **R7 — Don't touch this file** | Agents must not edit `SYSTEM_ARCHITECTURE.md` unless the human explicitly assigns that task. |

If a task cannot be completed without violating R1–R7, the agent must **stop and report the conflict** rather than work around it.

### 1.3 Branching

- `main` is the protected, always-demo-ready branch.
- **Direct pushes to `main` are forbidden** for humans and agents alike. No `git push origin main`, no `--force` to `main`, ever.
- All work happens on branches named:

  ```
  feature/<scope>-<short-description>
  ```

  Examples: `feature/mars-gravity-jump-arc`, `feature/solar-flare-donki-timeline`, `feature/core-mission-unlock`, `feature/data-fallback-refresh`.
- Bug fixes use `fix/<scope>-<short-description>`.
- Branch from the latest `main`: `git checkout main && git pull && git checkout -b feature/<scope>-<desc>`.

### 1.4 Commits

- Conventional-commit style with the scope in parentheses:
  `feat(mars-gravity): add landing collision`, `fix(core): restore iframe src on reload`, `docs(architecture): clarify fallback timeout`.
- One logical change per commit. Never commit secrets (see §5.1 on API keys).

### 1.5 Pull requests

Every change reaches `main` through a pull request. The PR description MUST contain:

```
SCOPE: src/missions/<mission-id>/   (or src/core/, src/data/)
WHAT: <one-paragraph summary>
CONTRACTS TOUCHED: none | state schema | postMessage | DONKI | GRAVITY | design tokens
HOW TO TEST: <steps, including "open via local server at http://localhost:8000">
CHECKLIST:
- [ ] I read SYSTEM_ARCHITECTURE.md before starting
- [ ] All changed files are inside my SCOPE folder
- [ ] No external libraries / frameworks / physics engines
- [ ] Works with the network disconnected (fallback path)
- [ ] Tested at 1280×720 and 768×1024
```

Merge requirements: at least one human approval, no merge conflicts, scope check passes (reviewer confirms the diff stays inside the declared folder). Squash-merge is preferred.

**Repo setup (one-time, by the human lead):** enable branch protection on `main` — "Require a pull request before merging", "Require approvals: 1", "Do not allow bypassing the above settings", and disable force pushes.

---

## 2. Global UI & Routing

### 2.1 Design language: "SpaceX Minimalism + Mission Control Playground"

The base is stark, dark, and engineered: black/near-black surfaces, white and grey type, thin hairline borders, generous whitespace, uppercase tracking on labels. On top of that we add **a small number of loud, friendly accents** — neon blue and safety orange — reserved for things a child should press or notice.

**Rule of thumb:** greyscale for information, color for action.

### 2.2 Design tokens (`src/core/theme.css`)

All colors, sizes, and radii are CSS custom properties defined once in `src/core/theme.css`. Missions link to this file and **must use tokens, not hard-coded hex values**.

```css
:root {
  /* Surfaces */
  --zg-bg:            #000000;   /* page background */
  --zg-surface:       #0B0D10;   /* cards, panels */
  --zg-surface-2:     #14171C;   /* raised / hover */
  --zg-border:        #2A2F36;   /* 1px hairlines */
  --zg-border-strong: #5A616B;

  /* Typography colors */
  --zg-text:          #FFFFFF;
  --zg-text-muted:    #A7ADB5;
  --zg-text-dim:      #6B727C;

  /* Playful accents (actions & highlights only) */
  --zg-accent-blue:   #00B7FF;   /* primary action: "Launch", "Next" */
  --zg-accent-orange: #FF6A13;   /* secondary/alert: "Try again", flare warnings */
  --zg-success:       #3DDC84;   /* mission complete */
  --zg-locked:        #3A3F46;   /* locked mission cards */

  /* Type */
  --zg-font: "Inter", "Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif;
  --zg-font-mono: "JetBrains Mono", Consolas, "Courier New", monospace;
  --zg-fs-label: 0.75rem;    /* uppercase, letter-spacing: 0.16em */
  --zg-fs-body:  1.125rem;   /* 18px — kid-readable */
  --zg-fs-h2:    1.75rem;
  --zg-fs-h1:    2.5rem;

  /* Shape & motion */
  --zg-radius:     6px;      /* clean, nearly square */
  --zg-radius-pill: 999px;   /* buttons only */
  --zg-border-w:   1px;
  --zg-tap:        48px;     /* minimum touch target */
  --zg-gap:        1.5rem;
  --zg-ease:       cubic-bezier(.2,.8,.2,1);
  --zg-dur:        180ms;
}

@media (prefers-reduced-motion: reduce) {
  :root { --zg-dur: 0ms; }
}
```

**Component rules:**

| Component | Spec |
|---|---|
| Primary button | `--zg-accent-blue` fill, black text, pill radius, min-height `--zg-tap`, bold uppercase label, glow on hover: `box-shadow: 0 0 16px var(--zg-accent-blue)`. |
| Secondary button | Transparent fill, `1px solid --zg-accent-orange`, orange text. |
| Mission card | `--zg-surface` fill, `1px solid --zg-border`, `--zg-radius`. Hover → `--zg-surface-2` and `--zg-border-strong`. Shows an uppercase mission code (e.g. `MISSION 01`), title, one-sentence kid-friendly description, and a status badge. |
| Status badge | `LOCKED` (grey `--zg-locked`, padlock icon), `READY` (blue), `COMPLETE` (green, checkmark). |
| Headings | White, weight 600–700. Labels uppercase, `--zg-fs-label`, `--zg-text-muted`, wide letter-spacing. |

**Kid-friendly constraints:** body text ≥ 18px; sentences ≤ 15 words in UI copy; every icon has a text label; text/background contrast ≥ 4.5:1; nothing in the UI relies on color alone; no timers that punish failure; "Try again" is always available.

### 2.3 Shell layout (`/index.html`)

The dashboard is a **persistent shell**. It is never reloaded during a session; only the iframe's content changes.

```
┌───────────────────────────────────────────────────────────────┐
│ HEADER: ZERO-G ACADEMY logo · progress (n/3) · sound toggle    │
├──────────────────┬────────────────────────────────────────────┤
│ MISSION RAIL     │                                            │
│ ┌──────────────┐ │                                            │
│ │ MISSION 01   │ │        <iframe id="mission-viewport">       │
│ │ Mars Gravity │ │          (game viewport)                   │
│ └──────────────┘ │                                            │
│ ┌──────────────┐ │                                            │
│ │ MISSION 02   │ │                                            │
│ │ Solar Flare  │ │                                            │
│ └──────────────┘ │                                            │
│ ┌──────────────┐ │                                            │
│ │ MISSION 03   │ │                                            │
│ │ Zero-G       │ │                                            │
│ └──────────────┘ │                                            │
├──────────────────┴────────────────────────────────────────────┤
│ FOOTER: "Data: NASA DONKI · NASA Planetary Fact Sheet" · LIVE/OFFLINE badge │
└───────────────────────────────────────────────────────────────┘
```

Below 900px viewport width, the mission rail collapses to a horizontal scrollable row above the viewport.

### 2.4 Iframe routing contract

```html
<iframe
  id="mission-viewport"
  title="Mission viewport"
  src="src/core/welcome.html"
  allow="fullscreen"
  sandbox="allow-scripts allow-same-origin">
</iframe>
```

- **Routing table** (`src/core/router.js`) — the only place mission paths are defined:

  ```js
  export const ROUTES = Object.freeze({
    "welcome":      "src/core/welcome.html",
    "mars-gravity": "src/missions/mars-gravity/index.html",
    "solar-flare":  "src/missions/solar-flare/index.html",
    "zero-g":       "src/missions/zero-g/index.html",
  });
  ```

- **Navigation:** clicking a mission card calls `navigateTo(missionId)`, which:
  1. Returns early if the mission's state is `"locked"` (card shows a friendly "Finish Mission 0X first!" message).
  2. Sets `iframe.src = ROUTES[missionId]`.
  3. Updates `location.hash` to `#/mission/<missionId>` (enables back button and refresh).
  4. Marks the active card with `aria-current="page"`.
- **Deep links:** on load, `router.js` reads `location.hash` and calls `navigateTo`; a `hashchange` listener handles browser back/forward.
- The dashboard **never** reaches into the iframe's DOM. Communication is `postMessage` only (§4.4).
- Each mission page must be fully self-contained: it fills 100% of the iframe, sets its own `<title>`, and links `../../core/theme.css` for tokens.

### 2.5 Running locally

ES modules and `fetch()` of local JSON do **not** work over `file://`. Always serve the repo root over HTTP:

```
python -m http.server 8000      # or: npx serve .
# open http://localhost:8000
```

---

## 3. Directory Map

```
zero-g-academy/
├── index.html                      # Dashboard shell: header, mission rail, <iframe>, footer
├── SYSTEM_ARCHITECTURE.md          # THIS FILE — read before coding
├── README.md                       # Quick start for humans
├── .gitignore
│
└── src/
    ├── core/                       # Dashboard UI + state (architecture-owner scope)
    │   ├── theme.css               # Design tokens (§2.2) — linked by every page
    │   ├── dashboard.css           # Shell layout, mission cards, badges
    │   ├── dashboard.js            # Entry module: renders cards, wires clicks, listens for postMessage
    │   ├── router.js               # ROUTES table, navigateTo(), hash handling
    │   ├── state.js                # localStorage read/write/migrate (§4) — single writer
    │   └── welcome.html            # Default iframe page ("Pick a mission, cadet!")
    │
    ├── data/                       # NASA contracts + fallbacks (architecture-owner scope)
    │   ├── nasa-config.js          # API base URLs, API key handling, timeouts
    │   ├── planetary-constants.js  # GRAVITY config object (§5.3)
    │   ├── donki.js                # fetchSolarFlares() contract (§5.1)
    │   └── mock-fallback.json      # Static, pre-captured DONKI FLR data (§5.2)
    │
    └── missions/                   # Isolated mission sandboxes — one agent per folder
        ├── mars-gravity/
        │   ├── index.html          # Canvas + HUD markup; loads physics.js as type="module"
        │   ├── physics.js          # Game loop, raw physics, input, rendering
        │   └── style.css           # Mission-specific styles (uses theme.css tokens)
        │
        ├── solar-flare/
        │   ├── index.html
        │   ├── physics.js          # Particle/flare simulation; consumes fetchSolarFlares()
        │   └── style.css
        │
        └── zero-g/
            ├── index.html
            ├── physics.js          # Inertia & collision sandbox (g = 0)
            └── style.css
```

**Rules for the tree:**

- The three files per mission (`index.html`, `physics.js`, `style.css`) are **required**. A mission may add more files (e.g. `assets/`, `levels.js`) **inside its own folder only**.
- No file outside `src/missions/<id>/` may reference a mission's internal files except `router.js` (which only references `index.html`).
- Mission import paths to shared code are relative: `import { GRAVITY } from "../../data/planetary-constants.js";`
- No `node_modules/`, no `dist/`, no bundler config.

---

## 4. State Management Schema

### 4.1 Storage key

```
localStorage key:  "zga.state.v1"
```

The version is part of the key so a future schema can migrate cleanly.

### 4.2 Schema

```json
{
  "schemaVersion": 1,
  "updatedAt": "2026-11-14T10:00:00.000Z",
  "missions": {
    "mars-gravity": { "status": "unlocked",  "bestScore": 0, "completedAt": null },
    "solar-flare":  { "status": "locked",    "bestScore": 0, "completedAt": null },
    "zero-g":       { "status": "locked",    "bestScore": 0, "completedAt": null }
  },
  "settings": {
    "sound": true
  }
}
```

**Field definitions:**

| Field | Type | Rules |
|---|---|---|
| `schemaVersion` | integer | Always `1` for this schema. |
| `updatedAt` | ISO-8601 string | Set by `state.js` on every write. |
| `missions` | object | Keys are exactly the mission IDs in `ROUTES` (minus `welcome`). No other keys. |
| `missions.*.status` | enum | `"locked"` \| `"unlocked"` \| `"completed"` |
| `missions.*.bestScore` | integer ≥ 0 | Highest score reported; never decreases. |
| `missions.*.completedAt` | ISO-8601 string \| null | Set on first completion; never overwritten. |
| `settings.sound` | boolean | Sound on/off toggle. |

### 4.3 State rules

- **Default state** (first visit, or stored JSON missing/corrupt/unparseable): exactly the example in §4.2. `state.js` must wrap every `localStorage` access in `try/catch` and fall back to an in-memory default (private browsing may throw).
- **Status only moves forward:** `locked → unlocked → completed`. Never backwards (except via an explicit "Reset progress" button in the header).
- **Unlock chain** (defined once in `state.js`):

  ```js
  export const UNLOCK_ORDER = ["mars-gravity", "solar-flare", "zero-g"];
  ```

  Completing mission *n* sets mission *n+1* to `"unlocked"` if it is currently `"locked"`.
- **Public API of `src/core/state.js`:**

  ```js
  loadState()                              // → State (validated, defaults filled)
  saveState(state)                         // → void (sets updatedAt)
  getMissionStatus(missionId)              // → "locked" | "unlocked" | "completed"
  completeMission(missionId, score)        // → State (applies bestScore, completedAt, unlock chain)
  resetProgress()                          // → State (default)
  ```

### 4.4 Mission → Dashboard messaging contract

Missions are the only things that know when a mission is finished, but only the dashboard may write state. They communicate via `window.postMessage`:

```js
// Inside a mission (child iframe)
window.parent.postMessage(
  { type: "ZGA_MISSION_COMPLETE", missionId: "mars-gravity", score: 120 },
  window.location.origin
);

// Optional progress ping (for HUD/analytics; does not change state)
window.parent.postMessage(
  { type: "ZGA_MISSION_EVENT", missionId: "mars-gravity", event: "landed" },
  window.location.origin
);
```

Dashboard listener (`dashboard.js`) MUST:

1. Reject messages where `event.origin !== window.location.origin`.
2. Reject messages where `event.source !== iframe.contentWindow`.
3. Validate `type`, that `missionId` is a known ID, and that `score` is a finite integer ≥ 0.
4. Call `completeMission(missionId, score)` and re-render the cards.

---

## 5. NASA Data Contracts & Fallback

### 5.1 Live DONKI Solar Flare fetch contract (`src/data/donki.js`)

**Endpoint:** `https://api.nasa.gov/DONKI/FLR`

**Query parameters:**

| Param | Format | Default |
|---|---|---|
| `startDate` | `YYYY-MM-DD` | 30 days before today |
| `endDate` | `YYYY-MM-DD` | today |
| `api_key` | string | `DEMO_KEY` |

**API key handling (`nasa-config.js`):** default to `"DEMO_KEY"` (heavily rate-limited, roughly 30 requests/hour and 50/day per IP). A team member may paste a personal key from api.nasa.gov into `nasa-config.js` locally, but **must not commit it**. Because this is a pure front-end app, any key shipped in the code is public — never commit a personal key.

```js
// src/data/nasa-config.js
export const NASA_CONFIG = Object.freeze({
  DONKI_FLR_URL: "https://api.nasa.gov/DONKI/FLR",
  API_KEY: "DEMO_KEY",
  TIMEOUT_MS: 4000,          // hard cap on waiting for the live API
  DEFAULT_RANGE_DAYS: 30,
  FALLBACK_URL: new URL("./mock-fallback.json", import.meta.url).href,
});
```

**Normalized flare record** — what every consumer receives, live or fallback:

```js
/**
 * @typedef {Object} SolarFlare
 * @property {string}      id          // DONKI flrID, e.g. "2024-05-14T16:46:00-FLR-001"
 * @property {string}      classType   // e.g. "X8.7", "M1.2", "C3.4"
 * @property {"A"|"B"|"C"|"M"|"X"} classLetter  // first char of classType
 * @property {number}      intensity   // numeric part, e.g. 8.7
 * @property {string}      beginTime   // ISO-8601
 * @property {string|null} peakTime    // ISO-8601
 * @property {string|null} endTime     // ISO-8601
 * @property {string|null} sourceLocation   // e.g. "S18W63"
 * @property {number|null} activeRegionNum
 */
```

**Result envelope:**

```js
/**
 * @typedef {Object} FlareResult
 * @property {"live"|"fallback"} source   // drives the LIVE / OFFLINE footer badge
 * @property {SolarFlare[]}       flares   // sorted by beginTime ascending; may be empty only if source === "live"
 * @property {string}             fetchedAt  // ISO-8601
 * @property {string|null}        reason   // null when live; e.g. "timeout", "http-429", "network", "bad-payload" when fallback
 */
```

**Function signature:**

```js
/**
 * Fetch solar flares from NASA DONKI with guaranteed fallback.
 * NEVER rejects. NEVER throws. Always resolves a FlareResult.
 *
 * @param {Object}  [opts]
 * @param {string}  [opts.startDate]  YYYY-MM-DD
 * @param {string}  [opts.endDate]    YYYY-MM-DD
 * @param {number}  [opts.timeoutMs]  default NASA_CONFIG.TIMEOUT_MS
 * @returns {Promise<FlareResult>}
 */
export async function fetchSolarFlares(opts = {}) { /* ... */ }
```

**Required behavior (implementation checklist):**

1. **Pre-load the fallback immediately.** At module load time, `donki.js` starts loading `mock-fallback.json` into a module-level promise (`fallbackPromise`), so fallback data is already in memory before it is needed. If even that load fails, use a tiny inline constant (`EMERGENCY_FLARES`, ≥ 3 records) embedded in `donki.js`.
2. **Abort on timeout.** Use `AbortController` with `timeoutMs`. Exceeding it → fallback with `reason: "timeout"`.
3. **Fail fast on HTTP errors.** If `!response.ok` → fallback. `429` → `reason: "http-429"`; other statuses → `reason: "http-<status>"`.
4. **Network/CORS errors** (`fetch` rejects) → fallback with `reason: "network"`.
5. **Validate the payload.** Must be an array; each item must have `flrID`, `classType`, `beginTime`. Invalid → fallback with `reason: "bad-payload"`. Drop individual malformed items rather than failing the whole response.
6. **Normalize** every record to `SolarFlare` (both live and fallback go through the same normalizer).
7. **Session cache.** Cache a successful live result in `sessionStorage` under `"zga.donki.flr"` and reuse it within the same session to avoid burning `DEMO_KEY` quota. Wrap in `try/catch`.
8. **Never surface raw errors to the child.** Log to `console.warn` with the reason; the UI shows only the friendly OFFLINE badge ("Using saved NASA data").

Reference skeleton (contract illustration, not final code):

```js
const fallbackPromise = fetch(NASA_CONFIG.FALLBACK_URL)
  .then(r => r.json())
  .catch(() => EMERGENCY_FLARES);

async function useFallback(reason) {
  const raw = await fallbackPromise;
  return { source: "fallback", flares: normalizeAll(raw), fetchedAt: new Date().toISOString(), reason };
}
```

### 5.2 `mock-fallback.json` format

- Must be **raw DONKI FLR response shape** (an array of DONKI objects exactly as the API returns them), so the same normalizer handles both paths and the file can be refreshed by saving a real API response.
- Must contain **at least 10 flares** spanning at least one `X`-class, several `M`-class, and several `C`-class events, so every mission branch can be exercised offline.
- Must be committed to the repo and valid JSON (no comments).

Example record:

```json
[
  {
    "flrID": "2024-05-14T16:46:00-FLR-001",
    "instruments": [{ "displayName": "GOES-P: EXIS 1.0-8.0" }],
    "beginTime": "2024-05-14T16:46Z",
    "peakTime": "2024-05-14T16:51Z",
    "endTime": "2024-05-14T17:02Z",
    "classType": "X8.7",
    "sourceLocation": "S18W63",
    "activeRegionNum": 13664,
    "linkedEvents": null,
    "link": "https://webtools.ccmc.gsfc.nasa.gov/DONKI/view/FLR/30000/-1"
  }
]
```

> Before the demo, refresh this file from a real DONKI response and verify the values; the record above illustrates shape only.

### 5.3 Planetary gravity config (`src/data/planetary-constants.js`)

Values in m/s², sourced from the NASA Planetary Fact Sheet. Frozen; missions import, never mutate.

```js
// Source: NASA Planetary Fact Sheet (nssdc.gsfc.nasa.gov/planetary/factsheet/)
export const GRAVITY = Object.freeze({
  EARTH: 9.8,
  MARS:  3.72,
  ZERO_G: 0,
});

// Kid-friendly helper: how heavy you feel compared to Earth
export const relativeToEarth = (g) => g / GRAVITY.EARTH;   // Mars ≈ 0.38
```

Adding a body (e.g. `MOON: 1.62`) is an `architecture` PR per R5.

---

## 6. Raw Physics Implementation Rules

### 6.1 Non-negotiables

- **All physics is hand-written math in Vanilla JS.** Gravity, velocity, inertia, friction/drag, collision detection, and collision response are computed directly in each mission's `physics.js`.
- **Rendering uses the HTML5 Canvas 2D API** (`canvas.getContext("2d")`). No WebGL libraries, no DOM-element sprites for physics bodies.
- **The only loop is `requestAnimationFrame`.** No `setInterval`/`setTimeout` game loops.
- **No Matter.js, Planck.js, Box2D, Cannon.js, p5.js, Phaser, or any other engine or math library.** A PR that adds one is rejected.

### 6.2 Units & coordinates

- Simulate in **SI units** (meters, seconds, m/s, m/s²). Convert to pixels only at render time with a per-mission constant: `const PX_PER_M = 40;` (tune per mission).
- Canvas y-axis points down; gravity is therefore `+g` on the y-axis in screen space. Document this at the top of each `physics.js`.
- Handle high-DPI screens: size the backing store as `canvas.width = cssWidth * devicePixelRatio` and `ctx.scale(dpr, dpr)`. Re-size on `resize`.

### 6.3 Loop structure: fixed timestep with accumulator

Physics must be deterministic and frame-rate independent (a 144 Hz laptop and a 60 Hz Chromebook must behave identically).

```js
const FIXED_DT = 1 / 120;      // seconds per physics step
const MAX_FRAME = 0.25;        // clamp to avoid "spiral of death" after tab switch
let acc = 0, last = performance.now(), rafId = 0;

function frame(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > MAX_FRAME) dt = MAX_FRAME;
  acc += dt;
  while (acc >= FIXED_DT) {
    step(FIXED_DT);            // physics only — no drawing
    acc -= FIXED_DT;
  }
  render(acc / FIXED_DT);      // drawing only — optional interpolation alpha
  rafId = requestAnimationFrame(frame);
}
rafId = requestAnimationFrame(frame);
```

- Pause on `document.visibilitychange` (hidden) and reset `last` on resume.
- Call `cancelAnimationFrame(rafId)` on `pagehide` so a mission stops cleanly when the iframe `src` changes.

### 6.4 Integration

Use **semi-implicit (symplectic) Euler** — update velocity first, then position:

```js
// per body, per step
body.vx += (body.fx / body.m) * dt;
body.vy += (body.fy / body.m + g) * dt;
body.x  += body.vx * dt;
body.y  += body.vy * dt;
```

- **Gravity:** constant acceleration `g` from `GRAVITY` (not multiplied by mass).
- **Inertia:** with no forces applied, velocity is unchanged — never add hidden damping in `zero-g`. Any drag must be an explicit, named constant (`AIR_DRAG`) and set to `0` in zero-g.
- **Thrust/input forces** are accumulated into `fx/fy` and cleared at the end of each step.

### 6.5 Collisions

Supported shapes: **circles** and **axis-aligned rectangles (AABB)**. Keep it simple.

| Pair | Detection | Response |
|---|---|---|
| Circle–circle | `dist² < (r1 + r2)²` | Push apart along normal by penetration depth (split by inverse mass); apply impulse `j = -(1 + e)·(vRel·n) / (1/m1 + 1/m2)`. |
| Circle–AABB | Clamp circle center to box → closest point → distance check | Same positional correction + impulse along normal. |
| AABB–AABB | Overlap on both axes | Resolve along axis of least penetration. |
| Body–world bounds | Compare against canvas bounds (in meters) | Clamp position, reflect velocity component × restitution `e`. |

- Restitution `e` in `[0, 1]`, defined as a named constant per mission.
- Static bodies (ground, walls) have `invMass = 0`.
- Velocities below `SLEEP_EPSILON` (e.g. `0.01 m/s`) on resting contact snap to zero to stop jitter.
- For more than ~50 bodies, use a simple uniform grid broad-phase; otherwise brute-force O(n²) is fine.

### 6.6 Mission physics profiles

| Mission | Gravity | Key concepts to simulate | Data source |
|---|---|---|---|
| `mars-gravity` | `GRAVITY.MARS` (with an Earth comparison toggle using `GRAVITY.EARTH`) | Jump height / fall time differences, projectile arcs, safe landing (impact speed threshold) | `planetary-constants.js` |
| `solar-flare` | Not gravity-driven; particle emission & outward velocity | Flare class (A/B/C/M/X) maps to particle count, speed, and brightness; shield-deflection collisions | `fetchSolarFlares()` |
| `zero-g` | `GRAVITY.ZERO_G` | Newton's 1st & 3rd laws: drifting, push-off recoil, momentum-conserving collisions, no drag | `planetary-constants.js` |

### 6.7 Performance & quality bar

- Hold 60 fps on a mid-range Chromebook with ≤ 200 particles / ≤ 50 rigid bodies.
- No allocations inside `step()` hot paths (reuse objects/arrays).
- `step()` must be a pure function of state + `dt` + input, with no DOM access, so it can be tested in isolation.
- Every mission must work fully offline.
