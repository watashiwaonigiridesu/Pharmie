// Turns the text read from a medicine label into active ingredients, then checks
// them against one person's profile, cabinet and today's doses.
import { INGREDIENTS, PRODUCTS } from './data.js';
import { getProduct, accessibleItems, doseSummary } from './logic.js';

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9.,%µ\s]/g, ' ').replace(/\s+/g, ' ');

// Small edit distance, so OCR slips like "paracetarnol" still match.
function distance(a, b) {
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 2) return 99;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}

function locate(text, alias) {
  const exact = text.indexOf(alias);
  if (exact >= 0) return exact;
  if (alias.includes(' ') || alias.length < 7) return -1;
  // fuzzy: compare word by word, allowing about 1 slip per 5 letters
  const words = text.split(' ');
  let pos = 0;
  for (const w of words) {
    if (w.length >= alias.length - 2 && distance(w, alias) <= Math.max(1, Math.floor(alias.length / 5))) return pos;
    pos += w.length + 1;
  }
  return -1;
}

function strengthAfter(text, at) {
  const near = text.slice(at, at + 70);
  const m = near.match(/(\d+(?:[.,]\d+)?)\s*(mg|mcg|µg|g|ml|%)\b/);
  if (!m) return null;
  return { amount: Number(m[1].replace(',', '.')), unit: m[2] };
}

/** Returns [{ ing, strength }] for every known active ingredient found in the text. */
export function findIngredients(raw) {
  const text = norm(raw || '');
  const found = [];
  for (const ing of INGREDIENTS) {
    let at = -1;
    for (const a of ing.aliases) {
      at = locate(text, a);
      if (at >= 0) break;
    }
    if (at >= 0) found.push({ ing, strength: strengthAfter(text, at), at });
  }
  // "sodium chloride" is also inside oral rehydration salts: keep the more specific one
  const out = (found.some((f) => f.ing.id === 'oral rehydration salts') ? found.filter((f) => f.ing.id !== 'sodium chloride') : found)
    .sort((a, b) => a.at - b.at);
  // One ingredient but its strength printed elsewhere ("500 mg each"): use the most common mg value.
  if (out.length === 1 && !out[0].strength) {
    const counts = {};
    for (const m of text.matchAll(/(\d+(?:[.,]\d+)?)\s*mg\b/g)) counts[m[1]] = (counts[m[1]] || 0) + 1;
    const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (best) out[0] = { ...out[0], strength: { amount: Number(best[0].replace(',', '.')), unit: 'mg' } };
  }
  return out;
}

export function ingredientById(id) {
  return INGREDIENTS.find((i) => i.id === id || i.name.toLowerCase() === String(id).toLowerCase()) || null;
}

/** Best-effort name for what was scanned, e.g. "Paracetamol 500 mg". */
export function guessName(found) {
  if (!found.length) return '';
  return found.map((f) => f.ing.name + (f.strength ? ` ${f.strength.amount} ${f.strength.unit}` : '')).join(' + ');
}

function ingredientsOfProduct(p) {
  return (p?.ingredients || []).map((x) => x.name.toLowerCase());
}

function groupOf(name) {
  return INGREDIENTS.find((i) => i.id === name || i.aliases.includes(name))?.group || null;
}

/**
 * Safety checks for one person. Returns [{ level: 'bad'|'warn'|'ok', text }],
 * worst first. Missing profile answers are never treated as safe.
 */
export function checkFound(state, profile, found, now = new Date()) {
  const out = [];
  const add = (level, text) => out.push({ level, text });
  const who = profile.id === 'alex' ? 'you' : profile.name;
  const items = accessibleItems(state, profile.id);
  const sum = doseSummary(state, profile.id, now);
  const takenToday = new Set(sum.entries.flatMap((d) => ingredientsOfProduct(getProduct(state, d.productId))));
  const active = (profile.conditions || []).filter((c) => c.status === 'Active').map((c) => c.name.toLowerCase());

  for (const { ing } of found) {
    const id = ing.id;
    for (const a of profile.allergies || []) {
      const s = a.substance.toLowerCase();
      if (s === id || ing.aliases.includes(s)) {
        add(a.status === 'Confirmed' ? 'bad' : 'warn',
          a.status === 'Confirmed' ? `${profile.name} is allergic to ${ing.name.toLowerCase()} (${a.reaction.toLowerCase() || 'reaction on file'}). Don’t take it.`
            : `Possible reaction to ${ing.name.toLowerCase()} on file (${a.reaction.toLowerCase() || 'unknown'}). Ask a pharmacist first.`);
      } else if (groupOf(s) && groupOf(s) === ing.group && ing.group === 'nsaid') {
        add('warn', `${ing.name} is in the same family as ${a.substance.toLowerCase()}, which is on ${profile.name}’s allergy list. Ask a pharmacist first.`);
      }
    }
    if (profile.age < ing.minAge) add('bad', `${ing.name} isn’t for age ${profile.age}${ing.minAge >= 1 ? ` (${ing.minAge}+ only)` : ''}.`);
    if (takenToday.has(id)) add('warn', `${who === 'you' ? 'You’ve' : profile.name + ' has'} already taken ${ing.name.toLowerCase()} in the last 24 hours. Count it toward the same limit.`);
    const same = items.filter((i) => ingredientsOfProduct(getProduct(state, i.productId)).includes(id));
    if (same.length) add('warn', `Same ingredient as ${same.map((i) => getProduct(state, i.productId).name).join(', ')} in the cabinet. Don’t take them together.`);
    else {
      const sib = items.find((i) => ingredientsOfProduct(getProduct(state, i.productId)).some((n) => groupOf(n) && groupOf(n) === ing.group && ['nsaid', 'antihistamine', 'decongestant'].includes(ing.group)));
      if (sib) add('warn', `Similar to ${getProduct(state, sib.productId).name} in the cabinet (both ${ing.kind.toLowerCase()}). Use one, not both.`);
    }
    if (id === 'paracetamol' && profile.liver) add('bad', 'Liver condition on file: ask a pharmacist before taking paracetamol.');
    if (id === 'paracetamol' && profile.alcohol == null && profile.age >= 18) add('warn', 'Alcohol use isn’t answered in the profile, so this check is incomplete.');
    if (ing.group === 'nsaid' && (profile.age >= 65 || profile.kidney)) add('warn', `${ing.name} can strain the kidneys and stomach${profile.age >= 65 ? ' at 65+' : ''}. Ask a pharmacist first.`);
    if (ing.group === 'decongestant' && active.some((c) => c.includes('blood pressure') || c.includes('heart'))) add('bad', `${ing.name} can raise blood pressure. Not recommended with ${profile.name}’s high blood pressure.`);
    if (profile.pregnant === true) add('warn', 'Pregnancy or breastfeeding: check every medicine with a pharmacist.');
  }
  const groups = found.map((f) => f.ing.group);
  if (groups.filter((g) => g === 'nsaid').length > 1) add('bad', 'This product combines two NSAID pain relievers. Ask a pharmacist.');
  if (!out.length && found.length) add('ok', `Nothing on ${profile.name === 'Alex' ? 'your' : profile.name + '’s'} profile clashes with this. Still read the label for the dose.`);
  const rank = { bad: 0, warn: 1, ok: 2 };
  const seen = new Set();
  return out.filter((c) => (seen.has(c.text) ? false : seen.add(c.text))).sort((a, b) => rank[a.level] - rank[b.level]);
}

/** Map a scan to an existing catalogue product when it's clearly the same thing. */
export function matchProduct(found) {
  const ids = found.map((f) => f.ing.id).sort().join('+');
  for (const [pid, p] of Object.entries(PRODUCTS)) {
    const pids = p.ingredients.map((x) => x.name.toLowerCase()).sort().join('+');
    if (pids === ids) {
      const s = found[0].strength;
      const pmg = p.ingredients[0].mg;
      if (!s || !pmg || (s.unit === 'mg' && s.amount === pmg)) return pid;
    }
  }
  return null;
}

const NOT_BRAND = /\b(mild|moderate|severe|strong|extra|fast|rapid|max|maximum|plus|forte|night|day|tablets?|capsules?|caplets?|syrup|each|contains?|for|relief|of|and|the|mg|ml|use|pack|dose|oral|film|coated|keep|store|warning|read|leaflet|pain|fever|cold|flu|adults?|children|years?)\b/gi;

function realWords(text) {
  return text.split(' ').filter((w) => !w.match(NOT_BRAND) && /^[A-Za-z][A-Za-z'&-]{2,}$/.test(w) && /[aeiouy]/i.test(w));
}

/** The name printed largest on the pack that isn't an ingredient or a strength: usually the brand. */
export function guessBrand(lines, found) {
  const aliases = found.flatMap((f) => f.ing.aliases);
  const heights = (lines || []).map((l) => l.height).sort((a, b) => a - b);
  const median = heights.length >= 3 ? heights[Math.floor(heights.length / 2)] : 0;
  const cands = (lines || [])
    .filter((l) => !median || l.height >= median * 1.15)
    .map((l) => ({ ...l, clean: l.text.replace(/[^A-Za-z0-9 \-+&']/g, ' ').replace(/\s+/g, ' ').trim() }))
    .filter((l) => {
      const low = l.clean.toLowerCase();
      if (l.clean.replace(/[^A-Za-z]/g, '').length < 3) return false;
      if (/\d/.test(l.clean)) return false;
      if (aliases.some((a) => low.includes(a))) return false;
      if (low.replace(NOT_BRAND, '').replace(/[^a-z]/g, '').length < 3) return false;
      // OCR noise like "os q i": needs at least one real-looking word (3+ letters with a vowel).
      return realWords(l.clean).length > 0;
    })
    .sort((a, b) => b.height - a.height);
  const best = cands[0];
  if (!best) return null;
  const words = realWords(best.clean);
  const name = words.join(' ').trim().slice(0, 30);
  return name ? name.replace(/\b([a-z])([a-z]*)/gi, (m, a, b) => (m === m.toUpperCase() && m.length > 3 ? a + b.toLowerCase() : m)) : null;
}

/** Usual tablet strengths, offered as quick choices on the dose screen. */
export const COMMON_STRENGTHS = {
  paracetamol: [500, 1000], ibuprofen: [200, 400], aspirin: [300], naproxen: [220, 250], cetirizine: [10], loratadine: [10],
  chlorphenamine: [4], diphenhydramine: [25, 50], phenylephrine: [5, 10], pseudoephedrine: [60], dextromethorphan: [15],
  guaifenesin: [100, 200], bromhexine: [8], loperamide: [2], 'calcium carbonate': [500], omeprazole: [20],
};
