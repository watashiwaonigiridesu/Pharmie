import { useEffect, useReducer, useState, useCallback } from 'react';
import { initialState } from './data.js';

const KEY = 'pharmie:v3';
let uid = Date.now();
export const newId = (p = 'x') => `${p}${(uid++).toString(36)}`;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.version === 3) return s;
    }
  } catch {
    /* storage unavailable: fall back to demo data */
  }
  return initialState();
}

const log = (s, text) => [{ id: newId('l'), at: new Date().toISOString(), text }, ...s.activity].slice(0, 50);

export { reducer as reducerForTest };

function reducer(s, a) {
  switch (a.type) {
    case 'who':
      return { ...s, who: a.id };
    case 'check':
      return { ...s, check: { ...s.check, ...a.patch } };
    case 'checkReset':
      return { ...s, check: initialState().check };
    case 'logDose':
      return {
        ...s,
        doses: [...s.doses, { id: newId('d'), profileId: a.profileId, productId: a.productId, units: a.units, at: new Date().toISOString() }],
        cabinet: a.itemId ? s.cabinet.map((i) => (i.id === a.itemId ? { ...i, qty: Math.max(0, i.qty - a.units) } : i)) : s.cabinet,
      };
    case 'undoDose': {
      const mine = s.doses.filter((d) => d.profileId === a.profileId);
      const last = mine[mine.length - 1];
      return last ? { ...s, doses: s.doses.filter((d) => d.id !== last.id) } : s;
    }
    case 'qty':
      return { ...s, cabinet: s.cabinet.map((i) => (i.id === a.id ? { ...i, qty: Math.max(0, i.qty + a.delta) } : i)) };
    case 'removeItem':
      return { ...s, cabinet: s.cabinet.filter((i) => i.id !== a.id) };
    case 'addItem':
      return {
        ...s,
        customProducts: a.product ? { ...s.customProducts, [a.productId]: a.product } : s.customProducts,
        cabinet: [...s.cabinet, { id: newId('i'), productId: a.productId, cabinet: a.cabinet, qty: a.qty, expires: a.expires || null, lowAt: a.lowAt ?? 2 }],
      };
    case 'profile':
      return { ...s, profiles: { ...s.profiles, [a.id]: { ...s.profiles[a.id], ...a.patch } } };
    case 'solo':
      return { ...s, solo: { ...s.solo, ...a.patch } };
    case 'careToggle': {
      // Tick a scheduled medicine: logs a dose now and takes one from the cabinet. Untick undoes both.
      const m = s.careSchedule.find((x) => x.id === a.id);
      if (!m) return s;
      const today = new Date().toDateString();
      if (m.takenOn === today) {
        const dose = s.doses.find((d) => d.id === m.doseId);
        return {
          ...s,
          careSchedule: s.careSchedule.map((x) => (x.id === m.id ? { ...x, takenOn: null, doseId: null } : x)),
          doses: s.doses.filter((d) => d.id !== m.doseId),
          cabinet: dose?.itemId ? s.cabinet.map((i) => (i.id === dose.itemId ? { ...i, qty: i.qty + dose.units } : i)) : s.cabinet,
          activity: a.text ? log(s, a.text) : s.activity,
        };
      }
      const doseId = newId('d');
      const item = s.cabinet.find((i) => i.productId === m.productId && i.qty > 0);
      const units = m.units || 1;
      return {
        ...s,
        careSchedule: s.careSchedule.map((x) => (x.id === m.id ? { ...x, takenOn: today, doseId } : x)),
        doses: [...s.doses, { id: doseId, profileId: m.profileId, productId: m.productId, units, at: new Date().toISOString(), itemId: item?.id }],
        cabinet: item ? s.cabinet.map((i) => (i.id === item.id ? { ...i, qty: Math.max(0, i.qty - units) } : i)) : s.cabinet,
        activity: a.text ? log(s, a.text) : s.activity,
      };
    }
    case 'share':
      return { ...s, shares: [...s.shares, { id: newId('s'), ...a.share }], activity: log(s, `You gave ${a.share.to} ${a.share.level.toLowerCase()} access (${a.share.scope})`) };
    case 'revoke': {
      const sh = s.shares.find((x) => x.id === a.id);
      return { ...s, shares: s.shares.filter((x) => x.id !== a.id), activity: sh ? log(s, `You removed ${sh.to}’s ${sh.level.toLowerCase()} access`) : s.activity };
    }
    case 'member':
      return { ...s, members: [...s.members, { id: newId('p'), ...a.member }], activity: log(s, `You added ${a.member.name} to the family`) };
    case 'log':
      return { ...s, activity: log(s, a.text) };
    case 'region':
      return { ...s, region: a.id };
    case 'product':
      return { ...s, customProducts: { ...s.customProducts, [a.id]: a.product } };
    case 'draft':
      return { ...s, draft: a.draft };
    case 'plan':
      return { ...s, plan: a.id };
    case 'reset':
      return initialState();
    default:
      return s;
  }
}

export function useStore() {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore quota / private mode */
    }
  }, [state]);
  return [state, dispatch];
}

// Routing. The deployed site uses the URL hash (#/screen/param) so the browser's
// back button works. The Claude preview runs in a sandbox that doesn't allow
// #/paths, so it keeps the route in memory (build with VITE_ROUTER=memory).
const MEMORY = import.meta.env.VITE_ROUTER === 'memory';
const parse = (path) => {
  const parts = (path.replace(/^#?\/?/, '') || 'check').split('/');
  return { name: parts[0] || 'check', param: parts[1] ? decodeURIComponent(parts.slice(1).join('/')) : null };
};

function useMemoryRoute() {
  const [stack, setStack] = useState([parse('check')]);
  const go = useCallback((path) => { setStack((s) => [...s, parse(path)]); window.scrollTo(0, 0); }, []);
  const back = useCallback(() => { setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)); window.scrollTo(0, 0); }, []);
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest && e.target.closest('a[href^="#/"]');
      if (!a || e.defaultPrevented || e.button !== 0) return;
      e.preventDefault();
      go(a.getAttribute('href').slice(1));
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [go]);
  return [stack[stack.length - 1], go, back];
}

function useHashRoute() {
  const read = () => parse(window.location.hash);
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => { setRoute(read()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const go = useCallback((path) => { window.location.hash = '/' + path.replace(/^#?\/?/, ''); }, []);
  const back = useCallback(() => { if (window.history.length > 1) window.history.back(); else window.location.hash = '/check'; }, []);
  return [route, go, back];
}

export const useRoute = MEMORY ? useMemoryRoute : useHashRoute;
