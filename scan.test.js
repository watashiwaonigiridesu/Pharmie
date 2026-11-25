import { describe, it, expect } from 'vitest';
import { initialState } from './data.js';
import { findIngredients, checkFound, guessName, matchProduct } from './scan.js';

const NOW = new Date('2026-11-25T14:00:00+07:00');

describe('reading a label', () => {
  it('finds an ingredient and its strength', () => {
    const f = findIngredients('PARACETAMOL\n500 mg Tablets\nEach tablet contains Paracetamol 500 mg');
    expect(f.map((x) => x.ing.id)).toEqual(['paracetamol']);
    expect(f[0].strength).toEqual({ amount: 500, unit: 'mg' });
    expect(guessName(f)).toBe('Paracetamol 500 mg');
    expect(matchProduct(f)).toBe('para500');
  });
  it('tolerates small OCR slips and US names', () => {
    expect(findIngredients('Paracetarnol 500mg')[0].ing.id).toBe('paracetamol');
    expect(findIngredients('Acetaminophen 325 mg')[0].ing.id).toBe('paracetamol');
  });
  it('finds every ingredient in a combination product', () => {
    const ids = findIngredients('Each tablet: Paracetamol 325 mg, Phenylephrine HCl 5 mg, Chlorpheniramine 2 mg').map((x) => x.ing.id);
    expect(ids).toEqual(['paracetamol', 'phenylephrine', 'chlorphenamine']);
  });
  it('finds nothing in unrelated text', () => {
    expect(findIngredients('Keep out of reach of children. Store below 30°C.')).toEqual([]);
  });
});

describe('checking a scan for a person', () => {
  it('warns Alex about paracetamol already taken and in the cabinet', () => {
    const s = initialState(NOW);
    const c = checkFound(s, s.profiles.alex, findIngredients('Paracetamol 500 mg'), NOW);
    const text = c.map((x) => x.text).join(' ');
    expect(c[0].level).toBe('warn');
    expect(text).toMatch(/already taken/);
    expect(text).toMatch(/Same ingredient/);
  });
  it('flags a suspected ibuprofen allergy and a related NSAID', () => {
    const s = initialState(NOW);
    expect(checkFound(s, s.profiles.alex, findIngredients('Ibuprofen 200 mg'), NOW).some((x) => /Possible reaction/.test(x.text))).toBe(true);
    expect(checkFound(s, s.profiles.alex, findIngredients('Naproxen 250 mg'), NOW).some((x) => /same family/.test(x.text))).toBe(true);
  });
  it('blocks aspirin for a child and decongestants with high blood pressure', () => {
    const s = initialState(NOW);
    expect(checkFound(s, s.profiles.leo, findIngredients('Aspirin 300 mg'), NOW)[0].level).toBe('bad');
    expect(checkFound(s, s.profiles.mom, findIngredients('Pseudoephedrine 60 mg'), NOW)[0].level).toBe('bad');
  });
  it('says so when nothing clashes', () => {
    const s = initialState(NOW);
    expect(checkFound(s, s.profiles.leo, findIngredients('Simethicone 40 mg'), NOW)).toEqual([{ level: 'ok', text: expect.stringMatching(/Nothing on Leo’s profile/) }]);
  });
});

import { guessBrand } from './scan.js';
describe('brand on the pack', () => {
  const found = findIngredients('Paracetamol 500 mg');
  it('picks the largest non-ingredient line', () => {
    expect(guessBrand([{ text: 'Fevrelief', height: 80 }, { text: 'Paracetamol 500 mg Tablets', height: 40 }, { text: 'For relief of fever', height: 28 }], found)).toBe('Fevrelief');
  });
  it('returns null when only the ingredient is printed', () => {
    expect(guessBrand([{ text: 'PARACETAMOL', height: 70 }, { text: '500 mg Tablets', height: 50 }], found)).toBe(null);
  });
  it('rejects OCR noise like "os q i" as a brand', () => {
    const f = findIngredients('Dextromethorphan 15 mg');
    expect(guessBrand([{ text: 'os q i', height: 90 }, { text: 'Dextromethorphan 15 mg', height: 40 }], f)).toBe(null);
  });
  it('tidies all-caps brands', () => {
    expect(guessBrand([{ text: 'COLDAWAY', height: 90 }], found)).toBe('Coldaway');
  });
});

describe('brand guessing on a real-looking label', () => {
  it('ignores body text and descriptors, keeps the big name', () => {
    const lines = [{ text: 'Paracetamol 500 mg Tablets', height: 46 }, { text: 'Each tablet contains Paracetamol 500 mg', height: 34 }, { text: 'For relief of fever and mild pain', height: 34 }, { text: '20 tablets', height: 26 }];
    const f = findIngredients('Paracetamol 500 mg');
    expect(guessBrand(lines, f)).toBe(null);
    expect(guessBrand([...lines, { text: 'Fevrelief', height: 69 }], f)).toBe('Fevrelief');
  });
});

describe('strength printed away from the ingredient', () => {
  it('uses the mg value elsewhere on a single-ingredient pack', () => {
    const f = findIngredients('TYLENOL\nAcetaminophen\nPain Reliever, Fever Reducer\nEXTRA STRENGTH\n225 Caplets\n500 mg each');
    expect(f[0].ing.id).toBe('paracetamol');
    expect(f[0].strength).toEqual({ amount: 500, unit: 'mg' });
  });
});
