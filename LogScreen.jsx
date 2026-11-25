import { useState } from 'react';
import { getProduct, accessibleItems, expiryStatus, checkDose } from '../logic.js';
import { Step, Icon, Btn, Choice, useToast } from '../components/ui.jsx';

export default function LogScreen({ state, dispatch, go, param }) {
  const toast = useToast();
  const profile = state.profiles[state.who];
  const items = accessibleItems(state, profile.id).filter((i) => {
    const p = getProduct(state, i.productId);
    return p && !p.device && !p.supplement && i.qty > 0 && expiryStatus(i) !== 'expired';
  });
  const [pick, setPick] = useState(items[0]?.productId || null);
  const [units, setUnits] = useState(1);

  if (!param) {
    return (
      <Step title="Log a dose" back="me" index={1} total={2} heading="What did you take?" sub="From your cabinet."
        next={<Btn href={pick ? `#/log/${pick}` : undefined} disabled={!pick}>Next</Btn>}>
        {items.length ? (
          <Choice label="Medicine" value={pick} onPick={setPick}
            options={items.map((i) => ({ id: i.productId, label: getProduct(state, i.productId).name, hint: `${i.qty} ${getProduct(state, i.productId).unit}s left` }))} />
        ) : (
          <p className="muted">No medicines to log. <a href="#/add">Add one</a>.</p>
        )}
      </Step>
    );
  }

  const item = items.find((i) => i.productId === param);
  const p = getProduct(state, param);
  if (!item || !p) {
    return (
      <Step title="Log a dose" back="me" index={2} total={2} heading="Not in the cabinet" prev="#/log" next={<Btn href="#/add">Add it first</Btn>}>
        <p className="muted">This medicine isn’t in {state.who === 'alex' ? 'your' : profile.name + '’s'} cabinet, is used up or has expired.</p>
      </Step>
    );
  }
  const verdict = checkDose(state, profile, param, units);
  const save = () => {
    dispatch({ type: 'logDose', profileId: profile.id, productId: param, units, itemId: item.id });
    toast(`Logged ${units} ${p.unit}${units > 1 ? 's' : ''} of ${p.name}`);
    go('me');
  };
  return (
    <Step title="Log a dose" back="me" index={2} total={2} prev="#/log" heading={`How many ${p.unit}s?`} sub={p.name}
      next={<Btn icon="check" onClick={save} disabled={!verdict.ok}>{verdict.ok ? 'Log dose' : 'Not safe right now'}</Btn>}>
      <div className="stepper">
        <button type="button" aria-label="One less" onClick={() => setUnits(Math.max(1, units - 1))}><Icon name="minus" size={24} stroke={2.2} /></button>
        <output aria-live="polite">{units}</output>
        <button type="button" aria-label="One more" onClick={() => setUnits(Math.min(item.qty, units + 1))}><Icon name="plus" size={24} stroke={2.2} /></button>
      </div>
      <p className="muted" style={{ textAlign: 'center' }}>{item.qty - units} left after this</p>
      {verdict.blocks.map((b) => <div key={b} className="note note-bad"><Icon name="x" size={18} stroke={2.4} /><span>{b}</span></div>)}
      {verdict.warnings.map((w) => <div key={w} className="note note-warn"><Icon name="alert" size={18} stroke={2} /><span>{w}</span></div>)}
      {verdict.ok && !verdict.warnings.length && <div className="note note-ok"><Icon name="check" size={18} stroke={2.4} /><span>Safe to log for {profile.id === 'alex' ? 'you' : profile.name} right now.</span></div>}
    </Step>
  );
}
