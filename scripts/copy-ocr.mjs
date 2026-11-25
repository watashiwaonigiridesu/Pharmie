// Copies the label-reading (OCR) engine into public/ocr so the app can read
// medicine labels on the user's device, without sending photos anywhere.
// Runs automatically before `npm run dev` and `npm run build`.
import { cpSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const out = 'public/ocr';
mkdirSync(out, { recursive: true });

cpSync('node_modules/tesseract.js/dist/worker.min.js', join(out, 'worker.min.js'));

const core = 'node_modules/tesseract.js-core';
for (const f of readdirSync(core)) {
  if (/^tesseract-core(-simd)?-lstm\.(wasm\.js|wasm|js)$/.test(f)) cpSync(join(core, f), join(out, f));
}

const lang = 'node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz';
if (!existsSync(lang)) throw new Error('English OCR data missing: run npm install');
cpSync(lang, join(out, 'eng.traineddata.gz'));

console.log('OCR engine copied to public/ocr');
