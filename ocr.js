// Reads text from a photo of a medicine label, on the device. Nothing is uploaded.
// The engine files are served from /ocr (copied there by scripts/copy-ocr.mjs).

async function scaled(image, maxW) {
  const bmp = await createImageBitmap(image);
  const k = Math.min(1, maxW / bmp.width);
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close?.();
  return { canvas: c, k };
}

/**
 * Light text on a coloured pack (white on red, yellow on blue…) reads badly as-is.
 * Taking each pixel's darkest colour channel turns light text bright against any
 * saturated background; inverting and stretching the contrast then gives dark text
 * on a light page, which the reader handles well.
 */
function lightTextVariant(src) {
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(src, 0, 0);
  const img = g.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  const hist = new Uint32Array(256);
  for (let i = 0; i < d.length; i += 4) {
    const v = 255 - Math.min(d[i], d[i + 1], d[i + 2]);
    d[i] = v;
    hist[v]++;
  }
  const n = d.length / 4;
  let lo = 0, hi = 255, acc = 0;
  for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= n * 0.02) { lo = v; break; } }
  acc = 0;
  for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc >= n * 0.02) { hi = v; break; } }
  const span = Math.max(1, hi - lo);
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.max(0, Math.min(255, ((d[i] - lo) * 255) / span));
    d[i] = d[i + 1] = d[i + 2] = v;
    d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

function linesOf(data, k) {
  return (data.blocks || []).flatMap((b) => (b.paragraphs || []).flatMap((p) => p.lines || []))
    .map((l) => ({ text: (l.text || '').trim(), height: l.bbox ? (l.bbox.y1 - l.bbox.y0) / k : 0 }))
    .filter((l) => l.text);
}

/**
 * Reads a pack four ways (see below) and merges what it finds.
 * Returns { text, lines: [{ text, height }] } with heights in normal-pass pixels.
 */
export async function readLabel(image, onProgress) {
  const { createWorker } = await import('tesseract.js');
  const base = new URL('ocr/', document.baseURI).href;
  // The Claude preview can't serve .gz files, so its build ships the English data as
  // base64 JSON (VITE_LANG_URL). A tiny wrapper worker answers the reader's request
  // for eng.traineddata.gz from that JSON, then loads the normal worker script.
  const langUrl = import.meta.env.VITE_LANG_URL;
  let preview = {};
  if (langUrl) {
    const jsonUrl = new URL(langUrl, document.baseURI).href;
    const src = `const real = self.fetch.bind(self);
self.fetch = (u, ...r) => String(u).endsWith('.traineddata.gz')
  ? real(${JSON.stringify(jsonUrl)}).then((x) => x.json()).then((j) => { const b = atob(j.base64); const a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return new Response(a); })
  : real(u, ...r);
importScripts(${JSON.stringify(base + 'worker.min.js')});`;
    preview = { workerPath: URL.createObjectURL(new Blob([src], { type: 'text/javascript' })), workerBlobURL: false, cacheMethod: 'none' };
  }
  let pass = 0;
  const worker = await createWorker('eng', 1, {
    workerPath: base + 'worker.min.js',
    corePath: base,
    langPath: base.replace(/\/$/, ''),
    gzip: true,
    ...preview,
    logger: (m) => {
      if (!onProgress) return;
      if (m.status === 'recognizing text') onProgress(0.3 + ((pass + m.progress) / 4) * 0.7, 'Reading the pack');
      else if (typeof m.progress === 'number') onProgress(Math.min(0.3, m.progress * 0.3), 'Getting ready');
    },
  });
  try {
    const big = await scaled(image, 1600);
    const small = await scaled(image, Math.max(240, Math.round(big.canvas.width * 0.35)));
    const rel = big.k ? small.k / big.k : 1;
    // Four reads: as photographed and as "light text", each at full size (small print,
    // automatic layout) and at a small size (big lettering such as the brand, sparse text).
    const passes = [
      [big.canvas, '3', 1],
      [small.canvas, '11', rel],
      [lightTextVariant(big.canvas), '3', 1],
      [lightTextVariant(small.canvas), '11', rel],
    ];
    const lines = [];
    const texts = [];
    for (const [canvas, psm, k] of passes) {
      // The default layout mode reads the photo as one block and drops big standalone words.
      await worker.setParameters({ tessedit_pageseg_mode: psm });
      const r = await worker.recognize(canvas, {}, { text: true, blocks: true });
      pass++;
      texts.push(r.data.text || '');
      for (const l of linesOf(r.data, k)) {
        if (!lines.some((x) => x.text.toLowerCase() === l.text.toLowerCase())) lines.push(l);
      }
    }
    return { text: texts.join('\n'), lines };
  } finally {
    await worker.terminate();
  }
}

/** A clean sample label with a made-up brand name so people can try the feature without a pack at hand. */
export function sampleLabel() {
  const c = document.createElement('canvas');
  c.width = 900;
  c.height = 560;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#1C9BEF';
  g.fillRect(0, 0, c.width, 26);
  g.fillStyle = '#C8243A';
  g.font = 'bold 96px Arial, sans-serif';
  g.fillText('Fevrelief', 50, 140);
  g.fillStyle = '#17181C';
  g.font = 'bold 48px Arial, sans-serif';
  g.fillText('Paracetamol 500 mg Tablets', 50, 220);
  g.font = '34px Arial, sans-serif';
  g.fillText('Each tablet contains Paracetamol 500 mg', 50, 320);
  g.fillText('For relief of fever and mild pain', 50, 380);
  g.fillText('20 tablets', 50, 470);
  return new Promise((res) => c.toBlob(res, 'image/png'));
}
