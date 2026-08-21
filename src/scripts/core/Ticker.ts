import gsap from 'gsap';

export type TickHandler = (delta: number, elapsed: number) => void;

/**
 * UN solo bucle en toda la pagina. Y es el de GSAP.
 *
 * GSAP ya tiene su requestAnimationFrame corriendo si o si, asi que abrir
 * otro para Three (y un tercero para Lenis) seria pagar tres veces por lo
 * mismo y encima desincronizado. Todo el mundo se engancha aqui.
 */
export class Ticker {
  private readonly handlers = new Set<TickHandler>();
  private elapsed = 0;
  private running = false;
  private detachVisibility: (() => void) | null = null;

  private readonly tick = (_time: number, deltaMs: number): void => {
    // GSAP da el delta en milisegundos; lo capamos porque al volver de una
    // pestaña en segundo plano llega un salto enorme y todo pega un brinco.
    const delta = Math.min(deltaMs, 50) / 1000;
    this.elapsed += delta;
    for (const handler of this.handlers) handler(delta, this.elapsed);
  };

  private readonly onVisibilityChange = (): void => {
    if (document.hidden) this.pause();
    else this.resume();
  };

  start(): void {
    if (this.running) return;
    this.running = true;
    // Sin lag smoothing: con scroll suave por medio, GSAP "corrigiendo"
    // frames perdidos hace que la camara pegue tirones.
    gsap.ticker.lagSmoothing(0);
    gsap.ticker.add(this.tick);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.detachVisibility = () => {
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
    };
  }

  add(handler: TickHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  /** Pestaña oculta = cero trabajo. Ni render, ni fisicas, ni nada. */
  pause(): void {
    if (!this.running) return;
    gsap.ticker.remove(this.tick);
    this.running = false;
  }

  resume(): void {
    if (this.running) return;
    gsap.ticker.add(this.tick);
    this.running = true;
  }

  destroy(): void {
    gsap.ticker.remove(this.tick);
    this.detachVisibility?.();
    this.detachVisibility = null;
    this.handlers.clear();
    this.running = false;
  }
}
