// Common OTC brands and their usual active ingredients. Used to identify a medicine
// from the name on the pack, offline. Brands can sell different formulas in different
// countries, so `note` says when the label must be checked. Needs pharmacist review
// before launch, and extending for each market.
export const BRANDS = [
  { name: 'Tylenol', regions: ['TH', 'US'], aliases: ['tylenol'], ingredients: ['paracetamol'], note: 'Most Tylenol products are paracetamol only, but some (like “PM” or “Cold”) add other ingredients.' },
  { name: 'Sara', regions: ['TH'], aliases: ['sara'], ingredients: ['paracetamol'], exact: true, note: 'Thai paracetamol brand.' },
  { name: 'Panadol', regions: ['TH', 'UK'], aliases: ['panadol'], ingredients: ['paracetamol'], note: 'Panadol Extra also contains caffeine.' },
  { name: 'Tempra', regions: ['TH'], aliases: ['tempra'], ingredients: ['paracetamol'] },
  { name: 'Calpol', regions: ['UK'], aliases: ['calpol'], ingredients: ['paracetamol'], note: 'A children’s paracetamol: dose by weight from the label.' },
  { name: 'Tiffy', regions: ['TH'], aliases: ['tiffy'], ingredients: ['paracetamol', 'phenylephrine', 'chlorphenamine'], exact: true, note: 'Cold tablet. Check the label: formulas vary between Tiffy products.' },
  { name: 'Decolgen', regions: ['TH'], aliases: ['decolgen'], ingredients: ['paracetamol', 'phenylephrine', 'chlorphenamine'], note: 'Cold tablet. Check the label: formulas vary by country.' },
  { name: 'Advil', regions: ['US'], aliases: ['advil'], ingredients: ['ibuprofen'] },
  { name: 'Nurofen', regions: ['TH', 'UK'], aliases: ['nurofen'], ingredients: ['ibuprofen'] },
  { name: 'Brufen', regions: ['TH', 'UK'], aliases: ['brufen'], ingredients: ['ibuprofen'] },
  { name: 'Aleve', regions: ['US'], aliases: ['aleve'], ingredients: ['naproxen'], exact: true },
  { name: 'Zyrtec', regions: ['TH', 'US', 'UK'], aliases: ['zyrtec'], ingredients: ['cetirizine'] },
  { name: 'Claritin', regions: ['TH', 'US', 'UK'], aliases: ['claritin', 'clarityne'], ingredients: ['loratadine'] },
  { name: 'Piriton', regions: ['UK'], aliases: ['piriton'], ingredients: ['chlorphenamine'] },
  { name: 'Benadryl', regions: ['US'], aliases: ['benadryl'], ingredients: ['diphenhydramine'], note: 'This is US Benadryl. In some countries Benadryl contains a different antihistamine: check the label.' },
  { name: 'Sudafed', regions: ['US', 'UK'], aliases: ['sudafed'], ingredients: ['pseudoephedrine'], note: 'Some Sudafed products use phenylephrine instead: check the label.' },
  { name: 'Mucinex', regions: ['US'], aliases: ['mucinex'], ingredients: ['guaifenesin'] },
  { name: 'Robitussin', regions: ['US'], aliases: ['robitussin'], ingredients: ['guaifenesin'], note: 'Robitussin DM also contains dextromethorphan.' },
  { name: 'Delsym', regions: ['US'], aliases: ['delsym'], ingredients: ['dextromethorphan'] },
  { name: 'Bisolvon', regions: ['TH'], aliases: ['bisolvon'], ingredients: ['bromhexine'] },
  { name: 'Imodium', regions: ['TH', 'US', 'UK'], aliases: ['imodium'], ingredients: ['loperamide'] },
  { name: 'Tums', regions: ['US'], aliases: ['tums'], ingredients: ['calcium carbonate'], exact: true },
  { name: 'Losec', regions: ['TH', 'UK', 'US'], aliases: ['losec', 'prilosec'], ingredients: ['omeprazole'] },
  { name: 'Air-X', regions: ['TH'], aliases: ['air-x', 'airx'], ingredients: ['simethicone'] },
  { name: 'Gas-X', regions: ['US'], aliases: ['gas-x', 'gasx'], ingredients: ['simethicone'] },
  { name: 'Royal-D', regions: ['TH'], aliases: ['royal-d', 'royald', 'royal d'], ingredients: ['oral rehydration salts'], note: 'Thai oral rehydration salts.' },
];

export const REGIONS = [
  { id: 'TH', name: 'Thailand' },
  { id: 'US', name: 'United States' },
  { id: 'UK', name: 'United Kingdom' },
];

// Explore categories: a brand appears in a category when it contains one of its ingredients.
export const CATEGORIES = [
  { id: 'pain', label: 'Pain & fever', icon: 'thermo', ingredients: ['paracetamol', 'ibuprofen', 'naproxen', 'aspirin'] },
  { id: 'cold', label: 'Cold & flu', icon: 'drop', ingredients: ['phenylephrine', 'pseudoephedrine'] },
  { id: 'allergy', label: 'Allergy', icon: 'leaf', ingredients: ['cetirizine', 'loratadine', 'chlorphenamine', 'diphenhydramine'] },
  { id: 'cough', label: 'Cough', icon: 'bell', ingredients: ['dextromethorphan', 'guaifenesin', 'bromhexine'] },
  { id: 'stomach', label: 'Stomach', icon: 'heart', ingredients: ['calcium carbonate', 'omeprazole', 'simethicone'] },
  { id: 'gut', label: 'Diarrhoea & fluids', icon: 'pill', ingredients: ['loperamide', 'oral rehydration salts'] },
];

export function brandsIn(categoryId, region) {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  const decongestant = (b) => b.ingredients.some((i) => i === 'phenylephrine' || i === 'pseudoephedrine');
  return BRANDS.filter((b) => b.regions.includes(region) && b.ingredients.some((i) => cat.ingredients.includes(i))
    && (categoryId === 'cold' || !decongestant(b)));
}

/** Local brands whose formula is exactly this one ingredient. */
export function brandsWith(ingredientId, region) {
  return BRANDS.filter((b) => b.regions.includes(region) && b.ingredients.length === 1 && b.ingredients[0] === ingredientId);
}

export const regionName = (id) => REGIONS.find((r) => r.id === id)?.name || 'your area';
