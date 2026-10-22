/**
 * Generates the derived static assets in public/: favicon.ico, apple-touch-icon.png
 * and og.png. Run with `npm run assets` after changing the headshot, the favicon or
 * the name/title/tagline in profile.json.
 *
 * These are committed rather than built in CI: Azure Static Web Apps' build container
 * is the wrong place to discover a font or native-binary problem, and the inputs change
 * about once a year.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
import satori from 'satori';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const p = (...s) => path.join(root, ...s);

const profile = JSON.parse(await readFile(p('src/data/profile.json'), 'utf8'));

// Both subsets of each family are needed: `latin` has no glyph for the ě in "Matěj".
// Satori won't fall back between fonts that share a name, so each extended subset is
// registered under its own family and listed as a fallback in `fontFamily`.
const font = (pkg, file) => readFile(p('node_modules/@fontsource', pkg, 'files', file));
const family = (pkg, name, weights) =>
  weights.flatMap((weight) => [
    font(pkg, `${pkg}-latin-${weight}-normal.woff`).then((data) => ({ name, weight, style: 'normal', data })),
    font(pkg, `${pkg}-latin-ext-${weight}-normal.woff`).then((data) => ({ name: `${name}Ext`, weight, style: 'normal', data })),
  ]);
const fonts = await Promise.all([
  ...family('archivo', 'Archivo', [500, 800]),
  ...family('ibm-plex-mono', 'Plex Mono', [400]),
]);

// ── favicons ──────────────────────────────────────────────────────────────────
const faviconSvg = await readFile(p('public/favicon.svg'));

await sharp(faviconSvg).resize(180, 180).png().toFile(p('public/apple-touch-icon.png'));

// sharp can't write .ico, but an ICO is just a 22-byte header wrapping a PNG.
const icoPng = await sharp(faviconSvg).resize(32, 32).png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0);          // reserved
header.writeUInt16LE(1, 2);          // type: icon
header.writeUInt16LE(1, 4);          // image count
header.writeUInt8(32, 6);            // width
header.writeUInt8(32, 7);            // height
header.writeUInt8(0, 8);             // palette size
header.writeUInt8(0, 9);             // reserved
header.writeUInt16LE(1, 10);         // colour planes
header.writeUInt16LE(32, 12);        // bits per pixel
header.writeUInt32LE(icoPng.length, 14);
header.writeUInt32LE(22, 18);        // offset of image data
await writeFile(p('public/favicon.ico'), Buffer.concat([header, icoPng]));

// ── open graph image ──────────────────────────────────────────────────────────
// Mirrors the site: light ground, black rules, one accent, square photo.
const photo = await sharp(p('src/assets/headshot.jpg')).resize(400, 470, { fit: 'cover', position: 'top' }).jpeg({ quality: 90 }).toBuffer();
const photoUri = `data:image/jpeg;base64,${photo.toString('base64')}`;

const el = (type, props, ...children) => ({ type, props: { ...props, children: children.flat() } });
const text = (s) => s;

const ink = '#121212';
const ground = '#f3f3f1';
const accent = '#c93a1c';
const muted = '#55564f';

// Highlight the same phrase the homepage highlights.
const [before, after] = profile.tagline.includes(profile.taglineHighlight)
  ? profile.tagline.split(profile.taglineHighlight)
  : [profile.tagline, null];
const words = (str, hl) => str.split(/\s+/).filter(Boolean).map((word) => ({ word, hl }));
const taglineWords = after === null
  ? words(before, false)
  : [...words(before, false), ...words(profile.taglineHighlight, true), ...words(after, false)];

const svg = await satori(
  el('div', {
    style: {
      width: 1200, height: 630, display: 'flex', flexDirection: 'column',
      background: ground, color: ink, padding: '64px 80px',
      fontFamily: 'Archivo, ArchivoExt',
    },
  },
    el('div', {
      style: {
        display: 'flex', justifyContent: 'space-between', paddingBottom: 20,
        borderBottom: `2px solid ${ink}`, fontFamily: 'Plex Mono, Plex MonoExt', fontSize: 22, color: muted,
      },
    },
      el('div', { style: { display: 'flex' } }, text(`${profile.title} · ${profile.company.name}`)),
      el('div', { style: { display: 'flex', color: accent } }, text('samler.cz')),
    ),
    el('div', { style: { display: 'flex', flex: 1, gap: 56, alignItems: 'flex-end', marginTop: 40 } },
      el('div', { style: { display: 'flex', flexDirection: 'column', flex: 1 } },
        el('div', { style: { display: 'flex', fontSize: 104, fontWeight: 800, letterSpacing: -4, lineHeight: 0.95 } }, text(profile.name)),
        el('div', { style: { display: 'flex', flexWrap: 'wrap', fontSize: 36, fontWeight: 500, marginTop: 30, lineHeight: 1.2, maxWidth: 640 } },
          // Satori wraps flex children, not text runs, so each word is its own child.
          ...taglineWords.map(({ word, hl }) =>
            el('span', { style: { marginRight: 9, color: hl ? accent : ink } }, text(word))),
        ),
      ),
      el('img', { src: photoUri, width: 340, height: 400, style: { objectFit: 'cover' } }),
    ),
  ),
  { width: 1200, height: 630, fonts },
);

await sharp(Buffer.from(svg)).png().toFile(p('public/og.png'));

console.log('generated: public/favicon.ico, public/apple-touch-icon.png, public/og.png');
