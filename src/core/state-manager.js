/**
 * state-manager.js — Single writer of Zero-G Academy progress state.
 * Schema and rules: SYSTEM_ARCHITECTURE.md §4.
 *
 * Missions never touch localStorage; they report results to the dashboard,
 * which calls completeMission(). All storage access is wrapped in try/catch
 * (private browsing can throw) and falls back to an in-memory state.
 */

export const STORAGE_KEY = "zga.state.v1";
export const SCHEMA_VERSION = 1;

/** Unlock chain: completing mission n unlocks mission n+1. */
export const UNLOCK_ORDER = Object.freeze(["mars-gravity", "solar-flare", "zero-g"]);

export const MISSION_STATUS = Object.freeze({
  LOCKED: "locked",
  UNLOCKED: "unlocked",
  COMPLETED: "completed",
});

const STATUS_VALUES = Object.values(MISSION_STATUS);

/** Build the first-visit default state (§4.2 / §4.3). */
export function createDefaultState(now = new Date()) {
  const missions = {};
  UNLOCK_ORDER.forEach((id, index) => {
    missions[id] = {
      status: index === 0 ? MISSION_STATUS.UNLOCKED : MISSION_STATUS.LOCKED,
      bestScore: 0,
      completedAt: null,
    };
  });
  return {
    schemaVersion: SCHEMA_VERSION,
    updatedAt: now.toISOString(),
    missions,
    settings: { sound: true },
  };
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Validate an untrusted parsed object and fill in anything missing or invalid.
 * Returns a fully valid State. Unknown mission keys are dropped.
 */
export function sanitizeState(raw) {
  const base = createDefaultState();
  if (!isObject(raw) || raw.schemaVersion !== SCHEMA_VERSION) return base;

  if (typeof raw.updatedAt === "string") base.updatedAt = raw.updatedAt;

  if (isObject(raw.missions)) {
    for (const id of UNLOCK_ORDER) {
      const m = raw.missions[id];
      if (!isObject(m)) continue;
      if (STATUS_VALUES.includes(m.status)) base.missions[id].status = m.status;
      if (Number.isInteger(m.bestScore) && m.bestScore >= 0) {
        base.missions[id].bestScore = m.bestScore;
      }
      if (typeof m.completedAt === "string") base.missions[id].completedAt = m.completedAt;
    }
  }

  if (isObject(raw.settings) && typeof raw.settings.sound === "boolean") {
    base.settings.sound = raw.settings.sound;
  }
  return base;
}

export class StateManager {
  /**
   * @param {Storage} [storage] injectable for tests; defaults to window.localStorage
   */
  constructor(storage = null) {
    this._storage = storage ?? this._resolveStorage();
    this._state = createDefaultState();
  }

  /** Access localStorage safely; returns null if unavailable. */
  _resolveStorage() {
    try {
      return typeof localStorage !== "undefined" ? localStorage : null;
    } catch {
      return null;
    }
  }

  /** Read raw JSON string; never throws. */
  _readRaw() {
    try {
      return this._storage ? this._storage.getItem(STORAGE_KEY) : null;
    } catch {
      return null;
    }
  }

  /** Write raw JSON string; never throws. Memory state remains authoritative. */
  _writeRaw(json) {
    try {
      if (this._storage) this._storage.setItem(STORAGE_KEY, json);
    } catch {
      /* quota exceeded or storage blocked: keep in-memory state */
    }
  }

  /**
   * Initialize: load stored state, or create and persist defaults on first visit.
   * @returns {object} State
   */
  init() {
    const state = this.load();
    if (this._readRaw() === null) this.save(state);
    return this.getState();
  }

  /**
   * Read and validate stored state. Corrupt or missing data yields defaults.
   * @returns {object} State (a copy)
   */
  load() {
    let parsed = null;
    const raw = this._readRaw();
    if (raw !== null) {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = null; // corrupt JSON: fall back to defaults
      }
    }
    this._state = sanitizeState(parsed);
    return this.getState();
  }

  /**
   * Stamp updatedAt, persist, and cache the state.
   * @param {object} state
   */
  save(state) {
    const next = sanitizeState(state);
    next.updatedAt = new Date().toISOString();
    this._state = next;
    this._writeRaw(JSON.stringify(next));
    return this.getState();
  }

  /** @returns {object} copy of the current in-memory state */
  getState() {
    return structuredClone(this._state);
  }

  /** @returns {"locked"|"unlocked"|"completed"|undefined} */
  getMissionStatus(missionId) {
    return this._state.missions[missionId]?.status;
  }

  /**
   * Mark a mission complete. Status only moves forward; bestScore never decreases;
   * completedAt is set once; completing mission n unlocks mission n+1.
   * @param {string} missionId  must be one of UNLOCK_ORDER
   * @param {number} score      finite integer >= 0
   * @returns {object} State
   */
  completeMission(missionId, score) {
    if (!UNLOCK_ORDER.includes(missionId)) {
      throw new RangeError(`Unknown missionId: ${missionId}`);
    }
    if (!Number.isInteger(score) || score < 0) {
      throw new RangeError(`Invalid score: ${score}`);
    }

    const state = this.getState();
    const mission = state.missions[missionId];
    mission.status = MISSION_STATUS.COMPLETED;
    mission.bestScore = Math.max(mission.bestScore, score);
    mission.completedAt ??= new Date().toISOString();

    const next = UNLOCK_ORDER[UNLOCK_ORDER.indexOf(missionId) + 1];
    if (next && state.missions[next].status === MISSION_STATUS.LOCKED) {
      state.missions[next].status = MISSION_STATUS.UNLOCKED;
    }
    return this.save(state);
  }

  /** Toggle sound; persisted like any other change. */
  setSound(enabled) {
    const state = this.getState();
    state.settings.sound = Boolean(enabled);
    return this.save(state);
  }

  /** Explicit "Reset progress" (header button only). @returns {object} State */
  resetProgress() {
    return this.save(createDefaultState());
  }
}
