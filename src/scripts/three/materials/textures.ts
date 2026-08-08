import { CanvasTexture, SRGBColorSpace, type Texture } from 'three';

/**
 * Texturas dibujadas en un canvas al vuelo.
 *
 * Cero peticiones de red, cero ficheros en el repo y cada una pesa lo que
 * ocupa en memoria y nada mas. Bajarse un PNG de 200 KB para pintar una
 * rodaja de lima de 30 pixeles en pantalla no tiene ningun sentido.
 */

function createCanvas(
  size: number,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  return ctx ? { canvas, ctx } : null;
}

function finish(canvas: HTMLCanvasElement): Texture {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/** Rodaja de citrico: corteza, gajos y pulpa. Vista de frente. */
export function createCitrusTexture(color: string): Texture | null {
  const made = createCanvas(128);
  if (!made) return null;
  const { canvas, ctx } = made;
  const c = 64;

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';

  ctx.globalAlpha = 0.9;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(c, c, 56, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(c, c, 45, 0, Math.PI * 2);
  ctx.stroke();

  // Los gajos. Ocho, como casi todas las limas del mundo.
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = 3;
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(c + Math.cos(angle) * 6, c + Math.sin(angle) * 6);
    ctx.lineTo(c + Math.cos(angle) * 43, c + Math.sin(angle) * 43);
    ctx.stroke();
  }

  ctx.globalAlpha = 0.28;
  ctx.beginPath();
  ctx.arc(c, c, 43, 0, Math.PI * 2);
  ctx.fill();

  return finish(canvas);
}

/** Hoja de menta/alfabrega: contorno y nervio central. */
export function createLeafTexture(color: string): Texture | null {
  const made = createCanvas(128);
  if (!made) return null;
  const { canvas, ctx } = made;

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.globalAlpha = 0.32;
  ctx.beginPath();
  ctx.moveTo(64, 8);
  ctx.bezierCurveTo(116, 40, 112, 96, 64, 120);
  ctx.bezierCurveTo(16, 96, 12, 40, 64, 8);
  ctx.fill();

  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.globalAlpha = 0.6;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(64, 14);
  ctx.lineTo(64, 114);
  ctx.stroke();

  // Nervios laterales, tres por lado y ninguno igual que otro.
  for (let i = 0; i < 3; i += 1) {
    const y = 36 + i * 26;
    ctx.beginPath();
    ctx.moveTo(64, y);
    ctx.quadraticCurveTo(84 + i * 3, y + 6, 96 - i * 6, y + 20);
    ctx.moveTo(64, y);
    ctx.quadraticCurveTo(44 - i * 3, y + 6, 32 + i * 6, y + 20);
    ctx.stroke();
  }

  return finish(canvas);
}

/** Punto redondo y difuminado para las particulas. */
export function createSparkTexture(): Texture | null {
  const made = createCanvas(64);
  if (!made) return null;
  const { canvas, ctx } = made;

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.35, 'rgba(255,255,255,0.5)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  return finish(canvas);
}
