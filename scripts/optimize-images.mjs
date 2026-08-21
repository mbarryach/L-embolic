import { readdir, mkdir, writeFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import sharp from 'sharp';

/**
 * Cocina las fotos de la carta.
 *
 * Los originales son PNG de 2 MB cada uno. Servir eso tal cual seria un
 * crimen, asi que de cada foto salen tres anchos en AVIF y WebP y el
 * navegador se lleva el que le convenga.
 *
 * Solo hay que ejecutarlo cuando se añade o se cambia una foto:
 *
 *   npm run assets:images
 *
 * Los resultados se guardan en el repo, asi que para hacer `npm run build`
 * no hace falta ni tener sharp instalado.
 */

const SOURCE_DIR = 'src/assets/photos-src';
const OUTPUT_DIR = 'src/assets/photos';
const PUBLIC_DIR = 'public';

/** Anchos que sirve el srcset. El mayor cubre pantallas retina. */
const WIDTHS = [420, 700, 1040];

const FORMATS = [
  { ext: 'avif', options: { quality: 52, effort: 6 } },
  { ext: 'webp', options: { quality: 76, effort: 5 } },
];

/** Foto que se usa para la tarjeta de redes sociales. */
const SOCIAL_SOURCE = 'dry-basil.png';

async function optimize(file) {
  const name = basename(file, extname(file));
  const input = join(SOURCE_DIR, file);
  const results = [];

  for (const width of WIDTHS) {
    for (const { ext, options } of FORMATS) {
      const output = join(OUTPUT_DIR, `${name}-${width}.${ext}`);
      const info = await sharp(input)
        .resize({ width, withoutEnlargement: true })
        .toFormat(ext, options)
        .toFile(output);
      results.push({ output, bytes: info.size });
    }
  }

  return { name, results };
}

/**
 * La imagen de OpenGraph tiene que ser 1200x630 y en PNG o JPEG — muchos
 * rastreadores todavia no tragan AVIF ni WebP. Se recorta de una de las
 * fotos en vez de inventarse un montaje aparte.
 */
async function buildSocialCard() {
  const output = join(PUBLIC_DIR, 'og-image.png');
  const info = await sharp(join(SOURCE_DIR, SOCIAL_SOURCE))
    .resize({ width: 1200, height: 630, fit: 'cover', position: 'attention' })
    .png({ quality: 82, compressionLevel: 9 })
    .toFile(output);
  return { output, bytes: info.size };
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  await mkdir(PUBLIC_DIR, { recursive: true });

  const files = (await readdir(SOURCE_DIR)).filter((file) => /\.(png|jpe?g)$/i.test(file));
  if (files.length === 0) {
    console.warn(`[imagenes] No hay nada que optimizar en ${SOURCE_DIR}`);
    return;
  }

  let total = 0;
  const manifest = [];

  for (const file of files) {
    const { name, results } = await optimize(file);
    const bytes = results.reduce((sum, item) => sum + item.bytes, 0);
    total += bytes;
    manifest.push(name);
    console.log(`  ${name.padEnd(16)} ${results.length} variantes  ${kb(bytes)}`);
  }

  const social = await buildSocialCard();
  total += social.bytes;
  console.log(`  ${'og-image'.padEnd(16)} 1 variante   ${kb(social.bytes)}`);

  // Deja constancia de que hay disponible, para no adivinar desde el HTML.
  await writeFile(
    join(OUTPUT_DIR, 'manifest.json'),
    `${JSON.stringify({ widths: WIDTHS, photos: manifest.sort() }, null, 2)}\n`,
    'utf8',
  );

  console.log(`\n  Total generado: ${kb(total)}\n`);
}

function kb(bytes) {
  return `${(bytes / 1024).toFixed(0)} kB`;
}

await main();
