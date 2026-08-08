import type { AppEvents, ViewportSize } from '../types';
import type { EventBus } from './EventBus';
import { on, setCssVar } from '../utils/dom';

const RESIZE_DEBOUNCE_MS = 140;

/**
 * Fuente unica de verdad para el tamaño de la ventana. Todo el mundo
 * pregunta aqui en vez de llamar a innerWidth cada frame, que eso obliga
 * al navegador a recalcular el layout una y otra vez.
 */
export class Viewport {
  private current: ViewportSize;
  private timer: number | null = null;
  private readonly detachers: (() => void)[] = [];

  constructor(private readonly bus: EventBus<AppEvents>) {
    this.current = Viewport.measure();
    this.publishUnits();

    this.detachers.push(on(window, 'resize', this.onResize, { passive: true }));
    // En moviles girar el aparato dispara resize tarde y mal, asi que
    // escuchamos tambien el cambio de orientacion.
    this.detachers.push(on(window, 'orientationchange', this.onResize, { passive: true }));
  }

  get size(): ViewportSize {
    return this.current;
  }

  private static measure(): ViewportSize {
    const width = window.innerWidth;
    const height = window.innerHeight;
    return {
      width,
      height,
      aspect: height === 0 ? 1 : width / height,
      pixelRatio: window.devicePixelRatio,
    };
  }

  /**
   * La barra del navegador movil miente sobre 100vh. Donde hay svh dejamos
   * que lo resuelva CSS (es estable y no se recalcula al ocultar la barra);
   * donde no lo hay, apañamos con pixeles.
   */
  private publishUnits(): void {
    if (Viewport.supportsSmallViewportUnits) return;
    setCssVar('--vh', `${this.current.height}px`);
  }

  private static readonly supportsSmallViewportUnits =
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('height', '100svh');

  private readonly onResize = (): void => {
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.timer = null;
      this.current = Viewport.measure();
      this.publishUnits();
      this.bus.emit('viewport:resize', this.current);
    }, RESIZE_DEBOUNCE_MS);
  };

  destroy(): void {
    if (this.timer !== null) window.clearTimeout(this.timer);
    for (const detach of this.detachers) detach();
    this.detachers.length = 0;
  }
}
