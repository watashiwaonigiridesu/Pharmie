import { Screen, Tag, Btn, Line, useToast } from '../components/ui.jsx';

const PLANS = [
  { id: 'free', name: 'Free', price: '฿0', per: 'forever', who: 'For one person getting started.', feats: ['1 profile', 'Symptom check & basic OTC guidance', 'Medicine safety alerts', 'Basic home cabinet', 'Emergency info & nearby care'] },
  { id: 'premium', name: 'Premium', price: '฿79', per: '/ month', who: 'For people who look after their own health closely.', feats: ['Everything in Free', 'Personal care plans', 'Scan medicines', 'Expiry & restock reminders', 'Symptom & medicine history'] },
  { id: 'family', name: 'Family', price: '฿149', per: '/ month', who: 'One household, separate private records.', feats: ['Everything in Premium', 'Up to 5 profiles, each with its own cabinet', 'Shared family reminders', 'Permission-based access'], featured: true },
  { id: 'plus', name: 'Premium+', price: '฿199–249', per: '/ month', who: 'For caring for someone who lives elsewhere.', feats: ['Everything in Family', 'Caregiver access, managed remotely', 'Dose tracking & care tasks', 'Caregiver alerts & shared history'] },
];

export default function PlansScreen({ state, dispatch }) {
  const toast = useToast();
  return (
    <Screen title="Plans" back="me">
      <p className="muted">The safety basics are free, always. Cancel anytime.</p>
        {PLANS.map((p) => {
          const current = state.plan === p.id;
          return (
            <section key={p.id} className="card" style={p.featured ? { border: '2px solid var(--blue)' } : undefined}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <h2>{p.name}</h2>
                {current ? <Tag kind="neutral">Your plan</Tag> : p.featured ? <Tag kind="solid">Best for households</Tag> : null}
              </div>
              <div className="row" style={{ alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: 'var(--head)', fontWeight: 600, fontSize: 30 }}>{p.price}</span>
                <span className="muted">{p.per}</span>
              </div>
              <p className="muted">{p.who}</p>
              <div className="stack">{p.feats.map((f) => <Line key={f} icon="check" tone="ink">{f}</Line>)}</div>
              {!current && (
                <div className="row">
                  <Btn kind={p.featured ? 'primary' : 'ghost'} onClick={() => { dispatch({ type: 'plan', id: p.id }); toast(`Switched to ${p.name} (demo: no payment taken)`); }}>
                    Choose {p.name}
                  </Btn>
                </div>
              )}
            </section>
          );
        })}
        <p className="disclaimer">Pharmie never promotes a brand, pharmacy or hospital. Recommendations are based on your health, not partnerships.</p>
    </Screen>
  );
}
