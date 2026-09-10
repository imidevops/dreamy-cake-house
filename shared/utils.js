/**
 * shared/utils.js
 * Small helpers reused across every page. Loaded before each page's own JS.
 *
 * Functions:
 * - fetchJSON(path)        -> Promise<any>. Fetches and parses a JSON file
 *                             from /data. Throws a readable error on failure
 *                             (e.g. page opened as file:// without a server).
 * - formatPrice(amount)    -> "$45.00" style string.
 * - getQueryParam(name)    -> value of a URL query param, or null.
 * - qs(selector, root)     -> shorthand for root.querySelector.
 * - qsa(selector, root)    -> shorthand for [...root.querySelectorAll].
 * - cakeThumbStyle(id)     -> deterministic gradient + emoji for a cake
 *                             placeholder thumbnail, keyed by cake id (no
 *                             real product photos in this project yet).
 * - escapeHTML(str)        -> escapes text before inserting into innerHTML.
 */

async function fetchJSON(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`Failed to load ${path}. If you opened this file directly ` +
      `in the browser (file://), run a local server instead, e.g.:\n` +
      `  npx serve .\nor\n  python -m http.server`, err);
    throw err;
  }
}

function formatPrice(amount, currency = 'USD') {
  const symbols = { USD: '$', GBP: '£', EUR: '€' };
  const symbol = symbols[currency] || '';
  return `${symbol}${Number(amount).toFixed(2)}`;
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function qs(selector, root = document) {
  return root.querySelector(selector);
}

function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

const THUMB_PALETTE = [
  { gradient: 'linear-gradient(135deg, #f3c9d5, #d46a86)', emoji: '🎂' },
  { gradient: 'linear-gradient(135deg, #e9d3b8, #c9976a)', emoji: '🧁' },
  { gradient: 'linear-gradient(135deg, #fbe0d4, #e28a6b)', emoji: '🍰' },
  { gradient: 'linear-gradient(135deg, #dcd0f0, #9b7fd4)', emoji: '🎂' },
  { gradient: 'linear-gradient(135deg, #cdeadb, #6bb894)', emoji: '🍰' },
  { gradient: 'linear-gradient(135deg, #fde2a7, #e2a93b)', emoji: '🧁' },
];

/** Deterministic pseudo-random thumbnail styling based on the cake id. */
function cakeThumbStyle(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return THUMB_PALETTE[hash % THUMB_PALETTE.length];
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
