import { useState } from 'react';
import { getProduct, accessibleItems, expiryStatus, isLow, formatExpiry, fmtUnits } from '../logic.js';
import { Screen, Icon, Tag } from '../components/ui.jsx';

function Medicines({ state, profile }) {
  const [q, setQ] = useState('');
  const all = accessibleItems(state, profile.id).filter((i) => getProduct(state, i.productId));
  const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const items = all.filter((i) => {
    if (!terms.length) return true;
    const p = getProduct(state, i.productId);
    const hay = [p.name, p.category, p.purpose, ...p.ingredients.map((x) => x.name)].join(' ').toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
  const attention = all.filter((i) => expiryStatus(i) === 'expired' || isLow(i));
  return (
    <>
      <div className="quick2">
        <a className="quick primary" href="#/checkmed">
          <span className="ico"><Icon name="camera" size={22} /></span>
          <b>Check a medicine</b>
          <span>Photo of the label</span>
        </a>
        <a className="quick" href="#/add">
          <span className="ico"><Icon name="plus" size={22} /></span>
          <b>Add a medicine</b>
          <span>Scan or type it in</span>
        </a>
      </div>
      <section className="card find">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2>Find medicine</h2>
          <span className="muted small">{q ? `${items.length} of ${all.length}` : `${all.length} in the cabinet`}</span>
        </div>
        <div className="search" role="search">
          <Icon name="search" size={20} />
          <label htmlFor="cab-search" className="sr-only">Find medicine</label>
          <input id="cab-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or ingredient" autoComplete="off" />
          {q && <button type="button" aria-label="Clear search" onClick={() => setQ('')}><Icon name="x" size={18} /></button>}
        </div>
        {!q && attention.length > 0 && <p className="attn"><Icon name="alert" size={16} />{attention.length} need{attention.length > 1 ? '' : 's'} attention: {attention.map((i) => getProduct(state, i.productId).name).join(', ')}</p>}
        <div className="scrollbox" tabIndex={0} aria-label="Medicines in the cabinet">
          {q && !items.length && <p className="muted small" style={{ padding: '12px 4px' }}>Nothing matches “{q.trim()}”. Try an ingredient, or <a href="#/checkmed">scan a pack</a>.</p>}
          {items.map((i) => {
            const p = getProduct(state, i.productId);
            const st = expiryStatus(i);
            return (
              <a key={i.id} className="crow" href={`#/product/${i.productId}`}>
                <span className="ico"><Icon name={p.device ? 'thermo' : 'pill'} size={18} /></span>
                <span className="main">
                  <span className="t">{p.name}</span>
                  <span className="s">{p.ingredients.length && !p.device ? p.ingredients.map((x) => x.name.charAt(0).toUpperCase() + x.name.slice(1)).join(' + ') + ' · ' : ''}{p.device ? 'Device' : `${fmtUnits(i.qty)} left`} · {i.expires ? (st === 'expired' ? 'expired ' : 'exp ') + formatExpiry(i.expires) : 'no expiry'}</span>
                </span>
                {st === 'expired' ? <Tag kind="bad">Expired</Tag> : isLow(i) ? <Tag kind="warn">Low</Tag> : st === 'soon' ? <Tag kind="warn">Soon</Tag> : <Icon name="chev" size={16} />}
              </a>
            );
          })}
        </div>
      </section>
    </>
  );
}

export default function CabinetScreen({ state }) {
  const profile = state.profiles[state.who];
  return (
    <Screen title="Cabinet">
      <Medicines state={state} profile={profile} />
    </Screen>
  );
}
