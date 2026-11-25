// Identifies a medicine from a photo of its pack: brand name first, then its active
// ingredients from (1) the label's own text, (2) Pharmie's brand list, or (3) an online
// lookup in the U.S. FDA's public drug-label database (openFDA). Nothing is typed by the user.
import { BRANDS } from './brands.js';
import { INGREDIENTS } from './data.js';
import { findIngredients, guessBrand } from './scan.js';

const words = (s) => s.toLowerCase().replace(/[^a-z0-9\- ]/g, ' ').split(/\s+/).filter(Boolean);

function near(a, b) {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1 || b.length < 6) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

/** Finds a known brand anywhere in the text read from the pack. */
export function matchBrand(text) {
  const ws = words(text);
  const joined = ws.join(' ');
  for (const b of BRANDS) {
    for (const a of b.aliases) {
      if (a.includes(' ') || a.includes('-')) { if (joined.includes(a)) return b; continue; }
      if (ws.some((w) => (b.exact ? w === a : near(w, a)))) return b;
    }
  }
  return null;
}

function ingredientFromSubstance(sub) {
  const f = findIngredients(sub);
  if (f.length) return f[0].ing;
  const name = sub.toLowerCase().replace(/\b(hydrochloride|hcl|maleate|hydrobromide|sodium|potassium|citrate|sulfate|monohydrate)\b/g, '').trim();
  const title = name.replace(/\b\w/g, (c) => c.toUpperCase());
  return { id: name, name: title, aliases: [name], group: null, kind: 'Active ingredient', usedFor: 'See the label', minAge: 0, cautions: [], how: 'Pharmie doesn’t have plain-language notes for this ingredient yet. Read the leaflet or ask a pharmacist.', max: 'Follow the label', unknown: true };
}

/** Parses an openFDA drug-label response into the most common ingredient set for a brand. */
export function parseOpenFda(json, query) {
  const results = (json?.results || []).filter((r) => (r.openfda?.product_type || []).some((t) => /OTC/i.test(t)));
  if (!results.length) return null;
  const combos = {};
  for (const r of results) {
    const subs = (r.openfda?.substance_name || r.openfda?.generic_name || []).flatMap((s) => s.split(/,| and /i)).map((s) => s.trim()).filter(Boolean);
    if (!subs.length) continue;
    const key = [...new Set(subs.map((s) => s.toUpperCase()))].sort().join(' + ');
    (combos[key] ||= { subs: [...new Set(subs)], count: 0, text: '' }).count++;
    if (!combos[key].text) combos[key].text = (r.active_ingredient || []).join(' ');
  }
  const ranked = Object.values(combos).sort((a, b) => b.count - a.count);
  if (!ranked.length) return null;
  const top = ranked[0];
  const text = top.text.toLowerCase();
  const found = top.subs.map((s) => {
    const ing = ingredientFromSubstance(s);
    let strength = null;
    for (const name of [s.toLowerCase().split(' ')[0], ...ing.aliases.map((a) => a.split(' ')[0])]) {
      const m = text.match(new RegExp(`${name}[a-z ]{0,25}?(\\d+(?:\\.\\d+)?)\\s*(mg|mcg|g|ml|%)`));
      if (m) { strength = { amount: Number(m[1]), unit: m[2] }; break; }
    }
    return { ing, strength, at: 0 };
  });
  const brandName = (results[0].openfda?.brand_name?.[0] || query).split(/\s+/)[0];
  return {
    brand: brandName.charAt(0) + brandName.slice(1).toLowerCase(),
    found,
    products: results.length,
    variants: ranked.length,
    note: ranked.length > 1 ? `${ranked.length - 1} other ${brandName.charAt(0) + brandName.slice(1).toLowerCase()} formula${ranked.length > 2 ? 's' : ''} found online contain different ingredients: check the label.` : null,
  };
}

/** Looks a name up online. Returns a match, null when not found, or { failed: true } when unreachable. */
export async function lookupOnline(name, fetcher = globalThis.fetch) {
  if (!fetcher || !name || name.length < 4) return null;
  const q = encodeURIComponent(`openfda.brand_name:"${name}"`);
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetcher(`https://api.fda.gov/drug/label.json?search=${q}&limit=25`, { signal: ctrl.signal });
    clearTimeout(t);
    if (res.status === 404) return null; // openFDA answers 404 when nothing matches
    if (!res.ok) return { failed: true };
    return parseOpenFda(await res.json(), name);
  } catch {
    return { failed: true };
  }
}

/** Name candidates for an online lookup: the biggest lines on the pack, single words. */
export function nameCandidates(lines, found) {
  const aliases = found.flatMap((f) => f.ing.aliases);
  const out = [];
  const brand = guessBrand(lines, found);
  if (brand) out.push(brand.split(' ')[0]);
  for (const l of [...(lines || [])].sort((a, b) => b.height - a.height)) {
    for (const w of l.text.split(/\s+/)) {
      const c = w.replace(/[^A-Za-z\-]/g, '');
      if (c.length >= 4 && !aliases.includes(c.toLowerCase()) && !out.some((o) => o.toLowerCase() === c.toLowerCase())) out.push(c);
    }
    if (out.length >= 3) break;
  }
  return out.slice(0, 3);
}

/**
 * The whole identification. Returns
 * { brand, found, source: 'label'|'list'|'online'|null, note, onlineTried, onlineFailed }
 */
export async function identify({ text, lines }, fetcher) {
  const fromLabel = findIngredients(text);
  const known = matchBrand(text);
  const withLabelStrength = (ids) => ids.map((id) => {
    const lab = fromLabel.find((f) => f.ing.id === id);
    return lab || { ing: INGREDIENTS.find((i) => i.id === id), strength: null, at: 0 };
  });

  if (known) {
    const labelIds = fromLabel.map((f) => f.ing.id);
    const found = fromLabel.length ? fromLabel : withLabelStrength(known.ingredients);
    const differs = fromLabel.length && known.ingredients.join() !== labelIds.join();
    return { brand: known.name, found, source: fromLabel.length ? 'label' : 'list', note: differs ? 'The label lists different ingredients from the usual formula, so we used the label.' : known.note || null };
  }

  // The label already says what's in it: no need to wait for the internet.
  if (fromLabel.length) return { brand: guessBrand(lines, fromLabel), found: fromLabel, source: 'label', note: null };

  let onlineTried = false;
  let onlineFailed = false;
  for (const name of nameCandidates(lines, fromLabel)) {
    onlineTried = true;
    const hit = await lookupOnline(name, fetcher);
    if (hit?.failed) { onlineFailed = true; break; }
    if (!hit) continue;
    return { brand: hit.brand, found: hit.found, source: 'online', note: hit.note, products: hit.products };
  }

  return { brand: guessBrand(lines, []), found: [], source: null, note: null, onlineTried, onlineFailed };
}
