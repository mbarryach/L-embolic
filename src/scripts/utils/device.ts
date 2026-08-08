import type { DeviceTier, QualityProfile } from '../types';

interface NavigatorWithMemory extends Navigator {
  readonly deviceMemory?: number;
}

/** true si el navegador es capaz de darnos un contexto WebGL sin morir. */
export function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export function isTouchPrimary(): boolean {
  return window.matchMedia('(pointer: coarse)').matches;
}

/**
 * Adivina cuanta caña le podemos meter al dispositivo. No es exacto —
 * nadie te dice la GPU de verdad — pero con nucleos, memoria y tipo de
 * puntero se acierta lo suficiente para no freir un movil de hace 5 años.
 */
export function detectTier(): DeviceTier {
  const nav = navigator as NavigatorWithMemory;
  const cores = nav.hardwareConcurrency;
  // deviceMemory solo lo dan los navegadores basados en Chromium. Si no
  // esta, damos por hecho una maquina del monton y a seguir.
  const memory = nav.deviceMemory ?? 4;
  const coarse = isTouchPrimary();
  const smallScreen = window.matchMedia('(max-width: 820px)').matches;

  if (cores <= 4 || memory <= 2) return 'low';
  if (coarse || smallScreen || cores <= 6) return 'mid';
  return 'high';
}

const PROFILES: Record<DeviceTier, QualityProfile> = {
  low: {
    tier: 'low',
    maxPixelRatio: 1,
    antialias: false,
    particleCount: 90,
    iceCount: 6,
    citrusCount: 3,
    leafCount: 4,
    bottles: false,
  },
  mid: {
    tier: 'mid',
    maxPixelRatio: 1.6,
    antialias: false,
    particleCount: 180,
    iceCount: 10,
    citrusCount: 5,
    leafCount: 7,
    bottles: true,
  },
  high: {
    tier: 'high',
    maxPixelRatio: 2,
    antialias: true,
    particleCount: 320,
    iceCount: 16,
    citrusCount: 8,
    leafCount: 11,
    bottles: true,
  },
};

export function qualityFor(tier: DeviceTier): QualityProfile {
  return PROFILES[tier];
}
