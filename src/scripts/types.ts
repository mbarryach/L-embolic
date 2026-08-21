/** Tipos compartidos. Si un tipo solo lo usa un fichero, se queda en su fichero. */

export type DeviceTier = 'low' | 'mid' | 'high';

export type MotionLevel = 'full' | 'reduced';

/** Cuanto trabajo se permite hacer al equipo que ha abierto la pagina. */
export interface QualityProfile {
  readonly tier: DeviceTier;
  readonly maxPixelRatio: number;
  readonly antialias: boolean;
  readonly particleCount: number;
  readonly iceCount: number;
  readonly citrusCount: number;
  readonly leafCount: number;
  readonly bottles: boolean;
}

export interface ViewportSize {
  readonly width: number;
  readonly height: number;
  readonly aspect: number;
  readonly pixelRatio: number;
}

/** Posicion normalizada del puntero, de -1 a 1 en los dos ejes. */
export interface PointerState {
  readonly x: number;
  readonly y: number;
}

export interface CocktailFocus {
  readonly id: string;
  /** Color ya resuelto del CSS, listo para THREE.Color. */
  readonly accent: string;
}

/** Eventos que viajan por el bus. Todo tipado, nada de strings sueltos. */
export interface AppEvents {
  /** Por donde va el video de fondo, de 0 a 1. */
  'video:fraction': number;
  /** true mientras el hero esta en pantalla. Apaga la escena 3D al salir. */
  'hero:active': boolean;
  'viewport:resize': ViewportSize;
  'scroll:progress': number;
  'pointer:move': PointerState;
  'cocktail:focus': CocktailFocus;
}
