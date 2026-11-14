/**
 * nasa-api-config.js — Data ingestion configuration for NASA DONKI.
 * Contracts: SYSTEM_ARCHITECTURE.md §5.1 and §5.2.
 *
 * Frozen and read-only: missions import, never mutate.
 * Do NOT commit a personal API key here. Because this is a front-end app,
 * any key in shipped code is public.
 */

export const DONKI_FLR_BASE_URL = "https://api.nasa.gov/DONKI/FLR";

export const NASA_API_CONFIG = Object.freeze({
  DONKI_FLR_URL: DONKI_FLR_BASE_URL,
  API_KEY: "DEMO_KEY",             // ~30 req/hour, 50 req/day per IP
  TIMEOUT_MS: 4000,                // hard cap on the live request before fallback
  DEFAULT_RANGE_DAYS: 30,          // window used when no dates are supplied
  FALLBACK_URL: new URL("./mock-fallback.json", import.meta.url).href,
});

/** Format a Date as YYYY-MM-DD (the format DONKI expects). */
export function toDonkiDate(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Build the DONKI FLR request URL. Defaults to the last DEFAULT_RANGE_DAYS days.
 * @param {Object} [opts]
 * @param {string} [opts.startDate] YYYY-MM-DD
 * @param {string} [opts.endDate]   YYYY-MM-DD
 * @param {Date}   [opts.now]       injectable clock for tests
 * @returns {string}
 */
export function buildDonkiFlrUrl(opts = {}) {
  const now = opts.now ?? new Date();
  const endDate = opts.endDate ?? toDonkiDate(now);
  const startDate =
    opts.startDate ??
    toDonkiDate(new Date(now.getTime() - NASA_API_CONFIG.DEFAULT_RANGE_DAYS * 86_400_000));

  const params = new URLSearchParams({
    startDate,
    endDate,
    api_key: NASA_API_CONFIG.API_KEY,
  });
  return `${NASA_API_CONFIG.DONKI_FLR_URL}?${params.toString()}`;
}
