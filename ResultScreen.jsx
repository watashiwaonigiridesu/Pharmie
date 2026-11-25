import { LEVELS, SYMPTOMS } from '../data.js';
import { triage, carePlan, likelyCause, seekHelpIf, levelIndex, getProduct } from '../logic.js';
import { Step, Screen, Icon, Tag, Btn, Line, useToast, Footnote } from '../components/ui.jsx';
import { brandsWith, regionName } from '../brands.js';
import { checkSteps } from './CheckScreen.jsx';

const LOOK = {
  selfcare: { bg: 'var(--ok-bg)', fg: 'var(--ok-ink)', icon: 'check' },
  pharmacist: { bg: 'var(--sky)', fg: 'var(--blue-ink)', icon: 'pill' },
  doctor: { bg: 'var(--warn-bg)', fg: 'var(--warn-ink)', icon: 'bell' },
  emergency: { bg: 'var(--red-bg)', fg: 'var(--red-ink)', icon: 'alert' },
};
const SCALE = ['var(--ok-ink)', 'var(--blue)', 'var(--warn)', 'var(--red-ink)'];

const TAGS = {
  rec: { kind: 'ok', icon: 'check', text: 'Recommended' },
  caution: { kind: 'warn', icon: 'alert', text: 'Use caution' },
  opt: { kind: 'neutral', icon: null, text: 'Optional' },
  no: { kind: 'bad', icon: 'x', text: 'Avoid' },
};

function PlanTile({ item, dispatch, toast, state }) {
  const t = TAGS[item.kind];
  const canLog = item.kind === 'rec' && item.itemId && item.productId;
  const showDetails = item.productId && item.kind !== 'opt';
  const region = state.region || 'TH';
  const ings = item.productId ? (getProduct(state, item.productId)?.ingredients || []) : [];
  const local = item.kind !== 'no' && ings.length === 1 ? brandsWith(ings[0].name.toLowerCase(), region).map((b) => b.name) : [];
  return (
    <article className={`tile tile-${item.kind}`} aria-label={`${t.text}: ${item.title}`}>
      <Tag kind={t.kind} icon={t.icon}>{item.tagText || t.text}</Tag>
      <h3 className="tile-title">{item.title}</h3>
      <p className="tile-why">{item.short || item.why}</p>
      {item.note && <p className="tile-meta tone-warn"><Icon name="alert" size={14} />{item.note}</p>}
      {local.length > 0 && <p className="tile-meta"><Icon name="pin" size={14} />In {regionName(region)}: {local.slice(0, 3).join(', ')}</p>}
      {(canLog || showDetails || item.shop) && (
        <div className="tile-actions">
          {canLog && <a className="btn btn-primary btn-tile" href={`#/log/${item.productId}`}>Log</a>}
          {showDetails && !canLog && <a className="btn btn-ghost btn-tile" href={`#/product/${item.productId}`} aria-label={`Details for ${item.title}`}>Details</a>}
          {item.shop && !canLog && (
            <a className="btn btn-soft btn-tile" href="#/explore/pharmacy" aria-label={`Find a pharmacy for ${item.title}`}>
              <Icon name="pin" size={15} stroke={2.2} />Find
            </a>
          )}
        </div>
      )}
    </article>
  );
}

export default function ResultScreen({ state, dispatch, go, param }) {
  const toast = useToast();
  const { check } = state;
  const profile = state.profiles[state.who];
  const t = triage(check, profile);

  if (!t) {
    return (
      <Screen title="Your result" cta={<Btn href="#/check">Start a check</Btn>}>
        <h2 className="step-heading">Nothing to check yet</h2>
        <p className="muted">Pick your symptoms first.</p>
      </Screen>
    );
  }

  const idx = levelIndex(t.level);
  const lvl = LEVELS[idx];
  const look = LOOK[t.level];
  const emergency = t.level === 'emergency';
  const total = emergency ? 1 : 3;
  const lastCheckStep = `#/check/${checkSteps(check).length}`;

  if (param === 'plan' && !emergency) {
    const plan = carePlan(state, check, profile);
    const rec = plan.filter((p) => p.kind === 'rec').length;
    const watch = plan.filter((p) => p.kind === 'caution' || p.kind === 'no').length;
    return (
      <Step title="Your result" index={2} total={3} prev="#/result" heading={`Common OTC in ${regionName(state.region || 'TH')}`}
        sub={`For your symptoms: ${rec} recommended · ${watch} to watch out for`}
        next={<Btn href="#/result/when">When to see a doctor</Btn>}>
        <div className="plan-grid">
          {plan.map((item) => <PlanTile key={item.key} item={item} dispatch={dispatch} toast={toast} state={state} />)}
        </div>
        <a className="action" href="#/explore">
          <span className="ico"><Icon name="list" size={22} /></span>
          <span className="grow"><b>Explore all OTC</b><span>Browse common medicines in {regionName(state.region || 'TH')} by type</span></span>
          <Icon name="chev" size={20} stroke={2.2} />
        </a>
        <Footnote />
      </Step>
    );
  }

  if (param === 'when' && !emergency) {
    return (
      <Step title="Your result" index={3} total={3} prev="#/result/plan" heading="See a doctor if…"
        next={<>
          <Btn kind="ghost" grow={false} href="#/help" icon="pin">Nearby</Btn>
          <Btn onClick={() => { dispatch({ type: 'checkReset' }); go('me'); }}>Done</Btn>
        </>}>
        <div className="card">
          {seekHelpIf(check, profile).map((s) => <Line key={s} icon="alert" tone="ink">{s}</Line>)}
        </div>
        <div className="note note-blue"><Icon name="phone" size={20} /><span>Not sure? A pharmacist can help for free. Health hotline <a href="tel:1330">1330</a>.</span></div>
        <Footnote />
      </Step>
    );
  }

  const names = check.order.map((id) => SYMPTOMS.find((s) => s.id === id).label.toLowerCase()).join(' + ');
  return (
    <Step title="Your result" index={1} total={total} prev={lastCheckStep} heading=""
      next={emergency
        ? <><Btn kind="ghost" grow={false} href="#/help">More help</Btn><Btn kind="sos" icon="phone" href="tel:1669">Call 1669</Btn></>
        : <Btn href="#/result/plan">See common OTC in {regionName(state.region || 'TH')}</Btn>}>
      <div className="level">
        <span className="level-badge" style={{ background: look.bg, color: look.fg }}><Icon name={look.icon} size={40} stroke={2.2} /></span>
        <h2>{lvl.title}</h2>
        <p className="muted">{names} · {state.who === 'alex' ? 'you' : profile.name}, {profile.age}</p>
      </div>
      <div className="scale" role="img" aria-label={`Care level ${idx + 1} of 4: ${lvl.label}`}>
        {LEVELS.map((l, i) => (
          <div key={l.id} className={i === idx ? 'on' : ''}>
            <span className="seg-bar" style={{ background: i === idx ? SCALE[i] : 'var(--line)' }} />
            {l.label}
          </div>
        ))}
      </div>
      <div className="card">
        <p className="body">{emergency ? 'You ticked a warning sign. This needs medical help now, not medicine from the cabinet.' : `${likelyCause(check)} That’s a likely match, not a diagnosis.`}</p>
        <div className="stack">
          {t.reasons.map((r) => <Line key={r} icon={emergency ? 'alert' : 'check'} tone={emergency ? 'bad' : 'ink'}>{r}</Line>)}
        </div>
      </div>
      <Footnote />
    </Step>
  );
}
