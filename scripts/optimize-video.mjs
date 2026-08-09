import { execFile } from 'node:child_process';
import { mkdir, stat, readFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import sharp from 'sharp';

const run = promisify(execFile);

/**
 * Prepara el video de la carta para servirlo por web.
 *
 * El original son 9 MB a 14 Mbps con una marca de agua abajo a la derecha.
 * Tal cual no se puede poner en una pagina, asi que aqui se hacen tres
 * cosas: recortar la marca, quitar el audio (no se oye nunca, va en mute)
 * y reencodear con MUCHOS keyframes.
 *
 * Lo de los keyframes es lo importante y lo menos obvio: el video se
 * recorre con el scroll, o sea que el navegador esta saltando de golpe a
 * un instante cualquiera todo el rato. Si solo hay un keyframe cada dos
 * segundos, cada salto obliga a decodificar desde el anterior y se ve a
 * tirones. Con -g 4 hay uno cada cuatro fotogramas: ocupa mas, pero es lo
 * que hace que el scrub vaya suave.
 *
 *   npm run assets:video
 *
 * Necesita ffmpeg en el PATH. El resultado va versionado, asi que para
 * compilar el proyecto no hace falta.
 */

const SOURCE = 'src/assets/video-src/cocktail-morph.mp4';
const OUTPUT_DIR = 'src/assets/video';
const NAME = 'cocktail-morph';

/**
 * El original mide 1288x1608. La marca de agua vive en la franja de abajo,
 * asi que se cortan 128 px de alto; y se recorta el ancho a 1184 para que
 * quede un 4:5 exacto, igual que las fotos de la carta.
 */
const CROP = 'crop=1184:1480:52:0';
const SCALE = 'scale=720:900:flags=lanczos';

/** Un keyframe cada 4 fotogramas. Ver el comentario de arriba. */
const GOP = 4;

async function ensureFfmpeg() {
  try {
    await run('ffmpeg', ['-version']);
  } catch {
    throw new Error('Hace falta ffmpeg en el PATH para regenerar el video.');
  }
}

async function encode() {
  const output = join(OUTPUT_DIR, `${NAME}.mp4`);
  await run('ffmpeg', [
    '-y',
    '-v',
    'error',
    '-i',
    SOURCE,
    '-an',
    '-vf',
    `${CROP},${SCALE}`,
    '-c:v',
    'libx264',
    '-profile:v',
    'high',
    '-pix_fmt',
    'yuv420p',
    '-crf',
    '27',
    '-preset',
    'slow',
    '-g',
    String(GOP),
    '-keyint_min',
    String(GOP),
    '-sc_threshold',
    '0',
    // Mete el indice al principio del fichero para que se pueda empezar a
    // reproducir sin haberlo descargado entero.
    '-movflags',
    '+faststart',
    output,
  ]);
  return output;
}

/** Primer fotograma, para el poster: es lo unico que ve movil y no-JS. */
async function poster() {
  const temporary = join(OUTPUT_DIR, `${NAME}-poster.png`);
  const output = join(OUTPUT_DIR, `${NAME}-poster.webp`);

  await run('ffmpeg', [
    '-y',
    '-v',
    'error',
    '-i',
    SOURCE,
    '-frames:v',
    '1',
    '-vf',
    `${CROP},${SCALE}`,
    temporary,
  ]);

  await sharp(await readFile(temporary))
    .webp({ quality: 72 })
    .toFile(output);
  await unlink(temporary);

  return output;
}

async function main() {
  await ensureFfmpeg();
  await mkdir(OUTPUT_DIR, { recursive: true });

  const video = await encode();
  const still = await poster();

  for (const file of [video, still]) {
    const { size } = await stat(file);
    console.log(`  ${file.padEnd(44)} ${(size / 1024).toFixed(0)} kB`);
  }
}

await main();
