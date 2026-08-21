import { ACESFilmicToneMapping, SRGBColorSpace, WebGLRenderer } from 'three';
import type { QualityProfile, ViewportSize } from '../types';

/**
 * El renderer, con la correa corta.
 *
 * Lo importante de aqui es el pixel ratio. Un movil moderno declara un DPR
 * de 3 y pintar a 3x es pintar NUEVE veces mas pixeles que a 1x, para una
 * diferencia que no ve nadie. Se capa segun la gama del aparato y ya.
 */
export function createRenderer(
  canvas: HTMLCanvasElement,
  size: ViewportSize,
  quality: QualityProfile,
): WebGLRenderer {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: quality.antialias,
    alpha: true,
    powerPreference: 'high-performance',
    // No hacemos capturas del canvas, asi que el navegador puede tirar el
    // buffer despues de pintar en vez de guardarlo por si acaso.
    preserveDrawingBuffer: false,
    stencil: false,
    depth: true,
  });

  renderer.setSize(size.width, size.height, false);
  renderer.setPixelRatio(Math.min(size.pixelRatio, quality.maxPixelRatio));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  // Sin sombras. Las que se ven son pintadas en los shaders y en el CSS,
  // que salen igual de bien y no cuestan un depth pass entero.
  renderer.shadowMap.enabled = false;

  return renderer;
}

export function resizeRenderer(
  renderer: WebGLRenderer,
  size: ViewportSize,
  quality: QualityProfile,
): void {
  renderer.setPixelRatio(Math.min(size.pixelRatio, quality.maxPixelRatio));
  renderer.setSize(size.width, size.height, false);
}
