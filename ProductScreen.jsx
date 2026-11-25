import { getProduct, accessibleItems, expiryStatus, formatExpiry } from '../logic.js';
import { Screen, Icon, Btn, Line, Tag, useToast } from '../components/ui.jsx';

export default function ProductScreen({ state, dispatch, go, param }) {
  const toast = useToast();
  const p = getProduct(state, param);
  const profile = state.profiles[state.who];
  if (!p) {
    return (
      <Screen title="Not found" back="cabinet" cta={<Btn href="#/cabinet">Open cabinet</Btn>}>
        <p className="muted">This medicine isn’t in Pharmie’s list.</p>
      </Screen>
    );
  }
  const items = accessibleItems(state, profile.id);
  const item = items.find((i) => i.productId === param);
  const ings = p.ingredients.map((x) => x.name.toLowerCase());
  const clashes = items
    .filter((i) => i.productId !== param)
    .map((i) => ({ i, q: getProduct(state, i.productId) }))
    .filter(({ q }) => q && q.ingredients.some((x) => ings.includes(x.name.toLowerCase())));
  const allergy = profile.allergies.find((a) => ings.includes(a.substance.toLowerCase()));
  const tooYoung = profile.age < p.minAge;
  const isPara = ings.includes('paracetamol');
  const status = item ? expiryStatus(item) : null;

  const canLog = item && !allergy && !tooYoung && status !== 'expired' && !p.device;
  return (
    <Screen title={p.name} back="cabinet"
      cta={canLog ? <Btn icon="plus" href={`#/log/${param}`}>Log a dose</Btn> : <Btn kind="soft" icon="pin" href="#/explore/pharmacy">Find a pharmacy nearby</Btn>}>
      <div className="row wrap">{allergy ? <Tag kind="bad" icon="x">Allergy</Tag> : tooYoung ? <Tag kind="bad" icon="x">Not for this age</Tag> : <Tag kind="info">{p.category}</Tag>}<span className="small" style={{ color: 'var(--muted)' }}>{p.form}</span></div>
        <section className="card">
          <h2>At a glance</h2>
          <div className="grid2">
            <div className="kv"><span>Active ingredient</span><span>{p.ingredients.map((x) => x.name).join(', ') || 'None'}</span></div>
            <div className="kv"><span>Strength</span><span>{p.ingredients.filter((x) => x.mg).map((x) => `${x.mg} mg`).join(' + ') || 'See label'}</span></div>
            <div className="kv"><span>Used for</span><span>{p.purpose}</span></div>
            <div className="kv"><span>Age</span><span>{p.minAge >= 1 ? `${p.minAge} years and up` : 'See label'}</span></div>
            {item && <div className="kv"><span>Left</span><span>{item.qty} {p.unit}{item.qty === 1 ? '' : 's'}</span></div>}
            {item && <div className="kv"><span>Expires</span><span style={{ color: status === 'expired' ? 'var(--red-ink)' : undefined }}>{formatExpiry(item.expires)}</span></div>}
          </div>
        </section>
        <section className="card">
          <h2>How to take it</h2>
          <p className="body">Always follow the label on your pack. A typical label says:</p>
          <div className="stack">
            {p.label.map((l) => <Line key={l} icon="pill" tone="ink">{l}</Line>)}
          </div>
          {isPara && profile.age < 12 && p.minAge >= 12 && <p className="muted small">For children under 12, use a children’s syrup dosed by weight.</p>}
        </section>
        <section className="card">
          <h2>Checked against {state.who === 'alex' ? 'your' : profile.name + '’s'} profile</h2>
          <div className="stack">
            {allergy ? <Line icon="x" tone="bad">Allergic to {allergy.substance} ({allergy.reaction.toLowerCase()})</Line> : <Line icon="check" tone="ok">No allergy to these ingredients on file</Line>}
            {tooYoung ? <Line icon="x" tone="bad">Not for age {profile.age}</Line> : <Line icon="check" tone="ok">Suitable for age {profile.age}</Line>}
            {isPara && (profile.liver ? <Line icon="x" tone="bad">Liver condition on file: ask a pharmacist first</Line> : <Line icon="check" tone="ok">No liver condition reported</Line>)}
            {isPara && profile.age >= 18 && profile.alcohol == null && <Line icon="alert" tone="warn">Alcohol use not answered yet. Regular drinking lowers the safe limit.</Line>}
            {p.cautions.filter((c) => !/paracetamol|liver|alcohol/i.test(c)).map((c) => <Line key={c} icon="alert" tone="warn">Take care with: {c}</Line>)}
          </div>
          {isPara && profile.age >= 18 && profile.alcohol == null && <a href="#/health">Answer now to finish the check</a>}
        </section>
        {clashes.length > 0 && (
          <section className="card card-bad">
            <div className="row"><span className="tone-bad" style={{ display: 'flex' }}><Icon name="x" size={20} stroke={2.4} /></span><h2 style={{ fontSize: 18 }}>Don’t take with</h2></div>
            {clashes.map(({ i, q }) => (
              <p key={i.id} className="muted"><b style={{ color: 'var(--ink)' }}>{q.name}</b> (in your cabinet) also contains {q.ingredients.filter((x) => ings.includes(x.name.toLowerCase())).map((x) => x.name).join(', ')}. Both count toward the same limit.</p>
            ))}
          </section>
        )}
        {item && <button type="button" className="btn btn-danger" onClick={() => { dispatch({ type: 'removeItem', id: item.id }); toast(`${p.name} removed from the cabinet`); go('cabinet'); }}><Icon name="trash" size={16} />Remove from cabinet</button>}
    </Screen>
  );
}
