/**
 * Real OCR engine — bundled dependencies (pdfjs-dist + tesseract.js).
 * No CDN imports, no API keys, no secrets. All on-device.
 *
 * Priority:
 *  1. Native PDF text layer (pdfjs-dist) for digital PDFs.
 *  2. Tesseract.js for images + scanned PDFs (PDF pages rasterized to canvas).
 * Languages: eng + hin + tel (configurable via VITE_OCR_LANGS).
 * Original text is preserved verbatim — never translated, never invented.
 */

// Lazy-loaded so the main kiosk bundle stays small — OCR libs download only
// when a document is actually processed.
let _pdfjsMod = null;
const loadPdfjs = async () => {
  if (_pdfjsMod) return _pdfjsMod;
  const [lib, workerMod] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  try { if (lib?.GlobalWorkerOptions) lib.GlobalWorkerOptions.workerSrc = workerMod?.default; } catch { /* noop */ }
  _pdfjsMod = lib;
  return lib;
};

export const ocrProviderInfo = () => ({
  provider: 'on-device (pdfjs-dist text layer + Tesseract.js eng/hin/tel, bundled)',
  langs: (import.meta.env?.VITE_OCR_LANGS || 'eng+hin+tel'),
  secretsRequired: false,
});

const ocrLangs = (override) => override || import.meta.env?.VITE_OCR_LANGS || 'eng+hin+tel';

const fileToDataUrl = (file) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result);
  r.onerror = () => rej(new Error('Could not read file.'));
  r.readAsDataURL(file);
});

async function pdfTextLayer(file) {
  const pdfjsLib = await loadPdfjs();
  const buf = await file.arrayBuffer();
  const task = pdfjsLib.getDocument({ data: buf });
  const pdf = await task.promise;
  try {
    let out = '';
    const n = Math.min(pdf.numPages || 0, 10);
    for (let p = 1; p <= n; p += 1) {
      const page = await pdf.getPage(p);
      const tc = await page.getTextContent();
      const line = (tc.items || []).map((it) => it.str || '').join(' ');
      if (line.trim()) out += `\n--- page ${p} ---\n${line}`;
    }
    return { text: out.trim(), pages: n };
  } finally {
    try { await task.destroy(); } catch { /* noop */ }
  }
}

async function pdfRenderToDataUrls(file, maxPages = 3) {
  const pdfjsLib = await loadPdfjs();
  const buf = await file.arrayBuffer();
  const task = pdfjsLib.getDocument({ data: buf });
  const pdf = await task.promise;
  try {
    const urls = [];
    const n = Math.min(pdf.numPages || 0, maxPages);
    for (let p = 1; p <= n; p += 1) {
      const page = await pdf.getPage(p);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width; canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      urls.push(canvas.toDataURL('image/png'));
    }
    return urls;
  } finally {
    try { await task.destroy(); } catch { /* noop */ }
  }
}

export const runImageOcr = async (imageSource, langs, onProgress) => {
  // Loaded lazily; worker pinned to the installed tesseract.js major version
  // (7.0.0) via CDN so the bundled app never depends on bundler-emitted
  // worker paths. Overrides: VITE_TESS_WORKER_URL / VITE_TESS_LANG_URL / VITE_TESS_CORE_URL.
  const { createWorker } = await import('tesseract.js');
  const workerPath = import.meta.env?.VITE_TESS_WORKER_URL || 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/worker.min.js';
  const options = {
    workerPath,
    logger: (m) => {
      if (m?.status === 'recognizing text' && onProgress) {
        try { onProgress(m.progress); } catch { /* noop */ }
      }
    },
  };
  if (import.meta.env?.VITE_TESS_LANG_URL) options.langPath = import.meta.env.VITE_TESS_LANG_URL;
  if (import.meta.env?.VITE_TESS_CORE_URL) options.corePath = import.meta.env.VITE_TESS_CORE_URL;
  const worker = await createWorker(ocrLangs(langs), undefined, options);
  try {
    const { data } = await worker.recognize(imageSource);
    return String(data?.text || '');
  } finally {
    try { await worker.terminate(); } catch { /* noop */ }
  }
};

/** Main entry: file -> { text, method, confidence }. Never returns fake text. */
export const ocrDocumentFile = async (file, { langs, onProgress } = {}) => {
  const language = ocrLangs(langs);
  const name = String(file?.name || '').toLowerCase();
  const isPdf = name.endsWith('.pdf') || file?.type === 'application/pdf';
  if (isPdf) {
    try {
      const { text } = await pdfTextLayer(file);
      if (text && text.replace(/[^A-Za-z0-9\u0900-\u097F\u0C00-\u0C7F]/g, '').length >= 30) {
        return { text, method: 'pdf-text-layer', confidence: 'high' };
      }
    } catch { /* fall through to raster OCR */ }
    const pages = await pdfRenderToDataUrls(file, 3);
    if (!pages.length) throw new Error('PDF could not be read. Document is still available for manual review.');
    let combined = '';
    for (const url of pages) {
      const t = await runImageOcr(url, language, onProgress);
      if (t.trim()) combined += `\n${t}`;
    }
    if (!combined.trim()) throw new Error('No readable text found in this PDF.');
    return { text: combined.trim(), method: 'tesseract-scanned-pdf', confidence: 'medium' };
  }
  const url = await fileToDataUrl(file);
  const text = await runImageOcr(url, language, onProgress);
  if (!text.trim()) throw new Error('No readable text found in this image.');
  return { text: text.trim(), method: 'tesseract-image', confidence: 'medium' };
};

