import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import type { AppEvents, MotionLevel } from '../types';
import type { EventBus } from '../core/EventBus';
import type { Ticker } from '../core/Ticker';
import type { MotionPreferences } from './MotionPreferences';
import { isTouchPrimary } from '../utils/device';
import { setCssVar } from '../utils/dom';

gsap.registerPlugin(ScrollTrigger);

export interface ScrollManagerOptions {
  readonly bus: EventBus<AppEvents>;
  readonly ticker: Ticker;
  readonly motion: MotionPreferences;
}

/**
 * Manda sobre todo lo que tenga que ver con el scroll: el suavizado, el
 * progreso global y el registro de ScrollTrigger. El resto de modulos
 * piden aqui en vez de montarse su propio invento.
 */
export class ScrollManager {
  private lenis: Lenis | null = null;
  private readonly bus: EventBus<AppEvents>;
  private readonly ticker: Ticker;
  private masterTrigger: ScrollTrigger | null = null;
  private detachTick: (() => void) | null = null;
  private currentProgress = 0;

  constructor({ bus, ticker, motion }: ScrollManagerOptions) {
    this.bus = bus;
    this.ticker = ticker;

    // Lenis solo donde aporta: raton y movimiento normal. En tactil el
    // scroll nativo del sistema ya va fino y meterse por medio solo
    // consigue que el dedo se sienta raro. Con reduced motion, ni tocarlo.
    if (!motion.isReduced && !isTouchPrimary()) {
      this.enableSmoothScroll();
    }

    this.createProgressTracker();
  }

  private enableSmoothScroll(): void {
    this.lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
      autoRaf: false,
    });

    // Nada de un RAF aparte: Lenis va colgado del mismo tick que todo lo
    // demas. Un solo bucle, como manda el manual.
    this.detachTick = this.ticker.add((_delta, elapsed) => {
      this.lenis?.raf(elapsed * 1000);
    });

    // ScrollTrigger tiene que enterarse de cada movimiento de Lenis; si no,
    // el scroll va por un lado y las animaciones por otro.
    this.lenis.on('scroll', () => {
      ScrollTrigger.update();
    });
    document.documentElement.dataset.lenis = 'on';
  }

  /**
   * Progreso 0..1 de la pagina entera. Es lo que mueve la camara del canvas.
   *
   * Ojo con esto: NO se puede usar `trigger: body` con `end: 'bottom bottom'`.
   * La carta se pinea y eso mete 3000 px de relleno DESPUES de que este
   * trigger se haya creado, asi que se queda midiendo una pagina que ya no
   * existe y el progreso llega a 1 a media pagina. Midiendo el scroll maximo
   * con una funcion, se recalcula en cada refresh y siempre cuadra.
   *
   * El refreshPriority negativo lo deja recalcularse el ultimo, cuando los
   * pines ya han dicho cuanto ocupan.
   */
  private createProgressTracker(): void {
    this.masterTrigger = ScrollTrigger.create({
      start: 0,
      end: () => ScrollTrigger.maxScroll(window),
      invalidateOnRefresh: true,
      refreshPriority: -1,
      onUpdate: (self) => {
        this.currentProgress = self.progress;
        setCssVar('--scroll-progress', self.progress.toFixed(4));
        this.bus.emit('scroll:progress', self.progress);
      },
    });
  }

  get progress(): number {
    return this.currentProgress;
  }

  /** Salto a un ancla respetando quien manda sobre el scroll ahora mismo. */
  scrollTo(target: string | HTMLElement, offset = 0): void {
    if (this.lenis) {
      this.lenis.scrollTo(target, { offset });
      return;
    }
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /** Se llama cuando aparece o desaparece contenido (menu movil, resize). */
  refresh(): void {
    ScrollTrigger.refresh();
  }

  /**
   * Alguien ha activado "reducir movimiento" con la pagina ya abierta.
   *
   * Normalmente eso pasa porque la web le esta sentando mal, asi que lo
   * menos que puede hacer es quitarse el scroll suave de encima en el acto
   * en vez de esperar a que recargue.
   */
  applyMotion(level: MotionLevel): void {
    if (level !== 'reduced' || !this.lenis) return;
    this.detachTick?.();
    this.detachTick = null;
    this.lenis.destroy();
    this.lenis = null;
    delete document.documentElement.dataset.lenis;
    ScrollTrigger.refresh();
  }

  stop(): void {
    this.lenis?.stop();
  }

  start(): void {
    this.lenis?.start();
  }

  destroy(): void {
    this.masterTrigger?.kill();
    this.masterTrigger = null;
    this.detachTick?.();
    this.detachTick = null;
    this.lenis?.destroy();
    this.lenis = null;
    delete document.documentElement.dataset.lenis;
  }
}
