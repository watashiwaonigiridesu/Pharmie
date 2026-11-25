// Demo data for the Pharmie prototype.
// Product facts are simplified examples. A real launch needs a pharmacist-reviewed,
// locally registered product database (see README).

export const SYMPTOMS = [
  { id: 'fever', label: 'Fever', levels: ['Mild', 'Moderate', 'High'] },
  { id: 'headache', label: 'Headache', levels: ['Mild', 'Moderate', 'Severe'] },
  { id: 'cough', label: 'Cough', levels: ['Occasional', 'Frequent', 'Persistent'] },
  { id: 'throat', label: 'Sore throat', levels: ['Mild', 'Moderate', 'Severe'] },
  { id: 'stomach', label: 'Stomach pain', levels: ['Mild', 'Moderate', 'Severe'] },
  { id: 'nausea', label: 'Nausea', levels: ['Mild', 'Moderate', 'Severe'] },
  { id: 'nose', label: 'Runny nose', levels: ['Mild', 'Moderate', 'Severe'] },
  { id: 'aches', label: 'Body aches', levels: ['Mild', 'Moderate', 'Severe'] },
  { id: 'rash', label: 'Skin rash', levels: ['Small patch', 'Spreading', 'All over'] },
];

export const DURATIONS = [
  { id: 'today', label: 'Today' },
  { id: '1-2', label: '1–2 days' },
  { id: '3+', label: '3+ days' },
];

export const TEMPS = [
  { id: 'under38', label: 'Under 38°C' },
  { id: '38to39', label: '38–39°C' },
  { id: 'over39', label: 'Over 39°C' },
  { id: 'unknown', label: 'Didn’t measure' },
];

export const EXTRAS = [
  { id: 'chills', label: 'Chills' },
  { id: 'cough', label: 'Cough' },
  { id: 'aches', label: 'Body aches' },
  { id: 'nose', label: 'Runny or blocked nose' },
];

export const WARNING_SIGNS = [
  { id: 'breathing', label: 'Difficulty breathing' },
  { id: 'neck', label: 'Stiff neck or a rash that won’t fade when pressed' },
  { id: 'confusion', label: 'Confusion or very hard to wake' },
  { id: 'chest', label: 'Chest pain' },
  { id: 'fluids', label: 'Can’t keep any fluids down' },
];

export const LEVELS = [
  { id: 'selfcare', label: 'Self-care', title: 'Self-care may be appropriate' },
  { id: 'pharmacist', label: 'Pharmacist', title: 'Talk to a pharmacist' },
  { id: 'doctor', label: 'Doctor', title: 'See a doctor' },
  { id: 'emergency', label: 'Emergency', title: 'Get emergency help now' },
];

// ingredients: mg per unit (per tablet, per sachet, per 5 ml dose…)
export const PRODUCTS = {
  para500: {
    name: 'Paracetamol 500 mg',
    category: 'Pain & fever relief',
    form: 'Oral tablet',
    unit: 'tablet',
    ingredients: [{ name: 'paracetamol', mg: 500 }],
    purpose: 'Fever and pain relief',
    minAge: 12,
    label: ['1–2 tablets every 4–6 hours', 'At least 4 hours between doses', 'No more than 8 tablets (4,000 mg) in 24 hours, counting every product with paracetamol'],
    cautions: ['Liver disease', 'Regular alcohol use', 'Other products containing paracetamol'],
    painkiller: true,
  },
  coldday: {
    name: 'Cold Relief DayTabs',
    category: 'Cold & flu',
    form: 'Oral tablet',
    unit: 'tablet',
    ingredients: [{ name: 'paracetamol', mg: 325 }, { name: 'phenylephrine', mg: 5 }],
    purpose: 'Cold symptoms: fever, aches, blocked nose',
    minAge: 12,
    label: ['Follow the pack label', 'Counts toward your daily paracetamol limit'],
    cautions: ['High blood pressure', 'Other products containing paracetamol'],
    painkiller: true,
  },
  paraSyrup: {
    name: 'Children’s paracetamol syrup',
    category: 'Pain & fever relief',
    form: 'Oral liquid',
    unit: 'dose',
    ingredients: [{ name: 'paracetamol', mg: null }],
    purpose: 'Fever and pain relief for children',
    minAge: 0.25,
    label: ['Dose by weight using the chart on the label', 'At least 4 hours between doses', 'No more than 4 doses in 24 hours'],
    cautions: ['Use the measuring syringe in the pack', 'Don’t combine with other paracetamol products'],
    painkiller: true,
    child: true,
  },
  aspirin: {
    name: 'Aspirin 300 mg',
    category: 'Pain & fever relief',
    form: 'Oral tablet',
    unit: 'tablet',
    ingredients: [{ name: 'aspirin', mg: 300 }],
    purpose: 'Pain relief',
    minAge: 16,
    label: ['Follow the pack label'],
    cautions: ['Never give to children under 16', 'Stomach ulcers', 'Blood thinners'],
    painkiller: true,
  },
  ibuprofen: {
    name: 'Ibuprofen 200 mg',
    category: 'Pain & fever relief',
    form: 'Oral tablet',
    unit: 'tablet',
    ingredients: [{ name: 'ibuprofen', mg: 200 }],
    purpose: 'Pain, fever and inflammation',
    minAge: 12,
    label: ['1–2 tablets every 4–6 hours with food', 'No more than 6 tablets (1,200 mg) in 24 hours unless a doctor advises'],
    cautions: ['Stomach ulcers', 'Kidney problems', 'Asthma that gets worse with painkillers', 'Age 65+'],
    painkiller: true,
  },
  ors: {
    name: 'Oral rehydration salts',
    category: 'Rehydration',
    form: 'Sachet',
    unit: 'sachet',
    ingredients: [{ name: 'oral rehydration salts', mg: null }],
    purpose: 'Replaces fluid and salts',
    minAge: 0,
    label: ['Mix one sachet with the amount of clean water on the pack', 'Sip slowly'],
    cautions: ['Mix exactly as directed'],
  },
  cetirizine: {
    name: 'Cetirizine 10 mg',
    category: 'Antihistamine',
    form: 'Oral tablet',
    unit: 'tablet',
    ingredients: [{ name: 'cetirizine', mg: 10 }],
    purpose: 'Allergy relief',
    minAge: 12,
    label: ['1 tablet once a day'],
    cautions: ['Can make some people drowsy', 'Kidney problems'],
  },
  antacid: {
    name: 'Antacid tablets',
    category: 'Antacid',
    form: 'Chewable tablet',
    unit: 'tablet',
    ingredients: [{ name: 'calcium carbonate', mg: 500 }],
    purpose: 'Heartburn and indigestion',
    minAge: 12,
    label: ['Chew 1–2 tablets when symptoms occur', 'Follow the daily maximum on the pack'],
    cautions: ['Can affect how other medicines are absorbed'],
  },
  saline: {
    name: 'Saline nasal spray',
    category: 'Nasal care',
    form: 'Nasal spray',
    unit: 'spray',
    ingredients: [{ name: 'sodium chloride', mg: null }],
    purpose: 'Rinses a blocked or runny nose',
    minAge: 0,
    label: ['1–2 sprays in each nostril as needed'],
    cautions: ['Don’t share the bottle'],
  },
  lozenges: {
    name: 'Throat lozenges',
    category: 'Sore throat',
    form: 'Lozenge',
    unit: 'lozenge',
    ingredients: [{ name: 'amylmetacresol', mg: 0.6 }],
    purpose: 'Soothes a sore throat',
    minAge: 6,
    label: ['Dissolve slowly in the mouth', 'Follow the daily maximum on the pack'],
    cautions: ['Choking risk for young children'],
  },
  vitc: {
    name: 'Vitamin C 500 mg',
    category: 'Supplement',
    form: 'Tablet',
    unit: 'tablet',
    ingredients: [{ name: 'vitamin C', mg: 500 }],
    purpose: 'Supplement',
    minAge: 12,
    label: ['1 tablet a day'],
    cautions: ['Not a treatment for illness'],
    supplement: true,
  },
  amlodipine: {
    name: 'Amlodipine 5 mg',
    category: 'Prescription',
    form: 'Oral tablet',
    unit: 'tablet',
    ingredients: [{ name: 'amlodipine', mg: 5 }],
    purpose: 'Blood pressure (prescribed)',
    minAge: 18,
    label: ['As prescribed'],
    cautions: ['Prescription medicine'],
    prescription: true,
  },
  metformin: {
    name: 'Metformin 500 mg',
    category: 'Prescription',
    form: 'Oral tablet',
    unit: 'tablet',
    ingredients: [{ name: 'metformin', mg: 500 }],
    purpose: 'Diabetes (prescribed)',
    minAge: 18,
    label: ['As prescribed'],
    cautions: ['Prescription medicine'],
    prescription: true,
  },
  thermometer: {
    name: 'Digital thermometer',
    category: 'Device',
    form: 'Device',
    unit: 'device',
    ingredients: [],
    purpose: 'Checking temperature',
    minAge: 0,
    label: ['Follow the device instructions'],
    cautions: [],
    device: true,
  },
};

export const CABINETS = [
  { id: 'alex', label: 'Mine' },
  { id: 'leo', label: 'Leo’s' },
  { id: 'family', label: 'Family' },
  { id: 'mom', label: 'Mom’s' },
];

// Which cabinets a profile can take medicine from.
export const CABINET_ACCESS = {
  alex: ['alex', 'family'],
  leo: ['leo', 'family'],
  mom: ['mom'],
};

export function initialState(now = new Date()) {
  const h = (hoursAgo) => new Date(now.getTime() - hoursAgo * 3600e3).toISOString();
  const d = (daysAgo) => new Date(now.getTime() - daysAgo * 86400e3).toISOString();
  // A scheduled dose counts as taken if its time today has already passed.
  const today = now.toDateString();
  const at = (time, late = 6) => { const [hh, mm] = time.split(':').map(Number); const t = new Date(now); t.setHours(hh, mm + late, 0, 0); return t; };
  const sched = [
    { id: 'm4', profileId: 'alex', time: '08:00', productId: 'vitc', units: 1, seedTaken: true },
    { id: 'm5', profileId: 'alex', time: '13:00', productId: 'lozenges', units: 1 },
    { id: 'm6', profileId: 'alex', time: '21:00', productId: 'cetirizine', units: 1, note: 'Can make you drowsy, so take at bedtime' },
    { id: 'm1', profileId: 'mom', time: '08:00', productId: 'amlodipine', units: 1, seedTaken: true },
    { id: 'm2', profileId: 'mom', time: '08:00', productId: 'metformin', units: 1, seedTaken: true, note: 'With breakfast' },
    { id: 'm3', profileId: 'mom', time: '20:00', productId: 'metformin', units: 1, note: 'With dinner' },
  ];
  const careSchedule = sched.map(({ seedTaken, ...m }) => (seedTaken && at(m.time) < now ? { ...m, takenOn: today, doseId: 'c' + m.id } : { ...m, takenOn: null, doseId: null }));
  const careDoses = careSchedule.filter((m) => m.doseId).map((m) => ({ id: m.doseId, profileId: m.profileId, productId: m.productId, units: m.units, at: at(m.time).toISOString() }));
  return {
    version: 3,
    who: 'alex',
    plan: 'free',
    check: { sel: {}, order: [], dur: null, temp: null, sudden: null, extras: [], warnings: [], none: false },
    profiles: {
      alex: {
        id: 'alex', name: 'Alex', relation: 'You', age: 28, heightCm: 172, weightKg: 64, language: 'Thai, English',
        allergies: [
          { id: 'a1', substance: 'Penicillin', reaction: 'Hives', severity: 'Moderate', status: 'Confirmed' },
          { id: 'a2', substance: 'Ibuprofen', reaction: 'Wheezing', severity: 'Mild', status: 'Suspected' },
        ],
        conditions: [{ id: 'c1', name: 'Seasonal allergies', status: 'Active', since: '2019' }],
        medicines: ['cetirizine'],
        liver: false, kidney: false, alcohol: null, pregnant: null,
        livesAlone: true,
        emergency: { name: 'Mom', phone: '' },
      },
      leo: {
        id: 'leo', name: 'Leo', relation: 'Son', age: 4, heightCm: 103, weightKg: 16, language: 'Thai',
        allergies: [], conditions: [], medicines: [],
        liver: false, kidney: false, alcohol: 'no', pregnant: null,
        livesAlone: false,
        emergency: { name: 'Alex', phone: '' },
      },
      mom: {
        id: 'mom', name: 'Mom', relation: 'Mother', age: 67, heightCm: 156, weightKg: 58, language: 'Thai',
        allergies: [],
        conditions: [
          { id: 'c2', name: 'High blood pressure', status: 'Active', since: '2015' },
          { id: 'c3', name: 'Type 2 diabetes', status: 'Active', since: '2018' },
        ],
        medicines: ['amlodipine', 'metformin'],
        liver: false, kidney: false, alcohol: 'no', pregnant: null,
        livesAlone: true,
        emergency: { name: 'Alex', phone: '' },
      },
    },
    customProducts: {},
    cabinet: [
      { id: 'i1', productId: 'para500', cabinet: 'alex', qty: 10, expires: '2028-04', lowAt: 4 },
      { id: 'i2', productId: 'coldday', cabinet: 'alex', qty: 6, expires: '2027-09', lowAt: 2 },
      { id: 'i3', productId: 'cetirizine', cabinet: 'alex', qty: 8, expires: '2027-06', lowAt: 3 },
      { id: 'i4', productId: 'saline', cabinet: 'alex', qty: 1, expires: '2024-02', lowAt: 0 },
      { id: 'i12', productId: 'ibuprofen', cabinet: 'alex', qty: 12, expires: '2027-10', lowAt: 4 },
      { id: 'i13', productId: 'vitc', cabinet: 'alex', qty: 24, expires: '2028-02', lowAt: 5 },
      { id: 'i14', productId: 'lozenges', cabinet: 'alex', qty: 14, expires: '2027-12', lowAt: 4 },
      { id: 'i5', productId: 'ors', cabinet: 'family', qty: 2, expires: '2028-01', lowAt: 2 },
      { id: 'i6', productId: 'antacid', cabinet: 'family', qty: 12, expires: '2028-03', lowAt: 4 },
      { id: 'i7', productId: 'thermometer', cabinet: 'family', qty: 1, expires: null, lowAt: 0 },
      { id: 'i8', productId: 'aspirin', cabinet: 'family', qty: 16, expires: '2027-11', lowAt: 4 },
      { id: 'i9', productId: 'paraSyrup', cabinet: 'leo', qty: 1, expires: '2027-01', lowAt: 0 },
      { id: 'i10', productId: 'amlodipine', cabinet: 'mom', qty: 24, expires: '2027-08', lowAt: 7 },
      { id: 'i11', productId: 'metformin', cabinet: 'mom', qty: 9, expires: '2027-05', lowAt: 10 },
    ],
    doses: [
      { id: 'd1', profileId: 'alex', productId: 'para500', units: 1, at: d(12) },
      { id: 'd2', profileId: 'alex', productId: 'para500', units: 2, at: d(9) },
      { id: 'd3', profileId: 'alex', productId: 'para500', units: 1, at: d(5) },
      { id: 'd4', profileId: 'alex', productId: 'para500', units: 1, at: h(6) },
      { id: 'd5', profileId: 'alex', productId: 'coldday', units: 2, at: h(1.5) },
      ...careDoses,
    ],
    solo: { on: true, everyHours: 4, nextAt: h(-2.5), contact: 'Mom', alerted: false },
    members: [
      { id: 'alex', name: 'Alex', meta: 'You · owner', kind: 'adult' },
      { id: 'mai', name: 'Mai', meta: 'Partner · manages her own profile', kind: 'adult' },
      { id: 'leo', name: 'Leo', meta: 'Child · guardians: you and Mai', kind: 'child' },
      { id: 'mom', name: 'Mom', meta: 'Lives in Khon Kaen · you’re her caregiver', kind: 'parent' },
    ],
    shares: [
      { id: 's1', to: 'Mai', level: 'View', scope: 'Allergies, emergency info' },
      { id: 's2', to: 'Mom', level: 'Emergency access', scope: 'Emergency info' },
    ],
    careSchedule,
    activity: [
      { id: 'l1', at: d(1), text: 'Mai viewed Leo’s allergies' },
      { id: 'l2', at: d(20), text: 'You updated Leo’s weight to 16 kg' },
    ],
  };
}

// Active ingredients the label scanner recognises. `aliases` are matched in the
// photo's text (lower case). Facts are general guidance for a prototype and need
// pharmacist review before launch.
export const INGREDIENTS = [
  { id: 'paracetamol', aka: 'Acetaminophen (US)', how: 'Works in the brain to lower fever and dull pain. It doesn’t reduce swelling.', max: '4,000 mg in 24 hours for adults, counting every product', name: 'Paracetamol', aliases: ['paracetamol', 'acetaminophen', 'paracetamo'], group: 'pain-fever', kind: 'Pain and fever reliever', usedFor: 'Fever, headache, aches', minAge: 0.25, cautions: ['Liver disease or regular alcohol use: ask a pharmacist first', 'Count every product that contains paracetamol toward one daily limit'] },
  { id: 'ibuprofen', aka: '', how: 'Blocks the body’s inflammation signals (prostaglandins), easing pain, fever and swelling.', max: '1,200 mg in 24 hours for adults without a doctor’s advice', name: 'Ibuprofen', aliases: ['ibuprofen', 'ibuprofene'], group: 'nsaid', kind: 'Anti-inflammatory pain reliever (NSAID)', usedFor: 'Pain, fever, swelling', minAge: 0.5, cautions: ['Take with food', 'Stomach ulcers, kidney problems, asthma or age 65+: ask a pharmacist first'] },
  { id: 'aspirin', aka: 'Acetylsalicylic acid', how: 'Blocks inflammation signals and makes blood platelets less sticky.', max: 'Follow the label', name: 'Aspirin', aliases: ['aspirin', 'acetylsalicylic', 'salicylic acid'], group: 'nsaid', kind: 'Anti-inflammatory pain reliever (NSAID)', usedFor: 'Pain, fever', minAge: 16, cautions: ['Never for children under 16', 'Stomach ulcers or blood thinners: ask a pharmacist first'] },
  { id: 'naproxen', aka: '', how: 'A longer-acting anti-inflammatory that blocks prostaglandins.', max: 'Follow the label', name: 'Naproxen', aliases: ['naproxen'], group: 'nsaid', kind: 'Anti-inflammatory pain reliever (NSAID)', usedFor: 'Pain, period pain, swelling', minAge: 12, cautions: ['Take with food', 'Don’t combine with other NSAIDs like ibuprofen or aspirin'] },
  { id: 'cetirizine', aka: '', how: 'Blocks histamine, the chemical behind sneezing, itching and hives.', max: 'Follow the label', name: 'Cetirizine', aliases: ['cetirizine'], group: 'antihistamine', kind: 'Antihistamine', usedFor: 'Allergies, hay fever, itchy rashes', minAge: 2, cautions: ['Can make some people drowsy'] },
  { id: 'loratadine', aka: '', how: 'Blocks histamine with little drowsiness for most people.', max: 'Follow the label', name: 'Loratadine', aliases: ['loratadine'], group: 'antihistamine', kind: 'Antihistamine', usedFor: 'Allergies, hay fever', minAge: 2, cautions: ['Rarely drowsy'] },
  { id: 'chlorphenamine', aka: 'Chlorpheniramine', how: 'Blocks histamine. It reaches the brain, so it causes drowsiness.', max: 'Follow the label', name: 'Chlorphenamine', aliases: ['chlorphenamine', 'chlorpheniramine'], group: 'antihistamine', kind: 'Antihistamine (drowsy)', usedFor: 'Allergies, cold symptoms', minAge: 6, cautions: ['Causes drowsiness: don’t drive', 'Don’t combine with other antihistamines'] },
  { id: 'diphenhydramine', aka: '', how: 'Blocks histamine and causes strong drowsiness.', max: 'Follow the label', name: 'Diphenhydramine', aliases: ['diphenhydramine'], group: 'antihistamine', kind: 'Antihistamine (drowsy)', usedFor: 'Allergies, cough, sleep', minAge: 6, cautions: ['Causes drowsiness: don’t drive', 'Not recommended for older adults without advice'] },
  { id: 'phenylephrine', aka: '', how: 'Narrows swollen blood vessels in the nose to ease a blocked nose.', max: 'Follow the label', name: 'Phenylephrine', aliases: ['phenylephrine'], group: 'decongestant', kind: 'Decongestant', usedFor: 'Blocked nose', minAge: 12, cautions: ['High blood pressure or heart problems: ask a pharmacist first'] },
  { id: 'pseudoephedrine', aka: '', how: 'Narrows blood vessels in the nose. It can raise heart rate and blood pressure.', max: 'Follow the label', name: 'Pseudoephedrine', aliases: ['pseudoephedrine'], group: 'decongestant', kind: 'Decongestant', usedFor: 'Blocked nose', minAge: 12, cautions: ['High blood pressure or heart problems: ask a pharmacist first', 'Can cause trouble sleeping'] },
  { id: 'dextromethorphan', aka: '', how: 'Calms the cough reflex in the brain.', max: 'Follow the label', name: 'Dextromethorphan', aliases: ['dextromethorphan'], group: 'cough', kind: 'Cough suppressant', usedFor: 'Dry, tickly cough', minAge: 12, cautions: ['Don’t use for a chesty cough with phlegm'] },
  { id: 'guaifenesin', aka: 'Guaiphenesin', how: 'Thins mucus so a chesty cough brings it up more easily.', max: 'Follow the label', name: 'Guaifenesin', aliases: ['guaifenesin', 'guaiphenesin'], group: 'cough', kind: 'Expectorant', usedFor: 'Chesty cough', minAge: 12, cautions: ['Drink plenty of water'] },
  { id: 'bromhexine', aka: '', how: 'Breaks down thick mucus in the airways.', max: 'Follow the label', name: 'Bromhexine', aliases: ['bromhexine'], group: 'cough', kind: 'Mucus thinner', usedFor: 'Chesty cough', minAge: 2, cautions: ['Stomach ulcers: ask a pharmacist first'] },
  { id: 'loperamide', aka: '', how: 'Slows the gut so less water is lost.', max: 'Follow the label', name: 'Loperamide', aliases: ['loperamide'], group: 'gut', kind: 'Anti-diarrhoea', usedFor: 'Short-term diarrhoea', minAge: 12, cautions: ['Not for diarrhoea with fever or blood: see a doctor'] },
  { id: 'calcium carbonate', aka: '', how: 'Neutralises stomach acid on contact.', max: 'Follow the label', name: 'Calcium carbonate', aliases: ['calcium carbonate'], group: 'antacid', kind: 'Antacid', usedFor: 'Heartburn, indigestion', minAge: 12, cautions: ['Take 2 hours apart from other medicines'] },
  { id: 'simethicone', aka: 'Dimethicone', how: 'Lets small gas bubbles join so they pass more easily. It isn’t absorbed.', max: 'Follow the label', name: 'Simethicone', aliases: ['simethicone', 'dimethicone'], group: 'gut', kind: 'Anti-gas', usedFor: 'Bloating, wind', minAge: 0, cautions: [] },
  { id: 'omeprazole', aka: '', how: 'Turns down acid production in the stomach lining over a few days.', max: 'Follow the label', name: 'Omeprazole', aliases: ['omeprazole'], group: 'antacid', kind: 'Acid reducer', usedFor: 'Heartburn', minAge: 18, cautions: ['If you need it for more than 2 weeks, see a doctor'] },
  { id: 'sodium chloride', aka: 'Saline', how: 'Salt water that rinses and loosens mucus.', max: 'No limit for nose sprays', name: 'Sodium chloride', aliases: ['sodium chloride', 'saline'], group: 'nasal', kind: 'Saline', usedFor: 'Rinsing a blocked nose', minAge: 0, cautions: [] },
  { id: 'oral rehydration salts', aka: 'ORS', how: 'Sugar and salts in the right balance help the gut absorb water.', max: 'Follow the label', name: 'Oral rehydration salts', aliases: ['oral rehydration', 'rehydration salts', 'electrolyte'], group: 'fluids', kind: 'Rehydration', usedFor: 'Fluid loss from fever, diarrhoea or vomiting', minAge: 0, cautions: ['Mix exactly as the pack says'] },
];
