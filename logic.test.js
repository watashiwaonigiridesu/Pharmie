import { describe, it, expect } from 'vitest';
import { initialState } from './data.js';
import { triage, carePlan, checkDose, doseSummary, expiryStatus, painkillerDays, todaysPlan } from './logic.js';
import { reducerForTest } from './store.js';

const NOW = new Date('2026-11-22T14:00:00+07:00');

function check(sel, extra = {}) {
  return { sel, order: Object.keys(sel), dur: '1-2', temp: '38to39', sudden: false, extras: [], warnings: [], none: true, ...extra };
}

describe('triage', () => {
  const s = initialState(NOW);
  const alex = s.profiles.alex;

  it('returns null with nothing picked', () => {
    expect(triage(check({}), alex)).toBeNull();
  });
  it('moderate fever + mild headache, 2 days, no warnings → self-care', () => {
    expect(triage(check({ fever: 'Moderate', headache: 'Mild' }), alex).level).toBe('selfcare');
  });
  it('any warning sign → emergency', () => {
    expect(triage(check({ fever: 'Mild' }, { warnings: ['breathing'] }), alex).level).toBe('emergency');
  });
  it('sudden severe headache → emergency', () => {
    expect(triage(check({ headache: 'Severe' }, { sudden: true }), alex).level).toBe('emergency');
  });
  it('fever over 39 → doctor', () => {
    expect(triage(check({ fever: 'Moderate' }, { temp: 'over39' }), alex).level).toBe('doctor');
  });
  it('fever 3+ days → doctor', () => {
    expect(triage(check({ fever: 'Mild' }, { dur: '3+' }), alex).level).toBe('doctor');
  });
  it('fever at 67 with conditions → at least pharmacist', () => {
    expect(['pharmacist', 'doctor']).toContain(triage(check({ fever: 'Mild' }), s.profiles.mom).level);
  });
});

describe('dose guard', () => {
  it('sums paracetamol across products and flags the duplicate', () => {
    const s = initialState(NOW);
    const sum = doseSummary(s, 'alex', NOW);
    expect(sum.paraMg).toBe(500 + 650);
    expect(sum.duplicate).toHaveLength(2);
  });
  it('blocks a dose within 4 hours of the last paracetamol', () => {
    const s = initialState(NOW);
    const v = checkDose(s, s.profiles.alex, 'para500', 1, NOW);
    expect(v.ok).toBe(false);
    expect(v.blocks.join(' ')).toMatch(/Too soon/);
  });
  it('blocks going over 4,000 mg in 24h', () => {
    const s = initialState(NOW);
    s.doses = [{ id: 'x', profileId: 'alex', productId: 'para500', units: 7, at: new Date(NOW - 5 * 3600e3).toISOString() }];
    const v = checkDose(s, s.profiles.alex, 'para500', 2, NOW);
    expect(v.blocks.join(' ')).toMatch(/limit/);
  });
  it('never allows aspirin for a child', () => {
    const s = initialState(NOW);
    const v = checkDose(s, s.profiles.leo, 'aspirin', 1, NOW);
    expect(v.ok).toBe(false);
  });
  it('treats unanswered alcohol use as incomplete, not safe', () => {
    const s = initialState(NOW);
    s.doses = [];
    const v = checkDose(s, s.profiles.alex, 'para500', 1, NOW);
    expect(v.ok).toBe(true);
    expect(v.warnings.join(' ')).toMatch(/incomplete/);
  });
  it('warns (not blocks) on a suspected allergy, blocks a confirmed one', () => {
    const s = initialState(NOW);
    s.doses = [];
    const v = checkDose(s, s.profiles.alex, 'ibuprofen', 1, NOW);
    expect(v.ok).toBe(true);
    expect(v.warnings.join(' ')).toMatch(/Possible reaction/);
    s.profiles.alex.allergies[1].status = 'Confirmed';
    expect(checkDose(s, s.profiles.alex, 'ibuprofen', 1, NOW).ok).toBe(false);
  });
  it('counts painkiller days over two weeks', () => {
    expect(painkillerDays(initialState(NOW), 'alex', NOW)).toBe(4);
  });
});

describe('care plan', () => {
  it('recommends one paracetamol and rejects the duplicate cold tablet', () => {
    const s = initialState(NOW);
    s.doses = [];
    const plan = carePlan(s, check({ fever: 'Moderate', headache: 'Mild', nose: 'Mild' }), s.profiles.alex, NOW);
    const by = (k) => plan.find((p) => p.key === k);
    expect(by('para').kind).toBe('rec');
    expect(by('dup-coldday').kind).toBe('no');
    expect(by('saline').kind).toBe('no'); // expired bottle
    expect(by('vitc').kind).toBe('opt');
  });
  it('shows two recommended medicines and one possible-allergy caution', () => {
    const s = initialState(NOW);
    s.doses = [];
    const plan = carePlan(s, check({ fever: 'Moderate', headache: 'Mild' }), s.profiles.alex, NOW);
    const by = (k) => plan.find((p) => p.key === k);
    expect(by('para').kind).toBe('rec');
    expect(by('fluids').title).toBe('Oral rehydration salts');
    expect(by('fluids').kind).toBe('rec');
    expect(by('ibu').kind).toBe('caution');
    expect(by('ibu').tagText).toBe('Possible allergy');
    expect(plan.every((p) => p.short)).toBe(true);
  });
  it('a confirmed allergy turns caution into avoid', () => {
    const s = initialState(NOW);
    s.profiles.alex.allergies[1].status = 'Confirmed';
    const plan = carePlan(s, check({ fever: 'Mild' }), s.profiles.alex, NOW);
    expect(plan.find((p) => p.key === 'ibu').kind).toBe('no');
  });
  it('for a child: syrup by weight, aspirin rejected', () => {
    const s = initialState(NOW);
    const plan = carePlan(s, check({ fever: 'Mild' }), s.profiles.leo, NOW);
    expect(plan.find((p) => p.key === 'para').productId).toBe('paraSyrup');
    expect(plan.find((p) => p.key === 'aspirin').kind).toBe('no');
  });
  it('emergency → no medicine plan', () => {
    const s = initialState(NOW);
    expect(carePlan(s, check({ fever: 'Mild' }, { warnings: ['chest'] }), s.profiles.alex, NOW)).toEqual([]);
  });
});

describe('expiry', () => {
  it('labels expired and soon', () => {
    expect(expiryStatus({ expires: '2024-02' }, NOW)).toBe('expired');
    expect(expiryStatus({ expires: '2027-01' }, NOW)).toBe('soon');
    expect(expiryStatus({ expires: '2028-04' }, NOW)).toBe('ok');
  });
});

describe('today’s medicine checklist', () => {
  const local = new Date(2026, 10, 22, 14, 30); // 14:30 local time
  it('orders by time and marks taken, missed and later', () => {
    const s = initialState(local);
    const plan = todaysPlan(s, 'alex', local);
    expect(plan.map((m) => m.time)).toEqual(['08:00', '13:00', '21:00']);
    expect(plan.map((m) => m.status)).toEqual(['taken', 'late', 'later']);
  });
  it('a dose due within the hour shows as due', () => {
    const s = initialState(local);
    expect(todaysPlan(s, 'alex', new Date(2026, 10, 22, 13, 20))[1].status).toBe('due');
  });
  it('ticking logs a dose and takes one from the cabinet; unticking undoes both', () => {
    const s0 = initialState();
    const id = 'm5';
    const qty0 = s0.cabinet.find((i) => i.productId === 'lozenges').qty;
    const s1 = reducerForTest(s0, { type: 'careToggle', id });
    expect(s1.careSchedule.find((m) => m.id === id).takenOn).toBe(new Date().toDateString());
    expect(s1.doses.length).toBe(s0.doses.length + 1);
    expect(s1.cabinet.find((i) => i.productId === 'lozenges').qty).toBe(qty0 - 1);
    const s2 = reducerForTest(s1, { type: 'careToggle', id });
    expect(s2.doses.length).toBe(s0.doses.length);
    expect(s2.cabinet.find((i) => i.productId === 'lozenges').qty).toBe(qty0);
  });
});
