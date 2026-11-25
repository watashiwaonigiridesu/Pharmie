import { useState } from 'react';
import { getProduct, accessibleItems, doseSummary, todaysPlan, expiryStatus, isLow, formatExpiry, fmtTime, fmtUnits, PARA_ADULT_MAX_MG, CHILD_MAX_DOSES } from '../logic.js';
import { Screen, SubTabs, Icon, Tag, Btn, Bar, useToast } from '../components/ui.jsx';

const dayKey = (d) => new Date(d).toDateString();
const paraMg = (state, d) => (getProduct(state, d.productId)?.ingredients.find((x) => x.name.toLowerCase() === 'paracetamol')?.mg || 0) * d.units;

function DoseRow({ state, d, showDate }) {
  const p = getProduct(state, d.productId);
  const mg = paraMg(state, d);
  return (
    <div className="lrow">
      <span className="ico"><Icon name="pill" /></span>
      <span className="main">
        <span className="t">{p?.name || 'Unknown'} × {fmtUnits(d.units)}</span>
        <span className="s">{showDate ? new Date(d.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' · ' : ''}{fmtTime(d.at)}{mg ? ` · ${mg.toLocaleString()} mg paracetamol` : ''}</span>
      </span>
    </div>
  );
}

const STATUS = {
  taken: null,
  due: ['info', 'Take now'],
  late: ['warn', 'Missed?'],
  later: null,
};

function TodayPlan({ state, dispatch, profile }) {
  const toast = useToast();
  const plan = todaysPlan(state, profile.id);
  const done = plan.filter((m) => m.taken).length;
  const who = profile.id === 'alex' ? 'Your' : `${profile.name}’s`;
  return (
    <section className="card plan-card">
      <div className="plan-head">
        <div>
          <h2>Today’s medicine</h2>
          <span className="muted small">{plan.length ? `${done} of ${plan.length} taken` : 'Nothing scheduled'}</span>
        </div>
        {plan.length > 0 && <Ring value={done} total={plan.length} />}
      </div>
      {plan.length === 0 && <p className="muted small">{who} regular medicines will show here as a daily checklist.</p>}
      <ul className="todo" aria-label="Today’s medicine checklist">
        {plan.map((m) => {
          const p = getProduct(state, m.productId);
          const tag = STATUS[m.status];
          const name = p?.name || 'Medicine';
          return (
            <li key={m.id}>
              <button type="button" role="checkbox" aria-checked={m.taken} className={`todo-row ${m.taken ? 'on' : ''} ${m.status}`}
                onClick={() => {
                  dispatch({ type: 'careToggle', id: m.id, text: profile.id === 'alex' ? null : `${profile.name}’s ${m.time} ${name} marked ${m.taken ? 'not taken' : 'taken'}` });
                  toast(m.taken ? `Unticked ${name}` : `${name} ticked off`);
                }}>
                <span className={`tick ${m.taken ? 'on' : ''}`} aria-hidden="true">{m.taken && <Icon name="check" size={16} stroke={3} />}</span>
                <span className="todo-time">{m.time}</span>
                <span className="todo-main">
                  <span className="t">{name}</span>
                  <span className="s">{m.taken ? `Taken ${fmtTime(m.takenAt || m.due)}` : `${fmtUnits(m.units || 1)} ${p?.unit || 'dose'}${(m.units || 1) === 1 ? '' : 's'}${m.note ? ' · ' + m.note : ''}`}</span>
                </span>
                {tag && <Tag kind={tag[0]}>{tag[1]}</Tag>}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Ring({ value, total }) {
  const r = 17;
  const c = 2 * Math.PI * r;
  const pct = total ? value / total : 0;
  return (
    <svg className="ring" width="44" height="44" viewBox="0 0 44 44" role="img" aria-label={`${value} of ${total} taken`}>
      <circle cx="22" cy="22" r={r} fill="none" stroke="var(--sky)" strokeWidth="5" />
      <circle cx="22" cy="22" r={r} fill="none" stroke={pct === 1 ? 'var(--ok-ink)' : 'var(--pill-blue)'} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={`${c * pct} ${c}`} transform="rotate(-90 22 22)" />
      <text x="22" y="26.5" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--ink)">{value}/{total}</text>
    </svg>
  );
}

/** Last 24 hours as a small time strip plus one short line per dose. */
function Last24({ state, profile, sum }) {
  const now = Date.now();
  const from = now - 24 * 3600e3;
  const adult = profile.age >= 12;
  const pct = adult ? (sum.paraMg / PARA_ADULT_MAX_MG) * 100 : (sum.paraDoses / CHILD_MAX_DOSES) * 100;
  const ticks = [];
  const t0 = new Date(from);
  t0.setMinutes(0, 0, 0);
  for (let t = t0.getTime() + 3600e3; t < now; t += 3600e3) if (new Date(t).getHours() % 6 === 0) ticks.push(t);
  const pos = (t) => `${Math.min(100, Math.max(0, ((new Date(t).getTime() - from) / (now - from)) * 100))}%`;
  const dupes = new Set(sum.duplicate || []);
  return (
    <section className="card last24">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2>Last 24 hours</h2>
        <a className="small" href="#/me/calendar">Calendar</a>
      </div>
      <div className="dstrip" aria-hidden="true">
        <div className="dstrip-rail" />
        {ticks.map((t) => <span key={t} className="dstrip-tick" style={{ left: pos(t) }}><i />{String(new Date(t).getHours()).padStart(2, '0')}:00</span>)}
        {sum.entries.map((d) => <span key={d.id} className={`dstrip-dot ${dupes.has(d.productId) ? 'warn' : ''}`} style={{ left: pos(d.at) }} />)}
        <span className="dstrip-now" style={{ left: '100%' }}>now</span>
      </div>
      {sum.duplicate && (
        <p className="attn" role="alert"><Icon name="alert" size={16} /><span><b>Paracetamol from {sum.duplicate.length} products.</b> {sum.duplicate.map((id) => getProduct(state, id).name).join(' and ')} both contain it, so stick to one.</span></p>
      )}
      {sum.entries.length ? (
        <ol className="tl">
          {[...sum.entries].reverse().map((d) => {
            const p = getProduct(state, d.productId);
            const mg = paraMg(state, d);
            return (
              <li key={d.id}>
                <a href={`#/product/${d.productId}`} className="tl-row">
                  <time dateTime={d.at}>{fmtTime(d.at)}</time>
                  <i className={dupes.has(d.productId) ? 'warn' : ''} aria-hidden="true" />
                  <span className="t">{p?.name || 'Unknown'} <b>× {fmtUnits(d.units)}</b></span>
                  {mg > 0 && <span className="s">{mg.toLocaleString()} mg para</span>}
                </a>
              </li>
            );
          })}
        </ol>
      ) : <p className="muted small">Nothing taken in the last 24 hours.</p>}
      {(sum.paraMg > 0 || sum.paraDoses > 0) && (
        <div className="para-line">
          <span><b>Paracetamol</b> {adult ? `${(sum.paraMg / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} g of 4 g` : `${sum.paraDoses} of ${CHILD_MAX_DOSES} doses`}</span>
          <span className="muted">{sum.nextSafeAt ? `next from ${fmtTime(sum.nextSafeAt)}` : 'OK to take now'}</span>
          <Bar pct={pct} tone={pct >= 75 ? 'red' : 'orange'} />
        </div>
      )}
    </section>
  );
}

function Today({ state, dispatch, profile }) {
  const toast = useToast();
  const sum = doseSummary(state, profile.id);
  const solo = state.solo;
  return (
    <>
      <TodayPlan state={state} dispatch={dispatch} profile={profile} />
      <Last24 state={state} profile={profile} sum={sum} />
      {profile.id === 'alex' && (
        <section className="card solo">
          <div className="row">
            <span style={{ display: 'flex', color: 'var(--blue-ink)' }}><Icon name="bell" size={20} /></span>
            <span style={{ flex: 1 }}>
              <b>Solo check-in</b>
              <span className="muted small" style={{ display: 'block' }}>{solo.on ? `Next at ${fmtTime(solo.nextAt)} · no reply in 30 min messages ${solo.contact}` : 'Turn on if you’re sick and home alone'}</span>
            </span>
            <button type="button" role="switch" aria-checked={solo.on} className={`tag ${solo.on ? 'tag-solid' : 'tag-neutral'}`} style={{ border: 0, cursor: 'pointer', height: 34, padding: '0 14px', alignSelf: 'center' }}
              onClick={() => dispatch({ type: 'solo', patch: { on: !solo.on, alerted: false, nextAt: new Date(Date.now() + solo.everyHours * 3600e3).toISOString() } })}>
              {solo.on ? 'On' : 'Off'}
            </button>
          </div>
          {solo.on && <button type="button" className="btn btn-small btn-soft" onClick={() => { dispatch({ type: 'solo', patch: { nextAt: new Date(Date.now() + solo.everyHours * 3600e3).toISOString() } }); toast('Thanks. We’ll check again in ' + solo.everyHours + ' hours'); }}>I’m OK right now</button>}
        </section>
      )}
    </>
  );
}

function Calendar({ state, profile }) {
  const now = new Date();
  const [offset, setOffset] = useState(0);
  const [sel, setSel] = useState(dayKey(now));
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const daysIn = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday first
  const mine = state.doses.filter((d) => d.profileId === profile.id);
  const byDay = {};
  for (const d of mine) (byDay[dayKey(d.at)] ||= []).push(d);
  const warnDay = (list) => new Set(list.filter((d) => paraMg(state, d)).map((d) => d.productId)).size > 1;
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let n = 1; n <= daysIn; n++) cells.push(new Date(first.getFullYear(), first.getMonth(), n));
  const selList = (byDay[sel] || []).sort((a, b) => new Date(a.at) - new Date(b.at));
  const daysWith = Object.keys(byDay).filter((k) => new Date(k).getMonth() === first.getMonth() && new Date(k).getFullYear() === first.getFullYear()).length;
  return (
    <>
      <div className="cal">
        <div className="cal-head">
          <button type="button" className="icon-btn" style={{ margin: 0 }} aria-label="Previous month" onClick={() => setOffset(offset - 1)}><Icon name="back" size={20} stroke={2.2} /></button>
          <h2>{first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</h2>
          <button type="button" className="icon-btn" style={{ margin: 0 }} aria-label="Next month" disabled={offset >= 0} onClick={() => setOffset(offset + 1)}><Icon name="chev" size={20} stroke={2.2} /></button>
        </div>
        <div className="cal-grid">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i} className="cal-dow" aria-hidden="true">{d}</span>)}
          {cells.map((c, i) => {
            if (!c) return <span key={'e' + i} />;
            const k = dayKey(c);
            const list = byDay[k] || [];
            const future = c > now;
            return (
              <button key={k} type="button" disabled={future} className={`cal-day ${k === dayKey(now) ? 'today' : ''} ${k === sel ? 'sel' : ''}`}
                aria-pressed={k === sel} aria-label={`${c.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}: ${list.length ? list.length + ' dose' + (list.length > 1 ? 's' : '') : 'no doses'}`}
                onClick={() => setSel(k)}>
                {c.getDate()}
                <span className="cal-dots" aria-hidden="true">{list.slice(0, 3).map((d, j) => <i key={j} className={warnDay(list) ? 'warn' : ''} />)}</span>
              </button>
            );
          })}
        </div>
        <div className="legend">
          <span><i style={{ background: 'var(--pill-blue)' }} />Dose taken</span>
          <span><i style={{ background: 'var(--warn)' }} />Same ingredient twice</span>
          <span className="spacer">{daysWith} day{daysWith === 1 ? '' : 's'} with doses</span>
        </div>
      </div>
      <section className="card">
        <h2>{new Date(sel).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
        {selList.length ? <div>{selList.map((d) => <DoseRow key={d.id} state={state} d={d} />)}</div> : <p className="muted">No doses logged this day.</p>}
      </section>
    </>
  );
}

const GROUPS = [
  ['otc', 'OTC medicines', 'Bought without a prescription'],
  ['supplement', 'Supplements', 'Vitamins and similar'],
  ['rx', 'Prescription', 'From a doctor'],
];
const groupOf = (p) => (p.prescription ? 'rx' : p.supplement ? 'supplement' : 'otc');

function Stock({ state, profile }) {
  const [only, setOnly] = useState('all');
  const items = accessibleItems(state, profile.id)
    .map((i) => ({ i, p: getProduct(state, i.productId) }))
    .filter(({ p }) => p && !p.device)
    .sort((a, b) => Number(isLow(b.i) || expiryStatus(b.i) === 'expired') - Number(isLow(a.i) || expiryStatus(a.i) === 'expired'));
  const count = (g) => items.filter(({ p }) => groupOf(p) === g).length;
  const shown = GROUPS.filter(([g]) => only === 'all' || only === g);
  return (
    <section className="card find">
      <div className="chips" role="group" aria-label="Show">
        {[['all', 'All', items.length], ...GROUPS.map(([g, label]) => [g, label.replace(' medicines', '').replace('Prescription', 'Prescribed'), count(g)])].map(([g, label, n]) => (
          <button key={g} type="button" className={`chip ${only === g ? 'on' : ''}`} aria-pressed={only === g} onClick={() => setOnly(g)}>{label} <span>{n}</span></button>
        ))}
      </div>
      <div className="scrollbox tall" tabIndex={0} aria-label="Pills left">
        {shown.map(([g, label, sub]) => {
          const list = items.filter(({ p }) => groupOf(p) === g);
          return (
            <div key={g} className="group">
              <h3 className="group-head">{label} <span>{list.length ? sub : 'None'}</span></h3>
              {list.map(({ i, p }) => {
                const st = expiryStatus(i);
                const low = isLow(i);
                const cap = Math.max(i.lowAt * 4, i.qty, 1);
                return (
                  <a key={i.id} className="crow" href={`#/product/${i.productId}`}>
                    <span className="ico"><Icon name="pill" size={18} /></span>
                    <span className="main">
                      <span className="t">{p.name}</span>
                      <span className="s"><b style={{ color: 'var(--ink)' }}>{fmtUnits(i.qty)}</b> {p.unit}{i.qty === 1 ? '' : 's'} left · exp {formatExpiry(i.expires)}</span>
                      <Bar pct={(i.qty / cap) * 100} tone={low ? 'orange' : 'blue'} />
                    </span>
                    {st === 'expired' ? <Tag kind="bad">Expired</Tag> : low ? <Tag kind="warn">Low</Tag> : st === 'soon' ? <Tag kind="warn">Soon</Tag> : null}
                  </a>
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function MeScreen({ state, dispatch, param }) {
  const profile = state.profiles[state.who];
  const tab = ['calendar', 'stock'].includes(param) ? param : '';
  return (
    <Screen title={state.who === 'alex' ? 'My medicines' : `${profile.name}’s medicines`} cta={<Btn icon="plus" href="#/log">Log a dose</Btn>}>
      <SubTabs base="me" value={tab} tabs={[['', 'Today'], ['calendar', 'Calendar'], ['stock', 'Pills left']]} />
      {tab === '' && <Today state={state} dispatch={dispatch} profile={profile} />}
      {tab === 'calendar' && <Calendar state={state} profile={profile} />}
      {tab === 'stock' && <Stock state={state} profile={profile} />}
    </Screen>
  );
}
