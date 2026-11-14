/**
 * dashboard-ui.js — Dashboard shell: mission cards, sidebar nav, and iframe routing.
 * Architecture: SYSTEM_ARCHITECTURE.md §2 (Global UI & Routing) and §4 (state).
 *
 * The dashboard is the only code that changes the iframe src, and the only
 * writer of progress state. Mission game code is never loaded or run here
 * beyond the iframe; it lives in src/missions/<id>/.
 */
import { StateManager, UNLOCK_ORDER, MISSION_STATUS } from "./state-manager.js";

/** Mission metadata shown on cards and in the sidebar. Order matches UNLOCK_ORDER. */
export const MISSIONS = Object.freeze([
  {
    id: "mars-gravity",
    code: "MISSION 01",
    title: "Mars Gravity",
    description: "Jump on Mars and see how light you feel.",
  },
  {
    id: "solar-flare",
    code: "MISSION 02",
    title: "Solar Flare",
    description: "Shield your ship from a real sun storm.",
  },
  {
    id: "zero-g",
    code: "MISSION 03",
    title: "Zero-G",
    description: "Float, push, and bounce where gravity is zero.",
  },
]);

/** Routing table: the only place mission entry points are defined (§2.4). */
export const ROUTES = Object.freeze({
  "mars-gravity": "src/missions/mars-gravity/index.html",
  "solar-flare": "src/missions/solar-flare/index.html",
  "zero-g": "src/missions/zero-g/index.html",
});

const HASH_PREFIX = "#/mission/";

const BADGE = Object.freeze({
  [MISSION_STATUS.LOCKED]: { text: "LOCKED", className: "badge-locked" },
  [MISSION_STATUS.UNLOCKED]: { text: "READY", className: "badge-ready" },
  [MISSION_STATUS.COMPLETED]: { text: "COMPLETE", className: "badge-complete" },
});

const STATUS_MESSAGE_MS = 4000;

/**
 * Extract a valid mission ID from a location hash such as "#/mission/zero-g".
 * @returns {string|null}
 */
export function missionIdFromHash(hash) {
  if (typeof hash !== "string" || !hash.startsWith(HASH_PREFIX)) return null;
  const id = hash.slice(HASH_PREFIX.length);
  return Object.hasOwn(ROUTES, id) ? id : null;
}

export class DashboardUI {
  /**
   * @param {Object} [opts]
   * @param {StateManager} [opts.state]  state manager (defaults to a new one)
   * @param {Document}     [opts.doc]    injectable for tests
   * @param {Window}       [opts.win]    injectable for tests
   */
  constructor({ state = new StateManager(), doc = document, win = window } = {}) {
    this.state = state;
    this.doc = doc;
    this.win = win;
    this.currentId = null;
    this.statusTimer = null;

    this.els = {
      nav: doc.getElementById("mission-nav"),
      grid: doc.getElementById("mission-grid"),
      iframe: doc.getElementById("mission-viewport"),
      empty: doc.getElementById("viewport-empty"),
      title: doc.getElementById("viewport-title"),
      progress: doc.getElementById("progress"),
      status: doc.getElementById("status-message"),
    };

    for (const [name, el] of Object.entries(this.els)) {
      if (!el) throw new Error(`dashboard-ui: missing DOM element for "${name}"`);
    }
  }

  /** Load state, render the shell, and honour any deep link in the URL. */
  init() {
    this.state.init();
    this.render();
    this.win.addEventListener("hashchange", () => this.handleHash());
    this.handleHash();
  }

  /** @returns {"locked"|"unlocked"|"completed"} */
  getStatus(missionId) {
    return this.state.getMissionStatus(missionId) ?? MISSION_STATUS.LOCKED;
  }

  isLocked(missionId) {
    return this.getStatus(missionId) === MISSION_STATUS.LOCKED;
  }

  /** Rebuild cards, sidebar items and the progress counter from current state. */
  render() {
    this.els.grid.replaceChildren(...MISSIONS.map((m) => this.buildCard(m)));
    this.els.nav.replaceChildren(...MISSIONS.map((m) => this.buildNavItem(m)));

    const completed = UNLOCK_ORDER.filter(
      (id) => this.getStatus(id) === MISSION_STATUS.COMPLETED,
    ).length;
    this.els.progress.textContent = `${completed} / ${MISSIONS.length} complete`;

    this.syncActive();
  }

  buildCard(mission) {
    const status = this.getStatus(mission.id);
    const badge = BADGE[status];

    const card = this.el("button", `mission-card status-${status}`);
    card.type = "button";
    card.dataset.mission = mission.id;
    card.setAttribute("aria-disabled", String(status === MISSION_STATUS.LOCKED));

    card.append(
      this.el("span", "card-code", mission.code),
      this.el("h2", "", mission.title),
      this.el("p", "", mission.description),
      this.el("span", `badge ${badge.className}`, badge.text),
    );

    card.addEventListener("click", () => this.navigateTo(mission.id));
    return card;
  }

  buildNavItem(mission) {
    const status = this.getStatus(mission.id);
    const item = this.el("li");
    const button = this.el("button", "nav-item");
    button.type = "button";
    button.dataset.mission = mission.id;
    button.setAttribute("aria-disabled", String(status === MISSION_STATUS.LOCKED));

    button.append(
      this.el("span", "", mission.title),
      this.el("span", "nav-status zg-label", BADGE[status].text),
    );

    button.addEventListener("click", () => this.navigateTo(mission.id));
    item.append(button);
    return item;
  }

  /**
   * Load a mission into the iframe. Locked missions are refused with a friendly message.
   * @param {string} missionId
   * @returns {boolean} true if the mission is now loaded
   */
  navigateTo(missionId) {
    if (!Object.hasOwn(ROUTES, missionId)) return false;

    if (this.isLocked(missionId)) {
      const mission = MISSIONS.find((m) => m.id === missionId);
      this.announce(`${mission.title} is locked. Finish the previous mission first!`);
      return false;
    }

    // Already showing this mission: don't reload it and lose progress.
    if (this.currentId === missionId) return true;

    this.currentId = missionId;
    this.els.iframe.src = ROUTES[missionId];
    this.els.iframe.hidden = false;
    this.els.empty.hidden = true;
    this.els.title.textContent = MISSIONS.find((m) => m.id === missionId).title;

    this.setHash(missionId);
    this.syncActive();
    return true;
  }

  /** Stop the current mission and return to the empty viewport. */
  showHome() {
    this.currentId = null;
    this.els.iframe.src = "about:blank";
    this.els.iframe.hidden = true;
    this.els.empty.hidden = false;
    this.els.title.textContent = "None";
    this.syncActive();
  }

  /** Respond to hash changes: deep links, and browser back/forward. */
  handleHash() {
    const hash = this.win.location.hash;
    const id = missionIdFromHash(hash);

    if (!id) {
      if (this.currentId !== null) this.showHome();
      return;
    }
    if (id === this.currentId) return;

    const loaded = this.navigateTo(id);
    if (!loaded) {
      // Refused (e.g. locked deep link): restore the hash without adding history.
      this.win.history.replaceState(null, "", this.hashFor(this.currentId));
    }
  }

  setHash(missionId) {
    const target = this.hashFor(missionId);
    if (this.win.location.hash !== target) this.win.location.hash = target;
  }

  /** @returns {string} hash for a mission, or the URL without a hash for null */
  hashFor(missionId) {
    return missionId ? HASH_PREFIX + missionId : this.win.location.pathname + this.win.location.search;
  }

  /** Mark the active mission with aria-current in both cards and sidebar. */
  syncActive() {
    for (const node of this.doc.querySelectorAll("[data-mission]")) {
      if (node.dataset.mission === this.currentId) {
        node.setAttribute("aria-current", "page");
      } else {
        node.removeAttribute("aria-current");
      }
    }
  }

  /** Show a short message in the status line, then clear it. */
  announce(message) {
    this.els.status.textContent = message;
    this.win.clearTimeout(this.statusTimer);
    this.statusTimer = this.win.setTimeout(() => {
      this.els.status.textContent = "";
    }, STATUS_MESSAGE_MS);
  }

  /** Small DOM helper: element with optional class and text content. */
  el(tag, className = "", text = "") {
    const node = this.doc.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
}

/** Entry point called from index.html. */
export function initDashboard(opts) {
  const ui = new DashboardUI(opts);
  ui.init();
  return ui;
}
