import { describe, expect, it } from 'vitest';
import { qualityFor } from '../src/scripts/utils/device';
import type { DeviceTier } from '../src/scripts/types';

const TIERS: DeviceTier[] = ['low', 'mid', 'high'];

describe('perfiles de calidad', () => {
  it('cada gama se conoce a si misma', () => {
    for (const tier of TIERS) {
      expect(qualityFor(tier).tier).toBe(tier);
    }
  });

  it('a mas gama, mas trabajo — nunca al reves', () => {
    // Si alguien toca los numeros y deja un movil pintando mas particulas
    // que un sobremesa, este test se entera antes que el usuario.
    const [low, mid, high] = TIERS.map(qualityFor);
    if (!low || !mid || !high) throw new Error('faltan perfiles');

    for (const key of ['particleCount', 'iceCount', 'citrusCount', 'leafCount'] as const) {
      expect(low[key]).toBeLessThanOrEqual(mid[key]);
      expect(mid[key]).toBeLessThanOrEqual(high[key]);
    }
    expect(low.maxPixelRatio).toBeLessThanOrEqual(mid.maxPixelRatio);
    expect(mid.maxPixelRatio).toBeLessThanOrEqual(high.maxPixelRatio);
  });

  it('el pixel ratio nunca pasa de 2', () => {
    // Pintar a 3x es pintar nueve veces mas pixeles para nada.
    for (const tier of TIERS) {
      expect(qualityFor(tier).maxPixelRatio).toBeLessThanOrEqual(2);
    }
  });

  it('la gama baja se ahorra las botellas y el antialias', () => {
    const low = qualityFor('low');
    expect(low.bottles).toBe(false);
    expect(low.antialias).toBe(false);
  });

  it('ninguna gama se queda sin escena', () => {
    for (const tier of TIERS) {
      const quality = qualityFor(tier);
      expect(quality.particleCount).toBeGreaterThan(0);
      expect(quality.iceCount).toBeGreaterThan(0);
    }
  });
});
