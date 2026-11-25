// Pure rules for Pharmie. Everything here is deliberately conservative and is a
// prototype, not clinical software. Emergency signs always win over medicine suggestions.
import { SYMPTOMS, PRODUCTS, CABINET_ACCESS, LEVELS } from './data.js';

export const PARA_ADULT_MAX_MG = 4000;
export const PARA_MIN_GAP_H = 4;
export const CHILD_MAX_DOSES = 4;
const DAY = 86400e3;

export function getProduct(state, id) {
  return PRODUCTS[id] || state?.customProducts?.[id] || null;
}

export function levelIndex(id) {
  return LEVELS.findIndex((l) => l.id === id);
}

function sevIndex(check, id) {
  const s = SYMPTOMS.find((x) => x.id === id);
  const v = check.sel[id];
  return s && v ? s.levels.indexOf(v) : -1;
}

/** Decide how much help someone needs. Returns { level, reasons } or null if nothing picked. */
export function triage(check, profile) {
  if (!check.order.length) return null;
  let level = 0;
  const reasons = [];
  const raise = (to, why) => {
    if (to > level) level = to;
    reasons.push({ to, why });
  };
  const has = (id) => !!check.sel[id];
  const age = profile?.age ?? 30;

  if (check.warnings.length) raise(3, 'You ticked a warning sign');
  if (has('headache') && sevIndex(check, 'headache') === 2 && check.sudden === true) raise(3, 'A sudden, severe headache needs urgent checks');
  if (age < 0.25 && has('fever')) raise(3, 'Any fever in a baby under 3 months needs urgent care');

  if (has('fever')) {
    if (check.temp === 'over39' || sevIndex(check, 'fever') === 2) raise(2, 'Temperature above 39°C');
    if (check.dur === '3+') raise(2, 'Fever for 3 days or more');
    if (has('rash')) raise(2, 'Fever together with a rash');
    if (age < 1) raise(2, 'Fever in a baby under 1 year');
    if (age >= 65) raise(1, 'Age 65+: a pharmacist should check fevers and other medicines');
    if (profile?.conditions?.some((c) => c.status === 'Active' && !/allerg/i.test(c.name))) raise(1, 'Fever with a long-term condition');
  }
  for (const s of SYMPTOMS) {
    const i = sevIndex(check, s.id);
    if (i === 2) raise(2, `${s.label}: ${s.levels[2].toLowerCase()}`);
  }
  if (has('stomach') && sevIndex(check, 'stomach') === 1) raise(1, 'Moderate stomach pain');
  if (has('rash')) raise(1, 'Rashes are best looked at by a pharmacist');
  if (!has('fever') && check.dur === '3+') raise(1, 'Symptoms for 3 days or more');
  if (profile?.pregnant === true) raise(1, 'Pregnancy: check every medicine with a pharmacist');

  if (level === 0) {
    reasons.push({ to: 0, why: 'No warning signs' });
    if (check.dur !== '3+') reasons.push({ to: 0, why: 'Started less than 3 days ago' });
    if (has('fever') && check.temp !== 'over39') reasons.push({ to: 0, why: 'Temperature not above 39°C' });
  }
  return { level: LEVELS[level].id, reasons: reasons.filter((r) => r.to === level).map((r) => r.why) };
}

export function likelyCause(check) {
  const ids = check.order;
  const resp = ['fever', 'cough', 'throat', 'nose', 'aches', 'headache'];
  const gut = ['stomach', 'nausea'];
  if (ids.length && ids.every((i) => resp.includes(i)))
    return 'This looks most like a common viral illness, such as a cold or flu.';
  if (ids.length && ids.every((i) => gut.includes(i) || i === 'fever'))
    return 'This looks most like an upset stomach, often from a virus or something you ate.';
  if (ids.length === 1 && ids[0] === 'rash') return 'This could be skin irritation or an allergy.';
  return 'These symptoms have several possible causes.';
}

export function monthIndex(ym) {
  const [y, m] = ym.split('-').map(Number);
  return y * 12 + (m - 1);
}

/** 'expired' | 'soon' (within 3 months) | 'ok' | 'none' */
export function expiryStatus(item, now = new Date()) {
  if (!item.expires) return 'none';
  const cur = now.getFullYear() * 12 + now.getMonth();
  const e = monthIndex(item.expires);
  if (e < cur) return 'expired';
  if (e - cur <= 3) return 'soon';
  return 'ok';
}

export function isLow(item) {
  return item.lowAt > 0 && item.qty <= item.lowAt;
}

export function formatExpiry(ym) {
  if (!ym) return 'no expiry';
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

export function accessibleItems(state, profileId) {
  const cabs = CABINET_ACCESS[profileId] || [profileId];
  return state.cabinet.filter((i) => cabs.includes(i.cabinet));
}

function ingredientsOf(state, productId) {
  return (getProduct(state, productId)?.ingredients || []).map((x) => x.name.toLowerCase());
}

/** Last-24h summary for one person. */
export function doseSummary(state, profileId, now = new Date()) {
  const since = now.getTime() - DAY;
  const entries = state.doses
    .filter((d) => d.profileId === profileId && new Date(d.at).getTime() > since)
    .sort((a, b) => new Date(a.at) - new Date(b.at));
  let paraMg = 0;
  let paraDoses = 0;
  let lastPara = null;
  const productsWithPara = new Set();
  for (const d of entries) {
    const p = getProduct(state, d.productId);
    const para = p?.ingredients.find((x) => x.name.toLowerCase() === 'paracetamol');
    if (para) {
      paraDoses += 1;
      if (para.mg) paraMg += para.mg * d.units;
      productsWithPara.add(d.productId);
      lastPara = new Date(d.at);
    }
  }
  const nextSafeAt = lastPara ? new Date(lastPara.getTime() + PARA_MIN_GAP_H * 3600e3) : null;
  return {
    entries,
    paraMg,
    paraDoses,
    lastPara,
    nextSafeAt: nextSafeAt && nextSafeAt > now ? nextSafeAt : null,
    duplicate: productsWithPara.size > 1 ? [...productsWithPara] : null,
  };
}

/** Number of different days with a painkiller dose in the last 14 days. */
export function painkillerDays(state, profileId, now = new Date()) {
  const since = now.getTime() - 14 * DAY;
  const days = new Set();
  for (const d of state.doses) {
    if (d.profileId !== profileId || new Date(d.at).getTime() <= since) continue;
    if (getProduct(state, d.productId)?.painkiller) days.add(new Date(d.at).toDateString());
  }
  return days.size;
}

/** Can this person take this dose now? Returns { ok, blocks: [], warnings: [] } */
export function checkDose(state, profile, productId, units, now = new Date()) {
  const p = getProduct(state, productId);
  const blocks = [];
  const warnings = [];
  if (!p) return { ok: false, blocks: ['Unknown product'], warnings };
  if (profile.age < p.minAge) blocks.push(`${p.name} isn’t for anyone under ${p.minAge < 1 ? 'the age on the label' : p.minAge + ' years'}.`);
  const ings = ingredientsOf(state, productId);
  for (const a of profile.allergies || []) {
    if (!ings.includes(a.substance.toLowerCase())) continue;
    if (a.status === 'Confirmed') blocks.push(`${profile.name} is allergic to ${a.substance}.`);
    else warnings.push(`Possible reaction to ${a.substance} on file (${(a.reaction || 'unknown').toLowerCase()}). Ask a pharmacist before taking it.`);
  }
  const para = p.ingredients.find((x) => x.name.toLowerCase() === 'paracetamol');
  if (para) {
    const sum = doseSummary(state, profile.id, now);
    if (sum.nextSafeAt) blocks.push(`Too soon. The last paracetamol was under ${PARA_MIN_GAP_H} hours ago. Next safe time: ${fmtTime(sum.nextSafeAt)}.`);
    if (profile.age >= 12 && para.mg) {
      const total = sum.paraMg + para.mg * units;
      if (total > PARA_ADULT_MAX_MG) blocks.push(`This would make ${total.toLocaleString()} mg of paracetamol in 24 hours. The limit is ${PARA_ADULT_MAX_MG.toLocaleString()} mg.`);
    }
    if (profile.age < 12 && sum.paraDoses + 1 > CHILD_MAX_DOSES) blocks.push(`That would be more than ${CHILD_MAX_DOSES} doses in 24 hours.`);
    const other = sum.entries.find((d) => d.productId !== productId && ingredientsOf(state, d.productId).includes('paracetamol'));
    if (other) warnings.push(`${getProduct(state, other.productId).name} also contains paracetamol. Both count toward the same limit.`);
    if (profile.liver) blocks.push('Liver condition on file: ask a pharmacist before taking paracetamol.');
    if (profile.alcohol === 'regularly') warnings.push('Regular alcohol use lowers the safe limit. Check with a pharmacist.');
    if (profile.alcohol == null && profile.age >= 18) warnings.push('Alcohol use isn’t answered in the profile, so this check is incomplete.');
  }
  if (p.id === 'aspirin' || productId === 'aspirin') {
    if (profile.age < 16) blocks.push('Never give aspirin to children under 16.');
  }
  return { ok: blocks.length === 0, blocks, warnings };
}

/**
 * Today's scheduled medicines for one person, in time order.
 * status: 'taken' | 'due' (within an hour either side) | 'late' (over an hour past) | 'later'.
 */
export function todaysPlan(state, profileId, now = new Date()) {
  const today = now.toDateString();
  return (state.careSchedule || [])
    .filter((m) => m.profileId === profileId)
    .map((m) => {
      const [hh, mm] = m.time.split(':').map(Number);
      const due = new Date(now);
      due.setHours(hh, mm, 0, 0);
      const taken = m.takenOn === today;
      const gap = now - due;
      const status = taken ? 'taken' : gap > 3600e3 ? 'late' : gap >= -3600e3 ? 'due' : 'later';
      const dose = taken ? state.doses.find((d) => d.id === m.doseId) : null;
      return { ...m, due, taken, status, takenAt: dose ? new Date(dose.at) : null };
    })
    .sort((a, b) => a.due - b.due);
}

export function fmtTime(d) {
  return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Build a care plan from the checker answers, the profile, what's in the cabinet and what's been taken.
 * Each item: { kind: 'rec'|'caution'|'opt'|'no', key, title, short, why, productId?, itemId?, note?, shop?, tagText? }
 * 'caution' = might not suit this person (e.g. a suspected allergy). Check with a pharmacist before using.
 */
export function carePlan(state, check, profile, now = new Date()) {
  const t = triage(check, profile);
  if (!t || t.level === 'emergency') return [];
  const has = (id) => !!check.sel[id] || check.extras.includes(id);
  const child = profile.age < 12;
  const items = accessibleItems(state, profile.id);
  const find = (pid) => items.find((i) => i.productId === pid && expiryStatus(i, now) !== 'expired');
  const findAny = (pid) => items.find((i) => i.productId === pid);
  const allergyFor = (pid) => {
    const ings = ingredientsOf(state, pid);
    return (profile.allergies || []).find((a) => ings.includes(a.substance.toLowerCase()));
  };
  const plan = [];
  const sum = doseSummary(state, profile.id, now);
  const whose = profile.id === 'alex' ? 'your' : profile.name + '’s';
  const stock = (it, p) => `${it.qty} ${p.unit}${it.qty === 1 ? '' : 's'} · exp ${formatExpiry(it.expires)}`;

  const needsRelief = has('fever') || has('headache') || has('aches') || (has('throat') && check.sel.throat && check.sel.throat !== 'Mild');
  let chosenPara = null;
  if (needsRelief) {
    const pid = child ? 'paraSyrup' : 'para500';
    const p = getProduct(state, pid);
    const it = find(pid);
    const al = allergyFor(pid);
    if (al && al.status === 'Confirmed') {
      plan.push({ kind: 'no', key: 'para', title: p.name, short: `Allergic to ${al.substance.toLowerCase()}.`, why: `${profile.name} is allergic to paracetamol. Ask a pharmacist for an alternative.`, productId: pid });
    } else if (profile.liver) {
      plan.push({ kind: 'no', key: 'para', title: p.name, short: 'Liver condition on file.', why: 'Liver condition on file. Ask a pharmacist before taking any paracetamol.', productId: pid });
    } else if (!child && sum.paraMg >= PARA_ADULT_MAX_MG) {
      plan.push({ kind: 'no', key: 'para', title: p.name, short: 'Today’s limit reached.', why: 'You’ve reached today’s paracetamol limit. Wait, and use fluids and rest for now.', productId: pid });
    } else {
      chosenPara = pid;
      const notes = [];
      if (sum.nextSafeAt) notes.push(`Next dose after ${fmtTime(sum.nextSafeAt)}`);
      if (profile.alcohol == null && profile.age >= 18) notes.push('Alcohol use not answered');
      if (profile.age >= 65) notes.push('Check it suits your other medicines');
      plan.push({
        kind: 'rec', key: 'para', title: p.name, productId: pid, itemId: it?.id,
        short: child ? `Fever and pain. Dose by weight (${profile.weightKg} kg) from the label.` : 'Eases fever, headache and aches.',
        why: child
          ? `Eases fever and pain. Dose by ${profile.name}’s weight (${profile.weightKg} kg) using the chart on the label.`
          : 'Eases fever, headache and aches. One fever reducer is enough.',
        meta: it ? stock(it, p) : `Not in ${whose} cabinet`, note: notes.join(' · ') || null, shop: !it ? p.name : null,
      });
    }

    // A second pain reliever in reach: only ever an alternative, never in addition.
    const ibu = findAny('ibuprofen');
    if (ibu && !child) {
      const p = getProduct(state, 'ibuprofen');
      const al = allergyFor('ibuprofen');
      if (al && al.status === 'Confirmed') {
        plan.push({ kind: 'no', key: 'ibu', title: p.name, short: `Allergic to ${al.substance.toLowerCase()}.`, why: `${profile.name} is allergic to ibuprofen (${al.reaction.toLowerCase()}).`, productId: 'ibuprofen' });
      } else if (al) {
        plan.push({
          kind: 'caution', key: 'ibu', title: p.name, productId: 'ibuprofen', tagText: 'Possible allergy',
          short: `Possible reaction on file (${al.reaction.toLowerCase()}). Ask a pharmacist first.`,
          why: `${whose[0].toUpperCase() + whose.slice(1)} profile has a ${al.status.toLowerCase()} reaction to ibuprofen (${al.reaction.toLowerCase()}). Skip it until a pharmacist confirms it’s safe. Paracetamol is the safer choice for now.`,
          meta: stock(ibu, p),
        });
      } else if (profile.age >= 65 || profile.kidney) {
        plan.push({ kind: 'caution', key: 'ibu', title: p.name, productId: 'ibuprofen', tagText: 'Ask first', short: 'Can strain kidneys and stomach. Ask a pharmacist.', why: 'Ibuprofen can affect the kidneys and stomach, especially at 65+ or with kidney problems. Ask a pharmacist first.', meta: stock(ibu, p) });
      } else {
        plan.push({ kind: 'opt', key: 'ibu', title: p.name, productId: 'ibuprofen', short: 'Instead of paracetamol, not with it. Take with food.', why: 'An alternative if paracetamol isn’t enough. Use one or the other, take it with food, and avoid it with stomach ulcers.', meta: stock(ibu, p) });
      }
    }
  }

  const ors = find('ors');
  if (ors && (has('fever') || has('stomach') || has('nausea'))) {
    plan.push({
      kind: 'rec', key: 'fluids', title: 'Oral rehydration salts', productId: 'ors', itemId: ors.id,
      short: 'Replaces fluid lost to fever. Sip slowly and rest.',
      why: 'Replaces the fluid and salts you lose with a fever, sweating or vomiting. Mix as the pack says, sip slowly, and rest.',
      meta: stock(ors, getProduct(state, 'ors')),
    });
  } else {
    plan.push({
      kind: 'rec', key: 'fluids', title: 'Fluids & rest',
      short: 'Small sips often, and plenty of rest.',
      why: has('fever') || has('stomach') || has('nausea')
        ? 'Small sips often. An oral rehydration sachet helps if you’re sweating, vomiting or not eating.'
        : 'Rest and drink regularly while your body recovers.',
      shop: has('fever') || has('stomach') || has('nausea') ? 'Oral rehydration salts' : null,
    });
  }

  if (has('nose')) {
    const s = findAny('saline');
    if (s && expiryStatus(s, now) === 'expired') {
      plan.push({ kind: 'no', key: 'saline', title: 'Saline nasal spray', short: `Expired ${formatExpiry(s.expires)}.`, why: `Good for a blocked nose, but this bottle expired ${formatExpiry(s.expires)}.`, productId: 'saline', shop: 'Saline nasal spray' });
    } else if (s) {
      plan.push({ kind: 'rec', key: 'saline', title: 'Saline nasal spray', short: 'Rinses a runny or blocked nose.', why: 'Rinses a runny or blocked nose. Safe to use as often as needed.', productId: 'saline', itemId: s.id });
    } else {
      plan.push({ kind: 'opt', key: 'saline', title: 'Saline nasal spray', short: 'Helps a blocked nose. Not in cabinet.', why: 'Helps a blocked nose. Not in your cabinet.', productId: 'saline', shop: 'Saline nasal spray' });
    }
  }
  if (has('cough') && profile.age >= 1) {
    plan.push({ kind: 'opt', key: 'honey', title: 'Warm drink with honey', short: 'Soothes a cough. Not for babies under 1.', why: 'Can soothe a cough. Never give honey to babies under 1.' });
  }
  if (has('throat') && profile.age >= 6) {
    plan.push({ kind: 'opt', key: 'lozenge', title: 'Throat lozenges', short: 'Soothe a sore throat for a while.', why: 'Soothe a sore throat for a short while. They don’t treat the cause.', productId: 'lozenges', shop: findAny('lozenges') ? null : 'Throat lozenges' });
  }
  if (has('stomach') && !has('fever') && !child && check.sel.stomach === 'Mild') {
    const a = find('antacid');
    plan.push({ kind: 'opt', key: 'antacid', title: 'Antacid', short: 'Only for heartburn or indigestion.', why: 'Only if it feels like heartburn or indigestion.', productId: 'antacid', itemId: a?.id });
  }
  if (has('nose') && findAny('cetirizine') && !child) {
    const allergyHx = (profile.conditions || []).some((c) => /allerg/i.test(c.name) && c.status === 'Active');
    plan.push(allergyHx
      ? { kind: 'opt', key: 'antihist', title: 'Cetirizine 10 mg', short: 'Only if it’s your usual allergies.', why: 'Only if this feels like your usual seasonal allergies. It won’t help a cold.', productId: 'cetirizine' }
      : { kind: 'no', key: 'antihist', title: 'Cetirizine 10 mg', short: 'Doesn’t help a cold.', why: 'Antihistamines don’t help a common cold.', productId: 'cetirizine' });
  }
  if ((has('fever') || has('throat') || has('nose') || has('cough')) && !child) {
    plan.push({ kind: 'opt', key: 'vitc', title: 'Vitamin C', short: 'Won’t treat a fever. Fine to skip.', why: 'May shorten a cold slightly for some people. It won’t bring a fever down, so it’s fine to skip.', productId: 'vitc' });
  }

  // Things in reach that should NOT be used.
  const seen = new Set(['ibuprofen']);
  for (const it of items) {
    if (seen.has(it.productId) || it.productId === chosenPara) continue;
    const p = getProduct(state, it.productId);
    if (!p) continue;
    const ings = p.ingredients.map((x) => x.name.toLowerCase());
    if (chosenPara && ings.includes('paracetamol')) {
      seen.add(it.productId);
      plan.push({ kind: 'no', key: 'dup-' + it.productId, title: p.name, short: 'Also has paracetamol. Could double up.', why: 'Also contains paracetamol. Taking both could put you over the daily limit.', productId: it.productId });
    } else if (it.productId === 'aspirin' && child) {
      seen.add(it.productId);
      plan.push({ kind: 'no', key: 'aspirin', title: p.name, short: 'Never for children under 16.', why: 'Never give aspirin to children under 16.', productId: 'aspirin' });
    } else if (child && needsRelief && p.minAge >= 12 && p.painkiller) {
      seen.add(it.productId);
      plan.push({ kind: 'no', key: 'adult-' + it.productId, title: p.name, short: 'Adult product. Not for children.', why: 'Adult product. Not for children.', productId: it.productId });
    }
  }

  // Allergy safety net for everything suggested: confirmed → avoid, suspected/unverified → caution.
  for (const item of plan) {
    if (!item.productId || item.kind === 'no' || item.kind === 'caution') continue;
    const al = allergyFor(item.productId);
    if (!al) continue;
    if (al.status === 'Confirmed') Object.assign(item, { kind: 'no', short: `Allergic to ${al.substance.toLowerCase()}.`, why: `${profile.name} is allergic to ${al.substance.toLowerCase()}.` });
    else Object.assign(item, { kind: 'caution', tagText: 'Possible allergy', short: `Possible reaction on file (${al.reaction.toLowerCase() || 'unknown'}). Ask first.`, why: `There’s a ${al.status.toLowerCase()} reaction to ${al.substance.toLowerCase()} on file. Ask a pharmacist before using it.` });
  }

  const order = { rec: 0, caution: 1, opt: 2, no: 3 };
  return plan.sort((a, b) => order[a.kind] - order[b.kind]);
}

/** When to escalate, shown under every result. */
export function seekHelpIf(check, profile) {
  const out = [];
  if (check.sel.fever) out.push('The fever lasts more than 3 days or goes above 39.5°C');
  out.push('Any warning sign appears: trouble breathing, stiff neck, confusion, chest pain');
  out.push('You feel worse after 48 hours instead of better');
  if (profile.age < 12) out.push(`${profile.name} is unusually sleepy, floppy, or not drinking`);
  return out;
}

export function profileCompletion(p) {
  const checks = [p.age != null, p.weightKg != null, p.heightCm != null, Array.isArray(p.allergies), p.alcohol != null || p.age < 18, p.liver != null, p.kidney != null, !!p.emergency?.name];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

/** 0.5 → "½", 1.5 → "1½", 2 → "2" */
export function fmtUnits(u) {
  const whole = Math.floor(u);
  const half = u - whole >= 0.5 ? '½' : '';
  return (whole ? String(whole) : '') + half || '0';
}
