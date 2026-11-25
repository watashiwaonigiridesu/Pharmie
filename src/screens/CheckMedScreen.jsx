import { useRef, useState } from 'react';
import { STRUCTURES } from '../structures.js';
import { checkFound, guessName, matchProduct, COMMON_STRENGTHS } from '../scan.js';
import { identify } from '../lookup.js';
import { getProduct, accessibleItems, checkDose, fmtUnits } from '../logic.js';
import { newId } from '../store.js';
import { readLabel, sampleLabel } from '../ocr.js';
import { Step, Icon, Btn, Bar, CheckRow, useToast, Footnote } from '../components/ui.jsx';

const NOTE = { bad: ['note-bad', 'x'], warn: ['note-warn', 'alert'], ok: ['note-ok', 'check'] };
const TITLE = 'Check a medicine';

function Structure({ id, height = 120, label }) {
  const s = STRUCTURES[id];
  if (!s) return <div className="structure empty" style={{ height }}>{id === 'oral rehydration salts' || id === 'simethicone' ? 'A mixture: no single structure' : 'No structure on file'}</div>;
  // Static drawings generated at build time from verified chemical data (src/structures.js).
  return <div className="structure" style={{ height }} role="img" aria-label={`Chemical structure of ${label}`} dangerouslySetInnerHTML={{ __html: s.svg }} />;
}

function Notes({ items }) {
  return items.map((c) => {
    const [cls, icon] = NOTE[c.level];
    return <div key={c.text} className={`note ${cls}`}><Icon name={icon} size={18} stroke={2.2} /><span>{c.text}</span></div>;
  });
}

export default function CheckMedScreen({ state, dispatch, go }) {
  const toast = useToast();
  const profile = state.profiles[state.who];
  const forWho = profile.id === 'alex' ? 'you' : profile.name;
  const [stage, setStage] = useState('photo'); // photo → reading → identify → (amount → cautions) | learn ; or unknown
  const [img, setImg] = useState(null);
  const [prog, setProg] = useState({ p: 0, label: 'Getting ready' });
  const [text, setText] = useState('');
  const [found, setFound] = useState([]);
  const [brand, setBrand] = useState(null);
  const [source, setSource] = useState(null);
  const [note, setNote] = useState(null);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState(null);
  const [count, setCount] = useState(1);
  const [mg, setMg] = useState(null);
  const [otherMg, setOtherMg] = useState('');
  const [alsoCabinet, setAlsoCabinet] = useState(true);
  const cam = useRef(null);
  const lib = useRef(null);

  const primary = found[0];
  const detectedMg = primary?.strength?.unit === 'mg' ? primary.strength.amount : null;

  async function run(blob) {
    if (!blob) return;
    setImg(URL.createObjectURL(blob));
    setStage('reading');
    setError(null);
    setProg({ p: 0.02, label: 'Getting ready' });
    try {
      const r = await readLabel(blob, (p, label) => setProg({ p: p * 0.85, label }));
      setText(r.text);
      setProg({ p: 0.9, label: 'Looking up the medicine' });
      const id = await identify(r);
      setFound(id.found);
      setBrand(id.brand);
      setSource(id.source);
      setNote(id.note);
      setOffline(!!id.onlineFailed);
      setMg(id.found[0]?.strength?.unit === 'mg' ? id.found[0].strength.amount : null);
      setStage(id.found.length ? 'identify' : 'unknown');
    } catch {
      setError('This device couldn’t read the photo.');
      setFound([]);
      setStage('unknown');
    }
  }
  const onFile = (e) => { run(e.target.files?.[0]); e.target.value = ''; };
  const restart = () => { setStage('photo'); setImg(null); setFound([]); setBrand(null); setText(''); setSource(null); setNote(null); setOffline(false); setError(null); setCount(1); setMg(null); setOtherMg(''); };

  /* ---------- 1 · photo ---------- */
  if (stage === 'photo') {
    return (
      <Step title={TITLE} back="cabinet" index={1} total={4} heading="Photograph the pack"
        sub="Get the medicine’s name in the frame, in good light. We’ll find the brand and what’s in it."
        next={<Btn icon="camera" onClick={() => cam.current?.click()}>Take a photo</Btn>}>
        <div className="viewfinder">
          <Icon name="camera" size={44} />
          <span className="frame" />
          <span className="cap">The name on the front of the pack</span>
        </div>
        <div className="row">
          <Btn kind="ghost" icon="image" onClick={() => lib.current?.click()}>From photos</Btn>
          <Btn kind="soft" onClick={async () => run(await sampleLabel())}>Try a sample</Btn>
        </div>
        <input ref={cam} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={onFile} />
        <input ref={lib} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={onFile} />
      </Step>
    );
  }

  /* ---------- reading ---------- */
  if (stage === 'reading') {
    return (
      <Step title={TITLE} back="cabinet" index={2} total={4} heading="Identifying the medicine…" sub="Reading the pack, then looking up the brand. The first time also downloads the reader."
        next={<Btn disabled>{Math.round(prog.p * 100)}%</Btn>}>
        <div className="viewfinder">{img && <img src={img} alt="Your photo of the label" />}</div>
        <div className="stack" aria-live="polite"><Bar pct={prog.p * 100} /><p className="muted">{prog.label}</p></div>
      </Step>
    );
  }

  /* ---------- not identified: try again, never type it in ---------- */
  if (stage === 'unknown') {
    return (
      <Step title={TITLE} back="cabinet" index={2} total={4} heading="We couldn’t identify this medicine"
        sub={error || (brand ? `We read “${brand}” but couldn’t find it in our brand list${offline ? ' and couldn’t reach the online database' : ' or online'}.` : 'We couldn’t read a medicine name in the photo.')}
        next={<><Btn kind="ghost" grow={false} icon="image" onClick={() => lib.current?.click()}>Photos</Btn><Btn icon="camera" onClick={() => cam.current?.click()}>Take another photo</Btn></>}>
        {img && <div className="viewfinder" style={{ aspectRatio: '16 / 8' }}><img src={img} alt="Your photo of the pack" /></div>}
        <div className="card" style={{ gap: 8 }}>
          <b>Tips for a better photo</b>
          <div className="line tone-ink"><Icon name="check" size={17} /><span>Fill the frame with the front of the pack, where the name is biggest.</span></div>
          <div className="line tone-ink"><Icon name="check" size={17} /><span>Good light, no glare, hold steady.</span></div>
          <div className="line tone-ink"><Icon name="check" size={17} /><span>Or photograph the side panel that says “Active ingredient”.</span></div>
        </div>
        {offline && <div className="note note-warn"><Icon name="alert" size={18} /><span>The online drug database couldn’t be reached{import.meta.env.VITE_ROUTER === 'memory' ? ' from inside this Claude preview' : '. Check your connection'}.</span></div>}
        <input ref={cam} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={onFile} />
        <input ref={lib} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={onFile} />
        {text.trim() && <details className="inset"><summary>What the photo said</summary><p style={{ whiteSpace: 'pre-wrap', margin: '8px 0 0' }}>{text.trim().slice(0, 400)}</p></details>}
      </Step>
    );
  }

  const compound = guessName(found);

  /* ---------- 2 · identify: brand + active compound, then choose ---------- */
  if (stage === 'identify') {
    return (
      <Step title={TITLE} back="cabinet" index={2} total={4} heading="Here’s what we found" sub="Check it matches your pack."
        next={<Btn kind="ghost" onClick={restart}>Scan again</Btn>}>
        <section className="card id-card">
          <div className="id-col">
            <span className="id-label">Name on the pack</span>
            <b className="id-name">{brand || 'No brand name'}</b>
            <div className="id-photo">{img ? <img src={img} alt="Your photo of the pack" /> : <Icon name="box" size={40} />}</div>
          </div>
          <div className="id-col">
            <span className="id-label">Active compound</span>
            <b className="id-name">{primary.ing.name}{detectedMg ? ` ${detectedMg} mg` : ''}</b>
            <Structure id={primary.ing.id} height={110} label={primary.ing.name} />
            {primary.ing.aka && <span className="small" style={{ color: 'var(--muted)', textAlign: 'center' }}>Also called {primary.ing.aka}</span>}
          </div>
        </section>
        <div className="row wrap" style={{ gap: 8 }}>
          <span className="tag tag-info"><Icon name={source === 'online' ? 'share' : source === 'list' ? 'list' : 'eye'} size={13} stroke={2.4} />{{ online: 'Found online · U.S. FDA drug labels', list: 'Matched in Pharmie’s brand list', label: 'Read from the pack’s label' }[source]}</span>
        </div>
        {note && <div className="note note-warn"><Icon name="alert" size={18} /><span>{note}</span></div>}
        {found.length > 1 && <div className="note note-blue"><Icon name="pill" size={18} /><span>Also contains {found.slice(1).map((f) => f.ing.name + (f.strength ? ` ${f.strength.amount} ${f.strength.unit}` : '')).join(', ')}.</span></div>}
        <p className="label">What would you like to do?</p>
        <button type="button" className="action primary" onClick={() => setStage('amount')}>
          <span className="ico"><Icon name="pill" size={26} /></span>
          <span className="grow"><b>Taking medicine</b><span>Log a dose and check it’s safe for {forWho}</span></span>
          <Icon name="chev" size={20} stroke={2.2} />
        </button>
        <button type="button" className="action" onClick={() => setStage('learn')}>
          <span className="ico"><Icon name="eye" size={24} /></span>
          <span className="grow"><b>Learning more</b><span>What it is, how it works, cautions</span></span>
          <Icon name="chev" size={20} stroke={2.2} />
        </button>
        <Footnote />
      </Step>
    );
  }

  /* ---------- 3b · learn ---------- */
  if (stage === 'learn') {
    const toCabinet = () => { dispatch({ type: 'draft', draft: { name: brand ? `${brand} (${compound})` : compound, ingredient: primary.ing.name, mg: detectedMg ? String(detectedMg) : '', productId: matchProduct(found) } }); go('add'); };
    return (
      <Step title={TITLE} back="cabinet" index={3} total={4} heading={`About ${primary.ing.name.toLowerCase()}`} sub={brand ? `In ${brand}` : null}
        next={<><Btn kind="ghost" grow={false} onClick={() => setStage('identify')} aria-label="Back to what we found"><Icon name="back" size={20} stroke={2.2} /></Btn><Btn kind="ghost" grow={false} onClick={toCabinet} icon="plus">Cabinet</Btn><Btn onClick={() => setStage('amount')}>I’m taking it</Btn></>}>
        {found.map(({ ing }) => (
          <section key={ing.id} className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h2>{ing.name}</h2>
              {STRUCTURES[ing.id] && <span className="tag tag-neutral">{STRUCTURES[ing.id].formula}</span>}
            </div>
            <Structure id={ing.id} height={150} label={ing.name} />
            <div className="grid2">
              <div className="kv"><span>What it is</span><span>{ing.kind}</span></div>
              <div className="kv"><span>Used for</span><span>{ing.usedFor}</span></div>
            </div>
            <div className="stack"><b>How it works</b><p className="body">{ing.how}</p></div>
            <div className="stack"><b>Usual maximum</b><p className="body">{ing.max}</p></div>
            {ing.cautions.length > 0 && (
              <div className="stack">
                <b>Take care</b>
                {ing.cautions.map((c) => <div key={c} className="line tone-ink"><Icon name="alert" size={17} /><span>{c}</span></div>)}
              </div>
            )}
            {ing.minAge >= 1 && <p className="muted small">Not for children under {ing.minAge}.</p>}
          </section>
        ))}
        <Footnote />
      </Step>
    );
  }

  /* ---------- 3a · how many + which dose ---------- */
  const strengths = [...new Set([detectedMg, ...(COMMON_STRENGTHS[primary.ing.id] || [])].filter(Boolean))];
  const chosenMg = mg === 'other' ? Number(otherMg) || null : mg;
  const unitWord = primary.ing.id === 'oral rehydration salts' ? 'sachet' : 'tablet';

  if (stage === 'amount') {
    return (
      <Step title={TITLE} back="cabinet" index={3} total={4} heading="How many have you taken?" sub={brand ? `${brand} · ${primary.ing.name}` : primary.ing.name}
        next={<><Btn kind="ghost" grow={false} onClick={() => setStage('identify')} aria-label="Back to what we found"><Icon name="back" size={20} stroke={2.2} /></Btn><Btn disabled={!chosenMg} onClick={() => setStage('cautions')}>{chosenMg ? 'Check this dose' : 'Pick a dose'}</Btn></>}>
        <div className="tiles3" role="radiogroup" aria-label="How many">
          {[0.5, 1, 2].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={count === n} className={`bigtile ${count === n ? 'on' : ''}`} onClick={() => setCount(n)}>
              <b>{fmtUnits(n)}</b><span>{unitWord}{n > 1 ? 's' : ''}</span>
            </button>
          ))}
        </div>
        <h2 style={{ marginTop: 8 }}>Dose in each {unitWord}</h2>
        <div className="tiles3" role="radiogroup" aria-label="Dose">
          {strengths.map((v) => (
            <button key={v} type="button" role="radio" aria-checked={mg === v} className={`bigtile ${mg === v ? 'on' : ''}`} onClick={() => setMg(v)}>
              <b>{v.toLocaleString()}</b><span>mg{v === detectedMg ? ' · on label' : ''}</span>
            </button>
          ))}
          <button type="button" role="radio" aria-checked={mg === 'other'} className={`bigtile ${mg === 'other' ? 'on' : ''}`} onClick={() => setMg('other')}>
            <b>Other</b><span>type it</span>
          </button>
        </div>
        {mg === 'other' && (
          <div className="field">
            <label htmlFor="other-mg">Dose in mg</label>
            <input id="other-mg" type="number" inputMode="decimal" min="0" value={otherMg} onChange={(e) => setOtherMg(e.target.value)} />
          </div>
        )}
        {chosenMg && <div className="total">Total: <b>{(count * chosenMg).toLocaleString()} mg</b> {primary.ing.name.toLowerCase()}</div>}
      </Step>
    );
  }

  /* ---------- 4 · cautions + add this dose ---------- */
  const matched = matchProduct(found);
  const usesCatalog = !!matched && getProduct(state, matched).ingredients[0].mg === chosenMg;
  const inCabinet = usesCatalog ? accessibleItems(state, profile.id).find((i) => i.productId === matched && i.qty > 0) : null;
  const tmpId = '__scan';
  const product = {
    name: brand ? `${brand} ${primary.ing.name} ${chosenMg} mg` : `${primary.ing.name} ${chosenMg} mg`,
    category: 'Scanned', form: 'Tablet', unit: unitWord, purpose: primary.ing.usedFor, minAge: primary.ing.minAge,
    ingredients: found.map((f, i) => ({ name: f.ing.id, mg: i === 0 ? chosenMg : f.strength?.unit === 'mg' ? f.strength.amount : null })),
    label: ['Follow the label on your pack'], cautions: primary.ing.cautions, custom: true,
  };
  const pid = usesCatalog ? matched : tmpId;
  const tmpState = usesCatalog ? state : { ...state, customProducts: { ...state.customProducts, [tmpId]: product } };
  const verdict = checkDose(tmpState, profile, pid, count);
  const notes = [
    ...verdict.blocks.map((t) => ({ level: 'bad', text: t })),
    ...verdict.warnings.map((t) => ({ level: 'warn', text: t })),
    ...checkFound(state, profile, found).filter((c) => c.level !== 'ok' || (!verdict.blocks.length && !verdict.warnings.length)),
  ].filter((c, i, a) => a.findIndex((x) => x.text === c.text) === i);

  const addDose = () => {
    let productId = pid;
    if (!usesCatalog) {
      productId = newId('c');
      dispatch({ type: 'product', id: productId, product });
    }
    dispatch({ type: 'logDose', profileId: profile.id, productId, units: count, itemId: inCabinet ? inCabinet.id : null });
    toast(`Logged ${fmtUnits(count)} × ${primary.ing.name} ${chosenMg} mg for ${forWho}`);
    if (alsoCabinet && !inCabinet) {
      dispatch({ type: 'draft', draft: { name: product.name, ingredient: primary.ing.name, mg: String(chosenMg), productId: usesCatalog ? matched : productId } });
      go('add');
    } else go('me');
  };

  return (
    <Step title={TITLE} back="cabinet" index={4} total={4} heading={brand || compound}
      sub={`${fmtUnits(count)} × ${chosenMg} mg = ${(count * chosenMg).toLocaleString()} mg ${primary.ing.name.toLowerCase()} · for ${forWho}`}
      next={<><Btn kind="ghost" grow={false} onClick={() => setStage('amount')} aria-label="Change the dose"><Icon name="back" size={20} stroke={2.2} /></Btn><Btn icon="check" onClick={addDose} disabled={!verdict.ok}>{verdict.ok ? 'Add this dose' : 'Not safe right now'}</Btn></>}>
      <section className="card what-card">
        <div className="stack" style={{ gap: 4 }}>
          <span className="id-label">What’s in it</span>
          {found.map((f) => <b key={f.ing.id} style={{ fontSize: 15.5 }}>{f.ing.name}{f === primary ? ` ${chosenMg} mg` : f.strength ? ` ${f.strength.amount} ${f.strength.unit}` : ''}</b>)}
          <span className="small" style={{ color: 'var(--muted)' }}>{primary.ing.kind}</span>
        </div>
        <Structure id={primary.ing.id} height={96} label={primary.ing.name} />
      </section>
      <h2 style={{ marginTop: 4 }}>Cautions and instructions</h2>
      <Notes items={notes} />
      <div className="card" style={{ gap: 6 }}>
        <b>Instructions</b>
        <div className="line tone-ink"><Icon name="clock" size={17} /><span>Usual maximum: {primary.ing.max}.</span></div>
        {primary.ing.cautions.map((c) => <div key={c} className="line tone-ink"><Icon name="alert" size={17} /><span>{c}</span></div>)}
      </div>
      {!inCabinet && <CheckRow checked={alsoCabinet} onChange={() => setAlsoCabinet(!alsoCabinet)}>Also add this pack to the cabinet</CheckRow>}
      <p className="muted small">Photo reading can make mistakes: check the pack.</p>
      <Footnote />
    </Step>
  );
}
