import { describe, it, expect } from 'vitest';
import { matchBrand, parseOpenFda, identify, nameCandidates } from './lookup.js';

const FDA_TYLENOL = { results: [
  { openfda: { brand_name: ['TYLENOL Extra Strength'], substance_name: ['ACETAMINOPHEN'], product_type: ['HUMAN OTC DRUG'] }, active_ingredient: ['Active ingredient (in each tablet) Acetaminophen 500 mg'] },
  { openfda: { brand_name: ['TYLENOL Regular Strength'], substance_name: ['ACETAMINOPHEN'], product_type: ['HUMAN OTC DRUG'] }, active_ingredient: ['Active ingredient (in each caplet) Acetaminophen 325 mg'] },
  { openfda: { brand_name: ['TYLENOL PM'], substance_name: ['ACETAMINOPHEN', 'DIPHENHYDRAMINE HYDROCHLORIDE'], product_type: ['HUMAN OTC DRUG'] }, active_ingredient: ['Acetaminophen 500 mg, Diphenhydramine HCl 25 mg'] },
] };
const okFetch = (json, status = 200) => async () => ({ ok: status === 200, status, json: async () => json });

describe('finding the brand on the pack', () => {
  it('matches known brands, allowing one OCR slip', () => {
    expect(matchBrand('TYLENOL\nExtra Strength').name).toBe('Tylenol');
    expect(matchBrand('NUROFEN 200').name).toBe('Nurofen');
    expect(matchBrand('Nurofem express').name).toBe('Nurofen');
    expect(matchBrand('Royal-D electrolyte').name).toBe('Royal-D');
  });
  it('does not fire on look-alike short words', () => {
    expect(matchBrand('Sarah’s pharmacy')).toBe(null);
    expect(matchBrand('Keep out of reach of children')).toBe(null);
  });
});

describe('online lookup (openFDA)', () => {
  it('picks the most common formula and its strength', () => {
    const r = parseOpenFda(FDA_TYLENOL, 'Tylenol');
    expect(r.brand).toBe('Tylenol');
    expect(r.found.map((f) => f.ing.id)).toEqual(['paracetamol']);
    expect(r.found[0].strength).toEqual({ amount: 500, unit: 'mg' });
    expect(r.note).toMatch(/1 other Tylenol formula/);
  });
  it('keeps unknown substances instead of dropping them', () => {
    const r = parseOpenFda({ results: [{ openfda: { brand_name: ['ALLEGRA'], substance_name: ['FEXOFENADINE HYDROCHLORIDE'], product_type: ['HUMAN OTC DRUG'] }, active_ingredient: ['Fexofenadine HCl 180 mg'] }] }, 'Allegra');
    expect(r.found[0].ing.name).toBe('Fexofenadine');
    expect(r.found[0].ing.unknown).toBe(true);
  });
});

describe('identify', () => {
  it('uses the brand list offline', async () => {
    const r = await identify({ text: 'TYLENOL\nExtra Strength', lines: [{ text: 'TYLENOL', height: 90 }] }, okFetch({}, 500));
    expect(r).toMatchObject({ brand: 'Tylenol', source: 'list' });
    expect(r.found[0].ing.id).toBe('paracetamol');
  });
  it('prefers ingredients printed on the label', async () => {
    const r = await identify({ text: 'TYLENOL Cold\nAcetaminophen 325 mg Phenylephrine 5 mg', lines: [] });
    expect(r.source).toBe('label');
    expect(r.found.map((f) => f.ing.id)).toEqual(['paracetamol', 'phenylephrine']);
  });
  it('looks unknown brands up online', async () => {
    const r = await identify({ text: 'ACMEPAIN', lines: [{ text: 'ACMEPAIN', height: 80 }] }, okFetch(FDA_TYLENOL));
    expect(r.source).toBe('online');
    expect(r.found[0].ing.id).toBe('paracetamol');
  });
  it('reports when nothing could be identified, and when online was unreachable', async () => {
    const r = await identify({ text: 'Mystery', lines: [{ text: 'Mystery', height: 80 }] }, async () => { throw new Error('offline'); });
    expect(r.found).toEqual([]);
    expect(r.onlineFailed).toBe(true);
  });
  it('suggests the biggest words as names', () => {
    expect(nameCandidates([{ text: 'Coldaway Max', height: 80 }, { text: 'Each tablet contains', height: 20 }], [])).toContain('Coldaway');
  });
});
