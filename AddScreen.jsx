import { useState } from 'react';
import { CABINETS } from '../data.js';
import { newId } from '../store.js';
import { Screen, Btn, Icon, useToast } from '../components/ui.jsx';

function Field({ id, label, ...rest }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} {...rest} />
    </div>
  );
}

export default function AddScreen({ state, dispatch, go }) {
  const toast = useToast();
  const d = state.draft || {};
  const own = CABINETS.some((c) => c.id === state.who) ? state.who : 'family';
  const [f, setF] = useState({ name: d.name || '', ingredient: d.ingredient || '', mg: d.mg || '', form: 'Tablet', expires: '', qty: '', cabinet: own });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const valid = f.name.trim() && Number(f.qty) > 0;

  const save = () => {
    let productId = d.productId;
    let product = null;
    if (!productId) {
      productId = newId('c');
      const unit = ['Tablet', 'Capsule'].includes(f.form) ? f.form.toLowerCase() : 'dose';
      product = {
        name: f.name.trim(), category: 'Added by you', form: f.form, unit,
        ingredients: f.ingredient ? [{ name: f.ingredient.trim().toLowerCase(), mg: f.mg ? Number(f.mg) : null }] : [],
        purpose: 'Added from your pack', minAge: 0, label: ['Follow the label on your pack'], cautions: [], custom: true,
      };
    }
    dispatch({ type: 'addItem', productId, product, cabinet: f.cabinet, qty: Number(f.qty), expires: f.expires || null });
    dispatch({ type: 'draft', draft: null });
    toast(`${f.name.trim()} added`);
    go('cabinet');
  };

  return (
    <Screen title="Add a medicine" back="cabinet" cta={<Btn icon="check" onClick={save} disabled={!valid}>{valid ? 'Save to cabinet' : 'Add a name and how many'}</Btn>}>
      {d.name ? (
        <div className="note note-ok"><Icon name="check" size={18} stroke={2.4} /><span>Filled in from your photo. Check each line against the pack.</span></div>
      ) : (
        <a className="action" href="#/checkmed">
          <span className="ico"><Icon name="camera" size={24} /></span>
          <span className="grow"><b>Scan the label instead</b><span>We’ll fill in the ingredients for you</span></span>
          <Icon name="chev" size={20} stroke={2.2} />
        </a>
      )}
      <Field id="a-name" label="Name on the pack" value={f.name} onChange={set('name')} placeholder="e.g. Paracetamol 500 mg" />
      <div className="grid2">
        <Field id="a-ing" label="Active ingredient" value={f.ingredient} onChange={set('ingredient')} placeholder="e.g. Paracetamol" />
        <Field id="a-mg" label="Strength (mg)" type="number" inputMode="decimal" min="0" value={f.mg} onChange={set('mg')} />
      </div>
      <div className="grid2">
        <Field id="a-qty" label="How many left" type="number" inputMode="numeric" min="1" value={f.qty} onChange={set('qty')} />
        <Field id="a-exp" label="Expires" type="month" value={f.expires} onChange={set('expires')} />
      </div>
      <div className="grid2">
        <div className="field">
          <label htmlFor="a-form">Form</label>
          <select id="a-form" value={f.form} onChange={set('form')}>
            {['Tablet', 'Capsule', 'Syrup', 'Sachet', 'Spray', 'Cream', 'Other'].map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="a-cab">Cabinet</label>
          <select id="a-cab" value={f.cabinet} onChange={set('cabinet')}>
            {CABINETS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
      </div>
    </Screen>
  );
}
