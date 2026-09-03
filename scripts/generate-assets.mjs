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

const font = (file) => readFile(p('node_modules/@fontsource/inter/files', file));
// Both subsets are needed: `latin` has no glyph for the ě in "Matěj". Satori won't
// fall back between fonts that share a name, so the extended subset is registered
// under its own family and listed as a fallback in `fontFamily`.
const fonts = await Promise.all(
  [400, 600, 700].flatMap((weight) => [
    font(`inter-latin-${weight}-normal.woff`).then((data) => ({ name: 'Inter', weight, style: 'normal', data })),
    font(`inter-latin-ext-${weight}-normal.woff`).then((data) => ({ name: 'InterExt', weight, style: 'normal', data })),
  ]),
);

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
const photo = await sharp(p('src/assets/headshot.jpg')).resize(420, 420, { fit: 'cover' }).jpeg({ quality: 90 }).toBuffer();
const photoUri = `data:image/jpeg;base64,${photo.toString('base64')}`;

const el = (type, props, ...children) => ({ type, props: { ...props, children: children.flat() } });
const text = (s) => s;

const svg = await satori(
  el('div', {
    style: {
      width: 1200, height: 630, display: 'flex', alignItems: 'center',
      background: '#0b0b10', fontFamily: 'Inter, InterExt', padding: '0 76px', gap: 64,
      borderBottom: '10px solid #6b8ff5',
    },
  },
    el('div', { style: { display: 'flex', flexDirection: 'column', flex: 1 } },
      el('div', { style: { display: 'flex', fontSize: 68, fontWeight: 700, color: '#ffffff', letterSpacing: -1.5 } }, text(profile.name)),
      el('div', { style: { display: 'flex', fontSize: 29, color: '#8990a6', marginTop: 10 } },
        text(`${profile.title} · ${profile.company.name}`)),
      el('div', {
        style: {
          display: 'flex', fontSize: 33, color: '#dde1eb', marginTop: 30,
          lineHeight: 1.35, maxWidth: 640,
        },
      }, text(profile.tagline)),
      el('div', { style: { display: 'flex', fontSize: 24, color: '#6b8ff5', marginTop: 34, fontWeight: 600 } },
        text('samler.cz')),
    ),
    el('img', {
      src: photoUri, width: 340, height: 340,
      style: { borderRadius: 999, border: '4px solid rgba(255,255,255,0.14)', objectFit: 'cover' },
    }),
  ),
  { width: 1200, height: 630, fonts },
);

await sharp(Buffer.from(svg)).png().toFile(p('public/og.png'));

console.log('generated: public/favicon.ico, public/apple-touch-icon.png, public/og.png');
