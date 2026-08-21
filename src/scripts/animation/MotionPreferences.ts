import type { MotionLevel } from '../types';

const QUERY = '(prefers-reduced-motion: reduce)';

type Listener = (level: MotionLevel) => void;

/**
 * Vigila si la persona ha pedido menos movimiento. Y lo vigila en vivo:
 * hay gente que lo activa a mitad de sesion porque la web le esta dando
 * mareos, y ahi es justo cuando tiene que funcionar.
 */
export class MotionPreferences {
  private readonly media: MediaQueryList | null;
  private readonly listeners = new Set<Listener>();

  constructor() {
    this.media = typeof window.matchMedia === 'function' ? window.matchMedia(QUERY) : null;
    this.media?.addEventListener('change', this.handleChange);
    this.publish();
  }

  get level(): MotionLevel {
    return this.media?.matches ? 'reduced' : 'full';
  }

  get isReduced(): boolean {
    return this.level === 'reduced';
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private readonly handleChange = (): void => {
    this.publish();
    for (const listener of this.listeners) listener(this.level);
  };

  /** Deja el nivel en el <html> para que el CSS pueda leerlo tambien. */
  private publish(): void {
    document.documentElement.dataset.motion = this.level;
  }

  destroy(): void {
    this.media?.removeEventListener('change', this.handleChange);
    this.listeners.clear();
  }
}
