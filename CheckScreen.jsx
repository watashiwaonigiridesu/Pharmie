import { SYMPTOMS, DURATIONS, TEMPS, WARNING_SIGNS } from '../data.js';
import { Step, Icon, Btn, Segmented, Choice, CheckRow, HubTabs, Footnote } from '../components/ui.jsx';

export function checkSteps(check) {
  return ['symptoms', 'strength', 'duration', ...(check.sel.fever ? ['temp'] : []), 'onset', 'warnings'];
}

export default function CheckScreen({ state, dispatch, param }) {
  const { check } = state;
  const profile = state.profiles[state.who];
  const set = (patch) => dispatch({ type: 'check', patch });
  const steps = checkSteps(check);
  let i = Math.max(1, Math.min(steps.length, Number(param) || 1));
  if (!check.order.length) i = 1;
  const step = steps[i - 1];
  const total = steps.length;
  const prev = i > 1 ? `#/check/${i - 1}` : null;
  const nextHref = i < total ? `#/check/${i + 1}` : '#/result';
  const who = state.who === 'alex' ? 'you' : profile.name;

  const toggle = (s) => {
    const sel = { ...check.sel };
    let order = [...check.order];
    if (sel[s.id]) { delete sel[s.id]; order = order.filter((x) => x !== s.id); }
    else { sel[s.id] = s.levels[0]; order.push(s.id); }
    set({ sel, order });
  };

  const ready = {
    symptoms: check.order.length > 0,
    strength: true,
    duration: !!check.dur,
    temp: !!check.temp,
    onset: check.sudden !== null,
    warnings: check.warnings.length > 0 || check.none,
  }[step];

  const nextLabel = step === 'warnings' ? (check.warnings.length ? 'See what to do now' : 'See what I have') : 'Next';
  const next = (
    <Btn kind={step === 'warnings' && check.warnings.length ? 'sos' : 'primary'} href={nextHref} disabled={!ready}>
      {ready ? nextLabel : step === 'symptoms' ? 'Pick at least one' : 'Choose an answer'}
    </Btn>
  );
  const common = { title: 'Check symptoms', index: i, total, prev, next };

  if (step === 'symptoms') {
    return (
      <Step {...common} above={<HubTabs value="check" />} heading={state.who === 'alex' ? 'What’s bothering you?' : `What’s bothering ${profile.name}?`} sub="Tap everything you notice.">
        <div className="grid3">
          {SYMPTOMS.map((s) => {
            const on = !!check.sel[s.id];
            return (
              <button key={s.id} type="button" className={`chip ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => toggle(s)}>
                {on && <Icon name="check" size={15} stroke={2.6} />}<span>{s.label}</span>
              </button>
            );
          })}
        </div>
        <a className="strip" href="#/help">
          <Icon name="alert" size={22} stroke={2} />
          <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className="t">Chest pain, trouble breathing, confusion?</span>
            <span className="s">Skip this. Get help now</span>
          </span>
          <Icon name="chev" size={20} stroke={2} />
        </a>
      </Step>
    );
  }

  if (step === 'strength') {
    return (
      <Step {...common} heading="How strong is it?" sub="Pick the closest answer for each.">
        {check.order.map((id) => {
          const s = SYMPTOMS.find((x) => x.id === id);
          return (
            <div key={id} className="stack">
              <span style={{ fontSize: 15, fontWeight: 700 }}>{s.label}</span>
              <Segmented label={`${s.label} strength`} options={s.levels} value={check.sel[id]} onChange={(v) => set({ sel: { ...check.sel, [id]: v } })} />
            </div>
          );
        })}
      </Step>
    );
  }

  if (step === 'duration') {
    return (
      <Step {...common} heading="Since when?">
        <Choice label="How long" value={check.dur} onPick={(v) => set({ dur: v })}
          options={DURATIONS.map((d) => ({ ...d, hint: { today: 'Started in the last 24 hours', '1-2': 'Started yesterday or the day before', '3+': 'Three days or longer' }[d.id] }))} />
      </Step>
    );
  }

  if (step === 'temp') {
    return (
      <Step {...common} heading="How high is the temperature?" sub="Use a thermometer if you have one.">
        <Choice label="Temperature" value={check.temp} onPick={(v) => set({ temp: v })} options={TEMPS} />
      </Step>
    );
  }

  if (step === 'onset') {
    return (
      <Step {...common} heading="Did it start suddenly?">
        <Choice label="Onset" value={check.sudden} onPick={(v) => set({ sudden: v })}
          options={[{ id: true, label: 'Yes, within a few hours' }, { id: false, label: 'No, it came on gradually' }]} />
      </Step>
    );
  }

  const warned = check.warnings.length > 0;
  return (
    <Step {...common} heading="Any of these warning signs?" sub={`If ${who === 'you' ? 'you have' : who + ' has'} any of these, we’ll show where to get help right away.`}>
      <div className="stack">
        {WARNING_SIGNS.map((w) => (
          <CheckRow key={w.id} checked={check.warnings.includes(w.id)}
            onChange={() => set({ warnings: check.warnings.includes(w.id) ? check.warnings.filter((x) => x !== w.id) : [...check.warnings, w.id], none: false })}>
            {w.label}
          </CheckRow>
        ))}
        <CheckRow checked={check.none} onChange={() => set({ none: !check.none, warnings: [] })}>None of these</CheckRow>
      </div>
      {warned && (
        <div className="note note-bad"><Icon name="alert" size={20} stroke={2} /><span><b>Don’t wait.</b> This needs medical help now, not medicine from the cabinet.</span></div>
      )}
    </Step>
  );
}
