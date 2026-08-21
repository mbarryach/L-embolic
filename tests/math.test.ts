import { describe, expect, it } from 'vitest';
import { clamp, damp, lerp, progressBetween } from '../src/scripts/utils/math';

describe('clamp', () => {
  it('deja pasar lo que ya esta dentro del rango', () => {
    expect(clamp(0.5, 0, 1)).toBe(0.5);
  });

  it('recorta por los dos lados', () => {
    expect(clamp(-3, 0, 1)).toBe(0);
    expect(clamp(9, 0, 1)).toBe(1);
  });
});

describe('lerp', () => {
  it('devuelve los extremos tal cual', () => {
    expect(lerp(10, 20, 0)).toBe(10);
    expect(lerp(10, 20, 1)).toBe(20);
  });

  it('interpola por el medio', () => {
    expect(lerp(0, 8, 0.25)).toBe(2);
  });
});

describe('damp', () => {
  it('se acerca al destino sin pasarse', () => {
    const result = damp(0, 100, 5, 1 / 60);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(100);
  });

  it('avanza lo mismo en el mismo tiempo aunque cambien los FPS', () => {
    // Este es el motivo de que damp exista: a 30 fps un paso, a 60 dos
    // pasos, y el resultado tiene que acabar practicamente igual.
    const slow = damp(0, 1, 6, 1 / 30);

    let fast = 0;
    fast = damp(fast, 1, 6, 1 / 60);
    fast = damp(fast, 1, 6, 1 / 60);

    expect(Math.abs(slow - fast)).toBeLessThan(0.0001);
  });

  it('con delta cero no se mueve', () => {
    expect(damp(3, 99, 5, 0)).toBe(3);
  });
});

describe('progressBetween', () => {
  it('da 0 antes del tramo y 1 despues', () => {
    expect(progressBetween(0.1, 0.3, 0.7)).toBe(0);
    expect(progressBetween(0.9, 0.3, 0.7)).toBe(1);
  });

  it('da la mitad justo en el medio', () => {
    expect(progressBetween(0.5, 0.3, 0.7)).toBeCloseTo(0.5, 5);
  });

  it('aguanta un tramo de longitud cero sin dividir por cero', () => {
    expect(progressBetween(0.4, 0.5, 0.5)).toBe(0);
    expect(progressBetween(0.6, 0.5, 0.5)).toBe(1);
  });

  it('los tramos de la escena 3D no se solapan mal', () => {
    // spread, exit y gather son los tres que mueven la escena. Si alguien
    // toca los limites, esto avisa de que se pisan antes de tiempo.
    const spread = (p: number) => progressBetween(p, 0.08, 0.6);
    const exit = (p: number) => progressBetween(p, 0.76, 0.97);
    const gather = (p: number) => progressBetween(p, 0.86, 1);

    expect(spread(0)).toBe(0);
    expect(spread(0.7)).toBe(1);
    expect(exit(0.7)).toBe(0);
    expect(gather(0.8)).toBe(0);
    expect(gather(1)).toBe(1);
  });
});
