import { SYMPTOMS } from '../data.js';
import { doseSummary, getProduct } from '../logic.js';
import { Screen, Card, Icon, Btn, Line, useToast, shareText } from '../components/ui.jsx';

const NEARBY = [
  { kind: 'Pharmacy', icon: 'pill', q: 'pharmacy' },
  { kind: 'Clinic', icon: 'cross', q: 'clinic' },
  { kind: 'Hospital · emergency room', icon: 'cross', q: 'hospital emergency' },
];

export default function HelpScreen({ state, dispatch }) {
  const toast = useToast();
  const p = state.profiles[state.who];
  const sum = doseSummary(state, p.id);
  const symptoms = state.check.order.map((id) => `${SYMPTOMS.find((s) => s.id === id).label} (${state.check.sel[id].toLowerCase()})`);
  const meds = Object.values(
    sum.entries.reduce((acc, d) => {
      const name = getProduct(state, d.productId)?.name || 'Unknown';
      acc[name] = acc[name] || { name, units: 0 };
      acc[name].units += d.units;
      return acc;
    }, {})
  );
  const summaryText = [
    `Pharmie summary for ${p.name}, ${p.age}, ${p.weightKg} kg`,
    `Symptoms: ${symptoms.join(', ') || 'none entered'}`,
    `Taken in last 24h: ${meds.map((m) => `${m.name} × ${m.units}`).join(', ') || 'nothing logged'}${sum.paraMg ? ` (paracetamol ${sum.paraMg} mg)` : ''}`,
    `Allergies: ${p.allergies.map((a) => `${a.substance} (${a.status.toLowerCase()})`).join(', ') || 'none recorded'}`,
    `Regular medicines: ${p.medicines.map((m) => getProduct(state, m)?.name).join(', ') || 'none'}`,
    `Conditions: ${p.conditions.filter((c) => c.status === 'Active').map((c) => c.name).join(', ') || 'none'}`,
  ].join('\n');

  const alertContacts = () => {
    const body = encodeURIComponent(`I’m not feeling well and may need help.\n\n${summaryText}`);
    dispatch({ type: 'log', text: 'Emergency contacts alert opened' });
    window.location.href = `sms:?&body=${body}`;
  };

  return (
    <Screen title="Get help">
        <a className="sos-big" href="tel:1669">
          <span className="ring"><Icon name="phone" size={26} stroke={2} /></span>
          <span><b>Call 1669</b><span style={{ fontSize: 14, fontWeight: 600 }}>Emergency medical services · free, 24h</span></span>
        </a>
        <div className="row">
          <Btn kind="ghost" icon="bell" onClick={alertContacts}>Alert my contacts</Btn>
          <Btn kind="ghost" icon="phone" href="tel:1330">Hotline 1330</Btn>
        </div>

        <Card>
          <div className="row"><h2 style={{ fontSize: 18 }}>Nearby</h2><span className="spacer small" style={{ color: 'var(--muted)', fontWeight: 600 }}>Opens your maps app</span></div>
          <div>
            {NEARBY.map((n) => (
              <div key={n.kind} className="lrow">
                <span className="ico"><Icon name={n.icon} /></span>
                <span className="main"><span className="t">{n.kind}</span><span className="s">Closest to you right now</span></span>
                <a className="btn btn-small btn-ghost" href={`https://www.google.com/maps/search/${encodeURIComponent(n.q + ' near me')}`} target="_blank" rel="noopener noreferrer">Go</a>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 style={{ fontSize: 18 }}>Show this to a doctor</h2>
          <p className="muted">A summary of today, ready to share with a pharmacist or doctor.</p>
          <div className="stack inset" style={{ color: 'var(--ink)' }}>
            <Line icon="thermo" tone="ink">{symptoms.join(' + ') || 'No symptoms entered'}</Line>
            <Line icon="pill" tone="ink">{sum.paraMg ? `Paracetamol ${sum.paraMg.toLocaleString()} mg in 24h` : meds.length ? `${meds.length} medicines in 24h` : 'Nothing logged in 24h'}</Line>
            {p.allergies.map((a) => <Line key={a.id} icon="alert" tone="bad">Allergic to {a.substance.toLowerCase()} ({a.status.toLowerCase()})</Line>)}
          </div>
          <div className="row"><Btn icon="share" onClick={() => shareText('Pharmie health summary', summaryText, toast)}>Share summary</Btn></div>
        </Card>
        <p className="disclaimer">Swallowed something by mistake? Poison center <a href="tel:1367">1367</a></p>
    </Screen>
  );
}
