export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

export function lerp(from: number, to: number, alpha: number): number {
  return from + (to - from) * alpha;
}

/**
 * Interpolacion que no depende de los FPS. Si usas lerp con un alpha fijo
 * dentro del RAF, a 144 Hz va el triple de rapido que a 60 y no se nota
 * hasta que alguien lo prueba en un portatil gaming y te lo dice.
 */
export function damp(from: number, to: number, smoothing: number, delta: number): number {
  return lerp(from, to, 1 - Math.exp(-smoothing * delta));
}

/** Progreso 0..1 dentro de un tramo, recortado en los extremos. */
export function progressBetween(value: number, start: number, end: number): number {
  if (end === start) return value >= end ? 1 : 0;
  return clamp((value - start) / (end - start), 0, 1);
}
