/**
 * Los mismos tokens de movimiento que hay en CSS, pero en TypeScript.
 * Dos sitios, un solo criterio: si cambia el ritmo de la pagina, cambia
 * aqui y en tokens.css, y no en cuarenta tweens sueltos.
 *
 * Tres duraciones y dos curvas. Ni una mas. Cuando una web usa treinta
 * easings distintos se nota, y no para bien.
 */
export const DURATION = {
  fast: 0.18,
  medium: 0.42,
  slow: 0.9,
} as const;

export const EASE = {
  standard: 'power2.out',
  emphasis: 'expo.out',
} as const;

/** Retardo entre hermanos cuando entran en cadena. */
export const STAGGER = {
  tight: 0.06,
  loose: 0.12,
} as const;
