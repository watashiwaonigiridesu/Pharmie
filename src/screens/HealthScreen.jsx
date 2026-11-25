import { useState } from 'react';
import { PRODUCTS } from '../data.js';
import { newId } from '../store.js';
import { getProduct, profileCompletion } from '../logic.js';
import { Screen, Card, Icon, Tag, Btn, Bar, Avatar, useToast } from '../components/ui.jsx';

function Section({ icon, title, value, status, children }) {
  const tag = { ok: <Tag kind="ok" icon="check">Done</Tag>, warn: <Tag kind="warn">Needs answer</Tag> }[status];
  return (
    <details className="sect">
      <summary>
        <span className="lrow" style={{ border: 0, padding: 0, flex: 1 }}>
          <span className="ico"><Icon name={icon} /></span>
          <span className="main"><span className="t">{title}</span><span className="s">{value}</span></span>
        </span>
        {tag}
        <Icon name="chev" size={18} className="chev" />
      </summary>
      <div className="inner">{children}</div>
    </details>
  );
}

function YesNo({ id, label, value, onChange }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value == null ? '' : String(value)} onChange={(e) => onChange(e.target.value === '' ? null : e.target.value === 'true')}>
        <option value="">Not answered</option>
        <option value="false">No</option>
        <option value="true">Yes</option>
      </select>
    </div>
  );
}

export default function HealthScreen({ state, dispatch }) {
  const toast = useToast();
  const p = state.profiles[state.who];
  const upd = (patch) => dispatch({ type: 'profile', id: p.id, patch });
  const pct = profileCompletion(p);
  const [allergy, setAllergy] = useState({ substance: '', reaction: '', status: 'Confirmed' });
  const [cond, setCond] = useState('');
  const [med, setMed] = useState('');
  const adult = p.age >= 18;
  const alcoholMissing = adult && p.alcohol == null;
  const medOptions = Object.entries(PRODUCTS).filter(([id, x]) => !x.device && !p.medicines.includes(id));
  const yours = state.who === 'alex';

  return (
    <Screen title="Health info" back="me">
      <div className="row" style={{ gap: 14 }}>
        <Avatar profile={p} size={56} />
        <div className="stack" style={{ gap: 2, flex: 1 }}>
          <h2 style={{ fontSize: 24 }}>{p.name}, {p.age}</h2>
          <span className="muted small">{p.heightCm} cm · {p.weightKg} kg · {yours ? 'private to you' : 'shared with you'}</span>
        </div>
        <Icon name="lock" size={22} />
      </div>
      <div className="stack" style={{ gap: 6 }}>
        <div className="row" style={{ justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
          <span>Profile {pct}% complete</span>{alcoholMissing && <span style={{ color: 'var(--warn-ink)' }}>1 to answer</span>}
        </div>
        <Bar pct={pct} />
      </div>
        <Card>
          <h2 style={{ fontSize: 18 }}>Allergies</h2>
          {p.allergies.length === 0 && <p className="muted">No allergies recorded.</p>}
          {p.allergies.map((a) => (
            <div key={a.id} className="note note-bad" style={{ alignItems: 'center' }}>
              <Icon name="alert" size={22} stroke={2} />
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <b style={{ fontSize: 15, color: 'var(--red-ink)' }}>{a.substance}</b>
                <span style={{ color: 'var(--ink)' }}>{[a.reaction, a.severity, a.status].filter(Boolean).join(' · ')}</span>
              </span>
              <button type="button" className="btn btn-small btn-danger" aria-label={`Remove ${a.substance}`} onClick={() => upd({ allergies: p.allergies.filter((x) => x.id !== a.id) })}><Icon name="trash" size={16} /></button>
            </div>
          ))}
          <div className="grid2">
            <div className="field"><label htmlFor="al-s">Allergic to</label><input id="al-s" value={allergy.substance} onChange={(e) => setAllergy({ ...allergy, substance: e.target.value })} placeholder="e.g. Ibuprofen" /></div>
            <div className="field"><label htmlFor="al-r">Reaction</label><input id="al-r" value={allergy.reaction} onChange={(e) => setAllergy({ ...allergy, reaction: e.target.value })} placeholder="e.g. Rash" /></div>
          </div>
          <div className="row">
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="al-st">Status</label>
              <select id="al-st" value={allergy.status} onChange={(e) => setAllergy({ ...allergy, status: e.target.value })}>
                <option>Confirmed</option><option>Suspected</option><option>Unverified</option>
              </select>
            </div>
            <Btn kind="soft" icon="plus" grow={false} style={{ alignSelf: 'flex-end' }} disabled={!allergy.substance.trim()}
              onClick={() => { upd({ allergies: [...p.allergies, { id: newId('a'), substance: allergy.substance.trim(), reaction: allergy.reaction.trim(), severity: '', status: allergy.status }] }); setAllergy({ substance: '', reaction: '', status: 'Confirmed' }); }}>
              Add
            </Btn>
          </div>
          <p className="muted small">Side effects and intolerances are kept separately, so they never get mixed up with true allergies.</p>
        </Card>

        <Card style={{ gap: 0 }}>
          <Section icon="user" title="Personal info" value="Age, height, weight, language" status="ok">
            <div className="grid3">
              <div className="field"><label htmlFor="pi-age">Age</label><input id="pi-age" type="number" min="0" value={p.age} onChange={(e) => upd({ age: Number(e.target.value) })} /></div>
              <div className="field"><label htmlFor="pi-h">Height cm</label><input id="pi-h" type="number" min="0" value={p.heightCm} onChange={(e) => upd({ heightCm: Number(e.target.value) })} /></div>
              <div className="field"><label htmlFor="pi-w">Weight kg</label><input id="pi-w" type="number" min="0" value={p.weightKg} onChange={(e) => upd({ weightKg: Number(e.target.value) })} /></div>
            </div>
            <p className="muted small">Weight matters for children’s doses. Update it when it changes.</p>
          </Section>
          <Section icon="leaf" title="Conditions" value={p.conditions.map((c) => `${c.name} (${c.status.toLowerCase()})`).join(', ') || 'None reported'} status="ok">
            {p.conditions.map((c) => (
              <div key={c.id} className="row">
                <span style={{ flex: 1, fontWeight: 600 }}>{c.name} <span className="muted small">· since {c.since}</span></span>
                <select aria-label={`${c.name} status`} value={c.status} onChange={(e) => upd({ conditions: p.conditions.map((x) => (x.id === c.id ? { ...x, status: e.target.value } : x)) })} style={{ height: 40, borderRadius: 10, border: '1.5px solid var(--line)' }}>
                  <option>Active</option><option>Resolved</option>
                </select>
              </div>
            ))}
            <div className="row">
              <div className="field" style={{ flex: 1 }}><label htmlFor="co-n">Add a condition</label><input id="co-n" value={cond} onChange={(e) => setCond(e.target.value)} placeholder="e.g. Asthma" /></div>
              <Btn kind="soft" icon="plus" grow={false} style={{ alignSelf: 'flex-end' }} disabled={!cond.trim()} onClick={() => { upd({ conditions: [...p.conditions, { id: newId('c'), name: cond.trim(), status: 'Active', since: String(new Date().getFullYear()) }] }); setCond(''); }}>Add</Btn>
            </div>
          </Section>
          <Section icon="pill" title="Medicines & supplements" value={p.medicines.map((m) => getProduct(state, m)?.name).join(', ') || 'None'} status="ok">
            {p.medicines.map((m) => (
              <div key={m} className="row">
                <span style={{ flex: 1, fontWeight: 600 }}>{getProduct(state, m)?.name}</span>
                <button type="button" className="btn btn-small btn-danger" onClick={() => upd({ medicines: p.medicines.filter((x) => x !== m) })}>Remove</button>
              </div>
            ))}
            <div className="row">
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="me-a">Add a regular medicine</label>
                <select id="me-a" value={med} onChange={(e) => setMed(e.target.value)}>
                  <option value="">Choose…</option>
                  {medOptions.map(([id, x]) => <option key={id} value={id}>{x.name}</option>)}
                </select>
              </div>
              <Btn kind="soft" icon="plus" grow={false} style={{ alignSelf: 'flex-end' }} disabled={!med} onClick={() => { upd({ medicines: [...p.medicines, med] }); setMed(''); }}>Add</Btn>
            </div>
          </Section>
          <Section icon="drop" title="Other health info" value={alcoholMissing ? 'Alcohol use: not answered' : 'Liver, kidney, alcohol' + (adult ? ', pregnancy' : '')} status={alcoholMissing ? 'warn' : 'ok'}>
            {adult && (
              <div className="field">
                <label htmlFor="oh-alc">Alcohol use</label>
                <select id="oh-alc" value={p.alcohol ?? ''} onChange={(e) => upd({ alcohol: e.target.value || null })}>
                  <option value="">Not answered</option>
                  <option value="no">Don’t drink</option>
                  <option value="occasionally">Occasionally</option>
                  <option value="regularly">Most days</option>
                </select>
              </div>
            )}
            <div className="grid2">
              <YesNo id="oh-liver" label="Liver condition" value={p.liver} onChange={(v) => upd({ liver: v })} />
              <YesNo id="oh-kidney" label="Kidney condition" value={p.kidney} onChange={(v) => upd({ kidney: v })} />
            </div>
            {adult && <YesNo id="oh-preg" label="Pregnant or breastfeeding" value={p.pregnant} onChange={(v) => upd({ pregnant: v })} />}
          </Section>
          <Section icon="phone" title="Emergency info" value={`Contact: ${p.emergency.name || 'not set'}`} status={p.emergency.name ? 'ok' : 'warn'}>
            <div className="grid2">
              <div className="field"><label htmlFor="em-n">Contact name</label><input id="em-n" value={p.emergency.name} onChange={(e) => upd({ emergency: { ...p.emergency, name: e.target.value } })} /></div>
              <div className="field"><label htmlFor="em-p">Phone</label><input id="em-p" type="tel" value={p.emergency.phone} onChange={(e) => upd({ emergency: { ...p.emergency, phone: e.target.value } })} placeholder="08…" /></div>
            </div>
          </Section>
        </Card>

        {alcoholMissing && (
          <div className="note note-warn">
            <Icon name="alert" size={20} stroke={2} />
            <span>A blank answer is never read as “safe”. Until alcohol use is answered, paracetamol checks stay marked as incomplete.</span>
          </div>
        )}
        <div className="row">
          <Btn kind="ghost" icon="family" href="#/family">Sharing</Btn>
          <Btn kind="ghost" icon="sparkle" href="#/plans">Plans</Btn>
        </div>
        <button type="button" className="btn btn-small btn-soft" onClick={() => { if (window.confirm('Reset all demo data on this device?')) { dispatch({ type: 'reset' }); toast('Demo data reset'); } }}>
          Reset demo data
        </button>
        <p className="disclaimer">Your data stays in this browser on this device. Nothing is uploaded.</p>
    </Screen>
  );
}
