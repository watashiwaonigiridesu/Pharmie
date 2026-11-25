import { useState } from 'react';
import { todaysPlan, getProduct } from '../logic.js';
import { Screen, SubTabs, Icon, Tag, Btn, Line, Avatar, useToast } from '../components/ui.jsx';

const LEVELS = [
  ['View', 'See the parts you choose'],
  ['Edit', 'Update the parts you choose'],
  ['Manage dependent', 'Run a child’s or dependent’s profile'],
  ['Emergency access', 'Emergency info only, when needed'],
];

function when(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function People({ state, dispatch, go }) {
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [member, setMember] = useState({ name: '', kind: 'adult', age: '' });
  const momDue = todaysPlan(state, 'mom').filter((s) => !s.taken).length;
  const note = {
    alex: 'You · owner',
    mai: 'Partner · manages her own profile',
    leo: `Child · ${state.profiles.leo.weightKg} kg · you and Mai manage`,
    mom: 'You’re her caregiver',
  };
  const open = (id) => { dispatch({ type: 'who', id }); go('me'); };
  const today = new Date().toDateString();
  return (
    <>
      <section className="card" style={{ gap: 0 }} aria-label="Family and today’s medicine">
        {state.members.map((m) => {
          const prof = state.profiles[m.id];
          const plan = prof ? todaysPlan(state, m.id) : [];
          const done = plan.filter((x) => x.taken).length;
          const careIds = new Set(plan.map((x) => x.doseId).filter(Boolean));
          const extra = prof ? state.doses.filter((d) => d.profileId === m.id && new Date(d.at).toDateString() === today && !careIds.has(d.id)).length : 0;
          const name = m.id === 'alex' ? 'Alex (you)' : m.name;
          return (
            <div key={m.id} className="fam">
              <button type="button" className="fam-head" disabled={!prof} onClick={() => open(m.id)} aria-label={prof ? `Open ${m.name}’s medicines` : undefined}>
                {prof ? <Avatar profile={prof} size={44} /> : <span className="avatar" style={{ width: 44, height: 44, borderRadius: 22, background: '#eaeef3', color: '#46566a', fontSize: 20 }} aria-hidden="true">{m.name[0]}</span>}
                <span className="main">
                  <span className="t">{name}{prof && m.id !== 'alex' ? ` · ${prof.age}` : ''}</span>
                  <span className="s">{note[m.id] || m.meta}</span>
                </span>
                {plan.length > 0 && <span className={`fam-sum ${done === plan.length ? 'done' : ''}`}>{done}/{plan.length} taken</span>}
                {prof && <Icon name="chev" size={18} />}
              </button>
              {plan.length ? (
                <ul className="mini" aria-label={`${m.name}’s medicine today`}>
                  {plan.map((x) => {
                    const p = getProduct(state, x.productId);
                    return (
                      <li key={x.id}>
                        <button type="button" role="checkbox" aria-checked={x.taken} className={`mini-row ${x.taken ? 'on' : ''}`}
                          onClick={() => { dispatch({ type: 'careToggle', id: x.id, text: `${m.id === 'alex' ? 'You' : m.name}: ${x.time} ${p.name} marked ${x.taken ? 'not taken' : 'taken'}` }); toast(`${m.id === 'alex' ? '' : m.name + '’s '}${p.name} ${x.taken ? 'unticked' : 'ticked off'}`); }}>
                          <span className={`tick ${x.taken ? 'on' : ''}`} aria-hidden="true">{x.taken && <Icon name="check" size={12} stroke={3} />}</span>
                          <time>{x.time}</time>
                          <span className="n">{p.name}</span>
                          {x.status === 'late' && <span className="late">Missed?</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mini-none"><Icon name="check" size={16} stroke={2.6} />No medication needed</p>
              )}
              {extra > 0 && <p className="mini-more">+ {extra} as-needed dose{extra > 1 ? 's' : ''} today</p>}
            </div>
          );
        })}
      </section>
      {momDue > 0 && (
        <div className="note note-warn" style={{ alignItems: 'center' }}>
          <Icon name="bell" size={20} />
          <span style={{ flex: 1 }}>Mom has {momDue} dose{momDue > 1 ? 's' : ''} still to take today.</span>
          <button type="button" className="btn btn-small btn-soft" onClick={() => { dispatch({ type: 'log', text: 'Reminder sent to Mom' }); toast('Reminder sent to Mom (demo)'); }}>Remind</button>
        </div>
      )}
      {adding ? (
        <section className="card">
          <h2>Add someone</h2>
          <div className="field"><label htmlFor="m-n">Name</label><input id="m-n" value={member.name} onChange={(e) => setMember({ ...member, name: e.target.value })} /></div>
          <div className="grid2">
            <div className="field">
              <label htmlFor="m-k">Who is it</label>
              <select id="m-k" value={member.kind} onChange={(e) => setMember({ ...member, kind: e.target.value })}>
                <option value="adult">Adult</option><option value="child">Child</option><option value="parent">Parent I care for</option>
              </select>
            </div>
            <div className="field"><label htmlFor="m-a">Age</label><input id="m-a" type="number" min="0" value={member.age} onChange={(e) => setMember({ ...member, age: e.target.value })} /></div>
          </div>
          <div className="row">
            <Btn kind="ghost" grow={false} onClick={() => setAdding(false)}>Cancel</Btn>
            <Btn disabled={!member.name.trim()} onClick={() => {
              const meta = { adult: 'Adult · manages their own profile', child: `Child${member.age ? ' · ' + member.age : ''} · you’re the guardian`, parent: 'You’re their caregiver' }[member.kind];
              dispatch({ type: 'member', member: { name: member.name.trim(), meta, kind: member.kind } });
              toast(`${member.name.trim()} added`);
              setMember({ name: '', kind: 'adult', age: '' });
              setAdding(false);
            }}>Add</Btn>
          </div>
        </section>
      ) : (
        <Btn kind="ghost" icon="plus" onClick={() => setAdding(true)}>Add someone</Btn>
      )}
    </>
  );
}

function Sharing({ state, dispatch }) {
  const toast = useToast();
  const [share, setShare] = useState({ to: 'Mai', level: 'View', scope: 'Allergies' });
  return (
    <>
      <section className="card">
        <h2>Who can see your records</h2>
        {state.shares.length === 0 && <p className="muted">Nobody. Your profile is private.</p>}
        {state.shares.map((s) => (
          <div key={s.id} className="lrow">
            <span className="main"><span className="t">{s.to}</span><span className="s">{s.level} · {s.scope}</span></span>
            <button type="button" className="btn btn-danger" onClick={() => { dispatch({ type: 'revoke', id: s.id }); toast(`${s.to}’s access removed`); }}>Revoke</button>
          </div>
        ))}
      </section>
      <details className="card">
        <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 16 }}>Give someone access</summary>
        <div className="grid2" style={{ marginTop: 10 }}>
          <div className="field">
            <label htmlFor="sh-to">Person</label>
            <select id="sh-to" value={share.to} onChange={(e) => setShare({ ...share, to: e.target.value })}>
              {state.members.filter((m) => m.id !== 'alex').map((m) => <option key={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="sh-lv">Level</label>
            <select id="sh-lv" value={share.level} onChange={(e) => setShare({ ...share, level: e.target.value })}>
              {LEVELS.map(([l]) => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="sh-sc">What they can see</label>
          <select id="sh-sc" value={share.scope} onChange={(e) => setShare({ ...share, scope: e.target.value })}>
            {['Allergies', 'Medicines', 'Conditions', 'Emergency info', 'Everything'].map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>
        <p className="muted small">{LEVELS.find(([l]) => l === share.level)[1]}. You can revoke it any time.</p>
        <Btn kind="soft" icon="plus" onClick={() => { dispatch({ type: 'share', share }); toast(`${share.to} can now ${share.level.toLowerCase()}`); }}>Give access</Btn>
      </details>
      <section className="card">
        <h2>Recent activity</h2>
        <div className="stack">
          {state.activity.slice(0, 4).map((a) => <Line key={a.id} icon="eye" tone="ink">{a.text} · {when(a.at)}</Line>)}
        </div>
      </section>
    </>
  );
}

export default function FamilyScreen({ state, dispatch, go, param }) {
  const tab = param === 'sharing' ? 'sharing' : '';
  return (
    <Screen title="Family">
      <SubTabs base="family" value={tab} tabs={[['', 'People'], ['sharing', 'Sharing']]} />
      {tab === '' ? <People state={state} dispatch={dispatch} go={go} /> : <Sharing state={state} dispatch={dispatch} />}
    </Screen>
  );
}
