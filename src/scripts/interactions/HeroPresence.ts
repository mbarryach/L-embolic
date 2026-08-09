import type { AppEvents } from '../types';
import type { EventBus } from '../core/EventBus';
import { query } from '../utils/dom';

/**
 * Vigila si el hero sigue en pantalla.
 *
 * Desde que el video hace de fondo, la escena 3D solo tiene sentido en la
 * primera pantalla: mas abajo queda tapada y estaria calentando la GPU para
 * que no la vea nadie. Esto marca el body y avisa por el bus para que el
 * renderer se pare y el CSS funda el canvas.
 *
 * Va con IntersectionObserver y no con un ScrollTrigger a proposito: la
 * pregunta es literalmente "¿esto se ve?", no depende de medir la pagina, y
 * asi tampoco importa el orden en que se refresquen los pines.
 */
export class HeroPresence {
  private observer: IntersectionObserver | null = null;

  constructor(bus: EventBus<AppEvents>) {
    const hero = query('.hero');
    if (!hero) return;

    const publish = (active: boolean): void => {
      const next = active ? 'in' : 'out';
      if (document.body.dataset.hero === next) return;
      document.body.dataset.hero = next;
      bus.emit('hero:active', active);
    };

    publish(true);

    if (typeof IntersectionObserver === 'undefined') return;

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) publish(entry.isIntersecting);
      },
      // Un poco de margen: apagarlo justo en el borde se nota como un corte
      // cuando alguien sube y baja despacio por el limite del hero.
      { rootMargin: '10% 0px 0px 0px', threshold: 0 },
    );
    this.observer.observe(hero);
  }

  destroy(): void {
    this.observer?.disconnect();
    this.observer = null;
    delete document.body.dataset.hero;
  }
}
