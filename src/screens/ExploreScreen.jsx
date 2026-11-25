import { useState, useEffect, useRef } from 'react';
import { REGIONS, CATEGORIES, brandsIn, regionName } from '../brands.js';
import { INGREDIENTS } from '../data.js';
import { STRUCTURES } from '../structures.js';
import { Screen, HubTabs, Icon, Footnote } from '../components/ui.jsx';

const ingOf = (id) => INGREDIENTS.find((i) => i.id === id);

function RegionPicker({ state, dispatch }) {
  const region = state.region || 'TH';
  return (
    <div className="region">
      <Icon name="pin" size={20} />
      <label htmlFor="region">Region</label>
      <select id="region" value={region} onChange={(e) => dispatch({ type: 'region', id: e.target.value })}>
        {REGIONS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
      </select>
    </div>
  );
}

// Where the map starts before the person shares their location.
const CITY = { TH: { name: 'Bangkok', lat: 13.7563, lng: 100.5018 }, US: { name: 'New York', lat: 40.7128, lng: -74.006 }, UK: { name: 'London', lat: 51.5072, lng: -0.1276 } };
// The Claude preview can't show other sites in a frame or read location, so it gets a link instead.
const PREVIEW = import.meta.env.VITE_ROUTER === 'memory';

function PharmacyMap({ region, focus }) {
  const city = CITY[region] || CITY.TH;
  const [here, setHere] = useState(null);
  const [status, setStatus] = useState('');
  const ref = useRef(null);
  useEffect(() => { setHere(null); setStatus(''); }, [region]);
  useEffect(() => { if (focus) ref.current?.scrollIntoView({ block: 'start' }); }, [focus]);
  const at = here || city;
  const embed = `https://maps.google.com/maps?q=pharmacy&ll=${at.lat},${at.lng}&z=15&output=embed`;
  const open = `https://www.google.com/maps/search/pharmacy/@${at.lat},${at.lng},15z`;
  const locate = () => {
    if (!navigator.geolocation) { setStatus('Location isn’t available on this device.'); return; }
    setStatus('Finding you…');
    navigator.geolocation.getCurrentPosition(
      (p) => { setHere({ name: 'you', lat: +p.coords.latitude.toFixed(5), lng: +p.coords.longitude.toFixed(5) }); setStatus(''); },
      () => setStatus('Couldn’t get your location. Showing ' + city.name + '.'),
      { timeout: 8000, maximumAge: 300000 },
    );
  };
  return (
    <section className="card map-card" ref={ref} id="pharmacies">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>Pharmacies nearby</h2>
        <span className="muted small">{here ? 'Near you' : `Around ${city.name}`}</span>
      </div>
      <div className="map-frame">
        {PREVIEW ? (
          <div className="map-fallback">
            <Icon name="pin" size={30} />
            <b>Map opens in Google Maps</b>
            <span>The live app shows the map right here. This preview can’t load maps inside the page.</span>
          </div>
        ) : (
          <iframe title={`Map of pharmacies ${here ? 'near you' : 'in ' + city.name}`} src={embed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        )}
      </div>
      {status && <p className="muted small" role="status">{status}</p>}
      <div className="map-actions">
        {!PREVIEW && <button type="button" className="btn btn-small btn-soft" onClick={locate}><Icon name="pin" size={16} />Use my location</button>}
        <a className="btn btn-small btn-ghost" href={open} target="_blank" rel="noopener noreferrer" style={PREVIEW ? { gridColumn: '1 / -1' } : undefined}>Open Google Maps</a>
      </div>
      <p className="muted small">A pharmacist can advise on OTC medicines for free. For prescription medicines, see a doctor.</p>
    </section>
  );
}

function BrandCard({ b }) {
  const [open, setOpen] = useState(false);
  const ings = b.ingredients.map(ingOf).filter(Boolean);
  const main = ings[0];
  return (
    <section className="card">
      <div className="brand-card">
        <div className="stack" style={{ gap: 4 }}>
          <h2 style={{ fontSize: 20 }}>{b.name}</h2>
          <b style={{ fontSize: 15 }}>{ings.map((i) => i.name).join(' + ')}</b>
          <span className="small" style={{ color: 'var(--muted)' }}>{ings.length > 1 ? 'Combination medicine' : main.kind}</span>
        </div>
        {ings.length === 1 && STRUCTURES[main.id]
          ? <div className="structure" role="img" aria-label={`Chemical structure of ${main.name}`} dangerouslySetInnerHTML={{ __html: STRUCTURES[main.id].svg }} />
          : <span className="tag tag-neutral" style={{ justifySelf: 'center' }}>{ings.length} ingredients</span>}
      </div>
      {b.note && <div className="note note-warn"><Icon name="alert" size={18} /><span>{b.note}</span></div>}
      <button type="button" className="btn btn-small btn-soft" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? 'Show less' : 'How it works and cautions'}
      </button>
      {open && ings.map((i) => (
        <div key={i.id} className="stack" style={{ gap: 6 }}>
          <b>{i.name}</b>
          <p className="body">{i.how} Used for {i.usedFor.toLowerCase()}.</p>
          <div className="line tone-ink"><Icon name="clock" size={17} /><span>Usual maximum: {i.max}.</span></div>
          {i.cautions.map((c) => <div key={c} className="line tone-ink"><Icon name="alert" size={17} /><span>{c}</span></div>)}
          {i.minAge >= 1 && <p className="muted small">Not for children under {i.minAge}.</p>}
        </div>
      ))}
    </section>
  );
}

export default function ExploreScreen({ state, dispatch, param }) {
  const region = state.region || 'TH';
  const cat = CATEGORIES.find((c) => c.id === param);

  if (cat) {
    const brands = brandsIn(cat.id, region);
    return (
      <Screen title={cat.label} back="explore">
        <RegionPicker state={state} dispatch={dispatch} />
        <p className="muted">Common {cat.label.toLowerCase()} medicines you can buy without a prescription in {regionName(region)}. Examples only: what’s on the shelf varies.</p>
        {brands.length ? brands.map((b) => <BrandCard key={b.name} b={b} />) : <p className="muted">No examples for this region yet.</p>}
        <Footnote />
      </Screen>
    );
  }

  return (
    <Screen title="Explore OTC">
      <HubTabs value="explore" />
      <RegionPicker state={state} dispatch={dispatch} />
      <PharmacyMap region={region} focus={param === 'pharmacy'} />
      <h2 className="step-heading" style={{ fontSize: 24 }}>Common OTC medicines</h2>
      <p className="muted" style={{ marginTop: -8 }}>What people in {regionName(region)} usually find at the pharmacy, by what it’s for.</p>
      <div className="cat-grid">
        {CATEGORIES.map((c) => (
          <a key={c.id} className="cat" href={`#/explore/${c.id}`}>
            <span className="ico"><Icon name={c.icon} size={24} /></span>
            <b>{c.label}</b>
            <span className="n">{brandsIn(c.id, region).length} example{brandsIn(c.id, region).length === 1 ? '' : 's'}</span>
          </a>
        ))}
      </div>
      <a className="action" href="#/checkmed">
        <span className="ico"><Icon name="camera" size={24} /></span>
        <span className="grow"><b>Have a pack in hand?</b><span>Photograph it to see what’s in it</span></span>
        <Icon name="chev" size={20} stroke={2.2} />
      </a>
      <Footnote />
    </Screen>
  );
}
